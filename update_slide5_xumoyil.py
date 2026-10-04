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

def create_realistic_communication_mockup():
    W, H = 800, 600
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Elevated sleek dark container
    card_x1, card_y1, card_x2, card_y2 = 40, 30, 760, 560
    for s in range(16):
        draw.rounded_rectangle([card_x1 - s, card_y1 + s, card_x2 + s, card_y2 + s], radius=24, fill=(0, 0, 0, int(18 - s)))
    draw.rounded_rectangle([card_x1, card_y1, card_x2, card_y2], radius=24, fill=(17, 24, 39), outline=(30, 41, 59), width=2)

    # Header bar
    draw.rounded_rectangle([card_x1, card_y1, card_x2, card_y1 + 75], radius=24, fill=(15, 23, 42))
    draw.rectangle([card_x1, card_y1 + 50, card_x2, card_y1 + 75], fill=(15, 23, 42))
    draw.line([(card_x1, card_y1 + 75), (card_x2, card_y1 + 75)], fill=(30, 41, 59), width=1)

    # Real photo avatar for Humoyun
    avatar_src_path = r"C:\Users\Abdulaziz\.gemini\antigravity\brain\acab1f40-302f-44eb-b996-e481750ad49f\.user_uploaded\media_1791110927209.png"
    if os.path.exists(avatar_src_path):
        phone_img = Image.open(avatar_src_path)
        face = phone_img.crop((320, 137, 362, 179)).resize((88, 88), Image.Resampling.LANCZOS)
        mask = Image.new('L', (88, 88), 0)
        draw_m = ImageDraw.Draw(mask)
        draw_m.ellipse([0, 0, 87, 87], fill=255)
        av_cir = Image.new('RGBA', (88, 88), (0, 0, 0, 0))
        av_cir.paste(face, (0, 0), mask)
        av_cir = av_cir.resize((44, 44), Image.Resampling.LANCZOS)
        img.paste(av_cir, (card_x1 + 24, card_y1 + 15), av_cir)
        draw.ellipse([card_x1 + 23, card_y1 + 14, card_x1 + 68, card_y1 + 59], outline=(56, 189, 248), width=1)
    else:
        draw.ellipse([card_x1 + 25, card_y1 + 16, card_x1 + 67, card_y1 + 58], fill=(37, 99, 235))
        draw.text((card_x1 + 37, card_y1 + 23), "H", font=get_font(20, bold=True), fill=(255, 255, 255))
    
    # Active online dot
    draw.ellipse([card_x1 + 55, card_y1 + 46, card_x1 + 67, card_y1 + 58], fill=(34, 197, 94), outline=(15, 23, 42), width=2)

    # Name: Humoyun
    draw.text((card_x1 + 80, card_y1 + 19), "Humoyun", font=get_font(18, bold=True), fill=(255, 255, 255))
    draw.text((card_x1 + 80, card_y1 + 44), "online", font=get_font(12), fill=(56, 189, 248))

    # Sleek Call Buttons on Top Right (Audio call + Video call icons)
    btn_audio_x = card_x2 - 100
    btn_y = card_y1 + 19
    draw.ellipse([btn_audio_x, btn_y, btn_audio_x + 36, btn_y + 36], fill=(30, 41, 59), outline=(51, 65, 85), width=1)
    # Phone handset icon
    ph_x, ph_y = btn_audio_x + 11, btn_y + 11
    draw.arc([ph_x, ph_y, ph_x + 14, ph_y + 14], 190, 350, fill=(56, 189, 248), width=3)
    draw.ellipse([ph_x, ph_y + 7, ph_x + 5, ph_y + 13], fill=(56, 189, 248))
    draw.ellipse([ph_x + 9, ph_y + 7, ph_x + 14, ph_y + 13], fill=(56, 189, 248))

    # Video call button (circle 36x36 with cyan accent)
    btn_video_x = card_x2 - 54
    draw.ellipse([btn_video_x, btn_y, btn_video_x + 36, btn_y + 36], fill=(23, 37, 84), outline=(56, 189, 248), width=1)
    # Video camera icon
    vx, vy = btn_video_x + 9, btn_y + 11
    draw.rounded_rectangle([vx, vy + 2, vx + 12, vy + 12], radius=2, fill=(56, 189, 248))
    draw.polygon([(vx + 12, vy + 5), (vx + 18, vy + 2), (vx + 18, vy + 12), (vx + 12, vy + 9)], fill=(56, 189, 248))

    # --- Message 1 (Incoming from Humoyun: Question about presentation) ---
    m1_y = card_y1 + 95
    m1_w = 515
    draw.rounded_rectangle([card_x1 + 25, m1_y, card_x1 + 25 + m1_w, m1_y + 70], radius=16, fill=(30, 41, 59))
    draw.text((card_x1 + 42, m1_y + 14), "Hey! Did you finish making the presentation? How did it turn out?", font=get_font(13, bold=True), fill=(255, 255, 255))
    draw.text((card_x1 + 42, m1_y + 38), "Salom! Taqdimotni tayyorlab bo'ldingmi? Qanday chiqdi?", font=get_font(11), fill=(148, 163, 184))
    draw.text((card_x1 + 25 + m1_w - 45, m1_y + 44), "10:14", font=get_font(10), fill=(100, 116, 139))

    # --- Message 2 (Outgoing reply to Humoyun) ---
    m2_y = m1_y + 85
    m2_w = 525
    draw.rounded_rectangle([card_x2 - 25 - m2_w, m2_y, card_x2 - 25, m2_y + 70], radius=16, fill=(37, 99, 235))
    draw.text((card_x2 - 25 - m2_w + 20, m2_y + 14), "Yes, all finished! It turned out great with interactive quiz slides.", font=get_font(13, bold=True), fill=(255, 255, 255))
    draw.text((card_x2 - 25 - m2_w + 20, m2_y + 38), "Ha, tayyorlab bo'ldim! Interaktiv viktorina bilan juda zo'r chiqdi.", font=get_font(11), fill=(191, 219, 254))
    # double check mark
    cx_mark = card_x2 - 50
    draw.line([(cx_mark, m2_y + 48), (cx_mark + 5, m2_y + 53), (cx_mark + 12, m2_y + 42)], fill=(147, 197, 253), width=2)
    draw.line([(cx_mark + 6, m2_y + 48), (cx_mark + 11, m2_y + 53), (cx_mark + 18, m2_y + 42)], fill=(147, 197, 253), width=2)

    # --- Message 3 (Shared photo / moment) ---
    m3_y = m2_y + 85
    pw = 280
    draw.rounded_rectangle([card_x1 + 25, m3_y, card_x1 + 25 + pw, m3_y + 160], radius=16, fill=(30, 41, 59))
    # Photo canvas inside
    draw.rounded_rectangle([card_x1 + 35, m3_y + 10, card_x1 + 15 + pw, m3_y + 115], radius=12, fill=(15, 23, 42))
    # Stylized sunset & university silhouette
    draw.ellipse([card_x1 + 140, m3_y + 35, card_x1 + 175, m3_y + 70], fill=(251, 191, 36))
    # mountains / campus roof
    draw.polygon([(card_x1 + 55, m3_y + 115), (card_x1 + 120, m3_y + 65), (card_x1 + 190, m3_y + 115)], fill=(37, 99, 235))
    draw.polygon([(card_x1 + 160, m3_y + 115), (card_x1 + 220, m3_y + 75), (card_x1 + 280, m3_y + 115)], fill=(30, 64, 175))
    draw.text((card_x1 + 45, m3_y + 126), "Photo: University Campus & Library", font=get_font(12, bold=True), fill=(255, 255, 255))
    draw.text((card_x1 + 45, m3_y + 142), "Talabalar shaharchasidan fotosurat", font=get_font(10), fill=(148, 163, 184))

    # --- Audio Voice Message Card (Right side of photo) ---
    vm_x = card_x1 + 25 + pw + 25
    vm_w = card_x2 - 25 - vm_x
    draw.rounded_rectangle([vm_x, m3_y + 15, vm_x + vm_w, m3_y + 90], radius=16, fill=(23, 37, 84), outline=(56, 189, 248), width=1)
    # Play circle
    draw.ellipse([vm_x + 16, m3_y + 32, vm_x + 56, m3_y + 72], fill=(56, 189, 248))
    draw.polygon([(vm_x + 32, m3_y + 44), (vm_x + 46, m3_y + 52), (vm_x + 32, m3_y + 60)], fill=(15, 23, 42))

    # Waveform
    for i in range(20):
        wh = max(4, int(14 + math.sin(i * 0.9) * 12))
        wx = vm_x + 72 + i * 11
        draw.rounded_rectangle([wx, m3_y + 52 - wh//2, wx + 4, m3_y + 52 + wh//2], radius=2, fill=(147, 197, 253))
    draw.text((vm_x + 72, m3_y + 24), "Voice Message (0:38) • Ovozli xabar", font=get_font(11, bold=True), fill=(255, 255, 255))

    # Connectivity banner below voice message
    draw.rounded_rectangle([vm_x, m3_y + 105, vm_x + vm_w, m3_y + 160], radius=14, fill=(30, 41, 59))
    draw.text((vm_x + 18, m3_y + 117), "Distance is no longer a barrier", font=get_font(12, bold=True), fill=(56, 189, 248))
    draw.text((vm_x + 18, m3_y + 137), "Masofa endi to'siq emas — doimiy aloqa", font=get_font(11), fill=(148, 163, 184))

    img.save(os.path.join(ASSETS_DIR, "chat_visual.png"))
    print("update_slide5_xumoyil.py synchronized successfully!")

if __name__ == "__main__":
    create_realistic_communication_mockup()
