import heroLoungeImg from './assets/images/majlisna_hero_lounge_1791327900687.jpg';
import goldMicBannerImg from './assets/images/majlisna_gold_mic_banner_1791332817532.jpg';
import avatarHoodedVipImg from './assets/images/avatar_hooded_vip_1791332829341.jpg';
import roomMusicImg from './assets/images/room_card_music_1791332838158.jpg';
import roomPoetryImg from './assets/images/room_card_poetry_1791332848241.jpg';
import coinChestImg from './assets/images/coin_chest_royal_1791327911830.jpg';
import coinPouchImg from './assets/images/coin_pouch_gold_1791327921960.jpg';
import hdGiftLionImg from './assets/images/hd_gift_golden_lion_1791493591519.jpg';
import hdGiftCarImg from './assets/images/hd_gift_sports_car_1791493603821.jpg';
import hdGiftFalconImg from './assets/images/hd_gift_royal_falcon_1791493615750.jpg';

export const APP_IMAGES = {
  heroLounge: heroLoungeImg,
  goldMicBanner: goldMicBannerImg,
  avatarHoodedVip: avatarHoodedVipImg,
  roomMusic: roomMusicImg,
  roomPoetry: roomPoetryImg,
  coinChest: coinChestImg,
  coinPouch: coinPouchImg,
  hdGiftLion: hdGiftLionImg,
  hdGiftCar: hdGiftCarImg,
  hdGiftFalcon: hdGiftFalconImg,
};

export const WHATSAPP_NUMBER = '967776551633';

export type ScreenName =
  | 'splash'
  | 'login'
  | 'register'
  | 'home'
  | 'room'
  | 'gifts'
  | 'greedy_cat'
  | 'workspace_hub'
  | 'profile'
  | 'notifications'
  | 'messages'
  | 'settings';

export interface SeatMember {
  id: number;
  playerId: string;
  roleLabel: string;
  name: string;
  avatar: string;
  level: number;
  occupied: boolean;
  isMuted: boolean;
  isVip?: boolean;
  isFriend?: boolean;
  bio?: string;
  ringColor: 'cyan' | 'purple' | 'gold';
}

export type RoomTopicCategory =
  | 'all'
  | 'music'
  | 'discussion'
  | 'entertainment'
  | 'poetry'
  | 'games';

export interface RoomCategoryMeta {
  id: RoomTopicCategory;
  label: string;
  shortLabel: string;
  emoji: string;
  description: string;
  accentBorder: string;
  badgeBg: string;
}

export const ROOM_CATEGORIES: RoomCategoryMeta[] = [
  {
    id: 'all',
    label: 'كل الغرف',
    shortLabel: 'الكل',
    emoji: '👑',
    description: 'جميع المجالس والغرف الصوتية المباشرة',
    accentBorder: 'border-[#FFD700]/40',
    badgeBg: 'from-[#F59E0B] to-[#FFD700] text-[#080F1A]',
  },
  {
    id: 'music',
    label: 'غرف موسيقية وطرب',
    shortLabel: 'غرف موسيقية',
    emoji: '🎵',
    description: 'جلسات طرب، عود، وأمسيات غنائية مباشرة',
    accentBorder: 'border-cyan-400/40',
    badgeBg: 'from-cyan-400 to-blue-600 text-white',
  },
  {
    id: 'discussion',
    label: 'غرف نقاش وحوار',
    shortLabel: 'غرف نقاش',
    emoji: '💬',
    description: 'حوارات ثقافية، مجالس شباب، ونقاشات هادفة',
    accentBorder: 'border-emerald-400/40',
    badgeBg: 'from-emerald-400 to-teal-600 text-white',
  },
  {
    id: 'entertainment',
    label: 'غرف ترفيه وسوالف',
    shortLabel: 'غرف ترفيه',
    emoji: '🎉',
    description: 'سوالف، ضحك، تعارف، وفعاليات ترفيهية',
    accentBorder: 'border-purple-400/40',
    badgeBg: 'from-purple-500 to-pink-600 text-white',
  },
  {
    id: 'poetry',
    label: 'شعر وأدب وخواطر',
    shortLabel: 'غرف شعر',
    emoji: '🪶',
    description: 'قصائد عربية، شيلات، وأمسيات شعرية',
    accentBorder: 'border-amber-400/40',
    badgeBg: 'from-amber-500 to-orange-600 text-white',
  },
  {
    id: 'games',
    label: 'تحديات ومسابقات',
    shortLabel: 'تحديات',
    emoji: '🏆',
    description: 'مسابقات حماسية، ألعاب صوتية، وجوائز كوينز',
    accentBorder: 'border-rose-400/40',
    badgeBg: 'from-rose-500 to-red-600 text-white',
  },
];

export interface RoomInfo {
  id: string;
  roomCode: string;
  title: string;
  category: 'active' | 'suggested';
  topicCategory: Exclude<RoomTopicCategory, 'all'>;
  listenersCount: string;
  activeMicsCount: number;
  description: string;
  cover: string;
  badgeIcon: 'crown' | 'mic' | 'trophy' | 'feather' | 'game';
  hostName: string;
  isFeatured?: boolean;
}

export interface GiftCatalogItem {
  id: string;
  name: string;
  coins: number;
  category: 'all' | 'vip' | 'seasonal';
  icon: string;
  hdImage?: string;
  isAnimatedHd?: boolean;
  animationTitle?: string;
  xpBonus: number;
  gradient: string;
}

export interface NotificationItem {
  id: string;
  category: 'all' | 'gifts' | 'follows' | 'system';
  title: string;
  timeAgo: string;
  icon: string;
  accent: string;
}

export interface DirectConversation {
  id: string;
  playerId: string;
  name: string;
  avatar: string;
  level: number;
  isFriend: boolean;
  lastMessage: string;
  time: string;
  unreadCount: number;
  isVip?: boolean;
  messages: { fromMe: boolean; text: string; time: string }[];
}

export interface CoinTopupPackage {
  id: number;
  title: string;
  coins: number;
  bonus: number;
  price: string;
  popular?: boolean;
}

export interface LevelRankTier {
  level: number;
  title: string;
  requiredRechargedCoins: number;
  badgeColor: string;
  perks: string;
  unlocksAnimatedBackground?: boolean;
}

export interface AnimatedBackgroundTheme {
  id: string;
  name: string;
  subtitle: string;
  previewImage: string;
  overlayGradient: string;
  accentColor: string;
  particleEmoji: string;
}

export const ANIMATED_BACKGROUNDS: AnimatedBackgroundTheme[] = [
  {
    id: 'none',
    name: 'الخلفية الكلاسيكية',
    subtitle: 'المظهر الملكي الافتراضي لتوب شات',
    previewImage: heroLoungeImg,
    overlayGradient: 'from-[#0B1528] via-[#080F1A] to-[#080F1A]',
    accentColor: '#00D1FF',
    particleEmoji: '✨',
  },
  {
    id: 'royal_gold_nebula',
    name: 'عاصفة الذهب الملكية المتحركة',
    subtitle: 'موجات ذهبية متوهجة مع جزيئات التاج المضيئة (حصري لمستوى 9)',
    previewImage: goldMicBannerImg,
    overlayGradient: 'from-amber-900/60 via-[#181004]/90 to-[#080F1A]',
    accentColor: '#FFD700',
    particleEmoji: '👑',
  },
  {
    id: 'cyber_aurora',
    name: 'شفق النيون الإمبراطوري المتحرك',
    subtitle: 'أضواء نيون سماوية وبنفسجية متحركة بدقة فائقة (حصري لمستوى 9)',
    previewImage: hdGiftCarImg,
    overlayGradient: 'from-cyan-900/60 via-indigo-950/85 to-[#080F1A]',
    accentColor: '#00D1FF',
    particleEmoji: '💎',
  },
  {
    id: 'falcon_palace',
    name: 'ديوان الصقر الذهبي المتحرك',
    subtitle: 'خلفية الصقر العربي المذهب مع هالة ملكية متحركة (حصري لمستوى 9)',
    previewImage: hdGiftFalconImg,
    overlayGradient: 'from-emerald-950/65 via-amber-950/75 to-[#080F1A]',
    accentColor: '#10B981',
    particleEmoji: '🦅',
  },
  {
    id: 'lion_throne',
    name: 'عرش الأسد الملكي المتحرك HD',
    subtitle: 'توهج ناري ذهبي فخم مع شعار الأسد الملكي (حصري لمستوى 9)',
    previewImage: hdGiftLionImg,
    overlayGradient: 'from-rose-950/65 via-amber-900/70 to-[#080F1A]',
    accentColor: '#F59E0B',
    particleEmoji: '🦁',
  },
];

export const LEVEL_TIERS: LevelRankTier[] = [
  {
    level: 1,
    title: 'المستوى 1 — عضو المجلس',
    requiredRechargedCoins: 10000,
    badgeColor: 'from-slate-500 to-slate-700',
    perks: 'يُفتح عند شحن 10,000 كوينز · شارة المستوى 1 وإطار المايك الفضي',
  },
  {
    level: 2,
    title: 'المستوى 2 — نجم المجلس',
    requiredRechargedCoins: 100000,
    badgeColor: 'from-sky-500 to-blue-700',
    perks: 'يُفتح عند شحن 100,000 كوينز · شارة المستوى 2 وإطار سماوي مضيء',
  },
  {
    level: 3,
    title: 'المستوى 3 — وجيه المجلس',
    requiredRechargedCoins: 200000,
    badgeColor: 'from-cyan-400 to-teal-700',
    perks: 'يُفتح عند شحن 200,000 كوينز · تأثير دخول مميز للغرف الصوتية',
  },
  {
    level: 4,
    title: 'المستوى 4 — فارس المجلس',
    requiredRechargedCoins: 300000,
    badgeColor: 'from-emerald-400 to-green-700',
    perks: 'يُفتح عند شحن 300,000 كوينز · أولوية الصعود على المايك ولقب الفارس',
  },
  {
    level: 5,
    title: 'المستوى 5 — شيخ المجلس',
    requiredRechargedCoins: 450000,
    badgeColor: 'from-[#6C63FF] to-indigo-700',
    perks: 'يُفتح عند شحن 450,000 كوينز · هالة بنفسجية ملكية حول المايك',
  },
  {
    level: 6,
    title: 'المستوى 6 — الأمير المتألق',
    requiredRechargedCoins: 550000,
    badgeColor: 'from-purple-500 to-fuchsia-700',
    perks: 'يُفتح عند شحن 550,000 كوينز · رسائل دردشة ذهبية مميزة في الغرفة',
  },
  {
    level: 7,
    title: 'المستوى 7 — الملك المتوج',
    requiredRechargedCoins: 750000,
    badgeColor: 'from-amber-400 to-orange-600',
    perks: 'يُفتح عند شحن 750,000 كوينز · تاج ذهبي ملكي وإشعار دخول للجميع',
  },
  {
    level: 8,
    title: 'المستوى 8 — سلطان المجلس',
    requiredRechargedCoins: 900000,
    badgeColor: 'from-rose-500 to-red-700',
    perks: 'يُفتح عند شحن 900,000 كوينز · هالة السلطان النارية ولقب خاص',
  },
  {
    level: 9,
    title: 'المستوى 9 — إمبراطور توب شات الأسطوري',
    requiredRechargedCoins: 1100000,
    badgeColor: 'from-[#FFD700] via-amber-500 to-rose-600',
    perks: 'يُفتح عند شحن 1,100,000 كوينز · تفعيل ميزة الخلفية المتحركة الحصرية في الحساب والغرفة الصوتية!',
    unlocksAnimatedBackground: true,
  },
];

export const INITIAL_ROOMS: RoomInfo[] = [
  {
    id: 'room_1',
    roomCode: '12345',
    title: 'مجلس النقاش والحوار الهادف',
    category: 'active',
    topicCategory: 'discussion',
    listenersCount: '2.5K مستمع',
    activeMicsCount: 7,
    description: 'حوارات شبابية، آراء ثقافية، ومناقشات يومية مفتوحة',
    cover: goldMicBannerImg,
    badgeIcon: 'crown',
    hostName: 'المدير',
    isFeatured: true,
  },
  {
    id: 'room_2',
    roomCode: '10882',
    title: 'مملكة الطرب والعود الأصيل',
    category: 'active',
    topicCategory: 'music',
    listenersCount: '1.9K مستمع',
    activeMicsCount: 8,
    description: 'عزف عود مباشر وأغاني طربية خليجية ويمنية على مدار الساعة',
    cover: roomMusicImg,
    badgeIcon: 'mic',
    hostName: 'أبو خالد',
    isFeatured: true,
  },
  {
    id: 'room_3',
    roomCode: '10490',
    title: 'ديوان الترفيه والمرح والسوالف',
    category: 'active',
    topicCategory: 'entertainment',
    listenersCount: '1.5K مستمع',
    activeMicsCount: 6,
    description: 'سوالف عفوية، طرائف، وتعارف بين أصدقاء توب شات',
    cover: heroLoungeImg,
    badgeIcon: 'trophy',
    hostName: 'صقر اليمن',
    isFeatured: true,
  },
  {
    id: 'room_4',
    roomCode: '22014',
    title: 'ملتقى الفكر ورواد الأعمال',
    category: 'suggested',
    topicCategory: 'discussion',
    listenersCount: '980 مستمع',
    activeMicsCount: 5,
    description: 'نقاشات التقنية، التجارة، وتبادل الخبرات والأفكار',
    cover: coinChestImg,
    badgeIcon: 'crown',
    hostName: 'الوليد',
  },
  {
    id: 'room_5',
    roomCode: '33019',
    title: 'أمسية الشعر والخواطر الملكية',
    category: 'suggested',
    topicCategory: 'poetry',
    listenersCount: '720 مستمع',
    activeMicsCount: 6,
    description: 'إلقاء قصائد، شيلات، ومساجلات شعرية مباشرة',
    cover: roomPoetryImg,
    badgeIcon: 'feather',
    hostName: 'الطيب',
  },
  {
    id: 'room_6',
    roomCode: '44910',
    title: 'ساحة الألعاب والتحديات الكبرى',
    category: 'suggested',
    topicCategory: 'games',
    listenersCount: '1.1K مستمع',
    activeMicsCount: 8,
    description: 'مسابقات سريعة وتحديات المايك مع جوائز كوينز فورية',
    cover: coinPouchImg,
    badgeIcon: 'game',
    hostName: 'المحترف',
  },
  {
    id: 'room_7',
    roomCode: '55820',
    title: 'أنغام السمر وجلسات المساء',
    category: 'active',
    topicCategory: 'music',
    listenersCount: '840 مستمع',
    activeMicsCount: 5,
    description: 'أصوات ندية، مقامات شرقية، وإهداءات غنائية للأصدقاء',
    cover: roomMusicImg,
    badgeIcon: 'mic',
    hostName: 'فنان المجلس',
  },
  {
    id: 'room_8',
    roomCode: '66310',
    title: 'استراحة الأنس والفكاهة',
    category: 'suggested',
    topicCategory: 'entertainment',
    listenersCount: '690 مستمع',
    activeMicsCount: 4,
    description: 'قصص ممتعة، ألغاز ترفيهية، وجو أخوي مميز',
    cover: hdGiftLionImg,
    badgeIcon: 'trophy',
    hostName: 'الجنوبي',
  },
];

export const INITIAL_SEATS: SeatMember[] = [
  {
    id: 1,
    playerId: 'MJ-10001',
    roleLabel: 'مايك 1',
    name: 'المدير',
    avatar: avatarHoodedVipImg,
    level: 32,
    occupied: true,
    isMuted: false,
    isVip: true,
    isFriend: true,
    bio: 'مؤسس غرفة جلسة شباب — حياكم الله جميعاً',
    ringColor: 'gold',
  },
  {
    id: 2,
    playerId: 'MJ-20491',
    roleLabel: 'مايك 2',
    name: 'خالد',
    avatar: avatarHoodedVipImg,
    level: 18,
    occupied: true,
    isMuted: false,
    isVip: true,
    isFriend: false,
    bio: 'أحب السمر والشعر والقهوة العربية',
    ringColor: 'purple',
  },
  {
    id: 3,
    playerId: 'MJ-77501',
    roleLabel: 'مايك 3',
    name: 'صقر اليمن',
    avatar: heroLoungeImg,
    level: 25,
    occupied: true,
    isMuted: false,
    isVip: true,
    isFriend: true,
    bio: 'صقر اليمن — يا مرحبا بأهل الجود',
    ringColor: 'cyan',
  },
  {
    id: 4,
    playerId: 'MJ-33910',
    roleLabel: 'مايك 4',
    name: 'المحترف',
    avatar: roomMusicImg,
    level: 14,
    occupied: true,
    isMuted: false,
    isFriend: false,
    bio: 'ملك التحديات والمسابقات الصوتية',
    ringColor: 'purple',
  },
  {
    id: 5,
    playerId: 'MJ-44821',
    roleLabel: 'مايك 5',
    name: 'الجنوبي',
    avatar: roomPoetryImg,
    level: 12,
    occupied: true,
    isMuted: false,
    isFriend: false,
    bio: 'أهل الكرم والطيب في مجلسنا',
    ringColor: 'purple',
  },
  {
    id: 6,
    playerId: 'MJ-55102',
    roleLabel: 'مايك 6',
    name: 'الطيب',
    avatar: heroLoungeImg,
    level: 9,
    occupied: true,
    isMuted: false,
    isFriend: true,
    bio: 'الكلمة الطيبة صدقة',
    ringColor: 'cyan',
  },
  {
    id: 7,
    playerId: 'MJ-61904',
    roleLabel: 'مايك 7',
    name: 'الوليد',
    avatar: avatarHoodedVipImg,
    level: 16,
    occupied: true,
    isMuted: false,
    isFriend: false,
    bio: 'ديوان الأصدقاء والسوالف الطيبة',
    ringColor: 'purple',
  },
  {
    id: 8,
    playerId: '',
    roleLabel: 'مايك 8',
    name: '',
    avatar: '',
    level: 1,
    occupied: false,
    isMuted: false,
    isFriend: false,
    ringColor: 'gold',
  },
];

export const GIFTS_LIST: GiftCatalogItem[] = [
  {
    id: 'g_lion',
    name: 'الأسد الملكي HD',
    coins: 1000,
    category: 'vip',
    icon: '🦁',
    hdImage: hdGiftLionImg,
    isAnimatedHd: true,
    animationTitle: 'زئير الأسد الملكي الذهبي يملأ أرجاء المجلس!',
    xpBonus: 500,
    gradient: 'from-amber-500/35 to-orange-950/50',
  },
  {
    id: 'g_car',
    name: 'سيارة النيون HD',
    coins: 500,
    category: 'vip',
    icon: '🏎️',
    hdImage: hdGiftCarImg,
    isAnimatedHd: true,
    animationTitle: 'دخول أسطوري بسيارة النيون الذهبية الفائقة!',
    xpBonus: 300,
    gradient: 'from-cyan-500/30 to-slate-900/50',
  },
  {
    id: 'g_falcon',
    name: 'الصقر الحر HD',
    coins: 750,
    category: 'vip',
    icon: '🦅',
    hdImage: hdGiftFalconImg,
    isAnimatedHd: true,
    animationTitle: 'تحليق الصقر العربي المذهب في سماء المجلس!',
    xpBonus: 400,
    gradient: 'from-emerald-500/30 to-amber-950/50',
  },
  {
    id: 'g_rocket',
    name: 'صاروخ المجرة HD',
    coins: 2000,
    category: 'vip',
    icon: '🚀',
    hdImage: hdGiftCarImg,
    isAnimatedHd: true,
    animationTitle: 'انطلاق صاروخ المجرة الملكي بأعلى دقة!',
    xpBonus: 1000,
    gradient: 'from-purple-500/30 to-blue-900/40',
  },
  {
    id: 'g_crown',
    name: 'تاج الملوك',
    coins: 100,
    category: 'vip',
    icon: '👑',
    isAnimatedHd: true,
    animationTitle: 'تتويج ملكي بتاج الذهب الخالص!',
    xpBonus: 80,
    gradient: 'from-amber-400/25 to-yellow-900/30',
  },
  {
    id: 'g_heart',
    name: 'قلب',
    coins: 30,
    category: 'all',
    icon: '❤️',
    xpBonus: 25,
    gradient: 'from-rose-500/20 to-rose-900/30',
  },
  {
    id: 'g_rose',
    name: 'وردة',
    coins: 50,
    category: 'all',
    icon: '🌹',
    xpBonus: 40,
    gradient: 'from-red-500/20 to-pink-900/30',
  },
  {
    id: 'g_diamond',
    name: 'ألماس',
    coins: 400,
    category: 'vip',
    icon: '💎',
    isAnimatedHd: true,
    animationTitle: 'بريق الألماس الملكي يتلألأ في المجلس!',
    xpBonus: 220,
    gradient: 'from-sky-400/25 to-indigo-950/40',
  },
  {
    id: 'g_coffee',
    name: 'قهوة عربية',
    coins: 120,
    category: 'seasonal',
    icon: '☕',
    xpBonus: 90,
    gradient: 'from-amber-600/20 to-stone-900/40',
  },
  {
    id: 'g_mic',
    name: 'ميكروفون ذهبي',
    coins: 80,
    category: 'seasonal',
    icon: '🎙️',
    xpBonus: 60,
    gradient: 'from-purple-500/25 to-indigo-950/40',
  },
  {
    id: 'g_star',
    name: 'نجمة',
    coins: 300,
    category: 'seasonal',
    icon: '⭐',
    xpBonus: 160,
    gradient: 'from-yellow-400/25 to-amber-950/40',
  },
  {
    id: 'g_special',
    name: 'هدية خاصة',
    coins: 999,
    category: 'seasonal',
    icon: '🎁',
    isAnimatedHd: true,
    animationTitle: 'صندوق المفاجآت الملكي الفاخر!',
    xpBonus: 480,
    gradient: 'from-fuchsia-500/25 to-purple-950/40',
  },
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n1',
    category: 'gifts',
    title: 'أهدى لك صقر اليمن وردة',
    timeAgo: 'منذ 2 دقيقة',
    icon: '🌹',
    accent: 'border-rose-500/40 bg-rose-500/10',
  },
  {
    id: 'n2',
    category: 'follows',
    title: 'أضافك صقر اليمن كصديق في مجلسنا',
    timeAgo: 'منذ 5 دقائق',
    icon: '🤝',
    accent: 'border-cyan-500/40 bg-cyan-500/10',
  },
  {
    id: 'n3',
    category: 'system',
    title: 'أرسل لك خالد رسالة في الدردشة الخاصة',
    timeAgo: 'منذ 10 دقائق',
    icon: '💬',
    accent: 'border-purple-500/40 bg-purple-500/10',
  },
  {
    id: 'n4',
    category: 'system',
    title: 'ارتفع مستواك إلى المستوى 5 (عضو مميز)',
    timeAgo: 'منذ 20 دقيقة',
    icon: '⭐',
    accent: 'border-amber-500/40 bg-amber-500/10',
  },
];

export const INITIAL_CONVERSATIONS: DirectConversation[] = [
  {
    id: 'c1',
    playerId: 'MJ-77501',
    name: 'صقر اليمن',
    avatar: heroLoungeImg,
    level: 25,
    isFriend: true,
    lastMessage: 'كيف حالك يا صديقي؟',
    time: '10:24',
    unreadCount: 0,
    isVip: true,
    messages: [
      { fromMe: false, text: 'السلام عليكم يا الأمير، كيف حالك؟', time: '10:22' },
      { fromMe: true, text: 'وعليكم السلام ورحمة الله، حياك الله في مجلسنا!', time: '10:23' },
      { fromMe: false, text: 'كيف حالك يا صديقي؟', time: '10:24' },
    ],
  },
  {
    id: 'c2',
    playerId: 'MJ-20491',
    name: 'خالد',
    avatar: avatarHoodedVipImg,
    level: 18,
    isFriend: false,
    lastMessage: 'أهلاً وسهلاً بك في المجلس',
    time: '09:12',
    unreadCount: 2,
    isVip: true,
    messages: [
      { fromMe: false, text: 'أهلاً وسهلاً بك في غرفة شباب', time: '09:12' },
    ],
  },
  {
    id: 'c3',
    playerId: 'MJ-33910',
    name: 'المحترف',
    avatar: roomMusicImg,
    level: 14,
    isFriend: false,
    lastMessage: 'شكراً لك على الهدية',
    time: 'أمس',
    unreadCount: 0,
    messages: [
      { fromMe: true, text: 'أبدعت اليوم في المجلس الصوتي', time: 'أمس' },
      { fromMe: false, text: 'شكراً لك على الهدية', time: 'أمس' },
    ],
  },
  {
    id: 'c4',
    playerId: 'MJ-44821',
    name: 'الجنوبي',
    avatar: roomPoetryImg,
    level: 12,
    isFriend: true,
    lastMessage: 'أرسلت لك هدية 🦁',
    time: 'أمس',
    unreadCount: 0,
    messages: [
      { fromMe: false, text: 'أرسلت لك هدية 🦁', time: 'أمس' },
    ],
  },
  {
    id: 'c5',
    playerId: 'MJ-55102',
    name: 'الطيب',
    avatar: heroLoungeImg,
    level: 9,
    isFriend: true,
    lastMessage: 'موجود؟ نبي نفتح مجلس',
    time: 'السبت',
    unreadCount: 0,
    messages: [
      { fromMe: false, text: 'موجود؟ نبي نفتح مجلس شعر', time: 'السبت' },
    ],
  },
];

export const TOPUP_PACKAGES: CoinTopupPackage[] = [
  {
    id: 1,
    title: 'باقة البداية (10,000 كوينز)',
    coins: 10000,
    bonus: 0,
    price: '25 ريال سعودي',
  },
  {
    id: 2,
    title: 'الباقة الفضية (25,000 كوينز)',
    coins: 25000,
    bonus: 0,
    price: '50 ريال سعودي',
  },
  {
    id: 3,
    title: 'الباقة الذهبية (60,000 كوينز)',
    coins: 60000,
    bonus: 0,
    price: '100 ريال سعودي',
    popular: true,
  },
  {
    id: 4,
    title: 'باقة التميز (140,000 كوينز)',
    coins: 140000,
    bonus: 0,
    price: '200 ريال سعودي',
  },
  {
    id: 5,
    title: 'باقة الأمراء (350,000 كوينز)',
    coins: 350000,
    bonus: 0,
    price: '500 ريال سعودي',
    popular: true,
  },
  {
    id: 6,
    title: 'باقة الملوك (750,000 كوينز)',
    coins: 750000,
    bonus: 0,
    price: '1000 ريال سعودي',
  },
  {
    id: 7,
    title: 'الباقة المليونية (1,500,000 كوينز)',
    coins: 1500000,
    bonus: 0,
    price: '1500 ريال سعودي',
    popular: true,
  },
  {
    id: 8,
    title: 'باقة الإمبراطور (2,000,000 كوينز)',
    coins: 2000000,
    bonus: 0,
    price: '2000 ريال سعودي',
    popular: true,
  },
];
