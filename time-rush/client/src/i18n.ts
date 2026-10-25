import { useSyncExternalStore } from 'react';
import type { ErrorCode } from '@shared/protocol/events';
import { QUESTIONS_UZ } from '@shared/questions/uz';
import type { Language, PublicQuestion, TeamId, TeamRoundResult } from '@shared/types/game';

/**
 * Interface language. The host picks it on the projector; the room carries it to every phone
 * (snapshot.language, and ?lang= in the join link before a phone has joined).
 */
export type Lang = Language;

const STORAGE_KEY = 'time-rush:lang';
const listeners = new Set<() => void>();

function loadLang(): Lang {
  const fromLink = new URLSearchParams(window.location.search).get('lang');
  if (fromLink === 'uz' || fromLink === 'en') return fromLink;
  try {
    return localStorage.getItem(STORAGE_KEY) === 'uz' ? 'uz' : 'en';
  } catch {
    return 'en';
  }
}

let current: Lang = loadLang();

export function getLang(): Lang {
  return current;
}

export function setLang(lang: Lang): void {
  if (lang === current) return;
  current = lang;
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // private mode: the choice lasts until the page is closed
  }
  document.documentElement.lang = lang;
  for (const listener of listeners) listener();
}

export function useLang(): Lang {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => current,
  );
}

const ordinalEn = (n: number | null) => (n === 1 ? '1st' : '2nd');
/** Text with a bold middle part: [before, bold, after]. */
type Parts = readonly [string, string, string];

const en = {
  loading: 'Loading TIME RUSH…',
  // home
  homeTagline: 'Time management race for students',
  roomCode: 'ROOM CODE',
  joinGame: 'JOIN GAME',
  openHost: 'Open the projector screen (host) →',
  // host start
  hostTagline: 'A classroom race about time management. Two teams, 20 doors, one minute to choose at each one.',
  roomGone: 'The previous game is no longer available (the server was restarted). Create a new room.',
  connectingCaps: 'CONNECTING…',
  restoringCaps: 'RESTORING GAME…',
  createRoom: 'CREATE ROOM',
  hostBackPaused: 'HOST RECONNECTED — OPEN ⚙ AND PRESS RESUME',
  pausedCaps: 'PAUSED',
  // header / bottom bar
  team: (t: TeamId) => `TEAM ${t}`,
  door: (n: number, total: number) => `DOOR ${n} / ${total}`,
  finishedCaps: 'FINISHED',
  score: 'SCORE',
  correctCaps: 'CORRECT',
  raceDoors: (n: number) => `RACE · ${n} DOORS`,
  roomCodeColon: 'ROOM CODE:',
  playersConnected: (n: number) => `${n} PLAYERS CONNECTED`,
  connectedCaps: 'CONNECTED',
  reconnectingCaps: 'RECONNECTING',
  gameStatus: 'GAME STATUS:',
  hostMenu: 'Host menu',
  soundOn: 'Turn sound on',
  soundOff: 'Turn sound off',
  fullscreen: 'Full screen',
  exitFullscreen: 'Exit full screen',
  resume: '▶ Resume',
  pause: '❚❚ Pause',
  restart: '↺ Restart',
  restartConfirm: 'Restart the game? Scores will be reset and new teams will be drawn.',
  statusHostDisconnected: 'HOST DISCONNECTED',
  statusPaused: 'PAUSED',
  statusLobby: 'WAITING FOR PLAYERS',
  statusCountdown: 'GET READY',
  statusPlaying: 'RACING',
  statusOver: 'GAME OVER',
  // lobby
  lobbyTagline: (rounds: number) => `Time management race · ${rounds} rounds · 2 teams`,
  scanToJoin: 'SCAN TO JOIN',
  devWarning: 'Development link: phones must be on the same Wi‑Fi as this laptop. Set PUBLIC_URL for classroom use.',
  playersCaps: 'PLAYERS',
  remove: (name: string) => `Remove ${name}`,
  waitingFirst: 'Waiting for the first player…',
  teamsRandom: ['Teams are picked ', 'at random', ' when the game starts. After the start nobody can join.'] as Parts,
  startGame: 'START GAME',
  // race
  outcomeCorrect: (points: number) => `CORRECT! +${points}`,
  outcomeWrong: 'WRONG DOOR!',
  outcomeSkipped: 'NO VOTES',
  tieRandom: 'Tie decided at random',
  tieBreakDecided: 'Decided by tie-break',
  finishedRank: (rank: number | null): readonly [string, string] => ['FINISHED! ', rank === 1 ? '1ST' : '2ND'],
  runningTo: (door: string) => `RUNNING TO ${door}`,
  ready: 'READY…',
  tieVoteAgain: 'TIE! VOTE AGAIN',
  chooseDoor: 'CHOOSE A DOOR',
  voted: (v: number, c: number) => `${v} / ${c} voted`,
  go: 'GO!',
  // final
  finalResults: 'FINAL RESULTS',
  teamWins: (t: TeamId) => `TEAM ${t} WINS!`,
  bothWin: 'BOTH TEAMS WIN!',
  nobodyWins: 'NOBODY WINS',
  bothWinNote: 'Same number of correct answers!',
  nobodyNote: 'No correct answers — try again!',
  winner: '🏆 WINNER',
  correctOf: (c: number, total: number, rank: number | null) => `${c} / ${total} correct · finished ${ordinalEn(rank)}`,
  finalMessage: 'Plan first, do the important things, avoid distractions — and take breaks!',
  playAgain: 'PLAY AGAIN',
  // phone
  joinNotFound: 'This game has ended or the server was restarted. Scan the new QR code.',
  joinInProgress: 'This game has already started. You can join the next game.',
  removedByHost: 'The host removed you from this game.',
  next: 'NEXT',
  cantJoin: 'Can’t join right now',
  otherCode: 'Enter another code',
  connecting: 'Connecting…',
  lookingServer: 'Looking for the game server.',
  reconnecting: 'Reconnecting…',
  restoringVote: 'Restoring your team and vote.',
  yourName: 'YOUR NAME',
  namePlaceholder: 'e.g. Aziz',
  joinRoom: (code: string) => `JOIN ROOM ${code}`,
  loadingShort: 'Loading…',
  connectionLost: 'Connection lost — reconnecting…',
  waitingHost: 'Waiting for the host…',
  gamePaused: 'Game paused',
  youAreIn: 'You are in!',
  playersInRoom: (n: number): Parts => [`${n} player${n === 1 ? '' : 's'} in the room. Teams are picked `, 'at random', ' when the game starts.'],
  watchScreen: 'Watch the big screen — the host starts the game.',
  youAreInTeam: 'YOU ARE IN',
  getReady: 'Get ready!',
  runningToDoor: (door: number) => `Running to door ${door}…`,
  doorOfScore: (door: number, total: number, score: number) => `Door ${door} of ${total} · Score ${score}`,
  waitingResults: 'Waiting for results…',
  correctBang: 'CORRECT!',
  wrongDoor: 'WRONG DOOR',
  teamChose: 'Your team chose',
  plusPoints: (p: number) => ` · +${p} points`,
  correctAnswer: 'CORRECT ANSWER',
  rankBang: (rank: number | null): string => (rank === 1 ? '1ST!' : '2ND'),
  pointsCorrect: (s: number, c: number) => `${s} points · ${c} correct`,
  waitingOther: 'Waiting for the other team to finish…',
  yourTeamWon: 'Your team won! 🏆',
  teamWon: (t: TeamId) => `Team ${t} won`,
  bothWon: 'Both teams won! 🏆',
  nobodyWon: 'Nobody won this time',
  nCorrect: (c: number) => `${c} correct`,
  thanks: 'Plan your day, do important things first, and take breaks. Thanks for playing!',
  tieNote: 'TIE! Vote again for one of these answers.',
  votesInTeam: 'Votes in your team',
  sending: 'Sending…',
  yourVote: (a: string) => `Your vote: ${a} ✓ You can still change it.`,
  tapToVote: 'Tap an answer to vote for your team.',
  teammatesVoted: (v: number, c: number) => `${v} of ${c} teammates voted — when everyone votes, your runner goes at once.`,
  errors: {} as Partial<Record<ErrorCode, string>>,
};

export type Texts = typeof en;

const uz: Texts = {
  loading: 'TIME RUSH yuklanmoqda…',
  homeTagline: 'Talabalar uchun vaqtni boshqarish poygasi',
  roomCode: 'XONA KODI',
  joinGame: 'O‘YINGA KIRISH',
  openHost: 'Proyektor ekranini ochish (boshlovchi) →',
  hostTagline: 'Vaqtni boshqarish haqida sinf poygasi. Ikki jamoa, 20 ta eshik, har birida tanlash uchun 1 daqiqa.',
  roomGone: 'Oldingi o‘yin endi mavjud emas (server qayta ishga tushirildi). Yangi xona yarating.',
  connectingCaps: 'ULANMOQDA…',
  restoringCaps: 'O‘YIN TIKLANMOQDA…',
  createRoom: 'XONA YARATISH',
  hostBackPaused: 'BOSHLOVCHI QAYTA ULANDI — ⚙ NI OCHIB, «DAVOM ETTIRISH»NI BOSING',
  pausedCaps: 'PAUZA',
  team: (t) => `${t} JAMOA`,
  door: (n, total) => `ESHIK ${n} / ${total}`,
  finishedCaps: 'MARRA',
  score: 'OCHKO',
  correctCaps: 'TO‘G‘RI',
  raceDoors: (n) => `POYGA · ${n} ESHIK`,
  roomCodeColon: 'XONA KODI:',
  playersConnected: (n) => `${n} O‘YINCHI ULANGAN`,
  connectedCaps: 'ULANGAN',
  reconnectingCaps: 'QAYTA ULANMOQDA',
  gameStatus: 'O‘YIN HOLATI:',
  hostMenu: 'Boshlovchi menyusi',
  soundOn: 'Ovozni yoqish',
  soundOff: 'Ovozni o‘chirish',
  fullscreen: 'To‘liq ekran',
  exitFullscreen: 'To‘liq ekrandan chiqish',
  resume: '▶ Davom ettirish',
  pause: '❚❚ Pauza',
  restart: '↺ Qaytadan',
  restartConfirm: 'O‘yinni qaytadan boshlaysizmi? Ochkolar nolga tushadi va jamoalar qaytadan tanlanadi.',
  statusHostDisconnected: 'BOSHLOVCHI UZILDI',
  statusPaused: 'PAUZA',
  statusLobby: 'O‘YINCHILAR KUTILMOQDA',
  statusCountdown: 'TAYYORLANING',
  statusPlaying: 'POYGA',
  statusOver: 'O‘YIN TUGADI',
  lobbyTagline: (rounds) => `Vaqtni boshqarish poygasi · ${rounds} raund · 2 jamoa`,
  scanToJoin: 'KIRISH UCHUN SKANERLANG',
  devWarning: 'Sinov havolasi: telefonlar shu noutbuk bilan bir xil Wi‑Fi tarmog‘ida bo‘lishi kerak. Sinfda ishlatish uchun PUBLIC_URL ni sozlang.',
  playersCaps: 'O‘YINCHILAR',
  remove: (name) => `${name}ni chiqarish`,
  waitingFirst: 'Birinchi o‘yinchi kutilmoqda…',
  teamsRandom: ['Jamoalar o‘yin boshlanganda ', 'tasodifiy', ' tanlanadi. Boshlangandan keyin hech kim qo‘shila olmaydi.'],
  startGame: 'O‘YINNI BOSHLASH',
  outcomeCorrect: (points) => `TO‘G‘RI! +${points}`,
  outcomeWrong: 'NOTO‘G‘RI ESHIK!',
  outcomeSkipped: 'OVOZ YO‘Q',
  tieRandom: 'Teng ovoz tasodifiy hal qilindi',
  tieBreakDecided: 'Qayta ovoz berish bilan hal qilindi',
  finishedRank: (rank) => ['MARRA! ', rank === 1 ? '1-O‘RIN' : '2-O‘RIN'],
  runningTo: (door) => `${door} SARI YUGURMOQDA`,
  ready: 'TAYYOR…',
  tieVoteAgain: 'TENG! QAYTA OVOZ BERING',
  chooseDoor: 'ESHIKNI TANLANG',
  voted: (v, c) => `${v} / ${c} ovoz berdi`,
  go: 'KETDIK!',
  finalResults: 'YAKUNIY NATIJALAR',
  teamWins: (t) => `${t} JAMOA G‘OLIB!`,
  bothWin: 'IKKALA JAMOA HAM G‘OLIB!',
  nobodyWins: 'HECH KIM YUTMADI',
  bothWinNote: 'To‘g‘ri javoblar soni teng!',
  nobodyNote: 'To‘g‘ri javob yo‘q — yana urinib ko‘ring!',
  winner: '🏆 G‘OLIB',
  correctOf: (c, total, rank) => `${c} / ${total} to‘g‘ri · marraga ${rank === 1 ? 1 : 2}-bo‘lib yetdi`,
  finalMessage: 'Avval reja tuzing, muhim ishlarni bajaring, chalg‘imang — va dam olishni unutmang!',
  playAgain: 'YANA O‘YNASH',
  joinNotFound: 'Bu o‘yin tugagan yoki server qayta ishga tushirilgan. Yangi QR kodni skanerlang.',
  joinInProgress: 'Bu o‘yin allaqachon boshlangan. Keyingi o‘yinga qo‘shilishingiz mumkin.',
  removedByHost: 'Boshlovchi sizni bu o‘yindan chiqardi.',
  next: 'KEYINGI',
  cantJoin: 'Hozir kirib bo‘lmaydi',
  otherCode: 'Boshqa kod kiritish',
  connecting: 'Ulanmoqda…',
  lookingServer: 'O‘yin serveri qidirilmoqda.',
  reconnecting: 'Qayta ulanmoqda…',
  restoringVote: 'Jamoangiz va ovozingiz tiklanmoqda.',
  yourName: 'ISMINGIZ',
  namePlaceholder: 'masalan, Aziz',
  joinRoom: (code) => `${code} XONASIGA KIRISH`,
  loadingShort: 'Yuklanmoqda…',
  connectionLost: 'Aloqa uzildi — qayta ulanmoqda…',
  waitingHost: 'Boshlovchi kutilmoqda…',
  gamePaused: 'O‘yin to‘xtatildi',
  youAreIn: 'Siz o‘yindasiz!',
  playersInRoom: (n) => [`Xonada ${n} ta o‘yinchi. Jamoalar o‘yin boshlanganda `, 'tasodifiy', ' tanlanadi.'],
  watchScreen: 'Katta ekranga qarang — o‘yinni boshlovchi boshlaydi.',
  youAreInTeam: 'SIZNING JAMOANGIZ',
  getReady: 'Tayyorlaning!',
  runningToDoor: (door) => `${door}-eshik sari yugurmoqda…`,
  doorOfScore: (door, total, score) => `Eshik ${door} / ${total} · Ochko ${score}`,
  waitingResults: 'Natijalar kutilmoqda…',
  correctBang: 'TO‘G‘RI!',
  wrongDoor: 'NOTO‘G‘RI ESHIK',
  teamChose: 'Jamoangiz tanladi:',
  plusPoints: (p) => ` · +${p} ochko`,
  correctAnswer: 'TO‘G‘RI JAVOB',
  rankBang: (rank) => (rank === 1 ? '1-O‘RIN!' : '2-O‘RIN'),
  pointsCorrect: (s, c) => `${s} ochko · ${c} to‘g‘ri`,
  waitingOther: 'Boshqa jamoa marraga yetishi kutilmoqda…',
  yourTeamWon: 'Jamoangiz yutdi! 🏆',
  teamWon: (t) => `${t} jamoa yutdi`,
  bothWon: 'Ikkala jamoa ham yutdi! 🏆',
  nobodyWon: 'Bu safar hech kim yutmadi',
  nCorrect: (c) => `${c} to‘g‘ri`,
  thanks: 'Kuningizni rejalashtiring, avval muhim ishlarni bajaring va dam oling. O‘ynaganingiz uchun rahmat!',
  tieNote: 'TENG! Shu javoblardan biriga qayta ovoz bering.',
  votesInTeam: 'Jamoangizdagi ovozlar',
  sending: 'Yuborilmoqda…',
  yourVote: (a) => `Ovozingiz: ${a} ✓ Hali o‘zgartirishingiz mumkin.`,
  tapToVote: 'Jamoangiz uchun javobni bosing.',
  teammatesVoted: (v, c) => `${c} jamoadoshdan ${v} tasi ovoz berdi — hamma ovoz bersa, yuguruvchi darhol yo‘lga chiqadi.`,
  errors: {
    INVALID_PAYLOAD: 'Noto‘g‘ri ma’lumot yuborildi.',
    ROOM_NOT_FOUND: 'Bunday xona topilmadi.',
    ROOM_FULL: 'Xona to‘lgan.',
    NOT_HOST: 'Buni faqat boshlovchi qila oladi.',
    NOT_IN_ROOM: 'Siz bu xonada emassiz.',
    SESSION_INVALID: 'Seans eskirgan. Qaytadan kiring.',
    GAME_IN_PROGRESS: 'O‘yin allaqachon boshlangan.',
    NO_TEAM: 'Sizda hali jamoa yo‘q.',
    VOTING_CLOSED: 'Ovoz berish yopildi.',
    STALE_ROUND: 'Bu savol allaqachon tugagan.',
    INVALID_ANSWER: 'Bunday javob yo‘q.',
    NOT_IN_TIE_BREAK: 'Hozir qayta ovoz berish yo‘q.',
    INVALID_STATE: 'Hozir buni qilib bo‘lmaydi.',
    RATE_LIMITED: 'Juda tez. Biroz kuting.',
    INTERNAL: 'Server xatosi. Qaytadan urinib ko‘ring.',
  },
};

const TEXTS: Record<Lang, Texts> = { en, uz };

/** The texts in the language chosen on this device; re-renders when it changes. */
export function useT(): Texts {
  return TEXTS[useLang()];
}

/** A server error in the chosen language (the server sends English). */
export function errorText(t: Texts, code: ErrorCode, message: string): string {
  return t.errors[code] ?? message;
}

/** The question in the chosen language (questions travel in English). */
export function localizeQuestion(question: PublicQuestion, lang: Lang): PublicQuestion {
  const uz = lang === 'uz' ? QUESTIONS_UZ[question.id] : undefined;
  if (!uz) return question;
  return {
    ...question,
    question: uz[0],
    answers: [
      { id: 'A', text: uz[1] },
      { id: 'B', text: uz[2] },
      { id: 'C', text: uz[3] },
    ],
  };
}

export function localizeResult(result: TeamRoundResult, lang: Lang): TeamRoundResult {
  const uz = lang === 'uz' ? QUESTIONS_UZ[result.questionId] : undefined;
  if (!uz) return result;
  const index = { A: 1, B: 2, C: 3 }[result.correctAnswer];
  return { ...result, question: uz[0], correctAnswerText: uz[index], explanation: uz[4] };
}
