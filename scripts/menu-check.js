// Opens the mobile navigation and measures the panel and its CTAs.
() => (async () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const burger = document.querySelector("header button");
  if (burger) burger.click();
  await sleep(900);

  const panel = [...document.querySelectorAll("div,aside,nav")].find((d) => {
    const t = (d.innerText || "").trim();
    const r = d.getBoundingClientRect();
    return /^PRODUCT/.test(t) && r.width > 200 && r.height > 300;
  });

  const ctas = [...document.querySelectorAll("a,button")]
    .filter((e) => /Contact Sales|Sign Up for free|Sign in/i.test(e.textContent || ""))
    .map((e) => {
      const r = e.getBoundingClientRect();
      return {
        text: e.textContent.trim().slice(0, 24),
        x: Math.round(r.x),
        width: Math.round(r.width),
        right: Math.round(r.right),
        visible: r.width > 0,
      };
    })
    .filter((c) => c.visible);

  const links = [...(panel ? panel.querySelectorAll("a") : [])].map((a) =>
    a.textContent.trim().replace(/\s+/g, " "),
  );

  return {
    viewport: innerWidth,
    panel: panel
      ? (() => {
          const r = panel.getBoundingClientRect();
          return { x: Math.round(r.x), width: Math.round(r.width), right: Math.round(r.right) };
        })()
      : null,
    ctas,
    links,
    hasPricing: links.some((l) => /pricing/i.test(l)),
    horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 1,
  };
})()
