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

def create_network_visual():
    # 800x600 for Slide 2 (What are Social Networks?)
    W, H = 800, 600
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Clean Card container
    card_x1, card_y1, card_x2, card_y2 = 40, 30, 760, 560
    for s in range(12):
        draw.rounded_rectangle([card_x1 - s, card_y1 + s, card_x2 + s, card_y2 + s], radius=24, fill=(0, 0, 0, int(10 - s/1.5)))
    draw.rounded_rectangle([card_x1, card_y1, card_x2, card_y2], radius=24, fill=(255, 255, 255), outline=(226, 232, 240), width=2)

    # Center Hub Node
    cx, cy = (card_x1 + card_x2)//2, (card_y1 + card_y2)//2
    
    # Outer pulse rings
    for r in [180, 130, 85]:
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(226, 232, 240), width=1)

    # 3 Satellite Hubs representing: Communication, Information, Content Sharing
    satellites = [
        (-140, -110, (37, 99, 235), "Communication", "Muloqot", "Instant messaging & global voice"),
        (150, -90, (14, 165, 233), "Information", "Ma’lumot", "Live news & academic research"),
        (0, 150, (147, 51, 234), "Content Sharing", "Kontent almashish", "Creative photos, reels & ideas")
    ]

    for dx, dy, col, en_t, uz_t, desc in satellites:
        sx, sy = cx + dx, cy + dy
        # Connecting line
        draw.line([(cx, cy), (sx, sy)], fill=col, width=2)
        # Satellite Card
        sw, sh = 230, 80
        draw.rounded_rectangle([sx - sw//2, sy - sh//2, sx + sw//2, sy + sh//2], radius=16, fill=(248, 250, 252), outline=col, width=2)
        draw.ellipse([sx - sw//2 + 12, sy - 18, sx - sw//2 + 48, sy + 18], fill=col)
        draw.text((sx - sw//2 + 60, sy - 24), en_t, font=get_font(13, bold=True), fill=(15, 23, 42))
        draw.text((sx - sw//2 + 60, sy - 4), uz_t, font=get_font(11), fill=col)
        draw.text((sx - sw//2 + 60, sy + 14), desc, font=get_font(9), fill=(100, 116, 139))

    # Center Main Node
    draw.ellipse([cx - 45, cy - 45, cx + 45, cy + 45], fill=(15, 23, 42), outline=(37, 99, 235), width=3)
    draw.ellipse([cx - 15, cy - 15, cx + 15, cy + 15], fill=(37, 99, 235))
    draw.text((cx - 28, cy + 55), "Global Web", font=get_font(12, bold=True), fill=(71, 85, 105))

    img.save(os.path.join(ASSETS_DIR, "network_visual.png"))

def create_platforms_visual():
    # 800x600 for Slide 3 (Social Networks I Use)
    W, H = 800, 600
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    card_x1, card_y1, card_x2, card_y2 = 40, 30, 760, 560
    for s in range(12):
        draw.rounded_rectangle([card_x1 - s, card_y1 + s, card_x2 + s, card_y2 + s], radius=24, fill=(0, 0, 0, int(10 - s/1.5)))
    draw.rounded_rectangle([card_x1, card_y1, card_x2, card_y2], radius=24, fill=(255, 255, 255), outline=(226, 232, 240), width=2)

    # Top Header
    draw.text((card_x1 + 35, card_y1 + 30), "Student Ecosystem & Everyday Apps", font=get_font(18, bold=True), fill=(15, 23, 42))
    draw.text((card_x1 + 35, card_y1 + 56), "Talabalar hayotidagi ommabop dasturlar va ularning vazifalari", font=get_font(12), fill=(100, 116, 139))

    # 3 Asymmetrical Editorial Row Banners
    apps = [
        ("Telegram", "Communication & Useful Information", "Muloqot va foydali ma’lumotlar uchun",
         "University channels • Rapid PDF & study material exchange • Zero friction", (0, 136, 204), "TG"),
        ("Instagram", "Photos, Videos & Creative Content", "Fotosuratlar, videolar va ijodiy kontent uchun",
         "Visual storytelling • Design & creative accounts • Short inspiration reels", (225, 48, 108), "IG"),
        ("YouTube", "Education & Entertainment", "Ta’lim va ko‘ngilochar kontent uchun",
         "In-depth lectures & tutorials • Academic documentaries • Relaxing podcasts", (239, 68, 68), "YT")
    ]

    for i, (name, en_sub, uz_sub, detail, col, badge) in enumerate(apps):
        ry = card_y1 + 105 + i * 140
        draw.rounded_rectangle([card_x1 + 30, ry, card_x2 - 30, ry + 120], radius=16, fill=(248, 250, 252), outline=(226, 232, 240), width=1)
        # Left brand accent strip
        draw.rounded_rectangle([card_x1 + 30, ry, card_x1 + 38, ry + 120], radius=4, fill=col)
        
        # Badge circle
        draw.ellipse([card_x1 + 55, ry + 30, card_x1 + 115, ry + 90], fill=col)
        draw.text((card_x1 + 72, ry + 46), badge, font=get_font(18, bold=True), fill=(255, 255, 255))

        # Text
        draw.text((card_x1 + 135, ry + 22), name, font=get_font(18, bold=True), fill=(15, 23, 42))
        draw.text((card_x1 + 250, ry + 26), f"•  {en_sub}", font=get_font(12, bold=True), fill=col)
        draw.text((card_x1 + 135, ry + 50), uz_sub, font=get_font(12), fill=(100, 116, 139))
        draw.text((card_x1 + 135, ry + 78), detail, font=get_font(11, bold=True), fill=(51, 65, 85))

    img.save(os.path.join(ASSETS_DIR, "platforms_visual.png"))

def create_infographic_visual():
    # 800x600 for Slide 4 (Why Do I Use Social Networks?)
    W, H = 800, 600
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    card_x1, card_y1, card_x2, card_y2 = 40, 30, 760, 560
    for s in range(12):
        draw.rounded_rectangle([card_x1 - s, card_y1 + s, card_x2 + s, card_y2 + s], radius=24, fill=(0, 0, 0, int(10 - s/1.5)))
    draw.rounded_rectangle([card_x1, card_y1, card_x2, card_y2], radius=24, fill=(255, 255, 255), outline=(226, 232, 240), width=2)

    # 4 Quadrants
    quads = [
        (card_x1 + 25, card_y1 + 25, (card_x1 + card_x2)//2 - 10, (card_y1 + card_y2)//2 - 10,
         "01", "Communication", "Muloqot", "Staying connected with friends, family, and peers 24/7.", (37, 99, 235)),
        ((card_x1 + card_x2)//2 + 10, card_y1 + 25, card_x2 - 25, (card_y1 + card_y2)//2 - 10,
         "02", "Information", "Ma’lumot", "Instant access to campus alerts, world news, and updates.", (14, 165, 233)),
        (card_x1 + 25, (card_y1 + card_y2)//2 + 10, (card_x1 + card_x2)//2 - 10, card_y2 - 25,
         "03", "Learning", "O‘rganish", "Acquiring practical skills, foreign languages, and study advice.", (109, 40, 217)),
        ((card_x1 + card_x2)//2 + 10, (card_y1 + card_y2)//2 + 10, card_x2 - 25, card_y2 - 25,
         "04", "Entertainment", "Ko‘ngilochar", "Relaxing with music, creative media, and peaceful rest.", (16, 185, 129))
    ]

    for qx1, qy1, qx2, qy2, num, en_t, uz_t, desc, col in quads:
        draw.rounded_rectangle([qx1, qy1, qx2, qy2], radius=16, fill=(248, 250, 252), outline=(226, 232, 240), width=1)
        # Top number pill
        draw.rounded_rectangle([qx1 + 20, qy1 + 20, qx1 + 65, qy1 + 55], radius=10, fill=col)
        draw.text((qx1 + 30, qy1 + 26), num, font=get_font(15, bold=True), fill=(255, 255, 255))
        
        draw.text((qx1 + 80, qy1 + 20), en_t, font=get_font(18, bold=True), fill=(15, 23, 42))
        draw.text((qx1 + 80, qy1 + 45), uz_t, font=get_font(13), fill=col)
        draw.text((qx1 + 20, qy1 + 80), desc, font=get_font(11), fill=(71, 85, 105))

    img.save(os.path.join(ASSETS_DIR, "infographic_visual.png"))

create_network_visual()
create_platforms_visual()
create_infographic_visual()
print("All remaining premium visuals generated successfully!")
