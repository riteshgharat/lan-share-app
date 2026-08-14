import { Command } from "commander";
import chalk from "chalk";
import qrcode from "qrcode-terminal";
import readline from "readline";
import path from "path";
import { buildManifest } from "./manifest.js";
import { startSender } from "./sender.js";
import { publishService, findService } from "./discovery.js";
import { receive } from "./receiver.js";
import { getLocalIPv4s, pickFreePort } from "./network.js";
import { generateCode, formatBytes } from "./format.js";

const program = new Command();

program
  .name("lan-share")
  .description("Croc-style file sharing over your LAN")
  .version("1.0.0")
  .showHelpAfterError();

program
  .command("send")
  .description("share files/folders over the LAN with a web portal + code")
  .argument("<paths...>", "files and/or folders to share")
  .option("--port <n>", "port to listen on (default 9876, auto-increments if busy)", parseInt)
  .option("--code <code>", "use a specific 6-digit code instead of a random one")
  .option("--once", "shut down after the first transfer completes")
  .option("--timeout <seconds>", "auto shut down after N seconds", parseInt)
  .option("--no-upload", "disable upload-back: peers can download but not upload/delete files")
  .option("--upload-dir <dir>", "directory where peer uploads are saved (default: temp)", (v) => path.resolve(v))
  .action(sendAction);

program
  .command("receive")
  .description("download files shared by a sender (code or ip:port)")
  .argument("[target]", "6-digit code, or sender address as ip:port")
  .option("-o, --output <dir>", "save destination (default ./<code>)")
  .option("--code <code>", "share code when connecting by ip:port")
  .option("--port <n>", "port to assume when target has no port", parseInt, 9876)
  .option("-t, --timeout <seconds>", "mDNS discovery timeout in seconds", parseFloat, 10)
  .action(receiveAction);

function prompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) =>
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    })
  );
}

function printBanner(manifest, code, hosts, port, allowUpload) {
  const folders = manifest.items.filter((i) => i.type === "folder").length;
  const webUrl = `http://${hosts[0]}:${port}/#${code}`;
  console.log(chalk.bold("\n📦 Sharing:"));
  console.log(
    `   ${manifest.items.length} item(s) · ${manifest.fileCount} file(s) · ${formatBytes(manifest.totalSize)}`
  );
  if (folders) console.log(`   📁 ${folders} folder(s)`);
  console.log(chalk.bold(`\n🔑 Code:  ${chalk.yellow(code)}`));
  console.log(`🌐 Web:   ${chalk.cyan(webUrl)}  (portal: browse ♥ chat ♥ preview ♥ upload-back)`);
  console.log(`💻 CLI:   ${chalk.yellow(`lan-share receive ${code}`)}`);
  if (allowUpload) {
    console.log(chalk.gray("   ⬆ peers can upload files back to you"));
  } else {
    console.log(chalk.gray("   🔒 upload-back disabled (read-only share)"));
  }
  for (const h of hosts.slice(1)) {
    console.log(chalk.gray(`   also at http://${h}:${port}/#${code}`));
  }
  qrcode.generate(webUrl, { small: true }, (q) => console.log(q));
}

async function sendAction(paths, opts) {
  let manifest;
  try {
    manifest = buildManifest(paths);
  } catch (e) {
    console.error(chalk.red(`✖ ${e.message}`));
    process.exit(1);
  }

  const code = (opts.code ? String(opts.code) : generateCode()).slice(0, 6);
  const port = opts.port || (await pickFreePort());
  const hosts = getLocalIPv4s();

  let receivedCount = 0;
  let sessionComplete = false;
  let sender;
  try {
    sender = await startSender({
      manifest,
      code,
      port,
      allowUpload: opts.upload !== false,
      uploadsDir: opts.uploadDir,
      onDownload: ({ done, sessionComplete: sc }) => {
        if (sc) sessionComplete = true;
        else if (done) receivedCount += 1;
      },
    });
  } catch (e) {
    console.error(chalk.red(`✖ Could not start the share server: ${e.message}`));
    process.exit(1);
  }

  let unpublish = () => {};
  try {
    unpublish = publishService({ name: `lan-share-cli-${code}`, port: sender.port, code });
  } catch {}

  printBanner(manifest, code, hosts, sender.port, opts.upload !== false);
  console.log(chalk.gray("\nWaiting for a receiver…  (Ctrl+C to stop)"));

  let timeoutHandle = null;
  let shuttingDown = false;

  const shutdown = (reason) => {
    if (shuttingDown) return;
    shuttingDown = true;
    if (timeoutHandle) clearTimeout(timeoutHandle);
    console.log(chalk.gray(`\n${reason}`));
    if (receivedCount > 0) {
      console.log(chalk.green(`✓ ${receivedCount} transfer(s) completed`));
    }
    unpublish();
    sender.close().then(() => process.exit(0));
    setTimeout(() => process.exit(0), 3000);
  };

  if (opts.timeout) {
    timeoutHandle = setTimeout(
      () => shutdown(`Timeout reached (${opts.timeout}s). Stopping share.`),
      opts.timeout * 1000
    );
  }

  if (opts.once) {
    const watcher = setInterval(() => {
      if (sessionComplete) {
        clearInterval(watcher);
        shutdown("Transfer complete. Stopping share (--once).");
      }
    }, 1000);
  }

  process.on("SIGINT", () => shutdown("Stopped by user."));
}

async function receiveAction(target, opts) {
  let baseUrl;
  let code = null;

  if (!target) {
    target = await prompt(chalk.cyan("Enter the 6-digit code or sender address (ip:port): "));
    if (!target) {
      console.error(chalk.red("✖ No target provided."));
      process.exit(1);
    }
  }

  if (/^\d{6}$/.test(target)) {
    code = target;
    console.log(chalk.gray(`🔎 Looking for sender with code ${chalk.yellow(code)} on the LAN…`));
    const matches = await findService(code, (opts.timeout ?? 10) * 1000);
    if (!matches.length) {
      console.error(chalk.red(`✖ Could not find a sender with code "${code}" on this LAN.`));
      console.error(chalk.yellow("   Check the sender is running and reachable, or pass the address directly:"));
      console.error(chalk.yellow(`   lan-share-cli receive <sender-ip>:<port>`));
      process.exit(1);
    }
    baseUrl = `http://${matches[0].host}:${matches[0].port}`;
  } else {
    let addr = target;
    if (!/:\d+$/.test(addr)) addr = `${addr}:${opts.port ?? 9876}`;
    if (!/^https?:\/\//.test(addr)) addr = `http://${addr}`;
    baseUrl = addr;
  }

  if (code === null) {
    code = opts.code;
    if (!code) code = await prompt(chalk.cyan("Enter the share code: "));
    if (!code) {
      console.error(chalk.red("✖ A code is required to download."));
      process.exit(1);
    }
  }

  const output = opts.output
    ? path.resolve(opts.output)
    : path.resolve(process.cwd(), code);

  process.on("SIGINT", () => {
    console.log(chalk.gray("\nCancelled."));
    process.exit(130);
  });

  try {
    await receive({ baseUrl, code, output });
  } catch (e) {
    console.error(chalk.red(`\n✖ ${e.message}`));
    process.exit(1);
  }
}

program.parse();
