# lan-share

Croc-style file and folder sharing over your local network.

Send files from your terminal. Anyone on the same Wi-Fi/LAN can receive them using the CLI or through a zero-install web portal hosted by the sender.

## Features

- **P2P on local network**: Fast LAN transfers without internet or accounts.
- **6-digit code**: Every share is protected with a short code.
- **Web portal**: Receivers can open a browser to download files, preview images, edit text, and chat in real time.
- **Reverse uploads**: Peers can send files back to the sender (disable with `--no-upload`).
- **Folder support**: Folders are streamed automatically as zip archives.
- **Pure Node.js**: Standard CLI tool, runs on any system with Node.js installed.

## Installation

Requires **Node.js ≥ 18.0.0**:

```bash
# Install globally from npm or local repository
npm install -g .
```

Or run directly without installation:

```bash
npx lan-share send ./my-folder
```

## Quick Start

### 1. Send files or folders

```bash
# Share a file or folder
lan-share send ./my-folder ./notes.txt

# Use a specific code and port
lan-share send ./photos --code 123456 --port 9876

# Read-only share (disable uploads from peers)
lan-share send ./docs --no-upload
```

The CLI will display:
- A 6-digit code (e.g., `849201`)
- A web URL (`http://<sender-ip>:9876/#849201`)
- A terminal QR code for phone/tablet scanning

### 2. Receive files

**Option A — CLI:**
```bash
# Auto-discovers sender on the same LAN
lan-share receive 849201

# Save to a specific folder
lan-share receive 849201 -o ./downloads

# Direct connection by IP
lan-share receive 192.168.1.15:9876 --code 849201
```

**Option B — Web Browser:**  
Open `http://<sender-ip>:9876/#849201` in any browser. No installation needed.

## CLI Options

### `send`
- `--code <code>`: Use a custom 6-digit code
- `--port <port>`: Port to listen on (default: `9876`)
- `--once`: Stop server after first completed transfer
- `--no-upload`: Disallow peer uploads (read-only mode)
- `--upload-dir <dir>`: Where uploaded files are saved
- `--timeout <sec>`: Auto-shutdown after N seconds

### `receive`
- `-o, --output <dir>`: Destination directory (default: `./<code>`)
- `--code <code>`: Share code when connecting via `ip:port`
- `-t, --timeout <sec>`: Discovery timeout in seconds (default: `10`)

## Development

```bash
npm run setup     # install all dependencies and build web assets
npm run build:web # rebuild web portal into src/web-static.js
npm test          # run tests
```

## License

[ISC](LICENSE)
