import os
import math
from PIL import Image, ImageDraw, ImageFont

WORKSPACE_DIR = r"c:\Users\Abdulaziz\Desktop\призентация"
ASSETS_DIR = os.path.join(WORKSPACE_DIR, "assets_premium")
os.makedirs(ASSETS_DIR, exist_ok=True)

def get_font(size, bold=False):
    # Try system fonts on Windows
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

def create_hero_phone():
    # 900x900 high-res realistic modern smartphone with sleek notification / chat cards
    W, H = 900, 900
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Ambient subtle glow behind phone
    for r in range(120, 0, -5):
        alpha = int(8 * (1 - r/120))
        draw.ellipse([450 - 320 - r, 450 - 360 - r, 450 + 320 + r, 450 + 360 + r], fill=(59, 130, 246, alpha))

    # Phone drop shadow
    shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sdraw = ImageDraw.Draw(shadow)
    sdraw.rounded_rectangle([270, 100, 630, 800], radius=55, fill=(0, 0, 0, 140))
    # Soften shadow by drawing smaller layers
    for s in range(15):
        sdraw.rounded_rectangle([270 - s, 100 + s, 630 + s, 800 + s*2], radius=55 + s, outline=(0, 0, 0, int(15 - s)))
    img = Image.alpha_composite(img, shadow)
    draw = ImageDraw.Draw(img)

    # Phone Body Outer Frame (Matte Titanium / Deep Slate)
    px1, py1, px2, py2 = 280, 80, 620, 780
    draw.rounded_rectangle([px1, py1, px2, py2], radius=52, fill=(24, 30, 42), outline=(75, 85, 99), width=3)
    # Inner Bezel
    draw.rounded_rectangle([px1 + 6, py1 + 6, px2 - 6, py2 - 6], radius=46, fill=(10, 14, 23))

    # Screen Canvas
    sx1, sy1, sx2, sy2 = px1 + 12, py1 + 12, px2 - 12, py2 - 12
    draw.rounded_rectangle([sx1, sy1, sx2, sy2], radius=40, fill=(15, 23, 42))

    # Dynamic Island / Speaker notch
    draw.rounded_rectangle([450 - 55, sy1 + 14, 450 + 55, sy1 + 42], radius=14, fill=(5, 8, 15))
    draw.ellipse([450 + 32, sy1 + 22, 450 + 44, sy1 + 34], fill=(20, 30, 50)) # camera lens

    # Status Bar Time
    f_sm = get_font(14, bold=True)
    f_xs = get_font(11, bold=False)
    draw.text((sx1 + 30, sy1 + 20), "09:41", font=f_sm, fill=(241, 245, 249))
    # Battery & WiFi indicators
    draw.rounded_rectangle([sx2 - 50, sy1 + 22, sx2 - 25, sy1 + 36], radius=3, outline=(203, 213, 225), width=1)
    draw.rounded_rectangle([sx2 - 47, sy1 + 25, sx2 - 30, sy1 + 33], radius=2, fill=(52, 211, 153))

    # Header in-app banner
    draw.rounded_rectangle([sx1 + 20, sy1 + 60, sx2 - 20, sy1 + 115], radius=16, fill=(30, 41, 59, 200))
    draw.text((sx1 + 36, sy1 + 72), "Social Feed", font=get_font(17, bold=True), fill=(255, 255, 255))
    draw.text((sx1 + 36, sy1 + 93), "Connected with 2.4k peers", font=f_xs, fill=(148, 163, 184))

    # Active Story Avatars Row
    for i, col in enumerate([(59, 130, 246), (236, 72, 153), (168, 85, 247), (34, 211, 238)]):
        ax = sx1 + 35 + i * 70
        draw.ellipse([ax - 2, sy1 + 130 - 2, ax + 50 + 2, sy1 + 180 + 2], outline=col, width=2)
        draw.ellipse([ax + 2, sy1 + 130 + 2, ax + 50 - 2, sy1 + 180 - 2], fill=(30, 41, 59))
        draw.ellipse([ax + 17, sy1 + 142, ax + 33, sy1 + 158], fill=(148, 163, 184))
        draw.chord([ax + 10, sy1 + 160, ax + 40, sy1 + 185], 180, 360, fill=(148, 163, 184))

    # Notification Card 1 (Telegram Message)
    cy1 = sy1 + 205
    draw.rounded_rectangle([sx1 + 18, cy1, sx2 - 18, cy1 + 80], radius=18, fill=(23, 37, 84, 230), outline=(59, 130, 246, 120), width=1)
    draw.ellipse([sx1 + 30, cy1 + 16, sx1 + 66, cy1 + 52], fill=(0, 136, 204))
    draw.text((sx1 + 78, cy1 + 18), "Telegram • Study Group", font=get_font(13, bold=True), fill=(255, 255, 255))
    draw.text((sx1 + 78, cy1 + 38), "New lecture notes shared for exam prep", font=f_xs, fill=(203, 213, 225))
    draw.text((sx2 - 60, cy1 + 18), "2m ago", font=get_font(10), fill=(148, 163, 184))

    # Notification Card 2 (Instagram Creative)
    cy2 = cy1 + 95
    draw.rounded_rectangle([sx1 + 18, cy2, sx2 - 18, cy2 + 80], radius=18, fill=(49, 18, 48, 230), outline=(236, 72, 153, 120), width=1)
    draw.ellipse([sx1 + 30, cy2 + 16, sx1 + 66, cy2 + 52], fill=(225, 48, 108))
    draw.text((sx1 + 78, cy2 + 18), "Instagram • Creative Club", font=get_font(13, bold=True), fill=(255, 255, 255))
    draw.text((sx1 + 78, cy2 + 38), "Shared new portfolio photography reel", font=f_xs, fill=(203, 213, 225))
    draw.text((sx2 - 60, cy2 + 18), "12m ago", font=get_font(10), fill=(148, 163, 184))

    # Notification Card 3 (YouTube Educational)
    cy3 = cy2 + 95
    draw.rounded_rectangle([sx1 + 18, cy3, sx2 - 18, cy3 + 80], radius=18, fill=(45, 15, 20, 230), outline=(239, 68, 68, 120), width=1)
    draw.ellipse([sx1 + 30, cy3 + 16, sx1 + 66, cy3 + 52], fill=(255, 0, 0))
    draw.text((sx1 + 78, cy3 + 18), "YouTube • Tech Academy", font=get_font(13, bold=True), fill=(255, 255, 255))
    draw.text((sx1 + 78, cy3 + 38), "Live stream: English Oral Presentation Skills", font=f_xs, fill=(203, 213, 225))
    draw.text((sx2 - 60, cy3 + 18), "1h ago", font=get_font(10), fill=(148, 163, 184))

    # Bottom Home Bar
    draw.rounded_rectangle([450 - 65, sy2 - 16, 450 + 65, sy2 - 10], radius=3, fill=(148, 163, 184, 180))

    img.save(os.path.join(ASSETS_DIR, "hero_phone.png"))

def create_chat_visual():
    # 800x600 realistic chat interface for Slide 5 (Communication)
    W, H = 800, 600
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Clean Card container with subtle shadow
    card_x1, card_y1, card_x2, card_y2 = 40, 30, 760, 560
    # Shadow
    for s in range(12):
        draw.rounded_rectangle([card_x1 - s, card_y1 + s, card_x2 + s, card_y2 + s], radius=24, fill=(0, 0, 0, int(10 - s/1.5)))
    draw.rounded_rectangle([card_x1, card_y1, card_x2, card_y2], radius=24, fill=(255, 255, 255), outline=(226, 232, 240), width=2)

    # Chat Header
    draw.rounded_rectangle([card_x1, card_y1, card_x2, card_y1 + 80], radius=24, fill=(248, 250, 252))
    draw.rectangle([card_x1, card_y1 + 50, card_x2, card_y1 + 80], fill=(248, 250, 252))
    draw.line([(card_x1, card_y1 + 80), (card_x2, card_y1 + 80)], fill=(226, 232, 240), width=1)

    # User Avatar
    draw.ellipse([card_x1 + 25, card_y1 + 18, card_x1 + 69, card_y1 + 62], fill=(59, 130, 246))
    draw.text((card_x1 + 38, card_y1 + 28), "A", font=get_font(20, bold=True), fill=(255, 255, 255))
    # Green active dot
    draw.ellipse([card_x1 + 57, card_y1 + 48, card_x1 + 69, card_y1 + 60], fill=(34, 197, 94), outline=(255, 255, 255), width=2)

    draw.text((card_x1 + 82, card_y1 + 24), "University Study Circle", font=get_font(17, bold=True), fill=(15, 23, 42))
    draw.text((card_x1 + 82, card_y1 + 46), "Active 5,400 km away • Online", font=get_font(12), fill=(100, 116, 139))

    # Incoming message 1
    m1_y = card_y1 + 110
    draw.rounded_rectangle([card_x1 + 30, m1_y, card_x1 + 420, m1_y + 65], radius=16, fill=(241, 245, 249))
    draw.text((card_x1 + 46, m1_y + 14), "Hey! Did you finish preparing the slides?", font=get_font(14, bold=True), fill=(30, 41, 59))
    draw.text((card_x1 + 46, m1_y + 36), "Salom! Taqdimot slaydlarini tayyorlab bo‘ldingmi?", font=get_font(12), fill=(100, 116, 139))

    # Outgoing message 1 (Right aligned)
    m2_y = m1_y + 85
    draw.rounded_rectangle([card_x2 - 460, m2_y, card_x2 - 30, m2_y + 70], radius=16, fill=(37, 99, 235))
    draw.text((card_x2 - 440, m2_y + 14), "Yes! Bilingual English + Uzbek Latin presentation is ready.", font=get_font(13, bold=True), fill=(255, 255, 255))
    draw.text((card_x2 - 440, m2_y + 36), "Ha! Inglizcha va o‘zbekcha zamonaviy taqdimot tayyor.", font=get_font(11), fill=(191, 219, 254))

    # Incoming Photo card
    m3_y = m2_y + 90
    draw.rounded_rectangle([card_x1 + 30, m3_y, card_x1 + 340, m3_y + 150], radius=18, fill=(241, 245, 249), outline=(226, 232, 240), width=1)
    # Inner photo mockup
    draw.rounded_rectangle([card_x1 + 40, m3_y + 10, card_x1 + 330, m3_y + 105], radius=12, fill=(30, 41, 59))
    draw.text((card_x1 + 80, m3_y + 50), "📷 Campus Library Photo", font=get_font(14, bold=True), fill=(255, 255, 255))
    draw.text((card_x1 + 46, m3_y + 120), "Instant memory shared in real-time", font=get_font(12, bold=False), fill=(100, 116, 139))

    # Distance Pill
    draw.rounded_rectangle([card_x2 - 320, m3_y + 50, card_x2 - 30, m3_y + 115], radius=14, fill=(238, 242, 255), outline=(199, 210, 254), width=1)
    draw.text((card_x2 - 300, m3_y + 62), "⚡ Zero Latency Connection", font=get_font(13, bold=True), fill=(67, 56, 202))
    draw.text((card_x2 - 300, m3_y + 86), "No borders for modern friendship", font=get_font(11), fill=(99, 102, 241))

    img.save(os.path.join(ASSETS_DIR, "chat_visual.png"))

def create_education_player():
    # 800x600 sleek video player & online course card for Slide 6 (Education)
    W, H = 800, 600
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    card_x1, card_y1, card_x2, card_y2 = 40, 30, 760, 560
    # Shadow
    for s in range(12):
        draw.rounded_rectangle([card_x1 - s, card_y1 + s, card_x2 + s, card_y2 + s], radius=24, fill=(0, 0, 0, int(10 - s/1.5)))
    draw.rounded_rectangle([card_x1, card_y1, card_x2, card_y2], radius=24, fill=(15, 23, 42))

    # Video viewport top
    draw.rounded_rectangle([card_x1 + 16, card_y1 + 16, card_x2 - 16, card_y1 + 330], radius=18, fill=(30, 41, 59))
    
    # Big play circle
    cx, cy = (card_x1 + card_x2)//2, card_y1 + 160
    draw.ellipse([cx - 45, cy - 45, cx + 45, cy + 45], fill=(37, 99, 235), outline=(96, 165, 250), width=2)
    draw.polygon([(cx - 12, cy - 20), (cx + 22, cy), (cx - 12, cy + 20)], fill="white")

    # Video badges
    draw.rounded_rectangle([card_x1 + 35, card_y1 + 35, card_x1 + 155, card_y1 + 65], radius=8, fill=(0, 0, 0, 160))
    draw.text((card_x1 + 45, card_y1 + 42), "HD • 1080p Lecture", font=get_font(11, bold=True), fill=(255, 255, 255))

    # Timeline scrubber
    draw.line([(card_x1 + 40, card_y1 + 310), (card_x2 - 40, card_y1 + 310)], fill=(71, 85, 105), width=6)
    draw.line([(card_x1 + 40, card_y1 + 310), (card_x1 + 360, card_y1 + 310)], fill=(37, 99, 235), width=6)
    draw.ellipse([card_x1 + 355, card_y1 + 305, card_x1 + 367, card_y1 + 317], fill=(255, 255, 255))
    draw.text((card_x2 - 110, card_y1 + 295), "18:24 / 45:00", font=get_font(11), fill=(203, 213, 225))

    # Video metadata below
    draw.text((card_x1 + 30, card_y1 + 360), "Mastering Public Speaking & Digital Communication", font=get_font(18, bold=True), fill=(255, 255, 255))
    draw.text((card_x1 + 30, card_y1 + 390), "Global Academy • 340,000 enrolled university students", font=get_font(13), fill=(148, 163, 184))

    # 3 Category tags
    tags = [("Video Lessons", (59, 130, 246)), ("Online Courses", (16, 185, 129)), ("Academic Resources", (168, 85, 247))]
    for i, (t, col) in enumerate(tags):
        tx = card_x1 + 30 + i * 190
        draw.rounded_rectangle([tx, card_y1 + 435, tx + 175, card_y1 + 475], radius=10, fill=(30, 41, 59), outline=col, width=1)
        draw.text((tx + 16, card_y1 + 446), f"✔ {t}", font=get_font(12, bold=True), fill=(241, 245, 249))

    img.save(os.path.join(ASSETS_DIR, "education_player.png"))

def create_balance_wellbeing():
    # 800x600 modern entertainment & digital wellbeing card for Slide 7
    W, H = 800, 600
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    card_x1, card_y1, card_x2, card_y2 = 40, 30, 760, 560
    # Shadow
    for s in range(12):
        draw.rounded_rectangle([card_x1 - s, card_y1 + s, card_x2 + s, card_y2 + s], radius=24, fill=(0, 0, 0, int(10 - s/1.5)))
    draw.rounded_rectangle([card_x1, card_y1, card_x2, card_y2], radius=24, fill=(255, 255, 255), outline=(226, 232, 240), width=2)

    # Top Left: Music Widget
    draw.rounded_rectangle([card_x1 + 25, card_y1 + 25, card_x1 + 335, card_y2 - 25], radius=18, fill=(15, 23, 42))
    # Album art
    draw.rounded_rectangle([card_x1 + 45, card_y1 + 50, card_x1 + 315, card_y1 + 260], radius=14, fill=(30, 41, 59))
    draw.ellipse([card_x1 + 130, card_y1 + 105, card_x1 + 230, card_y1 + 205], fill=(236, 72, 153))
    draw.ellipse([card_x1 + 165, card_y1 + 140, card_x1 + 195, card_y1 + 170], fill=(15, 23, 42))

    draw.text((card_x1 + 45, card_y1 + 285), "Deep Focus & Relaxation", font=get_font(15, bold=True), fill=(255, 255, 255))
    draw.text((card_x1 + 45, card_y1 + 310), "Study Playlist • Lo-fi Beats", font=get_font(12), fill=(148, 163, 184))
    # Audio waveform bars
    for b in range(16):
        bh = max(4, int(15 + math.sin(b * 0.8) * 12))
        bx = card_x1 + 45 + b * 17
        draw.rounded_rectangle([bx, card_y1 + 380 - bh, bx + 8, card_y1 + 380 + bh], radius=3, fill=(59, 130, 246))

    draw.text((card_x1 + 45, card_y1 + 440), "Creative Inspiration", font=get_font(13, bold=True), fill=(34, 211, 238))
    draw.text((card_x1 + 45, card_y1 + 465), "Relaxing after university hours", font=get_font(11), fill=(203, 213, 225))

    # Top Right: Digital Wellbeing Meter
    draw.rounded_rectangle([card_x1 + 360, card_y1 + 25, card_x2 - 25, card_y2 - 25], radius=18, fill=(248, 250, 252), outline=(226, 232, 240), width=1)
    draw.text((card_x1 + 385, card_y1 + 50), "Digital Balance Monitor", font=get_font(18, bold=True), fill=(15, 23, 42))
    draw.text((card_x1 + 385, card_y1 + 75), "Raqamli muvozanat nazorati", font=get_font(13), fill=(100, 116, 139))

    # Donut or progress bar
    draw.rounded_rectangle([card_x1 + 385, card_y1 + 130, card_x2 - 50, card_y1 + 175], radius=12, fill=(226, 232, 240))
    draw.rounded_rectangle([card_x1 + 385, card_y1 + 130, card_x1 + 385 + 210, card_y1 + 175], radius=12, fill=(34, 197, 94))
    draw.text((card_x1 + 400, card_y1 + 143), "Balanced Usage: 2h 15m / day", font=get_font(13, bold=True), fill=(255, 255, 255))

    # Tips list
    tips = [
        ("✔ No mindless endless scrolling", "Lentani maqsadsiz aylantirmaslik"),
        ("✔ Protecting sleep and study time", "Uyqu va dars vaqtini asrash"),
        ("✔ Keeping real-life relationships first", "Jonli muloqotni birinchi o‘ringa qo‘yish")
    ]
    for i, (te, tu) in enumerate(tips):
        ty = card_y1 + 225 + i * 85
        draw.rounded_rectangle([card_x1 + 385, ty, card_x2 - 50, ty + 70], radius=12, fill=(255, 255, 255), outline=(226, 232, 240), width=1)
        draw.text((card_x1 + 400, ty + 14), te, font=get_font(13, bold=True), fill=(30, 41, 59))
        draw.text((card_x1 + 400, ty + 38), tu, font=get_font(11), fill=(100, 116, 139))

    img.save(os.path.join(ASSETS_DIR, "balance_wellbeing.png"))

create_hero_phone()
create_chat_visual()
create_education_player()
create_balance_wellbeing()
print("Premium visual assets generated successfully!")
