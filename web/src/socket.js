import { io } from "socket.io-client";
import { getShareCode } from "./api.js";

let socket = io({ auth: { code: getShareCode() || undefined } });

export function reauthSocket() {
  if (socket) {
    socket.auth = { code: getShareCode() || undefined };
    try {
      socket.disconnect().connect();
    } catch {}
  } else {
    socket = io({ auth: { code: getShareCode() || undefined } });
  }
  return socket;
}

export default socket;