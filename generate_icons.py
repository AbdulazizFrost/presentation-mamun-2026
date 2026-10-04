import os
from PIL import Image, ImageDraw, ImageFont

ASSETS_DIR = r"c:\Users\Abdulaziz\Desktop\призентация\assets"
os.makedirs(ASSETS_DIR, exist_ok=True)

def create_telegram_icon():
    size = (512, 512)
    img = Image.new("RGBA", size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    # Circle base
    draw.ellipse([20, 20, 492, 492], fill="#0088CC")
    # Paper plane polygon
    plane_pts = [
        (110, 250),
        (380, 140),
        (320, 390),
        (245, 305),
        (205, 345),
        (215, 275),
        (340, 190)
    ]
    # Draw paper airplane wings
    draw.polygon([(110, 250), (380, 140), (220, 280)], fill="#E1ECF4")
    draw.polygon([(380, 140), (320, 390), (245, 305)], fill="#FFFFFF")
    draw.polygon([(245, 305), (205, 345), (220, 280)], fill="#B4D7EF")
    img.save(os.path.join(ASSETS_DIR, "telegram.png"))

def create_instagram_icon():
    size = (512, 512)
    img = Image.new("RGBA", size, (0, 0, 0, 0))
    # Gradient background
    base = Image.new("RGB", size, (0, 0, 0))
    # Create smooth radial / angled gradient
    for y in range(512):
        for x in range(512):
            # blend from bottom-left yellow/orange to top-right purple/pink
            r = int(240 - x * 0.2 + y * 0.1)
            g = int(40 + x * 0.2 - y * 0.1)
            b = int(140 + x * 0.2 - y * 0.2)
            r = max(0, min(255, r))
            g = max(0, min(255, g))
            b = max(0, min(255, b))
            base.putpixel((x, y), (r, g, b))
    
    # Mask to rounded rectangle
    mask = Image.new("L", size, 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.rounded_rectangle([30, 30, 482, 482], radius=110, fill=255)
    
    img.paste(base, (0, 0), mask)
    draw = ImageDraw.Draw(img)
    # Camera outer outline
    draw.rounded_rectangle([110, 110, 402, 402], radius=75, outline="white", width=30)
    # Camera lens circle
    draw.ellipse([185, 185, 327, 327], outline="white", width=30)
    # Camera flash dot
    draw.ellipse([345, 150, 375, 180], fill="white")
    
    img.save(os.path.join(ASSETS_DIR, "instagram.png"))

def create_youtube_icon():
    size = (512, 512)
    img = Image.new("RGBA", size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    # Red rounded rectangle
    draw.rounded_rectangle([30, 90, 482, 422], radius=100, fill="#FF0000")
    # White triangle play button
    draw.polygon([(210, 190), (350, 256), (210, 322)], fill="white")
    img.save(os.path.join(ASSETS_DIR, "youtube.png"))

create_telegram_icon()
create_instagram_icon()
create_youtube_icon()
print("Platform icons generated successfully!")
