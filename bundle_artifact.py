import base64
import os

WORKSPACE_DIR = r"c:\Users\Abdulaziz\Desktop\призентация"
ARTIFACT_DIR = r"C:\Users\Abdulaziz\.gemini\antigravity\brain\acab1f40-302f-44eb-b996-e481750ad49f"
os.makedirs(ARTIFACT_DIR, exist_ok=True)

html_source = os.path.join(WORKSPACE_DIR, "index.html")
with open(html_source, "r", encoding="utf-8") as f:
    content = f.read()

# Inline the prebuilt Tailwind stylesheet so the bundle is a single self-contained file
with open(os.path.join(WORKSPACE_DIR, "styles.css"), "r", encoding="utf-8") as css_f:
    content = content.replace(
        '<link rel="stylesheet" href="styles.css">',
        f'<style>{css_f.read()}</style>'
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

# Inline base64 for audio assets (Sardor & Madina dual voices)
audio_files = [
    "q1.mp3", "q2.mp3", "q3.mp3", "q4.mp3",
    "a1_cor.mp3", "a1_wrg.mp3",
    "a2_cor.mp3", "a2_wrg.mp3",
    "a3_cor.mp3", "a3_wrg.mp3",
    "a4_cor.mp3", "a4_wrg.mp3",
    "finish.mp3"
]

for aud in audio_files:
    # 0. ElevenLabs specific path
    p_el = os.path.join(WORKSPACE_DIR, "assets", "audio", "elevenlabs", aud)
    if os.path.exists(p_el):
        with open(p_el, "rb") as af:
            b64_el = base64.b64encode(af.read()).decode('utf-8')
            content = content.replace(f'assets/audio/elevenlabs/{aud}', f'data:audio/mp3;base64,{b64_el}')

    # 1. Sardor specific path
    p_sardor = os.path.join(WORKSPACE_DIR, "assets", "audio", "sardor", aud)
    if os.path.exists(p_sardor):
        with open(p_sardor, "rb") as af:
            b64_s = base64.b64encode(af.read()).decode('utf-8')
            content = content.replace(f'assets/audio/sardor/{aud}', f'data:audio/mp3;base64,{b64_s}')

    # 2. Madina specific path
    p_madina = os.path.join(WORKSPACE_DIR, "assets", "audio", "madina", aud)
    if os.path.exists(p_madina):
        with open(p_madina, "rb") as af:
            b64_m = base64.b64encode(af.read()).decode('utf-8')
            content = content.replace(f'assets/audio/madina/{aud}', f'data:audio/mp3;base64,{b64_m}')

    # 3. Root fallback path
    p_root = os.path.join(WORKSPACE_DIR, "assets", "audio", aud)
    if os.path.exists(p_root):
        with open(p_root, "rb") as af:
            b64_r = base64.b64encode(af.read()).decode('utf-8')
            content = content.replace(f'assets/audio/{aud}', f'data:audio/mp3;base64,{b64_r}')

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
