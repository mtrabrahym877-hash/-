import React, { useState, useEffect, useRef } from 'react';
import {
  Coins,
  Crown,
  Sparkles,
  Volume2,
  VolumeX,
  Trophy,
  RotateCcw,
  Plus,
  ChevronLeft,
  Flame,
  History,
  TrendingUp,
  TrendingDown,
  X,
} from 'lucide-react';
import { AnimatedCoinCounter } from './AnimatedCoinCounter';

export interface GreedyCatItem {
  id: string;
  name: string;
  emoji: string;
  multiplier: number;
  category: 'veggie' | 'meat' | 'jackpot';
  accentClass: string;
  probabilityWeight: number;
  displayTotalM?: string;
  isHot?: boolean;
}

export const GREEDY_CAT_ITEMS: GreedyCatItem[] = [
  {
    id: 'rooster_45',
    name: 'دجاج المزرعة',
    emoji: '🐔',
    multiplier: 45,
    category: 'meat',
    accentClass: 'from-amber-500/25 to-orange-950/60 border-amber-400',
    probabilityWeight: 4,
    displayTotalM: '0.937M',
  },
  {
    id: 'tomato_5',
    name: 'طماطم طازجة',
    emoji: '🍅',
    multiplier: 5,
    category: 'veggie',
    accentClass: 'from-rose-500/25 to-red-950/60 border-rose-400',
    probabilityWeight: 20,
    displayTotalM: '1.916M',
  },
  {
    id: 'goat_15',
    name: 'خروف / ماعز',
    emoji: '🐐',
    multiplier: 15,
    category: 'meat',
    accentClass: 'from-amber-600/30 to-amber-950/70 border-amber-400',
    probabilityWeight: 10,
    displayTotalM: '1.946M',
    isHot: true,
  },
  {
    id: 'bellpepper_5',
    name: 'فلفل أحمر',
    emoji: '🫑',
    multiplier: 5,
    category: 'veggie',
    accentClass: 'from-red-500/25 to-rose-950/60 border-red-400',
    probabilityWeight: 20,
    displayTotalM: '2.434M',
  },
  {
    id: 'fish_25',
    name: 'سمك ملون',
    emoji: '🐟',
    multiplier: 25,
    category: 'meat',
    accentClass: 'from-cyan-500/30 to-blue-950/70 border-cyan-400',
    probabilityWeight: 7,
    displayTotalM: '0.973M',
  },
  {
    id: 'carrot_5',
    name: 'جزر برتقالي',
    emoji: '🥕',
    multiplier: 5,
    category: 'veggie',
    accentClass: 'from-orange-500/25 to-amber-950/60 border-orange-400',
    probabilityWeight: 20,
    displayTotalM: '2.292M',
  },
  {
    id: 'shrimp_10',
    name: 'جمبري بحري',
    emoji: '🍤',
    multiplier: 10,
    category: 'meat',
    accentClass: 'from-purple-500/30 to-indigo-950/70 border-purple-400',
    probabilityWeight: 12,
    displayTotalM: '1.026M',
  },
  {
    id: 'corn_5',
    name: 'ذرة ذهبية',
    emoji: '🌽',
    multiplier: 5,
    category: 'veggie',
    accentClass: 'from-amber-400/25 to-yellow-950/60 border-amber-300',
    probabilityWeight: 20,
    displayTotalM: '2.354M',
  },
  {
    id: 'salad_feast',
    name: 'السلطة (يربح كل الخضار)',
    emoji: '🥗',
    multiplier: 20,
    category: 'jackpot',
    accentClass: 'from-lime-400/35 to-emerald-950/60 border-lime-400',
    probabilityWeight: 3,
  },
  {
    id: 'pizza_feast',
    name: 'البيتزا (يربح كل اللحوم)',
    emoji: '🍕',
    multiplier: 50,
    category: 'jackpot',
    accentClass: 'from-[#FFD700]/40 via-amber-500/30 to-rose-900/60 border-[#FFD700]',
    probabilityWeight: 2,
  },
];

// The 8 ferris wheel nodes positioned in clockwise circular order:
export const WHEEL_SLOTS: string[] = [
  'rooster_45',
  'tomato_5',
  'goat_15',
  'bellpepper_5',
  'fish_25',
  'carrot_5',
  'shrimp_10',
  'corn_5',
];

// Chip denominations: 500, 1,000, 3,000, 5,000, 10,000, 30,000, 60,000, 100,000, 300,000 coins:
export const CHIP_VALUES = [500, 1000, 3000, 5000, 10000, 30000, 60000, 100000, 300000];

export type ArcadeGameTabId =
  | 'greedy_cat'
  | 'lion_vs_falcon'
  | 'car_race'
  | 'treasure_dice'
  | 'grab_mic'
  | 'guess_challenge'
  | 'spin_wheel_party'
  | 'truth_or_dare'
  | 'xo_majlis'
  | 'spy_impostor';

interface GreedyCatGameProps {
  coins: number;
  setCoins: React.Dispatch<React.SetStateAction<number>>;
  onOpenTopup: () => void;
  onBack?: () => void;
  onAnnounceWinInRoom?: (winText: string) => void;
  showToast: (msg: string) => void;
  initialGameTab?: ArcadeGameTabId;
}

interface RoundResultRecord {
  roundNumber: number;
  item: GreedyCatItem;
  wonCoins: number;
  totalBet: number;
  netProfit?: number;
  timestamp?: number;
}

interface BattleOption {
  id: 'lion' | 'tie' | 'falcon';
  title: string;
  subtitle: string;
  emoji: string;
  multiplier: number;
  accent: string;
  weight: number;
}

const BATTLE_OPTIONS: BattleOption[] = [
  {
    id: 'lion',
    title: 'الأسد الذهبي',
    subtitle: 'ملك الغابة',
    emoji: '🦁',
    multiplier: 2,
    accent: 'from-amber-500/35 to-orange-950/60 border-[#FFD700]',
    weight: 45,
  },
  {
    id: 'tie',
    title: 'التعادل الملكي',
    subtitle: 'تاج الإمبراطور',
    emoji: '👑',
    multiplier: 9,
    accent: 'from-purple-500/35 to-indigo-950/60 border-purple-400',
    weight: 10,
  },
  {
    id: 'falcon',
    title: 'الصقر الحر',
    subtitle: 'سيد السماء',
    emoji: '🦅',
    multiplier: 2,
    accent: 'from-cyan-500/35 to-blue-950/60 border-[#00D1FF]',
    weight: 45,
  },
];

interface CarRaceItem {
  id: string;
  name: string;
  emoji: string;
  multiplier: number;
  accent: string;
  weight: number;
}

const CAR_RACE_ITEMS: CarRaceItem[] = [
  {
    id: 'bugatti_gold',
    name: 'بوغاتي الذهب الخالص',
    emoji: '🏎️',
    multiplier: 40,
    accent: 'from-[#FFD700]/35 to-amber-950/60 border-[#FFD700]',
    weight: 3,
  },
  {
    id: 'ferrari_red',
    name: 'فيراري البرق الأحمر',
    emoji: '🚘',
    multiplier: 20,
    accent: 'from-rose-500/35 to-red-950/60 border-rose-400',
    weight: 6,
  },
  {
    id: 'lambo_cyan',
    name: 'لامبورغيني النيون',
    emoji: '🚙',
    multiplier: 10,
    accent: 'from-cyan-500/35 to-blue-950/60 border-cyan-400',
    weight: 12,
  },
  {
    id: 'porsche_purple',
    name: 'بورش التوربو الملكي',
    emoji: '🚗',
    multiplier: 5,
    accent: 'from-purple-500/30 to-indigo-950/60 border-purple-400',
    weight: 23,
  },
  {
    id: 'police_turbo',
    name: 'دورية الصاعقة السريعة',
    emoji: '🚓',
    multiplier: 5,
    accent: 'from-emerald-500/30 to-teal-950/60 border-emerald-400',
    weight: 26,
  },
  {
    id: 'classic_jeep',
    name: 'جيب الصحراء العربي',
    emoji: '🛻',
    multiplier: 3,
    accent: 'from-slate-500/30 to-slate-900/60 border-slate-400',
    weight: 30,
  },
];

interface DiceZoneOption {
  id: 'under7' | 'lucky7' | 'over7';
  title: string;
  rangeLabel: string;
  emoji: string;
  multiplier: number;
  accent: string;
}

const DICE_ZONES: DiceZoneOption[] = [
  {
    id: 'under7',
    title: 'أصغر من 7',
    rangeLabel: 'المجموع (2 إلى 6)',
    emoji: '⬇️',
    multiplier: 2,
    accent: 'from-cyan-500/30 to-blue-950/60 border-[#00D1FF]',
  },
  {
    id: 'lucky7',
    title: 'الرقم الذهبي 7',
    rangeLabel: 'المجموع يساوي 7 تماماً',
    emoji: '💎',
    multiplier: 6,
    accent: 'from-[#FFD700]/35 to-amber-950/60 border-[#FFD700]',
  },
  {
    id: 'over7',
    title: 'أكبر من 7',
    rangeLabel: 'المجموع (8 إلى 12)',
    emoji: '⬆️',
    multiplier: 2,
    accent: 'from-emerald-500/30 to-teal-950/60 border-emerald-400',
  },
];

const DICE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

// ============================================================================
// FREE PARTY GAMES DATA (ألعاب مجانية بدون كوينزات للمجلس الصوتي)
// ============================================================================
interface GrabMicRoundItem {
  id: string;
  category: string;
  prompt: string;
  missingLyricOrAnswer: string;
  options: string[];
  correctIndex: number;
}

const GRAB_MIC_CHALLENGES: GrabMicRoundItem[] = [
  {
    id: 'gm1',
    category: 'طرب خليجي وعربي',
    prompt: 'أكمل الأغنية الشهيرة: «الأماكن كلها _____ لك، والعيون اللي انعمت بعدك...»',
    missingLyricOrAnswer: 'مشتاقة',
    options: ['مشتاقة', 'حزينة', 'تنادي', 'سهرانة'],
    correctIndex: 0,
  },
  {
    id: 'gm2',
    category: 'شيلات وقصائد المجلس',
    prompt: 'أكمل البيت الشعري: «يا دار ما فعلت بك _____، ضامتك والأيام ليس تضام»',
    missingLyricOrAnswer: 'الأيام',
    options: ['الليالي', 'الأيام', 'السنين', 'الرياح'],
    correctIndex: 1,
  },
  {
    id: 'gm3',
    category: 'طرب يمني أصيل',
    prompt: 'أكمل الأغنية الشهيرة: «يا طير يا طاير على باب _____، سلّم على الأحباب»',
    missingLyricOrAnswer: 'السلام',
    options: ['الغرام', 'اليمن', 'السلام', 'الهوى'],
    correctIndex: 2,
  },
  {
    id: 'gm4',
    category: 'أغاني خليجية',
    prompt: 'أكمل الأغنية: «مذهلة.. ماهي بس قصة _____، رغم إن الحسن فيها بحد ذاته مشكلة»',
    missingLyricOrAnswer: 'حسن',
    options: ['عشق', 'حسن', 'شوق', 'صوت'],
    correctIndex: 1,
  },
  {
    id: 'gm5',
    category: 'حماس المجلس',
    prompt: 'أكمل المثل العربي الشهير على المايك: «الصديق وقت _____»',
    missingLyricOrAnswer: 'الضيق',
    options: ['الطريق', 'الضيق', 'السفر', 'السمر'],
    correctIndex: 1,
  },
];

interface GuessQuestionItem {
  id: string;
  type: string;
  emojiClue: string;
  question: string;
  hint: string;
  options: string[];
  correctIndex: number;
}

const GUESS_CHALLENGE_LIST: GuessQuestionItem[] = [
  {
    id: 'gq1',
    type: 'تخمين الإيموجي 🎬',
    emojiClue: '🦁 👑 🌍',
    question: 'ما اسم الفيلم أو القصة التي ترمز إليها هذه الرموز؟',
    hint: 'ملك الغابة الشهير',
    options: ['الأسد الملك', 'علاء الدين', 'كتاب الأدغال', 'طرزان'],
    correctIndex: 0,
  },
  {
    id: 'gq2',
    type: 'فوازير المجلس 🧩',
    emojiClue: '☕ 🔥 ⛺',
    question: 'شيء كلما غلى على النار زاد طيبه واجتمع حوله النشامى في المجلس؟',
    hint: 'رمز الكرم العربي',
    options: ['القهوة العربية', 'الماء البارد', 'العصير', 'الثلج'],
    correctIndex: 0,
  },
  {
    id: 'gq3',
    type: 'تخمين الدول والمدن 🌍',
    emojiClue: '🗼 ☕ 🥐',
    question: 'أي مدينة عالمية ترمز لها هذه الإيموجيات الثلاثة؟',
    hint: 'عاصمة النور في أوروبا',
    options: ['روما', 'باريس', 'لندن', 'مدريد'],
    correctIndex: 1,
  },
  {
    id: 'gq4',
    type: 'ألغاز ذكاء 🧠',
    emojiClue: '🗣️ 🔊 🏔️',
    question: 'يتكلم جميع لغات العالم بدون لسان ويسمع بلا أذن، فما هو؟',
    hint: 'يرد عليك في الجبال والأودية',
    options: ['الميكروفون', 'صدى الصوت', 'الراديو', 'الهاتف'],
    correctIndex: 1,
  },
  {
    id: 'gq5',
    type: 'تخمين الأكلات الشعبية 🍲',
    emojiClue: '🍚 🍖 🔥',
    question: 'أكلة عربية شهيرة تُطهى باللحم والأرز في التنور تحت الأرض؟',
    hint: 'تشتهر بها اليمن والخليج في الولائم',
    options: ['المندي', 'البيتزا', 'السوشي', 'المعكرونة'],
    correctIndex: 0,
  },
  {
    id: 'gq6',
    type: 'تخمين الحيوان 🦅',
    emojiClue: '🦅 👀 ☁️',
    question: 'طائر جارح يضرب به العرب المثل في حدة البصر والشموخ؟',
    hint: 'رفيق القنص في الجزيرة العربية',
    options: ['الطاووس', 'الصقر الحر', 'الحمامة', 'البطريق'],
    correctIndex: 1,
  },
];

const PARTY_WHEEL_PROMPTS: string[] = [
  '🎙️ غنِّ مقطعاً صوتياً لمدة 10 ثوانٍ على المايك!',
  '😂 قل نكتة أو موقفاً مضحكاً حصل معك لأعضاء المجلس!',
  '🪶 ألقِ بيت شعر أو حكمة جميلة بصوتك في الغرفة!',
  '🤝 وجّه تحية خاصة لأكثر شخص متفاعل في المجلس الآن!',
  '🎭 قلّد صوت معلق رياضي متحمس لمدة 10 ثوانٍ!',
  '☕ اسأل أي عضو على المايك سؤالاً صريحاً!',
];

const TRUTH_QUESTIONS: string[] = [
  '🔥 صراحة: من هو أقرب صديق لك داخل غرف «مجلسنا» الصوتية؟',
  '💬 صراحة: ما هو أكثر موقف محرج أو مضحك حصل لك وأنت تتكلم على المايك؟',
  '🌟 صراحة: لو أعطوك إدارة الغرفة ليوم كامل، من أول شخص تعطيه المايك الأول؟',
  '🎭 صراحة: ما هي الموهبة الخفية التي تمتلكها ولا يعرفها أعضاء المجلس؟',
  '☕ صراحة: أي نوع من الغرف الصوتية تفضّل أكثر (موسيقى، نقاش، شعر، أم ترفيه) ولماذا؟',
];

const DARE_CHALLENGES: string[] = [
  '⚡ جرأة: افتح المايك الآن وقل «أنا أسطورة مجلسنا!» بصوت حماسي!',
  '🎤 جرأة: غنِّ مطلع أغنيتك المفضلة بدون موسيقى لمدة 15 ثانية!',
  '🦅 جرأة: امدح صاحب المايك رقم 2 بكلمات شاعرية أمام الجميع!',
  '😂 جرأة: تكلّم باللغة العربية الفصحى فقط لمدة دقيقتين في الغرفة!',
  '👏 جرأة: أرسل تحية ملكية في الدردشة لأول 3 أعضاء في الغرفة!',
];

interface SpyRoundData {
  category: string;
  secretWord: string;
  suspects: {
    name: string;
    seatLabel: string;
    statement: string;
    isSpy: boolean;
  }[];
}

const SPY_ROUNDS: SpyRoundData[] = [
  {
    category: 'مشروب في المجلس',
    secretWord: 'القهوة العربية ☕',
    suspects: [
      {
        name: 'صقر اليمن',
        seatLabel: 'مايك 2',
        statement: 'نقدمها للضيوف مع التمر والهيل في الدلة الذهبية.',
        isSpy: false,
      },
      {
        name: 'خالد',
        seatLabel: 'مايك 3',
        statement: 'تُشرب باردة جداً مع الثلج والليمون في الصيف!',
        isSpy: true,
      },
      {
        name: 'المحترف',
        seatLabel: 'مايك 4',
        statement: 'رائحتها بالزعفران والقرنفل تملأ ديوان المجلس.',
        isSpy: false,
      },
      {
        name: 'الجنوبي',
        seatLabel: 'مايك 5',
        statement: 'رمز الكرم والأصالة في كل مجلس عربي.',
        isSpy: false,
      },
    ],
  },
  {
    category: 'حيوان ملكي',
    secretWord: 'الصقر الحر 🦅',
    suspects: [
      {
        name: 'صقر اليمن',
        seatLabel: 'مايك 2',
        statement: 'يتميز بحدة البصر والتحليق العالي في السماء.',
        isSpy: false,
      },
      {
        name: 'خالد',
        seatLabel: 'مايك 3',
        statement: 'يستخدمه العرب في القنص والصيد ويقف على الوكر.',
        isSpy: false,
      },
      {
        name: 'المحترف',
        seatLabel: 'مايك 4',
        statement: 'يعيش في أعماق البحار ويتنفس تحت الماء!',
        isSpy: true,
      },
      {
        name: 'الجنوبي',
        seatLabel: 'مايك 5',
        statement: 'طائر جارح أصيل يرمز للشموخ والعزة.',
        isSpy: false,
      },
    ],
  },
  {
    category: 'آلة طرب شرقية',
    secretWord: 'العود العربي 🪕',
    suspects: [
      {
        name: 'صقر اليمن',
        seatLabel: 'مايك 2',
        statement: 'آلة وترية أصيلة تُعزف بالريشة في جلسات السمر.',
        isSpy: false,
      },
      {
        name: 'خالد',
        seatLabel: 'مايك 3',
        statement: 'نسمعه دائماً في الغرف الموسيقية والطرب الأصيل.',
        isSpy: false,
      },
      {
        name: 'المحترف',
        seatLabel: 'مايك 4',
        statement: 'صوته دافئ ويسمى سلطان الآلات الشرقية.',
        isSpy: false,
      },
      {
        name: 'الجنوبي',
        seatLabel: 'مايك 5',
        statement: 'ننفخ فيه بالهواء مثل المزمار والناي!',
        isSpy: true,
      },
    ],
  },
];

export default function GreedyCatGame({
  coins,
  setCoins,
  onOpenTopup,
  onBack,
  onAnnounceWinInRoom,
  showToast,
  initialGameTab = 'greedy_cat',
}: GreedyCatGameProps) {
  const [activeGameTab, setActiveGameTab] =
    useState<ArcadeGameTabId>(initialGameTab);
  const [gameModeCategory, setGameModeCategory] = useState<'coin_games' | 'free_games'>(
    initialGameTab === 'grab_mic' ||
      initialGameTab === 'guess_challenge' ||
      initialGameTab === 'spin_wheel_party' ||
      initialGameTab === 'truth_or_dare' ||
      initialGameTab === 'xo_majlis' ||
      initialGameTab === 'spy_impostor'
      ? 'free_games'
      : 'coin_games'
  );
  const [selectedChip, setSelectedChip] = useState<number>(5000);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // ============================================================================
  // 1. GREEDY CAT STATE (لعبة القط الجشع)
  // ============================================================================
  const [bets, setBets] = useState<Record<string, number>>({});
  const [previousBets, setPreviousBets] = useState<Record<string, number>>({});
  const [gameState, setGameState] = useState<'BETTING' | 'SPINNING' | 'RESULT'>('BETTING');
  const [countdown, setCountdown] = useState<number>(15);
  const [activeSlotIndex, setActiveSlotIndex] = useState<number>(0);
  const [roundNumber, setRoundNumber] = useState<number>(244791);
  const [gameDifficulty, setGameDifficulty] = useState<'normal' | 'advanced'>('normal');
  const [autoRepeatBet, setAutoRepeatBet] = useState<boolean>(false);
  const [history, setHistory] = useState<GreedyCatItem[]>([
    GREEDY_CAT_ITEMS[0],
    GREEDY_CAT_ITEMS[1],
    GREEDY_CAT_ITEMS[4],
    GREEDY_CAT_ITEMS[2],
    GREEDY_CAT_ITEMS[7],
    GREEDY_CAT_ITEMS[5],
    GREEDY_CAT_ITEMS[6],
    GREEDY_CAT_ITEMS[3],
  ]);
  const [lastRoundResult, setLastRoundResult] = useState<RoundResultRecord | null>(null);
  const [detailedRoundHistory, setDetailedRoundHistory] = useState<RoundResultRecord[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [autoTimerEnabled, setAutoTimerEnabled] = useState<boolean>(true);

  const betsRef = useRef<Record<string, number>>(bets);
  betsRef.current = bets;

  // ============================================================================
  // 2. LION VS FALCON ARENA STATE (صراع الأسد والصقر)
  // ============================================================================
  const [battleBets, setBattleBets] = useState<Record<'lion' | 'tie' | 'falcon', number>>({
    lion: 0,
    tie: 0,
    falcon: 0,
  });
  const [battleState, setBattleState] = useState<'BETTING' | 'FIGHTING' | 'RESULT'>('BETTING');
  const [lionScore, setLionScore] = useState<number>(8);
  const [falconScore, setFalconScore] = useState<number>(7);
  const [battleWinner, setBattleWinner] = useState<'lion' | 'tie' | 'falcon' | null>(null);
  const [battleWonCoins, setBattleWonCoins] = useState<number>(0);
  const [battleHistory, setBattleHistory] = useState<('lion' | 'tie' | 'falcon')[]>([
    'lion',
    'falcon',
    'lion',
    'tie',
    'falcon',
    'lion',
    'falcon',
  ]);

  // ============================================================================
  // 3. ROYAL CAR RACE STATE (سباق السيارات الملكية)
  // ============================================================================
  const [carBets, setCarBets] = useState<Record<string, number>>({});
  const [carRaceState, setCarRaceState] = useState<'BETTING' | 'RACING' | 'RESULT'>('BETTING');
  const [activeCarIndex, setActiveCarIndex] = useState<number>(0);
  const [winningCar, setWinningCar] = useState<CarRaceItem | null>(null);
  const [carWonCoins, setCarWonCoins] = useState<number>(0);
  const [carHistory, setCarHistory] = useState<CarRaceItem[]>([
    CAR_RACE_ITEMS[2],
    CAR_RACE_ITEMS[4],
    CAR_RACE_ITEMS[0],
    CAR_RACE_ITEMS[5],
    CAR_RACE_ITEMS[1],
  ]);

  // ============================================================================
  // 4. ROYAL TREASURE DICE 777 STATE (نرد الكنز الملكي)
  // ============================================================================
  const [diceBets, setDiceBets] = useState<Record<'under7' | 'lucky7' | 'over7', number>>({
    under7: 0,
    lucky7: 0,
    over7: 0,
  });
  const [diceState, setDiceState] = useState<'BETTING' | 'ROLLING' | 'RESULT'>('BETTING');
  const [diceValues, setDiceValues] = useState<[number, number]>([4, 3]);
  const [diceWonCoins, setDiceWonCoins] = useState<number>(0);
  const [diceHistory, setDiceHistory] = useState<number[]>([7, 10, 5, 8, 4, 11, 7]);

  // ============================================================================
  // 5. FREE PARTY GAMES STATE (ألعاب بدون كوينزات: امسك المايك + لعبة التخمين + عجلة التحديات)
  // ============================================================================
  // A) Grab the Mic (امسك المايك)
  const [grabMicIndex, setGrabMicIndex] = useState<number>(0);
  const [grabMicPhase, setGrabMicPhase] = useState<'READY' | 'COUNTDOWN' | 'MIC_GRABBED' | 'ANSWERED'>('READY');
  const [grabMicCountdown, setGrabMicCountdown] = useState<number>(3);
  const [micHolderName, setMicHolderName] = useState<string>('');
  const [grabMicScore, setGrabMicScore] = useState<number>(0);
  const [grabMicSelectedOption, setGrabMicSelectedOption] = useState<number | null>(null);

  // B) Guess Challenge (لعبة التخمين والفوازير)
  const [guessIndex, setGuessIndex] = useState<number>(0);
  const [guessScore, setGuessScore] = useState<number>(0);
  const [guessStreak, setGuessStreak] = useState<number>(0);
  const [guessSelectedOption, setGuessSelectedOption] = useState<number | null>(null);
  const [showGuessHint, setShowGuessHint] = useState<boolean>(false);

  // C) Free Party Wheel (عجلة تحديات المجلس بدون كوينز)
  const [partyWheelSpinning, setPartyWheelSpinning] = useState<boolean>(false);
  const [partyWheelPrompt, setPartyWheelPrompt] = useState<string>(PARTY_WHEEL_PROMPTS[0]);
  const [partyPlayerName, setPartyPlayerName] = useState<string>('الأمير (أنت)');

  // D) Truth or Dare Bottle (صراحة أو جرأة بدون كوينز)
  const [todMode, setTodMode] = useState<'truth' | 'dare'>('truth');
  const [todSpinning, setTodSpinning] = useState<boolean>(false);
  const [todTargetPlayer, setTodTargetPlayer] = useState<string>('صقر اليمن (مايك 2)');
  const [todPromptText, setTodPromptText] = useState<string>(TRUTH_QUESTIONS[0]);

  // E) XO Majlis (تحدي إكس أو مجاني)
  const [xoBoard, setXoBoard] = useState<(null | 'X' | 'O')[]>(Array(9).fill(null));
  const [xoWinner, setXoWinner] = useState<null | 'X' | 'O' | 'DRAW'>(null);
  const [xoMyWins, setXoMyWins] = useState<number>(0);

  // F) Spy Impostor (من هو الجاسوس؟ بدون كوينز)
  const [spyRoundIdx, setSpyRoundIdx] = useState<number>(0);
  const [spySelectedSuspect, setSpySelectedSuspect] = useState<number | null>(null);
  const [spyScore, setSpyScore] = useState<number>(0);

  const totalCurrentBet: number = (Object.values(bets) as number[]).reduce(
    (sum, v) => sum + v,
    0
  );

  // Synthesized sound effects via Web Audio API
  const playTone = (freq: number, durationMs: number, type: OscillatorType = 'sine') => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + durationMs / 1000);
    } catch {
      // Ignore audio errors
    }
  };

  const getItemById = (id: string): GreedyCatItem =>
    GREEDY_CAT_ITEMS.find((it) => it.id === id) || GREEDY_CAT_ITEMS[0];

  // Place a bet on a food item using coins
  const handlePlaceBet = (itemId: string) => {
    if (gameState !== 'BETTING') {
      showToast('انتظر انتهاء دوران عجلة القط الجشع للجولة الحالية!');
      return;
    }

    if (coins < selectedChip) {
      showToast('رصيد الكوينز غير كافٍ! اشحن الآن للعب في القط الجشع');
      onOpenTopup();
      return;
    }

    setCoins((prev) => prev - selectedChip);
    setBets((prev) => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + selectedChip,
    }));
    playTone(580, 70, 'triangle');
  };

  // Clear all current bets and refund coins
  const handleClearBets = () => {
    if (gameState !== 'BETTING' || totalCurrentBet === 0) return;
    setCoins((prev) => prev + totalCurrentBet);
    setBets({});
    showToast(`تم استرجاع ${totalCurrentBet.toLocaleString('en-US')} كوينز إلى رصيدك`);
  };

  // Repeat previous round bets
  const handleRepeatBets = () => {
    if (gameState !== 'BETTING') return;
    const prevTotal: number = (Object.values(previousBets) as number[]).reduce(
      (s, v) => s + v,
      0
    );
    if (prevTotal === 0) {
      showToast('لا توجد رهانات سابقة لتكرارها');
      return;
    }
    if (coins < prevTotal) {
      showToast('رصيدك لا يكفي لتكرار الرهان السابق، اشحن الكوينز الآن');
      onOpenTopup();
      return;
    }
    setCoins((c) => c - prevTotal);
    setBets((prev) => {
      const merged = { ...prev };
      for (const [k, v] of Object.entries(previousBets) as [string, number][]) {
        merged[k] = (merged[k] || 0) + v;
      }
      return merged;
    });
    playTone(660, 90, 'triangle');
    showToast(`تم تكرار الرهان بقيمة ${prevTotal.toLocaleString('en-US')} كوينز`);
  };

  // Quick Bet on all Veggies (خضار ×5)
  const handleBetAllVeggies = () => {
    if (gameState !== 'BETTING') return;
    const veggieIds = ['tomato_5', 'corn_5', 'carrot_5', 'bellpepper_5'];
    const cost = selectedChip * veggieIds.length;
    if (coins < cost) {
      showToast('رصيدك غير كافٍ للرهان على كل الخضار');
      onOpenTopup();
      return;
    }
    setCoins((c) => c - cost);
    setBets((prev) => {
      const next = { ...prev };
      veggieIds.forEach((id) => {
        next[id] = (next[id] || 0) + selectedChip;
      });
      return next;
    });
    playTone(620, 80, 'sine');
  };

  // Quick Bet on all Meats (لحوم ودواجن وأسماك)
  const handleBetAllMeats = () => {
    if (gameState !== 'BETTING') return;
    const meatIds = ['rooster_45', 'goat_15', 'fish_25', 'shrimp_10'];
    const cost = selectedChip * meatIds.length;
    if (coins < cost) {
      showToast('رصيدك غير كافٍ للرهان على كل اللحوم');
      onOpenTopup();
      return;
    }
    setCoins((c) => c - cost);
    setBets((prev) => {
      const next = { ...prev };
      meatIds.forEach((id) => {
        next[id] = (next[id] || 0) + selectedChip;
      });
      return next;
    });
    playTone(680, 80, 'triangle');
  };

  // Pick weighted random winning slot on the 12-slot wheel
  const pickWeightedWinningSlot = (): number => {
    const slotWeights = WHEEL_SLOTS.map((slotId) => getItemById(slotId).probabilityWeight);
    const totalWeight = slotWeights.reduce((a, b) => a + b, 0);
    let rand = Math.random() * totalWeight;
    for (let i = 0; i < WHEEL_SLOTS.length; i++) {
      rand -= slotWeights[i];
      if (rand <= 0) return i;
    }
    return 0;
  };

  // Start spinning the Greedy Cat wheel
  const startWheelSpin = () => {
    if (gameState !== 'BETTING') return;
    setGameState('SPINNING');

    const currentBetsSnapshot = { ...betsRef.current };
    const snapshotTotal: number = (
      Object.values(currentBetsSnapshot) as number[]
    ).reduce((a, b) => a + b, 0);
    if (snapshotTotal > 0) {
      setPreviousBets(currentBetsSnapshot);
    }

    const targetSlotIndex = pickWeightedWinningSlot();
    const totalSteps = 24 + ((targetSlotIndex - activeSlotIndex + WHEEL_SLOTS.length) % WHEEL_SLOTS.length);
    let step = 0;
    let currentIdx = activeSlotIndex;

    const runStep = () => {
      step++;
      currentIdx = (currentIdx + 1) % WHEEL_SLOTS.length;
      setActiveSlotIndex(currentIdx);
      playTone(320 + (step % 6) * 45, 45, 'sine');

      if (step < totalSteps) {
        const progress = step / totalSteps;
        const delay = progress < 0.65 ? 65 : progress < 0.85 ? 130 : 230;
        setTimeout(runStep, delay);
      } else {
        // Spin complete! Evaluate payout
        const winningItemId = WHEEL_SLOTS[currentIdx];
        const winningItem = getItemById(winningItemId);

        let totalWon = 0;
        const directBet = currentBetsSnapshot[winningItemId] || 0;
        totalWon += directBet * winningItem.multiplier;

        // Special rule: if 'salad_feast' lands, all veggie bets also win their 5x multiplier!
        if (winningItemId === 'salad_feast') {
          ['tomato_5', 'corn_5', 'carrot_5', 'bellpepper_5'].forEach((vegId) => {
            if (currentBetsSnapshot[vegId]) {
              totalWon += currentBetsSnapshot[vegId] * 5;
            }
          });
        }
        // Special rule: if 'pizza_feast' lands, all meat bets also win their multipliers!
        if (winningItemId === 'pizza_feast') {
          ['rooster_45', 'goat_15', 'fish_25', 'shrimp_10'].forEach((meatId) => {
            if (currentBetsSnapshot[meatId]) {
              const meatItem = getItemById(meatId);
              totalWon += currentBetsSnapshot[meatId] * meatItem.multiplier;
            }
          });
        }

        const netChange = totalWon - snapshotTotal;
        const resultRecord: RoundResultRecord = {
          roundNumber,
          item: winningItem,
          wonCoins: totalWon,
          totalBet: snapshotTotal,
          netProfit: netChange,
          timestamp: Date.now(),
        };

        if (snapshotTotal > 0) {
          if (netChange > 0) {
            playTone(880, 350, 'triangle');
            showToast(
              `🐱🎉 مبروك! ربحت +${netChange.toLocaleString('en-US')} كوينز (إجمالي الربح: ${totalWon.toLocaleString('en-US')})!`
            );
          } else if (netChange < 0) {
            playTone(220, 250, 'sawtooth');
            showToast(
              `🐱 خسرت ${Math.abs(netChange).toLocaleString('en-US')} كوينز في هذه الجولة (الرهان: ${snapshotTotal.toLocaleString('en-US')})`
            );
          } else {
            showToast(
              `🐱 تعادل! استعدت رهانك بالكامل (${snapshotTotal.toLocaleString('en-US')} كوينز)`
            );
          }
        } else {
          showToast(`🐱 انتهت الجولة فاز (${winningItem.emoji} ${winningItem.name} ×${winningItem.multiplier})`);
        }

        if (totalWon > 0) {
          setCoins((prev) => prev + totalWon);
          if (onAnnounceWinInRoom && totalWon >= 500) {
            onAnnounceWinInRoom(
              `🐱 ربح ${totalWon.toLocaleString('en-US')} كوينز في لعبة القط الجشع على (${winningItem.emoji} ${winningItem.name} ×${winningItem.multiplier})!`
            );
          }
        }

        setLastRoundResult(resultRecord);
        setDetailedRoundHistory((prev) => [resultRecord, ...prev.slice(0, 19)]);
        setHistory((prev) => [winningItem, ...prev.slice(0, 9)]);
        setGameState('RESULT');

        setTimeout(() => {
          setRoundNumber((r) => r + 1);
          setCountdown(15);
          if (autoRepeatBet && snapshotTotal > 0 && coins >= snapshotTotal) {
            setCoins((c) => c - snapshotTotal);
            setBets({ ...currentBetsSnapshot });
          } else {
            setBets({});
          }
          setGameState('BETTING');
        }, 3600);
      }
    };

    runStep();
  };

  // Countdown timer effect for Greedy Cat
  useEffect(() => {
    if (activeGameTab !== 'greedy_cat' || gameState !== 'BETTING' || !autoTimerEnabled) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          startWheelSpin();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [activeGameTab, gameState, autoTimerEnabled, activeSlotIndex]);

  // ============================================================================
  // GAME 2 HANDLERS: LION VS FALCON ARENA (صراع الأسد والصقر)
  // ============================================================================
  const totalBattleBet = battleBets.lion + battleBets.tie + battleBets.falcon;

  const handlePlaceBattleBet = (side: 'lion' | 'tie' | 'falcon') => {
    if (battleState !== 'BETTING') {
      showToast('انتظر انتهاء جولة المواجهة الحالية!');
      return;
    }
    if (coins < selectedChip) {
      showToast('رصيد الكوينز غير كافٍ! اشحن الآن للعب');
      onOpenTopup();
      return;
    }
    setCoins((c) => c - selectedChip);
    setBattleBets((prev) => ({ ...prev, [side]: prev[side] + selectedChip }));
    playTone(600, 70, 'triangle');
  };

  const handleClearBattleBets = () => {
    if (battleState !== 'BETTING' || totalBattleBet === 0) return;
    setCoins((c) => c + totalBattleBet);
    setBattleBets({ lion: 0, tie: 0, falcon: 0 });
    showToast(`تم استرجاع ${totalBattleBet.toLocaleString('en-US')} كوينز`);
  };

  const startBattleRound = () => {
    if (battleState !== 'BETTING') return;
    setBattleState('FIGHTING');
    playTone(440, 150, 'sawtooth');

    const snapshot = { ...battleBets };
    let ticks = 0;

    const anim = setInterval(() => {
      ticks++;
      setLionScore(Math.floor(1 + Math.random() * 13));
      setFalconScore(Math.floor(1 + Math.random() * 13));
      playTone(350 + ticks * 30, 50, 'sine');

      if (ticks >= 10) {
        clearInterval(anim);
        // Determine outcome using weighted probabilities (45% Lion, 10% Tie, 45% Falcon)
        const r = Math.random() * 100;
        let outcome: 'lion' | 'tie' | 'falcon' = 'lion';
        let finalLion = 10;
        let finalFalcon = 6;

        if (r < 45) {
          outcome = 'lion';
          finalLion = Math.floor(8 + Math.random() * 6);
          finalFalcon = Math.floor(1 + Math.random() * (finalLion - 1));
        } else if (r < 55) {
          outcome = 'tie';
          finalLion = Math.floor(5 + Math.random() * 8);
          finalFalcon = finalLion;
        } else {
          outcome = 'falcon';
          finalFalcon = Math.floor(8 + Math.random() * 6);
          finalLion = Math.floor(1 + Math.random() * (finalFalcon - 1));
        }

        setLionScore(finalLion);
        setFalconScore(finalFalcon);
        setBattleWinner(outcome);

        const opt = BATTLE_OPTIONS.find((o) => o.id === outcome)!;
        const won = (snapshot[outcome] || 0) * opt.multiplier;
        setBattleWonCoins(won);

        if (won > 0) {
          setCoins((c) => c + won);
          playTone(920, 350, 'triangle');
          showToast(
            `🦁🦅 مبروك! ربحت ${won.toLocaleString('en-US')} كوينز في صراع الأسد والصقر (${opt.emoji} ${opt.title})!`
          );
          if (onAnnounceWinInRoom && won >= 500) {
            onAnnounceWinInRoom(
              `⚔️ ربح ${won.toLocaleString('en-US')} كوينز في لعبة صراع الأسد والصقر (${opt.emoji} ${opt.title} ×${opt.multiplier})!`
            );
          }
        }

        setBattleHistory((prev) => [outcome, ...prev.slice(0, 8)]);
        setBattleState('RESULT');

        setTimeout(() => {
          setBattleBets({ lion: 0, tie: 0, falcon: 0 });
          setBattleWinner(null);
          setBattleWonCoins(0);
          setBattleState('BETTING');
        }, 3200);
      }
    }, 110);
  };

  // ============================================================================
  // GAME 3 HANDLERS: ROYAL CAR RACE (سباق السيارات الملكية)
  // ============================================================================
  const totalCarBet: number = (Object.values(carBets) as number[]).reduce(
    (a, b) => a + b,
    0
  );

  const handlePlaceCarBet = (carId: string) => {
    if (carRaceState !== 'BETTING') {
      showToast('السباق جارٍ الآن، انتظر الجولة القادمة!');
      return;
    }
    if (coins < selectedChip) {
      showToast('رصيد الكوينز غير كافٍ! اشحن الآن للعب');
      onOpenTopup();
      return;
    }
    setCoins((c) => c - selectedChip);
    setCarBets((prev) => ({ ...prev, [carId]: (prev[carId] || 0) + selectedChip }));
    playTone(620, 70, 'triangle');
  };

  const handleClearCarBets = () => {
    if (carRaceState !== 'BETTING' || totalCarBet === 0) return;
    setCoins((c) => c + totalCarBet);
    setCarBets({});
    showToast(`تم استرجاع ${totalCarBet.toLocaleString('en-US')} كوينز`);
  };

  const startCarRace = () => {
    if (carRaceState !== 'BETTING') return;
    setCarRaceState('RACING');
    const snapshot = { ...carBets };

    // Pick weighted winner
    const totalW = CAR_RACE_ITEMS.reduce((s, c) => s + c.weight, 0);
    let rand = Math.random() * totalW;
    let targetIdx = 0;
    for (let i = 0; i < CAR_RACE_ITEMS.length; i++) {
      rand -= CAR_RACE_ITEMS[i].weight;
      if (rand <= 0) {
        targetIdx = i;
        break;
      }
    }

    const totalSteps =
      18 + ((targetIdx - activeCarIndex + CAR_RACE_ITEMS.length) % CAR_RACE_ITEMS.length);
    let step = 0;
    let curr = activeCarIndex;

    const tick = () => {
      step++;
      curr = (curr + 1) % CAR_RACE_ITEMS.length;
      setActiveCarIndex(curr);
      playTone(400 + (step % 6) * 55, 50, 'sawtooth');

      if (step < totalSteps) {
        const delay = step / totalSteps < 0.7 ? 75 : 170;
        setTimeout(tick, delay);
      } else {
        const winner = CAR_RACE_ITEMS[curr];
        setWinningCar(winner);
        const won = (snapshot[winner.id] || 0) * winner.multiplier;
        setCarWonCoins(won);

        if (won > 0) {
          setCoins((c) => c + won);
          playTone(950, 380, 'triangle');
          showToast(
            `🏎️🎉 مبروك! فازت ${winner.name} وربحت ${won.toLocaleString('en-US')} كوينز!`
          );
          if (onAnnounceWinInRoom && won >= 500) {
            onAnnounceWinInRoom(
              `🏎️ ربح ${won.toLocaleString('en-US')} كوينز في سباق السيارات الملكية على (${winner.emoji} ${winner.name} ×${winner.multiplier})!`
            );
          }
        }

        setCarHistory((prev) => [winner, ...prev.slice(0, 7)]);
        setCarRaceState('RESULT');

        setTimeout(() => {
          setCarBets({});
          setWinningCar(null);
          setCarWonCoins(0);
          setCarRaceState('BETTING');
        }, 3200);
      }
    };

    tick();
  };

  // ============================================================================
  // GAME 4 HANDLERS: ROYAL TREASURE DICE 777 (نرد الكنز الملكي)
  // ============================================================================
  const totalDiceBet = diceBets.under7 + diceBets.lucky7 + diceBets.over7;

  const handlePlaceDiceBet = (zone: 'under7' | 'lucky7' | 'over7') => {
    if (diceState !== 'BETTING') {
      showToast('النرد يدور الآن، انتظر النتيجة!');
      return;
    }
    if (coins < selectedChip) {
      showToast('رصيد الكوينز غير كافٍ! اشحن الآن للعب');
      onOpenTopup();
      return;
    }
    setCoins((c) => c - selectedChip);
    setDiceBets((prev) => ({ ...prev, [zone]: prev[zone] + selectedChip }));
    playTone(640, 70, 'triangle');
  };

  const handleClearDiceBets = () => {
    if (diceState !== 'BETTING' || totalDiceBet === 0) return;
    setCoins((c) => c + totalDiceBet);
    setDiceBets({ under7: 0, lucky7: 0, over7: 0 });
    showToast(`تم استرجاع ${totalDiceBet.toLocaleString('en-US')} كوينز`);
  };

  const startDiceRoll = () => {
    if (diceState !== 'BETTING') return;
    setDiceState('ROLLING');
    const snapshot = { ...diceBets };
    let rolls = 0;

    const interval = setInterval(() => {
      rolls++;
      const d1 = Math.floor(1 + Math.random() * 6);
      const d2 = Math.floor(1 + Math.random() * 6);
      setDiceValues([d1, d2]);
      playTone(480 + rolls * 25, 45, 'sine');

      if (rolls >= 10) {
        clearInterval(interval);
        const finalD1 = Math.floor(1 + Math.random() * 6);
        const finalD2 = Math.floor(1 + Math.random() * 6);
        const sum = finalD1 + finalD2;
        setDiceValues([finalD1, finalD2]);

        const winningZone: 'under7' | 'lucky7' | 'over7' =
          sum < 7 ? 'under7' : sum === 7 ? 'lucky7' : 'over7';
        const zoneMeta = DICE_ZONES.find((z) => z.id === winningZone)!;
        const won = (snapshot[winningZone] || 0) * zoneMeta.multiplier;
        setDiceWonCoins(won);

        if (won > 0) {
          setCoins((c) => c + won);
          playTone(900, 350, 'triangle');
          showToast(
            `🎲🎉 مجموع النرد (${sum}) — ربحت ${won.toLocaleString('en-US')} كوينز في نرد الكنز الملكي!`
          );
          if (onAnnounceWinInRoom && won >= 500) {
            onAnnounceWinInRoom(
              `🎲 ربح ${won.toLocaleString('en-US')} كوينز في نرد الكنز الملكي (المجموع ${sum} · ${zoneMeta.title} ×${zoneMeta.multiplier})!`
            );
          }
        }

        setDiceHistory((prev) => [sum, ...prev.slice(0, 8)]);
        setDiceState('RESULT');

        setTimeout(() => {
          setDiceBets({ under7: 0, lucky7: 0, over7: 0 });
          setDiceWonCoins(0);
          setDiceState('BETTING');
        }, 3200);
      }
    }, 100);
  };

  // Helper to render a single perimeter wheel tile
  const renderWheelTile = (slotIndex: number) => {
    const itemId = WHEEL_SLOTS[slotIndex];
    const item = getItemById(itemId);
    const isSelected = activeSlotIndex === slotIndex;
    const myBetOnItem = bets[itemId] || 0;

    return (
      <button
        key={slotIndex}
        type="button"
        onClick={() => handlePlaceBet(itemId)}
        className={`relative rounded-2xl p-1.5 flex flex-col items-center justify-center border transition-all duration-150 select-none min-h-[70px] ${
          isSelected
            ? 'bg-gradient-to-b from-[#FFD700] via-amber-400 to-orange-500 text-[#080F1A] border-white ring-4 ring-[#FFD700]/70 scale-105 z-10 shadow-[0_0_25px_rgba(255,215,0,0.85)]'
            : `bg-gradient-to-b ${item.accentClass} text-white hover:border-[#FFD700]/60`
        }`}
      >
        <span className="text-2xl leading-none drop-shadow">{item.emoji}</span>
        <span
          className={`text-[9px] font-extrabold mt-1 truncate max-w-full ${
            isSelected ? 'text-[#080F1A]' : 'text-white'
          }`}
        >
          {item.name.split(' ')[0]}
        </span>
        <span
          className={`text-[9px] font-mono font-black px-1.5 rounded-full mt-0.5 ${
            isSelected
              ? 'bg-[#080F1A] text-[#FFD700]'
              : 'bg-black/40 text-[#FFD700]'
          }`}
        >
          ×{item.multiplier}
        </span>

        {myBetOnItem > 0 && (
          <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-full bg-[#00D1FF] text-[#080F1A] text-[9px] font-mono font-black shadow-md border border-[#080F1A]">
            {myBetOnItem >= 1000
              ? `${(myBetOnItem / 1000).toFixed(1)}K`
              : myBetOnItem}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-gradient-to-b from-[#130B2E] via-[#0B1426] to-[#080F1A] text-white overflow-y-auto">
      {/* Top Game Header */}
      <div className="px-4 pt-3.5 pb-2.5 flex items-center justify-between border-b border-white/10 bg-[#080F1A]/90 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#FFD700] to-orange-500 flex items-center justify-center text-xl shadow-md">
            {activeGameTab === 'greedy_cat'
              ? '🐱'
              : activeGameTab === 'lion_vs_falcon'
              ? '🦁'
              : activeGameTab === 'car_race'
              ? '🏎️'
              : activeGameTab === 'treasure_dice'
              ? '🎲'
              : activeGameTab === 'grab_mic'
              ? '🎙️'
              : activeGameTab === 'guess_challenge'
              ? '🧠'
              : '🎡'}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-extrabold text-[#FFD700]">
                {gameModeCategory === 'free_games'
                  ? 'ألعاب المجلس المجانية (بدون كوينز)'
                  : 'صالة ألعاب الكوينز الملكية'}
              </h2>
              <span
                className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${
                  gameModeCategory === 'free_games'
                    ? 'bg-cyan-500/20 border-cyan-400/40 text-cyan-300'
                    : 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300'
                }`}
              >
                {gameModeCategory === 'free_games' ? 'مجانية 100%' : 'ألعاب الكوينز'}
              </span>
            </div>
            <p className="text-[10px] text-slate-300">
              {gameModeCategory === 'free_games'
                ? 'امسك المايك، لعبة التخمين والفوازير، وعجلة تحديات المجلس بدون كوينز'
                : 'العب بالكوينز في القط الجشع وصراع الأسد وسباق السيارات والنرد'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onOpenTopup}
            className="flex items-center gap-1 bg-[#121E33] border border-[#FFD700]/50 px-2.5 py-1.5 rounded-full text-xs font-extrabold text-[#FFD700] hover:bg-[#192944] transition"
          >
            <Coins size={13} />
            <AnimatedCoinCounter value={coins} className="font-mono text-xs text-[#FFD700]" />
            <Plus size={11} className="bg-[#FFD700] text-[#080F1A] rounded-full p-0.5" />
          </button>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white"
            title="الصوت"
          >
            {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
          </button>

          {onBack && (
            <button
              onClick={onBack}
              className="p-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white"
              title="رجوع"
            >
              <ChevronLeft size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Category Mode Switcher: Coin Games vs Free Games (بدون كوينزات) */}
      <div className="px-3.5 pt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setGameModeCategory('coin_games');
            setActiveGameTab('greedy_cat');
          }}
          className={`flex-1 py-2.5 px-3 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-1.5 border transition ${
            gameModeCategory === 'coin_games'
              ? 'bg-gradient-to-r from-[#F59E0B] to-[#FFD700] text-[#080F1A] border-white shadow-md'
              : 'bg-[#0E192D] text-slate-300 border-white/10 hover:border-[#FFD700]/40'
          }`}
        >
          <span>🪙</span>
          <span>ألعاب الكوينز (4)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setGameModeCategory('free_games');
            setActiveGameTab('grab_mic');
          }}
          className={`flex-1 py-2.5 px-3 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-1.5 border transition ${
            gameModeCategory === 'free_games'
              ? 'bg-gradient-to-r from-[#00D1FF] to-[#6C63FF] text-white border-white shadow-md'
              : 'bg-[#0E192D] text-slate-300 border-white/10 hover:border-[#00D1FF]/40'
          }`}
        >
          <span>🎙️</span>
          <span>ألعاب بدون كوينزات (مجانية)</span>
        </button>
      </div>

      {/* Games Selector Bar based on selected category */}
      {gameModeCategory === 'coin_games' ? (
        <div className="px-3.5 pt-2.5 pb-1 grid grid-cols-4 gap-1.5">
          {(
            [
              {
                id: 'greedy_cat',
                title: 'القط الجشع',
                sub: 'حتى ×100',
                emoji: '🐱',
              },
              {
                id: 'lion_vs_falcon',
                title: 'الأسد والصقر',
                sub: 'مواجهة ×9',
                emoji: '🦁',
              },
              {
                id: 'car_race',
                title: 'سباق السيارات',
                sub: 'توربو ×40',
                emoji: '🏎️',
              },
              {
                id: 'treasure_dice',
                title: 'نرد الكنز',
                sub: 'سبعة ×6',
                emoji: '🎲',
              },
            ] as { id: ArcadeGameTabId; title: string; sub: string; emoji: string }[]
          ).map((tab) => {
            const isCurrent = activeGameTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveGameTab(tab.id)}
                className={`p-2 rounded-2xl border text-center flex flex-col items-center transition ${
                  isCurrent
                    ? 'bg-gradient-to-b from-[#FFD700] to-amber-500 text-[#080F1A] border-white shadow-[0_0_15px_rgba(255,215,0,0.45)] scale-[1.02]'
                    : 'bg-[#0E192D] text-slate-200 border-white/10 hover:border-[#FFD700]/40'
                }`}
              >
                <span className="text-xl leading-none">{tab.emoji}</span>
                <span className="text-[10px] font-extrabold mt-1 truncate w-full">
                  {tab.title}
                </span>
                <span
                  className={`text-[8px] font-mono font-bold mt-0.5 px-1.5 rounded-full ${
                    isCurrent
                      ? 'bg-[#080F1A] text-[#FFD700]'
                      : 'bg-white/10 text-[#00D1FF]'
                  }`}
                >
                  {tab.sub}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="px-3.5 pt-2.5 pb-1 grid grid-cols-3 gap-2">
          {(
            [
              {
                id: 'grab_mic',
                title: 'امسك المايك',
                sub: 'مجاناً 🎙️',
                emoji: '🎙️',
              },
              {
                id: 'guess_challenge',
                title: 'لعبة التخمين',
                sub: 'مجاناً 🧠',
                emoji: '🧠',
              },
              {
                id: 'truth_or_dare',
                title: 'صراحة أو جرأة',
                sub: 'مجاناً 🔥',
                emoji: '🍾',
              },
              {
                id: 'xo_majlis',
                title: 'إكس أو المجلس',
                sub: 'مجاناً ❌⭕',
                emoji: '⭕',
              },
              {
                id: 'spy_impostor',
                title: 'من الجاسوس؟',
                sub: 'مجاناً 🕵️',
                emoji: '🕵️',
              },
              {
                id: 'spin_wheel_party',
                title: 'عجلة الأحكام',
                sub: 'مجاناً 🎡',
                emoji: '🎡',
              },
            ] as { id: ArcadeGameTabId; title: string; sub: string; emoji: string }[]
          ).map((tab) => {
            const isCurrent = activeGameTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveGameTab(tab.id)}
                className={`p-2.5 rounded-2xl border text-center flex flex-col items-center transition ${
                  isCurrent
                    ? 'bg-gradient-to-b from-[#00D1FF] to-[#6C63FF] text-white border-white shadow-[0_0_15px_rgba(0,209,255,0.45)] scale-[1.02]'
                    : 'bg-[#0E192D] text-slate-200 border-white/10 hover:border-[#00D1FF]/40'
                }`}
              >
                <span className="text-2xl leading-none">{tab.emoji}</span>
                <span className="text-xs font-extrabold mt-1 truncate w-full">
                  {tab.title}
                </span>
                <span
                  className={`text-[9px] font-bold mt-0.5 px-2 py-0.2 rounded-full ${
                    isCurrent
                      ? 'bg-black/30 text-[#FFD700]'
                      : 'bg-emerald-500/20 text-emerald-300'
                  }`}
                >
                  {tab.sub}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <div className="p-3.5 space-y-3.5">
        {/* ====================================================================
            TAB 1: GREEDY CAT WHEEL (لعبة القط الجشع - تصميم توب توب TopTop الأصلي)
           ==================================================================== */}
        {activeGameTab === 'greedy_cat' && (
          <div className="space-y-3">
            {/* TopTop Header: Rooms Bet Bar & Mode Toggle */}
            <div className="bg-[#123164]/90 border border-[#00D1FF]/40 rounded-2xl p-2.5 shadow-lg space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#00D1FF] font-extrabold text-[11px] flex items-center gap-1">
                  <span>👥</span>
                  <span>قائمة وضع الرهان في الغرفة</span>
                </span>
                <span className="text-[10px] text-slate-300 font-mono">
                  جولة <strong className="text-[#FFD700] text-xs">#{roundNumber}</strong>
                </span>
              </div>

              {/* Mode Switcher: عادي vs متقدم */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#08152B] border border-white/10 text-xs">
                  <button
                    type="button"
                    onClick={() => setGameDifficulty('normal')}
                    className={`px-3 py-1 rounded-xl font-bold transition ${
                      gameDifficulty === 'normal'
                        ? 'bg-gradient-to-r from-[#6C63FF] to-[#00D1FF] text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    عادي
                  </button>
                  <button
                    type="button"
                    onClick={() => setGameDifficulty('advanced')}
                    className={`px-3 py-1 rounded-xl font-bold transition ${
                      gameDifficulty === 'advanced'
                        ? 'bg-gradient-to-r from-[#FFD700] to-amber-500 text-[#080F1A] shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    متقدم
                  </button>
                </div>

                {/* JACKPOT Crown Tag */}
                <div className="flex items-center gap-1.5 bg-gradient-to-r from-red-950 via-amber-900 to-red-950 border border-[#FFD700]/70 rounded-xl px-2.5 py-1 shadow-md">
                  <span className="text-sm">👑</span>
                  <div className="text-right">
                    <div className="text-[8px] font-black text-[#FFD700] uppercase tracking-wider leading-none">
                      JACKPOT
                    </div>
                    <div className="text-[10px] font-mono font-black text-white leading-tight">
                      73,059,733
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* TopTop Style Vertical Ferris Wheel Arena (عجلة دولاب المزرعة الخشبية) */}
            <div className="relative rounded-3xl bg-gradient-to-b from-[#1C4D94] via-[#2F73C2] to-[#609DE6] border-2 border-[#FFD700]/70 p-4 shadow-[0_10px_35px_rgba(0,100,220,0.35)] overflow-hidden">
              {/* Background Farm Atmosphere Layer */}
              <div className="absolute inset-0 opacity-25 pointer-events-none">
                <img
                  src="/src/assets/images/greedy_cat_farm_1791811755640.jpg"
                  alt="مزرعة القط"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Live Round Result Announcement Pill (كم ربحت وكم خسرت) */}
              {lastRoundResult && (
                <div
                  className={`relative z-20 mb-2 px-3 py-1.5 rounded-2xl border text-center shadow-lg flex items-center justify-between gap-2 transition-all animate-in fade-in zoom-in-95 duration-200 ${
                    lastRoundResult.totalBet > 0
                      ? (lastRoundResult.wonCoins - lastRoundResult.totalBet > 0
                        ? 'bg-emerald-950/90 border-emerald-400 text-emerald-100 shadow-emerald-900/40'
                        : lastRoundResult.wonCoins - lastRoundResult.totalBet < 0
                        ? 'bg-rose-950/90 border-rose-400 text-rose-100 shadow-rose-900/40'
                        : 'bg-amber-950/90 border-amber-400 text-amber-100')
                      : 'bg-[#0E1E38]/90 border-white/20 text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    <span className="text-base">{lastRoundResult.item.emoji}</span>
                    <span>
                      جولة #{lastRoundResult.roundNumber}: فاز {lastRoundResult.item.name} (×{lastRoundResult.item.multiplier})
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-mono font-black">
                    {lastRoundResult.totalBet > 0 ? (
                      lastRoundResult.wonCoins - lastRoundResult.totalBet > 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-black font-extrabold flex items-center gap-1 shadow">
                          <TrendingUp size={12} />
                          <span>ربحت: +{(lastRoundResult.wonCoins - lastRoundResult.totalBet).toLocaleString('en-US')}</span>
                        </span>
                      ) : lastRoundResult.wonCoins - lastRoundResult.totalBet < 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white font-extrabold flex items-center gap-1 shadow">
                          <TrendingDown size={12} />
                          <span>خسرت: -{Math.abs(lastRoundResult.wonCoins - lastRoundResult.totalBet).toLocaleString('en-US')}</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500 text-black font-extrabold">
                          تعادل: {lastRoundResult.wonCoins.toLocaleString('en-US')}
                        </span>
                      )
                    ) : (
                      <span className="text-[10px] text-slate-300">لم تراهن</span>
                    )}
                  </div>
                </div>
              )}

              {/* Wooden Ferris Wheel Support Legs */}
              <div className="absolute inset-x-0 bottom-4 flex justify-center pointer-events-none z-0">
                <div className="w-36 h-48 border-x-[12px] border-b-[12px] border-amber-950/70 rounded-t-full opacity-70" />
              </div>

              {/* TopTop Spoke Wheel Structure connecting center hub to 8 cabins */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                <div className="w-64 h-64 rounded-full border-4 border-amber-900/40 opacity-70" />
                <div className="absolute w-64 h-0.5 bg-amber-900/40" />
                <div className="absolute w-0.5 h-64 bg-amber-900/40" />
                <div className="absolute w-64 h-0.5 bg-amber-900/40 rotate-45" />
                <div className="absolute w-64 h-0.5 bg-amber-900/40 -rotate-45" />
              </div>

              {/* 8 Circular Ferris Wheel Cabins placed around Ferris Wheel */}
              <div className="relative w-full max-w-[340px] mx-auto aspect-square my-2 flex items-center justify-center">
                {/* Center Mascot Hub (قط بنظارة قلب مع المؤقت الذهبي 1s) */}
                <div className="relative z-10 w-28 h-28 rounded-full bg-gradient-to-b from-[#FFF2CC] via-[#FFE599] to-[#E6B800] border-4 border-amber-800 shadow-[0_0_30px_rgba(255,215,0,0.8)] flex flex-col items-center justify-center p-1">
                  <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-purple-400 bg-white shadow-md">
                    <img
                      src="/src/assets/images/toptop_cat_avatar_1791811987066.jpg"
                      alt="قط توب توب بنظارة"
                      referrerPolicy="no-referrer"
                      className={`w-full h-full object-cover ${
                        gameState === 'SPINNING' ? 'animate-spin' : ''
                      }`}
                    />
                  </div>

                  {/* Countdown Orange Box: e.g. "1s" / "النتيجة قادمة" */}
                  <div className="mt-1 px-2.5 py-0.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md border border-amber-300 text-center">
                    <div className="text-[11px] font-mono font-black leading-none">
                      {gameState === 'BETTING'
                        ? `${countdown}s`
                        : gameState === 'SPINNING'
                        ? 'دوران...'
                        : lastRoundResult && lastRoundResult.totalBet > 0
                        ? (lastRoundResult.wonCoins - lastRoundResult.totalBet > 0
                          ? `+${(lastRoundResult.wonCoins - lastRoundResult.totalBet).toLocaleString('en-US')}`
                          : lastRoundResult.wonCoins - lastRoundResult.totalBet < 0
                          ? `-${Math.abs(lastRoundResult.wonCoins - lastRoundResult.totalBet).toLocaleString('en-US')}`
                          : 'تعادل')
                        : 'فوز!'}
                    </div>
                  </div>
                  <span className="text-[8px] font-bold text-amber-950 mt-0.5 leading-none">
                    {gameState === 'BETTING'
                      ? 'اختر الرهان'
                      : gameState === 'SPINNING'
                      ? 'النتيجة قادمة'
                      : lastRoundResult && lastRoundResult.totalBet > 0
                      ? (lastRoundResult.wonCoins - lastRoundResult.totalBet > 0
                        ? 'ربحت 💰'
                        : lastRoundResult.wonCoins - lastRoundResult.totalBet < 0
                        ? 'خسرت 💔'
                        : 'استرجاع')
                      : 'مبروك الفائز'}
                  </span>
                </div>

                {/* 8 Ferris Wheel Cabins arranged in clock angles */}
                {WHEEL_SLOTS.map((itemId, idx) => {
                  const item = getItemById(itemId);
                  const isSelected = activeSlotIndex === idx;
                  const myBet = bets[itemId] || 0;

                  // 8 angle positions (0 = top, 45, 90, 135, 180, 225, 270, 315)
                  const angleDeg = idx * 45 - 90;
                  const rad = (angleDeg * Math.PI) / 180;
                  const radiusPercent = 40; // distance from center
                  const left = 50 + radiusPercent * Math.cos(rad);
                  const top = 50 + radiusPercent * Math.sin(rad);

                  return (
                    <div
                      key={itemId}
                      style={{
                        position: 'absolute',
                        left: `${left}%`,
                        top: `${top}%`,
                        transform: 'translate(-50%, -50%)',
                      }}
                      className="z-20"
                    >
                      <button
                        type="button"
                        onClick={() => handlePlaceBet(itemId)}
                        disabled={gameState !== 'BETTING'}
                        className={`relative w-16 h-16 sm:w-18 sm:h-18 rounded-full border-2 transition-all flex flex-col items-center justify-center select-none shadow-lg ${
                          isSelected
                            ? 'bg-gradient-to-b from-[#FFF2CC] via-[#FFD700] to-amber-500 border-white ring-4 ring-[#FFD700] scale-110 shadow-[0_0_25px_rgba(255,215,0,0.95)] z-30'
                            : myBet > 0
                            ? 'bg-gradient-to-b from-[#FFFDF0] to-[#FFE8A3] border-[#FFD700] ring-2 ring-[#00D1FF] scale-105'
                            : 'bg-gradient-to-b from-[#FFFDF0] to-[#FCEECB] border-amber-800/60 hover:scale-105'
                        } disabled:opacity-85`}
                      >
                        {/* HOT Ribbon on goat/lamb */}
                        {item.isHot && (
                          <span className="absolute -top-2 -right-1 px-1.5 py-0.2 rounded bg-gradient-to-r from-red-600 to-orange-500 text-white text-[8px] font-black shadow leading-tight">
                            HOT 🔥
                          </span>
                        )}

                        {/* Food / Meat Emoji */}
                        <span className="text-2xl leading-none drop-shadow-sm -mt-0.5">
                          {item.emoji}
                        </span>

                        {/* Multiplier label: "5 اضعاف" */}
                        <span className="text-[8px] font-extrabold text-amber-950 leading-tight">
                          {item.multiplier} اضعاف
                        </span>

                        {/* Total Room Pool: "1.916M" with cat badge */}
                        <div className="px-1.5 py-0.2 rounded-full bg-[#E5F4FF] border border-[#00D1FF]/40 text-[7px] font-mono font-bold text-[#006699] flex items-center gap-0.5 mt-0.5">
                          <span>{item.displayTotalM || '1.25M'}</span>
                          <span className="text-[7px]">🐱</span>
                        </div>

                        {/* Player's Bet Badge on this slot */}
                        {myBet > 0 && (
                          <span className="absolute -bottom-1 -left-1 px-1.5 py-0.5 rounded-full bg-[#6C63FF] text-white text-[8px] font-mono font-black shadow-md border border-white">
                            {myBet >= 1000 ? `${(myBet / 1000).toFixed(0)}K` : myBet}
                          </span>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Bottom 2 Feasts: السلطة (يمين) والبيتزا (يسار) */}
              <div className="flex items-center justify-between px-2 pt-2 border-t border-white/20 relative z-10">
                {/* السلطة (يربح كل الخضار) */}
                <button
                  type="button"
                  onClick={handleBetAllVeggies}
                  disabled={gameState !== 'BETTING'}
                  className={`p-2 rounded-2xl border-2 flex items-center gap-2 transition shadow-md ${
                    bets['salad_feast'] || 0 > 0
                      ? 'bg-gradient-to-r from-lime-500/40 to-emerald-700/60 border-lime-300'
                      : 'bg-[#FFFDF0] border-amber-700/60 hover:border-lime-400'
                  }`}
                >
                  <span className="text-2xl">🥗</span>
                  <div className="text-right">
                    <div className="text-[11px] font-extrabold text-amber-950">
                      السلطة
                    </div>
                    <span className="text-[8px] text-emerald-700 font-bold">
                      كل الخضار (×5)
                    </span>
                  </div>
                </button>

                {/* Spin Action Button if Manual */}
                <button
                  type="button"
                  onClick={startWheelSpin}
                  disabled={gameState !== 'BETTING'}
                  className="px-4 py-2 rounded-2xl bg-gradient-to-r from-[#F59E0B] to-[#FFD700] text-[#080F1A] text-xs font-black shadow-lg hover:brightness-110 transition disabled:opacity-50 flex items-center gap-1"
                >
                  <Flame size={13} />
                  <span>دوران الآن</span>
                </button>

                {/* البيتزا (يربح كل اللحوم) */}
                <button
                  type="button"
                  onClick={handleBetAllMeats}
                  disabled={gameState !== 'BETTING'}
                  className={`p-2 rounded-2xl border-2 flex items-center gap-2 transition shadow-md ${
                    bets['pizza_feast'] || 0 > 0
                      ? 'bg-gradient-to-r from-rose-500/40 to-red-700/60 border-rose-300'
                      : 'bg-[#FFFDF0] border-amber-700/60 hover:border-rose-400'
                  }`}
                >
                  <span className="text-2xl">🍕</span>
                  <div className="text-right">
                    <div className="text-[11px] font-extrabold text-amber-950">
                      البيتزا
                    </div>
                    <span className="text-[8px] text-rose-700 font-bold">
                      كل اللحوم (×10-45)
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Auto Bet Follow Switch (وضع الرهان التلقائي متابعة الجولة السابقة) */}
            <div className="bg-[#122238] border border-white/10 rounded-2xl p-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAutoRepeatBet(!autoRepeatBet)}
                  className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                    autoRepeatBet ? 'bg-emerald-500' : 'bg-slate-600'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      autoRepeatBet ? 'translate-x-0' : '-translate-x-5'
                    }`}
                  />
                </button>
                <span className="text-xs font-extrabold text-slate-200">
                  وضع الرهان التلقائي (متابعة الجولة السابقة)
                </span>
              </div>
              <span className="text-[10px] text-[#FFD700] font-mono">
                رهاني: <strong>{totalCurrentBet.toLocaleString('en-US')}</strong>
              </span>
            </div>

            {/* TopTop Style Blue Cat Chips (من 500 إلى 300,000 كوينز) */}
            <div className="bg-[#0B1528] border-2 border-[#00D1FF]/40 rounded-3xl p-3 shadow-xl space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#00D1FF] font-extrabold flex items-center gap-1">
                  <span>🐱</span>
                  <span>عملات رهان القط الجشع (500 إلى 300,000):</span>
                </span>
                <button
                  type="button"
                  onClick={handleClearBets}
                  disabled={gameState !== 'BETTING' || totalCurrentBet === 0}
                  className="px-2 py-0.5 rounded-lg bg-rose-500/20 border border-rose-500/40 text-[9px] font-bold text-rose-300 disabled:opacity-40"
                >
                  إلغاء الرهان
                </button>
              </div>

              {/* Chips matching requested denominations (500, 1K, 3K, 5K, 10K, 30K, 60K, 100K, 300K) */}
              <div className="flex items-stretch gap-1.5 overflow-x-auto pb-1.5 pt-0.5 scrollbar-thin scrollbar-thumb-cyan-500/30">
                {CHIP_VALUES.map((val) => {
                  const active = selectedChip === val;
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => {
                        setSelectedChip(val);
                        playTone(550, 60, 'sine');
                      }}
                      className={`relative min-w-[56px] flex-1 py-1.5 px-1 rounded-2xl border-2 transition-all flex flex-col items-center justify-center shrink-0 select-none ${
                        active
                          ? 'bg-gradient-to-b from-[#00D1FF] to-[#0077B6] border-white ring-4 ring-[#00D1FF]/60 scale-105 shadow-[0_0_15px_rgba(0,209,255,0.7)] text-white'
                          : 'bg-[#122A4A] border-[#00D1FF]/40 text-cyan-200 hover:border-[#00D1FF]'
                      }`}
                    >
                      {/* TopTop Blue Cat Face Symbol */}
                      <div className="w-7 h-7 rounded-full bg-[#00D1FF]/30 border border-[#00D1FF] flex items-center justify-center text-xs shadow-inner">
                        🐱
                      </div>
                      <span className="text-[10px] font-mono font-black mt-1 leading-tight">
                        {val >= 1000 ? `${val / 1000}K` : val}
                      </span>
                      <span className="text-[7px] opacity-80 leading-none">
                        كوينز
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Status Info Strip matching TopTop: العملات المتبقية | سجلي | فائز اليوم */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-[#122238] border border-white/10 rounded-2xl p-2">
                <span className="text-[9px] text-slate-400 block">العملات المتبقية</span>
                <span className="text-xs font-mono font-black text-[#FFD700] flex items-center justify-center gap-1 mt-0.5">
                  <AnimatedCoinCounter value={coins} />
                  <span>🐱</span>
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowHistoryModal(true);
                }}
                className="bg-[#122238] border border-[#00D1FF]/40 rounded-2xl p-2 hover:border-[#FFD700] hover:bg-[#162d4b] transition shadow-md group"
              >
                <span className="text-[9px] text-[#00D1FF] group-hover:text-[#FFD700] font-bold block">
                  سجلي
                </span>
                <span className="text-xs font-bold text-white block mt-0.5 flex items-center justify-center gap-1">
                  <span>آخر النتائج</span>
                  <span>📋</span>
                </span>
              </button>

              <div className="bg-[#122238] border border-white/10 rounded-2xl p-2">
                <span className="text-[9px] text-slate-400 block">فائز اليوم</span>
                <span className="text-xs font-mono font-black text-amber-300 flex items-center justify-center gap-1 mt-0.5">
                  <span>1,092,500</span>
                  <span>⭐</span>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ====================================================================
            TAB 2: LION VS FALCON ARENA (لعبة صراع الأسد والصقر الملكي)
           ==================================================================== */}
        {activeGameTab === 'lion_vs_falcon' && (
          <div className="space-y-3.5">
            {/* History Bar */}
            <div className="bg-[#0E192D]/90 border border-white/10 rounded-2xl px-3 py-2 flex items-center justify-between gap-2">
              <span className="text-[10px] font-extrabold text-slate-300 shrink-0">
                سجل المواجهات:
              </span>
              <div className="flex items-center gap-1.5 overflow-x-auto">
                {battleHistory.map((w, idx) => (
                  <span
                    key={idx}
                    className={`px-2 py-0.5 rounded-xl border text-xs ${
                      idx === 0
                        ? 'bg-[#FFD700]/25 border-[#FFD700]'
                        : 'bg-[#080F1A] border-white/10'
                    }`}
                  >
                    {w === 'lion' ? '🦁' : w === 'tie' ? '👑' : '🦅'}
                  </span>
                ))}
              </div>
            </div>

            {/* Battle Arena Stage */}
            <div className="bg-gradient-to-b from-[#1E1136] via-[#0E192D] to-[#080F1A] border-2 border-[#FFD700]/50 rounded-3xl p-4 space-y-4 text-center shadow-xl">
              <div className="flex items-center justify-between px-2">
                {/* Lion Fighter Card */}
                <div
                  className={`flex-1 p-3 rounded-2xl border transition ${
                    battleWinner === 'lion'
                      ? 'bg-[#FFD700]/30 border-[#FFD700] scale-105 shadow-[0_0_25px_rgba(255,215,0,0.6)]'
                      : 'bg-[#080F1A]/80 border-amber-500/40'
                  }`}
                >
                  <span className="text-4xl block">🦁</span>
                  <div className="text-xs font-extrabold text-[#FFD700] mt-1">
                    الأسد الذهبي
                  </div>
                  <div className="mt-1.5 inline-block px-3 py-1 rounded-xl bg-black/60 border border-[#FFD700]/40 text-sm font-mono font-black text-white">
                    قوة: {lionScore}
                  </div>
                </div>

                {/* VS Center Badge */}
                <div className="px-3 flex flex-col items-center">
                  <span className="text-lg font-black text-[#FFD700] animate-pulse">
                    VS
                  </span>
                  <span className="text-[9px] text-slate-400 mt-1">
                    رهاني: {totalBattleBet}
                  </span>
                </div>

                {/* Falcon Fighter Card */}
                <div
                  className={`flex-1 p-3 rounded-2xl border transition ${
                    battleWinner === 'falcon'
                      ? 'bg-cyan-500/30 border-[#00D1FF] scale-105 shadow-[0_0_25px_rgba(0,209,255,0.6)]'
                      : 'bg-[#080F1A]/80 border-cyan-500/40'
                  }`}
                >
                  <span className="text-4xl block">🦅</span>
                  <div className="text-xs font-extrabold text-[#00D1FF] mt-1">
                    الصقر الحر
                  </div>
                  <div className="mt-1.5 inline-block px-3 py-1 rounded-xl bg-black/60 border border-[#00D1FF]/40 text-sm font-mono font-black text-white">
                    قوة: {falconScore}
                  </div>
                </div>
              </div>

              {/* 3 Betting Zones: Lion (x2) | Royal Tie (x9) | Falcon (x2) */}
              <div className="grid grid-cols-3 gap-2.5">
                {BATTLE_OPTIONS.map((opt) => {
                  const myBet = battleBets[opt.id];
                  const isWin = battleWinner === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={battleState !== 'BETTING'}
                      onClick={() => handlePlaceBattleBet(opt.id)}
                      className={`relative p-3 rounded-2xl bg-gradient-to-b ${opt.accent} border flex flex-col items-center transition ${
                        isWin ? 'ring-4 ring-[#FFD700] scale-105' : 'hover:brightness-110'
                      }`}
                    >
                      <span className="text-3xl">{opt.emoji}</span>
                      <span className="text-xs font-extrabold text-white mt-1">
                        {opt.title}
                      </span>
                      <span className="text-[10px] text-slate-300">
                        {opt.subtitle}
                      </span>
                      <span className="mt-1 px-2 py-0.5 rounded-full bg-black/50 text-[#FFD700] text-xs font-mono font-black">
                        ×{opt.multiplier}
                      </span>
                      {myBet > 0 && (
                        <span className="mt-1.5 px-2 py-0.5 rounded-full bg-[#00D1FF] text-[#080F1A] text-[10px] font-mono font-black">
                          رهان: {myBet}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Start Fight & Clear Buttons */}
              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  disabled={battleState !== 'BETTING'}
                  onClick={startBattleRound}
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-[#F59E0B] via-[#FFD700] to-amber-500 text-[#080F1A] font-black text-xs shadow-lg hover:brightness-110 transition disabled:opacity-50"
                >
                  {battleState === 'FIGHTING'
                    ? '⚔️ جاري حسم المعركة...'
                    : battleState === 'RESULT'
                    ? battleWonCoins > 0
                      ? `🎉 مبروك! ربحت +${battleWonCoins.toLocaleString('en-US')} كوينز`
                      : 'انتهت الجولة — جولة جديدة خلال لحظات'
                    : '⚔️ ابدأ مواجهة الأسد والصقر الآن!'}
                </button>
                {totalBattleBet > 0 && battleState === 'BETTING' && (
                  <button
                    type="button"
                    onClick={handleClearBattleBets}
                    className="px-3 py-3 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold"
                  >
                    إلغاء
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ====================================================================
            TAB 3: ROYAL CAR RACE (سباق السيارات الملكية ×40)
           ==================================================================== */}
        {activeGameTab === 'car_race' && (
          <div className="space-y-3.5">
            {/* History */}
            <div className="bg-[#0E192D]/90 border border-white/10 rounded-2xl px-3 py-2 flex items-center justify-between gap-2">
              <span className="text-[10px] font-extrabold text-slate-300 shrink-0">
                أبطال السباق:
              </span>
              <div className="flex items-center gap-1.5 overflow-x-auto">
                {carHistory.map((car, idx) => (
                  <span
                    key={idx}
                    className={`px-2 py-0.5 rounded-xl border text-xs flex items-center gap-1 shrink-0 ${
                      idx === 0
                        ? 'bg-[#FFD700]/25 border-[#FFD700] text-[#FFD700] font-bold'
                        : 'bg-[#080F1A] border-white/10 text-slate-300'
                    }`}
                  >
                    <span>{car.emoji}</span>
                    <span className="text-[9px] font-mono">×{car.multiplier}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* 6 Luxury Cars Grid */}
            <div className="bg-[#0B1528] border-2 border-[#00D1FF]/40 rounded-3xl p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-[#FFD700]">
                  🏎️ اختر سيارتك الفائزة (مضاعفات حتى ×40)
                </span>
                <span className="text-[10px] font-mono text-[#00D1FF]">
                  إجمالي رهاني: {totalCarBet}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {CAR_RACE_ITEMS.map((car, idx) => {
                  const isHighlighted = activeCarIndex === idx && carRaceState !== 'BETTING';
                  const isWinner = winningCar?.id === car.id;
                  const myBet = carBets[car.id] || 0;

                  return (
                    <button
                      key={car.id}
                      type="button"
                      disabled={carRaceState !== 'BETTING'}
                      onClick={() => handlePlaceCarBet(car.id)}
                      className={`relative p-3 rounded-2xl bg-gradient-to-b ${car.accent} border text-right flex items-center justify-between transition ${
                        isWinner || isHighlighted
                          ? 'ring-4 ring-[#FFD700] scale-[1.03] shadow-[0_0_25px_rgba(255,215,0,0.65)]'
                          : 'hover:brightness-110'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-3xl shrink-0">{car.emoji}</span>
                        <div className="min-w-0">
                          <div className="text-xs font-extrabold text-white truncate">
                            {car.name}
                          </div>
                          <div className="text-[11px] font-mono font-black text-[#FFD700] mt-0.5">
                            الربح ×{car.multiplier}
                          </div>
                        </div>
                      </div>

                      {myBet > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-[#00D1FF] text-[#080F1A] text-[10px] font-mono font-black shrink-0">
                          {myBet}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  disabled={carRaceState !== 'BETTING'}
                  onClick={startCarRace}
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-[#00D1FF] via-[#6C63FF] to-[#FFD700] text-[#080F1A] font-black text-xs shadow-lg hover:brightness-110 transition disabled:opacity-50"
                >
                  {carRaceState === 'RACING'
                    ? '🏎️ السيارات تنطلق بأقصى سرعة...'
                    : carRaceState === 'RESULT' && winningCar
                    ? carWonCoins > 0
                      ? `🏆 فازت ${winningCar.name} — ربحت +${carWonCoins.toLocaleString('en-US')} كوينز!`
                      : `🏁 فازت ${winningCar.name} (×${winningCar.multiplier})`
                    : '🚦 انطلاق سباق السيارات الملكية الآن!'}
                </button>
                {totalCarBet > 0 && carRaceState === 'BETTING' && (
                  <button
                    type="button"
                    onClick={handleClearCarBets}
                    className="px-3 py-3 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold"
                  >
                    إلغاء
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ====================================================================
            TAB 4: ROYAL TREASURE DICE 777 (نرد الكنز الملكي)
           ==================================================================== */}
        {activeGameTab === 'treasure_dice' && (
          <div className="space-y-3.5">
            {/* History */}
            <div className="bg-[#0E192D]/90 border border-white/10 rounded-2xl px-3 py-2 flex items-center justify-between gap-2">
              <span className="text-[10px] font-extrabold text-slate-300 shrink-0">
                آخر نتائج النرد:
              </span>
              <div className="flex items-center gap-1.5 overflow-x-auto">
                {diceHistory.map((sumVal, idx) => (
                  <span
                    key={idx}
                    className={`px-2.5 py-0.5 rounded-xl border text-xs font-mono font-bold ${
                      sumVal === 7
                        ? 'bg-[#FFD700]/25 border-[#FFD700] text-[#FFD700]'
                        : 'bg-[#080F1A] border-white/10 text-slate-200'
                    }`}
                  >
                    {sumVal}
                  </span>
                ))}
              </div>
            </div>

            {/* Dice Table Stage */}
            <div className="bg-[#0B1528] border-2 border-purple-500/40 rounded-3xl p-4 text-center space-y-4">
              <div className="flex items-center justify-center gap-6 py-2">
                <div
                  className={`w-20 h-20 rounded-2xl bg-gradient-to-b from-[#1D2D50] to-[#080F1A] border-2 border-[#FFD700] flex items-center justify-center text-5xl shadow-lg ${
                    diceState === 'ROLLING' ? 'animate-spin' : ''
                  }`}
                >
                  {DICE_FACES[diceValues[0] - 1]}
                </div>
                <div className="text-center">
                  <div className="text-[10px] text-slate-400">المجموع</div>
                  <div className="text-2xl font-mono font-black text-[#FFD700]">
                    {diceValues[0] + diceValues[1]}
                  </div>
                </div>
                <div
                  className={`w-20 h-20 rounded-2xl bg-gradient-to-b from-[#1D2D50] to-[#080F1A] border-2 border-[#FFD700] flex items-center justify-center text-5xl shadow-lg ${
                    diceState === 'ROLLING' ? 'animate-spin' : ''
                  }`}
                >
                  {DICE_FACES[diceValues[1] - 1]}
                </div>
              </div>

              {/* 3 Dice Betting Zones */}
              <div className="grid grid-cols-3 gap-2.5">
                {DICE_ZONES.map((zone) => {
                  const myBet = diceBets[zone.id];
                  return (
                    <button
                      key={zone.id}
                      type="button"
                      disabled={diceState !== 'BETTING'}
                      onClick={() => handlePlaceDiceBet(zone.id)}
                      className={`p-3 rounded-2xl bg-gradient-to-b ${zone.accent} border flex flex-col items-center transition hover:brightness-110`}
                    >
                      <span className="text-2xl">{zone.emoji}</span>
                      <span className="text-xs font-extrabold text-white mt-1">
                        {zone.title}
                      </span>
                      <span className="text-[9px] text-slate-300 mt-0.5">
                        {zone.rangeLabel}
                      </span>
                      <span className="mt-1.5 px-2.5 py-0.5 rounded-full bg-black/50 text-[#FFD700] text-xs font-mono font-black">
                        ×{zone.multiplier}
                      </span>
                      {myBet > 0 && (
                        <span className="mt-1.5 px-2 py-0.5 rounded-full bg-[#00D1FF] text-[#080F1A] text-[10px] font-mono font-black">
                          رهان: {myBet}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  disabled={diceState !== 'BETTING'}
                  onClick={startDiceRoll}
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-[#F59E0B] to-[#FFD700] text-[#080F1A] font-black text-xs shadow-lg hover:brightness-110 transition disabled:opacity-50"
                >
                  {diceState === 'ROLLING'
                    ? '🎲 جاري رمي النرد الملكي...'
                    : diceState === 'RESULT'
                    ? diceWonCoins > 0
                      ? `🎉 مبروك! ربحت +${diceWonCoins.toLocaleString('en-US')} كوينز`
                      : `المجموع (${diceValues[0] + diceValues[1]}) — جولة جديدة الآن`
                    : '🎲 ارمِ النرد الملكي الآن!'}
                </button>
                {totalDiceBet > 0 && diceState === 'BETTING' && (
                  <button
                    type="button"
                    onClick={handleClearDiceBets}
                    className="px-3 py-3 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold"
                  >
                    إلغاء
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ====================================================================
            TAB 5: GRAB THE MIC (لعبة امسك المايك - مجانية بدون كوينزات)
           ==================================================================== */}
        {activeGameTab === 'grab_mic' && (
          <div className="space-y-3.5">
            {(() => {
              const currentRound =
                GRAB_MIC_CHALLENGES[grabMicIndex % GRAB_MIC_CHALLENGES.length];
              return (
                <div className="bg-gradient-to-b from-[#11243E] via-[#0B1528] to-[#080F1A] border-2 border-[#00D1FF]/50 rounded-3xl p-4 space-y-4 text-center shadow-xl">
                  <div className="flex items-center justify-between text-xs">
                    <span className="px-2.5 py-1 rounded-full bg-[#00D1FF]/20 border border-[#00D1FF]/40 text-[#00D1FF] font-extrabold">
                      🎙️ {currentRound.category}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-[#FFD700]/20 border border-[#FFD700]/40 text-[#FFD700] font-extrabold">
                      نقاطي في المايك: {grabMicScore} ⭐
                    </span>
                  </div>

                  {/* Center Golden Microphone Stage */}
                  <div className="py-3 flex flex-col items-center">
                    <button
                      type="button"
                      onClick={() => {
                        if (grabMicPhase === 'READY') {
                          playTone(740, 120, 'triangle');
                          setGrabMicPhase('MIC_GRABBED');
                          setMicHolderName('الأمير (أنت التقطت المايك أولاً! ⚡)');
                        }
                      }}
                      className={`w-24 h-24 rounded-full flex flex-col items-center justify-center text-4xl border-4 transition shadow-2xl ${
                        grabMicPhase === 'READY'
                          ? 'bg-gradient-to-b from-[#FFD700] to-amber-600 border-white text-[#080F1A] animate-pulse hover:scale-105 cursor-pointer'
                          : 'bg-gradient-to-b from-[#00D1FF] to-[#6C63FF] border-[#FFD700] text-white'
                      }`}
                    >
                      <span>🎙️</span>
                      <span className="text-[10px] font-black mt-1">
                        {grabMicPhase === 'READY' ? 'امسك المايك!' : 'معك المايك'}
                      </span>
                    </button>

                    {micHolderName && (
                      <div className="mt-2 text-xs font-extrabold text-emerald-300">
                        {micHolderName}
                      </div>
                    )}
                  </div>

                  {/* Lyric / Phrase Challenge Box */}
                  <div className="bg-[#080F1A]/90 border border-white/15 rounded-2xl p-3.5 space-y-2">
                    <div className="text-[11px] text-slate-400">
                      التحدي الصوتي رقم #{grabMicIndex + 1} (بدون كوينزات):
                    </div>
                    <p className="text-sm font-extrabold text-white leading-relaxed">
                      {currentRound.prompt}
                    </p>
                  </div>

                  {/* Options when Mic is grabbed */}
                  {grabMicPhase === 'READY' ? (
                    <button
                      type="button"
                      onClick={() => {
                        playTone(740, 120, 'triangle');
                        setGrabMicPhase('MIC_GRABBED');
                        setMicHolderName('الأمير (أنت التقطت المايك أولاً! ⚡)');
                      }}
                      className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#00D1FF] to-[#6C63FF] text-white font-black text-xs shadow-lg hover:brightness-110 transition"
                    >
                      ⚡ اضغط بسرعة لإمساك المايك والإجابة!
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        {currentRound.options.map((opt, idx) => {
                          const isChosen = grabMicSelectedOption === idx;
                          const isCorrect = idx === currentRound.correctIndex;
                          let btnStyle =
                            'bg-[#13223A] border-white/15 text-white hover:border-[#00D1FF]';
                          if (grabMicPhase === 'ANSWERED') {
                            if (isCorrect) {
                              btnStyle =
                                'bg-emerald-500/30 border-emerald-400 text-emerald-200';
                            } else if (isChosen) {
                              btnStyle =
                                'bg-rose-500/30 border-rose-400 text-rose-200';
                            }
                          }
                          return (
                            <button
                              key={idx}
                              type="button"
                              disabled={grabMicPhase === 'ANSWERED'}
                              onClick={() => {
                                setGrabMicSelectedOption(idx);
                                setGrabMicPhase('ANSWERED');
                                if (idx === currentRound.correctIndex) {
                                  playTone(880, 180, 'triangle');
                                  setGrabMicScore((s) => s + 10);
                                  showToast('إجابة صحيحة على المايك! +10 نقاط حماس 🎙️🔥');
                                  if (onAnnounceWinInRoom) {
                                    onAnnounceWinInRoom(
                                      `🎙️ التقط المايك في لعبة (امسك المايك) وأكمل الأغنية بنجاح: "${currentRound.missingLyricOrAnswer}"!`
                                    );
                                  }
                                } else {
                                  playTone(240, 200, 'sawtooth');
                                  showToast(
                                    `الإجابة الصحيحة هي: ${currentRound.missingLyricOrAnswer}`
                                  );
                                }
                              }}
                              className={`py-2.5 px-3 rounded-xl border text-xs font-extrabold transition ${btnStyle}`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>

                      {grabMicPhase === 'ANSWERED' && (
                        <button
                          type="button"
                          onClick={() => {
                            setGrabMicIndex((i) => i + 1);
                            setGrabMicPhase('READY');
                            setGrabMicSelectedOption(null);
                            setMicHolderName('');
                          }}
                          className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-[#F59E0B] to-[#FFD700] text-[#080F1A] font-black text-xs"
                        >
                          🎙️ الجولة التالية في امسك المايك
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* ====================================================================
            TAB 6: GUESS CHALLENGE (لعبة التخمين والفوازير - مجانية بدون كوينزات)
           ==================================================================== */}
        {activeGameTab === 'guess_challenge' && (
          <div className="space-y-3.5">
            {(() => {
              const currentQ =
                GUESS_CHALLENGE_LIST[guessIndex % GUESS_CHALLENGE_LIST.length];
              return (
                <div className="bg-gradient-to-b from-[#1D1138] via-[#0E192D] to-[#080F1A] border-2 border-purple-400/50 rounded-3xl p-4 space-y-4 text-center shadow-xl">
                  <div className="flex items-center justify-between text-xs">
                    <span className="px-2.5 py-1 rounded-full bg-purple-500/20 border border-purple-400/40 text-purple-200 font-extrabold">
                      {currentQ.type}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-extrabold">
                        سلسلة الفوز: {guessStreak} 🔥
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-[#FFD700]/20 border border-[#FFD700]/40 text-[#FFD700] font-extrabold">
                        النقاط: {guessScore}
                      </span>
                    </div>
                  </div>

                  {/* Emoji Clue Stage */}
                  <div className="py-4 px-3 rounded-2xl bg-[#080F1A]/90 border border-[#FFD700]/30 space-y-2">
                    <div className="text-4xl tracking-widest select-none">
                      {currentQ.emojiClue}
                    </div>
                    <p className="text-sm font-extrabold text-white mt-2">
                      {currentQ.question}
                    </p>
                    {showGuessHint ? (
                      <div className="text-xs font-bold text-[#FFD700]">
                        💡 تلميح: {currentQ.hint}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowGuessHint(true)}
                        className="text-[11px] text-[#00D1FF] underline font-bold"
                      >
                        💡 إظهار تلميح مجاني
                      </button>
                    )}
                  </div>

                  {/* 4 Guess Options */}
                  <div className="grid grid-cols-2 gap-2.5">
                    {currentQ.options.map((opt, idx) => {
                      const answered = guessSelectedOption !== null;
                      const isCorrect = idx === currentQ.correctIndex;
                      const isSelected = guessSelectedOption === idx;
                      let styleClass =
                        'bg-[#13223A] border-white/15 text-white hover:border-[#FFD700]';
                      if (answered) {
                        if (isCorrect) {
                          styleClass =
                            'bg-emerald-500/30 border-emerald-400 text-emerald-200';
                        } else if (isSelected) {
                          styleClass =
                            'bg-rose-500/30 border-rose-400 text-rose-200';
                        }
                      }
                      return (
                        <button
                          key={idx}
                          type="button"
                          disabled={answered}
                          onClick={() => {
                            setGuessSelectedOption(idx);
                            if (idx === currentQ.correctIndex) {
                              playTone(880, 180, 'triangle');
                              setGuessScore((s) => s + 15);
                              setGuessStreak((st) => st + 1);
                              showToast('تخمين ذكي وصحيح! +15 نقطة 🧠🎉');
                              if (onAnnounceWinInRoom) {
                                onAnnounceWinInRoom(
                                  `🧠 حلّ لغز (لعبة التخمين) بنجاح: "${opt}" (${currentQ.emojiClue})!`
                                );
                              }
                            } else {
                              playTone(230, 200, 'sawtooth');
                              setGuessStreak(0);
                              showToast(
                                `إجابة غير صحيحة! الجواب هو: ${
                                  currentQ.options[currentQ.correctIndex]
                                }`
                              );
                            }
                          }}
                          className={`py-3 px-3 rounded-2xl border text-xs font-extrabold transition ${styleClass}`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>

                  {guessSelectedOption !== null && (
                    <button
                      type="button"
                      onClick={() => {
                        setGuessIndex((i) => i + 1);
                        setGuessSelectedOption(null);
                        setShowGuessHint(false);
                      }}
                      className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#F59E0B] to-[#FFD700] text-[#080F1A] font-black text-xs shadow-md"
                    >
                      🧠 اللغز التالي (مجاناً بدون كوينز)
                    </button>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* ====================================================================
            TAB 7: SPIN WHEEL PARTY (عجلة تحديات المجلس الصوتية - بدون كوينزات)
           ==================================================================== */}
        {activeGameTab === 'spin_wheel_party' && (
          <div className="bg-gradient-to-b from-[#162238] via-[#0B1528] to-[#080F1A] border-2 border-[#FFD700]/50 rounded-3xl p-4 space-y-4 text-center shadow-xl">
            <div className="flex items-center justify-between text-xs">
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-extrabold">
                🎡 لعبة جماعية بدون كوينز
              </span>
              <span className="text-slate-300 font-bold">
                المشارك: <strong className="text-[#FFD700]">{partyPlayerName}</strong>
              </span>
            </div>

            <div className="py-3 flex flex-col items-center">
              <div
                className={`w-24 h-24 rounded-full bg-gradient-to-tr from-[#FFD700] via-pink-500 to-[#00D1FF] p-1 shadow-2xl ${
                  partyWheelSpinning ? 'animate-spin' : ''
                }`}
              >
                <div className="w-full h-full rounded-full bg-[#080F1A] flex items-center justify-center text-4xl">
                  🎡
                </div>
              </div>

              <div className="mt-4 bg-[#080F1A]/90 border border-[#FFD700]/40 rounded-2xl p-4 w-full">
                <div className="text-[11px] text-[#00D1FF] font-bold mb-1">
                  حكم أو تحدي المايك الحالي:
                </div>
                <p className="text-sm font-extrabold text-white">
                  {partyWheelPrompt}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={partyWheelSpinning}
                onClick={() => {
                  setPartyWheelSpinning(true);
                  playTone(620, 150, 'triangle');
                  const players = [
                    'الأمير (أنت)',
                    'صقر اليمن (مايك 2)',
                    'خالد (مايك 3)',
                    'المحترف (مايك 4)',
                    'الجنوبي (مايك 5)',
                  ];
                  setTimeout(() => {
                    const nextPrompt =
                      PARTY_WHEEL_PROMPTS[
                        Math.floor(Math.random() * PARTY_WHEEL_PROMPTS.length)
                      ];
                    const chosenPlayer =
                      players[Math.floor(Math.random() * players.length)];
                    setPartyWheelPrompt(nextPrompt);
                    setPartyPlayerName(chosenPlayer);
                    setPartyWheelSpinning(false);
                    showToast(`تحدي جديد لـ ${chosenPlayer}!`);
                  }, 900);
                }}
                className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-[#00D1FF] to-[#6C63FF] text-white font-black text-xs shadow-lg hover:brightness-110 transition"
              >
                {partyWheelSpinning
                  ? '🎡 جاري تدوير عجلة التحديات...'
                  : '🎡 دوّر عجلة التحديات (مجاناً)'}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onAnnounceWinInRoom) {
                    onAnnounceWinInRoom(
                      `🎡 تحدي المجلس الصوتي لـ [${partyPlayerName}]: ${partyWheelPrompt}`
                    );
                    showToast('تم إرسال التحدي إلى دردشة الغرفة الصوتية!');
                  }
                }}
                className="px-3.5 py-3 rounded-2xl bg-[#FFD700]/20 border border-[#FFD700] text-[#FFD700] text-xs font-extrabold"
              >
                إعلان بالغرفة
              </button>
            </div>
          </div>
        )}

        {/* ====================================================================
            TAB 8: TRUTH OR DARE (لعبة صراحة أو جرأة على المايك - مجانية بدون كوينز)
           ==================================================================== */}
        {activeGameTab === 'truth_or_dare' && (
          <div className="bg-gradient-to-b from-[#2A1138] via-[#0E192D] to-[#080F1A] border-2 border-rose-400/50 rounded-3xl p-4 space-y-4 text-center shadow-xl">
            <div className="flex items-center justify-between text-xs">
              <span className="px-2.5 py-1 rounded-full bg-rose-500/20 border border-rose-400/40 text-rose-300 font-extrabold">
                🍾 صراحة أو جرأة (مجاناً)
              </span>
              <span className="text-slate-300 font-bold">
                الدور على: <strong className="text-[#FFD700]">{todTargetPlayer}</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setTodMode('truth');
                  setTodPromptText(
                    TRUTH_QUESTIONS[Math.floor(Math.random() * TRUTH_QUESTIONS.length)]
                  );
                }}
                className={`py-2.5 rounded-2xl border text-xs font-extrabold transition ${
                  todMode === 'truth'
                    ? 'bg-gradient-to-r from-[#00D1FF] to-blue-600 text-white border-white shadow-md'
                    : 'bg-[#080F1A] text-slate-300 border-white/10'
                }`}
              >
                💬 سؤال صراحة
              </button>
              <button
                type="button"
                onClick={() => {
                  setTodMode('dare');
                  setTodPromptText(
                    DARE_CHALLENGES[Math.floor(Math.random() * DARE_CHALLENGES.length)]
                  );
                }}
                className={`py-2.5 rounded-2xl border text-xs font-extrabold transition ${
                  todMode === 'dare'
                    ? 'bg-gradient-to-r from-rose-500 to-amber-500 text-white border-white shadow-md'
                    : 'bg-[#080F1A] text-slate-300 border-white/10'
                }`}
              >
                ⚡ تحدي جرأة
              </button>
            </div>

            <div className="py-3 flex flex-col items-center">
              <div
                className={`w-20 h-20 rounded-full bg-[#080F1A] border-2 border-[#FFD700] flex items-center justify-center text-4xl shadow-xl ${
                  todSpinning ? 'animate-spin' : ''
                }`}
              >
                🍾
              </div>

              <div className="mt-3 bg-[#080F1A]/90 border border-white/15 rounded-2xl p-4 w-full space-y-1.5">
                <div className="text-[11px] font-bold text-[#FFD700]">
                  الموجّه إلى {todTargetPlayer}:
                </div>
                <p className="text-sm font-extrabold text-white leading-relaxed">
                  {todPromptText}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={todSpinning}
                onClick={() => {
                  setTodSpinning(true);
                  playTone(680, 150, 'triangle');
                  const micPlayers = [
                    'الأمير (مايك 1)',
                    'صقر اليمن (مايك 2)',
                    'خالد (مايك 3)',
                    'المحترف (مايك 4)',
                    'الجنوبي (مايك 5)',
                    'الطيب (مايك 6)',
                  ];
                  setTimeout(() => {
                    const nextP =
                      micPlayers[Math.floor(Math.random() * micPlayers.length)];
                    const list = todMode === 'truth' ? TRUTH_QUESTIONS : DARE_CHALLENGES;
                    const nextQ = list[Math.floor(Math.random() * list.length)];
                    setTodTargetPlayer(nextP);
                    setTodPromptText(nextQ);
                    setTodSpinning(false);
                    showToast(`توقفت القارورة عند ${nextP}!`);
                  }, 750);
                }}
                className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-[#F59E0B] to-[#FFD700] text-[#080F1A] font-black text-xs shadow-lg"
              >
                {todSpinning ? '🍾 جاري تدوير القارورة...' : '🍾 دوّر القارورة لاختيار لاعب'}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onAnnounceWinInRoom) {
                    onAnnounceWinInRoom(
                      `🍾 لعبة صراحة أو جرأة لـ [${todTargetPlayer}]: ${todPromptText}`
                    );
                    showToast('تم إرسال السؤال في دردشة الغرفة الصوتية!');
                  }
                }}
                className="px-3.5 py-3 rounded-2xl bg-white/10 border border-white/20 text-white text-xs font-extrabold"
              >
                إرسال للغرفة
              </button>
            </div>
          </div>
        )}

        {/* ====================================================================
            TAB 9: XO MAJLIS (لعبة إكس أو المجلس الذهبية - مجانية بدون كوينز)
           ==================================================================== */}
        {activeGameTab === 'xo_majlis' && (
          <div className="bg-gradient-to-b from-[#10243A] via-[#0B1528] to-[#080F1A] border-2 border-[#00D1FF]/50 rounded-3xl p-4 space-y-4 text-center shadow-xl">
            <div className="flex items-center justify-between text-xs">
              <span className="px-2.5 py-1 rounded-full bg-[#00D1FF]/20 border border-[#00D1FF]/40 text-[#00D1FF] font-extrabold">
                ❌⭕ إكس أو المجلس (مجانية)
              </span>
              <span className="px-2.5 py-1 rounded-full bg-[#FFD700]/20 border border-[#FFD700]/40 text-[#FFD700] font-extrabold">
                انتصاراتي: {xoMyWins} 🏆
              </span>
            </div>

            <div className="text-xs text-slate-300">
              أنت تلعب بـ <strong className="text-[#FFD700]">👑 (X)</strong> ضد بطل المجلس{' '}
              <strong className="text-[#00D1FF]">🦅 (O)</strong>
            </div>

            <div className="grid grid-cols-3 gap-2.5 max-w-[250px] mx-auto">
              {xoBoard.map((cell, idx) => (
                <button
                  key={idx}
                  type="button"
                  disabled={cell !== null || xoWinner !== null}
                  onClick={() => {
                    const checkWin = (b: (null | 'X' | 'O')[]) => {
                      const lines = [
                        [0, 1, 2],
                        [3, 4, 5],
                        [6, 7, 8],
                        [0, 3, 6],
                        [1, 4, 7],
                        [2, 5, 8],
                        [0, 4, 8],
                        [2, 4, 6],
                      ];
                      for (const [a, bIdx, c] of lines) {
                        if (b[a] && b[a] === b[bIdx] && b[a] === b[c]) return b[a];
                      }
                      if (b.every((x) => x !== null)) return 'DRAW';
                      return null;
                    };

                    const next = [...xoBoard];
                    next[idx] = 'X';
                    playTone(700, 90, 'triangle');

                    const res1 = checkWin(next);
                    if (res1) {
                      setXoBoard(next);
                      setXoWinner(res1);
                      if (res1 === 'X') {
                        setXoMyWins((w) => w + 1);
                        showToast('فزت في جولة إكس أو المجلس! 🏆👑');
                        if (onAnnounceWinInRoom) {
                          onAnnounceWinInRoom(
                            '👑 فاز في تحدي (إكس أو المجلس ❌⭕) المجاني ببراعة!'
                          );
                        }
                      }
                      return;
                    }

                    // Bot move
                    const emptyIndices = next
                      .map((v, i) => (v === null ? i : -1))
                      .filter((i) => i !== -1);
                    if (emptyIndices.length > 0) {
                      const botPick =
                        emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
                      next[botPick] = 'O';
                    }
                    const res2 = checkWin(next);
                    setXoBoard(next);
                    if (res2) setXoWinner(res2);
                  }}
                  className={`h-20 rounded-2xl border-2 text-3xl font-black flex items-center justify-center transition ${
                    cell === 'X'
                      ? 'bg-[#FFD700]/20 border-[#FFD700] text-[#FFD700]'
                      : cell === 'O'
                      ? 'bg-[#00D1FF]/20 border-[#00D1FF] text-[#00D1FF]'
                      : 'bg-[#080F1A] border-white/15 hover:border-[#FFD700]/60'
                  }`}
                >
                  {cell === 'X' ? '👑' : cell === 'O' ? '🦅' : ''}
                </button>
              ))}
            </div>

            {xoWinner && (
              <div className="text-xs font-extrabold text-[#FFD700]">
                {xoWinner === 'X'
                  ? '🎉 مبروك! أنت الفائز في إكس أو المجلس!'
                  : xoWinner === 'O'
                  ? '🦅 فاز منافسك في هذه الجولة، جرب مرة أخرى!'
                  : '🤝 تعادل بين الطرفين!'}
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setXoBoard(Array(9).fill(null));
                setXoWinner(null);
              }}
              className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-[#00D1FF] to-[#6C63FF] text-white font-black text-xs"
            >
              🔄 جولة جديدة (مجاناً)
            </button>
          </div>
        )}

        {/* ====================================================================
            TAB 10: SPY IMPOSTOR (لعبة من هو الجاسوس؟ - مجانية بدون كوينز)
           ==================================================================== */}
        {activeGameTab === 'spy_impostor' && (
          <div className="bg-gradient-to-b from-[#192338] via-[#0B1528] to-[#080F1A] border-2 border-emerald-400/50 rounded-3xl p-4 space-y-4 text-center shadow-xl">
            {(() => {
              const currentSpyRound = SPY_ROUNDS[spyRoundIdx % SPY_ROUNDS.length];
              return (
                <>
                  <div className="flex items-center justify-between text-xs">
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-extrabold">
                      🕵️ من هو الجاسوس؟ (مجاناً)
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-[#FFD700]/20 border border-[#FFD700]/40 text-[#FFD700] font-extrabold">
                      نقاط الذكاء: {spyScore} 🕵️
                    </span>
                  </div>

                  <div className="bg-[#080F1A]/90 border border-white/15 rounded-2xl p-3 space-y-1">
                    <div className="text-[11px] text-slate-400">
                      الكلمة السرية لأهل المجلس ({currentSpyRound.category}):
                    </div>
                    <div className="text-base font-extrabold text-[#FFD700]">
                      {currentSpyRound.secretWord}
                    </div>
                    <p className="text-[11px] text-slate-300">
                      واحد من المتحدثين على المايك لا يعرف الكلمة السرية ويحاول التمويه.. اكتشفه!
                    </p>
                  </div>

                  <div className="space-y-2 text-right">
                    {currentSpyRound.suspects.map((susp, idx) => {
                      const answered = spySelectedSuspect !== null;
                      const isChosen = spySelectedSuspect === idx;
                      let cardStyle =
                        'bg-[#122038] border-white/15 hover:border-[#FFD700]';
                      if (answered) {
                        if (susp.isSpy) {
                          cardStyle =
                            'bg-emerald-500/25 border-emerald-400 text-emerald-200';
                        } else if (isChosen) {
                          cardStyle =
                            'bg-rose-500/25 border-rose-400 text-rose-200';
                        }
                      }
                      return (
                        <button
                          key={idx}
                          type="button"
                          disabled={answered}
                          onClick={() => {
                            setSpySelectedSuspect(idx);
                            if (susp.isSpy) {
                              playTone(880, 180, 'triangle');
                              setSpyScore((s) => s + 20);
                              showToast(
                                `أحسنت! كشفت الجاسوس (${susp.name}) بنجاح! +20 نقطة 🕵️🔥`
                              );
                              if (onAnnounceWinInRoom) {
                                onAnnounceWinInRoom(
                                  `🕵️ كشف الجاسوس الخفي (${susp.name}) في لعبة (من هو الجاسوس؟) المجانية!`
                                );
                              }
                            } else {
                              playTone(230, 200, 'sawtooth');
                              showToast(
                                `ليس هو! الجاسوس الحقيقي كان يموّه في وصفه.`
                              );
                            }
                          }}
                          className={`w-full p-3 rounded-2xl border transition flex items-start justify-between gap-2 ${cardStyle}`}
                        >
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-extrabold text-[#FFD700]">
                                {susp.name}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/10 text-slate-300">
                                {susp.seatLabel}
                              </span>
                            </div>
                            <p className="text-xs text-slate-200 mt-1">
                              «{susp.statement}»
                            </p>
                          </div>
                          <span className="text-lg shrink-0">
                            {answered
                              ? susp.isSpy
                                ? '🕵️‍♂️'
                                : '✅'
                              : '🎤'}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {spySelectedSuspect !== null && (
                    <button
                      type="button"
                      onClick={() => {
                        setSpyRoundIdx((i) => i + 1);
                        setSpySelectedSuspect(null);
                      }}
                      className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#F59E0B] to-[#FFD700] text-[#080F1A] font-black text-xs"
                    >
                      🕵️ قضية جاسوس جديدة (مجاناً)
                    </button>
                  )}
                </>
              );
            })()}
          </div>
        )}

        {/* Shared Coin Chip Selector + Action Controls (Only shown for Coin Games) */}
        {gameModeCategory === 'coin_games' && (
          <div className="bg-[#0E192D] border border-[#FFD700]/30 rounded-2xl p-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-[#FFD700] flex items-center gap-1">
              <Sparkles size={13} />
              <span>اختر فئة عملة الرهان (الكوينز):</span>
            </span>
            {activeGameTab === 'greedy_cat' && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleRepeatBets}
                  disabled={gameState !== 'BETTING'}
                  className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/15 text-[10px] font-bold text-slate-200 flex items-center gap-1 disabled:opacity-40"
                >
                  <RotateCcw size={11} />
                  <span>تكرار الرهان</span>
                </button>
                <button
                  type="button"
                  onClick={handleClearBets}
                  disabled={gameState !== 'BETTING' || totalCurrentBet === 0}
                  className="px-2.5 py-1 rounded-xl bg-rose-500/20 border border-rose-500/40 text-[10px] font-bold text-rose-300 disabled:opacity-40"
                >
                  إلغاء الرهان
                </button>
              </div>
            )}
          </div>

          <div className="flex items-stretch gap-1.5 overflow-x-auto pb-1.5 pt-0.5 scrollbar-thin scrollbar-thumb-amber-500/30">
            {CHIP_VALUES.map((val) => {
              const active = selectedChip === val;
              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => setSelectedChip(val)}
                  className={`min-w-[54px] flex-1 py-1.5 px-1 rounded-xl font-mono text-xs font-black border transition flex flex-col items-center justify-center shrink-0 ${
                    active
                      ? 'bg-gradient-to-b from-[#FFD700] to-amber-500 text-[#080F1A] border-white shadow-[0_0_12px_rgba(255,215,0,0.5)] scale-105'
                      : 'bg-[#080F1A] text-[#FFD700] border-[#FFD700]/30 hover:border-[#FFD700]'
                  }`}
                >
                  <span>{val >= 1000 ? `${val / 1000}K` : val}</span>
                  <span className="text-[8px] opacity-80">كوينز</span>
                </button>
              );
            })}
          </div>
        </div>
        )}

        {/* ====================================================================
            MODAL: سجل نتائج وأرباح وخسائر القط الجشع (سجلي)
           ==================================================================== */}
        {showHistoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="relative w-full max-w-md bg-[#0B1528] border-2 border-[#00D1FF]/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
              {/* Header */}
              <div className="p-3.5 bg-gradient-to-r from-[#122A4A] via-[#103463] to-[#122A4A] border-b border-[#00D1FF]/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#00D1FF]/20 border border-[#00D1FF] flex items-center justify-center text-sm shadow">
                    🐱
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                      <span>سجل أرباح وخسائر القط الجشع</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#00D1FF]/20 text-[#00D1FF]">
                        آخر النتائج
                      </span>
                    </h3>
                    <p className="text-[10px] text-slate-300">
                      تفاصيل كم ربحت وكم خسرت في كل جولة
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowHistoryModal(false)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 flex items-center justify-center transition"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Quick Summary Bar */}
              <div className="p-3 bg-[#081120] border-b border-white/10 grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-[9px] text-slate-400 block">الجولات المسجلة</span>
                  <span className="text-xs font-mono font-black text-white block mt-0.5">
                    {detailedRoundHistory.length > 0 ? detailedRoundHistory.length : history.length} جولة
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-500/30">
                  <span className="text-[9px] text-emerald-300 block">إجمالي الأرباح</span>
                  <span className="text-xs font-mono font-black text-emerald-400 block mt-0.5">
                    +{detailedRoundHistory
                      .reduce((acc, r) => acc + (r.netProfit && r.netProfit > 0 ? r.netProfit : 0), 0)
                      .toLocaleString('en-US')}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-rose-950/40 border border-rose-500/30">
                  <span className="text-[9px] text-rose-300 block">إجمالي الخسائر</span>
                  <span className="text-xs font-mono font-black text-rose-400 block mt-0.5">
                    -{Math.abs(
                      detailedRoundHistory.reduce(
                        (acc, r) => acc + (r.netProfit && r.netProfit < 0 ? r.netProfit : 0),
                        0
                      )
                    ).toLocaleString('en-US')}
                  </span>
                </div>
              </div>

              {/* List of Rounds */}
              <div className="p-3 overflow-y-auto space-y-2 flex-1 scrollbar-thin scrollbar-thumb-cyan-500/30">
                {detailedRoundHistory.length > 0 ? (
                  detailedRoundHistory.map((rec, i) => {
                    const isWin = rec.netProfit !== undefined && rec.netProfit > 0;
                    const isLoss = rec.netProfit !== undefined && rec.netProfit < 0;
                    const isTie = rec.netProfit !== undefined && rec.netProfit === 0;

                    return (
                      <div
                        key={`${rec.roundNumber}-${i}`}
                        className={`p-2.5 rounded-2xl border transition-all flex items-center justify-between ${
                          rec.totalBet === 0
                            ? 'bg-[#101D33] border-white/10 text-slate-300'
                            : isWin
                            ? 'bg-emerald-950/40 border-emerald-500/50 text-white'
                            : isLoss
                            ? 'bg-rose-950/40 border-rose-500/50 text-white'
                            : 'bg-amber-950/40 border-amber-500/50 text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex flex-col items-center justify-center text-lg shadow-inner">
                            <span>{rec.item.emoji}</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-extrabold text-white">
                                {rec.item.name}
                              </span>
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-white/10 text-[#FFD700]">
                                ×{rec.item.multiplier}
                              </span>
                            </div>
                            <span className="text-[9px] text-slate-400 block mt-0.5 font-mono">
                              جولة #{rec.roundNumber} • الرهان: {rec.totalBet.toLocaleString('en-US')} كوينز
                            </span>
                          </div>
                        </div>

                        <div className="text-left font-mono">
                          {rec.totalBet === 0 ? (
                            <span className="text-[11px] text-slate-400 font-bold px-2 py-1 rounded-xl bg-white/5">
                              لم تشارك بالرهان
                            </span>
                          ) : isWin ? (
                            <div className="flex flex-col items-end">
                              <span className="text-xs font-black text-emerald-400 flex items-center gap-1">
                                <TrendingUp size={13} />
                                <span>+{rec.netProfit?.toLocaleString('en-US')}</span>
                              </span>
                              <span className="text-[8px] text-emerald-300/80">
                                عائد: {rec.wonCoins.toLocaleString('en-US')}
                              </span>
                            </div>
                          ) : isLoss ? (
                            <div className="flex flex-col items-end">
                              <span className="text-xs font-black text-rose-400 flex items-center gap-1">
                                <TrendingDown size={13} />
                                <span>-{Math.abs(rec.netProfit || 0).toLocaleString('en-US')}</span>
                              </span>
                              <span className="text-[8px] text-rose-300/80">
                                خسارة كاملة
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs font-black text-amber-400">
                              تعادل (0)
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-6 text-slate-400 space-y-2">
                    <span className="text-3xl block">🐱</span>
                    <p className="text-xs font-bold text-slate-300">
                      لا توجد جولات ملعوبة بعد في هذه الجلسة!
                    </p>
                    <p className="text-[10px] text-slate-400">
                      ضع رهانك وشارك في جولة القط الجشع لترى تفاصيل أرباحك وخسائرك هنا فوراً.
                    </p>
                    {/* Fallback showing recent items history */}
                    <div className="pt-3">
                      <span className="text-[10px] text-[#00D1FF] block mb-2 font-bold">
                        نتائج الجولات العامة الأخيرة:
                      </span>
                      <div className="flex flex-wrap justify-center gap-1.5">
                        {history.map((it, idx) => (
                          <div
                            key={idx}
                            className="px-2 py-1 rounded-xl bg-white/5 border border-white/10 text-xs flex items-center gap-1 text-slate-200"
                          >
                            <span>{it.emoji}</span>
                            <span>{it.name}</span>
                            <span className="text-[#FFD700] text-[9px] font-mono font-bold">
                              ×{it.multiplier}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-3 bg-[#081120] border-t border-white/10 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">
                  رصيدك الحالي: <strong className="text-[#FFD700] font-mono">{coins.toLocaleString('en-US')}</strong> كوينز
                </span>
                <button
                  type="button"
                  onClick={() => setShowHistoryModal(false)}
                  className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#00D1FF] to-[#0077B6] text-white text-xs font-black hover:brightness-110 transition shadow"
                >
                  حسناً، متابعة اللعب
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
