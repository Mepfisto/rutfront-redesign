// Baut aus data/*.json die komplette Mockup-Seite nach dist/ (reines HTML, CSS/JS inline).
// Aufruf: node scripts/build-site.mjs
import { readFile, writeFile, mkdir, rm } from "node:fs/promises";

const pages = JSON.parse(await readFile("data/pages.json", "utf8"));
const allPosts = JSON.parse(await readFile("data/posts.json", "utf8"));
const posts = allPosts.filter((p) => p.slug !== "hello-world").sort((a, b) => b.date.localeCompare(a.date));
const page = (slug) => pages.find((p) => p.slug === slug);

const ORIGIN = "https://rutfront.koeln";
const LOGO = `${ORIGIN}/wp-content/uploads/2025/12/faust-single_schriftzug.png`;
const HERO_IMAGES = [
  "slider/cache/16b385266a7ad3d14131f6872c59e81b/IMG_3678-scaled.png",
  "slider/cache/2724be9d12328a6f332466b894fff4af/signal-2025-12-08-220045_004.jpg",
  "slider/cache/6ae58b9f2d2d1fcea83ba7d8801fda09/IMG_4250-scaled.jpg",
  "slider/cache/7e5478172cc064b6d5691b3e8240fd34/8DB547C3-678A-40EF-9EBA-AC24D68948F5-scaled.jpg",
  "slider/cache/47386e2eef43e37576564f09ec0461ce/5.png",
].map((p) => `${ORIGIN}/wp-content/uploads/${p}`);

// Beispiel-Kategorien (die echte Seite hat nur Schlagwörter) und Alt-Texte der Titelbilder.
const CATEGORY = {
  "alerta-und-alaaf": "Verein",
  radio: "Radio",
  schal: "Verein",
  "rutfront-radio-und-stammtisch": "Termine",
  "11-11-2026": "Termine",
  "pm-spenden-2026-2027": "Presse",
  homepage: "Verein",
  einheitsrutfrontlied: "Verein",
  "danke-liane": "Verein",
  "rutfront-fastelovendsbund-laedt-zur-sitzung-ein-jetzt-ticket-buchen": "Termine",
  "gesucht-der-schlechteste-karnevalssong": "Verein",
};
const IMAGE_ALT = {
  "alerta-und-alaaf": "Rot-weißer Schal mit der Aufschrift „Alerta & Alaaf“ auf Kopfsteinpflaster",
  radio: "Zwei Personen im Radiostudio von 674FM",
  schal: "Der rut-wiesse Rutfront-Soli-Schal",
  "rutfront-radio-und-stammtisch": "Radio im Retro-Look",
  "11-11-2026": "Ankündigung zum Sessionsauftakt am 11.11.2026",
  "pm-spenden-2026-2027": "Präsentationsfolie zur Spendenübergabe",
  einheitsrutfrontlied: "Mitglieder der Rutfront beim Singen",
  "danke-liane": "Dank an Liane Gramsch-Rudolph in der Schneiderwerkstatt",
};

const MONTHS = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const stripTags = (h) => h.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&#8211;/g, "–").replace(/&#8216;|&#8217;/g, "’").replace(/&#8230;/g, "…").replace(/&amp;/g, "&").replace(/&#038;/g, "&").replace(/\s+/g, " ").trim();
const parts = (iso) => iso.slice(0, 10).split("-").map(Number); // [y, m, d]
const longDate = (iso) => { const [y, m, d] = parts(iso); return `${d}. ${MONTHS[m - 1]} ${y}`; };
const shortDate = (iso) => { const [, m, d] = parts(iso); return `${d}. ${MONTHS[m - 1].slice(0, 3)}`; };
const monthKey = (iso) => { const [y, m] = parts(iso); return `${MONTHS[m - 1]} ${y}`; };

// ---------- Inhalte bereinigen ----------

const routeSet = new Set([...pages, ...allPosts].map((x) => x.slug));
const href = (up, slug) => (slug === "home" || slug === "" ? up || "./" : `${up || "./"}${slug}/`);

function clean(html, up) {
  let h = html
    .replace(/<div class="n2_ss_slider[\s\S]*?<\/div>/g, "")
    .replace(/class="read more button"/g, 'class="btn"')
    .replace(/\s(?:style|dir|aria-hidden|srcset|sizes|decoding)="[^"]*"/g, "")
    .replace(/\sclass="(?!btn")[^"]*"/g, "")
    .replace(/<(\/?)h1\b/g, "<$1h2")
    .replace(/<(\/?)h[56]\b/g, "<$1h4")
    .replace(/<p>(\s|&nbsp;|<br\s*\/?>)*<\/p>\s*/g, "")
    .replace(/<div>\s*<\/div>\s*/g, "")
    .replace(/href="https:\/\/rutfront\.koeln\/([^"#?]*)([^"]*)"/g, (m, path, rest) => {
      const slug = path.replace(/\/$/, "");
      return slug === "" || routeSet.has(slug) ? `href="${href(up, slug)}${rest}"` : m;
    })
    .replace(/<iframe[^>]*src="https:\/\/www\.youtube\.com\/embed\/([\w-]+)[^"]*"[^>]*title="([^"]*)"[^>]*><\/iframe>/g, (m, id, t) => lite(id, t))
    .replace(/<iframe[^>]*title="([^"]*)"[^>]*src="https:\/\/www\.youtube\.com\/embed\/([\w-]+)[^"]*"[^>]*><\/iframe>/g, (m, t, id) => lite(id, t));
  return h;
}

function lite(id, title) {
  return `<div class="yt-wrap"><button class="yt" type="button" data-id="${esc(id)}" data-title="${esc(title)}" aria-label="Video abspielen: ${esc(title)}"><span class="yt-play" aria-hidden="true"></span><span class="yt-title">${esc(title)}</span></button><p class="yt-note">Mit dem Klick wird das Video von YouTube geladen.</p></div>`;
}

// ---------- Termine / Chronik: strukturierte Darstellung ----------

const blocks = (html) => html.match(/<(h[1-6]|p|blockquote|ul|figure)\b[\s\S]*?<\/\1>/g) ?? [];

function parseTermine(html, up) {
  const sections = [];
  const intro = { tagline: "", paragraphs: [], image: null, session: "" };
  let sec = null, ev = null;
  for (const b of blocks(html)) {
    const tag = b.match(/^<(\w+)/)[1];
    const text = stripTags(b);
    if (tag === "h3") { sec = { title: text, events: [] }; sections.push(sec); ev = null; continue; }
    if (!sec) {
      if (/^h[56]$/.test(tag)) intro.tagline = text;
      else if (tag === "p" && text) intro.paragraphs.push(clean(b, up));
      else if (tag === "h1") { const img = b.match(/<img[^>]*src="([^"]+)"/); if (img) intro.image = img[1]; else intro.session = text; }
      continue;
    }
    if (/^h[56]$/.test(tag)) { ev = { title: text, titleHtml: clean(b.replace(/<\/?h[56][^>]*>/g, ""), up), lines: [], quote: "", href: (b.match(/href="([^"]+)"/) ?? [])[1] }; sec.events.push(ev); continue; }
    if (!ev || /<img/.test(b)) continue;
    if (tag === "blockquote") ev.quote = clean(b, up);
    else if (text) ev.lines.push(clean(b.replace(/<\/?p[^>]*>/g, ""), up));
  }
  for (const s of sections) for (const e of s.events) {
    const all = [e.title, ...e.lines.map(stripTags)].join(" ");
    const m = all.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
    e.iso = m ? `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}` : null;
    e.meta = { date: "", place: "", time: "", cost: "", tickets: "", notes: [] };
    for (const l of e.lines) {
      const t = l.replace(/^(📅|📍|⏰|💶|🎟️)\s*/u, "");
      if (l.startsWith("📅")) e.meta.date = t; else if (l.startsWith("📍")) e.meta.place = t;
      else if (l.startsWith("⏰")) e.meta.time = t; else if (l.startsWith("💶")) e.meta.cost = t;
      else if (l.startsWith("🎟")) e.meta.tickets = t; else e.meta.notes.push(l);
    }
  }
  return { intro, sections };
}

function renderEvent(e) {
  const [y, m, d] = e.iso ? parts(e.iso) : [];
  const badge = e.iso ? `<div class="badge"><b>${d}</b><span>${MONTHS[m - 1].slice(0, 3)}</span></div>` : `<div class="badge badge-tbd"><b>?</b><span>offen</span></div>`;
  const row = (icon, label, val) => (val ? `<div><dt><span aria-hidden="true">${icon}</span><span class="sr">${label}</span></dt><dd class="${/Kütt noch/.test(val) ? "tbd" : ""}">${val}</dd></div>` : "");
  const notes = e.meta.notes.map((n) => `<p class="${/Kütt noch/.test(stripTags(n)) ? "tbd" : ""}">${n}</p>`).join("");
  return `<article class="event"${e.iso ? ` data-date="${e.iso}"` : ""}>${badge}<div class="event-body"><h4>${e.titleHtml}</h4><span class="pill-past">vorbei</span><dl>${row("📅", "Datum", e.meta.date)}${row("📍", "Ort", e.meta.place)}${row("⏰", "Zeit", e.meta.time)}${row("💶", "Spende", e.meta.cost)}${row("🎟️", "Tickets", e.meta.tickets)}</dl>${notes}${e.quote ? `<div class="quote">${e.quote}</div>` : ""}</div></article>`;
}

function parseChronik(html, up) {
  const years = [];
  for (const b of blocks(html)) {
    const tag = b.match(/^<(\w+)/)[1];
    if (/^h[1-6]$/.test(tag)) years.push({ year: stripTags(b), items: [] });
    else if (tag === "p" && years.length) {
      const inner = clean(b.replace(/<\/?p[^>]*>/g, ""), up);
      const [date, ...rest] = inner.split(/<br\s*\/?>/);
      if (rest.length) years.at(-1).items.push({ date: stripTags(date), text: rest.join(" ").trim() });
      else if (stripTags(inner)) years.at(-1).items.push({ date: "", text: inner });
    }
  }
  return years;
}

// ---------- Layout ----------

const NAV = [
  ["home", "Startseite"], ["aktuelles", "Aktuelles"], ["termine", "Termine"], ["mitglied-werden", "Mitglied werden"],
  ["ueber-uns", "Über uns", [["karnevalspolitische-grundsaetze", "Karnevalspolitische Grundsätze"], ["chronik", "Chronik"], ["elferrat-der-herzen", "Elferrat der Herzen"], ["liederheft", "Liederheft"]]],
];

const css = await readFile(new URL("./site.css", import.meta.url), "utf8");
const js = await readFile(new URL("./site.js", import.meta.url), "utf8");

function layout({ slug, title, desc = "", body, up, bodyClass = "", events = null }) {
  const active = (s, sub) => s === slug || (sub ?? []).some(([x]) => x === slug) || (s === "aktuelles" && posts.some((p) => p.slug === slug));
  const nav = NAV.map(([s, label, sub]) => {
    const cur = active(s, sub) ? ' aria-current="page"' : "";
    if (!sub) return `<li><a href="${href(up, s)}"${cur}>${label}</a></li>`;
    return `<li class="has-sub"><a href="${href(up, s)}"${cur}>${label}</a><ul class="sub">${sub.map(([x, l]) => `<li><a href="${href(up, x)}"${x === slug ? ' aria-current="page"' : ""}>${l}</a></li>`).join("")}</ul></li>`;
  }).join("");
  return `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${esc(title)} – Rutfront Fastelovendsbund e.V. (Entwurf)</title>
<meta name="description" content="${esc(desc)}">
<style>${css}</style>
</head>
<body class="${bodyClass}">
<div class="mock-note">Entwurf / Mockup – Inhalte und Bilder von rutfront.koeln, Layout neu gedacht. Kein offizielles Angebot des Vereins.</div>
<a class="skip" href="#main">Zum Inhalt springen</a>
<header class="site">
  <div class="bar">
    <a class="logo" href="${href(up, "home")}" aria-label="Rutfront Fastelovendsbund e.V. – Startseite"><img src="${LOGO}" alt="Rutfront Fastelovendsbund e.V." width="220" height="48"></a>
    <button class="menu-btn" type="button" aria-expanded="false" aria-controls="nav">Menü</button>
    <nav id="nav" aria-label="Hauptnavigation"><ul>${nav}</ul></nav>
  </div>
</header>
<main id="main">
${body}
</main>
<footer class="site">
  <div class="cols">
    <div><h2>Rutfront Fastelovendsbund e.V.</h2><p class="motto">traditionalistisch • feministisch • antifaschistisch</p></div>
    <div><h2>Informationen</h2><a href="${href(up, "impressum")}">Impressum</a><a href="${href(up, "datenschutz")}">Datenschutz</a></div>
    <div><h2>Kontakt und Socials</h2><a href="mailto:info@rutfront.koeln">Kontakt</a><a href="https://www.instagram.com/rutfront/" rel="noopener">Instagram</a></div>
  </div>
  <p class="copy">© 2026 Rutfront Fastelovendsbund e.V. · Entwurf</p>
</footer>
${events ? `<script>window.EVENTS=${JSON.stringify(events)};</script>` : ""}
<script>${js}</script>
</body>
</html>
`;
}

const write = async (slug, html) => {
  const dir = slug === "home" ? "dist" : `dist/${slug}`;
  await mkdir(dir, { recursive: true });
  await writeFile(`${dir}/index.html`, html);
};

// ---------- Bausteine ----------

const excerptOf = (p, n = 190) => {
  let t = stripTags(p.excerpt).replace(/\s*(Weiterlesen|Read more).*$/i, "").replace(/\s*\[…\]$/, "").replace(/…$/, "");
  if (t.length > n) t = t.slice(0, n).replace(/\s+\S*$/, "") + " …";
  return t;
};
const imgFor = (p) => p.image ? `<img src="${p.image}" alt="${esc(IMAGE_ALT[p.slug] ?? "")}" loading="lazy" width="400" height="225">` : "";

function postCard(p, up) {
  return `<article class="card"><a class="card-img" href="${href(up, p.slug)}" tabindex="-1" aria-hidden="true">${imgFor(p).replace(/alt="[^"]*"/, 'alt=""')}</a><div><div class="meta"><span class="tag">${CATEGORY[p.slug] ?? "Verein"}</span><time datetime="${p.date.slice(0, 10)}">${longDate(p.date)}</time></div><h3><a href="${href(up, p.slug)}">${p.title}</a></h3><p>${esc(excerptOf(p, 130))}</p></div></article>`;
}

const nextBanner = `<section class="next" id="next" aria-label="Nächster Termin" hidden>
  <div class="next-date"><b></b><span></span></div>
  <div class="next-text"><h2></h2><p></p><span class="count"></span></div>
  <a class="btn btn-light" href="#">Alle Infos</a>
</section>`;

// ---------- Seiten erzeugen ----------

await rm("dist", { recursive: true, force: true });

const termine = parseTermine(page("termine").content, "../");
const EVENTS = termine.sections.flatMap((s) => s.events)
  .filter((e) => e.iso && !/^\?+$/.test(e.title))
  .map((e) => {
    const known = (v) => (/Kütt noch/.test(v) ? "" : stripTags(v));
    return { title: e.title.replace(/\s*\(\d{1,2}\.\d{1,2}\.\d{4}\)$/, ""), iso: e.iso, place: known(e.meta.place), time: known(e.meta.time), href: "termine/" };
  });
const eventsFor = (up) => EVENTS.map((e) => ({ ...e, href: `${up}${e.href}` }));

// Startseite
{
  const p = page("home");
  const body0 = clean(p.content, "./");
  const lead = body0.match(/<p>[^<]{40,}[\s\S]*?<\/p>/)?.[0] ?? "";
  const video = body0.match(/<div class="yt-wrap">[\s\S]*?<\/div>/)?.[0] ?? "";
  const rest = body0.replace(lead, "").replace(/<p>\s*<div class="yt-wrap">[\s\S]*?<\/div>\s*<\/p>/, "").replace(video, "");
  const hero = HERO_IMAGES.map((src, i) => `<img src="${src}" alt="" ${i === 0 ? "" : 'loading="lazy"'} style="animation-delay:${i * 6}s">`).join("");
  const member0 = stripTags((page("mitglied-werden").content.match(/<p[^>]*>Mit einer Mitgliedschaft[\s\S]*?<\/p>/) ?? [""])[0]);
  const member = member0.match(/^.*?[A-Za-zÄÖÜäöüß]{3}\./)?.[0] ?? member0;
  const body = `
<section class="hero">
  <div class="hero-imgs" aria-hidden="true">${hero}</div>
  <div class="hero-text">
    <p class="eyebrow">Kölner Karneval mit Haltung</p>
    <h1>Rutfront Fastelovendsbund e.V.</h1>
    <p class="motto-big">traditionalistisch • feministisch • antifaschistisch</p>
    <p class="hero-cta"><a class="btn" href="./termine/">Termine ansehen</a> <a class="btn btn-ghost" href="./mitglied-werden/">Mitglied werden</a></p>
  </div>
</section>
<div class="container">
  ${nextBanner}
  <section class="intro prose">
    <div class="lead">${lead}</div>
    ${video}
    ${rest}
  </section>
  <section class="latest" aria-labelledby="latest-h">
    <div class="section-head"><h2 id="latest-h">Aktuelles</h2><a class="more" href="./aktuelles/">Alle Beiträge →</a></div>
    <div class="cards">${posts.slice(0, 3).map((x) => postCard(x, "./")).join("")}</div>
  </section>
  <section class="cta">
    <div><h2>Joode Jründe Jenoss:in zo wäde</h2><p>${esc(member)}</p></div>
    <a class="btn btn-light" href="./mitglied-werden/">Mitglied werden</a>
  </section>
</div>`;
  await write("home", layout({ slug: "home", title: "Startseite", desc: stripTags(lead).slice(0, 160), body, up: "./", bodyClass: "home", events: eventsFor("./") }));
}

// Aktuelles (Übersicht)
{
  const cats = ["Termine", "Presse", "Radio", "Verein"];
  let last = "", items = "";
  for (const p of posts) {
    const mk = monthKey(p.date);
    if (mk !== last) { items += `<h2 class="month" data-month>${mk}</h2>`; last = mk; }
    const cat = CATEGORY[p.slug] ?? "Verein";
    items += `<article class="post" data-cat="${cat}" data-text="${esc((p.title + " " + excerptOf(p, 400)).toLowerCase())}"><a class="thumb" href="${href("../", p.slug)}" tabindex="-1" aria-hidden="true">${imgFor(p).replace(/alt="[^"]*"/, 'alt=""')}</a><div><div class="meta"><span class="tag">${cat}</span><time datetime="${p.date.slice(0, 10)}">${longDate(p.date)}</time></div><h3><a href="${href("../", p.slug)}">${p.title}</a></h3><p>${esc(excerptOf(p))}</p><a class="more" href="${href("../", p.slug)}" aria-label="Weiterlesen: ${esc(stripTags(p.title))}">Weiterlesen →</a></div></article>`;
  }
  const body = `<div class="container">
  <h1>Aktuelles</h1>
  <p class="lede">Neuigkeiten, Presse und Sessionstermine vom Rutfront Fastelovendsbund.</p>
  ${nextBanner}
  <div class="tools">
    <div class="chips" role="group" aria-label="Nach Kategorie filtern"><button class="chip" type="button" aria-pressed="true" data-cat="alle">Alle</button>${cats.map((c) => `<button class="chip" type="button" aria-pressed="false" data-cat="${c}">${c}</button>`).join("")}</div>
    <label class="search"><span class="sr">Beiträge durchsuchen</span><input type="search" id="q" placeholder="Beiträge durchsuchen …"></label>
  </div>
  <div id="list">${items}</div>
  <p class="empty" id="empty" hidden>Keine Beiträge gefunden.</p>
</div>`;
  await write("aktuelles", layout({ slug: "aktuelles", title: "Aktuelles", desc: "Neuigkeiten, Presse und Sessionstermine.", body, up: "../", bodyClass: "list-page", events: eventsFor("../") }));
}

// Beiträge
posts.forEach((p, i) => {
  const newer = posts[i - 1], older = posts[i + 1];
  const body = `<div class="container narrow">
  <p class="crumb"><a href="../aktuelles/">← Aktuelles</a></p>
  <article>
    <div class="meta"><span class="tag">${CATEGORY[p.slug] ?? "Verein"}</span><time datetime="${p.date.slice(0, 10)}">${longDate(p.date)}</time>${p.tags.map((t) => `<span class="tagline">#${esc(t)}</span>`).join("")}</div>
    <h1>${p.title}</h1>
    ${p.image ? `<figure class="cover"><img src="${p.image}" alt="${esc(IMAGE_ALT[p.slug] ?? "")}" width="1024" height="576"></figure>` : ""}
    <div class="prose">${clean(p.content, "../")}</div>
  </article>
  <nav class="pn" aria-label="Weitere Beiträge">${older ? `<a href="../${older.slug}/"><small>← Älter</small>${older.title}</a>` : "<span></span>"}${newer ? `<a class="r" href="../${newer.slug}/"><small>Neuer →</small>${newer.title}</a>` : "<span></span>"}</nav>
</div>`;
  return write(p.slug, layout({ slug: p.slug, title: stripTags(p.title), desc: excerptOf(p, 160), body, up: "../", bodyClass: "post-page" }));
});

// Termine
{
  const { intro, sections } = termine;
  const body = `<div class="container">
  <h1>Termine</h1>
  ${intro.tagline ? `<p class="lede">${esc(intro.tagline)}</p>` : ""}
  <div class="prose intro-text">${intro.paragraphs.join("")}</div>
  ${intro.image ? `<figure class="cover"><img src="${intro.image}" alt="" width="1024" height="576"></figure>` : ""}
  <h2 class="session">${esc(intro.session)}</h2>
  ${sections.map((s) => `<section class="tsec"><h3>${esc(s.title)}</h3><div class="events">${s.events.map(renderEvent).join("")}</div></section>`).join("")}
</div>`;
  await write("termine", layout({ slug: "termine", title: "Termine", desc: "Alle Termine der Session 2026/2027.", body, up: "../", bodyClass: "termine" }));
}

// Chronik
{
  const years = parseChronik(page("chronik").content, "../");
  const body = `<div class="container narrow"><h1>Chronik</h1>
  <ol class="timeline">${years.map((y) => `<li><h2>${esc(y.year)}</h2>${y.items.map((it) => `<div class="tl-item">${it.date ? `<time>${esc(it.date)}</time>` : ""}<p>${it.text}</p></div>`).join("")}</li>`).join("")}</ol></div>`;
  await write("chronik", layout({ slug: "chronik", title: "Chronik", desc: "Was beim Rutfront Fastelovendsbund bisher passiert ist.", body, up: "../", bodyClass: "chronik" }));
}

// Übrige Seiten (Fließtext)
for (const slug of ["ueber-uns", "mitglied-werden", "karnevalspolitische-grundsaetze", "elferrat-der-herzen", "liederheft", "impressum", "datenschutz"]) {
  const p = page(slug);
  const html = clean(p.content, "../");
  const wide = ["ueber-uns", "elferrat-der-herzen"].includes(slug);
  const body = `<div class="container${wide ? "" : " narrow"}"><h1>${p.title}</h1><div class="prose">${html}</div></div>`;
  await write(slug, layout({ slug, title: stripTags(p.title), desc: stripTags(html).slice(0, 160), body, up: "../", bodyClass: `page-${slug}` }));
}

console.log(`dist/: ${posts.length} Beiträge + ${pages.length - 1} Seiten`);
