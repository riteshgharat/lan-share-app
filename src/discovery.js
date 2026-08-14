import { Bonjour } from "bonjour-service";

const SERVICE_TYPE = "lan-share-cli";

export function publishService({ name, port, code }) {
  const bonjour = new Bonjour();
  const service = bonjour.publish({
    name: `lan-share-cli-${code}`,
    type: SERVICE_TYPE,
    port,
    txt: { code },
  });
  service.on("error", () => {});
  return () => {
    try {
      service.stop();
      bonjour.destroy();
    } catch {}
  };
}

export function findService(code, timeoutMs = 10000) {
  return new Promise((resolve) => {
    const bonjour = new Bonjour();
    const matches = [];
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      try {
        browser.stop();
        bonjour.destroy();
      } catch {}
      resolve(matches);
    };
    const timer = setTimeout(finish, timeoutMs);
    const browser = bonjour.find({ type: SERVICE_TYPE }, (service) => {
      if (String(service?.txt?.code ?? "") === String(code)) {
        matches.push(service);
        finish();
      }
    });
  });
}
