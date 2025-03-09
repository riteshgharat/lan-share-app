import React, { useState, useEffect } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import axios from 'axios';

function TextEditor() {
  const [text, setText] = useState('');
  const [fileName, setFileName] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [loadedFiles, setLoadedFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    axios
      .get(import.meta.env.VITE_BACKEND_URL+'/files')
      .then((response) => {
        const textFiles = response.data.filter((file) =>
          /\.(txt|js|jsx|html|css|py|json|md)$/.test(file.name)
        );
        setLoadedFiles(textFiles);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setIsLoading(false);
      });
  }, []);

  const detectLanguage = (filename) => {
    const extension = filename.split('.').pop().toLowerCase();
    const extensionMap = {
      js: 'javascript',
      jsx: 'jsx',
      html: 'html',
      css: 'css',
      py: 'python',
      json: 'json',
      md: 'markdown',
      txt: 'text',
    };
    return extensionMap[extension] || 'text';
  };

  const handleFileLoad = (filename) => {
    axios
      .get(`${import.meta.env.VITE_BACKEND_URL}/files/${filename}`, { responseType: 'text' })
      .then((response) => {
        setText(response.data);
        setFileName(filename);
        setLanguage(detectLanguage(filename));
      })
      .catch((err) => console.error(err));
  };

  const handleSave = () => {
    if (!fileName) {
      alert('Please enter a file name');
      return;
    }

    const blob = new Blob([text], { type: 'text/plain' });
    const formData = new FormData();
    formData.append('file', blob, fileName);

    axios
      .post(import.meta.env.VITE_BACKEND_URL+'/upload', formData)
      .then(() => {
        alert('Text file saved successfully');
        axios.get(import.meta.env.VITE_BACKEND_URL+'/files').then((response) => {
          const textFiles = response.data.filter((file) =>
            /\.(txt|js|jsx|html|css|py|json|md)$/.test(file.name)
          );
          setLoadedFiles(textFiles);
        });
      })
      .catch((err) => console.error(err));
  };

  const languageOptions = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'jsx', label: 'JSX/React' },
    { value: 'html', label: 'HTML' },
    { value: 'css', label: 'CSS' },
    { value: 'python', label: 'Python' },
    { value: 'json', label: 'JSON' },
    { value: 'markdown', label: 'Markdown' },
    { value: 'text', label: 'Plain Text' },
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Text Editor</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <input
          type="text"
          placeholder="File name (e.g., script.js)"
          value={fileName}
          onChange={(e) => setFileName(e.target.value)}
          className="col-span-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {languageOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex justify-between mb-6">
        <div className="space-x-2">
          <button
            onClick={() => setIsPreviewMode(false)}
            className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
              !isPreviewMode ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Edit
          </button>
          <button
            onClick={() => setIsPreviewMode(true)}
            className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
              isPreviewMode ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Preview
          </button>
        </div>
        <button
          onClick={handleSave}
          className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors duration-200 flex items-center"
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
              d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
            />
          </svg>
          Save
        </button>
      </div>

      {isPreviewMode ? (
        <div className="border border-gray-200 rounded-lg overflow-auto bg-gray-900 p-4 h-64">
          <SyntaxHighlighter language={language} style={vscDarkPlus}>
            {text}
          </SyntaxHighlighter>
        </div>
      ) : (
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full h-64 px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Type your text here..."
        />
      )}

      <div className="mt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Load Existing File</h3>
        {isLoading ? (
          <div className="text-center p-4 text-gray-600">Loading files...</div>
        ) : loadedFiles.length > 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 max-h-48 overflow-y-auto">
            {loadedFiles.map((file) => (
              <button
                key={file.name}
                onClick={() => handleFileLoad(file.name)}
                className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 border-b border-gray-200 last:border-b-0 transition-colors duration-200"
              >
                {file.name}
              </button>
            ))}
          </div>
        ) : (
          <div className="bg-white p-4 rounded-lg border border-gray-200 text-gray-500 text-center">
            No text files available.
          </div>
        )}
      </div>
    </div>
  );
}

export default TextEditor;