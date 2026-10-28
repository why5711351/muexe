#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Submit all sitemap URLs to IndexNow (Bing/Yandex) for near-instant indexing.

Run AFTER the site is deployed (the key file must be live at
https://muexe.com/{KEY}.txt before IndexNow accepts submissions).

Usage:  python indexnow.py
"""
import json
import re
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DIST = ROOT / "dist"

HOST = "muexe.com"
KEY = "d9b51c2aeece41c6b16a94cd2ecb0328"
KEY_LOCATION = f"https://{HOST}/{KEY}.txt"

INDEXNOW_ENDPOINTS = [
    "https://api.indexnow.org/indexnow",
    "https://www.bing.com/indexnow",
]

UA = "Mozilla/5.0 (compatible; MuexeIndexNow/1.0; +https://muexe.com)"


def get_urls():
    xml = (DIST / "sitemap.xml").read_text(encoding="utf-8")
    return re.findall(r"<loc>([^<]+)</loc>", xml)


def post_json(url, payload):
    req = urllib.request.Request(
        url,
        data=payload,
        headers={
            "Content-Type": "application/json; charset=utf-8",
            "User-Agent": UA,
        },
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.status


def submit(urls):
    payload = json.dumps({
        "host": HOST,
        "key": KEY,
        "keyLocation": KEY_LOCATION,
        "urlList": urls,
    }).encode("utf-8")
    for ep in INDEXNOW_ENDPOINTS:
        try:
            code = post_json(ep, payload)
            print(f"[OK]   IndexNow {ep} -> HTTP {code}")
        except Exception as e:
            print(f"[FAIL] IndexNow {ep} -> {e}")


def ping_sitemap():
    """Legacy sitemap ping (Google's endpoint is deprecated but harmless)."""
    sitemap = f"https://{HOST}/sitemap.xml"
    for ep in (
        f"https://www.google.com/ping?sitemap={sitemap}",
        f"https://www.bing.com/ping?sitemap={sitemap}",
    ):
        try:
            req = urllib.request.Request(ep, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=30) as r:
                print(f"[OK]   ping {ep.split('?')[0]} -> HTTP {r.status}")
        except Exception as e:
            print(f"[skip] ping {ep.split('?')[0]} -> {e}")


if __name__ == "__main__":
    urls = get_urls()
    print(f"[i] Submitting {len(urls)} URLs to IndexNow...")
    submit(urls)
    ping_sitemap()
