import os
from PIL import Image, ImageDraw, ImageFont

WORKSPACE_DIR = r"c:\Users\Abdulaziz\Desktop\призентация"
ASSETS_DIR = os.path.join(WORKSPACE_DIR, "assets_premium")
ORIGINAL_ASSETS_DIR = os.path.join(WORKSPACE_DIR, "assets")

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
         "University channels • Rapid PDF & study material exchange • Fast messaging", (0, 136, 204), "telegram.png"),
        ("Instagram", "Photos, Videos & Creative Content", "Fotosuratlar, videolar va ijodiy kontent uchun",
         "Visual storytelling • Design & creative accounts • Short inspiration reels", (225, 48, 108), "instagram.png"),
        ("YouTube", "Education & Entertainment", "Ta’lim va ko‘ngilochar kontent uchun",
         "In-depth lectures & tutorials • Academic documentaries • Relaxing podcasts", (239, 68, 68), "youtube.png")
    ]

    for i, (name, en_sub, uz_sub, detail, col, logo_filename) in enumerate(apps):
        ry = card_y1 + 105 + i * 140
        # Row card
        draw.rounded_rectangle([card_x1 + 30, ry, card_x2 - 30, ry + 120], radius=16, fill=(30, 41, 59), outline=col, width=1)
        # Left brand accent indicator
        draw.rounded_rectangle([card_x1 + 30, ry, card_x1 + 38, ry + 120], radius=4, fill=col)
        
        # Paste real official logo
        logo_path = os.path.join(ORIGINAL_ASSETS_DIR, logo_filename)
        if os.path.exists(logo_path):
            logo_img = Image.open(logo_path).convert("RGBA")
            logo_resized = logo_img.resize((64, 64), Image.Resampling.LANCZOS)
            img.paste(logo_resized, (card_x1 + 50, ry + 28), logo_resized)

        draw.text((card_x1 + 135, ry + 22), name, font=get_font(18, bold=True), fill=(255, 255, 255))
        draw.text((card_x1 + 250, ry + 26), f"•  {en_sub}", font=get_font(12, bold=True), fill=col)
        draw.text((card_x1 + 135, ry + 50), uz_sub, font=get_font(12), fill=(148, 163, 184))
        draw.text((card_x1 + 135, ry + 78), detail, font=get_font(11, bold=True), fill=(203, 213, 225))

    dest_path = os.path.join(ASSETS_DIR, "platforms_visual.png")
    img.save(dest_path)
    print(f"Updated platforms_visual.png with official logos saved to {dest_path}")

create_dark_platforms_visual()
