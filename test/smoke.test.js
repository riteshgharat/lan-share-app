import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import os from "os";
import path from "path";
import { buildManifest } from "../src/manifest.js";
import { startSender } from "../src/sender.js";
import { receive } from "../src/receiver.js";

const CODE = "123456";

function setupFixture() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "lanshare-"));
  fs.mkdirSync(path.join(dir, "docs", "nested"), { recursive: true });
  fs.writeFileSync(path.join(dir, "hello.txt"), "hello world\n");
  fs.writeFileSync(path.join(dir, "docs", "readme.md"), "# readme\n");
  fs.writeFileSync(path.join(dir, "docs", "nested", "deep.bin"), Buffer.alloc(1024, 7));
  return dir;
}

let fixture;
let manifest;
let sender;
let baseUrl;

before(async () => {
  fixture = setupFixture();
  manifest = buildManifest(["hello.txt", "docs"], { cwd: fixture });
  sender = await startSender({ manifest, code: CODE, port: 0 });
  baseUrl = `http://127.0.0.1:${sender.port}`;
});

after(() => sender.close());

test("manifest requires a code", async () => {
  const res = await fetch(`${baseUrl}/api/manifest`);
  assert.equal(res.status, 401);
});

test("manifest rejects a wrong code", async () => {
  const res = await fetch(`${baseUrl}/api/manifest?code=999999`);
  assert.equal(res.status, 401);
});

test("manifest returns correct shape with code", async () => {
  const res = await fetch(`${baseUrl}/api/manifest?code=${CODE}`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.fileCount, 3);
  assert.equal(data.totalSize, 12 + 9 + 1024);
  assert.equal(data.items.length, 2);
  const folder = data.items.find((i) => i.name === "docs");
  assert.equal(folder.type, "folder");
  assert.equal(folder.fileCount, 2);
  assert.equal(data.tree.length, 3);
});

test("downloads a single file", async () => {
  const res = await fetch(`${baseUrl}/api/file?path=hello.txt&code=${CODE}`);
  assert.equal(res.status, 200);
  assert.equal(await res.text(), "hello world\n");
});

test("supports Range requests", async () => {
  const res = await fetch(`${baseUrl}/api/file?path=docs/nested/deep.bin&code=${CODE}`, {
    headers: { Range: "bytes=0-99" },
  });
  assert.equal(res.status, 206);
  const buf = Buffer.from(await res.arrayBuffer());
  assert.equal(buf.length, 100);
  assert.ok(buf.every((b) => b === 7));
});

test("rejects path traversal", async () => {
  const res = await fetch(
    `${baseUrl}/api/file?path=${encodeURIComponent("../hello.txt")}&code=${CODE}`
  );
  assert.equal(res.status, 400);
  const resAbs = await fetch(
    `${baseUrl}/api/file?path=${encodeURIComponent("/etc/passwd")}&code=${CODE}`
  );
  assert.equal(resAbs.status, 400);
});

test("zips a folder", async () => {
  const res = await fetch(`${baseUrl}/api/zip?path=docs&code=${CODE}`);
  assert.equal(res.status, 200);
  assert.match(res.headers.get("content-type") || "", /zip/);
  const buf = Buffer.from(await res.arrayBuffer());
  assert.ok(buf.length > 0);
  assert.equal(buf[0], 0x50);
  assert.equal(buf[1], 0x4b);
});

test("downloads everything as a zip", async () => {
  const res = await fetch(`${baseUrl}/api/zip?path=__all__&code=${CODE}`);
  assert.equal(res.status, 200);
  const buf = Buffer.from(await res.arrayBuffer());
  assert.ok(buf.length > 100);
  assert.equal(buf[0], 0x50);
});

test("receiver downloads and reconstructs the tree", async () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), "lanshare-out-"));
  await receive({ baseUrl, code: CODE, output: out });
  assert.equal(fs.readFileSync(path.join(out, "hello.txt"), "utf8"), "hello world\n");
  assert.equal(fs.readFileSync(path.join(out, "docs", "readme.md"), "utf8"), "# readme\n");
  const deep = fs.readFileSync(path.join(out, "docs", "nested", "deep.bin"));
  assert.equal(deep.length, 1024);
  assert.ok(deep.every((b) => b === 7));
});
