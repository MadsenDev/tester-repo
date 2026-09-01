const version = globalThis.ORBITAL_APP_VERSION || "development";
let reloading = false;
let updateNotice;
let registrationRef;
let updateStatus;

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

function setUpdateStatus(label) {
  if (updateStatus) updateStatus.textContent = label;
}

async function offerUpdate(worker) {
  if (!worker) return;
  const nextVersion = await versionOf(worker);
  const label = nextVersion ? `Version ${nextVersion} is ready` : "A new version is ready";
  setUpdateStatus(nextVersion ? `V${nextVersion} READY` : "UPDATE READY");
  notice(label, "UPDATE NOW", () => {
    setUpdateStatus("INSTALLING");
    worker.postMessage({ type: "SKIP_WAITING" });
  });
}

function waitForInstall(worker) {
  return new Promise((resolve) => {
    if (!worker || worker.state === "installed") {
      resolve(worker);
      return;
    }
    const onStateChange = () => {
      if (["installed", "redundant"].includes(worker.state)) {
        worker.removeEventListener("statechange", onStateChange);
        resolve(worker.state === "installed" ? worker : null);
      }
    };
    worker.addEventListener("statechange", onStateChange);
  });
}

async function checkForUpdates() {
  if (!("serviceWorker" in navigator) || !registrationRef) {
    setUpdateStatus("UNAVAILABLE");
    return;
  }
  const button = document.querySelector("#checkForUpdates");
  if (button) button.disabled = true;
  setUpdateStatus("CHECKING…");
  try {
    await registrationRef.update();
    if (registrationRef.waiting) {
      await offerUpdate(registrationRef.waiting);
      return;
    }
    if (registrationRef.installing) {
      setUpdateStatus("DOWNLOADING…");
      const installed = await waitForInstall(registrationRef.installing);
      if (installed && navigator.serviceWorker.controller) await offerUpdate(registrationRef.waiting || installed);
      else setUpdateStatus(installed ? `V${version}` : "CHECK FAILED");
      return;
    }
    setUpdateStatus("UP TO DATE");
  } catch (error) {
    console.warn("Manual update check failed", error);
    setUpdateStatus(navigator.onLine ? "CHECK FAILED" : "OFFLINE");
  } finally {
    if (button) button.disabled = false;
  }
}

function installUpdateControl() {
  const list = document.querySelector("#settings .setting-list");
  if (!list || document.querySelector("#checkForUpdates")) return;
  const button = document.createElement("button");
  button.id = "checkForUpdates";
  button.type = "button";
  button.className = "setting-row";
  button.innerHTML = `<span><small>SYSTEM UPDATE</small>Check for updates</span><b id="updateCheckStatus">V${version}</b>`;
  button.addEventListener("click", checkForUpdates);
  list.append(button);
  updateStatus = button.querySelector("#updateCheckStatus");
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
  installUpdateControl();
  if (!("serviceWorker" in navigator)) {
    setUpdateStatus("UNAVAILABLE");
    return;
  }
  const registration = await navigator.serviceWorker.register("./service-worker.js", {
    scope: "./",
    updateViaCache: "none",
  });
  registrationRef = registration;
  if (registration.waiting) offerUpdate(registration.waiting);
  registration.addEventListener("updatefound", () => {
    const installing = registration.installing;
    if (installing) setUpdateStatus("DOWNLOADING…");
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

addEventListener("offline", () => {
  notice("Offline mode · run data stays on this device");
  setUpdateStatus("OFFLINE");
});
addEventListener("online", () => {
  updateNotice?.remove();
  setUpdateStatus(`V${version}`);
});
register().catch((error) => {
  console.warn("PWA registration failed", error);
  setUpdateStatus("UNAVAILABLE");
});
