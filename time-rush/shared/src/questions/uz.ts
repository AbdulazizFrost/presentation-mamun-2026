// Uzbek (Latin) texts of the question bank, by question id: question, answers A/B/C, explanation.

export type QuestionText = [question: string, a: string, b: string, c: string, explanation: string];

export const QUESTIONS_UZ: Record<string, QuestionText> = {
  // Taqdimotdan: vaqtni boshqarish nima va nega muhim
  'basics-01': ['Vaqtni boshqarish nima?', 'Hammasini iloji boricha tez qilish', 'Vaqtni rejalashtirib, uni haqiqatan muhim ishlarga sarflash', 'Umuman dam olmasdan ishlash', 'Vaqtni boshqarish — vaqtni rejalashtirish va uni haqiqatan muhim ishlarga sarflash.'],
  'basics-02': ['Vaqtni boshqarishning to‘rt qadami qaysi?', 'Uxlash, ovqatlanish, o‘ynash, takrorlash', 'Kutish, shoshilish, vahima, unutish', 'Rejalashtirish, ustuvorlik, diqqat, tahlil', 'Avval reja tuzing, muhimini tanlang, bitta vazifaga diqqat qiling va natijani tahlil qiling.'],
  'basics-03': ['Har bir insonning bir kunida necha soat bor?', '12 soat', '24 soat, hammada bir xil', 'Band odamlarda ko‘proq', 'Hammada kuniga bir xil 24 soat bor — farq uni qanday ishlatishda.'],
  'benefits-01': ['Vaqtni yaxshi boshqarish talabaga qanday foyda beradi?', 'Muddat oldidan ko‘proq stress', 'Tun bo‘yi o‘qish', 'Kamroq stress va ko‘proq bo‘sh vaqt', 'Yaxshi reja stressni kamaytiradi va do‘stlar, sport hamda sevimli mashg‘ulotlarga vaqt qoldiradi.'],
  'priorities-06': ['Imtihoningiz ertaga. Bu Eyzenxauer matritsasining qaysi katagi?', 'Darhol bajaring', 'Voz keching', 'Qisqartiring', 'Muhim va shoshilinch vazifa darhol bajariladi.'],
  'priorities-07': ['Ko‘pchilik xabarlar va ba’zi qo‘ng‘iroqlar shoshilinch, lekin muhim emas. Ular bilan nima qilish kerak?', 'Kun bo‘yi birinchi ularni bajarish', 'Ularni qisqartirish', 'Ularni keyingi yilga rejalashtirish', 'Shoshilinch, lekin muhim bo‘lmagan ishlarga iloji boricha kam vaqt sarflang.'],
  'wasters-01': ['“Aniq reja yo‘qligi” muammosining eng yaxshi yechimi nima?', 'Omadga ishonish', 'Har kuni kechqurun vazifalar ro‘yxatini yozish', 'Har soatda do‘stlardan nima qilishni so‘rash', 'Kechqurun yozilgan ro‘yxat ertangi kunni aniq qiladi.'],
  'balance-01': ['Muvozanatli kun namunasida uyquga necha soat ajratiladi?', 'Taxminan 4 soat', 'Taxminan 12 soat', 'Taxminan 8 soat', 'Yaxshi kunda taxminan 8 soat uyqu, 8 soat o‘qish, qolgani esa ovqat, sport va bo‘sh vaqt uchun.'],

  // Kunni rejalashtirish
  'planning-01': ['Kuningizni tartibga solishning eng yaxshi usuli qaysi?', 'Kunlik reja tuzish', 'Muddatlarga e’tibor bermaslik', 'Hammasini oxirgi daqiqada qilish', 'Kunlik reja vazifalarni tartibga solishga va vaqtdan oqilona foydalanishga yordam beradi.'],
  'planning-02': ['Ertangi kunni qachon rejalashtirgan yaxshi?', 'Darsdan besh daqiqa oldin', 'Kechqurun, bir kun oldin', 'Hech qachon', 'Oldingi oqshom reja tuzsangiz, yangi kunni aniq ro‘yxat bilan boshlaysiz.'],
  'planning-03': ['Vazifalar ro‘yxatida nima bo‘lishi kerak?', 'Faqat qiziqarli ishlar', 'Hech narsa, shunchaki eslab qolish', 'Bajarsa bo‘ladigan aniq vazifalar', 'Aniq va kichik vazifalarni boshlash ham, belgilab qo‘yish ham oson.'],
  'planning-04': ['Darslar orasida bir soat bo‘sh vaqtingiz bor. Eng aqlli reja qaysi?', 'Kichik uy vazifasini bajarish', 'Bir soat ijtimoiy tarmoqlarni ko‘rish', 'Partada uxlash', 'Qisqa bo‘sh vaqt kichik vazifalar uchun juda qulay.'],
  'planning-05': ['Nega dam olish uchun ham vaqt rejalashtirish kerak?', 'Dam olish — vaqtni behuda sarflash', 'Dam olish keyin yaxshiroq ishlashga yordam beradi', 'Reja faqat ish uchun', 'Rejalashtirilgan dam olish keyingi vazifa uchun kuch saqlaydi.'],

  // Ustuvorliklarni belgilash
  'priorities-01': ['Ertaga imtihon, yana yangi serial ham chiqdi. Avval nima qilasiz?', 'Butun serialni ko‘rish', 'Imtihonga tayyorlanish', 'Ikkalasini bir vaqtda qilish', 'Muhim va shoshilinch ishlar birinchi turadi. Serial kutib turadi.'],
  'priorities-02': ['Eyzenxauer matritsasida shoshilinch ham, muhim ham bo‘lmagan vazifalar bilan nima qilinadi?', 'Ulardan voz kechiladi', 'Ular birinchi bajariladi', 'Ular har soatda bajariladi', 'Shoshilinch ham, muhim ham bo‘lmagan ishlar faqat vaqtingizni o‘g‘irlaydi.'],
  'priorities-03': ['“Ustuvorlik berish” nimani anglatadi?', 'Faqat eng oson vazifani bajarish', 'Vazifalarni tasodifiy tartibda bajarish', 'Eng muhim vazifani birinchi bajarish', 'Ustuvorlik berish — eng muhim ishlarni birinchi o‘ringa qo‘yish.'],
  'priorities-04': ['Vazifa muhim, lekin shoshilinch emas. Nima qilish kerak?', 'Unga vaqt rejalashtirish', 'Uni unutish', 'Uni do‘stga berish', 'Muhim vazifalar shoshilinch bo‘lib qolmasidan oldin ularga vaqt ajratish kerak.'],
  'priorities-05': ['Sizda uchta vazifa bor. Qaysi biridan boshlash kerak?', 'Muddati eng yaqin bo‘lganidan', 'Eng zerikarlisidan, hech qachon', 'Do‘stingizga yoqqanidan', 'Odatda muddati eng yaqin vazifa birinchi navbatda e’tibor talab qiladi.'],

  // Ishni orqaga surmaslik
  'procrastination-01': ['Vazifa boshlash uchun juda katta tuyuladi. Nima yordam beradi?', 'Tayyor bo‘lguncha kutish', 'Muddatdan oldingi kechada boshlash', 'Uni kichik qadamlarga bo‘lish', 'Kichik qadamlarni boshlash oson, har bir tugagan qadam esa oldinga undaydi.'],
  'procrastination-02': ['Prokrastinatsiya nima?', 'Juda tez ishlash', 'Vazifalarni keyinga qoldirish', 'Haftani rejalashtirish', 'Prokrastinatsiya — qilish kerakligini bilgan ishlarni kechiktirish.'],
  'procrastination-03': ['Zerikarli vazifani boshlashga qaysi usul yordam beradi?', 'Atigi 5 daqiqa shug‘ullanish', 'Ilhom kelishini kutish', 'Avval videolar ko‘rish', '5 daqiqa boshlab olsangiz, davom ettirish ancha oson bo‘ladi.'],
  'procrastination-04': ['Uy vazifasini oxirgi kechaga qoldirsangiz, ko‘pincha nima bo‘ladi?', 'Bo‘sh vaqtingiz ko‘payadi', 'Hech narsa o‘zgarmaydi', 'Asabiylashasiz va kam uxlaysiz', 'Oxirgi daqiqadagi ish stress va uyqusizlik olib keladi.'],

  // O‘qish jadvali
  'schedule-01': ['Qaysi o‘qish jadvali odatda yaxshiroq ishlaydi?', 'Har kuni ozgina', 'Imtihondan bir kun oldin o‘n soat', 'Faqat kayfiyat bo‘lganda', 'Muntazam qisqa mashg‘ulotlar bir kechalik yodlashdan ko‘ra ko‘proq eslab qolishga yordam beradi.'],
  'schedule-02': ['Haftalik o‘qish jadvalida nima bo‘lishi kerak?', 'Faqat bo‘sh vaqt', 'O‘qish vaqti, tanaffuslar va dam olish kunlari', 'Faqat imtihon sanalari', 'Yaxshi jadval o‘qish, tanaffus va dam olishni muvozanatlaydi.'],
  'schedule-04': ['Imtihoningizga ikki hafta qoldi. Qachon tayyorlanishni boshlash kerak?', 'Hozir, har kuni ozgina', 'Oldingi kechada', 'Imtihondan keyin', 'Erta boshlasangiz, xotirjam o‘qiysiz va hammasini takrorlab chiqasiz.'],

  // Tanaffus va diqqat
  'breaks-01': ['Pomodoro usulida bitta diqqat sessiyasi qancha davom etadi?', '5 daqiqa', '25 daqiqa', '3 soat', 'Bitta Pomodoro — 25 daqiqa diqqat va undan keyin 5 daqiqa tanaffus.'],
  'breaks-02': ['To‘rtta Pomodorodan keyin nima qilish kerak?', 'O‘qishni butunlay to‘xtatish', 'Darhol yana to‘rttasini boshlash', 'Uzoqroq tanaffus qilish', 'To‘rt raunddan keyin 15–30 daqiqalik tanaffus miyaga dam beradi.'],
  'breaks-03': ['Bir vaqtda ko‘p ish qilish vaqtni tejaydimi?', 'Ha, har doim', 'Faqat uy vazifasida', 'Yo‘q, ishdan ishga o‘tish vaqtni yo‘qotadi', 'Har bir almashish vaqt va diqqatni oladi. Bitta ishni tugatib, keyin boshqasini boshlang.'],
  'breaks-04': ['Yaxshi qisqa tanaffus qaysi?', 'Kerishish va suv ichish', 'Uzun video serialni boshlash', 'Ikki soat o‘yin o‘ynash', 'Qisqa faol tanaffus o‘qish vaqtini yemasdan tetiklashtiradi.'],
  'breaks-05': ['Qisqa tanaffuslar nima uchun foydali?', 'Ular dangasa qiladi', 'Ular yana diqqatni jamlashga yordam beradi', 'Ular foydali emas', 'Qisqa tanaffuslar miyaga yana diqqatni jamlash uchun kuch beradi.'],

  // Vaqtni boshqarish vositalari
  'tools-01': ['Qaysi vosita muddatlarni eslab qolishga yordam beradi?', 'O‘yin ilovasi', 'Musiqa ro‘yxati', 'Kalendar yoki kundalik', 'Kalendar yoki kundalik barcha muddatlarni bir joyda ko‘rsatadi.'],
  'tools-02': ['Taymer nimada yordam beradi?', 'Belgilangan vaqt davomida diqqatni jamlashda', 'Vazifalarni yo‘q qilishda', 'Darslarni qoldirishda', 'Taymer Pomodoro kabi diqqatli bloklarda ishlashga yordam beradi.'],
  'tools-03': ['Telefondagi eslatma nima qiladi?', 'Uy vazifangizni bajaradi', 'Vazifa haqida kerakli vaqtda eslatadi', 'Vazifalaringizni o‘chiradi', 'Eslatmalar muhim ishlarni unutmaslikka yordam beradi.'],

  // Maqsadlar va muddatlar
  'goals-01': ['Qaysi maqsad eng aniq?', 'Jumagacha ikki bobni o‘qish', 'Qachondir ko‘proq o‘qish', 'Yaxshiroq talaba bo‘lish', 'Aniq maqsad nima qilishni va qachon tugatishni aytadi.'],
  'goals-03': ['Loyihani topshirishga bir oy bor. Qanday qilgan yaxshi?', 'Hammasini oxirgi kuni qilish', 'Har bir qism uchun kichik muddat qo‘yish', 'Uch hafta unutib qo‘yish', 'Har bir qism uchun kichik muddatlar katta loyihani yo‘lda ushlab turadi.'],

  // Uy vazifasini rejalashtirish
  'homework-01': ['Uy vazifasini o‘z vaqtida tugatishga nima yordam beradi?', 'Dam olish kunlarini kutish', 'Har kuni belgilangan uy vazifasi vaqti', 'Uni boshqa darslarda bajarish', 'Har kuni bir xil vaqt uy vazifasini odatga aylantiradi.'],
  'homework-02': ['Uy vazifasi dushanba kuni berildi, juma kuni topshiriladi. Qachon boshlash kerak?', 'Juma kuni ertalab', 'Payshanba kuni kechasi', 'Hafta boshida', 'Erta boshlasangiz, savol berish va xatolarni tuzatishga vaqt qoladi.'],
  'homework-03': ['Uy vazifasi ko‘p bo‘lsa, avval nima qilish kerak?', 'Ro‘yxat tuzib, tartibga solish', 'Vahimaga tushish', 'Hech birini qilmaslik', 'To‘g‘ri tartibdagi ro‘yxat katta uyumni aniq qadamlarga aylantiradi.'],
  'homework-04': ['Uy vazifasini tushunmadingiz. Eng to‘g‘ri yo‘l qaysi?', 'Uni tashlab, hech narsa demaslik', 'O‘qituvchi yoki sinfdoshdan erta so‘rash', 'Do‘stingizning ishidan ko‘chirish', 'Erta so‘rash vaqtni tejaydi va haqiqatan o‘rganishga yordam beradi.'],

  // Chalg‘ituvchi narsalar
  'distractions-01': ['O‘qiyotganingizda telefoningiz qayerda bo‘lishi kerak?', 'Qo‘lingizda', 'Kitob yonida, ovozi yoqilgan', 'Boshqa xonada yoki sumkada', 'Hatto stol ustidagi ovozsiz telefon ham diqqatni tortadi.'],
  'distractions-02': ['O‘qish paytida eng katta chalg‘ituvchi narsa qaysi?', 'Tinch xona', 'Telefondagi bildirishnomalar', 'Bir stakan suv', 'Har bir bildirishnoma diqqatingizni bo‘ladi.'],
  'distractions-03': ['Ijtimoiy tarmoqlar vaqtingizni o‘g‘irlamasligi uchun nima qilish kerak?', 'Bildirishnomalarni o‘chirish', 'Har 5 daqiqada tekshirish', 'Ilovani ochiq qoldirish', 'Bildirishnomalarsiz ilovalarni qachon tekshirishni o‘zingiz hal qilasiz.'],
  'distractions-04': ['O‘qish uchun eng yaxshi joy qaysi?', 'Televizor yoqilgan holda karavotda', 'Toza stolli tinch joy', 'Do‘stlar bilan shovqinli kafe', 'Tinch va tartibli joy diqqatni jamlashga yordam beradi.'],

  // Sog‘lom o‘qish odatlari
  'habits-01': ['Ko‘pchilik talabalarga necha soat uyqu kerak?', '3–4 soat', '7–9 soat', '12–14 soat', 'Yetti-to‘qqiz soatlik uyqu miyaga o‘rganganlarini eslab qolishga yordam beradi.'],
  'habits-02': ['Imtihondan oldin tun bo‘yi o‘qish yaxshi fikrmi?', 'Ha, bu eng yaxshi usul', 'Faqat kofe bilan', 'Yo‘q, uyqu xotiraga yordam beradi', 'Uyqu paytida miya o‘rganganlarini saqlab qo‘yadi.'],
  'habits-04': ['Sport talabalar uchun nega foydali?', 'U o‘qish vaqtini oladi', 'U kuch beradi va stressni kamaytiradi', 'U faqat sportchilar uchun', 'Jismoniy mashqlar kuch beradi va bo‘shashishga yordam beradi.'],
  'habits-05': ['Uxlashdan oldingi bir soatda nima qilish kerak?', 'Hayajonli o‘yinlar o‘ynash', 'Ko‘p kofe ichish', 'Telefonni chetga qo‘yib, dam olish', 'Uyqudan oldin ekranga kamroq qarash tezroq uxlab qolishga yordam beradi.'],
};
