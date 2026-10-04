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

def create_dark_network_visual():
    W, H = 800, 600
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    card_x1, card_y1, card_x2, card_y2 = 40, 30, 760, 560
    # Shadow
    for s in range(15):
        draw.rounded_rectangle([card_x1 - s, card_y1 + s, card_x2 + s, card_y2 + s], radius=24, fill=(0, 0, 0, int(15 - s)))
    # Dark card base
    draw.rounded_rectangle([card_x1, card_y1, card_x2, card_y2], radius=24, fill=(17, 24, 39), outline=(30, 41, 59), width=2)

    cx, cy = (card_x1 + card_x2)//2, (card_y1 + card_y2)//2

    # Concentric pulse rings
    for r in [180, 130, 85]:
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(30, 41, 59), width=1)

    satellites = [
        (-145, -110, (59, 130, 246), "Communication", "Muloqot", "Instant messaging & global voice"),
        (150, -90, (34, 211, 238), "Information", "Ma’lumot", "Live news & academic research"),
        (0, 155, (168, 85, 247), "Content Sharing", "Kontent almashish", "Creative photos, reels & ideas")
    ]

    for dx, dy, col, en_t, uz_t, desc in satellites:
        sx, sy = cx + dx, cy + dy
        draw.line([(cx, cy), (sx, sy)], fill=col, width=2)
        sw, sh = 240, 82
        draw.rounded_rectangle([sx - sw//2, sy - sh//2, sx + sw//2, sy + sh//2], radius=16, fill=(30, 41, 59), outline=col, width=2)
        draw.ellipse([sx - sw//2 + 14, sy - 18, sx - sw//2 + 50, sy + 18], fill=col)
        draw.text((sx - sw//2 + 62, sy - 24), en_t, font=get_font(13, bold=True), fill=(255, 255, 255))
        draw.text((sx - sw//2 + 62, sy - 4), uz_t, font=get_font(11), fill=col)
        draw.text((sx - sw//2 + 62, sy + 14), desc, font=get_font(9), fill=(148, 163, 184))

    # Center Hub
    draw.ellipse([cx - 45, cy - 45, cx + 45, cy + 45], fill=(15, 23, 42), outline=(59, 130, 246), width=3)
    draw.ellipse([cx - 15, cy - 15, cx + 15, cy + 15], fill=(59, 130, 246))
    draw.text((cx - 30, cy + 55), "Global Web", font=get_font(12, bold=True), fill=(148, 163, 184))

    img.save(os.path.join(ASSETS_DIR, "network_visual.png"))

def create_dark_platforms_visual():
    W, H = 800, 600
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    card_x1, card_y1, card_x2, card_y2 = 40, 30, 760, 560
    for s in range(15):
        draw.rounded_rectangle([card_x1 - s, card_y1 + s, card_x2 + s, card_y2 + s], radius=24, fill=(0, 0, 0, int(15 - s)))
    draw.rounded_rectangle([card_x1, card_y1, card_x2, card_y2], radius=24, fill=(17, 24, 39), outline=(30, 41, 59), width=2)

    draw.text((card_x1 + 35, card_y1 + 30), "Student Ecosystem & Everyday Apps", font=get_font(18, bold=True), fill=(255, 255, 255))
    draw.text((card_x1 + 35, card_y1 + 56), "Talabalar hayotidagi ommabop dasturlar va ularning vazifalari", font=get_font(12), fill=(148, 163, 184))

    apps = [
        ("Telegram", "Communication & Useful Information", "Muloqot va foydali ma’lumotlar uchun",
         "University channels • Rapid PDF & study material exchange • Fast messaging", (0, 136, 204), "TG"),
        ("Instagram", "Photos, Videos & Creative Content", "Fotosuratlar, videolar va ijodiy kontent uchun",
         "Visual storytelling • Design & creative accounts • Short inspiration reels", (225, 48, 108), "IG"),
        ("YouTube", "Education & Entertainment", "Ta’lim va ko‘ngilochar kontent uchun",
         "In-depth lectures & tutorials • Academic documentaries • Relaxing podcasts", (239, 68, 68), "YT")
    ]

    for i, (name, en_sub, uz_sub, detail, col, badge) in enumerate(apps):
        ry = card_y1 + 105 + i * 140
        draw.rounded_rectangle([card_x1 + 30, ry, card_x2 - 30, ry + 120], radius=16, fill=(30, 41, 59), outline=col, width=1)
        draw.rounded_rectangle([card_x1 + 30, ry, card_x1 + 38, ry + 120], radius=4, fill=col)
        
        draw.ellipse([card_x1 + 55, ry + 30, card_x1 + 115, ry + 90], fill=col)
        draw.text((card_x1 + 72, ry + 46), badge, font=get_font(18, bold=True), fill=(255, 255, 255))

        draw.text((card_x1 + 135, ry + 22), name, font=get_font(18, bold=True), fill=(255, 255, 255))
        draw.text((card_x1 + 250, ry + 26), f"•  {en_sub}", font=get_font(12, bold=True), fill=col)
        draw.text((card_x1 + 135, ry + 50), uz_sub, font=get_font(12), fill=(148, 163, 184))
        draw.text((card_x1 + 135, ry + 78), detail, font=get_font(11, bold=True), fill=(203, 213, 225))

    img.save(os.path.join(ASSETS_DIR, "platforms_visual.png"))

def create_dark_chat_visual():
    W, H = 800, 600
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    card_x1, card_y1, card_x2, card_y2 = 40, 30, 760, 560
    for s in range(15):
        draw.rounded_rectangle([card_x1 - s, card_y1 + s, card_x2 + s, card_y2 + s], radius=24, fill=(0, 0, 0, int(15 - s)))
    draw.rounded_rectangle([card_x1, card_y1, card_x2, card_y2], radius=24, fill=(17, 24, 39), outline=(30, 41, 59), width=2)

    # Header
    draw.rounded_rectangle([card_x1, card_y1, card_x2, card_y1 + 80], radius=24, fill=(15, 23, 42))
    draw.rectangle([card_x1, card_y1 + 50, card_x2, card_y1 + 80], fill=(15, 23, 42))
    draw.line([(card_x1, card_y1 + 80), (card_x2, card_y1 + 80)], fill=(30, 41, 59), width=1)

    draw.ellipse([card_x1 + 25, card_y1 + 18, card_x1 + 69, card_y1 + 62], fill=(59, 130, 246))
    draw.text((card_x1 + 38, card_y1 + 28), "A", font=get_font(20, bold=True), fill=(255, 255, 255))
    draw.ellipse([card_x1 + 57, card_y1 + 48, card_x1 + 69, card_y1 + 60], fill=(34, 197, 94), outline=(15, 23, 42), width=2)

    draw.text((card_x1 + 82, card_y1 + 24), "University Study Circle", font=get_font(17, bold=True), fill=(255, 255, 255))
    draw.text((card_x1 + 82, card_y1 + 46), "Active 5,400 km away • Online", font=get_font(12), fill=(148, 163, 184))

    # Incoming message 1
    m1_y = card_y1 + 110
    draw.rounded_rectangle([card_x1 + 30, m1_y, card_x1 + 440, m1_y + 65], radius=16, fill=(30, 41, 59))
    draw.text((card_x1 + 46, m1_y + 14), "Hey! Did you finish preparing the slides?", font=get_font(14, bold=True), fill=(255, 255, 255))
    draw.text((card_x1 + 46, m1_y + 36), "Salom! Taqdimot slaydlarini tayyorlab bo‘ldingmi?", font=get_font(12), fill=(148, 163, 184))

    # Outgoing message 1
    m2_y = m1_y + 85
    draw.rounded_rectangle([card_x2 - 470, m2_y, card_x2 - 30, m2_y + 70], radius=16, fill=(37, 99, 235))
    draw.text((card_x2 - 450, m2_y + 14), "Yes! Bilingual English + Uzbek Latin presentation is ready.", font=get_font(13, bold=True), fill=(255, 255, 255))
    draw.text((card_x2 - 450, m2_y + 36), "Ha! Inglizcha va o‘zbekcha zamonaviy taqdimot tayyor.", font=get_font(11), fill=(191, 219, 254))

    # Photo card
    m3_y = m2_y + 90
    draw.rounded_rectangle([card_x1 + 30, m3_y, card_x1 + 340, m3_y + 150], radius=18, fill=(30, 41, 59), outline=(51, 65, 85), width=1)
    draw.rounded_rectangle([card_x1 + 40, m3_y + 10, card_x1 + 330, m3_y + 105], radius=12, fill=(15, 23, 42))
    draw.text((card_x1 + 80, m3_y + 50), "📷 Campus Library Photo", font=get_font(14, bold=True), fill=(255, 255, 255))
    draw.text((card_x1 + 46, m3_y + 120), "Instant memory shared in real-time", font=get_font(12), fill=(148, 163, 184))

    # Distance Pill
    draw.rounded_rectangle([card_x2 - 320, m3_y + 50, card_x2 - 30, m3_y + 115], radius=14, fill=(30, 27, 75), outline=(99, 102, 241), width=1)
    draw.text((card_x2 - 300, m3_y + 62), "⚡ Zero Latency Connection", font=get_font(13, bold=True), fill=(165, 180, 252))
    draw.text((card_x2 - 300, m3_y + 86), "No borders for modern friendship", font=get_font(11), fill=(199, 210, 254))

    img.save(os.path.join(ASSETS_DIR, "chat_visual.png"))

def create_dark_balance_wellbeing():
    W, H = 800, 600
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    card_x1, card_y1, card_x2, card_y2 = 40, 30, 760, 560
    for s in range(15):
        draw.rounded_rectangle([card_x1 - s, card_y1 + s, card_x2 + s, card_y2 + s], radius=24, fill=(0, 0, 0, int(15 - s)))
    draw.rounded_rectangle([card_x1, card_y1, card_x2, card_y2], radius=24, fill=(17, 24, 39), outline=(30, 41, 59), width=2)

    # Music Widget
    draw.rounded_rectangle([card_x1 + 25, card_y1 + 25, card_x1 + 335, card_y2 - 25], radius=18, fill=(15, 23, 42), outline=(30, 41, 59), width=1)
    draw.rounded_rectangle([card_x1 + 45, card_y1 + 50, card_x1 + 315, card_y1 + 260], radius=14, fill=(30, 41, 59))
    draw.ellipse([card_x1 + 130, card_y1 + 105, card_x1 + 230, card_y1 + 205], fill=(236, 72, 153))
    draw.ellipse([card_x1 + 165, card_y1 + 140, card_x1 + 195, card_y1 + 170], fill=(15, 23, 42))

    draw.text((card_x1 + 45, card_y1 + 285), "Deep Focus & Relaxation", font=get_font(15, bold=True), fill=(255, 255, 255))
    draw.text((card_x1 + 45, card_y1 + 310), "Study Playlist • Lo-fi Beats", font=get_font(12), fill=(148, 163, 184))

    for b in range(16):
        bh = max(4, int(15 + math.sin(b * 0.8) * 12))
        bx = card_x1 + 45 + b * 17
        draw.rounded_rectangle([bx, card_y1 + 380 - bh, bx + 8, card_y1 + 380 + bh], radius=3, fill=(59, 130, 246))

    draw.text((card_x1 + 45, card_y1 + 440), "Creative Inspiration", font=get_font(13, bold=True), fill=(34, 211, 238))
    draw.text((card_x1 + 45, card_y1 + 465), "Relaxing after university hours", font=get_font(11), fill=(203, 213, 225))

    # Digital Wellbeing
    draw.rounded_rectangle([card_x1 + 360, card_y1 + 25, card_x2 - 25, card_y2 - 25], radius=18, fill=(15, 23, 42), outline=(30, 41, 59), width=1)
    draw.text((card_x1 + 385, card_y1 + 50), "Digital Balance Monitor", font=get_font(18, bold=True), fill=(255, 255, 255))
    draw.text((card_x1 + 385, card_y1 + 75), "Raqamli muvozanat nazorati", font=get_font(13), fill=(148, 163, 184))

    draw.rounded_rectangle([card_x1 + 385, card_y1 + 130, card_x2 - 50, card_y1 + 175], radius=12, fill=(30, 41, 59))
    draw.rounded_rectangle([card_x1 + 385, card_y1 + 130, card_x1 + 385 + 210, card_y1 + 175], radius=12, fill=(16, 185, 129))
    draw.text((card_x1 + 400, card_y1 + 143), "Balanced Usage: 2h 15m / day", font=get_font(13, bold=True), fill=(255, 255, 255))

    tips = [
        ("✔ No mindless endless scrolling", "Lentani maqsadsiz aylantirmaslik"),
        ("✔ Protecting sleep and study time", "Uyqu va dars vaqtini asrash"),
        ("✔ Keeping real-life relationships first", "Jonli muloqotni birinchi o‘ringa qo‘yish")
    ]
    for i, (te, tu) in enumerate(tips):
        ty = card_y1 + 225 + i * 85
        draw.rounded_rectangle([card_x1 + 385, ty, card_x2 - 50, ty + 70], radius=12, fill=(30, 41, 59), outline=(51, 65, 85), width=1)
        draw.text((card_x1 + 400, ty + 14), te, font=get_font(13, bold=True), fill=(255, 255, 255))
        draw.text((card_x1 + 400, ty + 38), tu, font=get_font(11), fill=(148, 163, 184))

    img.save(os.path.join(ASSETS_DIR, "balance_wellbeing.png"))

create_dark_network_visual()
create_dark_platforms_visual()
create_dark_chat_visual()
create_dark_balance_wellbeing()
print("All dark-mode visual assets regenerated successfully!")
