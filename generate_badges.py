import os
from PIL import Image, ImageDraw

ASSETS_DIR = r"c:\Users\Abdulaziz\Desktop\призентация\assets"

def create_badges():
    # 128x128 icons
    # Check
    img_chk = Image.new("RGBA", (128, 128), (0, 0, 0, 0))
    d_chk = ImageDraw.Draw(img_chk)
    d_chk.ellipse([8, 8, 120, 120], fill=(16, 185, 129, 230), outline=(52, 211, 153, 255), width=4)
    d_chk.line([(38, 66), (56, 84), (92, 44)], fill="white", width=9)
    img_chk.save(os.path.join(ASSETS_DIR, "icon_check.png"))

    # Cross
    img_crs = Image.new("RGBA", (128, 128), (0, 0, 0, 0))
    d_crs = ImageDraw.Draw(img_crs)
    d_crs.ellipse([8, 8, 120, 120], fill=(225, 29, 72, 230), outline=(251, 113, 133, 255), width=4)
    d_crs.line([(44, 44), (84, 84)], fill="white", width=9)
    d_crs.line([(84, 44), (44, 84)], fill="white", width=9)
    img_crs.save(os.path.join(ASSETS_DIR, "icon_cross.png"))

    # Comm
    img_c = Image.new("RGBA", (128, 128), (0, 0, 0, 0))
    d_c = ImageDraw.Draw(img_c)
    d_c.ellipse([8, 8, 120, 120], fill=(30, 58, 138, 230), outline=(56, 189, 248, 255), width=4)
    d_c.rounded_rectangle([32, 35, 96, 75], radius=12, fill="white")
    d_c.polygon([(45, 75), (60, 75), (42, 92)], fill="white")
    d_c.ellipse([45, 52, 53, 60], fill=(30, 58, 138, 255))
    d_c.ellipse([60, 52, 68, 60], fill=(30, 58, 138, 255))
    d_c.ellipse([75, 52, 83, 60], fill=(30, 58, 138, 255))
    img_c.save(os.path.join(ASSETS_DIR, "icon_comm.png"))

    # Info
    img_i = Image.new("RGBA", (128, 128), (0, 0, 0, 0))
    d_i = ImageDraw.Draw(img_i)
    d_i.ellipse([8, 8, 120, 120], fill=(8, 145, 178, 230), outline=(34, 211, 238, 255), width=4)
    d_i.ellipse([58, 34, 70, 46], fill="white")
    d_i.rounded_rectangle([58, 54, 70, 94], radius=4, fill="white")
    img_i.save(os.path.join(ASSETS_DIR, "icon_info.png"))

    # Learn
    img_l = Image.new("RGBA", (128, 128), (0, 0, 0, 0))
    d_l = ImageDraw.Draw(img_l)
    d_l.ellipse([8, 8, 120, 120], fill=(109, 40, 217, 230), outline=(168, 85, 247, 255), width=4)
    d_l.polygon([(64, 32), (102, 52), (64, 72), (26, 52)], fill="white")
    d_l.polygon([(40, 62), (40, 84), (88, 84), (88, 62)], fill="white")
    d_l.line([(96, 54), (102, 86)], fill="white", width=4)
    img_l.save(os.path.join(ASSETS_DIR, "icon_learn.png"))

    # Play
    img_p = Image.new("RGBA", (128, 128), (0, 0, 0, 0))
    d_p = ImageDraw.Draw(img_p)
    d_p.ellipse([8, 8, 120, 120], fill=(5, 150, 105, 230), outline=(52, 211, 153, 255), width=4)
    d_p.polygon([(52, 40), (88, 64), (52, 88)], fill="white")
    img_p.save(os.path.join(ASSETS_DIR, "icon_play.png"))

    print("Badges generated successfully!")

create_badges()
