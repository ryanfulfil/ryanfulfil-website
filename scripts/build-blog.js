/**
 * build-blog.js
 * Fetches published blog posts from Sanity and generates static HTML pages.
 * Run via GitHub Actions or locally: node scripts/build-blog.js
 *
 * Env vars required:
 *   SANITY_PROJECT_ID  — Sanity project ID
 *   SANITY_DATASET     — usually "production"
 *   SANITY_TOKEN       — API token with at least "viewer" access
 */

const https = require('https');
const fs    = require('fs');
const path  = require('path');

// ── Config ──────────────────────────────────────────────────────────
const PROJECT_ID = process.env.SANITY_PROJECT_ID || '0n060c2j';
const DATASET    = process.env.SANITY_DATASET    || 'production';
const TOKEN      = process.env.SANITY_TOKEN;
const API_VER    = '2024-01-01';

// GROQ query — fetch all published (non-draft) posts, newest first
const QUERY = encodeURIComponent(
  `*[_type == "blogPost" && defined(slug.current) && !(_id in path("drafts.**"))] | order(publishedAt desc) {
    _id,
    title,
    "slug": slug.current,
    publishedAt,
    category,
    excerpt,
    body,
    "coverImageUrl": coverImage.asset->url
  }`
);

// ── Site shared CSS + nav/footer ────────────────────────────────────
const SHARED_CSS = `
  :root {
    --navy:    #0D1F3C;
    --accent:  #2AAEF5;
    --white:   #FFFFFF;
    --surface: #F0F7FF;
    --text:    #111827;
    --muted:   #64748B;
    --border:  #E2E8F0;
  }
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body { font-family: 'Inter', sans-serif; color: var(--text); background: var(--white); line-height: 1.6; }
  img  { max-width: 100%; display: block; }
  a    { color: inherit; text-decoration: none; }
  h1, h2, h3, h4 { font-family: 'Montserrat', sans-serif; line-height: 1.2; }
  .container { max-width: 1120px; margin: 0 auto; padding: 0 24px; }

  /* NAV */
  .nav { position: sticky; top: 0; z-index: 100; background: var(--white); border-bottom: 1px solid var(--border); }
  .nav__inner { display: flex; align-items: center; justify-content: space-between; height: 64px; }
  .nav__logo-wrap { display: flex; align-items: center; text-decoration: none; }
  .nav__logo-img { height: 52px; width: auto; display: block; }
  .nav__logo-fallback { font-family: 'Montserrat', sans-serif; font-weight: 800; font-size: 1.2rem; color: var(--navy); letter-spacing: -0.02em; }
  .nav__logo-fallback span { color: var(--accent); }
  .nav__links { display: flex; align-items: center; gap: 32px; list-style: none; }
  .nav__links a { color: var(--text); font-size: 0.875rem; font-weight: 500; transition: color 0.2s; }
  .nav__links a:hover, .nav__links a.active { color: var(--accent); }
  .nav__cta { background: var(--accent); color: var(--white) !important; padding: 8px 20px; border-radius: 6px; font-weight: 600 !important; transition: opacity 0.2s !important; }
  .nav__cta:hover { opacity: 0.9; }
  .nav__hamburger { display: none; flex-direction: column; gap: 5px; cursor: pointer; padding: 4px; }
  .nav__hamburger span { width: 24px; height: 2px; background: var(--navy); border-radius: 2px; transition: all 0.3s; }
  @media (max-width: 768px) {
    .nav__hamburger { display: flex; }
    .nav__links { display: none; position: absolute; top: 64px; left: 0; right: 0; background: var(--white); flex-direction: column; align-items: flex-start; padding: 16px 24px 24px; gap: 16px; border-bottom: 1px solid var(--border); }
    .nav__links.open { display: flex; }
  }

  /* FOOTER */
  .footer { background: #0A1829; padding: 48px 0 32px; color: rgba(255,255,255,0.6); }
  .footer__grid { display: grid; grid-template-columns: 1.5fr 1fr 1fr; gap: 40px; margin-bottom: 40px; }
  @media (max-width: 768px) { .footer__grid { grid-template-columns: 1fr; gap: 28px; } }
  .footer__logo-img { height: 40px; width: auto; display: block; margin-bottom: 10px; }
  .footer__tagline { font-size: 0.85rem; line-height: 1.6; max-width: 260px; }
  .footer__col h4 { font-size: 0.75rem; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: rgba(255,255,255,0.4); margin-bottom: 14px; }
  .footer__col ul { list-style: none; display: flex; flex-direction: column; gap: 8px; }
  .footer__col li a { font-size: 0.875rem; color: rgba(255,255,255,0.6); transition: color 0.2s; }
  .footer__col li a:hover { color: var(--white); }
  .footer__bottom { border-top: 1px solid rgba(255,255,255,0.08); padding-top: 24px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; font-size: 0.8rem; }
`;

// base: '../' for blog/index.html, '../../' for blog/[slug]/index.html
const NAV_HTML = (activePage = '', base = '../') => `
  <nav class="nav" role="navigation" aria-label="Main navigation">
    <div class="container nav__inner">
      <a href="${base}index.html" class="nav__logo-wrap">
        <img src="${base}assets/logo.jpg" alt="RyanFulfil" class="nav__logo-img"
             onerror="this.style.display='none';this.nextElementSibling.style.display='inline';" />
        <span class="nav__logo-fallback" style="display:none;">Ryan<span>Fulfil</span></span>
      </a>
      <button class="nav__hamburger" id="navToggle" aria-label="Toggle menu" aria-expanded="false">
        <span></span><span></span><span></span>
      </button>
      <ul class="nav__links" id="navLinks" role="list">
        <li><a href="${base}how-it-works.html">How It Works</a></li>
        <li><a href="${base}services.html">Services</a></li>
        <li><a href="${base}why-ryanfulfil.html">Why RyanFulfil</a></li>
        <li><a href="${base}faq.html">FAQ</a></li>
        <li><a href="${base}blog/index.html"${activePage === 'blog' ? ' class="active"' : ''}>Blog</a></li>
        <li><a href="${base}games.html">Games</a></li>
        <li><a href="${base}contact.html" class="nav__cta">Get a Quote</a></li>
      </ul>
    </div>
  </nav>`;

const FOOTER_HTML = (base = '../') => `
  <footer class="footer" role="contentinfo">
    <div class="container">
      <div class="footer__grid">
        <div>
          <img src="${base}assets/logo-dark.jpg" alt="RyanFulfil" class="footer__logo-img"
               onerror="this.style.display='none';this.nextElementSibling.style.display='block';" />
          <span style="display:none;font-family:'Montserrat',sans-serif;font-weight:800;font-size:1.1rem;color:#fff;">Ryan<span style="color:#2AAEF5">Fulfil</span></span>
          <p class="footer__tagline">Reliable Sourcing. Responsive Service. Reach Worldwide.</p>
        </div>
        <div class="footer__col">
          <h4>Pages</h4>
          <ul>
            <li><a href="${base}how-it-works.html">How It Works</a></li>
            <li><a href="${base}services.html">Services</a></li>
            <li><a href="${base}why-ryanfulfil.html">Why RyanFulfil</a></li>
            <li><a href="${base}faq.html">FAQ</a></li>
            <li><a href="${base}blog/index.html">Blog</a></li>
            <li><a href="${base}games.html">Games</a></li>
          </ul>
        </div>
        <div class="footer__col">
          <h4>Contact</h4>
          <ul>
            <li><a href="https://wa.me/8617846669989" target="_blank" rel="noopener">WhatsApp</a></li>
            <li><a href="${base}contact.html">Get a Quote</a></li>
          </ul>
        </div>
      </div>
      <div class="footer__bottom">
        <span>&copy; 2025 RyanFulfil. All rights reserved.</span>
      </div>
    </div>
  </footer>`;

const NAV_JS = `
  <script>
    const t = document.getElementById('navToggle');
    const l = document.getElementById('navLinks');
    if (t) t.addEventListener('click', () => {
      const open = l.classList.toggle('open');
      t.setAttribute('aria-expanded', String(open));
    });
  </script>`;

// ── Portable Text → HTML converter ──────────────────────────────────
function portableTextToHtml(blocks) {
  if (!blocks || !Array.isArray(blocks)) return '';

  return blocks.map(block => {
    if (block._type === 'image') {
      const imgUrl = block.asset?.url || '';
      const caption = block.caption || '';
      if (!imgUrl) return '';
      return `<figure class="post-figure">
        <img src="${imgUrl}" alt="${caption}" loading="lazy" />
        ${caption ? `<figcaption>${caption}</figcaption>` : ''}
      </figure>`;
    }

    if (block._type !== 'block') return '';

    const children = (block.children || []).map(child => {
      let text = (child.text || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      const marks = child.marks || [];
      if (marks.includes('strong')) text = `<strong>${text}</strong>`;
      if (marks.includes('em'))     text = `<em>${text}</em>`;
      return text;
    }).join('');

    switch (block.style) {
      case 'h2':         return `<h2>${children}</h2>`;
      case 'h3':         return `<h3>${children}</h3>`;
      case 'blockquote': return `<blockquote>${children}</blockquote>`;
      default:           return children ? `<p>${children}</p>` : '';
    }
  }).join('\n');
}

// ── Format date ──────────────────────────────────────────────────────
function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

// ── Category label ───────────────────────────────────────────────────
const CAT_LABELS = {
  'sourcing-tips': 'Sourcing Tips',
  'shipping':      'Shipping & Logistics',
  'quality':       'Product Quality',
  'branding':      'Branding & Private Label',
  'qa':            'Q&A',
  'news':          'News & Updates',
};
function catLabel(cat) { return CAT_LABELS[cat] || cat || 'General'; }

// ── Generate blog/index.html ─────────────────────────────────────────
function generateIndex(posts) {
  const cards = posts.length === 0
    ? `<div class="blog-empty">
        <p>No posts yet. Check back soon.</p>
      </div>`
    : posts.map(post => {
        const cover = post.coverImageUrl
          ? `<div class="card__cover"><img src="${post.coverImageUrl}" alt="${post.title}" loading="lazy" /></div>`
          : `<div class="card__cover card__cover--placeholder"></div>`;
        return `
        <article class="blog-card">
          <a href="${post.slug}/index.html" class="card__link-wrap">
            ${cover}
            <div class="card__body">
              ${post.category ? `<span class="card__cat">${catLabel(post.category)}</span>` : ''}
              <h2 class="card__title">${post.title}</h2>
              ${post.excerpt ? `<p class="card__excerpt">${post.excerpt}</p>` : ''}
              <div class="card__meta">
                <time datetime="${post.publishedAt}">${formatDate(post.publishedAt)}</time>
                <span class="card__read">Read post &rarr;</span>
              </div>
            </div>
          </a>
        </article>`;
      }).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Blog | RyanFulfil</title>
  <meta name="description" content="Sourcing tips, shipping guides, and industry insights from RyanFulfil — a China-based dropshipping fulfilment agent since 2018." />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Montserrat:wght@700;800&display=swap" rel="stylesheet" />
  <style>
    ${SHARED_CSS}
    /* HERO */
    .hero { background: var(--navy); padding: 72px 0 64px; text-align: center; }
    .hero__label { display: inline-block; background: rgba(42,174,245,0.15); color: var(--accent); font-size: 0.8rem; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; padding: 6px 14px; border-radius: 20px; margin-bottom: 20px; }
    .hero h1 { color: var(--white); font-size: clamp(2rem,5vw,3rem); font-weight: 800; margin-bottom: 16px; }
    .hero__sub { color: rgba(255,255,255,0.65); font-size: 1.05rem; max-width: 480px; margin: 0 auto; }

    /* BLOG GRID */
    .blog-section { padding: 72px 0 88px; }
    .blog-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 28px; }
    @media (max-width: 900px) { .blog-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 600px) { .blog-grid { grid-template-columns: 1fr; } }

    .blog-card { border: 1.5px solid var(--border); border-radius: 14px; overflow: hidden; transition: box-shadow 0.2s, transform 0.2s; display: flex; flex-direction: column; background: var(--white); }
    .blog-card:hover { box-shadow: 0 8px 32px rgba(13,31,60,0.1); transform: translateY(-2px); }
    .card__link-wrap { display: flex; flex-direction: column; flex: 1; color: inherit; text-decoration: none; }
    .card__cover { height: 200px; overflow: hidden; background: var(--surface); }
    .card__cover img { width: 100%; height: 100%; object-fit: cover; }
    .card__cover--placeholder { background: linear-gradient(135deg, var(--surface) 0%, #dbeafe 100%); }
    .card__body { padding: 24px; display: flex; flex-direction: column; gap: 10px; flex: 1; }
    .card__cat { font-size: 0.72rem; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--accent); }
    .card__title { font-size: 1.1rem; font-family: 'Montserrat', sans-serif; font-weight: 700; color: var(--navy); line-height: 1.3; }
    .card__excerpt { font-size: 0.875rem; color: var(--muted); line-height: 1.6; flex: 1; }
    .card__meta { display: flex; align-items: center; justify-content: space-between; margin-top: auto; padding-top: 12px; border-top: 1px solid var(--border); font-size: 0.8rem; color: var(--muted); }
    .card__read { color: var(--accent); font-weight: 600; }
    .blog-empty { text-align: center; padding: 80px 0; color: var(--muted); font-size: 1.05rem; }
  </style>
</head>
<body>

${NAV_HTML('blog', '../')}

<header class="hero">
  <div class="container">
    <div class="hero__label">Blog</div>
    <h1>Sourcing Tips &amp; Insights</h1>
    <p class="hero__sub">Practical guides from 6+ years of dropshipping fulfilment experience.</p>
  </div>
</header>

<section class="blog-section">
  <div class="container">
    <div class="blog-grid">
      ${cards}
    </div>
  </div>
</section>

${FOOTER_HTML('../')}
${NAV_JS}
</body>
</html>`;
}

// ── Generate blog/[slug]/index.html ──────────────────────────────────
function generatePost(post, allPosts) {
  const bodyHtml = portableTextToHtml(post.body);

  // Next / prev links
  const idx  = allPosts.findIndex(p => p.slug === post.slug);
  const prev = allPosts[idx + 1];
  const next = allPosts[idx - 1];
  const navLinks = `
    <nav class="post-nav">
      ${prev ? `<a href="../${prev.slug}/index.html" class="post-nav__link post-nav__link--prev">
        <span class="post-nav__dir">&larr; Previous</span>
        <span class="post-nav__title">${prev.title}</span>
      </a>` : '<span></span>'}
      ${next ? `<a href="../${next.slug}/index.html" class="post-nav__link post-nav__link--next">
        <span class="post-nav__dir">Next &rarr;</span>
        <span class="post-nav__title">${next.title}</span>
      </a>` : '<span></span>'}
    </nav>`;

  const coverHtml = post.coverImageUrl
    ? `<div class="post-cover"><img src="${post.coverImageUrl}" alt="${post.title}" /></div>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${post.title} | RyanFulfil Blog</title>
  <meta name="description" content="${(post.excerpt || '').replace(/"/g,'&quot;')}" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Montserrat:wght@700;800&display=swap" rel="stylesheet" />
  <style>
    ${SHARED_CSS}

    /* POST LAYOUT */
    .post-hero { background: var(--navy); padding: 64px 0 48px; }
    .post-hero__inner { max-width: 760px; margin: 0 auto; }
    .post-hero__back { display: inline-flex; align-items: center; gap: 6px; color: rgba(255,255,255,0.55); font-size: 0.85rem; margin-bottom: 24px; transition: color 0.2s; }
    .post-hero__back:hover { color: var(--white); }
    .post-hero__cat { display: inline-block; background: rgba(42,174,245,0.15); color: var(--accent); font-size: 0.75rem; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; padding: 5px 12px; border-radius: 20px; margin-bottom: 18px; }
    .post-hero h1 { color: var(--white); font-size: clamp(1.6rem,4vw,2.5rem); font-weight: 800; margin-bottom: 16px; line-height: 1.2; }
    .post-hero__meta { color: rgba(255,255,255,0.5); font-size: 0.875rem; }

    .post-cover { max-width: 760px; margin: 0 auto; padding: 0 24px; margin-top: -24px; margin-bottom: 48px; }
    .post-cover img { width: 100%; border-radius: 12px; box-shadow: 0 12px 48px rgba(13,31,60,0.15); }

    .post-body-wrap { max-width: 760px; margin: 0 auto; padding: 48px 24px 88px; }
    .post-body p  { margin-bottom: 1.4em; font-size: 1.05rem; line-height: 1.8; color: var(--text); }
    .post-body h2 { font-family: 'Montserrat', sans-serif; font-size: 1.5rem; color: var(--navy); margin: 2em 0 0.6em; }
    .post-body h3 { font-family: 'Montserrat', sans-serif; font-size: 1.15rem; color: var(--navy); margin: 1.6em 0 0.5em; }
    .post-body blockquote { border-left: 4px solid var(--accent); margin: 2em 0; padding: 16px 24px; background: var(--surface); border-radius: 0 8px 8px 0; font-style: italic; color: var(--muted); }
    .post-body strong { color: var(--navy); }
    .post-figure { margin: 2em 0; }
    .post-figure img { border-radius: 8px; width: 100%; }
    .post-figure figcaption { text-align: center; font-size: 0.85rem; color: var(--muted); margin-top: 8px; }

    /* POST NAV */
    .post-nav { display: flex; justify-content: space-between; gap: 16px; border-top: 1px solid var(--border); padding-top: 40px; margin-top: 40px; }
    .post-nav__link { display: flex; flex-direction: column; gap: 4px; max-width: 45%; }
    .post-nav__link--next { text-align: right; margin-left: auto; }
    .post-nav__dir { font-size: 0.8rem; color: var(--muted); }
    .post-nav__title { font-family: 'Montserrat', sans-serif; font-weight: 700; font-size: 0.9rem; color: var(--navy); transition: color 0.2s; }
    .post-nav__link:hover .post-nav__title { color: var(--accent); }

    /* CTA */
    .post-cta { background: var(--navy); border-radius: 16px; padding: 48px; text-align: center; margin-top: 64px; }
    .post-cta h3 { font-family: 'Montserrat', sans-serif; font-weight: 800; font-size: 1.4rem; color: var(--white); margin-bottom: 12px; }
    .post-cta p { color: rgba(255,255,255,0.65); margin-bottom: 28px; }
    .post-cta a { display: inline-block; background: var(--accent); color: var(--white); font-weight: 700; padding: 14px 32px; border-radius: 8px; transition: opacity 0.2s; }
    .post-cta a:hover { opacity: 0.9; }
  </style>
</head>
<body>

${NAV_HTML('blog', '../../')}

<header class="post-hero">
  <div class="container">
    <div class="post-hero__inner">
      <a href="../index.html" class="post-hero__back">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M10.5 3L5.5 8l5 5" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
        Back to blog
      </a>
      ${post.category ? `<div class="post-hero__cat">${catLabel(post.category)}</div>` : ''}
      <h1>${post.title}</h1>
      <div class="post-hero__meta">
        <time datetime="${post.publishedAt}">${formatDate(post.publishedAt)}</time>
      </div>
    </div>
  </div>
</header>

${coverHtml}

<div class="post-body-wrap">
  <div class="post-body">
    ${bodyHtml}
  </div>

  ${navLinks}

  <div class="post-cta">
    <h3>Ready to start sourcing?</h3>
    <p>Tell us what you need and we'll get back to you on WhatsApp.</p>
    <a href="../../contact.html">Get a free quote</a>
  </div>
</div>

${FOOTER_HTML('../../')}
${NAV_JS}
</body>
</html>`;
}

// ── Fetch posts from Sanity ──────────────────────────────────────────
function fetchPosts() {
  return new Promise((resolve, reject) => {
    const url = `https://${PROJECT_ID}.api.sanity.io/v${API_VER}/data/query/${DATASET}?query=${QUERY}`;
    const opts = {
      headers: TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {},
    };
    https.get(url, opts, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.result || []);
        } catch (e) {
          reject(new Error(`Failed to parse Sanity response: ${e.message}`));
        }
      });
    }).on('error', reject);
  });
}

// ── Main ─────────────────────────────────────────────────────────────
async function main() {
  console.log('Fetching posts from Sanity...');
  const posts = await fetchPosts();
  console.log(`Found ${posts.length} published post(s).`);

  // Ensure blog/ directory exists
  const blogDir = path.join(process.cwd(), 'blog');
  if (!fs.existsSync(blogDir)) fs.mkdirSync(blogDir, { recursive: true });

  // Write blog/index.html
  fs.writeFileSync(path.join(blogDir, 'index.html'), generateIndex(posts), 'utf8');
  console.log('Generated blog/index.html');

  // Write individual post pages
  for (const post of posts) {
    const postDir = path.join(blogDir, post.slug);
    if (!fs.existsSync(postDir)) fs.mkdirSync(postDir, { recursive: true });
    fs.writeFileSync(path.join(postDir, 'index.html'), generatePost(post, posts), 'utf8');
    console.log(`Generated blog/${post.slug}/index.html`);
  }

  console.log('Blog build complete.');
}

main().catch(err => {
  console.error('Build failed:', err.message);
  process.exit(1);
});
