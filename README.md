# 🌐 LAN SHARE SERVER

## 🛠️ Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

## 🚀 Setup and Run

1. **Clone the repository:**

    ```sh
    git clone <repository-url>
    cd lan-share-app
    ```

2. **Install dependencies:**

    ```sh
    npm run ilsa
    ```

3. **Run the application:**

    The setup script will:
    - Start the server
    - Update the `.env` file in the client with the backend URL
    - Install client dependencies and start the client

    ```sh
    npm run lsa
    ```

4. **Access the application:**

    Open your browser and navigate to the URL displayed in the terminal (e.g., `http://<server-ip>:6969`).

## ✨ Features

- **📂 File Sharing:** Upload and download files within your local network.
- **💬 Real-time Chat:** Communicate with other users on the same network.
- **📝 Text Editor:** Create and edit text documents directly within the app.

## 🔌 Endpoints

- **Upload File:** `POST /upload`
- **List Files:** `GET /files`
- **Download File:** `GET /download/:filename`
- **Delete File:** `DELETE /files/:filename`