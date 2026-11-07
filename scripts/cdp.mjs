// Minimal CDP driver for UI/UX evidence capture.
//
// Usage:
//   node cdp.mjs shot <url> <out.png> [width] [height]        full page
//   node cdp.mjs view <url> <out.png> [width] [height] [y]    viewport at scrollY
//   node cdp.mjs text <url>
//   node cdp.mjs eval <url> <jsExpression>
//   node cdp.mjs a11y <url>
//
// Prep step: dismisses the cookie banner (Reject all), scrolls the whole page
// once to trigger lazy media, returns to the top, then captures.
import fs from "node:fs/promises";

const CDP = process.env.CDP || "http://127.0.0.1:9223";
const [, , cmd, url, arg3, arg4, arg5, arg6] = process.argv;

const version = await (await fetch(`${CDP}/json/version`)).json();
const ws = new WebSocket(version.webSocketDebuggerUrl);
let seq = 0;
const pending = new Map();
const listeners = new Map();

ws.addEventListener("message", (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) {
    pending.get(m.id)(m);
    pending.delete(m.id);
  } else if (m.method && listeners.has(m.method)) {
    for (const fn of listeners.get(m.method)) fn(m);
  }
});
await new Promise((r) => ws.addEventListener("open", r, { once: true }));

function send(method, params = {}, sessionId) {
  return new Promise((resolve) => {
    const id = ++seq;
    pending.set(id, resolve);
    ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
  });
}

const { result: created } = await send("Target.createTarget", { url: "about:blank" });
const targetId = created.targetId;
const { result: attached } = await send("Target.attachToTarget", { targetId, flatten: true });
const sid = attached.sessionId;

await send("Page.enable", {}, sid);
await send("Runtime.enable", {}, sid);
await send("Network.enable", {}, sid);

const width = Number(arg4 || 1440);
const height = Number(arg5 || 900);
await send(
  "Emulation.setDeviceMetricsOverride",
  { width, height, deviceScaleFactor: 2, mobile: width < 600 },
  sid,
);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function evaluate(expression) {
  const { result } = await send(
    "Runtime.evaluate",
    { expression, returnByValue: true, awaitPromise: true },
    sid,
  );
  return result?.result?.value;
}

const loaded = new Promise((resolve) => listeners.set("Page.loadEventFired", [resolve]));
await send("Page.navigate", { url }, sid);
await Promise.race([loaded, sleep(25000)]);
await sleep(1200);

// Dismiss a cookie banner if one is present, without depending on its markup.
await evaluate(`(() => {
  const wants = ["reject all", "reject", "decline", "necessary only"];
  const nodes = [...document.querySelectorAll('button, a, [role="button"]')];
  const hit = nodes.find(n => wants.includes((n.textContent || "").trim().toLowerCase()));
  if (hit) { hit.click(); return "dismissed:" + hit.textContent.trim(); }
  return "no-banner";
})()`);
await sleep(600);

// Scroll through the page to trigger lazy-loaded media, then return to top.
await evaluate(`(async () => {
  const h = document.documentElement.scrollHeight;
  for (let y = 0; y < h; y += Math.round(window.innerHeight * 0.8)) {
    window.scrollTo(0, y);
    await new Promise(r => setTimeout(r, 220));
  }
  window.scrollTo(0, 0);
  return h;
})()`);
await sleep(1500);

let exitCode = 0;
if (cmd === "shot") {
  const out = arg3;
  const { result: metrics } = await send("Page.getLayoutMetrics", {}, sid);
  const size = metrics.cssContentSize || metrics.contentSize;
  const clip = { x: 0, y: 0, width: size.width, height: Math.min(size.height, 16000), scale: 1 };
  const { result: shot } = await send(
    "Page.captureScreenshot",
    { format: "png", captureBeyondViewport: true, clip },
    sid,
  );
  await fs.writeFile(out, Buffer.from(shot.data, "base64"));
  console.log(JSON.stringify({ out, width: Math.round(clip.width), height: Math.round(clip.height) }));
} else if (cmd === "view") {
  const out = arg3;
  const y = Number(arg6 || 0);
  await evaluate(`window.scrollTo(0, ${y})`);
  await sleep(700);
  const { result: shot } = await send("Page.captureScreenshot", { format: "png" }, sid);
  await fs.writeFile(out, Buffer.from(shot.data, "base64"));
  const at = await evaluate("window.scrollY");
  console.log(JSON.stringify({ out, width, height, scrollY: at }));
} else if (cmd === "goto") {
  // Navigate the first existing page target and leave it open for REA inspection.
  const list = await (await fetch(`${CDP}/json`)).json();
  const page = list.find((t) => t.type === "page");
  if (!page) {
    console.error("no page target");
    exitCode = 1;
  } else {
    const { result: att } = await send("Target.attachToTarget", { targetId: page.id, flatten: true });
    const gsid = att.sessionId;
    await send("Page.enable", {}, gsid);
    const done = new Promise((resolve) => listeners.set("Page.loadEventFired", [resolve]));
    await send("Page.navigate", { url }, gsid);
    await Promise.race([done, sleep(20000)]);
    await sleep(2500);
    const info = await (await fetch(`${CDP}/json`)).json();
    const now = info.find((t) => t.id === page.id);
    console.log(JSON.stringify({ target_id: page.id, title: now?.title, url: now?.url }));
  }
} else if (cmd === "action") {
  // action <url> <out.png> <width> <height> <jsToRunBeforeCapture>
  const out = arg3;
  const js = arg6;
  if (js) {
    await evaluate(js);
    await sleep(1200);
  }
  const { result: shot } = await send("Page.captureScreenshot", { format: "png" }, sid);
  await fs.writeFile(out, Buffer.from(shot.data, "base64"));
  console.log(JSON.stringify({ out, width, height }));
} else if (cmd === "text") {
  console.log(await evaluate("document.body.innerText"));
} else if (cmd === "eval") {
  const value = await evaluate(arg3);
  console.log(typeof value === "string" ? value : JSON.stringify(value, null, 1));
} else if (cmd === "evalfile") {
  const src = await fs.readFile(arg3, "utf8");
  const value = await evaluate(`(${src})()`);
  console.log(typeof value === "string" ? value : JSON.stringify(value, null, 1));
} else if (cmd === "a11y") {
  const tree = await send("Accessibility.getFullAXTree", {}, sid);
  const nodes = tree.result.nodes
    .filter((n) => n.role?.value && n.name?.value)
    .map((n) => ({ role: n.role.value, name: String(n.name.value).slice(0, 140) }));
  console.log(JSON.stringify(nodes, null, 1));
} else {
  console.error("unknown command");
  exitCode = 2;
}

await send("Target.closeTarget", { targetId });
ws.close();
process.exit(exitCode);
