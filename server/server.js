import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// Add this near the top of the file, after creating the io instance
let connectedUsers = new Set();

// Set up uploads directory
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

// Enable CORS
app.use(cors());

// File upload endpoint
app.post("/upload", upload.single("file"), (req, res) => {
  res.json({ file: req.file });
});

// List files endpoint
app.get("/files", (req, res) => {
  fs.readdir(uploadDir, (err, files) => {
    if (err) return res.status(500).json({ error: "Unable to scan files" });
    const fileInfos = files.map((file) => {
      const stats = fs.statSync(path.join(uploadDir, file));
      return {
        name: file,
        size: stats.size,
        type: path.extname(file),
        uploadTime: stats.birthtime,
      };
    });
    res.json(fileInfos);
  });
});

// File download endpoint
app.get("/download/:filename", (req, res) => {
  const filePath = path.join(uploadDir, req.params.filename);
  res.download(filePath);
});

// Delete file endpoint
app.delete("/files/:filename", (req, res) => {
  const filePath = path.join(uploadDir, req.params.filename);
  fs.unlink(filePath, (err) => {
    if (err) {
      return res.status(500).json({ error: "Unable to delete file" });
    }
    io.emit("fileUpdated"); // Notify all clients about the file change
    res.json({ message: "File deleted successfully" });
  });
});

// Socket.IO for real-time chat
io.on("connection", (socket) => {
  // Add user to connected users
  connectedUsers.add(socket.id);
  
  // Log connected user for debugging
  //console.log(`User connected: ${socket.id}`);
  //console.log(`Total connected users: ${connectedUsers.size}`);

  // Emit updated count to ALL clients
  io.emit("userCount", connectedUsers.size);

  // Handle request for user count
  socket.on("getUserCount", () => {
    socket.emit("userCount", connectedUsers.size);
  });

  socket.on("message", (msg) => {
    io.emit("message", msg);
  });

  socket.on("typing", (user) => {
    socket.broadcast.emit("typing", user);
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    connectedUsers.delete(socket.id);
    //console.log(`User disconnected: ${socket.id}`);
    //console.log(`Total connected users: ${connectedUsers.size}`);
    
    // Emit updated count to ALL clients
    io.emit("userCount", connectedUsers.size);
  });
});

// Start server on all network interfaces
const PORT = 5000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend server running on port ${PORT}`);
});
