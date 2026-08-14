import { ZipArchive } from "archiver";
import fs from "fs";
import path from "path";

export function createZipStream(files, root) {
  const archive = new ZipArchive({ zlib: { level: 6 } });
  for (const f of files) {
    const abs = path.resolve(root, f.relPath.split("/").join(path.sep));
    if (fs.existsSync(abs) && fs.statSync(abs).isFile()) {
      archive.file(abs, { name: f.relPath });
    }
  }
  archive.finalize();
  return archive;
}
