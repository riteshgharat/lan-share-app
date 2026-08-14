import React, { useState, useEffect } from "react";
import axios from "axios";
import { apiUrl } from "../api.js";
import socket from "../socket.js";
import Previewer from "../components/Previewer";

function FileSharing() {
  const [manifest, setManifest] = useState(null);
  const [uploads, setUploads] = useState([]);
  const [allowUpload, setAllowUpload] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [previewImage, setPreviewImage] = useState("");

  const refreshUploads = () => {
    axios.get(apiUrl("/api/files")).then((r) => {
      setUploads(r.data.files || []);
      setAllowUpload(r.data.allowUpload);
    });
  };

  useEffect(() => {
    axios
      .get(apiUrl("/api/manifest"))
      .then((r) => {
        setManifest(r.data);
        setAllowUpload(r.data.allowUpload);
      })
      .catch(() => {});
    refreshUploads();
    socket.on("fileUpdated", refreshUploads);
    return () => socket.off("fileUpdated");
  }, []);

  const handleFileChange = (e) => setSelectedFile(e.target.files[0]);

  const handleUpload = () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setUploadProgress(0);
    const formData = new FormData();
    formData.append("file", selectedFile);
    axios
      .post(apiUrl("/api/upload"), formData, {
        onUploadProgress: (p) =>
          setUploadProgress(p.total ? Math.round((p.loaded * 100) / p.total) : 0),
      })
      .then(() => {
        setSelectedFile(null);
        setIsUploading(false);
        refreshUploads();
      })
      .catch((err) => {
        console.error(err);
        setIsUploading(false);
        alert(err.response?.data?.error || "Upload failed");
      });
  };

  const handleShowPreview = (imageUrl) => {
    setPreviewImage(imageUrl);
    setShowPreview(true);
  };

  const fmt = (b) => {
    if (!Number.isFinite(b) || b <= 0) return "0 B";
    const u = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.min(Math.floor(Math.log(b) / Math.log(1024)), u.length - 1);
    const v = b / Math.pow(1024, i);
    return v.toFixed(v >= 100 || i === 0 ? 0 : 1) + " " + u[i];
  };

  return (
    <div className="bg-white p-12 rounded-lg shadow">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">File Sharing</h2>

      {manifest && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-700">📦 Sender's shared files</h3>
            {manifest.items?.length > 0 && (
              <a
                href={apiUrl("/api/zip?path=__all__")}
                download
                className="bg-green-500 text-white px-3 py-1 rounded-lg hover:bg-green-600 transition-colors duration-200 text-sm"
              >
                ⬇ Download all (.zip)
              </a>
            )}
          </div>
          {manifest.items?.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {manifest.items.map((item) => (
                <li key={item.relPath} className="py-2 flex items-center gap-3">
                  <span className="w-5 text-center">
                    {item.type === "folder" ? "📁" : "📄"}
                  </span>
                  <span className="flex-1 truncate text-gray-800">{item.name}</span>
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    {item.type === "folder"
                      ? `${item.fileCount} file(s)`
                      : fmt(item.size)}
                  </span>
                  {item.type === "folder" ? (
                    <a
                      href={apiUrl(`/api/zip?path=${encodeURIComponent(item.relPath)}`)}
                      download
                      className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700"
                    >
                      ⬇ .zip
                    </a>
                  ) : (
                    <a
                      href={apiUrl(`/api/file?path=${encodeURIComponent(item.relPath)}`)}
                      download
                      className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700"
                    >
                      ⬇
                    </a>
                  )}
                  {item.type === "file" && /\.(png|jpe?g|svg|gif|webp)\b/gi.test(item.name) && (
                    <button
                      onClick={() =>
                        handleShowPreview(apiUrl(`/api/file?path=${encodeURIComponent(item.relPath)}`))
                      }
                      className="bg-yellow-500 text-white px-2 py-1 rounded text-xs hover:bg-yellow-600 cursor-pointer"
                    >
                      👁
                    </button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-sm">Nothing shared.</p>
          )}
        </div>
      )}

      {allowUpload && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="font-semibold text-gray-700 mb-3">⬆ Upload back to the sender</h3>
          <div className="flex items-center space-x-4">
            <label
              htmlFor="file-upload"
              className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center"
            >
              Choose File
            </label>
            <input
              id="file-upload"
              type="file"
              onChange={handleFileChange}
              className="hidden"
            />
            <span className="text-gray-600 truncate flex-1">
              {selectedFile ? selectedFile.name : "No file selected"}
            </span>
            <button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className={`px-4 py-2 rounded-lg text-white transition-colors duration-200 cursor-pointer ${
                !selectedFile || isUploading
                  ? "bg-blue-300 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isUploading ? "Uploading..." : "Upload"}
            </button>
          </div>
          {isUploading && (
            <div className="mt-4 bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-200"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          )}
        </div>
      )}

      {uploads.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-y-scroll">
          <div className="grid grid-cols-3 bg-gray-100 p-3 font-semibold text-gray-700">
            <div>Name</div>
            <div>Size</div>
            <div>Actions</div>
          </div>
          <ul>
            {uploads.map((file, index) => (
              <li
                key={file.name}
                className={`grid grid-cols-3 p-3 items-center border-b border-gray-200 ${
                  index % 2 === 0 ? "bg-gray-50" : "bg-white"
                }`}
              >
                <span className="truncate text-gray-800">
                  {file.name.replace(/^\d+-/, "")}
                </span>
                <span className="text-gray-600">{fmt(file.size)}</span>
                <div className="flex space-x-2">
                  <a
                    href={apiUrl(`/api/download/${encodeURIComponent(file.name)}`)}
                    className="bg-green-500 text-white px-3 py-1 rounded-lg hover:bg-green-600 transition-colors duration-200 flex items-center"
                  >
                    Download
                  </a>
                  {allowUpload && (
                    <button
                      onClick={() => {
                        if (confirm("Delete this file?"))
                          axios
                            .delete(apiUrl(`/api/files/${encodeURIComponent(file.name)}`))
                            .then(refreshUploads)
                            .catch((e) => alert(e.response?.data?.error || "Delete failed"));
                      }}
                      className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition-colors duration-200 flex items-center cursor-pointer"
                    >
                      Delete
                    </button>
                  )}
                  {file.name.match(/\.(png|jpe?g|svg|gif|webp)\b/gi) && (
                    <button
                      onClick={() =>
                        handleShowPreview(
                          apiUrl(`/api/download/${encodeURIComponent(file.name)}`)
                        )
                      }
                      className="bg-yellow-500 text-white px-3 py-1 rounded-lg hover:bg-yellow-600 transition-colors duration-200 flex items-center cursor-pointer"
                    >
                      Preview
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {showPreview && (
        <Previewer imageUrl={previewImage} onClose={() => setShowPreview(false)} />
      )}
    </div>
  );
}

export default FileSharing;