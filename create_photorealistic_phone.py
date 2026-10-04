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

def create_photorealistic_feed_phone():
    # 640x1100 canvas, phone fills 540x1020
    W, H = 640, 1100
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # 1. Soft Cyan / Blue Ambient Glow behind phone
    cx, cy = W // 2, H // 2
    for r in range(120, 0, -4):
        alpha = int(14 * (1 - r/120))
        draw.ellipse([cx - 220 - r, cy - 420 - r, cx + 220 + r, cy + 420 + r], fill=(34, 211, 238, alpha))
    for r in range(80, 0, -4):
        alpha = int(16 * (1 - r/80))
        draw.ellipse([cx - 180 - r, cy - 350 - r, cx + 180 + r, cy + 350 + r], fill=(59, 130, 246, alpha))

    # 2. Cinematic Drop Shadow
    shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sdraw = ImageDraw.Draw(shadow)
    for s in range(25):
        sdraw.rounded_rectangle([45 - s, 40 + s, W - 45 + s, H - 40 + s*1.3], radius=64 + s, outline=(0, 0, 0, int(20 - s*0.8)))
    img = Image.alpha_composite(img, shadow)
    draw = ImageDraw.Draw(img)

    # 3. Phone Outer Chassis (Sleek Space Gray / Titanium frame)
    px1, py1, px2, py2 = 50, 40, W - 50, H - 40
    draw.rounded_rectangle([px1, py1, px2, py2], radius=60, fill=(20, 26, 38), outline=(71, 85, 105), width=3)
    # Bezel
    draw.rounded_rectangle([px1 + 6, py1 + 6, px2 - 6, py2 - 6], radius=54, fill=(10, 14, 23))

    # 4. OLED Screen
    sx1, sy1, sx2, sy2 = px1 + 12, py1 + 12, px2 - 12, py2 - 12
    draw.rounded_rectangle([sx1, sy1, sx2, sy2], radius=48, fill=(15, 23, 42))

    # 5. Dynamic Island Notch
    draw.rounded_rectangle([cx - 70, sy1 + 14, cx + 70, sy1 + 46], radius=16, fill=(5, 8, 15))
    draw.ellipse([cx + 42, sy1 + 22, cx + 56, sy1 + 36], fill=(24, 34, 54))

    # 6. Status Bar
    f_time = get_font(15, bold=True)
    f_sub = get_font(12, bold=False)
    f_tag = get_font(11, bold=True)
    draw.text((sx1 + 34, sy1 + 20), "09:41", font=f_time, fill=(241, 245, 249))

    # Battery & WiFi
    draw.rounded_rectangle([sx2 - 58, sy1 + 22, sx2 - 28, sy1 + 38], radius=4, outline=(203, 213, 225), width=1)
    draw.rounded_rectangle([sx2 - 55, sy1 + 25, sx2 - 34, sy1 + 35], radius=2, fill=(52, 211, 153))

    # 7. App Header: "Social Feed" + Notifications Icon
    hy = sy1 + 65
    draw.text((sx1 + 26, hy), "Social Feed", font=get_font(22, bold=True), fill=(255, 255, 255))
    
    # Message / Bell notification button on top right of screen
    draw.ellipse([sx2 - 60, hy - 2, sx2 - 24, hy + 34], fill=(30, 41, 59))
    draw.text((sx2 - 48, hy + 4), "💬", font=get_font(14), fill=(255, 255, 255))
    # Unread badge
    draw.ellipse([sx2 - 32, hy - 4, sx2 - 18, hy + 10], fill=(239, 68, 68))
    draw.text((sx2 - 28, hy - 3), "3", font=get_font(9, bold=True), fill=(255, 255, 255))

    # 8. Stories Row (Realistic, with actual mini faces & gradient rings)
    st_y = hy + 48
    avatars_data = [
        ("Your Story", (59, 130, 246), (37, 99, 235), True),
        ("Aziz", (34, 211, 238), (14, 165, 233), False),
        ("Malika", (168, 85, 247), (139, 92, 246), False),
        ("Xumoyil", (52, 211, 153), (16, 185, 129), False),
        ("Jasur", (251, 191, 36), (245, 158, 11), False),
        ("Dilnoza", (244, 63, 94), (225, 29, 72), False),
    ]

    for i, (name, col1, col2, is_self) in enumerate(avatars_data[:5]):
        ax = sx1 + 22 + i * 94
        # Gradient Ring
        draw.ellipse([ax - 2, st_y - 2, ax + 72 + 2, st_y + 72 + 2], outline=col1, width=2)
        # Avatar Circle
        draw.ellipse([ax + 3, st_y + 3, ax + 69, st_y + 69], fill=(30, 41, 59))
        
        # Draw realistic stylized avatar inside
        # Skin face circle
        skin_tones = [(254, 215, 170), (253, 186, 116), (254, 202, 202), (251, 191, 36), (243, 232, 255)]
        skin = skin_tones[i % len(skin_tones)]
        draw.ellipse([ax + 24, st_y + 16, ax + 48, st_y + 40], fill=skin)
        # Hair cap
        hair_cols = [(30, 41, 59), (71, 85, 105), (15, 23, 42), (67, 56, 202), (30, 58, 138)]
        draw.chord([ax + 22, st_y + 12, ax + 50, st_y + 34], 180, 360, fill=hair_cols[i % len(hair_cols)])
        # Shoulders
        draw.chord([ax + 14, st_y + 40, ax + 58, st_y + 68], 180, 360, fill=col2)

        # Plus badge on self story
        if is_self:
            draw.ellipse([ax + 48, st_y + 48, ax + 68, st_y + 68], fill=(37, 99, 235), outline=(15, 23, 42), width=2)
            draw.text((ax + 54, st_y + 49), "+", font=get_font(12, bold=True), fill=(255, 255, 255))

        # Name label
        draw.text((ax + 8, st_y + 80), name[:8], font=get_font(11), fill=(203, 213, 225))

    # Divider below stories
    draw.line([(sx1 + 15, st_y + 104), (sx2 - 15, st_y + 104)], fill=(30, 41, 59), width=1)

    # 9. Main Post Card: Authentic Social Feed Post
    post_y = st_y + 118
    draw.rounded_rectangle([sx1 + 16, post_y, sx2 - 16, post_y + 490], radius=24, fill=(23, 32, 51), outline=(38, 52, 80), width=1)

    # Post Author Row
    draw.ellipse([sx1 + 32, post_y + 16, sx1 + 72, post_y + 56], fill=(37, 99, 235))
    draw.text((sx1 + 44, post_y + 24), "X", font=get_font(18, bold=True), fill=(255, 255, 255))
    draw.ellipse([sx1 + 60, post_y + 44, sx1 + 72, post_y + 56], fill=(34, 197, 94), outline=(23, 32, 51), width=2)

    draw.text((sx1 + 84, post_y + 18), "Xumoyil Karim", font=get_font(15, bold=True), fill=(255, 255, 255))
    draw.text((sx1 + 84, post_y + 40), "University Campus Library • 2h ago", font=f_sub, fill=(148, 163, 184))
    draw.text((sx2 - 50, post_y + 24), "···", font=get_font(18, bold=True), fill=(148, 163, 184))

    # Post Image (Modern Glass Architecture Campus at Twilight)
    img_y = post_y + 70
    draw.rounded_rectangle([sx1 + 28, img_y, sx2 - 28, img_y + 240], radius=16, fill=(15, 23, 42))

    # Realistic architectural illustration
    # Deep twilight gradient sky
    for l in range(240):
        t_col = (int(15 + l*0.1), int(23 + l*0.15), int(42 + l*0.2))
        draw.line([(sx1 + 28, img_y + l), (sx2 - 28, img_y + l)], fill=t_col)

    # Glowing moon / campus lights
    draw.ellipse([sx2 - 90, img_y + 30, sx2 - 50, img_y + 70], fill=(254, 240, 138, 220))
    # Modern university building geometry
    draw.polygon([(sx1 + 45, img_y + 240), (sx1 + 45, img_y + 90), (sx1 + 220, img_y + 50), (sx1 + 220, img_y + 240)], fill=(30, 41, 59))
    draw.polygon([(sx1 + 220, img_y + 240), (sx1 + 220, img_y + 50), (sx2 - 45, img_y + 110), (sx2 - 45, img_y + 240)], fill=(20, 29, 44))
    # Glowing study windows (rows of lights)
    for wy in range(img_y + 75, img_y + 220, 24):
        for wx in range(sx1 + 65, sx1 + 200, 24):
            draw.rounded_rectangle([wx, wy, wx + 14, wy + 14], radius=3, fill=(56, 189, 248, 200))
        for wx in range(sx1 + 240, sx2 - 65, 28):
            draw.rounded_rectangle([wx, wy + 15, wx + 16, wy + 27], radius=3, fill=(34, 211, 238, 180))

    # Campus overlay pill
    draw.rounded_rectangle([sx1 + 40, img_y + 195, sx1 + 230, img_y + 225], radius=8, fill=(0, 0, 0, 180))
    draw.text((sx1 + 50, img_y + 202), "📍 National University Library", font=f_tag, fill=(241, 245, 249))

    # Post Action Bar (Likes, comments, shares, saves)
    act_y = img_y + 252
    draw.text((sx1 + 34, act_y), "❤️ 284", font=get_font(13, bold=True), fill=(244, 63, 94))
    draw.text((sx1 + 110, act_y), "💬 36", font=get_font(13, bold=True), fill=(203, 213, 225))
    draw.text((sx1 + 175, act_y), "↗️ Share", font=get_font(13), fill=(148, 163, 184))
    draw.text((sx2 - 50, act_y), "🔖", font=get_font(14), fill=(148, 163, 184))

    # Post Caption
    cap_y = act_y + 32
    draw.text((sx1 + 34, cap_y), "Great discussion session with classmates today! 🎓", font=get_font(13, bold=True), fill=(255, 255, 255))
    draw.text((sx1 + 34, cap_y + 20), "Preparing our bilingual university presentation...", font=f_sub, fill=(148, 163, 184))

    # Floating Notification Toast on Bottom of Post (Subtle Cyan Glow)
    toast_y = post_y + 400
    draw.rounded_rectangle([sx1 + 28, toast_y, sx2 - 28, toast_y + 70], radius=16, fill=(15, 23, 42, 240), outline=(56, 189, 248), width=1)
    draw.ellipse([sx1 + 42, toast_y + 16, sx1 + 78, toast_y + 52], fill=(56, 189, 248))
    draw.text((sx1 + 54, toast_y + 24), "⚡", font=get_font(15), fill=(15, 23, 42))

    draw.text((sx1 + 90, toast_y + 14), "Study Group • New Document", font=get_font(13, bold=True), fill=(255, 255, 255))
    draw.text((sx1 + 90, toast_y + 36), "Social Networks in My Life.pdf shared", font=f_sub, fill=(148, 163, 184))

    # 10. Bottom Navigation Bar
    nav_y = sy2 - 65
    draw.rounded_rectangle([sx1, nav_y, sx2, sy2], radius=40, fill=(10, 14, 23))
    draw.line([(sx1, nav_y), (sx2, nav_y)], fill=(30, 41, 59), width=1)
    
    # 5 Tab Icons
    tabs = ["🏠", "🔍", "➕", "🔔", "👤"]
    for i, t in enumerate(tabs):
        tx = sx1 + 45 + i * 90
        col = (56, 189, 248) if i == 0 else (148, 163, 184)
        draw.text((tx, nav_y + 12), t, font=get_font(16), fill=col)

    # Home Bar
    draw.rounded_rectangle([cx - 75, sy2 - 14, cx + 75, sy2 - 8], radius=3, fill=(148, 163, 184, 180))

    dest = os.path.join(ASSETS_DIR, "hero_phone.png")
    img.save(dest)
    print(f"Photorealistic feed phone generated successfully at: {dest}")

create_photorealistic_feed_phone()
