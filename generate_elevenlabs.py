import os
import sys
import json
import urllib.request
import argparse

WORKSPACE_DIR = os.path.dirname(os.path.abspath(__file__))
AUDIO_DIR = os.path.join(WORKSPACE_DIR, "assets", "audio")
os.makedirs(AUDIO_DIR, exist_ok=True)

# 13 items for the Fact or Myth quiz with natural human phrasing
# Quiz narration for "Time Management for Students" (numbers written as words so the voice reads them in Uzbek).
# finish_v2.mp3 is shared with the previous deck and already recorded.
ITEMS = [
    ("tm_q1.mp3", "Birinchi savol. Bir vaqtning o'zida bir nechta ish qilish, ya'ni multitasking, uy vazifasini tezroq tugatishga yordam beradi. Bu rostmi yoki yolg'on?"),
    ("tm_a1_cor.mp3", "To'g'ri! Barakalla! Bu yolg'on. Vazifalar orasida almashish vaqtni yo'qotadi va xatolarni ko'paytiradi. Amerika Psixologik Assotsiatsiyasi ma'lumotiga ko'ra, bu samarali vaqtning qirq foizigacha qismini olib ketishi mumkin."),
    ("tm_a1_wrg.mp3", "Afsuski noto'g'ri! Aslida bu yolg'on. Vazifalar orasida almashish vaqtni yo'qotadi va xatolarni ko'paytiradi. Amerika Psixologik Assotsiatsiyasi ma'lumotiga ko'ra, bu samarali vaqtning qirq foizigacha qismini olib ketishi mumkin."),

    ("tm_q2.mp3", "Ikkinchi savol. Pomodoro usulida yigirma besh daqiqa diqqat bilan ishlanadi va qisqa tanaffus qilinadi. Bu rostmi yoki yolg'on?"),
    ("tm_a2_cor.mp3", "To'g'ri! Barakalla! Bu rost. Bu usulni bir ming to'qqiz yuz saksoninchi yillarning oxirida Franchesko Chirillo yaratgan: yigirma besh daqiqa ishlash, keyin besh daqiqa dam olish, to'rt raunddan keyin esa uzoqroq tanaffus."),
    ("tm_a2_wrg.mp3", "Afsuski noto'g'ri! Aslida bu rost. Bu usulni bir ming to'qqiz yuz saksoninchi yillarning oxirida Franchesko Chirillo yaratgan: yigirma besh daqiqa ishlash, keyin besh daqiqa dam olish, to'rt raunddan keyin esa uzoqroq tanaffus."),

    ("tm_q3.mp3", "Uchinchi savol. Imtihondan oldin tun bo'yi uxlamay o'qish materialni eslab qolishning eng yaxshi usuli. Bu rostmi yoki yolg'on?"),
    ("tm_a3_cor.mp3", "To'g'ri! Barakalla! Bu yolg'on. Uyqu paytida miya o'rganilgan ma'lumotni xotirada mustahkamlaydi. Uyqusizlik xotira va diqqatni yomonlashtiradi, shuning uchun oldinroq o'qib, yaxshi uxlash afzal."),
    ("tm_a3_wrg.mp3", "Afsuski noto'g'ri! Aslida bu yolg'on. Uyqu paytida miya o'rganilgan ma'lumotni xotirada mustahkamlaydi. Uyqusizlik xotira va diqqatni yomonlashtiradi, shuning uchun oldinroq o'qib, yaxshi uxlash afzal."),

    ("tm_q4.mp3", "To'rtinchi savol. Aniq reja tuzish, ya'ni nima, qachon va qayerda qilishni belgilash, vazifani bajarish ehtimolini oshiradi. Bu rostmi yoki yolg'on?"),
    ("tm_a4_cor.mp3", "To'g'ri! Barakalla! Bu rost. To'qson to'rtta tadqiqot tahlili aniq qachon va qayerda rejasi odamlarga maqsadga ancha ko'proq erishishga yordam berishini ko'rsatgan."),
    ("tm_a4_wrg.mp3", "Afsuski noto'g'ri! Aslida bu rost. To'qson to'rtta tadqiqot tahlili aniq qachon va qayerda rejasi odamlarga maqsadga ancha ko'proq erishishga yordam berishini ko'rsatgan."),
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
