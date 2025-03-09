import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import FileSharing from './components/FileSharing';
import TextEditor from './components/TextEditor';
import Chat from './components/Chat';

function App() {
  const [view, setView] = useState('fileSharing');

  return (
    <div className="flex min-h-screen bg-gray-100 font-sans antialiased">
      <Sidebar setView={setView} />
      <main className="flex-1 p-6 overflow-y-auto">
        {view === 'fileSharing' && <FileSharing />}
        {view === 'textEditor' && <TextEditor />}
        {view === 'chat' && <Chat />}
      </main>
    </div>
  );
}

export default App;