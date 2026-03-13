// pages/sitemap.xml.js
// Generates a dynamic sitemap including all product pages and static routes

const PRODUCTS = [
  "bpc-157","tb-500","semaglutide","tirzepatide","retatrutide","cagrilintide",
  "igf-1-lr3","igf-1-des","mechano-growth-factor","pegylated-mgf",
  "cjc-1295-dac","cjc-1295-no-dac","ipamorelin","ghrp-2","ghrp-6","sermorelin",
  "mk-677","hexarelin","tesamorelin","aod-9604",
  "mk-2866-ostarine","rad-140","lgd-4033","gw-501516","sr9009","yk-11","s4-andarine",
  "epithalon","thymosin-alpha-1","ll-37","selank","semax","dihexa","pe-22-28",
  "nad-plus","nad-nasal","ghk-cu","ta1-thymosin","foxo4-dri",
  "melanotan-2","pt-141","kisspeptin","5-amino-1mq",
  "testosterone-cypionate","testosterone-enanthate","gonadorelin","triptorelin",
  "copper-peptide-serum","ghk-cu-cream","palmitoyl-tripeptide",
  "bacteriostatic-water","peptide-reconstitution-kit","syringes"
];

const BASE_URL = "https://www.aeterionpeptides.com";

function generateSitemap() {
  const staticRoutes = [
    { url: "/", priority: "1.0", changefreq: "daily" },
    { url: "/blog", priority: "0.8", changefreq: "weekly" },
    { url: "/about", priority: "0.6", changefreq: "monthly" },
    { url: "/faq", priority: "0.7", changefreq: "monthly" },
    { url: "/contact", priority: "0.5", changefreq: "monthly" },
    { url: "/legal", priority: "0.3", changefreq: "yearly" },
  ];

  const productRoutes = PRODUCTS.map(slug => ({
    url: `/?product=${slug}`,
    priority: "0.9",
    changefreq: "weekly",
  }));

  const allRoutes = [...staticRoutes, ...productRoutes];
  const today = new Date().toISOString().split("T")[0];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allRoutes.map(({ url, priority, changefreq }) => `  <url>
    <loc>${BASE_URL}${url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`).join("\n")}
</urlset>`;
}

export default function Sitemap() {
  return null;
}

export async function getServerSideProps({ res }) {
  res.setHeader("Content-Type", "application/xml");
  res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate");
  res.write(generateSitemap());
  res.end();
  return { props: {} };
}
