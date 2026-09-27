#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Generate branded OG (1200x630) and Pinterest pin (1000x1500) images."""
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "src"
IMG = ROOT / "assets" / "img"

data = json.loads((SRC / "tools.json").read_text(encoding="utf-8"))
tools = data["tools"]

BLUE = (37, 99, 235)
BLUE_DARK = (30, 64, 175)
WHITE = (255, 255, 255)
GRAY = (100, 116, 139)

FONT_BOLD = "C:/Windows/Fonts/arialbd.ttf"
FONT_REG = "C:/Windows/Fonts/arial.ttf"


def font(size, bold=False):
    p = FONT_BOLD if bold else FONT_REG
    try:
        return ImageFont.truetype(p, size)
    except Exception:
        return ImageFont.load_default()


def wrap(draw, text, fnt, max_w):
    words = text.split()
    lines, cur = [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if draw.textlength(t, font=fnt) <= max_w:
            cur = t
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def centered(draw, text, fnt, fill, cx, cy):
    draw.text((cx, cy), text, font=fnt, fill=fill, anchor="mm")


def make_og(t=None):
    W, H = 1200, 630
    img = Image.new("RGB", (W, H), BLUE)
    d = ImageDraw.Draw(img, "RGBA")
    # decorative circles
    d.ellipse([880, -140, 1340, 320], fill=(255, 255, 255, 18))
    d.ellipse([-180, 420, 200, 800], fill=(255, 255, 255, 14))
    d.ellipse([1000, 430, 1260, 690], fill=(255, 255, 255, 22))

    # logo top-left
    d.rounded_rectangle([60, 50, 92, 82], radius=8, fill=WHITE)
    d.text((76, 66), "M", font=font(24, True), fill=BLUE, anchor="mm")
    d.text((108, 66), "Muexe", font=font(30, True), fill=WHITE, anchor="lm")

    title = t["name"] if t else "Free Online Tools"
    f_title = font(64, True) if len(title) < 24 else font(54, True)
    lines = wrap(d, title, f_title, 1000)
    y = 260
    for ln in lines:
        centered(d, ln, f_title, WHITE, W // 2, y)
        y += 74

    centered(d, "Free · No sign-up · Runs in your browser", font(28), (219, 234, 254), W // 2, 540)
    d.text((60, 590), "muexe.com", font=font(24, True), fill=(191, 219, 254), anchor="lm")
    return img


def make_pin(t):
    W, H = 1000, 1500
    img = Image.new("RGB", (W, H), WHITE)
    d = ImageDraw.Draw(img, "RGBA")
    # top blue block
    d.rectangle([0, 0, W, 860], fill=BLUE)
    d.ellipse([-120, 600, 240, 960], fill=(255, 255, 255, 16))
    d.ellipse([760, -120, 1120, 240], fill=(255, 255, 255, 20))

    # icon circle (first letter)
    letter = t["name"][0].upper()
    d.ellipse([400, 120, 600, 320], fill=WHITE)
    d.text((500, 220), letter, font=font(120, True), fill=BLUE, anchor="mm")

    # title
    f_title = font(56, True) if len(t["name"]) < 22 else font(46, True)
    lines = wrap(d, t["name"], f_title, 840)
    y = 400
    for ln in lines:
        centered(d, ln, f_title, WHITE, W // 2, y)
        y += 66

    centered(d, "Free Online Tool", font(34), (219, 234, 254), W // 2, y + 20)

    # bottom white block
    centered(d, "Muexe", font(72, True), BLUE, W // 2, 1130)
    centered(d, "Free Online Tools", font(36), GRAY, W // 2, 1200)
    centered(d, "muexe.com", font(32, True), BLUE, W // 2, 1290)
    return img


def main():
    og_dir = IMG / "og"
    pin_dir = IMG / "pin"
    og_dir.mkdir(parents=True, exist_ok=True)
    pin_dir.mkdir(parents=True, exist_ok=True)

    make_og(None).save(og_dir / "og-home.png")
    for t in tools:
        make_og(t).save(og_dir / f'{t["slug"]}.png')
        make_pin(t).save(pin_dir / f'{t["slug"]}.png')
    print(f"[OK] Generated 1 home OG + {len(tools)} tool OG + {len(tools)} pin images")


if __name__ == "__main__":
    main()
