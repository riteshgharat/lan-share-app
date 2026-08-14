import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import os from "os";
import path from "path";
import { io as ioClient } from "socket.io-client";
import { buildManifest } from "../src/manifest.js";
import { startSender } from "../src/sender.js";

const CODE = "654321";

function setupFixture() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "lanshare-portal-"));
  fs.writeFileSync(path.join(dir, "hello.txt"), "hello world\n");
  return dir;
}

let fixture;
let sender;
let baseUrl;

before(async () => {
  fixture = setupFixture();
  const manifest = buildManifest(["hello.txt"], { cwd: fixture });
  sender = await startSender({ manifest, code: CODE, port: 0 });
  baseUrl = `http://127.0.0.1:${sender.port}`;
});

after(() => sender.close());

test("manifest reports allowUpload by default", async () => {
  const res = await fetch(`${baseUrl}/api/manifest?code=${CODE}`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.allowUpload, true);
});

test("upload endpoint accepts a file (uploads enabled)", async () => {
  const form = new FormData();
  form.append("file", new Blob(["abc"], { type: "text/plain" }), "note.txt");
  const res = await fetch(`${baseUrl}/api/upload?code=${CODE}`, { method: "POST", body: form });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.match(data.file.name, /note\.txt$/);
});

test("upload requires the code", async () => {
  const form = new FormData();
  form.append("file", new Blob(["x"], { type: "text/plain" }), "nope.txt");
  const res = await fetch(`${baseUrl}/api/upload`, { method: "POST", body: form });
  assert.equal(res.status, 401);
});

test("files endpoint lists uploaded files and allowUpload", async () => {
  const res = await fetch(`${baseUrl}/api/files?code=${CODE}`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.allowUpload, true);
  assert.ok(data.files.some((f) => /note\.txt$/.test(f.name)));
});

test("downloads an uploaded file", async () => {
  const res = await fetch(`${baseUrl}/api/files?code=${CODE}`);
  const { files } = await res.json();
  const note = files.find((f) => /note\.txt$/.test(f.name));
  assert.ok(note);
  const dl = await fetch(`${baseUrl}/api/download/${encodeURIComponent(note.name)}?code=${CODE}`);
  assert.equal(dl.status, 200);
  assert.equal(await dl.text(), "abc");
});

test("delete requires code and removes uploaded file", async () => {
  const form = new FormData();
  form.append("file", new Blob(["tmp"], { type: "text/plain" }), "scratch.txt");
  const up = await fetch(`${baseUrl}/api/upload?code=${CODE}`, { method: "POST", body: form });
  const { file } = await up.json();

  const deny = await fetch(`${baseUrl}/api/files/${encodeURIComponent(file.name)}`, { method: "DELETE" });
  assert.equal(deny.status, 401);

  const ok = await fetch(`${baseUrl}/api/files/${encodeURIComponent(file.name)}?code=${CODE}`, {
    method: "DELETE",
  });
  assert.equal(ok.status, 200);
});

test("serves a web page at /", async () => {
  const res = await fetch(baseUrl);
  assert.equal(res.status, 200);
  const body = await res.text();
  assert.match(body, /lan-share|LAN SHARE/i);
});

test("socket.io chat works with the code and rejects wrong codes", async () => {
  const good = ioClient(baseUrl, { auth: { code: CODE }, transports: ["websocket"] });
  const received = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout waiting for message")), 5000);
    good.on("connect", () => {
      good.on("message", (msg) => {
        clearTimeout(timer);
        resolve(msg.message);
      });
      good.emit("message", { nickname: "tester", message: "ping", timestamp: new Date().toISOString() });
    });
    good.on("connect_error", reject);
  });

  const goodCount = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout waiting for userCount")), 5000);
    good.on("userCount", (n) => {
      clearTimeout(timer);
      assert.ok(Number(n) >= 1);
      resolve(n);
    });
  });

  const bad = ioClient(baseUrl, { auth: { code: "000000" }, transports: ["websocket"] });
  let badErr = null;
  await new Promise((resolve) => {
    bad.on("connect_error", (err) => {
      badErr = err;
      resolve();
    });
    bad.on("connect", () => {
      badErr = null;
      resolve();
    });
  });

  assert.equal(await received, "ping");
  await goodCount;
  assert.ok(badErr, "wrong code should be rejected");
  good.close();
  bad.close();
});

test("readonly sender disables uploads", async () => {
  const m = buildManifest(["hello.txt"], { cwd: fixture });
  const ro = await startSender({ manifest: m, code: "111111", port: 0, allowUpload: false });
  const base = `http://127.0.0.1:${ro.port}`;

  const manifestRes = await fetch(`${base}/api/manifest?code=111111`);
  assert.equal((await manifestRes.json()).allowUpload, false);

  const form = new FormData();
  form.append("file", new Blob(["x"], { type: "text/plain" }), "blocked.txt");
  const up = await fetch(`${base}/api/upload?code=111111`, { method: "POST", body: form });
  assert.equal(up.status, 403);

  await ro.close();
});