import React, { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Home from "./pages/Home";
import FileSharing from "./pages/FileSharing";
import TextEditor from "./pages/TextEditor";
import Chat from "./pages/Chat";
import { getShareCode, setShareCode, apiUrl } from "./api.js";
import { reauthSocket } from "./socket.js";

function CodeGate({ onEnter, error }) {
  const [value, setValue] = useState("");
  return (
    <div className="h-full w-full fixed bg-gray-100 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-10 max-w-sm w-full text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">LAN Share</h1>
        <p className="text-gray-500 text-sm mb-6">
          Enter the 6-digit code shown by the sender to connect.
        </p>
        {error && (
          <p className="bg-red-50 text-red-600 text-sm rounded-lg px-3 py-2 mb-4">
            {error}
          </p>
        )}
        <input
          type="text"
          maxLength="6"
          inputMode="numeric"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onEnter(value)}
          placeholder="512348"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-xl tracking-[0.4em] focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
        />
        <button
          onClick={() => onEnter(value)}
          disabled={!value}
          className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 disabled:opacity-40 cursor-pointer"
        >
          Connect
        </button>
      </div>
    </div>
  );
}

function App() {
  const [code, setCode] = useState(getShareCode());
  const [checking, setChecking] = useState(true);
  const [gateError, setGateError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function validate() {
      if (!code) {
        setChecking(false);
        return;
      }
      try {
        const res = await fetch(apiUrl("/api/manifest"), { cache: "no-store" });
        if (cancelled) return;
        if (res.status === 401) {
          setShareCode("");
          setCode("");
          setGateError(
            "That code is no longer valid. The share may have been restarted — use the new code from the sender."
          );
        }
      } catch {
        // sender unreachable (e.g. restarted on a different port) — prompt for code
        if (cancelled) return;
        setShareCode("");
        setCode("");
        setGateError(
          "Could not reach the sender. If it was restarted, enter the new code shown in its terminal."
        );
      } finally {
        if (!cancelled) setChecking(false);
      }
    }
    validate();
    return () => {
      cancelled = true;
    };
  }, []);

  if (checking) {
    return (
      <div className="h-full w-full fixed bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">Connecting…</p>
      </div>
    );
  }

  if (!code) {
    return (
      <CodeGate
        error={gateError}
        onEnter={(c) => {
          setGateError("");
          setShareCode(c);
          setCode(c);
          reauthSocket();
        }}
      />
    );
  }

  return (
    <div className="flex h-full w-full fixed bg-gray-100 font-sans antialiased">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/file-sharing" element={<FileSharing />} />
          <Route path="/text-editor" element={<TextEditor />} />
          <Route path="/chat" element={<Chat />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;