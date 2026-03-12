// pages/robots.txt.js
// Serves robots.txt pointing crawlers to the sitemap

export default function RobotsTxt() { return null; }

export async function getServerSideProps({ res }) {
  res.setHeader("Content-Type", "text/plain");
  res.write(`User-agent: *
Allow: /

Sitemap: https://www.aeterionpeptides.com/api/sitemap
`);
  res.end();
  return { props: {} };
}
