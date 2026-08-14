import React, { useState, useEffect } from "react";
import axios from "axios";
import { apiUrl, getShareCode } from "../api.js";

function Home() {
  const [manifest, setManifest] = useState(null);
  const [error, setError] = useState("");
  const code = getShareCode();

  useEffect(() => {
    axios
      .get(apiUrl("/api/manifest"))
      .then((r) => setManifest(r.data))
      .catch(() => setError("Invalid code or sender unreachable."));
  }, []);

  const fmt = (b) => {
    if (!Number.isFinite(b) || b <= 0) return "0 B";
    const u = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.min(Math.floor(Math.log(b) / Math.log(1024)), u.length - 1);
    const v = b / Math.pow(1024, i);
    return v.toFixed(v >= 100 || i === 0 ? 0 : 1) + " " + u[i];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-neutral-800 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">Welcome to LAN Share</h1>
          <p className="text-xl text-gray-300">
            Connected with code{" "}
            <span className="font-mono text-amber-400 tracking-widest">{code}</span>
          </p>
          {manifest && (
            <p className="text-gray-400 mt-2 text-sm">
              📦 {manifest.fileCount} file(s) · {fmt(manifest.totalSize)} shared
              {manifest.allowUpload ? " · ⬆ uploads on" : " · read-only"}
            </p>
          )}
        </div>
      </header>

      <section className="py-16 container mx-auto px-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-5xl text-blue-500 mb-6 text-center">📁</div>
            <h2 className="text-2xl font-bold text-neutral-800 mb-4 text-center">
              File Sharing
            </h2>
            <p className="text-gray-600">
              Browse and download files shared on your LAN. Lightning-fast peer-to-peer
              transfers — no internet required.
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-5xl text-blue-500 mb-6 text-center">💬</div>
            <h2 className="text-2xl font-bold text-neutral-800 mb-4 text-center">
              Real-Time Chat
            </h2>
            <p className="text-gray-600">
              Chat with everyone on the same share. Messages flow only across your local
              network.
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-5xl text-blue-500 mb-6 text-center">📝</div>
            <h2 className="text-2xl font-bold text-neutral-800 mb-4 text-center">
              Text Editor
            </h2>
            <p className="text-gray-600">
              Edit text documents and upload them back to the share with syntax
              highlighting.
            </p>
          </div>
        </div>
      </section>

      {error && <p className="text-center text-red-500 pb-8">{error}</p>}
    </div>
  );
}

export default Home;