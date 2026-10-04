import os
import asyncio
import edge_tts

WORKSPACE_DIR = r"c:\Users\Abdulaziz\Desktop\призентация"
AUDIO_DIR = os.path.join(WORKSPACE_DIR, "assets", "audio")
os.makedirs(AUDIO_DIR, exist_ok=True)

VOICE = "uz-UZ-MadinaNeural"

AUDIO_ITEMS = [
    (
        "q1.mp3",
        "Birinchi savol. O‘rtacha inson o‘z umri davomida besh yildan ortiq vaqtini ijtimoiy tarmoqlarda o‘tkazadi. Bu rostmi yoki yolg‘on?"
    ),
    (
        "a1.mp3",
        "To‘g‘ri javob — bu rost! Xalqaro statistikaga ko‘ra, har bir inson kuniga o‘rtacha ikki soat yigirma besh daqiqa sarflaydi. Bu butun umr davomida deyarli besh yil-u sakkiz oyni tashkil etadi."
    ),
    (
        "q2.mp3",
        "Ikkinchi savol. Ertalab uyg‘onish bilanoq yangi xabarlarni tekshirish kishida dopamin ajratib, ishchanlikni oshiradi. Bu rostmi yoki yolg‘on?"
    ),
    (
        "a2.mp3",
        "To‘g‘ri javob — bu yolg‘on! Ertalab uyg‘ongach darhol telefonga qarash miyada stress gormoni, ya’ni kortizolni oshirib, butun kunlik diqqatni parokanda qiladi."
    ),
    (
        "q3.mp3",
        "Uchinchi savol. Uch daqiqalik ta’limiy video tushuntirishni ko‘rish ma’lumotni eslab qolish darajasini oddiy matnga nisbatan oltmish foizgacha oshiradi. Bu rostmi yoki yolg‘on?"
    ),
    (
        "a3.mp3",
        "To‘g‘ri javob — bu rost! Vizual tasvir va ovozni bir vaqtda qabul qilish, ya’ni video darsliklar inson xotirasida ma’lumotning saqlanishini keskin yaxshilaydi."
    ),
    (
        "q4.mp3",
        "To‘rtinchi savol. Dars qilish vaqtida telefonni boshqa xonaga qo‘yish yoki ekranini pastga qaratish aqliy diqqatni yigirma besh foizgacha oshiradi. Bu rostmi yoki yolg‘on?"
    ),
    (
        "a4.mp3",
        "To‘g‘ri javob — bu rost! Garvard tadqiqotchilari isbotlagan: hatto ovozsiz telefon stolda ko‘rinib tursa ham, miya unga chalg‘ib o‘z quvvatini yo‘qotadi."
    ),
    (
        "finish.mp3",
        "Tabriklaymiz! Viktorina muvaffaqiyatli yakunlandi. Siz va sizning auditoriyangiz raqamli madaniyatni ajoyib tushunar ekansiz. E’tiboringiz uchun katta rahmat!"
    )
]

async def generate_all():
    print(f"Generating Uzbek audio narration using {VOICE}...")
    for filename, text in AUDIO_ITEMS:
        filepath = os.path.join(AUDIO_DIR, filename)
        comm = edge_tts.Communicate(text, VOICE)
        await comm.save(filepath)
        size = os.path.getsize(filepath)
        print(f"Saved {filename} ({size} bytes)")
    print("All audio files generated successfully!")

if __name__ == "__main__":
    asyncio.run(generate_all())
