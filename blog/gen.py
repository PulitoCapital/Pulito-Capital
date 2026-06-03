#!/usr/bin/env python3
"""
璞合资本博客生成器
读取 articles.json → 渲染模板 → 生成文章 HTML + 列表页 + RSS + sitemap
"""
import json, os, shutil, glob
from datetime import datetime

BASE = os.path.dirname(os.path.abspath(__file__))
TEMPLATE = os.path.join(BASE, "template.html")
META_FILE = os.path.join(BASE, "articles.json")
OUT_DIR = os.path.join(BASE, "articles")
SITE_URL = "https://www.pulitocapital.com"

def load_articles():
    with open(META_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data["articles"]

def slugify(title):
    """Generate filename-friendly slug."""
    s = title.lower()
    for c in "，。！？、（）【】《》：；""''…·": s = s.replace(c, "")
    s = s.replace(" ", "-").replace("/", "-").replace("?", "").replace("!", "")
    # Keep only safe chars
    safe = "".join(c for c in s if c.isalnum() or c in "-_")
    return safe[:60] or "article"

def render_template(template_text, subs):
    """Replace {{KEY}} placeholders with values."""
    result = template_text
    for key, val in subs.items():
        result = result.replace("{{" + key + "}}", val)
    return result

def generate_articles(articles):
    os.makedirs(OUT_DIR, exist_ok=True)

    with open(TEMPLATE, "r", encoding="utf-8") as f:
        tmpl = f.read()

    for art in articles:
        slug = slugify(art["title"])
        art["slug"] = slug

        # Build tags HTML
        tags = art.get("tags", [])
        tags_html = "".join(f'<span>{t}</span>' for t in tags)

        subs = {
            "TITLE": art["title"],
            "EXCERPT": art["excerpt"],
            "AUTHOR": art["author"],
            "AUTHOR_ROLE": art["author_role"],
            "AUTHOR_INITIAL": art["author"][0],
            "DATE": art["date"],
            "DATE_DISPLAY": art["date_display"],
            "CATEGORY": art["category"],
            "SLUG": slug,
            "CONTENT": art["content"],
            "TAGS_HTML": tags_html
        }

        article_html = render_template(tmpl, subs)

        out_path = os.path.join(OUT_DIR, f"{slug}.html")
        with open(out_path, "w", encoding="utf-8") as f:
            f.write(article_html)

        print(f"  ✅ {slug}.html")

def generate_index(articles):
    """Generate blog listing page."""
    cards = []
    for art in articles:
        tags_html = "".join(f'<span>{t}</span>' for t in art.get("tags", []))
        cards.append(f"""
        <a href="articles/{art['slug']}.html" class="blog-card reveal">
          <div class="blog-card-hover"></div>
          <div class="blog-card-top">
            <span class="blog-badge">{art['category']}</span>
            <span class="blog-date">{art['date_display']}</span>
          </div>
          <h3>{art['title']}</h3>
          <p class="blog-excerpt">{art['excerpt']}</p>
          <div class="blog-meta">
            <div class="blog-author-mini">
              <div class="blog-avatar-mini">{art['author'][0]}</div>
              <span>{art['author']} · {art['author_role']}</span>
            </div>
            <div class="blog-link">阅读全文 →</div>
          </div>
          <div class="blog-tags">{tags_html}</div>
          <div class="blog-card-number">{articles.index(art)+1:02d}</div>
        </a>
        """)

    # Hero section + grid of cards
    index_html = f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>洞察 · 璞合资本</title>
  <meta name="description" content="璞合资本内容矩阵：AI Agent / AI硬件 / 出海赛道观察、BP实战指南、资本视角、合规法务">
  <link rel="alternate" type="application/rss+xml" title="璞合资本 RSS" href="/blog/rss.xml">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&family=Noto+Sans+SC:wght@400;500;600;700&family=Montserrat:wght@900&display=swap" rel="stylesheet">
  <script>document.documentElement.classList.add('js')</script>
  <style>
    *,*::before,*::after{{margin:0;padding:0;box-sizing:border-box}}
    :root{{--navy:#020C45;--navy-footer:#0A1A5C;--gold:#D4AF37;--text-muted:#8892B0;--font-en:'Inter','Noto Sans SC',sans-serif;--font-cn:'Noto Sans SC','Inter',sans-serif}}
    html{{scroll-behavior:smooth}}
    body{{font-family:var(--font-en);color:#fff;background:var(--navy);line-height:1.7;-webkit-font-smoothing:antialiased}}
    a{{text-decoration:none;color:inherit}}
    .container{{max-width:1100px;margin:0 auto;padding:0 24px}}
    .gold-divider{{width:48px;height:4px;background:var(--gold);border-radius:2px;margin-bottom:24px}}
    .js .reveal{{opacity:0;transform:translateY(20px);transition:opacity 0.6s ease,transform 0.6s ease}}
    .js .reveal.visible{{opacity:1;transform:translateY(0)}}
    .reveal-d1{{transition-delay:0.1s}}.reveal-d2{{transition-delay:0.2s}}.reveal-d3{{transition-delay:0.3s}}.reveal-d4{{transition-delay:0.4s}}

    .navbar{{position:fixed;top:0;left:0;right:0;z-index:1000;padding:12px 0;background:rgba(2,12,69,0.95);backdrop-filter:blur(12px);border-bottom:1px solid rgba(212,175,55,0.1)}}
    .navbar .container{{display:flex;align-items:center;justify-content:space-between;max-width:1200px}}
    .nav-logo{{display:flex;align-items:center;gap:10px}}
    .nav-logo svg{{width:28px;height:28px}}
    .nav-logo-text{{display:flex;flex-direction:column;line-height:1}}
    .nav-logo-text .cn{{font-family:var(--font-cn);font-size:14px;font-weight:500;letter-spacing:0.1em}}
    .nav-logo-text .en{{font-size:6px;font-weight:500;color:var(--gold);letter-spacing:0.2em;margin-top:3px}}
    .nav-links{{display:flex;gap:24px;list-style:none}}
    .nav-links a{{font-size:14px;color:var(--text-muted);transition:color 0.2s}}
    .nav-links a:hover,.nav-links a.active{{color:var(--gold);font-weight:600}}

    .blog-hero{{padding:120px 0 64px;text-align:center;position:relative;overflow:hidden}}
    .blog-hero::after{{content:'';position:absolute;bottom:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(212,175,55,0.3),transparent)}}
    .blog-hero h1{{font-size:clamp(2rem,4vw,3rem);font-weight:700;margin-bottom:20px;letter-spacing:-0.02em}}
    .blog-hero p{{font-size:clamp(1rem,1.8vw,1.25rem);color:var(--text-muted);max-width:700px;margin:0 auto 40px;line-height:1.7}}
    .blog-schedule{{display:flex;justify-content:center;gap:32px;flex-wrap:wrap;margin-top:40px}}
    .blog-schedule-item{{text-align:center;padding:12px 20px;border-radius:8px;background:rgba(10,26,92,0.4);border:1px solid rgba(212,175,55,0.15);min-width:120px}}
    .blog-schedule-item .time{{font-size:12px;color:var(--gold);font-weight:600}}
    .blog-schedule-item .persona{{font-size:14px;color:#fff;margin-top:4px}}
    .blog-schedule-item .topic{{font-size:11px;color:var(--text-muted);margin-top:2px}}

    .blog-grid{{padding:48px 0 96px}}
    .blog-grid .intro{{font-size:14px;color:var(--text-muted);margin-bottom:32px;text-align:center}}
    .blog-card{{display:block;padding:24px 28px;margin-bottom:24px;border-radius:8px;position:relative;overflow:hidden;background:var(--navy-footer);border:1px solid rgba(212,175,55,0.25);transition:all 0.3s;text-decoration:none}}
    .blog-card:hover{{transform:translateY(-4px);box-shadow:0 16px 32px rgba(0,0,0,0.3)}}
    .blog-card-hover{{position:absolute;inset:0;opacity:0;transition:opacity 0.3s;background:linear-gradient(135deg,rgba(212,175,55,0.08) 0%,transparent 100%);pointer-events:none}}
    .blog-card:hover .blog-card-hover{{opacity:1}}
    .blog-card-number{{position:absolute;top:16px;right:16px;font-size:48px;font-weight:700;color:var(--gold);opacity:0.04;pointer-events:none;line-height:1;user-select:none}}
    .blog-card-top{{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;position:relative;z-index:1}}
    .blog-badge{{font-size:11px;padding:2px 10px;border-radius:3px;background:rgba(212,175,55,0.1);border:1px solid rgba(212,175,55,0.2);color:var(--gold)}}
    .blog-date{{font-size:12px;color:var(--text-muted)}}
    .blog-card h3{{font-size:clamp(1.1rem,1.8vw,1.3rem);font-weight:700;color:#fff;margin-bottom:10px;line-height:1.4;position:relative;z-index:1}}
    .blog-excerpt{{font-size:14px;color:var(--text-muted);line-height:1.6;margin-bottom:16px;position:relative;z-index:1}}
    .blog-meta{{display:flex;justify-content:space-between;align-items:center;position:relative;z-index:1}}
    .blog-author-mini{{display:flex;align-items:center;gap:8px;font-size:12px;color:var(--text-muted)}}
    .blog-avatar-mini{{width:24px;height:24px;border-radius:50%;background:linear-gradient(135deg,var(--gold),rgba(212,175,55,0.3));display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:var(--navy);flex-shrink:0}}
    .blog-link{{font-size:13px;color:var(--gold);transition:all 0.2s}}
    .blog-card:hover .blog-link{{margin-right:4px}}
    .blog-tags{{display:flex;flex-wrap:wrap;gap:6px;margin-top:12px;position:relative;z-index:1}}
    .blog-tags span{{font-size:11px;padding:2px 8px;border-radius:3px;background:rgba(212,175,55,0.05);border:1px solid rgba(212,175,55,0.15);color:var(--text-muted)}}

    .page-footer{{background:var(--navy-footer);padding:32px 24px;text-align:center;font-size:13px;color:var(--text-muted);border-top:1px solid rgba(212,175,55,0.1)}}

    @media(max-width:600px){{.nav-links{{display:none}}.blog-schedule{{gap:12px}}}}
  </style>
</head>
<body>
  <nav class="navbar">
    <div class="container">
      <a href="/" class="nav-logo">
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="5" y="5" width="90" height="90" fill="#D4AF37" rx="1"/>
          <rect x="18" y="18" width="64" height="64" fill="#020C45" rx="0"/>
          <text x="50" y="50" text-anchor="middle" dominant-baseline="central" fill="#D4AF37" font-family="Montserrat,sans-serif" font-size="56" font-weight="900" letter-spacing="-2">P</text>
        </svg>
        <div class="nav-logo-text">
          <span class="cn">璞合资本</span>
          <span class="en">PULITO CAPITAL</span>
        </div>
      </a>
      <ul class="nav-links">
        <li><a href="/">首页</a></li>
        <li><a href="/blog/" class="active">洞察</a></li>
      </ul>
    </div>
  </nav>

  <section class="blog-hero">
    <div class="container">
      <div class="gold-divider" style="margin:0 auto 24px"></div>
      <h1>洞察 · 璞合内容矩阵</h1>
      <p>每天四位Agent从不同视角输出赛道观察、BP实战、资本动态与合规建议</p>
      <div class="blog-schedule">
        <div class="blog-schedule-item"><div class="time">09:00</div><div class="persona">🎯 Sage</div><div class="topic">赛道观察</div></div>
        <div class="blog-schedule-item"><div class="time">12:00</div><div class="persona">👩‍💼 Helen</div><div class="topic">BP · 路演实战</div></div>
        <div class="blog-schedule-item"><div class="time">15:00</div><div class="persona">📋 Iris</div><div class="topic">资本视角</div></div>
        <div class="blog-schedule-item"><div class="time">20:00</div><div class="persona">⚖️ Lex</div><div class="topic">合规 · 法务</div></div>
      </div>
    </div>
  </section>

  <section class="blog-grid">
    <div class="container">
      <p class="intro">共 {len(articles)} 篇文章 · 持续更新中</p>
      {"".join(cards)}
    </div>
  </section>

  <footer class="page-footer">
    <p>© 2026 璞合资本 Pulito Capital. All rights reserved.</p>
  </footer>

  <script>
    const obs=new IntersectionObserver(e=>e.forEach(t=>t.isIntersecting&&t.target.classList.add('visible')),{{threshold:0.05}});
    document.querySelectorAll('.reveal').forEach(e=>obs.observe(e));
    const check=()=>document.querySelectorAll('.reveal:not(.visible)').forEach(e=>{{const r=e.getBoundingClientRect();if(r.top<window.innerHeight&&r.bottom>0)e.classList.add('visible')}});
    [0,200,400,600,1000].forEach(t=>setTimeout(check,t));
    window.addEventListener('load',()=>setTimeout(check,500));
  </script>
</body>
</html>"""
    out_path = os.path.join(BASE, "index.html")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(index_html)
    print(f"  ✅ blog/index.html ({len(articles)} articles)")

def generate_rss(articles):
    rss = f"""<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>璞合资本 · 洞察</title>
  <link>{SITE_URL}/blog/</link>
  <description>AI Agent / AI硬件 / 出海赛道：Sage赛道观察 · Helen BP实战 · Iris资本视角 · Lex合规法务</description>
  <language>zh-CN</language>
  <lastBuildDate>{datetime.utcnow().strftime("%a, %d %b %Y %H:%M:%S +0000")}</lastBuildDate>
  <atom:link href="{SITE_URL}/blog/rss.xml" rel="self" type="application/rss+xml"/>
"""
    for art in articles:
        rss += f"""  <item>
    <title>{art['title']}</title>
    <link>{SITE_URL}/blog/articles/{art['slug']}.html</link>
    <description>{art['excerpt']}</description>
    <pubDate>{art.get('date_rfc', art['date'])}</pubDate>
    <author>{art['author']} · {art['author_role']}</author>
    <guid>{SITE_URL}/blog/articles/{art['slug']}.html</guid>
  </item>
"""
    rss += "</channel></rss>"
    out_path = os.path.join(BASE, "rss.xml")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(rss)
    print(f"  ✅ blog/rss.xml")

def generate_sitemap(articles):
    urls = [f"  <url><loc>{SITE_URL}/blog/</loc><changefreq>daily</changefreq><priority>0.8</priority></url>"]
    for art in articles:
        urls.append(f'  <url><loc>{SITE_URL}/blog/articles/{art["slug"]}.html</loc><lastmod>{art["date"]}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>')
    sitemap = f"""<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
{chr(10).join(urls)}
</urlset>"""
    out_path = os.path.join(BASE, "sitemap.xml")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(sitemap)
    print(f"  ✅ blog/sitemap.xml (SEO)")

def main():
    articles = load_articles()

    print(f"📝 Generating {len(articles)} articles...")
    generate_articles(articles)
    generate_index(articles)
    generate_rss(articles)
    generate_sitemap(articles)
    print(f"\n✅ Done! All files in {BASE}")

if __name__ == "__main__":
    main()
