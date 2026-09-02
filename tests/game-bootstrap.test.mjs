import assert from "node:assert/strict";
import test from "node:test";

class ClassList {
  values = new Set();

  add(...names) {
    for (const name of names) this.values.add(name);
  }

  remove(...names) {
    for (const name of names) this.values.delete(name);
  }

  toggle(name, force) {
    if (force ?? !this.values.has(name)) this.values.add(name);
    else this.values.delete(name);
  }

  contains(name) {
    return this.values.has(name);
  }
}

function createElement() {
  const children = new Map();
  return {
    classList: new ClassList(),
    style: { setProperty() {} },
    textContent: "",
    innerHTML: "",
    value: "",
    dataset: {},
    onclick: null,
    appendChild() {},
    insertBefore() {},
    prepend() {},
    replaceChildren() {},
    addEventListener() {},
    removeEventListener() {},
    querySelector(selector) {
      if (!children.has(selector)) children.set(selector, createElement());
      return children.get(selector);
    },
    querySelectorAll() {
      return [];
    },
    getBoundingClientRect() {
      return { left: 0, top: 0, width: 390, height: 844 };
    },
    setPointerCapture() {},
  };
}

test("the browser bootstrap starts an Expedition run without throwing", async () => {
  const elements = new Map();
  const canvasContext = new Proxy(
    {},
    {
      get(target, property) {
        if (!(property in target)) target[property] = () => {};
        return target[property];
      },
      set(target, property, value) {
        target[property] = value;
        return true;
      },
    },
  );
  const document = {
    body: createElement(),
    head: createElement(),
    createElement,
    querySelector(selector) {
      if (!elements.has(selector)) elements.set(selector, createElement());
      return elements.get(selector);
    },
    querySelectorAll() {
      return [];
    },
  };
  document.querySelector("#game").getContext = () => canvasContext;

  const storage = new Map();
  Object.assign(globalThis, {
    document,
    window: globalThis,
    innerWidth: 390,
    innerHeight: 844,
    devicePixelRatio: 1,
    localStorage: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, String(value)),
      removeItem: (key) => storage.delete(key),
    },
    addEventListener() {},
    requestAnimationFrame() {},
    AudioContext: class {
      state = "running";
      resume() {}
    },
    CustomEvent: class {
      constructor(type, options) {
        this.type = type;
        this.detail = options?.detail;
      }
    },
  });
  globalThis.dispatchEvent = () => true;

  await import(`../src/game.js?bootstrap=${Date.now()}`);
  const start = document.querySelector("#start").onclick;
  assert.equal(typeof start, "function");
  assert.doesNotThrow(() => start());
  assert.equal(
    document.querySelector("#fatal").classList.contains("hidden"),
    true,
  );
  assert.match(
    document.querySelector("#objective").textContent,
    /EXPLORE|CLEAR|SECTOR|WAVE|INTERCEPT/,
  );
});
