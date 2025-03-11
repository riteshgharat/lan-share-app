import React from "react";
import { Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Home from "./pages/Home";
import FileSharing from "./pages/FileSharing";
import TextEditor from "./pages/TextEditor";
import Chat from "./pages/Chat";

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
