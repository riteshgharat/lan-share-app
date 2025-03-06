import React from 'react';

function Sidebar({ setView }) {
  return (
    <div className="w-64 bg-gray-800 text-white p-4 flex-shrink-0">
      <h1 className="text-2xl font-bold mb-6">LAN Share</h1>
      <ul className="space-y-2">
        <li>
          <button
            onClick={() => setView('fileSharing')}
            className="w-full text-left p-2 hover:bg-gray-700 rounded"
          >
            File Sharing
          </button>
        </li>
        <li>
          <button
            onClick={() => setView('textEditor')}
            className="w-full text-left p-2 hover:bg-gray-700 rounded"
          >
            Text Editor
          </button>
        </li>
        <li>
          <button
            onClick={() => setView('chat')}
            className="w-full text-left p-2 hover:bg-gray-700 rounded"
          >
            Chat
          </button>
        </li>
      </ul>
    </div>
  );
}

export default Sidebar;
