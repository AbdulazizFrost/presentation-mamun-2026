import os
import math
from PIL import Image, ImageDraw, ImageFont

ASSETS_DIR = r"c:\Users\Abdulaziz\Desktop\призентация\assets"
os.makedirs(ASSETS_DIR, exist_ok=True)

def create_hero_graphic():
    # 800x600 modern glowing network visual
    W, H = 800, 600
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Center smartphone silhouette with subtle glow
    phone_x, phone_y, phone_w, phone_h = 280, 100, 240, 420
    # Outer glow
    for g in range(15, 0, -3):
        alpha = int(12 * (1 - g/15))
        draw.rounded_rectangle([phone_x - g, phone_y - g, phone_x + phone_w + g, phone_y + phone_h + g],
                               radius=38 + g, outline=(56, 189, 248, alpha), width=3)
    
    # Phone body
    draw.rounded_rectangle([phone_x, phone_y, phone_x + phone_w, phone_y + phone_h],
                           radius=38, fill=(17, 24, 39, 240), outline=(56, 189, 248, 200), width=4)
    # Phone inner screen
    draw.rounded_rectangle([phone_x + 12, phone_y + 16, phone_x + phone_w - 12, phone_y + phone_h - 16],
                           radius=28, fill=(15, 23, 42, 255))
    # Phone notch / speaker
    draw.rounded_rectangle([phone_x + 85, phone_y + 24, phone_x + 155, phone_y + 34],
                           radius=5, fill=(51, 65, 85, 255))
    
    # Screen UI cards
    # App header
    draw.rounded_rectangle([phone_x + 25, phone_y + 55, phone_x + phone_w - 25, phone_y + 115],
                           radius=14, fill=(30, 41, 59, 230), outline=(56, 189, 248, 120), width=2)
    # Screen mini chat 1
    draw.rounded_rectangle([phone_x + 25, phone_y + 130, phone_x + 180, phone_y + 185],
                           radius=12, fill=(37, 99, 235, 230))
    # Screen mini chat 2
    draw.rounded_rectangle([phone_x + 60, phone_y + 200, phone_x + phone_w - 25, phone_y + 255],
                           radius=12, fill=(30, 58, 138, 230))
    # Screen media card
    draw.rounded_rectangle([phone_x + 25, phone_y + 270, phone_x + phone_w - 25, phone_y + 360],
                           radius=14, fill=(15, 118, 110, 200), outline=(34, 211, 238, 150), width=2)

    # Interconnected satellite nodes around phone
    nodes = [
        (130, 160, (56, 189, 248), "Telegram", 45),
        (660, 180, (236, 72, 153), "Instagram", 45),
        (120, 420, (239, 68, 68), "YouTube", 45),
        (670, 410, (168, 85, 247), "Knowledge", 45),
        (400, 40, (34, 211, 238), "Global", 35),
    ]

    center_pts = [(phone_x + 40, phone_y + 90), (phone_x + 200, phone_y + 140),
                  (phone_x + 40, phone_y + 310), (phone_x + 200, phone_y + 330), (phone_x + 120, phone_y + 20)]

    for i, (nx, ny, col, label, rad) in enumerate(nodes):
        cx, cy = center_pts[i]
        # Connecting dashed-like line
        steps = 15
        for s in range(steps):
            t0 = s / steps
            t1 = (s + 0.6) / steps
            lx0 = nx + (cx - nx) * t0
            ly0 = ny + (cy - ny) * t0
            lx1 = nx + (cx - nx) * t1
            ly1 = ny + (cy - ny) * t1
            draw.line([(lx0, ly0), (lx1, ly1)], fill=(col[0], col[1], col[2], 140), width=3)
        
        # Glow around node
        for g in range(12, 0, -3):
            alpha = int(25 * (1 - g/12))
            draw.ellipse([nx - rad - g, ny - rad - g, nx + rad + g, ny + rad + g],
                         outline=(col[0], col[1], col[2], alpha), width=2)
        # Node circle
        draw.ellipse([nx - rad, ny - rad, nx + rad, ny + rad],
                     fill=(21, 32, 66, 240), outline=(col[0], col[1], col[2], 240), width=3)
        # Node center dot
        draw.ellipse([nx - 14, ny - 14, nx + 14, ny + 14], fill=(col[0], col[1], col[2], 255))

    img.save(os.path.join(ASSETS_DIR, "hero_graphic.png"))

def create_comm_graphic():
    # 600x500 communication visual
    W, H = 600, 500
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Two avatar circles and speech bubbles
    # Left avatar
    draw.ellipse([80, 200, 180, 300], fill=(30, 58, 138, 230), outline=(56, 189, 248, 255), width=4)
    # Head & shoulders icon inside
    draw.ellipse([115, 225, 145, 255], fill=(56, 189, 248, 255))
    draw.chord([95, 260, 165, 310], 180, 360, fill=(56, 189, 248, 255))

    # Right avatar
    draw.ellipse([420, 200, 520, 300], fill=(88, 28, 135, 230), outline=(168, 85, 247, 255), width=4)
    draw.ellipse([455, 225, 485, 255], fill=(168, 85, 247, 255))
    draw.chord([435, 260, 505, 310], 180, 360, fill=(168, 85, 247, 255))

    # Connecting digital wave
    for i in range(180, 420, 8):
        y_wave = int(250 + math.sin(i * 0.05) * 25)
        draw.ellipse([i - 3, y_wave - 3, i + 3, y_wave + 3], fill=(34, 211, 238, 200))

    # Top speech bubble
    draw.rounded_rectangle([190, 80, 390, 160], radius=16, fill=(30, 41, 59, 240), outline=(56, 189, 248, 200), width=3)
    # 3 message dots
    draw.ellipse([260, 115, 275, 130], fill=(56, 189, 248, 255))
    draw.ellipse([285, 115, 300, 130], fill=(34, 211, 238, 255))
    draw.ellipse([310, 115, 325, 130], fill=(168, 85, 247, 255))

    # Bottom photo / media share card
    draw.rounded_rectangle([210, 330, 390, 420], radius=16, fill=(21, 32, 66, 240), outline=(52, 211, 153, 200), width=3)
    # mini mountain & sun
    draw.polygon([(240, 390), (280, 355), (320, 390)], fill=(52, 211, 153, 220))
    draw.polygon([(300, 390), (335, 365), (365, 390)], fill=(34, 211, 238, 220))
    draw.ellipse([335, 345, 350, 360], fill=(251, 191, 36, 255))

    img.save(os.path.join(ASSETS_DIR, "comm_visual.png"))

def create_education_graphic():
    # 600x500 education visual
    W, H = 600, 500
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Laptop / Screen frame
    draw.rounded_rectangle([120, 120, 480, 360], radius=20, fill=(15, 23, 42, 245), outline=(56, 189, 248, 230), width=4)
    # Screen base stand
    draw.polygon([(80, 360), (520, 360), (540, 385), (60, 385)], fill=(30, 41, 59, 255), outline=(71, 85, 105, 255))
    
    # Graduation cap on top
    cap_center = (300, 90)
    draw.polygon([(300, 45), (410, 80), (300, 115), (190, 80)], fill=(217, 119, 6, 255))
    draw.polygon([(240, 95), (240, 130), (360, 130), (360, 95)], fill=(180, 83, 9, 255))
    draw.line([(390, 85), (415, 135)], fill=(251, 191, 36, 255), width=5)
    draw.ellipse([410, 132, 420, 142], fill=(251, 191, 36, 255))

    # Big Play Button in center of screen
    draw.ellipse([260, 200, 340, 280], fill=(37, 99, 235, 240), outline=(34, 211, 238, 255), width=3)
    draw.polygon([(290, 222), (322, 240), (290, 258)], fill="white")

    # Code / Lesson lines on sides
    for y in [160, 185, 210, 235, 260]:
        draw.rounded_rectangle([150, y, 220, y + 10], radius=5, fill=(51, 65, 85, 200))
    for y in [160, 185, 210, 235, 260]:
        draw.rounded_rectangle([380, y, 450, y + 10], radius=5, fill=(30, 58, 138, 200))

    img.save(os.path.join(ASSETS_DIR, "education_visual.png"))

def create_balance_graphic():
    # 600x500 balance / entertainment graphic
    W, H = 600, 500
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Balance fulcrum / triangle
    draw.polygon([(300, 260), (260, 380), (340, 380)], fill=(30, 41, 59, 255), outline=(56, 189, 248, 220), width=3)
    # Balance beam
    draw.rounded_rectangle([100, 250, 500, 266], radius=6, fill=(56, 189, 248, 255))

    # Left plate (Digital/Online)
    draw.line([(140, 266), (140, 330)], fill=(148, 163, 184, 255), width=3)
    draw.line([(200, 266), (200, 330)], fill=(148, 163, 184, 255), width=3)
    draw.chord([120, 310, 220, 350], 0, 180, fill=(30, 58, 138, 255), outline=(56, 189, 248, 255), width=3)
    # Smartphone inside left plate
    draw.rounded_rectangle([155, 275, 185, 325], radius=5, fill=(15, 23, 42, 255), outline=(34, 211, 238, 255), width=2)

    # Right plate (Real Life/Health)
    draw.line([(400, 266), (400, 330)], fill=(148, 163, 184, 255), width=3)
    draw.line([(460, 266), (460, 330)], fill=(148, 163, 184, 255), width=3)
    draw.chord([380, 310, 480, 350], 0, 180, fill=(16, 75, 55, 255), outline=(52, 211, 153, 255), width=3)
    # Heart / Plant / Book inside right plate
    draw.ellipse([420, 290, 440, 315], fill=(52, 211, 153, 255))
    draw.polygon([(410, 310), (450, 310), (430, 328)], fill=(52, 211, 153, 255))

    # Center glowing star of balance
    draw.ellipse([285, 205, 315, 235], fill=(251, 191, 36, 255))

    img.save(os.path.join(ASSETS_DIR, "balance_visual.png"))

create_hero_graphic()
create_comm_graphic()
create_education_graphic()
create_balance_graphic()
print("All slide visuals generated successfully!")
