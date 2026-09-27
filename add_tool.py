#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Add a new tool to Muexe.

Interactive:  python add_tool.py
Scripted:     python add_tool.py "Percentage Calculator" --cat calculators --icon "％"
Dry run:      python add_tool.py "Percentage Calculator" --cat calculators --dry-run

It fills all SEO fields from templates, optionally scaffolds the widget files,
then rebuilds the site (header/footer are auto-inherited by build.py).
"""
import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "src"
TOOLS_JSON = SRC / "tools.json"
CONTENT_DIR = SRC / "content"

CAT_KEYS = ["converters", "image", "calculators", "text"]
DEFAULT_ICON = "🔧"


def slugify(s: str) -> str:
    s = s.lower().strip()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return re.sub(r"-+", "-", s).strip("-")


def make_entry(name, cat, slug, icon, short_desc):
    key = name.lower()
    return {
        "slug": slug,
        "name": name,
        "icon": icon,
        "category": cat,
        "title": f"{name} – Free Online Tool | Muexe",
        "description": f"{name} online for free. Fast, private and easy to use — works right in your browser with no sign-up or download required.",
        "keywords": f"{key}, free {key}, online {key}, {key} tool",
        "short_desc": short_desc or f"{name} — fast, free and 100% private.",
        "lead": f"Use our free {name} instantly in your browser. No sign-up, no upload — your data never leaves your device.",
        "features": [
            "Instant results with no waiting",
            "100% free with no sign-up required",
            "Runs locally — your data never leaves your device",
        ],
        "how_to_use": [
            "Enter your input in the box.",
            "Click the button to run the tool.",
            "Copy or download the result.",
        ],
        "faq": [
            {"q": f"Is this {name} really free?",
             "a": "Yes. It is completely free with no hidden limits and no account required."},
            {"q": "Is my data uploaded to a server?",
             "a": "No. Everything runs locally in your browser, so your data never leaves your device."},
            {"q": "Does it work on mobile?",
             "a": "Yes, the tool works on any device with a modern browser — desktop, tablet or phone."},
        ],
    }


WIDGET_HTML = """<div class="tool-widget">
  <div class="form-row">
    <label for="{slug}-input">Your input</label>
    <textarea id="{slug}-input" placeholder="Type or paste here…"></textarea>
  </div>
  <button class="btn" id="{slug}-run" type="button">Run</button>
  <div class="result-box" id="{slug}-result" style="display:none"></div>
</div>
"""

WIDGET_JS = """(function () {
  var run = document.getElementById('{slug}-run');
  var input = document.getElementById('{slug}-input');
  var result = document.getElementById('{slug}-result');
  if (!run || !input || !result) return;
  run.addEventListener('click', function () {
    var value = input.value;
    result.style.display = 'block';
    // TODO: replace the line below with your real logic
    result.textContent = value;
  });
})();
"""


def interactive():
    data = json.loads(TOOLS_JSON.read_text(encoding="utf-8"))
    print("=== Add a new tool to Muexe ===")
    name = ""
    while not name:
        name = input("Tool name (e.g. Percentage Calculator): ").strip()

    print("\nCategories:")
    for i, c in enumerate(data["categories"], 1):
        print(f"  {i}. {c['label']} ({c['key']})")
    cat = None
    while cat not in CAT_KEYS:
        s = input("Pick a category number: ").strip()
        if s.isdigit() and 1 <= int(s) <= len(data["categories"]):
            cat = data["categories"][int(s) - 1]["key"]

    slug = input(f"URL slug [{slugify(name)}]: ").strip() or slugify(name)
    icon = input(f"Icon emoji [{DEFAULT_ICON}]: ").strip() or DEFAULT_ICON
    short = input("One-line card description [auto]: ").strip()

    make_widget = input("Generate a starter widget (html+js)? [Y/n]: ").strip().lower()
    return make_entry(name, cat, slug, icon, short), make_widget != "n"


def write_entry(entry, make_widget):
    data = json.loads(TOOLS_JSON.read_text(encoding="utf-8"))
    slugs = {t["slug"] for t in data["tools"]}
    if entry["slug"] in slugs:
        print(f"[ERROR] slug '{entry['slug']}' already exists. Choose a different name/slug.")
        sys.exit(1)
    data["tools"].append(entry)
    TOOLS_JSON.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

    if make_widget:
        (CONTENT_DIR / f'{entry["slug"]}.html').write_text(
            WIDGET_HTML.replace("{slug}", entry["slug"]), encoding="utf-8"
        )
        (CONTENT_DIR / f'{entry["slug"]}.js').write_text(
            WIDGET_JS.replace("{slug}", entry["slug"]), encoding="utf-8"
        )

    print(f"\n[OK] Added '{entry['name']}' ({entry['slug']}) to tools.json")
    if make_widget:
        print(f"[OK] Scaffolded src/content/{entry['slug']}.html + .js")


def main():
    parser = argparse.ArgumentParser(description="Add a tool to Muexe")
    parser.add_argument("name", nargs="?", help="Tool name")
    parser.add_argument("--cat", choices=CAT_KEYS, help="Category key")
    parser.add_argument("--slug", help="URL slug (default: derived from name)")
    parser.add_argument("--icon", default=DEFAULT_ICON, help="Emoji icon")
    parser.add_argument("--short", help="One-line card description")
    parser.add_argument("--dry-run", action="store_true", help="Print entry without writing")
    args = parser.parse_args()

    if args.name:
        if not args.cat:
            print("--cat is required in scripted mode. Choose: " + ", ".join(CAT_KEYS))
            sys.exit(1)
        entry = make_entry(args.name, args.cat, args.slug or slugify(args.name), args.icon, args.short)
        if args.dry_run:
            print(json.dumps(entry, ensure_ascii=False, indent=2))
            return
        write_entry(entry, make_widget=True)
    else:
        entry, make_widget = interactive()
        write_entry(entry, make_widget)

    # Rebuild so home/nav/sitemap/search/footer all update (header+footer inherited)
    print("\nRebuilding site…")
    subprocess.run([sys.executable, str(ROOT / "build.py")], check=True)


if __name__ == "__main__":
    main()
