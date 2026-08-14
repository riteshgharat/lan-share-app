export function buildWebPage(code) {
  const safeCode = JSON.stringify(code);
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>lan-share · receive</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    background: radial-gradient(1200px 600px at 20% -10%, #1e3a8a 0%, transparent 55%),
                radial-gradient(1000px 500px at 110% 10%, #7c3aed 0%, transparent 50%),
                #0b1120;
    color: #e2e8f0;
    min-height: 100vh;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding: 40px 16px;
  }
  .card {
    width: 100%;
    max-width: 720px;
    background: rgba(15, 23, 42, 0.75);
    border: 1px solid rgba(148, 163, 184, 0.2);
    border-radius: 16px;
    padding: 28px;
    backdrop-filter: blur(8px);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.45);
  }
  header { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 20px; }
  h1 { font-size: 22px; font-weight: 700; display: flex; align-items: center; gap: 10px; }
  .code {
    background: #1d4ed8;
    color: #fff;
    font-family: ui-monospace, monospace;
    font-size: 15px;
    letter-spacing: 2px;
    padding: 6px 12px;
    border-radius: 999px;
    white-space: nowrap;
  }
  .meta { color: #94a3b8; font-size: 13px; margin-bottom: 18px; }
  .summary {
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
    margin-bottom: 14px;
  }
  .summary span { font-size: 14px; color: #cbd5e1; }
  .btn {
    display: inline-flex; align-items: center; gap: 6px;
    background: #16a34a; color: #fff;
    border: none; border-radius: 8px;
    padding: 8px 14px; font-size: 14px; font-weight: 600;
    cursor: pointer; text-decoration: none;
  }
  .btn:hover { background: #15803d; }
  .btn.ghost { background: transparent; border: 1px solid #334155; color: #cbd5e1; }
  .btn.ghost:hover { background: #1e293b; }
  .list { border: 1px solid #1e293b; border-radius: 10px; overflow: hidden; }
  .row {
    display: flex; align-items: center; gap: 12px;
    padding: 10px 14px;
    border-bottom: 1px solid #1e293b;
    background: rgba(15, 23, 42, 0.4);
  }
  .row:last-child { border-bottom: none; }
  .row.folder { background: rgba(30, 41, 59, 0.35); }
  .row .icon { font-size: 18px; width: 24px; text-align: center; }
  .row .name { flex: 1; font-size: 14px; word-break: break-all; color: #f1f5f9; }
  .row .sub { flex: 1; font-size: 12px; color: #64748b; }
  .row .size { font-size: 13px; color: #94a3b8; white-space: nowrap; }
  .row .dl {
    background: #2563eb; color: #fff; border: none; border-radius: 6px;
    padding: 5px 10px; font-size: 12px; font-weight: 600; cursor: pointer; text-decoration: none;
  }
  .row .dl:hover { background: #1d4ed8; }
  .unlock { display: none; gap: 10px; align-items: center; margin-bottom: 18px; }
  .unlock input {
    flex: 1; background: #0f172a; color: #e2e8f0; border: 1px solid #334155;
    border-radius: 8px; padding: 10px 12px; font-size: 15px; letter-spacing: 4px; text-align: center;
  }
  .error { color: #f87171; font-size: 14px; margin-top: 14px; }
  .empty { color: #64748b; text-align: center; padding: 30px 0; font-size: 14px; }
  footer { margin-top: 18px; text-align: center; color: #475569; font-size: 12px; }
</style>
</head>
<body>
<div class="card">
  <header>
    <h1>📦 lan-share</h1>
    <span class="code" id="codeBadge">—</span>
  </header>
  <div class="unlock" id="unlock">
    <input id="codeInput" inputmode="numeric" maxlength="6" placeholder="enter the share code" />
    <button class="btn" onclick="submitCode()">Access</button>
  </div>
  <div class="meta" id="meta">Connecting…</div>
  <div class="summary" id="summary" style="display:none">
    <span id="summaryText"></span>
    <a class="btn" id="downloadAll" href="#" download>⬇ Download all (.zip)</a>
  </div>
  <div class="list" id="list"></div>
  <div class="error" id="error" style="display:none"></div>
  <footer>Files are served directly from the sender's device over your local network.</footer>
</div>
<script>
const DEFAULT_CODE = ${safeCode};
let code = DEFAULT_CODE || location.hash.replace(/^#/, "").trim();

const badge = document.getElementById("codeBadge");
const unlock = document.getElementById("unlock");
const codeInput = document.getElementById("codeInput");
const meta = document.getElementById("meta");
const summary = document.getElementById("summary");
const summaryText = document.getElementById("summaryText");
const list = document.getElementById("list");
const downloadAll = document.getElementById("downloadAll");
const errorEl = document.getElementById("error");

const api = (path) => \`/api/\${path}?code=\${encodeURIComponent(code)}\`;
const fmt = (b) => {
  if (!Number.isFinite(b) || b <= 0) return "0 B";
  const u = ["B","KB","MB","GB","TB"];
  const i = Math.min(Math.floor(Math.log(b) / Math.log(1024)), u.length - 1);
  const v = b / Math.pow(1024, i);
  return v.toFixed(v >= 100 || i === 0 ? 0 : 1) + " " + u[i];
};

function render(manifest) {
  if (code) {
    badge.textContent = code;
    unlock.style.display = "none";
    badge.style.display = "";
  } else {
    badge.style.display = "none";
    unlock.style.display = "flex";
    summary.style.display = "none";
    list.innerHTML = \`<div class="empty">Enter the code shown by the sender to see shared files.</div>\`;
    return;
  }
  meta.textContent = \`⬆ \${manifest.host} · \${manifest.fileCount} file\${manifest.fileCount === 1 ? "" : "s"} · \${fmt(manifest.totalSize)}\`;
  summary.style.display = "flex";
  summaryText.textContent = manifest.items.map((i) => i.type === "folder" ? "📁 " + i.name : "📄 " + i.name).join(" · ");
  downloadAll.href = "/api/zip?path=__all__&code=" + encodeURIComponent(code);
  downloadAll.download = code + "-lan-share-all.zip";
  list.innerHTML = "";
  for (const item of manifest.items) {
    if (item.type === "folder") {
      const row = el("div", "row folder");
      row.append(el("span", "icon", "📁"), el("span", "name", item.name), el("span", "size", fmt(item.size)));
      const dl = el("a", "dl", "⬇ .zip");
      dl.href = "/api/zip?path=" + encodeURIComponent(item.relPath) + "&code=" + encodeURIComponent(code);
      dl.download = item.name + ".zip";
      row.append(dl);
      list.append(row);
      for (const f of item.files) {
        const sub = el("div", "row");
        sub.style.paddingLeft = "40px";
        sub.append(el("span", "icon", "📄"), el("span", "sub", f.relPath), el("span", "size", fmt(f.size)));
        const sdl = el("a", "dl", "⬇");
        sdl.href = "/api/file?path=" + encodeURIComponent(f.relPath) + "&code=" + encodeURIComponent(code);
        sdl.download = f.relPath.split("/").pop();
        sub.append(sdl);
        list.append(sub);
      }
    } else {
      const row = el("div", "row");
      row.append(el("span", "icon", "📄"), el("span", "name", item.name), el("span", "size", fmt(item.size)));
      const dl = el("a", "dl", "⬇ Download");
      dl.href = "/api/file?path=" + encodeURIComponent(item.relPath) + "&code=" + encodeURIComponent(code);
      dl.download = item.name;
      row.append(dl);
      list.append(row);
    }
  }
}

function el(tag, cls, text) {
  const n = document.createElement(tag);
  n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
}

function submitCode() {
  code = codeInput.value.trim();
  location.hash = code;
  load();
}

async function load() {
  if (!code) { render({ host: "—", items: [], fileCount: 0, totalSize: 0 }); return; }
  errorEl.style.display = "none";
  meta.textContent = "Connecting…";
  try {
    const res = await fetch(api("manifest"));
    if (res.status === 401) throw new Error("invalid-code");
    if (!res.ok) throw new Error("http-" + res.status);
    render(await res.json());
  } catch (e) {
    if (e.message === "invalid-code") {
      errorEl.textContent = "That code is incorrect. Please enter the code shown by the sender.";
      errorEl.style.display = "block";
      code = "";
      location.hash = "";
      render({ host: "—", items: [], fileCount: 0, totalSize: 0 });
    } else {
      errorEl.textContent = "Could not reach the sender. Make sure you're on the same network.";
      errorEl.style.display = "block";
    }
  }
}

load();
</script>
</body>
</html>`;
}
