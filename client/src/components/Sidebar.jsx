import React from 'react';

function Sidebar({ setView }) {
  return (
    <nav className="w-64 bg-neutral-800 text-white h-screen p-5 flex-shrink-0 border-r border-neutral-700/30">
      <h1 className="text-xl font-bold mb-6 border-b border-neutral-700/30 pb-4">LAN Share</h1>
      <ul className="space-y-2">
        <li>
          <button
            onClick={() => setView('fileSharing')}
            className="w-full flex items-center px-5 py-3 text-gray-300 hover:bg-neutral-700 hover:text-white transition-colors duration-200 rounded-lg"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
              />
            </svg>
            File Sharing
          </button>
        </li>
        <li>
          <button
            onClick={() => setView('textEditor')}
            className="w-full flex items-center px-5 py-3 text-gray-300 hover:bg-neutral-700 hover:text-white transition-colors duration-200 rounded-lg"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            Text Editor
          </button>
        </li>
        <li>
          <button
            onClick={() => setView('chat')}
            className="w-full flex items-center px-5 py-3 text-gray-300 hover:bg-neutral-700 hover:text-white transition-colors duration-200 rounded-lg"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            Chat
          </button>
        </li>
      </ul>
    </nav>
  );
}

export default Sidebar;