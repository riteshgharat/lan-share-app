import React, { useState, useEffect } from 'react';
import axios from 'axios';

function FileSharing() {
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = () => {
    axios.get('http://192.0.0.8:5000/files').then((response) => {
      setFiles(response.data);
    });
  };

  const handleFileChange = (e) => setSelectedFile(e.target.files[0]);

  const handleUpload = () => {
    const formData = new FormData();
    formData.append('file', selectedFile);
    axios
      .post('http://192.0.0.8:5000/upload', formData)
      .then(() => fetchFiles());
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">File Sharing</h2>
      <div className="mb-4">
        <input
          type="file"
          onChange={handleFileChange}
          className="mr-2"
        />
        <button
          onClick={handleUpload}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Upload
        </button>
      </div>
      <ul className="space-y-2">
        {files.map((file) => (
          <li key={file.name} className="flex items-center justify-between p-2 bg-white rounded shadow">
            <span>{file.name} ({(file.size / 1024).toFixed(2)} KB)</span>
            <a
              href={`http://192.0.0.8:5000/download/${file.name}`}
              className="text-blue-500 hover:underline"
            >
              Download
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default FileSharing;
