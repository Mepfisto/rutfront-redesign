// Holt Seiten, Beiträge und das Menü per WordPress-REST-API nach data/.
// Aufruf: NODE_USE_ENV_PROXY=1 node scripts/fetch-content.mjs
import { writeFile } from "node:fs/promises";

const BASE = "https://rutfront.koeln";
const get = async (path) => {
  const res = await fetch(BASE + path);
  if (!res.ok) throw new Error(`${res.status} ${path}`);
  return res;
};

const pages = await (await get("/wp-json/wp/v2/pages?per_page=100&_embed=wp:featuredmedia")).json();
let posts = [];
for (let page = 1; ; page++) {
  const res = await fetch(`${BASE}/wp-json/wp/v2/posts?per_page=100&page=${page}&_embed=wp:featuredmedia,wp:term`);
  if (!res.ok) break;
  posts = posts.concat(await res.json());
}
const home = await (await get("/")).text();

const slim = (x) => ({
  slug: x.slug,
  title: x.title.rendered,
  date: x.date,
  modified: x.modified,
  link: x.link,
  excerpt: x.excerpt?.rendered ?? "",
  content: x.content.rendered,
  image: x._embedded?.["wp:featuredmedia"]?.[0]?.source_url ?? null,
  imageAlt: x._embedded?.["wp:featuredmedia"]?.[0]?.alt_text ?? "",
  tags: (x._embedded?.["wp:term"] ?? []).flat().filter((t) => t.taxonomy === "post_tag").map((t) => t.name),
});

await writeFile("data/pages.json", JSON.stringify(pages.map(slim), null, 1));
await writeFile("data/posts.json", JSON.stringify(posts.map(slim), null, 1));
await writeFile("data/home.html", home);
console.log(`pages: ${pages.length}, posts: ${posts.length}`);
