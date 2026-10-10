import { Timestamp } from 'firebase/firestore';
import heroLoungeImg from './assets/images/majlisna_hero_lounge_1791327900687.jpg';
import coinChestImg from './assets/images/coin_chest_royal_1791327911830.jpg';
import coinPouchImg from './assets/images/coin_pouch_gold_1791327921960.jpg';

export type VipTier = 'member' | 'gold' | 'royal' | 'emperor';

export type RoomCategory =
  | 'عام'
  | 'شعر وأدب'
  | 'سوالف المساء'
  | 'ألعاب وتحديات'
  | 'قهوة وعلوم';

export interface UserProfile {
  uid: string;
  displayName: string;
  photoURL: string;
  bio: string;
  coins: number;
  totalCoinsSpent: number;
  totalGiftsReceived: number;
  vipTier: VipTier;
  activeBadge: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface VoiceRoom {
  roomId: string;
  title: string;
  topic: string;
  category: RoomCategory;
  hostId: string;
  hostName: string;
  status: 'active' | 'closed';
  totalCoinsSupport: number;
  speakerCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface RoomSeat {
  seatIndex: number;
  roomId: string;
  uid: string;
  displayName: string;
  photoURL: string;
  vipTier: VipTier;
  isMuted: boolean;
  isSpeaking: boolean;
  joinedAt: Timestamp;
  updatedAt: Timestamp;
}

export interface RoomMessage {
  id?: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderPhoto: string;
  senderVipTier: VipTier;
  text: string;
  type: 'chat' | 'gift' | 'system';
  giftName: string;
  giftCoins: number;
  recipientName: string;
  createdAt: Timestamp;
}

export interface CoinTransaction {
  id?: string;
  uid: string;
  type: 'topup' | 'gift_sent' | 'vip_upgrade' | 'daily_reward';
  amount: number;
  title: string;
  referenceId: string;
  createdAt: Timestamp;
}

export interface CoinPackage {
  id: string;
  name: string;
  subtitle: string;
  coins: number;
  bonusCoins: number;
  priceSar: number;
  image: string;
  featured?: boolean;
}

export interface GiftItem {
  id: string;
  name: string;
  arabicTitle: string;
  coins: number;
  symbol: string;
  description: string;
}

export interface VipPlan {
  tier: VipTier;
  title: string;
  subtitle: string;
  costCoins: number;
  badgeLabel: string;
  perks: string[];
}

export const ASSETS = {
  heroLounge: heroLoungeImg,
  coinChest: coinChestImg,
  coinPouch: coinPouchImg,
};

export const ROOM_CATEGORIES: RoomCategory[] = [
  'عام',
  'شعر وأدب',
  'سوالف المساء',
  'ألعاب وتحديات',
  'قهوة وعلوم',
];

export const COIN_PACKAGES: CoinPackage[] = [
  {
    id: 'pkg_starter',
    name: 'صرة القهوة الذهبية',
    subtitle: 'مثالية للهدايا اليومية والمشاركة في المجالس',
    coins: 500,
    bonusCoins: 50,
    priceSar: 19,
    image: coinPouchImg,
  },
  {
    id: 'pkg_majlis',
    name: 'حزمة الديوان العامر',
    subtitle: 'باقة الضيافة الأكثر طلباً لدعم الشعراء والمتحدثين',
    coins: 2500,
    bonusCoins: 400,
    priceSar: 79,
    image: coinPouchImg,
    featured: true,
  },
  {
    id: 'pkg_sultan',
    name: 'خزينة السلطان الملكية',
    subtitle: 'رصيد وافر لإرسال الصقور والخيول العربية وترقية العضوية',
    coins: 10000,
    bonusCoins: 2500,
    priceSar: 299,
    image: coinChestImg,
  },
  {
    id: 'pkg_emperor',
    name: 'صندوق الإمبراطور الفاخر',
    subtitle: 'أعلى باقة كوينز لكبار الداعمين وأصحاب المجالس الكبرى',
    coins: 35000,
    bonusCoins: 10000,
    priceSar: 899,
    image: coinChestImg,
  },
];

export const GIFT_CATALOG: GiftItem[] = [
  {
    id: 'gift_dallah',
    name: 'دلة قهوة عربية',
    arabicTitle: 'دلة الكرم',
    coins: 25,
    symbol: '☕',
    description: 'تحية الضيافة العربية الأصيلة للمتحدث',
  },
  {
    id: 'gift_oud',
    name: 'عود كمبودي فاخر',
    arabicTitle: 'طيب المجلس',
    coins: 100,
    symbol: '🪵',
    description: 'يبث شذى العود الفاخر في أرجاء الديوان',
  },
  {
    id: 'gift_bakhoor',
    name: 'مبخرة ملكية مذهبة',
    arabicTitle: 'مبخرة الذهب',
    coins: 250,
    symbol: '✨',
    description: 'تكريم رفيع لأصحاب السوالف والقصائد المميزة',
  },
  {
    id: 'gift_falcon',
    name: 'صقر حر نادر',
    arabicTitle: 'الصقر الحر',
    coins: 750,
    symbol: '🦅',
    description: 'رمز الشموخ والرفعة في صدارة المجلس',
  },
  {
    id: 'gift_stallion',
    name: 'جواد عربي أصيل',
    arabicTitle: 'الكحيلان الأصيل',
    coins: 2000,
    symbol: '🐎',
    description: 'هدية كبار الشخصيات المرموقة في مجلسنا',
  },
  {
    id: 'gift_palace',
    name: 'قصر الضيافة الملكي',
    arabicTitle: 'قصر المجد',
    coins: 5000,
    symbol: '🕌',
    description: 'أفخم إهداء يتصدر سجل الداعمين في الغرفة',
  },
];

export const VIP_PLANS: VipPlan[] = [
  {
    tier: 'gold',
    title: 'العضوية الذهبية',
    subtitle: 'لرواد المجالس الدائمين',
    costCoins: 1500,
    badgeLabel: 'وجيه ذهبي',
    perks: [
      'إطار ذهبي مضيء حول الصورة الشخصية في المايكات',
      'لقب «وجيه ذهبي» يظهر بجانب الاسم في الدردشة',
      'أولوية الظهور في قائمة المتحدثين',
    ],
  },
  {
    tier: 'royal',
    title: 'العضوية الملكية',
    subtitle: 'لكبار الداعمين وأصحاب الدواوين',
    costCoins: 5000,
    badgeLabel: 'سمو المجلس',
    perks: [
      'إطار ملكي مرصع بالزمرد والذهب في المايكات',
      'لقب «سمو المجلس» المميز في كافة الغرف',
      'إشعار دخول ترحيبي خاص عند الانضمام لأي غرفة',
    ],
  },
  {
    tier: 'emperor',
    title: 'مقام الإمبراطور',
    subtitle: 'أعلى مرتبة شرفية في منصة مجلسنا',
    costCoins: 15000,
    badgeLabel: 'عميد الديوان',
    perks: [
      'هالة ضوئية مذهبة متحركة على مقعد المايك',
      'لقب «عميد الديوان» الحصري باللون الذهبي الخالص',
      'تاج الصدارة في لوحة الشرف وكبار الداعمين',
    ],
  },
];

export const VIP_TIER_LABELS: Record<VipTier, string> = {
  member: 'عضو المجلس',
  gold: 'وجيه ذهبي',
  royal: 'سمو المجلس',
  emperor: 'عميد الديوان',
};
