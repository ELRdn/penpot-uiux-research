// UI/UX audit probe. Runs inside the page and returns a JSON-serialisable object.
() => {
  const out = {};
  const doc = document;
  const de = doc.documentElement;

  out.lang = de.getAttribute("lang");
  out.title = doc.title;
  out.metaDescription = doc.querySelector('meta[name="description"]')?.content || null;
  out.viewport = {
    innerWidth: innerWidth,
    innerHeight: innerHeight,
    scrollHeight: de.scrollHeight,
    dpr: devicePixelRatio,
  };

  // --- heading outline -------------------------------------------------
  const headings = [...doc.querySelectorAll("h1,h2,h3,h4,h5,h6")].map((h) => ({
    level: Number(h.tagName[1]),
    text: h.textContent.trim().replace(/\s+/g, " ").slice(0, 80),
  }));
  out.headings = { h1Count: headings.filter((h) => h.level === 1).length, outline: headings.slice(0, 40) };
  let skips = [];
  for (let i = 1; i < headings.length; i++) {
    if (headings[i].level - headings[i - 1].level > 1) {
      skips.push(`${headings[i - 1].level}->${headings[i].level} @ ${headings[i].text}`);
    }
  }
  out.headings.skips = skips;

  // --- landmarks / skip link -------------------------------------------
  const roleOf = (el) => el.getAttribute("role") || el.tagName.toLowerCase();
  out.landmarks = [...doc.querySelectorAll("header,nav,main,footer,aside,[role=banner],[role=navigation],[role=main],[role=contentinfo]")]
    .map((el) => roleOf(el))
    .reduce((a, r) => ((a[r] = (a[r] || 0) + 1), a), {});
  out.skipLink = [...doc.querySelectorAll("a")].some((a) =>
    /skip to|skip navigation|本文へ/i.test(a.textContent || ""),
  );

  // --- media accessibility ---------------------------------------------
  const imgs = [...doc.querySelectorAll("img")];
  out.images = {
    total: imgs.length,
    missingAlt: imgs.filter((i) => !i.hasAttribute("alt")).length,
    decorative: imgs.filter((i) => i.getAttribute("alt") === "").length,
    withAlt: imgs.filter((i) => (i.getAttribute("alt") || "").trim().length > 0).length,
  };
  const iframes = [...doc.querySelectorAll("iframe")];
  out.iframes = {
    total: iframes.length,
    withoutTitle: iframes.filter((f) => !f.getAttribute("title")).length,
    sources: iframes.map((f) => (f.src || "").slice(0, 60)),
  };

  // --- controls ---------------------------------------------------------
  const controls = [...doc.querySelectorAll("a,button,[role=button],input,select,textarea")];
  const nameOf = (el) =>
    (el.getAttribute("aria-label") || el.textContent || el.getAttribute("placeholder") || "").trim();
  out.controls = {
    total: controls.length,
    unnamed: controls.filter((c) => nameOf(c).length === 0 && !c.getAttribute("title")).length,
    under24: controls.filter((c) => {
      const r = c.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && (r.height < 24 || r.width < 24);
    }).length,
    under44: controls.filter((c) => {
      const r = c.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && (r.height < 44 || r.width < 44);
    }).length,
  };

  // --- colour + contrast ------------------------------------------------
  const parse = (c) => {
    const m = c.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(",").map((x) => parseFloat(x));
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  };
  const lum = ({ r, g, b }) => {
    const f = (v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const ratio = (a, b) => {
    const l1 = lum(a);
    const l2 = lum(b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  };
  const bgOf = (el) => {
    let n = el;
    while (n && n !== doc.documentElement) {
      const c = parse(getComputedStyle(n).backgroundColor);
      if (c && c.a > 0.5) return c;
      n = n.parentElement;
    }
    return { r: 255, g: 255, b: 255, a: 1 };
  };

  const samples = [...doc.querySelectorAll("p,li,span,a,h1,h2,h3,h4,label,button")]
    .filter((el) => {
      const t = (el.textContent || "").trim();
      const r = el.getBoundingClientRect();
      return t.length > 2 && r.width > 0 && r.height > 0 && el.children.length === 0;
    })
    .slice(0, 400);

  const contrast = samples.map((el) => {
    const st = getComputedStyle(el);
    const fg = parse(st.color);
    const bg = bgOf(el);
    if (!fg || !bg) return null;
    return {
      ratio: Math.round(ratio(fg, bg) * 100) / 100,
      size: parseFloat(st.fontSize),
      weight: Number(st.fontWeight) || 400,
      text: (el.textContent || "").trim().slice(0, 40),
      color: st.color,
      bg: `rgb(${bg.r},${bg.g},${bg.b})`,
    };
  }).filter(Boolean);

  const fails = contrast.filter(
    (c) => c.ratio < (c.size >= 24 || (c.size >= 18.66 && c.weight >= 700) ? 3 : 4.5),
  );
  out.contrast = {
    sampled: contrast.length,
    failures: fails.length,
    worst: fails.sort((a, b) => a.ratio - b.ratio).slice(0, 8),
  };

  // --- type + spacing system -------------------------------------------
  const palette = {};
  const radii = {};
  const fonts = {};
  const sizes = {};
  [...doc.querySelectorAll("*")].slice(0, 3000).forEach((el) => {
    const st = getComputedStyle(el);
    if (st.backgroundColor && st.backgroundColor !== "rgba(0, 0, 0, 0)") {
      palette[st.backgroundColor] = (palette[st.backgroundColor] || 0) + 1;
    }
    if (st.borderRadius && st.borderRadius !== "0px") {
      radii[st.borderRadius] = (radii[st.borderRadius] || 0) + 1;
    }
    if (st.fontFamily) fonts[st.fontFamily] = (fonts[st.fontFamily] || 0) + 1;
    if (st.fontSize) sizes[st.fontSize] = (sizes[st.fontSize] || 0) + 1;
  });
  const top = (obj, n) => Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, n);
  out.design = {
    fonts: top(fonts, 5),
    fontSizes: top(sizes, 12),
    backgroundColours: top(palette, 12),
    radii: top(radii, 8),
    bodyBg: getComputedStyle(doc.body).backgroundColor,
    bodyFont: getComputedStyle(doc.body).fontFamily,
  };

  // --- motion preferences ----------------------------------------------
  let reducedMotionRules = 0;
  for (const sheet of doc.styleSheets) {
    try {
      for (const rule of sheet.cssRules) {
        if (rule.conditionText && /prefers-reduced-motion/.test(rule.conditionText)) reducedMotionRules++;
      }
    } catch {}
  }
  out.motion = {
    reducedMotionRules,
    autoplayVideos: doc.querySelectorAll("video[autoplay]").length,
    animatedElements: [...doc.querySelectorAll("*")].filter((el) => {
      const st = getComputedStyle(el);
      return st.animationName && st.animationName !== "none";
    }).length,
  };

  // --- layout ------------------------------------------------------------
  const main = doc.querySelector("main") || doc.body;
  const mr = main.getBoundingClientRect();
  out.layout = {
    mainWidth: Math.round(mr.width),
    maxWidth: getComputedStyle(main).maxWidth,
    padding: getComputedStyle(main).padding,
    horizontalOverflow: de.scrollWidth > innerWidth + 1,
    scrollWidth: de.scrollWidth,
  };

  return out;
}
