# Contributing to lan-share

Thanks for contributing! Here is how to get started quickly.

## Development Setup

Requirements:
- Node.js ≥ 18.0.0
- npm ≥ 9.0.0

```bash
# Clone the repository
git clone https://github.com/riteshgharat/lan-share-app.git
cd lan-share-app

# Install dependencies and build web assets
npm run setup
```

## Running & Testing

```bash
# Test CLI locally
node bin/lan-share.js send ./README.md

# Develop the web frontend (with hot reload)
cd web && npm run dev

# Rebuild web bundle into src/web-static.js
npm run build:web

# Run tests
npm test
```

## Submitting Changes

1. Fork the repository and create a branch:
   ```bash
   git checkout -b feature/my-feature
   ```
2. Make your changes and ensure tests pass:
   ```bash
   npm test
   ```
3. If you changed files in `web/`, rebuild web assets:
   ```bash
   npm run build:web
   ```
4. Commit and push your changes:
   ```bash
   git commit -m "feat: short description of change"
   git push origin feature/my-feature
   ```
5. Open a Pull Request on GitHub.

## Guidelines

- Keep pull requests focused on a single change or fix.
- Ensure cross-platform compatibility (Windows, macOS, Linux).
- Verify all endpoints enforce the 6-digit security code.
