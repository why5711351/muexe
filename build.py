#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Muexe static site builder.

Reads src/tools.json + src/partials + src/content and emits a fully static
SEO-optimized site into dist/. Run:  python build.py
"""
import json
import shutil
from datetime import date
from pathlib import Path
from urllib.parse import quote

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "src"
ASSETS = ROOT / "assets"
DIST = ROOT / "dist"

# ----------------------------------------------------------------------------
# Configuration — edit these before going live
# ----------------------------------------------------------------------------
SITE_URL = "https://muexe.com"
ADSENSE_CLIENT = ""          # e.g. "ca-pub-1234567890123456" (leave empty = placeholder)
ADSENSE_SLOT = ""            # e.g. "0000000000"
GA_ID = ""                   # e.g. "G-XXXXXXXXXX" (optional)
YEAR = str(date.today().year)

# ----------------------------------------------------------------------------
# Load data
# ----------------------------------------------------------------------------
data = json.loads((SRC / "tools.json").read_text(encoding="utf-8"))
site = data["site"]
categories = data["categories"]
tools = data["tools"]
cat_map = {c["key"]: c for c in categories}
tools_by_cat = {c["key"]: [] for c in categories}
for t in tools:
    tools_by_cat[t["category"]].append(t)


def read_partial(name: str) -> str:
    return (SRC / "partials" / name).read_text(encoding="utf-8")


HEADER_TPL = read_partial("header.html")
FOOTER_TPL = read_partial("footer.html")


# ----------------------------------------------------------------------------
# Reusable fragments
# ----------------------------------------------------------------------------
def build_nav() -> str:
    parts = ['<a href="/">Home</a>']
    for c in categories:
        items = tools_by_cat.get(c["key"], [])
        links = "".join(
            f'<a href="/{t["slug"]}.html">{t["name"]}</a>' for t in items
        )
        parts.append(
            f'<div class="has-dropdown">'
            f'<a class="dropdown-toggle" href="#{c["key"]}">{c["label"]} ▾</a>'
            f'<div class="dropdown-menu">{links}</div></div>'
        )
    return "".join(parts)


def render_header() -> str:
    return HEADER_TPL.replace("{{NAV_MENU}}", build_nav())


def render_footer() -> str:
    cat_links = "".join(
        f'<a href="/#{c["key"]}">{c["label"]}</a>' for c in categories
    )
    popular = tools[:6]
    pop_links = "".join(
        f'<a href="/{t["slug"]}.html">{t["name"]}</a>' for t in popular
    )
    return (
        FOOTER_TPL.replace("{{FOOTER_CATEGORIES}}", cat_links)
        .replace("{{FOOTER_POPULAR}}", pop_links)
    )


def ad_slot() -> str:
    if ADSENSE_CLIENT:
        ins = (
            f'<ins class="adsbygoogle" style="display:block" '
            f'data-ad-client="{ADSENSE_CLIENT}" data-ad-slot="{ADSENSE_SLOT}" '
            f'data-ad-format="auto" data-full-width-responsive="true"></ins>'
        )
        return (
            f'<div class="ad-slot"><span class="ad-label">Advertisement</span>'
            f'{ins}<script>(adsbygoogle = window.adsbygoogle || []).push({{}});</script></div>'
        )
    return (
        '<div class="ad-slot"><span class="ad-label">Advertisement</span>'
        'AdSense slot placeholder — set ADSENSE_CLIENT in build.py</div>'
    )


def analytics_head() -> str:
    scripts = []
    if ADSENSE_CLIENT:
        scripts.append(
            f'<script async src="https://pagead2.googlesyndication.com/pagead/js/'
            f'adsbygoogle.js?client={ADSENSE_CLIENT}" crossorigin="anonymous"></script>'
        )
    else:
        scripts.append(
            '<!-- Google AdSense: add ca-pub-XXXX script here after approval -->'
        )
    if GA_ID:
        scripts.append(
            f'<script async src="https://www.googletagmanager.com/gtag/js?id={GA_ID}"></script>'
            f'<script>window.dataLayer=window.dataLayer||[];'
            f'function gtag(){{dataLayer.push(arguments);}}gtag("js",new Date());'
            f'gtag("config","{GA_ID}");</script>'
        )
    return "".join(scripts)


# ----------------------------------------------------------------------------
# SEO head + structured data
# ----------------------------------------------------------------------------
def json_ld_tool(t) -> str:
    app = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": t["name"],
        "url": f'{SITE_URL}/{t["slug"]}.html',
        "description": t["description"],
        "applicationCategory": "UtilityApplication",
        "operatingSystem": "Any",
        "browserRequirements": "Requires JavaScript",
        "offers": {"@type": "Offer", "price": "0", "priceCurrency": "USD"},
    }
    breadcrumb = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Home", "item": SITE_URL + "/"},
            {"@type": "ListItem", "position": 2, "name": cat_map[t["category"]]["label"],
             "item": f'{SITE_URL}/#{t["category"]}'},
            {"@type": "ListItem", "position": 3, "name": t["name"],
             "item": f'{SITE_URL}/{t["slug"]}.html'},
        ],
    }
    faq = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": q["q"],
                "acceptedAnswer": {"@type": "Answer", "text": q["a"]},
            }
            for q in t["faq"]
        ],
    }
    howto = {
        "@context": "https://schema.org",
        "@type": "HowTo",
        "name": "How to use " + t["name"],
        "step": [
            {"@type": "HowToStep", "position": i + 1, "text": s}
            for i, s in enumerate(t["how_to_use"])
        ],
    }
    blocks = [app, breadcrumb, faq, howto]
    return "".join(f'<script type="application/ld+json">{json.dumps(b, ensure_ascii=False)}</script>' for b in blocks)


def og_image(t=None) -> str:
    # 1200x630 default; Pinterest uses a 2:3 pin image (see pin_image below)
    if t:
        return f'{SITE_URL}/assets/img/og/{t["slug"]}.png'
    return f'{SITE_URL}/assets/img/og/og-home.png'


def seo_head(t=None, is_home=False, title=None, desc=None, canonical=None) -> str:
    t_title = title or (t["title"] if t else site["title"])
    t_desc = desc or (t["description"] if t else site["description"])
    t_keywords = (t["keywords"] if t else site["keywords"])
    t_canonical = canonical or (f'{SITE_URL}/{t["slug"]}.html' if t else SITE_URL + "/")
    t_og_img = og_image(t if t else None)
    return f"""
<title>{t_title}</title>
<meta name="description" content="{t_desc}">
<meta name="keywords" content="{t_keywords}">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="canonical" href="{t_canonical}">
<link rel="icon" type="image/svg+xml" href="/assets/img/favicon.svg">
<link rel="stylesheet" href="/assets/css/style.css">

<!-- Open Graph (Facebook) -->
<meta property="og:type" content="website">
<meta property="og:site_name" content="{site['name']} — {site['tagline']}">
<meta property="og:title" content="{t_title}">
<meta property="og:description" content="{t_desc}">
<meta property="og:url" content="{t_canonical}">
<meta property="og:image" content="{t_og_img}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="en_US">

<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{t_title}">
<meta name="twitter:description" content="{t_desc}">
<meta name="twitter:image" content="{t_og_img}">

<!-- Pinterest Rich Pin -->
<meta property="pinterest-rich-pin" content="true">
{analytics_head()}
"""


def social_share(t) -> str:
    url = quote(f'{SITE_URL}/{t["slug"]}.html', safe='')
    pin_img = quote(f'{SITE_URL}/assets/img/pin/{t["slug"]}.png', safe='')
    desc = quote(t["description"], safe='')
    title = quote(t["name"], safe='')
    return f"""
<div class="share-row" aria-label="Share this tool">
  <a class="share-btn fb" href="https://www.facebook.com/sharer/sharer.php?u={url}" target="_blank" rel="noopener">Share on Facebook</a>
  <a class="share-btn pin" href="https://www.pinterest.com/pin/create/button/?url={url}&amp;media={pin_img}&amp;description={desc}" target="_blank" rel="noopener">Save to Pinterest</a>
  <a class="share-btn tw" href="https://twitter.com/intent/tweet?url={url}&amp;text={title}" target="_blank" rel="noopener">Share on X</a>
</div>"""


def breadcrumb_html(t) -> str:
    cat = cat_map[t["category"]]
    return (
        '<nav class="breadcrumb" aria-label="Breadcrumb">'
        f'<a href="/">Home</a><span class="sep">›</span>'
        f'<a href="/#{t["category"]}">{cat["label"]}</a><span class="sep">›</span>'
        f'<span>{t["name"]}</span></nav>'
    )


def about_html(t) -> str:
    """SSR-rendered 'About' content: what it solves, how it works, assumptions.

    This is the crawlable body that Google, AI crawlers and AdSense reviewers
    read. It must be plain HTML in the source — never injected by JS.
    """
    parts = []
    if t.get("solves"):
        parts.append(f'<h3>What this tool does</h3><p>{t["solves"]}</p>')
    if t.get("how_works"):
        parts.append(f'<h3>How it works</h3><p>{t["how_works"]}</p>')
    if t.get("assumptions"):
        parts.append(f'<h3>Assumptions</h3><p>{t["assumptions"]}</p>')
    return "".join(parts)


def related_tools(t) -> str:
    """Keyword-rich internal links to other tools in the same category."""
    cat = t["category"]
    related = [x for x in tools_by_cat[cat] if x["slug"] != t["slug"]]
    if not related:
        return ""
    links = "".join(
        f'<li><a href="/{r["slug"]}.html">{r["name"]}</a> — {r["short_desc"]}</li>'
        for r in related
    )
    return (
        f'<section class="related-tools">'
        f'<h2>Related {cat_map[cat]["label"].lower()} tools</h2>'
        f'<ul>{links}</ul></section>'
    )


def disclaimer_html(t) -> str:
    """Legal disclaimer for finance/health tools (rendered only when set)."""
    d = t.get("disclaimer")
    if not d:
        return ""
    return f'<aside class="disclaimer"><h2>Disclaimer</h2><p>{d}</p></aside>'


# ----------------------------------------------------------------------------
# Page builders
# ----------------------------------------------------------------------------
def tool_page(t) -> str:
    content_html = ""
    content_file = SRC / "content" / f'{t["slug"]}.html'
    if content_file.exists():
        content_html = content_file.read_text(encoding="utf-8")

    js = ""
    js_file = SRC / "content" / f'{t["slug"]}.js'
    if js_file.exists():
        js = f'<script>\n{js_file.read_text(encoding="utf-8")}\n</script>'

    features = "".join(f"<li>{f}</li>" for f in t["features"])
    steps = "".join(f"<li>{s}</li>" for s in t["how_to_use"])
    faqs = "".join(
        f'<details><summary>{q["q"]}</summary><p>{q["a"]}</p></details>'
        for q in t["faq"]
    )

    body = f"""
<main class="container tool-main">
  {breadcrumb_html(t)}
  <div class="tool-head">
    <h1>{t['name']}</h1>
    <p class="lead">{t['lead']}</p>
  </div>

  {content_html}

  {social_share(t)}

  <div class="prose">
    <h2>About the {t['name']}</h2>
    {about_html(t)}

    <h2>Key features</h2>
    <ul>{features}</ul>

    <h2>How to use the {t['name']}</h2>
    <ol>{steps}</ol>
  </div>

  {ad_slot()}

  <section class="faq">
    <h2>Frequently Asked Questions</h2>
    {faqs}
  </section>

  {related_tools(t)}

  {disclaimer_html(t)}
</main>
"""
    return (
        "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n<meta charset=\"UTF-8\">\n"
        + seo_head(t)
        + json_ld_tool(t)
        + "\n</head>\n<body>\n"
        + render_header()
        + body
        + render_footer()
        + '<script src="/assets/js/main.js"></script>\n'
        + js
        + "\n</body>\n</html>\n"
    )


def home_page() -> str:
    sections = []
    for c in categories:
        items = tools_by_cat.get(c["key"], [])
        cards = "".join(
            f'<div class="tool-card cat-{c["key"]}"><div class="tc-icon">{t["icon"]}</div>'
            f'<h3><a href="/{t["slug"]}.html">{t["name"]}</a></h3>'
            f'<p>{t["short_desc"]}</p></div>'
            for t in items
        )
        sections.append(
            f'<section id="{c["key"]}" class="container">'
            f'<h2 class="section-title">{c["label"]}</h2>'
            f'<div class="tools-grid">{cards}</div></section>'
        )

    # Home JSON-LD: WebSite + ItemList
    web_jsonld = json.dumps({
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": site["name"],
        "url": SITE_URL,
        "potentialAction": {
            "@type": "SearchAction",
            "target": f'{SITE_URL}/?q={{search_term_string}}',
            "query-input": "required name=search_term_string",
        },
    }, ensure_ascii=False)
    list_jsonld = json.dumps({
        "@context": "https://schema.org",
        "@type": "ItemList",
        "itemListElement": [
            {"@type": "ListItem", "position": i + 1, "name": t["name"],
             "url": f'{SITE_URL}/{t["slug"]}.html'}
            for i, t in enumerate(tools)
        ],
    }, ensure_ascii=False)

    hero_cats = "".join(
        f'<a href="#{c["key"]}">{c["label"]}</a>' for c in categories
    )
    body = f"""
<header class="hero">
  <div class="container hero-inner">
    <span class="hero-badge"><span class="dot"></span>{len(tools)} free tools &middot; no sign-up &middot; 100% private</span>
    <h1>Free Online Tools for <span class="grad">Everyday Tasks</span></h1>
    <p class="sub">Convert, compress, calculate and format — fast, free tools that run right in your browser. No sign-up, no downloads, your files never leave your device.</p>
    <div class="hero-cats">{hero_cats}</div>
  </div>
</header>
{''.join(sections)}
"""
    return (
        "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n<meta charset=\"UTF-8\">\n"
        + seo_head(is_home=True)
        + f'<script type="application/ld+json">{web_jsonld}</script>'
        + f'<script type="application/ld+json">{list_jsonld}</script>'
        + "\n</head>\n<body>\n"
        + render_header()
        + body
        + render_footer()
        + '<script src="/assets/js/main.js"></script>\n'
        + "\n</body>\n</html>\n"
    )


def static_page(title, desc, slug, body_html) -> str:
    canonical = f"{SITE_URL}/{slug}.html"
    head = seo_head(title=title, desc=desc, canonical=canonical)
    body = f'<main class="container tool-main"><div class="prose" style="max-width:800px"><h1>{title}</h1>{body_html}</div></main>'
    return (
        "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n<meta charset=\"UTF-8\">\n"
        + head + "\n</head>\n<body>\n"
        + render_header() + body + render_footer()
        + '<script src="/assets/js/main.js"></script>\n'
        + "\n</body>\n</html>\n"
    )


def build_static_pages():
    pages = {}
    pages["about"] = static_page(
        "About Muexe — Free Online Tools",
        "Muexe is a free, privacy-first collection of online tools. Learn about our mission to make everyday file, image and calculation tasks fast and free.",
        "about",
        """<p>Muexe is a collection of free, fast and privacy-friendly online tools. Our mission is simple: take the everyday tasks that used to require downloads, accounts or uploads — and make them instant, right in your browser.</p>
<p>Every tool on Muexe runs locally using modern browser technology. That means your files and data never leave your device, which is faster for you and better for your privacy.</p>
<h2>Why Muexe?</h2>
<ul><li><strong>Free</strong> — every tool is 100% free with no hidden limits.</li>
<li><strong>Private</strong> — files are processed locally, never uploaded.</li>
<li><strong>Fast</strong> — no waiting, no sign-up, works on any device.</li></ul>""",
    )
    pages["privacy"] = static_page(
        "Privacy Policy — Muexe",
        "Read the Muexe privacy policy. Learn how our browser-based tools keep your files and data private, and how we use cookies and advertising.",
        "privacy",
        """<p><em>Last updated: """ + YEAR + """</em></p>
<p>At Muexe, your privacy matters. This policy explains what data we collect and how we handle it.</p>
<h2>Files you process</h2>
<p>All tools run locally in your browser. Images, documents and text you process are <strong>never uploaded</strong> to our servers. We cannot see, store or access your files.</p>
<h2>Cookies &amp; analytics</h2>
<p>We may use cookies and analytics services (such as Google Analytics) to understand site usage and improve our tools. These may collect non-personal information such as pages visited, browser type and approximate region.</p>
<h2>Advertising</h2>
<p>We may display ads through third-party networks such as Google AdSense. These partners may use cookies to serve ads based on your prior visits to this and other websites. You can opt out of personalized advertising in your Google Ads Settings.</p>
<h2>Third-party links</h2>
<p>Our site may contain links to external websites. We are not responsible for the privacy practices of those sites.</p>
<h2>Contact</h2>
<p>If you have questions about this policy, contact us via the Contact page.</p>""",
    )
    pages["terms"] = static_page(
        "Terms of Use — Muexe",
        "The terms of use for Muexe.com. Our tools are provided free of charge and as-is, with no warranty.",
        "terms",
        """<p><em>Last updated: """ + YEAR + """</em></p>
<p>By using Muexe.com you agree to these terms.</p>
<h2>Use of the tools</h2>
<p>Our tools are provided free of charge for personal and commercial use. You are responsible for ensuring you have the rights to any content you process.</p>
<h2>No warranty</h2>
<p>All tools are provided "as is" without warranties of any kind. We do not guarantee results will be error-free or fit for any particular purpose.</p>
<h2>Limitation of liability</h2>
<p>Muexe is not liable for any damages arising from your use of the site or its tools.</p>
<h2>Changes</h2>
<p>We may update these terms at any time. Continued use of the site constitutes acceptance of the current terms.</p>""",
    )
    pages["contact"] = static_page(
        "Contact — Muexe",
        "Get in touch with the Muexe team for feedback, tool requests and support.",
        "contact",
        """<p>Have feedback, a bug report or a tool you'd like us to add? We'd love to hear from you.</p>
<p>Email us at <a href="mailto:hello@muexe.com">hello@muexe.com</a>.</p>
<p>We read every message and reply as quickly as we can.</p>""",
    )
    return pages


# ----------------------------------------------------------------------------
# Output files
# ----------------------------------------------------------------------------
def build_sitemap() -> str:
    urls = [SITE_URL + "/"]
    urls += [f'{SITE_URL}/{t["slug"]}.html' for t in tools]
    urls += [f"{SITE_URL}/{p}.html" for p in ["about", "privacy", "terms", "contact"]]
    entries = "".join(
        f"<url><loc>{u}</loc><lastmod>{date.today().isoformat()}</lastmod>"
        f"<changefreq>weekly</changefreq><priority>{'1.0' if u.endswith('/') else '0.8'}</priority></url>"
        for u in urls
    )
    return f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{entries}\n</urlset>\n'


def build_robots() -> str:
    return (
        "User-agent: *\n"
        "Allow: /\n\n"
        f"Sitemap: {SITE_URL}/sitemap.xml\n"
    )


def build_search_index() -> str:
    idx = [
        {"name": t["name"], "slug": t["slug"], "category": cat_map[t["category"]]["label"],
         "icon": t["icon"]}
        for t in tools
    ]
    return json.dumps(idx, ensure_ascii=False)


# ----------------------------------------------------------------------------
# Main
# ----------------------------------------------------------------------------
def main():
    if DIST.exists():
        shutil.rmtree(DIST)
    DIST.mkdir(parents=True)
    shutil.copytree(ASSETS, DIST / "assets")

    # tool pages
    for t in tools:
        (DIST / f'{t["slug"]}.html').write_text(tool_page(t), encoding="utf-8")

    # home
    (DIST / "index.html").write_text(home_page(), encoding="utf-8")

    # static pages
    for slug, html in build_static_pages().items():
        (DIST / f"{slug}.html").write_text(html, encoding="utf-8")

    # SEO assets
    (DIST / "sitemap.xml").write_text(build_sitemap(), encoding="utf-8")
    (DIST / "robots.txt").write_text(build_robots(), encoding="utf-8")
    (DIST / "assets" / "search.json").write_text(build_search_index(), encoding="utf-8")

    print(f"[OK] Built {len(tools)} tool pages + home + static pages into {DIST}")
    print(f"[OK] sitemap.xml, robots.txt, search.json generated")


if __name__ == "__main__":
    main()
