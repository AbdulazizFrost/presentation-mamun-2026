import os
import math
from PIL import Image, ImageDraw, ImageFont

WORKSPACE_DIR = r"c:\Users\Abdulaziz\Desktop\призентация"
ASSETS_DIR = os.path.join(WORKSPACE_DIR, "assets_premium")

def get_font(size, bold=False):
    font_paths = [
        r"C:\Windows\Fonts\segoeui.ttf" if not bold else r"C:\Windows\Fonts\segoeuib.ttf",
        r"C:\Windows\Fonts\arial.ttf" if not bold else r"C:\Windows\Fonts\arialbd.ttf"
    ]
    for p in font_paths:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                pass
    return ImageFont.load_default()

def create_large_hero_phone():
    # 540x980 canvas - phone takes almost all space (460x900)
    W, H = 540, 980
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Ambient glow
    for r in range(80, 0, -5):
        alpha = int(12 * (1 - r/80))
        draw.ellipse([W//2 - 200 - r, H//2 - 380 - r, W//2 + 200 + r, H//2 + 380 + r], fill=(59, 130, 246, alpha))

    # Drop shadow
    shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sdraw = ImageDraw.Draw(shadow)
    for s in range(20):
        sdraw.rounded_rectangle([35 - s, 35 + s, W - 35 + s, H - 35 + s*1.5], radius=60 + s, outline=(0, 0, 0, int(18 - s*0.8)))
    img = Image.alpha_composite(img, shadow)
    draw = ImageDraw.Draw(img)

    # Phone Frame (Titanium / Deep Slate)
    px1, py1, px2, py2 = 40, 30, W - 40, H - 40
    draw.rounded_rectangle([px1, py1, px2, py2], radius=56, fill=(24, 30, 42), outline=(75, 85, 99), width=4)
    # Inner Bezel
    draw.rounded_rectangle([px1 + 6, py1 + 6, px2 - 6, py2 - 6], radius=50, fill=(10, 14, 23))

    # OLED Screen Canvas
    sx1, sy1, sx2, sy2 = px1 + 12, py1 + 12, px2 - 12, py2 - 12
    draw.rounded_rectangle([sx1, sy1, sx2, sy2], radius=44, fill=(15, 23, 42))

    # Dynamic Island / Notch
    cx = W // 2
    draw.rounded_rectangle([cx - 65, sy1 + 16, cx + 65, sy1 + 48], radius=16, fill=(5, 8, 15))
    draw.ellipse([cx + 38, sy1 + 24, cx + 52, sy1 + 38], fill=(20, 30, 50)) # camera

    # Status Bar
    f_sm = get_font(15, bold=True)
    f_xs = get_font(12, bold=False)
    draw.text((sx1 + 32, sy1 + 22), "09:41", font=f_sm, fill=(241, 245, 249))
    # Battery & WiFi
    draw.rounded_rectangle([sx2 - 55, sy1 + 24, sx2 - 25, sy1 + 40], radius=4, outline=(203, 213, 225), width=1)
    draw.rounded_rectangle([sx2 - 52, sy1 + 27, sx2 - 32, sy1 + 37], radius=2, fill=(52, 211, 153))

    # Social Feed Header Banner
    draw.rounded_rectangle([sx1 + 20, sy1 + 68, sx2 - 20, sy1 + 135], radius=18, fill=(30, 41, 59, 230), outline=(51, 65, 85), width=1)
    draw.text((sx1 + 40, sy1 + 82), "Social Feed", font=get_font(20, bold=True), fill=(255, 255, 255))
    draw.text((sx1 + 40, sy1 + 108), "Connected with 2.4k university peers", font=f_xs, fill=(148, 163, 184))

    # Active Story Circles
    stories = [(59, 130, 246), (236, 72, 153), (168, 85, 247), (34, 211, 238), (16, 185, 129)]
    for i, col in enumerate(stories):
        ax = sx1 + 32 + i * 80
        draw.ellipse([ax - 2, sy1 + 155 - 2, ax + 60 + 2, sy1 + 215 + 2], outline=col, width=2)
        draw.ellipse([ax + 2, sy1 + 155 + 2, ax + 60 - 2, sy1 + 215 - 2], fill=(30, 41, 59))
        draw.ellipse([ax + 20, sy1 + 168, ax + 40, sy1 + 188], fill=(148, 163, 184))
        draw.chord([ax + 12, sy1 + 190, ax + 48, sy1 + 222], 180, 360, fill=(148, 163, 184))

    # Notification 1: Telegram
    cy1 = sy1 + 245
    draw.rounded_rectangle([sx1 + 18, cy1, sx2 - 18, cy1 + 100], radius=20, fill=(23, 37, 84, 240), outline=(59, 130, 246, 140), width=1)
    draw.ellipse([sx1 + 32, cy1 + 20, sx1 + 76, cy1 + 64], fill=(0, 136, 204))
    # Paper plane logo inside
    draw.polygon([(sx1 + 42, cy1 + 42), (sx1 + 68, cy1 + 28), (sx1 + 54, cy1 + 56), (sx1 + 50, cy1 + 45)], fill="white")
    draw.text((sx1 + 90, cy1 + 22), "Telegram • Study Group", font=get_font(15, bold=True), fill=(255, 255, 255))
    draw.text((sx1 + 90, cy1 + 48), "Exam lecture notes & PDF guides shared", font=f_xs, fill=(203, 213, 225))
    draw.text((sx1 + 90, cy1 + 68), "Universitet o‘quv konspektlari yuborildi", font=get_font(11), fill=(148, 163, 184))
    draw.text((sx2 - 70, cy1 + 22), "2m ago", font=get_font(11), fill=(148, 163, 184))

    # Notification 2: Instagram
    cy2 = cy1 + 120
    draw.rounded_rectangle([sx1 + 18, cy2, sx2 - 18, cy2 + 100], radius=20, fill=(49, 18, 48, 240), outline=(236, 72, 153, 140), width=1)
    draw.ellipse([sx1 + 32, cy2 + 20, sx1 + 76, cy2 + 64], fill=(225, 48, 108))
    # Camera glyph inside
    draw.rounded_rectangle([sx1 + 42, cy2 + 30, sx1 + 66, cy2 + 54], radius=6, outline="white", width=2)
    draw.ellipse([sx1 + 49, cy2 + 37, sx1 + 59, cy2 + 47], outline="white", width=2)
    draw.text((sx1 + 90, cy2 + 22), "Instagram • Creative Club", font=get_font(15, bold=True), fill=(255, 255, 255))
    draw.text((sx1 + 90, cy2 + 48), "Shared new campus photography reel", font=f_xs, fill=(203, 213, 225))
    draw.text((sx1 + 90, cy2 + 68), "Ijodiy fotolavhalar va videolar ulashildi", font=get_font(11), fill=(148, 163, 184))
    draw.text((sx2 - 75, cy2 + 22), "12m ago", font=get_font(11), fill=(148, 163, 184))

    # Notification 3: YouTube
    cy3 = cy2 + 120
    draw.rounded_rectangle([sx1 + 18, cy3, sx2 - 18, cy3 + 100], radius=20, fill=(45, 15, 20, 240), outline=(239, 68, 68, 140), width=1)
    draw.ellipse([sx1 + 32, cy3 + 20, sx1 + 76, cy3 + 64], fill=(255, 0, 0))
    # Play triangle inside
    draw.polygon([(sx1 + 50, cy3 + 34), (sx1 + 62, cy3 + 42), (sx1 + 50, cy3 + 50)], fill="white")
    draw.text((sx1 + 90, cy3 + 22), "YouTube • Global Academy", font=get_font(15, bold=True), fill=(255, 255, 255))
    draw.text((sx1 + 90, cy3 + 48), "Video: English Oral Presentation Skills", font=f_xs, fill=(203, 213, 225))
    draw.text((sx1 + 90, cy3 + 68), "Foydali ta’limiy video darslik", font=get_font(11), fill=(148, 163, 184))
    draw.text((sx2 - 68, cy3 + 22), "1h ago", font=get_font(11), fill=(148, 163, 184))

    # Bottom Home Bar
    draw.rounded_rectangle([cx - 75, sy2 - 20, cx + 75, sy2 - 12], radius=4, fill=(148, 163, 184, 200))

    dest = os.path.join(ASSETS_DIR, "hero_phone.png")
    img.save(dest)
    print(f"Large cinematic hero phone generated and saved to {dest}")

create_large_hero_phone()
