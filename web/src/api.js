const STORAGE_KEY = "lan-share-code";

export function getShareCode() {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) return saved.trim();
  } catch {}
  const fromHash = (window.location.hash || "").replace(/^#/, "").trim();
  if (fromHash) {
    try {
      sessionStorage.setItem(STORAGE_KEY, fromHash);
    } catch {}
  }
  return fromHash;
}

export function setShareCode(code) {
  const c = String(code || "").trim();
  try {
    if (c) sessionStorage.setItem(STORAGE_KEY, c);
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {}
  try {
    window.location.hash = c;
  } catch {}
  return c;
}

export function withCode(url, code) {
  const c = code || getShareCode();
  if (!c) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}code=${encodeURIComponent(c)}`;
}

export function apiUrl(path, code) {
  return withCode(path, code);
}