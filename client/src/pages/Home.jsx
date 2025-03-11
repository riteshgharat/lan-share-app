import React from "react";
import { NavLink } from "react-router-dom";

function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <header className="bg-neutral-800 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">Welcome to LAN Share</h1>
          <p className="text-xl text-gray-300">
            Seamless collaboration on your local network
          </p>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-16 container mx-auto px-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* File Sharing Feature */}
          <div className="bg-white rounded-lg shadow-lg p-8 transform transition-transform duration-300 hover:-translate-y-2">
            <div className="text-5xl text-blue-500 mb-6 text-center">📁</div>
            <h2 className="text-2xl font-bold text-neutral-800 mb-4 text-center">
              File Sharing
            </h2>
            <p className="text-gray-600 mb-4">
              Share files of any size instantly across your local network. Drag
              and drop functionality makes transferring documents, images, and
              media files easier than ever.
            </p>
            <p className="text-gray-600">
              No internet required - all transfers happen at lightning-fast LAN
              speeds!
            </p>
          </div>

          {/* Real-Time Chat Feature */}
          <div className="bg-white rounded-lg shadow-lg p-8 transform transition-transform duration-300 hover:-translate-y-2">
            <div className="text-5xl text-blue-500 mb-6 text-center">💬</div>
            <h2 className="text-2xl font-bold text-neutral-800 mb-4 text-center">
              Real-Time Chat
            </h2>
            <p className="text-gray-600 mb-4">
              Communicate with team members through individual and group chats.
              Send text, emojis, and attachments without relying on external
              services.
            </p>
            <p className="text-gray-600">
              Stay connected and collaborate efficiently, all within your secure
              local network.
            </p>
          </div>

          {/* Text Editor Feature */}
          <div className="bg-white rounded-lg shadow-lg p-8 transform transition-transform duration-300 hover:-translate-y-2">
            <div className="text-5xl text-blue-500 mb-6 text-center">📝</div>
            <h2 className="text-2xl font-bold text-neutral-800 mb-4 text-center">
              Collaborative Text Editor
            </h2>
            <p className="text-gray-600 mb-4">
              Edit documents simultaneously with multiple users. See real-time
              changes, add comments, and work together on projects without
              version conflicts.
            </p>
            <p className="text-gray-600">
              Perfect for meeting notes, project documentation, and team
              brainstorming sessions.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <NavLink
            to="/file-sharing"
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-8 rounded-full transition-colors duration-300"
          >
            Get Started Now
          </NavLink>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-neutral-800 mb-4">
            How It Works
          </h2>
          <p className="text-xl text-gray-600 mb-12">
            LAN Share makes local network collaboration simple and secure
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="p-4">
              <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-bold text-neutral-800 mb-2">
                Install & Connect
              </h3>
              <p className="text-gray-600">
                Download LAN Share and connect to your local network. No account
                creation required!
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-4">
              <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-bold text-neutral-800 mb-2">
                Discover Peers
              </h3>
              <p className="text-gray-600">
                LAN Share automatically discovers other users on your network
                for instant collaboration.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-4">
              <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-bold text-neutral-800 mb-2">
                Share & Collaborate
              </h3>
              <p className="text-gray-600">
                Start sharing files, chatting, and editing documents together in
                real-time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-800 text-white py-6 text-center">
        <div className="container mx-auto px-4">
          <p>LAN Share - Secure, Fast, and Easy Local Network Collaboration</p>
        </div>
      </footer>
    </div>
  );
}

export default Home;
