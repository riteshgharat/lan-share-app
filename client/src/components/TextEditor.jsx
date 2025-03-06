import React, { useState } from 'react';
import axios from 'axios';

function TextEditor() {
  const [text, setText] = useState('');
  const [fileName, setFileName] = useState('');

  const handleSave = () => {
    const blob = new Blob([text], { type: 'text/plain' });
    const formData = new FormData();
    formData.append('file', blob, fileName || `note-${Date.now()}.txt`);
    axios
      .post('http://192.0.0.8:5000/upload', formData)
      .then(() => alert('Text file saved successfully'));
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Text Editor</h2>
      <input
        type="text"
        placeholder="File name (e.g., note.txt)"
        value={fileName}
        onChange={(e) => setFileName(e.target.value)}
        className="w-full p-2 mb-4 border rounded"
      />
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full h-64 p-2 border rounded mb-4"
        placeholder="Type your text here..."
      />
      <button
        onClick={handleSave}
        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
        Save
      </button>
    </div>
  );
}

export default TextEditor;
