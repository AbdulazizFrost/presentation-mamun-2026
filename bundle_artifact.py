import base64
import os

WORKSPACE_DIR = r"c:\Users\Abdulaziz\Desktop\призентация"
ARTIFACT_DIR = r"C:\Users\Abdulaziz\.gemini\antigravity\brain\acab1f40-302f-44eb-b996-e481750ad49f"
os.makedirs(ARTIFACT_DIR, exist_ok=True)

html_source = os.path.join(WORKSPACE_DIR, "index.html")
with open(html_source, "r", encoding="utf-8") as f:
    content = f.read()

# Replace Tailwind CDN with the approved gstatic version for artifact viewer
content = content.replace(
    '<script src="https://cdn.tailwindcss.com"></script>',
    '<script src="https://www.gstatic.com/antigravity/web/dev/tailwindcss.min.js"></script>'
)

# Inline base64 for assets_premium
premium_assets = [
    "hero_phone.png",
    "network_visual.png",
    "platforms_visual.png",
    "infographic_visual.png",
    "chat_visual.png",
    "education_player.png",
    "balance_wellbeing.png"
]

for asset in premium_assets:
    p = os.path.join(WORKSPACE_DIR, "assets_premium", asset)
    if os.path.exists(p):
        with open(p, "rb") as img_f:
            b64 = base64.b64encode(img_f.read()).decode('utf-8')
            content = content.replace(f'assets_premium/{asset}', f'data:image/png;base64,{b64}')

# Inline PPTX for instant download in artifact viewer
pptx_path = os.path.join(WORKSPACE_DIR, "Social_Networks_in_My_Life.pptx")
if os.path.exists(pptx_path):
    with open(pptx_path, "rb") as pf:
        pptx_b64 = base64.b64encode(pf.read()).decode('utf-8')
        content = content.replace(
            '<script>',
            f"<script>\n    window.EMBEDDED_PPTX_BASE64 = '{pptx_b64}';"
        )

artifact_dest = os.path.join(ARTIFACT_DIR, "presentation_preview.html")
with open(artifact_dest, "w", encoding="utf-8") as f:
    f.write(content)

print(f"Updated Artifact created at {artifact_dest}")
