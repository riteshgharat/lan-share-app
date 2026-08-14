import os from "os";
import net from "net";

export function getLocalIPv4s() {
  const result = [];
  const interfaces = os.networkInterfaces();
  for (const iface of Object.values(interfaces)) {
    for (const details of iface || []) {
      if (details.family === "IPv4" && !details.internal) {
        result.push(details.address);
      }
    }
  }
  return result.length ? result : ["127.0.0.1"];
}

export function getLocalIPv4() {
  return getLocalIPv4s()[0];
}

export function isPortFree(port) {
  return new Promise((resolve) => {
    const tester = net.createServer();
    tester.once("error", () => resolve(false));
    tester.once("listening", () => tester.close(() => resolve(true)));
    tester.listen(port, "0.0.0.0");
  });
}

export async function pickFreePort(preferred = 9876) {
  for (let port = preferred; port < preferred + 100; port++) {
    if (await isPortFree(port)) return port;
  }
  return 0;
}
