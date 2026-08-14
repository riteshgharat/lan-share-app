import fs from "fs";
import path from "path";
import chalk from "chalk";
import { SingleBar } from "cli-progress";
import { formatBytes, formatDuration } from "./format.js";

async function fetchManifest(baseUrl, code) {
  const res = await fetch(`${baseUrl}/api/manifest?code=${encodeURIComponent(code)}`);
  if (res.status === 401) throw new Error("Invalid share code");
  if (!res.ok) throw new Error(`Could not reach the sender (HTTP ${res.status})`);
  return res.json();
}

async function downloadFile(baseUrl, code, relPath, destAbs, onProgress) {
  const url = `${baseUrl}/api/file?path=${encodeURIComponent(relPath)}&code=${encodeURIComponent(code)}`;
  const res = await fetch(url);
  if (res.status === 401) throw new Error("Invalid share code");
  if (!res.ok) throw new Error(`Download failed (HTTP ${res.status}) for ${relPath}`);
  const headerLen = res.headers.get("content-length");
  const total = headerLen ? Number(headerLen) : null;

  const writer = fs.createWriteStream(destAbs);
  const reader = res.body.getReader();
  let received = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value && value.length) {
        writer.write(Buffer.from(value));
        received += value.length;
        onProgress?.(received, total);
      }
    }
  } finally {
    reader.releaseLock();
  }
  await new Promise((resolve, reject) => {
    writer.end(() => resolve());
    writer.on("error", reject);
  });
  return received;
}

function uniquePath(p) {
  if (!fs.existsSync(p)) return p;
  const ext = path.extname(p);
  const base = path.basename(p, ext);
  const dir = path.dirname(p);
  for (let i = 1; i < 10000; i++) {
    const candidate = path.join(dir, `${base} (${i})${ext}`);
    if (!fs.existsSync(candidate)) return candidate;
  }
  return path.join(dir, `${base}-${Date.now()}${ext}`);
}

export async function receive({ baseUrl, code, output }) {
  const manifest = await fetchManifest(baseUrl, code);
  const host = new URL(baseUrl).hostname;

  console.log(chalk.bold(`📦 Received from ${chalk.cyan(host)}`));
  console.log(
    chalk.gray(
      `   ${manifest.fileCount} file(s) · ${formatBytes(manifest.totalSize)} · code ${manifest.code ?? code}`
    )
  );

  if (!manifest.tree.length) {
    console.log(chalk.yellow("   Nothing to download — the share is empty."));
    return;
  }

  fs.mkdirSync(output, { recursive: true });
  console.log(chalk.gray(`   Saving to ${output}`));

  const bar = new SingleBar({
    format: "  {bar} {percentage}% | {payload.text} | {payload.speed} | {payload.eta}",
    barCompleteChar: "█",
    barIncompleteChar: "░",
    clearOnComplete: false,
    hideCursor: true,
  });

  const started = Date.now();
  let completedBytes = 0;

  const paint = (doneBytes) => {
    const elapsed = (started ? Date.now() - started : 0) / 1000;
    const speed = elapsed > 0 ? doneBytes / elapsed : 0;
    const remaining = (manifest.totalSize - doneBytes) / Math.max(speed, 1);
    bar.update(doneBytes, {
      text: `${formatBytes(doneBytes)} / ${formatBytes(manifest.totalSize)}`,
      speed: speed > 0 ? formatBytes(speed) + "/s" : "—",
      eta: formatDuration(remaining * 1000),
    });
  };

  bar.start(manifest.totalSize, 0, {
    text: `0 B / ${formatBytes(manifest.totalSize)}`,
    speed: "—",
    eta: "—",
  });

  try {
    for (const file of manifest.tree) {
      const dest = uniquePath(path.join(output, file.relPath.split("/").join(path.sep)));
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      bar.stop();
      console.log(`   ⤓ ${chalk.cyan(file.relPath)} ${chalk.gray(formatBytes(file.size))}`);
      bar.start(manifest.totalSize, completedBytes, {
        text: `${formatBytes(completedBytes)} / ${formatBytes(manifest.totalSize)}`,
        speed: "—",
        eta: "—",
      });
      await downloadFile(baseUrl, code, file.relPath, dest, (received) => {
        paint(completedBytes + received);
      });
      completedBytes += file.size;
      paint(completedBytes);
    }
  } finally {
    bar.stop();
  }

  console.log(
    chalk.green(
      `\n✓ Saved ${manifest.fileCount} file(s) (${formatBytes(manifest.totalSize)}) to ${output}`
    )
  );

  try {
    await fetch(`${baseUrl}/api/complete?code=${encodeURIComponent(code)}`);
  } catch {}
}
