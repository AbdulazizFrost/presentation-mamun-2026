# ⏰ Time Management for Students / Talabalar uchun vaqtni boshqarish

> **Interactive bilingual (English / O‘zbekcha) web presentation** about planning, priorities, focus and balance in student life — with a phone remote, presenter view and an audience quiz.

**Live:** https://abdulazizfrost.github.io/presentation-mamun-2026/

---

## ✨ Features

- 🌐 **Bilingual:** every slide has English headlines with Uzbek translations.
- 🎙️ **Speech notes (`N`)** for every slide: say the title in English, then in Uzbek, then talk in Uzbek.
- 🖥️ **Presenter view (`P`):** separate window with the speech, next slide and a timer.
- 📱 **Phone remote:**
  - **Online (no laptop needed):** open the live link, click **📱 Remote**, scan the QR. Phone and computer talk over the internet through the public [ntfy.sh](https://ntfy.sh) relay with a random room code. Both need internet — test it in the room beforehand.
  - **Local Wi-Fi:** run `start.bat` (or `python remote_server.py`) on a laptop; the phone connects over the same Wi-Fi with a PIN.
- ⚡ **"Fact or Myth?" quiz** with Uzbek voice narration, confetti and score.
- ✨ **Animations:** staggered entrances, live clock, Pomodoro ring (off when the OS asks for reduced motion).
- 📴 **Works offline:** Tailwind is prebuilt into `styles.css`.
- 🖨️ **PDF export** and 📥 **PPTX download**.

## 📑 Slides

1. **Time Management for Students** — title.
2. **What Is Time Management?** — definition and the Plan → Prioritize → Focus → Review cycle.
3. **Why Is It Important for Students?** — less stress, better grades, more free time, healthy sleep.
4. **Common Time Wasters** — scrolling, procrastination, multitasking, no plan — and a fix for each.
5. **Planning Your Day** — four simple rules and an example daily schedule.
6. **Setting Priorities: The Eisenhower Matrix** — do now / plan / limit / drop.
7. **The Pomodoro Technique** — 25 minutes of focus, 5 minutes of rest.
8. **Balance: Study, Rest and Sleep** — 7–9 hours of sleep, sport, breaks; an example 24-hour day.
9. **Conclusion** — key takeaways, thank you and the quiz.

## 🛠️ Maintenance

```bash
# Rebuild styles.css after editing index.html
npx tailwindcss@3 -c tailwind.config.js -i tailwind.input.css -o styles.css --minify
# then change ?v=... on the styles.css link in index.html so browsers don't use a cached copy

# Rebuild the PowerPoint from the web slides (needs Microsoft Edge, python-pptx, pymupdf)
python build_pptx.py

# Generate quiz narration (ElevenLabs API key)
python generate_elevenlabs.py --api-key YOUR_KEY --voice-id VOICE_ID
```

## 📁 Structure

```text
├── index.html                        # The presentation
├── styles.css                        # Prebuilt Tailwind CSS (offline)
├── remote.html                       # Phone remote page
├── remote_server.py / start.bat      # Local server for the Wi-Fi remote
├── build_pptx.py                     # Builds Time_Management_for_Students.pptx
├── generate_elevenlabs.py            # Quiz narration texts + generator
├── SPEECH_GUIDE.md                   # Full speech for every slide
├── assets/audio/                     # Quiz narration (mp3)
└── vendor/qrcode.js                  # QR code generator (MIT)
```

## 👤 Author

- **Abdulaziz** ([@AbdulazizFrost](https://github.com/AbdulazizFrost)) · Ma’mun University · 2026
