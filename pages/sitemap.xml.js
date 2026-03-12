// pages/sitemap.xml.js
// Serves sitemap at /sitemap.xml — the standard path Google expects

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY;

const STATIC_PAGES = [
  { url: "/",           changefreq: "daily",   priority: "1.0" },
  { url: "/blog",       changefreq: "daily",   priority: "0.9" },
  { url: "/ambassador", changefreq: "monthly", priority: "0.6" },
];

function SitemapXml() { return null; }

export async function getServerSideProps({ res }) {
  const base = "https://www.aeterionpeptides.com";
  const today = new Date().toISOString().split("T")[0];

  let blogPosts = [];
  try {
    const r = await fetch(
      `${SB_URL}/rest/v1/blog_posts?select=slug,updated_at&published=eq.true&order=created_at.desc`,
      { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } }
    );
    const data = await r.json();
    if (Array.isArray(data)) blogPosts = data;
  } catch {}

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${STATIC_PAGES.map(p => `  <url>
    <loc>${base}${p.url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join("\n")}
${blogPosts.map(p => `  <url>
    <loc>${base}/blog/${p.slug}</loc>
    <lastmod>${(p.updated_at || today).split("T")[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`).join("\n")}
</urlset>`;

  res.setHeader("Content-Type", "application/xml");
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate");
  res.write(xml);
  res.end();

  return { props: {} };
}

export default SitemapXml;
