// @ts-nocheck
import Head from 'next/head'
import { getAllPosts, getPostBySlug } from '../../lib/posts'

const CATEGORY_COLORS = {
  'Clinical Research': { bg: '#EBF5FE', color: '#1B3A6B' },
  'Regulatory':        { bg: '#FEF3C7', color: '#92400E' },
  'Research Guide':    { bg: '#F0FDF4', color: '#166534' },
  'Research':          { bg: '#F0FDF4', color: '#166534' },
  'Protocol Guide':    { bg: '#F5F3FF', color: '#5B21B6' },
  'Quality & Standards': { bg: '#FFF1F2', color: '#9F1239' },
}

function renderInline(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/)
  return parts.map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={i}>{part.slice(2, -2)}</strong>
      : part
  )
}

function renderTable(lines, key) {
  const dataRows = lines.filter(r => !r.match(/^\|[\s\-|]+\|$/))
  return (
    <div key={key} style={{ overflowX: 'auto', margin: '24px 0' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <tbody>
          {dataRows.map((row, ri) => {
            const cells = row.split('|').slice(1, -1)
            const isHeader = ri === 0
            return (
              <tr key={ri} style={{ background: isHeader ? '#F8FAFC' : ri % 2 === 0 ? '#fff' : '#F8FAFC' }}>
                {cells.map((cell, ci) =>
                  isHeader
                    ? <th key={ci} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#6B7280', borderBottom: '2px solid #E5E7EB', whiteSpace: 'nowrap' }}>{cell.trim()}</th>
                    : <td key={ci} style={{ padding: '10px 14px', fontSize: 14, color: '#374151', borderBottom: '1px solid #E5E7EB' }}>{cell.trim()}</td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function renderContent(content) {
  const lines = content.trim().split('\n')
  const elements = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Table block
    if (line.trim().startsWith('|')) {
      const tableLines = []
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i])
        i++
      }
      elements.push(renderTable(tableLines, `table-${i}`))
      continue
    }

    // Bullet list block
    if (line.startsWith('- ')) {
      const listItems = []
      while (i < lines.length && lines[i].startsWith('- ')) {
        listItems.push(
          <li key={i} style={{ fontSize: 15, color: '#374151', lineHeight: 1.75, marginBottom: 6 }}>
            {renderInline(lines[i].slice(2))}
          </li>
        )
        i++
      }
      elements.push(
        <ul key={`ul-${i}`} style={{ paddingLeft: 24, margin: '12px 0 20px' }}>
          {listItems}
        </ul>
      )
      continue
    }

    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={i} style={{ fontSize: 22, fontWeight: 800, color: '#1B3A6B', margin: '36px 0 12px', paddingBottom: 8, borderBottom: '2px solid #EBF5FE' }}>
          {line.slice(3)}
        </h2>
      )
    } else if (line.startsWith('**') && line.endsWith('**') && line.length > 4) {
      elements.push(
        <p key={i} style={{ fontWeight: 700, fontSize: 16, color: '#1B3A6B', margin: '20px 0 6px' }}>
          {line.slice(2, -2)}
        </p>
      )
    } else if (line.trim() === '') {
      elements.push(<div key={i} style={{ height: 4 }} />)
    } else {
      elements.push(
        <p key={i} style={{ fontSize: 15, color: '#374151', lineHeight: 1.85, margin: '0 0 16px' }}>
          {renderInline(line)}
        </p>
      )
    }
    i++
  }

  return elements
}

export default function BlogPost({ post, relatedPosts }) {
  if (!post) return <div style={{ padding: 40, fontFamily: 'sans-serif' }}>Post not found.</div>

  const cat = CATEGORY_COLORS[post.category] || { bg: '#EBF5FE', color: '#1B3A6B' }
  const canonicalUrl = `https://aeterionpeptides.com/blog/${post.slug}`

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    author: { '@type': 'Organization', name: 'Aeterion Labs' },
    publisher: { '@type': 'Organization', name: 'Aeterion Labs', url: 'https://aeterionpeptides.com' },
    url: canonicalUrl,
  }

  return (
    <>
      <Head>
        <title>{post.title} | Aeterion Labs</title>
        <meta name="description" content={post.excerpt} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.excerpt} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={canonicalUrl} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      </Head>

      <div style={{ fontFamily: "'DM Sans', Arial, sans-serif", background: '#f8f9fb', minHeight: '100vh' }}>

        <header style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <a href="/" style={{ textDecoration: 'none', color: '#1B3A6B', fontWeight: 900, fontSize: 20, letterSpacing: 1 }}>← AETERION LABS</a>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <a href="/blog" style={{ color: '#4A9FD4', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>Blog</a>
            <a href="/" style={{ background: '#1B3A6B', color: '#fff', padding: '10px 20px', borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>Shop</a>
          </div>
        </header>

        <nav style={{ padding: '12px 24px', maxWidth: 780, margin: '0 auto', fontSize: 13, color: '#6b7280' }}>
          <a href="/" style={{ color: '#4A9FD4', textDecoration: 'none' }}>Home</a>{' / '}
          <a href="/blog" style={{ color: '#4A9FD4', textDecoration: 'none' }}>Blog</a>{' / '}
          <span style={{ color: '#1B3A6B' }}>{post.category}</span>
        </nav>

        <main style={{ maxWidth: 780, margin: '0 auto', padding: '0 24px 80px' }}>
          <article style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: '48px', marginBottom: 32 }}>

            <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ background: cat.bg, color: cat.color, padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{post.category}</span>
              <span style={{ color: '#9CA3AF', fontSize: 13 }}>{post.date}</span>
              <span style={{ color: '#9CA3AF', fontSize: 13 }}>·</span>
              <span style={{ color: '#9CA3AF', fontSize: 13 }}>{post.readTime}</span>
            </div>

            <h1 style={{ margin: '0 0 20px', fontSize: 32, fontWeight: 900, color: '#1B3A6B', lineHeight: 1.25, letterSpacing: -0.5 }}>{post.title}</h1>

            <p style={{ margin: '0 0 32px', fontSize: 17, color: '#6B7280', lineHeight: 1.7, paddingBottom: 32, borderBottom: '1px solid #F3F4F6' }}>{post.excerpt}</p>

            <div>{renderContent(post.content)}</div>

            <div style={{ marginTop: 48, padding: '20px 24px', background: '#FEF3C7', borderRadius: 12, border: '1px solid #FDE68A' }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#92400E', marginBottom: 6 }}>⚠️ Research Use Disclaimer</div>
              <div style={{ fontSize: 13, color: '#92400E', lineHeight: 1.7 }}>All Aeterion Labs products are sold strictly for laboratory research purposes only. Not for human consumption, medical treatment, or therapeutic use. Not evaluated by the FDA. Must be 18+ to purchase.</div>
            </div>
          </article>

          {relatedPosts.length > 0 && (
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1B3A6B', margin: '0 0 20px' }}>More Research Guides</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                {relatedPosts.map(rp => (
                  <a key={rp.slug} href={`/blog/${rp.slug}`} style={{ textDecoration: 'none' }}>
                    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: '20px' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>{rp.category}</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#1B3A6B', lineHeight: 1.4, marginBottom: 10 }}>{rp.title}</div>
                      <div style={{ fontSize: 12, color: '#4A9FD4', fontWeight: 600 }}>Read more →</div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </main>

        <footer style={{ background: '#111827', color: 'rgba(255,255,255,0.5)', padding: '24px', textAlign: 'center', fontSize: 12 }}>
          <p style={{ margin: '0 0 8px' }}>© 2025 Aeterion Peptides. All Rights Reserved.</p>
          <p style={{ margin: 0 }}>All products for laboratory research purposes only. Not for human consumption. Must be 18+. Not FDA evaluated.</p>
        </footer>
      </div>
    </>
  )
}

export async function getStaticPaths() {
  const posts = getAllPosts()
  return {
    paths: posts.map(p => ({ params: { slug: p.slug } })),
    fallback: false,
  }
}

export async function getStaticProps({ params }) {
  const post = getPostBySlug(params.slug)
  if (!post) return { notFound: true }
  const allPosts = getAllPosts()
  const relatedPosts = allPosts
    .filter(p => p.slug !== params.slug)
    .slice(0, 3)
    .map(({ slug, title, category }) => ({ slug, title, category }))
  return { props: { post, relatedPosts } }
}
