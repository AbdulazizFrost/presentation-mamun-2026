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

def draw_heart(draw, x, y, size=14, color=(244, 63, 94)):
    # Precise vector heart shape
    r = size // 2
    draw.ellipse([x, y, x + r + 1, y + r + 1], fill=color)
    draw.ellipse([x + r - 1, y, x + 2*r, y + r + 1], fill=color)
    draw.polygon([(x, y + r//2 + 1), (x + 2*r, y + r//2 + 1), (x + r, y + size + 2)], fill=color)

def draw_comment_bubble(draw, x, y, w=15, h=12, color=(148, 163, 184)):
    draw.rounded_rectangle([x, y, x + w, y + h], radius=3, fill=color)
    draw.polygon([(x + 3, y + h), (x + 8, y + h), (x + 2, y + h + 4)], fill=color)

def draw_share_arrow(draw, x, y, size=13, color=(148, 163, 184)):
    # Diagonal paper plane / arrow
    draw.polygon([(x, y + size), (x + size, y), (x + size//2, y + size), (x + size//3, y + size//2)], fill=color)

def draw_bookmark(draw, x, y, w=10, h=14, color=(148, 163, 184)):
    draw.polygon([(x, y), (x + w, y), (x + w, y + h), (x + w//2, y + h - 4), (x, y + h)], fill=color)

def draw_home_icon(draw, x, y, size=16, color=(56, 189, 248)):
    # House roof + body
    draw.polygon([(x + size//2, y), (x + size, y + size//2), (x, y + size//2)], fill=color)
    draw.rectangle([x + 3, y + size//2, x + size - 3, y + size], fill=color)
    # Door cutout
    draw.rectangle([x + size//2 - 2, y + size - 5, x + size//2 + 2, y + size], fill=(10, 14, 23))

def draw_search_icon(draw, x, y, size=15, color=(148, 163, 184)):
    r = size - 5
    draw.ellipse([x, y, x + r, y + r], outline=color, width=2)
    draw.line([(x + r - 1, y + r - 1), (x + size, y + size)], fill=color, width=2)

def draw_plus_icon(draw, x, y, size=24, color=(56, 189, 248)):
    draw.rounded_rectangle([x, y, x + size, y + size], radius=7, fill=(23, 37, 84), outline=color, width=1)
    cx, cy = x + size//2, y + size//2
    draw.line([(cx - 5, cy), (cx + 5, cy)], fill="white", width=2)
    draw.line([(cx, cy - 5), (cx, cy + 5)], fill="white", width=2)

def draw_bell_icon(draw, x, y, size=16, color=(148, 163, 184)):
    # Bell dome
    draw.chord([x + 2, y, x + size - 2, y + size - 3], 180, 360, fill=color)
    draw.rectangle([x + 1, y + size - 4, x + size - 1, y + size - 2], fill=color)
    draw.ellipse([x + size//2 - 2, y + size - 2, x + size//2 + 2, y + size], fill=color)

def draw_profile_icon(draw, x, y, size=16, color=(148, 163, 184)):
    # Head
    draw.ellipse([x + size//2 - 4, y, x + size//2 + 4, y + 8], fill=color)
    # Shoulders
    draw.chord([x + 1, y + 7, x + size - 1, y + size + 3], 180, 360, fill=color)

def create_photorealistic_feed_phone():
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

    # 3. Phone Outer Chassis
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

    # 7. App Header: "Social Feed" + Message Icon Button
    hy = sy1 + 65
    draw.text((sx1 + 26, hy), "Social Feed", font=get_font(22, bold=True), fill=(255, 255, 255))
    
    # Message icon on top right (Drawn cleanly with shapes, NO broken emojis)
    draw.ellipse([sx2 - 62, hy - 2, sx2 - 26, hy + 34], fill=(30, 41, 59))
    draw_comment_bubble(draw, sx2 - 53, hy + 9, w=18, h=14, color=(241, 245, 249))
    # Unread badge
    draw.ellipse([sx2 - 34, hy - 4, sx2 - 18, hy + 12], fill=(239, 68, 68))
    draw.text((sx2 - 29, hy - 2), "3", font=get_font(10, bold=True), fill=(255, 255, 255))

    # 8. Stories Row (Fixed names, no truncation!)
    st_y = hy + 48
    avatars_data = [
        ("You", (59, 130, 246), (37, 99, 235), True),
        ("Aziz", (34, 211, 238), (14, 165, 233), False),
        ("Malika", (168, 85, 247), (139, 92, 246), False),
        ("Xumoyil", (52, 211, 153), (16, 185, 129), False),
        ("Jasur", (251, 191, 36), (245, 158, 11), False),
    ]

    for i, (name, col1, col2, is_self) in enumerate(avatars_data):
        ax = sx1 + 22 + i * 94
        # Gradient Ring
        draw.ellipse([ax - 2, st_y - 2, ax + 72 + 2, st_y + 72 + 2], outline=col1, width=2)
        # Avatar Circle
        draw.ellipse([ax + 3, st_y + 3, ax + 69, st_y + 69], fill=(30, 41, 59))
        
        skin_tones = [(254, 215, 170), (253, 186, 116), (254, 202, 202), (251, 191, 36), (243, 232, 255)]
        skin = skin_tones[i % len(skin_tones)]
        draw.ellipse([ax + 24, st_y + 16, ax + 48, st_y + 40], fill=skin)
        
        hair_cols = [(30, 41, 59), (71, 85, 105), (15, 23, 42), (67, 56, 202), (30, 58, 138)]
        draw.chord([ax + 22, st_y + 12, ax + 50, st_y + 34], 180, 360, fill=hair_cols[i % len(hair_cols)])
        draw.chord([ax + 14, st_y + 40, ax + 58, st_y + 68], 180, 360, fill=col2)

        if is_self:
            draw.ellipse([ax + 48, st_y + 48, ax + 68, st_y + 68], fill=(37, 99, 235), outline=(15, 23, 42), width=2)
            draw.text((ax + 54, st_y + 49), "+", font=get_font(12, bold=True), fill=(255, 255, 255))

        # Centered name label without truncation
        name_x = ax + 36 - (len(name) * 3)
        draw.text((name_x, st_y + 80), name, font=get_font(12, bold=True), fill=(203, 213, 225))

    draw.line([(sx1 + 15, st_y + 104), (sx2 - 15, st_y + 104)], fill=(30, 41, 59), width=1)

    # 9. Main Post Card: Elegant Modern Post
    post_y = st_y + 118
    draw.rounded_rectangle([sx1 + 16, post_y, sx2 - 16, post_y + 495], radius=24, fill=(23, 32, 51), outline=(38, 52, 80), width=1)

    # Post Author Row
    draw.ellipse([sx1 + 32, post_y + 16, sx1 + 72, post_y + 56], fill=(37, 99, 235))
    draw.text((sx1 + 43, post_y + 23), "X", font=get_font(19, bold=True), fill=(255, 255, 255))
    draw.ellipse([sx1 + 60, post_y + 44, sx1 + 72, post_y + 56], fill=(34, 197, 94), outline=(23, 32, 51), width=2)

    draw.text((sx1 + 84, post_y + 18), "Xumoyil Karim", font=get_font(15, bold=True), fill=(255, 255, 255))
    draw.text((sx1 + 84, post_y + 40), "University Campus Library • 2h ago", font=f_sub, fill=(148, 163, 184))
    
    # 3 dots menu
    for dot_i in range(3):
        draw.ellipse([sx2 - 50 + dot_i * 7, post_y + 32, sx2 - 46 + dot_i * 7, post_y + 36], fill=(148, 163, 184))

    # Post Image (Modern Glass Architecture Campus at Twilight with Real Gradient)
    img_y = post_y + 70
    draw.rounded_rectangle([sx1 + 28, img_y, sx2 - 28, img_y + 240], radius=16, fill=(15, 23, 42))

    # Cinematic smooth sunset sky gradient
    for l in range(240):
        t = l / 240.0
        # Dark royal indigo to subtle twilight cyan
        r = int(15 * (1 - t) + 20 * t)
        g = int(23 * (1 - t) + 45 * t)
        b = int(42 * (1 - t) + 75 * t)
        draw.line([(sx1 + 28, img_y + l), (sx2 - 28, img_y + l)], fill=(r, g, b))

    # Warm twilight sun
    draw.ellipse([sx2 - 100, img_y + 30, sx2 - 55, img_y + 75], fill=(253, 224, 71, 230))

    # Modern campus glass architecture silhouette
    draw.polygon([(sx1 + 45, img_y + 240), (sx1 + 45, img_y + 80), (sx1 + 230, img_y + 35), (sx1 + 230, img_y + 240)], fill=(30, 41, 59))
    draw.polygon([(sx1 + 230, img_y + 240), (sx1 + 230, img_y + 35), (sx2 - 45, img_y + 95), (sx2 - 45, img_y + 240)], fill=(19, 27, 43))
    
    # Glass reflection panels (Modern architectural bands)
    for wy in range(img_y + 70, img_y + 225, 26):
        draw.rounded_rectangle([sx1 + 65, wy, sx1 + 210, wy + 16], radius=3, fill=(56, 189, 248, 160))
        draw.rounded_rectangle([sx1 + 250, wy + 10, sx2 - 65, wy + 26], radius=3, fill=(34, 211, 238, 140))

    # Location pill tag
    draw.rounded_rectangle([sx1 + 40, img_y + 195, sx1 + 235, img_y + 227], radius=8, fill=(10, 14, 23, 210), outline=(56, 189, 248), width=1)
    # Location pin vector dot
    draw.ellipse([sx1 + 48, img_y + 207, sx1 + 56, img_y + 215], fill=(56, 189, 248))
    draw.text((sx1 + 62, img_y + 203), "National University Library", font=f_tag, fill=(241, 245, 249))

    # Action Bar (Clean Vector Icons, NO broken emojis!)
    act_y = img_y + 255
    # Heart icon + counter
    draw_heart(draw, sx1 + 34, act_y + 2, size=14, color=(244, 63, 94))
    draw.text((sx1 + 55, act_y), "284", font=get_font(13, bold=True), fill=(244, 63, 94))

    # Comment icon + counter
    draw_comment_bubble(draw, sx1 + 105, act_y + 3, w=15, h=12, color=(148, 163, 184))
    draw.text((sx1 + 128, act_y), "36", font=get_font(13, bold=True), fill=(203, 213, 225))

    # Share icon + text
    draw_share_arrow(draw, sx1 + 175, act_y + 3, size=13, color=(148, 163, 184))
    draw.text((sx1 + 196, act_y), "Share", font=get_font(13), fill=(148, 163, 184))

    # Bookmark icon
    draw_bookmark(draw, sx2 - 48, act_y + 2, w=11, h=15, color=(148, 163, 184))

    # Post Caption
    cap_y = act_y + 32
    draw.text((sx1 + 34, cap_y), "Great discussion session with classmates today!", font=get_font(13, bold=True), fill=(255, 255, 255))
    draw.text((sx1 + 34, cap_y + 20), "Preparing our bilingual university presentation...", font=f_sub, fill=(148, 163, 184))

    # Floating Notification Toast on Bottom of Post
    toast_y = post_y + 405
    draw.rounded_rectangle([sx1 + 28, toast_y, sx2 - 28, toast_y + 70], radius=16, fill=(15, 23, 42, 240), outline=(56, 189, 248), width=1)
    # File icon badge
    draw.ellipse([sx1 + 42, toast_y + 16, sx1 + 78, toast_y + 52], fill=(56, 189, 248))
    # Document sheet icon inside
    draw.rounded_rectangle([sx1 + 53, toast_y + 25, sx1 + 67, toast_y + 43], radius=2, fill=(15, 23, 42))
    draw.line([(sx1 + 56, toast_y + 30), (sx1 + 64, toast_y + 30)], fill=(56, 189, 248), width=2)
    draw.line([(sx1 + 56, toast_y + 35), (sx1 + 64, toast_y + 35)], fill=(56, 189, 248), width=2)

    draw.text((sx1 + 90, toast_y + 14), "Study Group • New Document", font=get_font(13, bold=True), fill=(255, 255, 255))
    draw.text((sx1 + 90, toast_y + 36), "Social Networks in My Life.pdf shared", font=f_sub, fill=(148, 163, 184))

    # 10. Bottom Navigation Bar (Handcrafted Vector Icons: Home, Search, Create, Bell, Profile)
    nav_y = sy2 - 68
    draw.rounded_rectangle([sx1, nav_y, sx2, sy2], radius=42, fill=(10, 14, 23))
    draw.line([(sx1, nav_y), (sx2, nav_y)], fill=(30, 41, 59), width=1)

    # Nav Icon 1: Home
    draw_home_icon(draw, sx1 + 42, nav_y + 16, size=18, color=(56, 189, 248))
    # Nav Icon 2: Search
    draw_search_icon(draw, sx1 + 132, nav_y + 17, size=17, color=(148, 163, 184))
    # Nav Icon 3: Create (+)
    draw_plus_icon(draw, sx1 + 218, nav_y + 12, size=26, color=(56, 189, 248))
    # Nav Icon 4: Bell / Notifications
    draw_bell_icon(draw, sx1 + 312, nav_y + 16, size=18, color=(148, 163, 184))
    # Nav Icon 5: Profile
    draw_profile_icon(draw, sx1 + 402, nav_y + 16, size=18, color=(148, 163, 184))

    # Home Indicator Line
    draw.rounded_rectangle([cx - 75, sy2 - 14, cx + 75, sy2 - 8], radius=3, fill=(148, 163, 184, 180))

    dest = os.path.join(ASSETS_DIR, "hero_phone.png")
    img.save(dest)
    print(f"Fixed hero phone with 100% clean vector icons saved to: {dest}")

create_photorealistic_feed_phone()
