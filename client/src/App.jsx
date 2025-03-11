import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./components/Home";
import Sidebar from "./components/Sidebar";
import FileSharing from "./components/FileSharing";
import TextEditor from "./components/TextEditor";
import Chat from "./components/Chat";

function App() {
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
