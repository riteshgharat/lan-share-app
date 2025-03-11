import { spawn, exec } from "child_process";
import os from "os";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const PORT = 9696;

// Manually define __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to get the server's local IPv4 address
function getLocalIPv4() {
  const interfaces = os.networkInterfaces();
  for (const iface of Object.values(interfaces)) {
    for (const details of iface) {
      if (details.family === "IPv4" && !details.internal) {
        return details.address;
      }
    }
  }
  return "127.0.0.1"; // Fallback to localhost
}

// Step 1: Install and Run Server in Background
console.log("📡 Starting Server...");
const serverProcess = spawn("npm", ["run", "istart"], {
  cwd: "server",
  stdio: "inherit",
  shell: true,
});

// Wait a few seconds to ensure the server starts
setTimeout(() => {
  // Get server IP
  const serverIP = getLocalIPv4();
  const backendURL = `http://${serverIP}:5000`;
  const frontendURL = `http://${serverIP}:${PORT}/`;

  // Step 2: Update .env File in Client
  const envPath = path.join(__dirname, "client", ".env");
  const envContent = `VITE_BACKEND_URL=${backendURL}\n`;

  fs.writeFile(envPath, envContent, (err) => {
    if (err) {
      console.error("❌ Failed to update .env:", err);
      return;
    }
    console.log("✅ Updated .env with backend URL!");

    // Step 3: Install and Run Client
    console.log("💻 Starting Client...");
    console.log(`🌐 Application is running at: ${frontendURL}`);

    exec(
      "cd client && npm i && npm run dev",
      { shell: true },
      (error, stdout, stderr) => {
        if (error) {
          console.error("❌ Error starting client:", error);
          return;
        }
        console.log("✅ Client started!");
      }
    );
  });
}, 5000); // Wait 5 seconds to ensure the server starts
