import os
import asyncio
import edge_tts

WORKSPACE_DIR = r"c:\Users\Abdulaziz\Desktop\призентация"
AUDIO_DIR = os.path.join(WORKSPACE_DIR, "assets", "audio")
os.makedirs(AUDIO_DIR, exist_ok=True)

ITEMS = [
    ("q1.mp3", "Birinchi savol. O'rtacha inson o'z umri davomida besh yildan ortiq vaqtini ijtimoiy tarmoqlarda o'tkazadi. Bu rostmi yoki yolg'on?"),
    ("a1_cor.mp3", "To'g'ri! Barakalla! Bu rost. Xalqaro statistikaga ko'ra, har bir inson kuniga o'rtacha ikki soat yigirma besh daqiqa sarflaydi. Bu butun umr davomida deyarli besh yil-u sakkiz oyni tashkil etadi."),
    ("a1_wrg.mp3", "Afsuski noto'g'ri! Aslida bu rost. Xalqaro statistikaga ko'ra, har bir inson kuniga o'rtacha ikki soat yigirma besh daqiqa sarflaydi. Bu butun umr davomida deyarli besh yil-u sakkiz oyni tashkil etadi."),
    
    ("q2.mp3", "Ikkinchi savol. Ertalab uyg'onish bilanoq yangi xabarlarni tekshirish kishida dopamin ajratib, ishchanlikni oshiradi. Bu rostmi yoki yolg'on?"),
    ("a2_cor.mp3", "To'g'ri! Barakalla! Bu yolg'on. Ertalab uyg'ongach darhol telefonga qarash miyada stress gormoni, ya'ni kortizolni oshirib, butun kunlik diqqatni buzadi."),
    ("a2_wrg.mp3", "Afsuski noto'g'ri! Aslida bu yolg'on. Ertalab uyg'ongach darhol telefonga qarash miyada stress gormoni, ya'ni kortizolni oshirib, butun kunlik diqqatni buzadi."),

    ("q3.mp3", "Uchinchi savol. Uch daqiqalik ta'limiy video darslikni ko'rish ma'lumotni eslab qolish darajasini oddiy matnga nisbatan oltmish foizgacha oshiradi. Bu rostmi yoki yolg'on?"),
    ("a3_cor.mp3", "To'g'ri! Barakalla! Bu rost. Vizual tasvir va ovozni bir vaqtda qabul qilish inson xotirasida ma'lumotning saqlanishini keskin yaxshilaydi."),
    ("a3_wrg.mp3", "Afsuski noto'g'ri! Aslida bu rost. Vizual tasvir va ovozni bir vaqtda qabul qilish inson xotirasida ma'lumotning saqlanishini keskin yaxshilaydi."),

    ("q4.mp3", "To'rtinchi savol. Dars qilish vaqtida telefonni boshqa xonaga qo'yish yoki ekranini pastga qaratish aqliy diqqatni yigirma besh foizgacha oshiradi. Bu rostmi yoki yolg'on?"),
    ("a4_cor.mp3", "To'g'ri! Barakalla! Bu rost. Garvard tadqiqotchilari isbotlagan, hatto ovozsiz telefon stolda ko'rinib tursa ham, miya unga chalg'ib o'z quvvatini yo'qotadi."),
    ("a4_wrg.mp3", "Afsuski noto'g'ri! Aslida bu rost. Garvard tadqiqotchilari isbotlagan, hatto ovozsiz telefon stolda ko'rinib tursa ham, miya unga chalg'ib o'z quvvatini yo'qotadi."),

    ("finish.mp3", "Tabriklaymiz! Viktorina muvaffaqiyatli yakunlandi. Siz va sizning auditoriyangiz raqamli madaniyatni ajoyib tushunar ekansiz. E'tiboringiz uchun katta rahmat!")
]

VOICES = [
    ("sardor", "uz-UZ-SardorNeural"),
    ("madina", "uz-UZ-MadinaNeural")
]

async def generate():
    for v_key, v_name in VOICES:
        v_dir = os.path.join(AUDIO_DIR, v_key)
        os.makedirs(v_dir, exist_ok=True)
        print(f"Generating for {v_name}...")
        for fname, text in ITEMS:
            out_path = os.path.join(v_dir, fname)
            comm = edge_tts.Communicate(text, v_name)
            await comm.save(out_path)
            # Also copy sardor files to root of AUDIO_DIR as default
            if v_key == "sardor":
                root_path = os.path.join(AUDIO_DIR, fname)
                with open(out_path, "rb") as sf, open(root_path, "wb") as df:
                    df.write(sf.read())
            print(f"[{v_key}] Saved {fname}")
    print("All audio files generated successfully!")

if __name__ == "__main__":
    asyncio.run(generate())
