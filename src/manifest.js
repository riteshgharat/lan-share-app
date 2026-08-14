import fs from "fs";
import path from "path";

const toRel = (abs, root) => path.relative(root, abs).split(path.sep).join("/");

function findCommonRoot(absPaths) {
  let common = null;
  for (const p of absPaths) {
    const stats = fs.statSync(p);
    const base = stats.isDirectory() ? p : path.dirname(p);
    if (common === null) {
      common = base;
      continue;
    }
    while (common !== base && !base.startsWith(common + path.sep)) {
      common = path.dirname(common);
    }
  }
  return common;
}

function scanDir(absDir, root) {
  const files = [];
  let size = 0;
  let count = 0;
  const entries = fs.readdirSync(absDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isSymbolicLink()) continue;
    const childAbs = path.join(absDir, entry.name);
    const stats = fs.statSync(childAbs);
    if (stats.isDirectory()) {
      const sub = scanDir(childAbs, root);
      files.push(...sub.files);
      size += sub.size;
      count += sub.count;
    } else if (stats.isFile()) {
      files.push({ relPath: toRel(childAbs, root), size: stats.size });
      size += stats.size;
      count += 1;
    }
  }
  return { files, size, count };
}

export function buildManifest(inputPaths, { cwd = process.cwd() } = {}) {
  const absInputs = inputPaths.map((p) => path.resolve(cwd, p));
  for (const p of absInputs) {
    if (!fs.existsSync(p)) throw new Error(`No such file or directory: ${p}`);
  }

  const root = findCommonRoot(absInputs);
  const items = [];
  const tree = [];
  let totalSize = 0;
  let fileCount = 0;

  for (const abs of absInputs) {
    const stats = fs.statSync(abs);
    if (stats.isSymbolicLink()) continue;
    const name = path.basename(abs);
    const relPath = toRel(abs, root) || name;
    if (stats.isFile()) {
      items.push({ name, type: "file", size: stats.size, fileCount: 1, relPath });
      tree.push({ relPath, size: stats.size });
      totalSize += stats.size;
      fileCount += 1;
    } else if (stats.isDirectory()) {
      const { files, size, count } = scanDir(abs, root);
      items.push({ name, type: "folder", size, fileCount: count, relPath, files });
      tree.push(...files);
      totalSize += size;
      fileCount += count;
    }
  }

  return { items, tree, totalSize, fileCount, root };
}
