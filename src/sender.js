import express from "express";
import http from "http";
import fs from "fs";
import os from "os";
import path from "path";
import multer from "multer";
import { fileURLToPath } from "url";
import { Server } from "socket.io";
import { buildWebPage } from "./web-page.js";
import { createZipStream } from "./zip.js";
import { sanitizeFilename } from "./format.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIME = {
  ".js": "text/javascript",
  ".css": "text/css",
  ".html": "text/html",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".json": "application/json",
  ".txt": "text/plain",
  ".wasm": "application/wasm",
};

function isAuthed(req, code) {
  const provided =
    req.query.code ||
    req.get("X-Code") ||
    (req.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  return String(provided) === String(code);
}

function resolveWithinRoot(root, relPath) {
  const rel = String(relPath || "").replace(/\\/g, "/");
  if (path.posix.isAbsolute(rel)) return null;
  const normalized = path.posix.normalize(rel);
  if (normalized.startsWith("../")) return null;
  const rootReal = path.resolve(root);
  const abs = path.resolve(rootReal, normalized.split("/").join(path.sep));
  if (abs !== rootReal && !abs.startsWith(rootReal + path.sep)) return null;
  return abs;
}

export async function startSender({
  manifest,
  code,
  port = 0,
  onDownload = () => {},
  allowUpload = true,
  uploadsDir,
  webMode = "auto",
}) {
  let webAssets = {};
  try {
    webAssets = (await import("./web-static.js")).webAssets || {};
  } catch {}

  const app = express();
  const server = http.createServer(app);
  const io = new Server(server, { cors: { origin: "*" } });
  const root = manifest.root;
  const embeddedCount = Object.keys(webAssets).length;
  const diskDist = path.resolve(__dirname, "../web/dist");
  const hasDiskBuild = fs.existsSync(path.join(diskDist, "index.html"));
  const servePortal = embeddedCount > 0 || hasDiskBuild;

  const uploadsRoot = uploadsDir || path.join(os.tmpdir(), `lan-share-uploads-${code || "share"}`);
  fs.mkdirSync(uploadsRoot, { recursive: true });

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsRoot),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${sanitizeFilename(file.originalname)}`),
  });
  const upload = multer({ storage });

  let connectedUsers = new Set();
  io.use((socket, next) => {
    const provided = socket.handshake.auth?.code || socket.handshake.query?.code;
    if (String(provided) === String(code)) next();
    else next(new Error("unauthorized"));
  });

  io.on("connection", (socket) => {
    connectedUsers.add(socket.id);
    io.emit("userCount", connectedUsers.size);

    socket.on("message", (msg) => io.emit("message", msg));
    socket.on("typing", (user) => socket.broadcast.emit("typing", user));
    socket.on("getUserCount", () => socket.emit("userCount", connectedUsers.size));

    socket.on("connect_error", () => {
      connectedUsers.delete(socket.id);
      io.emit("userCount", connectedUsers.size);
    });

    socket.on("disconnect", () => {
      connectedUsers.delete(socket.id);
      io.emit("userCount", connectedUsers.size);
    });
  });

  const requireCode = (req, res, next) => {
    if (!isAuthed(req, code)) return res.status(401).json({ error: "Invalid or missing code" });
    next();
  };

  const requireUpload = (req, res, next) => {
    if (!allowUpload) return res.status(403).json({ error: "Uploads are disabled by the sender" });
    next();
  };

  app.get("/api/manifest", requireCode, (req, res) => {
    res.json({
      code,
      transferId: code,
      totalSize: manifest.totalSize,
      fileCount: manifest.fileCount,
      items: manifest.items,
      tree: manifest.tree,
      allowUpload,
    });
  });

  app.get("/api/complete", requireCode, (req, res) => {
    onDownload({ sessionComplete: true, relPath: "__complete__", sent: 0, total: 0, done: true });
    res.json({ ok: true });
  });

  app.get("/api/file", requireCode, (req, res) => {
    const relPath = String(req.query.path || "");
    const abs = resolveWithinRoot(root, relPath);
    if (!abs) return res.status(400).json({ error: "Invalid path" });
    if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) {
      return res.status(404).json({ error: "File not found" });
    }

    const stat = fs.statSync(abs);
    const total = stat.size;
    const range = req.headers.range;
    let start = 0;
    let end = total - 1;

    if (range) {
      const m = /bytes=(\d*)-(\d*)/.exec(range);
      if (m && (m[1] || m[2])) {
        if (m[1]) start = parseInt(m[1], 10);
        if (m[2]) end = parseInt(m[2], 10);
        if (Number.isNaN(start)) start = Math.max(0, total - end), end = total - 1;
        if (Number.isNaN(end)) end = total - 1;
        if (start >= total || start > end) {
          return res.status(416).set("Content-Range", `bytes */${total}`).end();
        }
      }
    }

    res.status(range ? 206 : 200);
    res.set({
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${sanitizeFilename(path.basename(relPath))}"`,
      "Content-Length": end - start + 1,
      "Accept-Ranges": "bytes",
      ...(range ? { "Content-Range": `bytes ${start}-${end}/${total}` } : {}),
    });

    const stream = fs.createReadStream(abs, { start, end });
    let sent = 0;
    stream.on("data", (chunk) => {
      sent += chunk.length;
      onDownload({ relPath, sent, total: end - start + 1, done: false });
    });
    stream.on("end", () => onDownload({ relPath, sent, total, done: true }));
    stream.on("error", () => res.destroy());
    stream.pipe(res);
  });

  app.get("/api/zip", requireCode, (req, res) => {
    const which = String(req.query.path || "__all__");
    let files;
    let label;
    if (which === "__all__") {
      files = manifest.tree;
      label = `${code}-lan-share-all`;
    } else {
      const item = manifest.items.find((i) => i.relPath === which || i.name === which);
      if (!item || item.type !== "folder") {
        return res.status(404).json({ error: "Folder not found" });
      }
      files = item.files;
      label = item.name;
    }
    if (!files.length) return res.status(404).json({ error: "Folder is empty" });

    res.set({
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${sanitizeFilename(label)}.zip"`,
    });
    const archive = createZipStream(files, root);
    let sent = 0;
    archive.on("data", (chunk) => {
      sent += chunk.length;
      onDownload({ relPath: which, sent, total: null, done: false });
    });
    archive.on("end", () => onDownload({ relPath: which, sent, total: sent, done: true }));
    archive.on("error", () => res.destroy());
    archive.pipe(res);
  });

  app.post("/api/upload", requireCode, requireUpload, upload.single("file"), (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    io.emit("fileUpdated");
    const stats = fs.statSync(req.file.path);
    res.json({ file: { name: req.file.filename, size: stats.size } });
  });

  app.get("/api/files", requireCode, (req, res) => {
    const files = fs
      .readdirSync(uploadsRoot)
      .filter((name) => name !== ".gitkeep")
      .map((name) => {
        const stats = fs.statSync(path.join(uploadsRoot, name));
        return { name, size: stats.size, type: path.extname(name), uploadTime: stats.birthtime };
      });
    res.json({ allowUpload, files });
  });

  app.get("/api/download/:filename", requireCode, (req, res) => {
    const safe = path.basename(req.params.filename).replace(/["\r\n]+/g, "_");
    const filePath = path.join(uploadsRoot, safe);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: "File not found" });
    res.download(filePath, safe);
  });

  app.delete("/api/files/:filename", requireCode, requireUpload, (req, res) => {
    const safe = path.basename(req.params.filename);
    const filePath = path.join(uploadsRoot, safe);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: "File not found" });
    fs.unlinkSync(filePath);
    io.emit("fileUpdated");
    res.json({ message: "File deleted successfully" });
  });

  if (servePortal) {
    const findAsset = (urlPath) => {
      let p = urlPath.split("?")[0];
      if (p === "/") p = "/index.html";
      if (embeddedCount > 0) {
        const asset = webAssets[p];
        return asset ? { content: Buffer.from(asset.data, "base64"), type: asset.type } : null;
      }
      if (hasDiskBuild) {
        const abs = path.join(diskDist, p);
        if (fs.existsSync(abs) && fs.statSync(abs).isFile()) {
          return {
            content: fs.readFileSync(abs),
            type: MIME[path.extname(abs)] || "application/octet-stream",
          };
        }
      }
      return null;
    };

    app.get(/^\/(?!api\/|socket)/, (req, res) => {
      const asset = findAsset(req.path);
      if (asset) {
        res.type(asset.type).send(asset.content);
      } else {
        const index = findAsset("/index.html");
        if (index) return res.type("text/html").send(index.content);
        res.type("html").send(buildWebPage(code));
      }
    });
  } else {
    app.get("/", (req, res) => {
      res.type("html").send(buildWebPage(code));
    });
  }

  server.listen(port, "0.0.0.0");
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.once("listening", () => {
      const actualPort = server.address().port;
      resolve({
        server,
        io,
        port: actualPort,
        url: `http://localhost:${actualPort}`,
        uploadsRoot,
        close: () =>
          new Promise((r) => {
            server.closeAllConnections?.();
            server.close(() => r());
          }),
      });
    });
  });
}

export { MIME };