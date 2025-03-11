import React, { useState, useEffect } from "react";
import axios from "axios";
import socket from "../socket.js";

function FileSharing() {
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    fetchFiles();
    socket.on("fileUpdated", fetchFiles);
    return () => socket.off("fileUpdated");
  }, []);

  const fetchFiles = () => {
    axios.get(import.meta.env.VITE_BACKEND_URL + "/files").then((response) => {
      setFiles(response.data);
    });
  };

  const handleFileChange = (e) => setSelectedFile(e.target.files[0]);

  const handleUpload = () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("file", selectedFile);

    axios
      .post(import.meta.env.VITE_BACKEND_URL + "/upload", formData, {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        },
      })
      .then(() => {
        fetchFiles();
        setSelectedFile(null);
        setIsUploading(false);
      })
      .catch((err) => {
        console.error(err);
        setIsUploading(false);
      });
  };

  return (
    <div className="bg-white p-12 rounded-lg shadow">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">
        File Sharing
      </h2>
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center space-x-4">
          <label
            htmlFor="file-upload"
            className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
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

      {files.length > 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 overflow-y-scroll">
          <div className="grid grid-cols-3 bg-gray-100 p-3 font-semibold text-gray-700">
            <div>Name</div>
            <div>Size</div>
            <div>Actions</div>
          </div>
          <ul>
            {files.map((file, index) => (
              <li
                key={file.name}
                className={`grid grid-cols-3 p-3 items-center border-b border-gray-200 ${
                  index % 2 === 0 ? "bg-gray-50" : "bg-white"
                }`}
              >
                <span className="truncate text-gray-800">{file.name}</span>
                <span className="text-gray-600">
                  {(file.size / 1024).toFixed(2)} KB
                </span>
                <div className="flex space-x-2">
                  <a
                    href={`${import.meta.env.VITE_BACKEND_URL}/download/${
                      file.name
                    }`}
                    className="bg-green-500 text-white px-3 py-1 rounded-lg hover:bg-green-600 transition-colors duration-200 flex items-center"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                    Download
                  </a>
                  <button
                    onClick={() => {
                      if (confirm("Do you want to delete this file?"))
                        axios
                          .delete(
                            `${import.meta.env.VITE_BACKEND_URL}/files/${
                              file.name
                            }`
                          )
                          .then(fetchFiles)
                          .catch((error) => {
                            console.error("Error deleting file:", error);
                            alert("Failed to delete file");
                          });
                    }}
                    className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition-colors duration-200 flex items-center cursor-pointer"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-lg border border-gray-200 text-center text-gray-500">
          No files available. Upload a file to get started.
        </div>
      )}
    </div>
  );
}

export default FileSharing;
