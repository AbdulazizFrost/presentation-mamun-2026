# 📱 Social Networks in My Life / Ijtimoiy tarmoqlar mening hayotimda

> **Interactive bilingual web presentation & slide deck** exploring how social media shapes communication, education, daily habits, and digital well-being.

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)
![PowerPoint](https://img.shields.io/badge/PowerPoint-D04423?style=flat&logo=microsoftpowerpoint&logoColor=white)

---

## ✨ Features / Особенности

- 🌐 **Bilingual (English / O'zbekcha):** Every slide includes English headlines & body with clear Uzbek translations.
- 🎙️ **Interactive Speech Notes (Подсказки для защиты):** Built-in drawer with the speech for each slide (`N`).
- 🖥️ **Presenter View (`P`):** Separate window with notes, next slide title and a timer — keep it on the laptop while the projector shows the slides.
- 📱 **Phone remote:** Run `python remote_server.py` (or double-click `start.bat`), click **📱 Remote** and scan the QR code. The phone switches slides, shows the speech notes and timer, and runs the quiz (Fact / Myth, next question, replay voice). Phone and laptop must be on the same Wi-Fi — or connect the laptop to the phone's hotspot. Protected by a 6-digit PIN; no extra Python packages needed.
- 🌐 **Online remote (no laptop needed):** Open the deck from GitHub Pages (or any computer, even as a file) and click **📱 Remote** — the phone connects over the internet through the public [ntfy.sh](https://ntfy.sh) relay using a random room code from the QR. Both devices need internet; test it in the room beforehand, since some networks block the relay.
- ✨ **Animations:** staggered entrances, floating hero phone, confetti for correct quiz answers, shake for wrong ones (turned off automatically when the OS asks for reduced motion).
- 📴 **Works offline:** Tailwind is prebuilt into `styles.css` (rebuild: `npx tailwindcss@3 -c tailwind.config.js -i tailwind.input.css -o styles.css --minify`).
- 🖥️ **Presentation & Fullscreen Mode:**
  - One-click fullscreen toggle (`F` or button);
  - Auto-hiding control panels for distraction-free presentation;
  - Edge proximity detection to access controls smoothly;
  - Smooth slide transitions (keyboard arrows `←` / `→` or `Space`).
- 📥 **Direct PPTX Download:** Direct download button for `Social_Networks_in_My_Life.pptx` right from the interface.
- 🖨️ **PDF Export:** Clean print stylesheet to export the presentation as PDF.
- 📱 **Fully Responsive:** Tailored layouts for Desktop (1080p+), Laptop, Tablet, and Mobile devices.

---

## 📑 Slide Deck Overview / Структура слайдов

1. **Title:** *Social Networks in My Life* — author, university and hero phone mockup.
2. **What Are Social Networks?** Definition and three functions: communication, information, content sharing.
3. **Social Networks I Use:** Telegram, Instagram and YouTube and what each is used for.
4. **Why Do I Use Social Networks?** Four reasons: communication, information, learning, entertainment.
5. **Communication with People:** Messages, photos and video calls with friends far away.
6. **Learning and Education:** Video lessons, online courses, educational channels.
7. **Entertainment and Free Time:** Music, videos and keeping screen time under control.
8. **Advantages and Disadvantages:** Pros and cons side by side.
9. **Conclusion:** Key takeaway, thank you, and the "Fact or Myth?" audience quiz.

---

## 🚀 How to Run Locally / Как запустить локально

Simply open `index.html` in any modern web browser:

```bash
# Windows
start index.html

# Mac
open index.html

# Linux
xdg-open index.html
```

Or serve with any static HTTP server (e.g. Python):

```bash
python -m http.server 8000
```
Then visit `http://localhost:8000`.

---

## 🌐 Deploy to GitHub Pages / Публикация на GitHub Pages

1. Push this repository to GitHub.
2. Go to **Settings** > **Pages**.
3. Under **Branch**, select `main` and `/ (root)`.
4. Click **Save**. Your interactive presentation will be live online!

---

## 📁 Repository Structure / Структура репозитория

```text
├── index.html                       # Main interactive presentation
├── styles.css                       # Prebuilt Tailwind CSS (offline)
├── remote_server.py / start.bat     # Local server + phone remote
├── remote.html                      # Phone remote control page
├── vendor/qrcode.js                 # QR code generator (MIT)
├── Social_Networks_in_My_Life.pptx   # PowerPoint presentation file
├── SPEECH_GUIDE.md                  # Detailed speech guide for presentation
├── assets/                          # Core slide icons and graphics
├── assets_premium/                  # High-resolution visuals, UI mockups, and avatars
└── README.md                        # Documentation
```

---

## 👤 Author

- **Abdulaziz** ([@AbdulazizFrost](https://github.com/AbdulazizFrost))
