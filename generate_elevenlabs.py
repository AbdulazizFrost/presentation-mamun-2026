import os
import sys
import json
import urllib.request
import argparse

WORKSPACE_DIR = os.path.dirname(os.path.abspath(__file__))
AUDIO_DIR = os.path.join(WORKSPACE_DIR, "assets", "audio")
os.makedirs(AUDIO_DIR, exist_ok=True)

# 13 items for the Fact or Myth quiz with natural human phrasing
ITEMS = [
    ("q1.mp3", "Birinchi savol. O'rtacha inson o'z umri davomida besh yildan ortiq vaqtini ijtimoiy tarmoqlarda o'tkazadi. Bu rostmi yoki yolg'on?"),
    ("a1_cor.mp3", "To'g'ri! Barakalla! Bu rost. Xalqaro statistikaga ko'ra, har bir inson kuniga o'rtacha ikki soat yigirma besh daqiqa sarflaydi. Bu butun umr davomida deyarli besh yil-u sakkiz oyni tashkil etadi."),
    ("a1_wrg.mp3", "Afsuski noto'g'ri! Aslida bu rost. Xalqaro statistikaga ko'ra, har bir inson kuniga o'rtacha ikki soat yigirma besh daqiqa sarflaydi. Bu butun umr davomida deyarli besh yil-u sakkiz oyni tashkil etadi."),
    
    ("q2.mp3", "Ikkinchi savol. Ertalab uyg'onish bilanoq yangi xabarlarni tekshirish kishida dopamin ajratib, ishchanlikni oshiradi. Bu rostmi yoki yolg'on?"),
    ("a2_cor.mp3", "To'g'ri! Barakalla! Bu yolg'on. Ertalab uyg'ongach darhol telefonga qarash miyada stress gormoni, ya'ni kortizolni oshirib, butun kunlik diqqatni buzadi."),
    ("a2_wrg.mp3", "Afsuski noto'g'ri! Aslida bu yolg'on. Ertalab uyg'ongach darhol telefonga qarash miyada stress gormoni, ya'ni kortizolni oshirib, butun kunlik diqqatni buzadi."),

    ("q3.mp3", "Uchinchi savol. Uch daqiqalik ta'limiy video tushuntirish ma'lumotni eslab qolish darajasini oddiy matnga nisbatan oltmish foizgacha oshiradi. Bu rostmi yoki yolg'on?"),
    ("a3_cor.mp3", "To'g'ri! Barakalla! Bu rost. Vizual tasvir va ovozni bir vaqtda qabul qilish inson xotirasida ma'lumotning saqlanishini keskin yaxshilaydi."),
    ("a3_wrg.mp3", "Afsuski noto'g'ri! Aslida bu rost. Vizual tasvir va ovozni bir vaqtda qabul qilish inson xotirasida ma'lumotning saqlanishini keskin yaxshilaydi."),

    ("q4.mp3", "To'rtinchi savol. Dars qilish vaqtida telefonni boshqa xonaga qo'yish yoki ekranini pastga qaratish aqliy diqqatni yigirma besh foizgacha oshiradi. Bu rostmi yoki yolg'on?"),
    ("a4_cor.mp3", "To'g'ri! Barakalla! Bu rost. Garvard tadqiqotchilari isbotlagan, hatto ovozsiz telefon stolda ko'rinib tursa ham, miya unga chalg'ib o'z quvvatini yo'qotadi."),
    ("a4_wrg.mp3", "Afsuski noto'g'ri! Aslida bu rost. Garvard tadqiqotchilari isbotlagan, hatto ovozsiz telefon stolda ko'rinib tursa ham, miya unga chalg'ib o'z quvvatini yo'qotadi."),

    ("finish.mp3", "Ajoyib natija! Viktorina yakunlandi. Bekordan-bekorga Ma'mun Universitetining talabasi emasligingizni isbotladingiz. Barchangizga e'tibor uchun katta rahmat!")
]

def generate_with_elevenlabs(api_key, voice_id="pNInz6obpgDQGcFmaJgB"):
    # Default voice: Adam (clear, professional narrator)
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
    headers = {
        "xi-api-key": api_key,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg"
    }

    print(f"Starting ElevenLabs generation with voice ID: {voice_id}...")
    for filename, text in ITEMS:
        payload = {
            "text": text,
            "model_id": "eleven_multilingual_v2",
            "voice_settings": {
                "stability": 0.55,
                "similarity_boost": 0.80,
                "style": 0.15,
                "use_speaker_boost": True
            }
        }

        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers=headers,
            method="POST"
        )

        try:
            with urllib.request.urlopen(req) as response:
                if response.status == 200:
                    audio_bytes = response.read()
                    out_path = os.path.join(AUDIO_DIR, filename)
                    with open(out_path, "wb") as f:
                        f.write(audio_bytes)
                    print(f"  [OK] Saved {filename} ({len(audio_bytes)} bytes)")
                else:
                    print(f"  [ERROR] {filename} returned status {response.status}")
        except urllib.error.HTTPError as e:
            err_msg = e.read().decode('utf-8', errors='ignore')
            print(f"  [HTTPError] {filename}: {e.code} - {err_msg}")
            return False
        except Exception as e:
            print(f"  [Exception] {filename}: {e}")
            return False

    print("\nAll ElevenLabs audio files generated successfully!")
    return True

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate natural Uzbek audio using ElevenLabs Multilingual v2")
    parser.add_argument("--api-key", default=os.getenv("ELEVENLABS_API_KEY"), help="ElevenLabs API Key")
    parser.add_argument("--voice-id", default="pNInz6obpgDQGcFmaJgB", help="ElevenLabs Voice ID (default: Adam)")
    args = parser.parse_args()

    if not args.api_key:
        print("ERROR: ElevenLabs API key is required.")
        print("Usage: python generate_elevenlabs.py --api-key <YOUR_API_KEY>")
        print("Or set the ELEVENLABS_API_KEY environment variable.")
        sys.exit(1)

    success = generate_with_elevenlabs(args.api_key, args.voice_id)
    if success:
        print("\nRe-bundling presentation artifact...")
        import subprocess
        subprocess.run([sys.executable, os.path.join(WORKSPACE_DIR, "bundle_artifact.py")])
