import os
import math
from PIL import Image, ImageDraw, ImageFont

WORKSPACE_DIR = r"c:\Users\Abdulaziz\Desktop\призентация"
ASSETS_DIR = os.path.join(WORKSPACE_DIR, "assets_premium")

def get_font(size, bold=False):
    font_paths = [
        r"C:\Windows\Fonts\segoeuib.ttf" if bold else r"C:\Windows\Fonts\segoeui.ttf",
        r"C:\Windows\Fonts\arialbd.ttf" if bold else r"C:\Windows\Fonts\arial.ttf"
    ]
    for p in font_paths:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                pass
    return ImageFont.load_default()

def draw_star(draw, cx, cy, r=7, color=(251, 191, 36)):
    points = []
    for i in range(10):
        angle = i * math.pi / 5 - math.pi / 2
        curr_r = r if i % 2 == 0 else r * 0.45
        points.append((cx + curr_r * math.cos(angle), cy + curr_r * math.sin(angle)))
    draw.polygon(points, fill=color)

def draw_play_icon(draw, cx, cy, r, color="white"):
    h = int(r * 0.85)
    w = int(r * 0.75)
    points = [
        (cx - w // 2 + 3, cy - h),
        (cx + w // 2 + 5, cy),
        (cx - w // 2 + 3, cy + h)
    ]
    draw.polygon(points, fill=color)

def draw_pause_icon(draw, cx, cy, h=12, color="white"):
    w = 3
    draw.rounded_rectangle([cx - 5, cy - h//2, cx - 5 + w, cy + h//2], radius=1, fill=color)
    draw.rounded_rectangle([cx + 2, cy - h//2, cx + 2 + w, cy + h//2], radius=1, fill=color)

def draw_volume_icon(draw, cx, cy, color="white"):
    draw.polygon([(cx - 7, cy - 3), (cx - 3, cy - 3), (cx + 2, cy - 7), (cx + 2, cy + 7), (cx - 3, cy + 3), (cx - 7, cy + 3)], fill=color)
    draw.arc([cx + 3, cy - 6, cx + 9, cy + 6], 300, 60, fill=color, width=2)

def draw_verified_badge(draw, cx, cy, r=8):
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(37, 99, 235))
    draw.line([(cx - 4, cy), (cx - 1, cy + 3), (cx + 4, cy - 3)], fill="white", width=2)

def draw_video_icon(draw, x, y, size=18, color=(56, 189, 248)):
    draw.rounded_rectangle([x, y + 2, x + 12, y + size - 2], radius=3, fill=color)
    draw.polygon([(x + 12, y + 5), (x + 18, y + 2), (x + 18, y + size - 2), (x + 12, y + size - 5)], fill=color)

def draw_graduation_cap(draw, x, y, size=18, color=(52, 211, 153)):
    cx = x + size // 2
    draw.polygon([(cx, y + 1), (x + size - 1, y + 6), (cx, y + 12), (x + 1, y + 6)], fill=color)
    draw.polygon([(x + 3, y + 7), (x + size - 3, y + 7), (x + size - 5, y + 14), (x + 5, y + 14)], fill=color)
    draw.line([(x + size - 2, y + 6), (x + size - 1, y + 15)], fill=color, width=2)

def draw_book_icon(draw, x, y, size=18, color=(192, 132, 252)):
    cx = x + size // 2
    draw.line([(cx, y + 2), (cx, y + size - 1)], fill=color, width=2)
    draw.rounded_rectangle([x + 1, y + 3, cx - 2, y + size - 2], radius=2, outline=color, width=2)
    draw.rounded_rectangle([cx + 2, y + 3, x + size - 1, y + size - 2], radius=2, outline=color, width=2)
    draw.line([(x + 3, y + 7), (cx - 4, y + 7)], fill=color, width=1)
    draw.line([(cx + 4, y + 7), (x + size - 3, y + 7)], fill=color, width=1)

def draw_bookmark_icon(draw, x, y, size=16, color=(56, 189, 248)):
    draw.polygon([(x + 3, y + 1), (x + size - 3, y + 1), (x + size - 3, y + size - 1), (x + size//2, y + size - 5), (x + 3, y + size - 1)], outline=color, fill=None)

def create_super_premium_education_player():
    W, H = 800, 600
    base_img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    
    card_x1, card_y1, card_x2, card_y2 = 36, 22, 764, 578

    # 1. Soft Shadow Layer
    shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sdraw = ImageDraw.Draw(shadow)
    for s in range(20):
        alpha = int(22 - s * 1.05)
        sdraw.rounded_rectangle([card_x1 - s, card_y1 + s * 1.2, card_x2 + s, card_y2 + s * 1.2], radius=26, fill=(0, 0, 0, max(0, alpha)))
    base_img = Image.alpha_composite(base_img, shadow)

    draw = ImageDraw.Draw(base_img)

    # 2. Main Card Surface (Deep Slate 900)
    draw.rounded_rectangle([card_x1, card_y1, card_x2, card_y2], radius=24, fill=(15, 23, 42), outline=(30, 41, 59), width=2)

    # Top ambient glow line
    draw.line([(card_x1 + 40, card_y1), (card_x2 - 40, card_y1)], fill=(56, 189, 248), width=1)

    # -------------------------------------------------------------
    # 3. VIDEO VIEWPORT
    # -------------------------------------------------------------
    vx1 = card_x1 + 16
    vy1 = card_y1 + 16
    vx2 = card_x2 - 16
    vy2 = card_y1 + 346

    # Video viewport container
    draw.rounded_rectangle([vx1, vy1, vx2, vy2], radius=18, fill=(10, 15, 26), outline=(51, 65, 85), width=1)

    # Video background gradient
    for y in range(vy1 + 1, vy2):
        t = (y - vy1) / (vy2 - vy1)
        r = int(14 + 14 * t)
        g = int(20 + 16 * t)
        b = int(36 + 24 * t)
        draw.line([(vx1 + 1, y), (vx2 - 1, y)], fill=(r, g, b))

    # Background Presentation Slide inside Video
    sl_x1, sl_y1, sl_x2, sl_y2 = vx1 + 24, vy1 + 46, vx2 - 160, vy2 - 58
    draw.rounded_rectangle([sl_x1, sl_y1, sl_x2, sl_y2], radius=12, fill=(15, 23, 42), outline=(59, 130, 246), width=1)

    # Slide Header
    draw.text((sl_x1 + 20, sl_y1 + 14), "MODULE 03 • DIGITAL RHETORIC & SPEECH", font=get_font(10, bold=True), fill=(56, 189, 248))
    draw.text((sl_x1 + 20, sl_y1 + 30), "How to Structure an Impactful 5-Min Talk", font=get_font(14, bold=True), fill=(255, 255, 255))

    # 2 side cards so center remains open for play button
    sw = 145
    # Left card: Hook
    draw.rounded_rectangle([sl_x1 + 20, sl_y1 + 62, sl_x1 + 20 + sw, sl_y1 + 135], radius=8, fill=(24, 33, 53), outline=(56, 189, 248), width=1)
    draw.ellipse([sl_x1 + 30, sl_y1 + 72, sl_x1 + 38, sl_y1 + 80], fill=(56, 189, 248))
    draw.text((sl_x1 + 44, sl_y1 + 70), "1. Strong Hook", font=get_font(11, bold=True), fill=(255, 255, 255))
    draw.text((sl_x1 + 30, sl_y1 + 94), "Capture attention in", font=get_font(10), fill=(148, 163, 184))
    draw.text((sl_x1 + 30, sl_y1 + 110), "the first 15 seconds", font=get_font(10), fill=(148, 163, 184))

    # Right card: Call to action
    rx = sl_x2 - 20 - sw
    draw.rounded_rectangle([rx, sl_y1 + 62, rx + sw, sl_y1 + 135], radius=8, fill=(24, 33, 53), outline=(52, 211, 153), width=1)
    draw.ellipse([rx + 10, sl_y1 + 72, rx + 18, sl_y1 + 80], fill=(52, 211, 153))
    draw.text((rx + 24, sl_y1 + 70), "2. Core Story", font=get_font(11, bold=True), fill=(255, 255, 255))
    draw.text((rx + 10, sl_y1 + 94), "One clear thesis &", font=get_font(10), fill=(148, 163, 184))
    draw.text((rx + 10, sl_y1 + 110), "practical takeaway", font=get_font(10), fill=(148, 163, 184))

    # Connecting subtle arrow across center
    draw.line([(sl_x1 + 20 + sw, sl_y1 + 98), (rx, sl_y1 + 98)], fill=(51, 65, 85), width=2)

    # Picture-in-Picture Lecturer Camera on bottom-right of video
    pip_w, pip_h = 126, 88
    pip_x2, pip_y2 = vx2 - 20, vy2 - 58
    pip_x1, pip_y1 = pip_x2 - pip_w, pip_y2 - pip_h
    draw.rounded_rectangle([pip_x1, pip_y1, pip_x2, pip_y2], radius=10, fill=(15, 23, 42), outline=(56, 189, 248), width=1)
    
    # Lecturer avatar inside PIP
    draw.ellipse([pip_x1 + 43, pip_y1 + 12, pip_x1 + 83, pip_y1 + 52], fill=(30, 41, 59))
    draw.ellipse([pip_x1 + 53, pip_y1 + 18, pip_x1 + 73, pip_y1 + 38], fill=(241, 245, 249)) # face
    draw.chord([pip_x1 + 47, pip_y1 + 40, pip_x1 + 79, pip_y1 + 66], 180, 360, fill=(37, 99, 235)) # body
    
    # PIP Label bar
    draw.rounded_rectangle([pip_x1 + 6, pip_y2 - 24, pip_x2 - 6, pip_y2 - 6], radius=4, fill=(10, 15, 26), outline=(30, 41, 59), width=1)
    draw.ellipse([pip_x1 + 12, pip_y2 - 17, pip_x1 + 18, pip_y2 - 11], fill=(34, 197, 94))
    draw.text((pip_x1 + 22, pip_y2 - 21), "Dr. Alisher (Live)", font=get_font(9, bold=True), fill="white")

    # Top overlay badges inside video
    # Left: HD 1080p Lecture badge
    draw.rounded_rectangle([vx1 + 18, vy1 + 14, vx1 + 160, vy1 + 38], radius=6, fill=(15, 23, 42), outline=(51, 65, 85), width=1)
    draw.ellipse([vx1 + 26, vy1 + 22, vx1 + 34, vy1 + 30], fill=(239, 68, 68)) # red live dot
    draw.text((vx1 + 40, vy1 + 19), "HD • 1080p Lecture", font=get_font(10, bold=True), fill=(255, 255, 255))
    
    # Right: CC and 60fps badges
    draw.rounded_rectangle([vx2 - 105, vy1 + 14, vx2 - 68, vy1 + 38], radius=6, fill=(15, 23, 42), outline=(56, 189, 248), width=1)
    draw.text((vx2 - 95, vy1 + 19), "CC", font=get_font(10, bold=True), fill=(56, 189, 248))
    draw.rounded_rectangle([vx2 - 60, vy1 + 14, vx2 - 18, vy1 + 38], radius=6, fill=(15, 23, 42), outline=(51, 65, 85), width=1)
    draw.text((vx2 - 52, vy1 + 19), "60fps", font=get_font(10, bold=True), fill=(203, 213, 225))

    # Center glowing play button (draw cleanly with solid sapphire blue and cyan border)
    cx, cy = (sl_x1 + sl_x2) // 2, (vy1 + vy2) // 2 - 5
    
    # Glow circle
    glow_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(glow_layer)
    for r in range(48, 34, -2):
        alpha = int(35 * (1 - (r - 34) / 14))
        gdraw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(14, 165, 233, alpha))
    base_img = Image.alpha_composite(base_img, glow_layer)
    draw = ImageDraw.Draw(base_img)

    # Button outer circle
    draw.ellipse([cx - 36, cy - 36, cx + 36, cy + 36], fill=(37, 99, 235), outline=(56, 189, 248), width=3)
    draw.ellipse([cx - 32, cy - 32, cx + 32, cy + 32], outline=(96, 165, 250), width=1)
    draw_play_icon(draw, cx, cy, r=16, color="white")

    # Bottom Video Controls Bar (Solid Dark Slate Overlay)
    draw.rounded_rectangle([vx1 + 1, vy2 - 46, vx2 - 1, vy2 - 1], radius=0, fill=(10, 15, 26))
    draw.line([(vx1 + 1, vy2 - 46), (vx2 - 1, vy2 - 46)], fill=(30, 41, 59), width=1)

    # Scrubber Bar
    scr_y = vy2 - 32
    scr_x1 = vx1 + 20
    scr_x2 = vx2 - 20
    total_len = scr_x2 - scr_x1
    progress_len = int(total_len * 0.41)
    buffer_len = int(total_len * 0.78)

    # Scrubber track background
    draw.rounded_rectangle([scr_x1, scr_y - 2, scr_x2, scr_y + 2], radius=2, fill=(51, 65, 85))
    # Loaded buffer
    draw.rounded_rectangle([scr_x1, scr_y - 2, scr_x1 + buffer_len, scr_y + 2], radius=2, fill=(100, 116, 139))
    # Active progress (vibrant sky-blue)
    draw.rounded_rectangle([scr_x1, scr_y - 3, scr_x1 + progress_len, scr_y + 3], radius=3, fill=(56, 189, 248))
    # Chapter markers along scrubber
    for ch in [0.25, 0.41, 0.68, 0.88]:
        tx = scr_x1 + int(total_len * ch)
        draw.line([(tx, scr_y - 4), (tx, scr_y + 4)], fill=(10, 15, 26), width=2)
    # Pin handle
    pin_x = scr_x1 + progress_len
    draw.ellipse([pin_x - 5, scr_y - 5, pin_x + 5, scr_y + 5], fill="white", outline=(37, 99, 235), width=2)

    # Controls Row
    ctrl_y = vy2 - 15
    draw_pause_icon(draw, vx1 + 28, ctrl_y, h=10, color="white")
    draw_volume_icon(draw, vx1 + 52, ctrl_y, color="white")
    # Volume mini bar
    draw.rounded_rectangle([vx1 + 64, ctrl_y - 2, vx1 + 104, ctrl_y + 2], radius=2, fill=(71, 85, 105))
    draw.rounded_rectangle([vx1 + 64, ctrl_y - 2, vx1 + 92, ctrl_y + 2], radius=2, fill=(56, 189, 248))
    # Time
    draw.text((vx1 + 115, ctrl_y - 7), "18:24 / 45:00", font=get_font(10, bold=True), fill=(226, 232, 240))

    # Right side icons
    gx = vx2 - 65
    draw.ellipse([gx - 5, ctrl_y - 5, gx + 5, ctrl_y + 5], outline="white", width=2)
    draw.ellipse([gx - 1, ctrl_y - 1, gx + 1, ctrl_y + 1], fill="white")
    fx = vx2 - 32
    f_s = 5
    draw.line([(fx - f_s, ctrl_y - f_s), (fx - f_s + 4, ctrl_y - f_s)], fill="white", width=2)
    draw.line([(fx - f_s, ctrl_y - f_s), (fx - f_s, ctrl_y - f_s + 4)], fill="white", width=2)
    draw.line([(fx + f_s, ctrl_y - f_s), (fx + f_s - 4, ctrl_y - f_s)], fill="white", width=2)
    draw.line([(fx + f_s, ctrl_y - f_s), (fx + f_s, ctrl_y - f_s + 4)], fill="white", width=2)
    draw.line([(fx - f_s, ctrl_y + f_s), (fx - f_s + 4, ctrl_y + f_s)], fill="white", width=2)
    draw.line([(fx - f_s, ctrl_y + f_s), (fx - f_s, ctrl_y + f_s - 4)], fill="white", width=2)
    draw.line([(fx + f_s, ctrl_y + f_s), (fx + f_s - 4, ctrl_y + f_s)], fill="white", width=2)
    draw.line([(fx + f_s, ctrl_y + f_s), (fx + f_s, ctrl_y - f_s + 4)], fill="white", width=2)

    # -------------------------------------------------------------
    # 4. VIDEO TITLE & METADATA SECTION
    # -------------------------------------------------------------
    meta_y = card_y1 + 364

    # Title
    draw.text((card_x1 + 24, meta_y), "Mastering Public Speaking & Digital Communication", font=get_font(18, bold=True), fill=(255, 255, 255))

    # Channel Crest Avatar
    av_cx, av_cy = card_x1 + 42, meta_y + 44
    draw.ellipse([av_cx - 18, av_cy - 18, av_cx + 18, av_cy + 18], fill=(30, 41, 59), outline=(56, 189, 248), width=1)
    draw_graduation_cap(draw, av_cx - 9, av_cy - 9, size=18, color=(56, 189, 248))

    # Channel Name & Verified Badge
    draw.text((card_x1 + 72, meta_y + 32), "Global Academy", font=get_font(14, bold=True), fill=(255, 255, 255))
    draw_verified_badge(draw, card_x1 + 192, meta_y + 41, r=7)

    # Stats: students & drawn star rating
    draw.text((card_x1 + 72, meta_y + 51), "340,000 enrolled students", font=get_font(12), fill=(148, 163, 184))
    draw.text((card_x1 + 234, meta_y + 51), "•", font=get_font(12), fill=(100, 116, 139))
    
    # Drawn Star
    draw_star(draw, card_x1 + 252, meta_y + 58, r=6, color=(251, 191, 36))
    draw.text((card_x1 + 263, meta_y + 50), "4.9", font=get_font(12, bold=True), fill=(251, 191, 36))
    draw.text((card_x1 + 288, meta_y + 51), "(14.2k ratings)", font=get_font(12), fill=(148, 163, 184))

    # Right side: Bookmark / Save Lecture Button
    btn_w = 140
    btn_x = card_x2 - 24 - btn_w
    btn_y = meta_y + 28
    draw.rounded_rectangle([btn_x, btn_y, btn_x + btn_w, btn_y + 38], radius=19, fill=(24, 33, 53), outline=(59, 130, 246), width=1)
    draw_bookmark_icon(draw, btn_x + 16, btn_y + 11, size=16, color=(56, 189, 248))
    draw.text((btn_x + 40, btn_y + 11), "Save Lecture", font=get_font(12, bold=True), fill=(241, 245, 249))

    # -------------------------------------------------------------
    # 5. CATEGORY FEATURE PILLS (NO UNICODE ISSUES, ULTRA HIGH CONTRAST)
    # -------------------------------------------------------------
    pills_y = card_y1 + 458
    pills = [
        ("Video Lessons", "Ta’limiy videolar", (56, 189, 248), "video"),
        ("Online Courses", "Onlayn kurslar", (52, 211, 153), "grad"),
        ("Academic Resources", "Ilmiy manbalar", (192, 132, 252), "book"),
    ]

    pill_gap = 14
    total_pills_w = card_x2 - card_x1 - 48
    pill_w = (total_pills_w - pill_gap * 2) // 3

    for pi, (title, sub, accent_col, icon_type) in enumerate(pills):
        px = card_x1 + 24 + pi * (pill_w + pill_gap)
        
        # Dark slate pill card
        draw.rounded_rectangle([px, pills_y, px + pill_w, pills_y + 64], radius=14, fill=(24, 33, 53), outline=(51, 65, 85), width=1)
        # Left accent indicator bar
        draw.rounded_rectangle([px + 1, pills_y + 4, px + 5, pills_y + 60], radius=2, fill=accent_col)

        # Icon box
        ic_bg_x = px + 14
        ic_bg_y = pills_y + 14
        draw.rounded_rectangle([ic_bg_x, ic_bg_y, ic_bg_x + 36, ic_bg_y + 36], radius=10, fill=(15, 23, 42), outline=accent_col, width=1)
        
        if icon_type == "video":
            draw_video_icon(draw, ic_bg_x + 9, ic_bg_y + 9, size=18, color=accent_col)
        elif icon_type == "grad":
            draw_graduation_cap(draw, ic_bg_x + 9, ic_bg_y + 9, size=18, color=accent_col)
        elif icon_type == "book":
            draw_book_icon(draw, ic_bg_x + 9, ic_bg_y + 9, size=18, color=accent_col)

        # Labels
        draw.text((px + 58, pills_y + 14), title, font=get_font(13, bold=True), fill=(255, 255, 255))
        draw.text((px + 58, pills_y + 35), sub, font=get_font(11), fill=(148, 163, 184))

    dest = os.path.join(ASSETS_DIR, "education_player.png")
    base_img.save(dest)
    print(f"Super premium education player saved to {dest}")

if __name__ == "__main__":
    create_super_premium_education_player()
