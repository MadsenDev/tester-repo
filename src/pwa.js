const version = globalThis.ORBITAL_APP_VERSION || "development";
let reloading = false;
let updateNotice;

function versionOf(worker) {
  return new Promise((resolve) => {
    const channel = new MessageChannel();
    const timeout = setTimeout(() => resolve(null), 1200);
    channel.port1.onmessage = (event) => {
      clearTimeout(timeout);
      resolve(event.data?.version || null);
    };
    worker.postMessage({ type: "GET_VERSION" }, [channel.port2]);
  });
}

function notice(message, action, onAction) {
  updateNotice?.remove();
  const root = document.createElement("aside");
  root.className = "pwa-notice";
  root.setAttribute("role", "status");
  root.innerHTML = `<span>${message}</span>`;
  if (action) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = action;
    button.onclick = onAction;
    root.append(button);
  }
  document.body.append(root);
  updateNotice = root;
}

async function offerUpdate(worker) {
  if (!worker) return;
  const nextVersion = await versionOf(worker);
  const label = nextVersion ? `Version ${nextVersion} is ready` : "A new version is ready";
  notice(label, "UPDATE NOW", () => {
    worker.postMessage({ type: "SKIP_WAITING" });
  });
}

function exposeVersion() {
  const meta = document.querySelector(".home-meta");
  if (!meta || document.querySelector("#appVersion")) return;
  const label = document.createElement("span");
  label.id = "appVersion";
  label.textContent = `V${version}`;
  meta.append(label);
}

async function register() {
  exposeVersion();
  if (!("serviceWorker" in navigator)) return;
  const registration = await navigator.serviceWorker.register("./service-worker.js", {
    scope: "./",
    updateViaCache: "none",
  });
  if (registration.waiting) offerUpdate(registration.waiting);
  registration.addEventListener("updatefound", () => {
    const installing = registration.installing;
    installing?.addEventListener("statechange", () => {
      if (installing.state === "installed" && navigator.serviceWorker.controller) {
        offerUpdate(registration.waiting || installing);
      }
    });
  });
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (reloading) return;
    reloading = true;
    location.reload();
  });
  addEventListener("focus", () => registration.update());
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") registration.update();
  });
  setInterval(() => registration.update(), 60 * 60 * 1000);
}

addEventListener("offline", () => notice("Offline mode · run data stays on this device"));
addEventListener("online", () => updateNotice?.remove());
register().catch((error) => console.warn("PWA registration failed", error));

