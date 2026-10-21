/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Send,
  Gift,
  Coins,
  Users,
  Volume2,
  VolumeX,
  ShoppingBag,
  X,
  MessageSquare,
  Bell,
  Search,
  Home,
  MoreHorizontal,
  User,
  Heart,
  Settings,
  HelpCircle,
  LogOut,
  ChevronLeft,
  Lock,
  Phone,
  Globe,
  Moon,
  Info,
  Smile,
  Edit3,
  Plus,
  Crown,
  Sparkles,
  Check,
  Flame,
  Menu,
  Download,
  Share2,
  Copy,
  Smartphone,
  UserPlus,
  UserCheck,
  Award,
  Hash,
  Radio,
} from 'lucide-react';
import {
  APP_IMAGES,
  WHATSAPP_NUMBER,
  ScreenName,
  RoomInfo,
  RoomTopicCategory,
  ROOM_CATEGORIES,
  SeatMember,
  GiftCatalogItem,
  NotificationItem,
  DirectConversation,
  INITIAL_ROOMS,
  INITIAL_SEATS,
  GIFTS_LIST,
  INITIAL_NOTIFICATIONS,
  INITIAL_CONVERSATIONS,
  TOPUP_PACKAGES,
  LEVEL_TIERS,
  ANIMATED_BACKGROUNDS,
} from './majlisData';
import { usePWAInstall, SHARED_APP_URL } from './usePWAInstall';
import GreedyCatGame, { ArcadeGameTabId } from './components/GreedyCatGame';
import { AnimatedCoinCounter } from './components/AnimatedCoinCounter';
import GoogleWorkspaceHub, {
  WorkspaceSubTabId,
} from './components/GoogleWorkspaceHub';
import { AgoraVoiceSettingsModal } from './components/AgoraVoiceSettingsModal';
import { GoogleContactsModal } from './components/GoogleContactsModal';
import {
  agoraVoiceService,
  AgoraVoiceStatus,
} from './services/agoraVoiceService';
import { firebaseMajlisService } from './services/firebaseMajlisService';
import { auth, googleWorkspaceSignIn } from './firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

interface RoomChatMessage {
  id: string;
  sender: string;
  senderId: string;
  senderLevel: number;
  avatar: string;
  text: string;
  isVip?: boolean;
  isGift?: boolean;
}

interface ActiveHdGiftAnimation {
  gift: GiftCatalogItem;
  senderName: string;
  recipientName: string;
}

export default function MajlisnaApp() {
  const { isInstallable, isInstalled, install } = usePWAInstall();

  // Navigation & Modals State
  const [screen, setScreen] = useState<ScreenName>('home');
  const [workspaceSubTab, setWorkspaceSubTab] =
    useState<WorkspaceSubTabId>('drive');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [showLevelsModal, setShowLevelsModal] = useState(false);
  const [showAnimatedBgModal, setShowAnimatedBgModal] = useState(false);
  const [inspectedPlayer, setInspectedPlayer] = useState<SeatMember | null>(null);
  const [activeHdAnimation, setActiveHdAnimation] =
    useState<ActiveHdGiftAnimation | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Agora Voice & Firebase Real-time State
  const [showAgoraModal, setShowAgoraModal] = useState(false);
  const [showContactsModal, setShowContactsModal] = useState(false);
  const [agoraStatus, setAgoraStatus] =
    useState<AgoraVoiceStatus>('disconnected');
  const [speakingSeatIndices, setSpeakingSeatIndices] = useState<number[]>([]);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);

  // User Profile, Player ID & Coin Recharge Level Progression State (Lv.1 -> Lv.9)
  const [userName, setUserName] = useState('ابراهيم مطر');
  const [myPlayerId] = useState('MJ-88420');
  const [totalRechargedCoins, setTotalRechargedCoins] = useState<number>(10000);
  const [activeAnimatedBgId, setActiveAnimatedBgId] = useState<string>('royal_gold_nebula');
  const [customAnimatedBgUrl, setCustomAnimatedBgUrl] = useState<string>('');
  const [userFollowers, setUserFollowers] = useState(1240);
  const [userFollowing] = useState(980);
  const [userBio, setUserBio] = useState(
    'محتوى : أحب مجالس الصوت و النقاشات الهادفة'
  );
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [coins, setCoins] = useState(12450);

  // Compute exact level (0 to 9) from totalRechargedCoins based on user's thresholds:
  // 10,000 -> Lv.1 | 100,000 -> Lv.2 | 200,000 -> Lv.3 | 300,000 -> Lv.4 | 450,000 -> Lv.5
  // 550,000 -> Lv.6 | 750,000 -> Lv.7 | 900,000 -> Lv.8 | 1,100,000 -> Lv.9
  const computeLevelFromRecharge = (recharged: number): number => {
    if (recharged >= 1100000) return 9;
    if (recharged >= 900000) return 8;
    if (recharged >= 750000) return 7;
    if (recharged >= 550000) return 6;
    if (recharged >= 450000) return 5;
    if (recharged >= 300000) return 4;
    if (recharged >= 200000) return 3;
    if (recharged >= 100000) return 2;
    if (recharged >= 10000) return 1;
    return 0;
  };

  const userLevel = computeLevelFromRecharge(totalRechargedCoins);
  const canUseAnimatedBg = userLevel >= 9;

  const nextTier = LEVEL_TIERS.find(
    (t) => t.requiredRechargedCoins > totalRechargedCoins
  );
  const nextLevelCoinsTarget = nextTier
    ? nextTier.requiredRechargedCoins
    : 1100000;

  const selectedAnimatedBg =
    ANIMATED_BACKGROUNDS.find((bg) => bg.id === activeAnimatedBgId) ||
    ANIMATED_BACKGROUNDS[1];

  // Compute rank title based on userLevel (0 to 9)
  const getRankTitle = (lvl: number) => {
    const found = LEVEL_TIERS.find((t) => t.level === lvl);
    if (found) return found.title;
    if (lvl >= 9) return 'المستوى 9 — إمبراطور توب شات الأسطوري';
    return 'عضو جديد (اشحن 10,000 للمستوى 1)';
  };

  // Friends List (Player IDs)
  const [friendIds, setFriendIds] = useState<string[]>([
    'MJ-10001',
    'MJ-77501',
    'MJ-44821',
    'MJ-55102',
  ]);
  const [searchIdQuery, setSearchIdQuery] = useState('');

  // Auth inputs
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [regNickname, setRegNickname] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');

  // Splash loading bar
  const [splashProgress, setSplashProgress] = useState(65);

  // Rooms, Category Filter & Search State
  const [rooms, setRooms] = useState<RoomInfo[]>(INITIAL_ROOMS);
  const [selectedGameTab, setSelectedGameTab] =
    useState<ArcadeGameTabId>('greedy_cat');
  const [selectedRoomCategory, setSelectedRoomCategory] =
    useState<RoomTopicCategory>('all');
  const [homeSearch, setHomeSearch] = useState('');
  const [activeRoom, setActiveRoom] = useState<RoomInfo>(INITIAL_ROOMS[0]);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomCategory, setNewRoomCategory] =
    useState<Exclude<RoomTopicCategory, 'all'>>('discussion');
  const [newRoomDesc, setNewRoomDesc] = useState('');

  const getRoomCategoryMeta = (catId: RoomTopicCategory) =>
    ROOM_CATEGORIES.find((c) => c.id === catId) || ROOM_CATEGORIES[0];

  // Inside Voice Room State (Side-by-Side 8 Mics)
  const [seats, setSeats] = useState<SeatMember[]>(INITIAL_SEATS);
  const [myMicMuted, setMyMicMuted] = useState(false);
  const [speakerMuted, setSpeakerMuted] = useState(false);
  const [roomInput, setRoomInput] = useState('');
  const [roomChat, setRoomChat] = useState<RoomChatMessage[]>([
    {
      id: 'm1',
      sender: 'أبو خالد',
      senderId: 'MJ-19200',
      senderLevel: 22,
      avatar: APP_IMAGES.avatarHoodedVip,
      text: 'أهلاً وسهلاً بالجميع في مجلسنا',
      isVip: true,
    },
    {
      id: 'm2',
      sender: 'المحترف',
      senderId: 'MJ-33910',
      senderLevel: 14,
      avatar: APP_IMAGES.roomMusic,
      text: 'ترتيب المايكات جنب بعض صار أروع وأوضح 🔥',
    },
    {
      id: 'm3',
      sender: 'صقر اليمن',
      senderId: 'MJ-77501',
      senderLevel: 25,
      avatar: APP_IMAGES.heroLounge,
      text: 'مبدعين يا أهل المجلس 👏 معرفي MJ-77501 ضيفوني صديق',
      isVip: true,
    },
  ]);

  // Gifts Screen State
  const [giftFilter, setGiftFilter] = useState<'all' | 'vip' | 'seasonal'>('all');
  const [selectedGift, setSelectedGift] = useState<GiftCatalogItem>(
    GIFTS_LIST[0]
  ); // HD Golden Lion default
  const [giftRecipient, setGiftRecipient] = useState('صقر اليمن');

  // Notifications Screen State
  const [notifFilter, setNotifFilter] = useState<
    'all' | 'gifts' | 'follows' | 'system'
  >('all');
  const [notifications, setNotifications] = useState<NotificationItem[]>(
    INITIAL_NOTIFICATIONS
  );

  // Private Chat / Messages Screen State
  const [msgFilter, setMsgFilter] = useState<'all' | 'friends' | 'unread'>(
    'all'
  );
  const [msgSearch, setMsgSearch] = useState('');
  const [conversations, setConversations] = useState<DirectConversation[]>(
    INITIAL_CONVERSATIONS
  );
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [directInput, setDirectInput] = useState('');

  // Settings State
  const [darkMode, setDarkMode] = useState(true);
  const [language, setLanguage] = useState<'العربية' | 'English'>('العربية');
  const [notifEnabled, setNotifEnabled] = useState(true);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  // Recharge coins & automatically compute new player level (Lv.1 -> Lv.9)
  const handleApplyCoinRecharge = (rechargedAmount: number) => {
    const oldLvl = computeLevelFromRecharge(totalRechargedCoins);
    const updatedTotal = totalRechargedCoins + rechargedAmount;
    const newLvl = computeLevelFromRecharge(updatedTotal);

    setTotalRechargedCoins(updatedTotal);
    setCoins((prev) => prev + rechargedAmount);

    if (newLvl > oldLvl) {
      const unlockedMsg =
        newLvl >= 9
          ? `👑 مبارك! وصلت إلى المستوى 9 (إمبراطور توب شات) وتم فتح ميزة الخلفية المتحركة الحصرية!`
          : `🎉 مبارك! وصلت إلى المستوى ${newLvl} (${getRankTitle(newLvl)}) بعد شحن ${updatedTotal.toLocaleString('en-US')} كوينز!`;
      showToast(unlockedMsg);

      setNotifications((prev) => [
        {
          id: `lvl_${Date.now()}`,
          category: 'system',
          title: unlockedMsg,
          timeAgo: 'الآن',
          icon: newLvl >= 9 ? '👑' : '⭐',
          accent: 'border-[#FFD700]/60 bg-[#FFD700]/15',
        },
        ...prev,
      ]);
    } else {
      showToast(
        `✅ تم شحن ${rechargedAmount.toLocaleString('en-US')} كوينز بنجاح! إجمالي شحنك: ${updatedTotal.toLocaleString('en-US')}`
      );
    }
  };

  // Set player recharge directly to a target level's threshold
  const handleJumpToRechargeMilestone = (targetCoins: number, levelNum: number) => {
    const diff = Math.max(0, targetCoins - totalRechargedCoins);
    setTotalRechargedCoins(targetCoins);
    if (diff > 0) {
      setCoins((c) => c + diff);
    }
    if (levelNum >= 9) {
      showToast(
        '👑 وصلت إلى المستوى 9 (1,100,000 كوينز)! يمكنك الآن تخصيص خلفية متحركة لحسابك وغرفتك!'
      );
    } else {
      showToast(
        `⭐ تم الوصول إلى شحن ${targetCoins.toLocaleString('en-US')} كوينز (المستوى ${levelNum})!`
      );
    }
  };

  const addExperience = (_xpAmount: number) => {
    // Levels 1-9 are driven by coin recharge milestones (10,000 to 1,100,000)
  };

  // Add / Remove Friend ("أضفتك كصديق")
  const handleToggleFriend = (
    targetPlayerId: string,
    targetName: string,
    targetAvatar: string,
    targetLevel: number
  ) => {
    if (!targetPlayerId) return;
    const alreadyFriend = friendIds.includes(targetPlayerId);

    if (alreadyFriend) {
      setFriendIds((prev) => prev.filter((id) => id !== targetPlayerId));
      showToast(`تم إلغاء الصداقة مع ${targetName}`);
      return;
    }

    setFriendIds((prev) => [...prev, targetPlayerId]);
    setUserFollowers((f) => f + 1);
    addExperience(50);

    // Ensure a private chat conversation exists and send "أضفتك كصديق 🤝"
    setConversations((prev) => {
      const existing = prev.find(
        (c) => c.playerId === targetPlayerId || c.name === targetName
      );
      if (existing) {
        return prev.map((c) =>
          c.id === existing.id
            ? {
                ...c,
                isFriend: true,
                lastMessage: 'أضفتك كصديق في توب شات 🤝',
                time: 'الآن',
                messages: [
                  ...c.messages,
                  {
                    fromMe: true,
                    text: `أضفتك كصديق في توب شات 🤝 (معرفي: ${myPlayerId})`,
                    time: 'الآن',
                  },
                ],
              }
            : c
        );
      }
      const newConv: DirectConversation = {
        id: `conv_${Date.now()}`,
        playerId: targetPlayerId,
        name: targetName,
        avatar: targetAvatar || APP_IMAGES.avatarHoodedVip,
        level: targetLevel || 10,
        isFriend: true,
        lastMessage: 'أضفتك كصديق في توب شات 🤝',
        time: 'الآن',
        unreadCount: 0,
        isVip: true,
        messages: [
          {
            fromMe: true,
            text: `مرحباً ${targetName}، أضفتك كصديق في توب شات 🤝 (معرفي: ${myPlayerId})`,
            time: 'الآن',
          },
        ],
      };
      return [newConv, ...prev];
    });

    // Also broadcast in room chat & notifications
    setRoomChat((prev) => [
      ...prev,
      {
        id: `fr_${Date.now()}`,
        sender: userName,
        senderId: myPlayerId,
        senderLevel: userLevel,
        avatar: APP_IMAGES.avatarHoodedVip,
        text: `🤝 أضفتك كصديقي يا «${targetName}» (ID: ${targetPlayerId})`,
        isVip: true,
      },
    ]);

    setNotifications((prev) => [
      {
        id: `nf_${Date.now()}`,
        category: 'follows',
        title: `أضفت ${targetName} (${targetPlayerId}) كصديق لك (+50 XP)`,
        timeAgo: 'الآن',
        icon: '🤝',
        accent: 'border-emerald-500/40 bg-emerald-500/10',
      },
      ...prev,
    ]);

    showToast(`🤝 أضفت «${targetName}» كصديق بنجاح (+50 نقطة مستوى)!`);
  };

  // Open direct private chat with a specific player
  const openPrivateChatWithPlayer = (
    targetPlayerId: string,
    targetName: string,
    targetAvatar: string,
    targetLevel: number
  ) => {
    let targetConv = conversations.find(
      (c) => c.playerId === targetPlayerId || c.name === targetName
    );
    if (!targetConv) {
      targetConv = {
        id: `conv_${Date.now()}`,
        playerId: targetPlayerId,
        name: targetName,
        avatar: targetAvatar || APP_IMAGES.avatarHoodedVip,
        level: targetLevel || 10,
        isFriend: friendIds.includes(targetPlayerId),
        lastMessage: 'بدأت دردشة خاصة جديدة',
        time: 'الآن',
        unreadCount: 0,
        isVip: true,
        messages: [
          {
            fromMe: false,
            text: `أهلاً بك يا ${userName} في الدردشة الخاصة!`,
            time: 'الآن',
          },
        ],
      };
      setConversations((prev) => [targetConv!, ...prev]);
    }
    setInspectedPlayer(null);
    setActiveConversationId(targetConv.id);
    setScreen('messages');
  };

  // Auto-advance splash screen when selected
  useEffect(() => {
    if (screen !== 'splash') return;
    setSplashProgress(25);
    const t1 = setTimeout(() => setSplashProgress(75), 500);
    const t2 = setTimeout(() => setSplashProgress(100), 1100);
    const t3 = setTimeout(() => setScreen('login'), 1500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [screen]);

  // Global Firebase Auth & Agora Voice Volume & Firestore Rooms Sync
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setFirebaseUser(u);
      if (u?.displayName) {
        setUserName(u.displayName);
      }
    });

    const unsubAgoraStatus = agoraVoiceService.onStatusChange((st) => {
      setAgoraStatus(st);
    });

    // Real-time Agora volume indicator (lights up green rings around speaking seats)
    const unsubAgoraVol = agoraVoiceService.onVolumeChange((volumes) => {
      const activeIdxs: number[] = [];
      volumes.forEach((v) => {
        if (v.level > 15) {
          const mySeatIdx = seats.findIndex(
            (s) => s.occupied && s.name === userName
          );
          if (mySeatIdx >= 0 && !activeIdxs.includes(mySeatIdx)) {
            activeIdxs.push(mySeatIdx);
          }
          if (
            typeof v.uid === 'number' &&
            v.uid >= 0 &&
            v.uid < 8 &&
            !activeIdxs.includes(v.uid)
          ) {
            activeIdxs.push(v.uid);
          }
        }
      });
      setSpeakingSeatIndices(activeIdxs);
    });

    return () => {
      unsubAuth();
      unsubAgoraStatus();
      unsubAgoraVol();
    };
  }, [userName, seats]);

  // Real-time synchronization of rooms from Firestore (Only when authenticated)
  useEffect(() => {
    if (!firebaseUser) return;
    let unsubRooms: (() => void) | undefined;
    try {
      unsubRooms = firebaseMajlisService.subscribeRooms((fsRooms) => {
        if (fsRooms && fsRooms.length > 0) {
          setRooms((prev) => {
            const map = new Map<string, RoomInfo>();
            prev.forEach((r) => map.set(r.id, r));
            fsRooms.forEach((fs) => {
              map.set(fs.roomId, {
                id: fs.roomId,
                roomCode:
                  fs.roomId.replace('room_', '').slice(0, 5) || '88420',
                title: fs.title,
                category: 'active',
                topicCategory:
                  String(fs.category).includes('شعر')
                    ? 'poetry'
                    : String(fs.category).includes('ألعاب')
                    ? 'games'
                    : String(fs.category).includes('سوالف')
                    ? 'entertainment'
                    : 'discussion',
                listenersCount: `${fs.speakerCount || 1} متحدث`,
                activeMicsCount: fs.speakerCount || 1,
                description: fs.topic || 'مجلس عام',
                cover: APP_IMAGES.goldMicBanner,
                badgeIcon: 'crown',
                hostName: fs.hostName,
                isFeatured: true,
              });
            });
            return Array.from(map.values());
          });
        }
      });
    } catch {
      // safe fallback
    }

    return () => {
      if (unsubRooms) unsubRooms();
    };
  }, [firebaseUser]);

  // Real-time Room Sync (Agora Voice RTC + Firestore Chat & Seats)
  useEffect(() => {
    if (screen !== 'room' || !activeRoom) return;

    // Join Agora Voice Channel (Simulated mode if no App ID)
    agoraVoiceService.joinRoom(
      activeRoom.roomCode || activeRoom.id,
      firebaseUser?.uid || myPlayerId
    );

    let unsubMsgs: (() => void) | undefined;
    let unsubSeats: (() => void) | undefined;

    // Only subscribe to Firestore if authenticated
    if (firebaseUser) {
      try {
        unsubMsgs = firebaseMajlisService.subscribeMessages(
          activeRoom.id,
          (fsMsgs) => {
            if (fsMsgs && fsMsgs.length > 0) {
              setRoomChat(
                fsMsgs.map((m) => ({
                  id: m.id || `m_${Date.now()}`,
                  sender: m.senderName,
                  senderId: m.senderId,
                  senderLevel: 10,
                  avatar: m.senderPhoto || APP_IMAGES.avatarHoodedVip,
                  text: m.text,
                  isVip: m.senderVipTier !== 'member',
                  isGift: m.type === 'gift',
                }))
              );
            }
          }
        );
      } catch {
        // safe fallback
      }

      try {
        unsubSeats = firebaseMajlisService.subscribeSeats(
          activeRoom.id,
          (fsSeats) => {
            if (fsSeats && fsSeats.length > 0) {
              setSeats((prev) =>
                prev.map((s, idx) => {
                  const fsSeat = fsSeats.find((f) => f.seatIndex === idx);
                  if (fsSeat) {
                    return {
                      ...s,
                      occupied: true,
                      name: fsSeat.displayName,
                      playerId: fsSeat.uid,
                      avatar:
                        fsSeat.photoURL || s.avatar || APP_IMAGES.avatarHoodedVip,
                      isMuted: fsSeat.isMuted,
                      isVip: fsSeat.vipTier !== 'member',
                    };
                  }
                  return s;
                })
              );
            }
          }
        );
      } catch {
        // safe fallback
      }
    }

    return () => {
      agoraVoiceService.leaveRoom();
      if (unsubMsgs) unsubMsgs();
      if (unsubSeats) unsubSeats();
    };
  }, [screen, activeRoom.id, firebaseUser, myPlayerId]);

  // WhatsApp Topup Action (+967776551633)
  const buyCoinsViaWhatsapp = (pkgCoins: number, price: string) => {
    const text = `مرحباً، أود شراء باقة ${pkgCoins} كوينز بسعر ${price} في تطبيق توب شات (حساب: ${userName} - معرف اللاعب ID: ${myPlayerId}).`;
    const link = document.createElement('a');
    link.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Enter a voice room
  const openVoiceRoom = (room: RoomInfo) => {
    setActiveRoom(room);
    setScreen('room');
    agoraVoiceService.joinRoom(room.roomCode || room.id, myPlayerId);
  };

  // Click on a microphone seat in the side-by-side grid
  const handleSeatClick = (seat: SeatMember) => {
    if (seat.occupied && seat.name !== userName) {
      // Open Player Card (shows Player ID, Level, Add Friend, Private Chat, Gift)
      setInspectedPlayer(seat);
      setGiftRecipient(seat.name);
      return;
    }

    const seatIdx = seat.id - 1;
    if (seat.occupied && seat.name === userName) {
      showToast('تم النزول من المايك');
      agoraVoiceService.unpublishMic();
      if (firebaseUser) {
        firebaseMajlisService.leaveSeat(activeRoom.id, seatIdx).catch(() => {});
      }
      setSeats((prev) =>
        prev.map((s) => {
          if (s.id !== seat.id) return s;
          return {
            ...s,
            occupied: false,
            name: '',
            playerId: '',
            avatar: '',
          };
        })
      );
      return;
    }

    showToast(`صعدت إلى ${seat.roleLabel} 🎙️ (جاري بث الصوت عبر Agora)`);
    agoraVoiceService.publishMic();
    if (firebaseUser) {
      firebaseMajlisService
        .takeSeat(activeRoom.id, seatIdx, {
          uid: firebaseUser.uid,
          displayName: userName,
          photoURL: APP_IMAGES.avatarHoodedVip,
          vipTier: 'royal',
        })
        .catch(() => {});
    }

    setSeats((prev) =>
      prev.map((s) => {
        if (s.id !== seat.id) return s;
        return {
          ...s,
          occupied: true,
          name: userName,
          playerId: myPlayerId,
          level: userLevel,
          avatar: APP_IMAGES.avatarHoodedVip,
          isVip: true,
        };
      })
    );
  };

  // Toggle local microphone in Agora and update UI/Firestore
  const handleToggleMyMic = () => {
    const next = !myMicMuted;
    setMyMicMuted(next);
    agoraVoiceService.setMuted(next);
    const mySeatIdx = seats.findIndex((s) => s.occupied && s.name === userName);
    if (mySeatIdx >= 0 && firebaseUser) {
      firebaseMajlisService
        .toggleSeatMute(activeRoom.id, mySeatIdx, next)
        .catch(() => {});
    }
    showToast(
      next ? 'تم كتم الميكروفون' : 'الميكروفون مفتوح الآن (بث Agora نشط)'
    );
  };

  // Toggle speaker in Agora
  const handleToggleSpeaker = () => {
    const next = !speakerMuted;
    setSpeakerMuted(next);
    agoraVoiceService.setSpeakerMuted(next);
    showToast(next ? 'تم كتم السماعة' : 'تم تشغيل السماعة');
  };

  // Google sign in helper with Firebase user sync
  const handleGoogleSignIn = async () => {
    try {
      const res = await googleWorkspaceSignIn();
      if (res?.user) {
        setFirebaseUser(res.user);
        if (res.user.displayName) {
          setUserName(res.user.displayName);
        }
        firebaseMajlisService
          .syncUserProfile(res.user.uid, {
            displayName: res.user.displayName || userName,
            photoURL: res.user.photoURL || undefined,
            coins,
          })
          .catch(() => {});
        setScreen('home');
        showToast(`مرحباً بك ${res.user.displayName || userName} عبر Google!`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(msg || 'تعذر تسجيل الدخول بـ Google');
    }
  };

  // Send message inside the Voice Room
  const handleSendRoomMessage = () => {
    const trimmed = roomInput.trim();
    if (!trimmed) return;
    const newMsg: RoomChatMessage = {
      id: `m_${Date.now()}`,
      sender: userName,
      senderId: myPlayerId,
      senderLevel: userLevel,
      avatar: APP_IMAGES.avatarHoodedVip,
      text: trimmed,
      isVip: true,
    };
    setRoomChat((prev) => [...prev, newMsg]);
    setRoomInput('');
    addExperience(15);

    // Sync to Firestore real-time room chat if authenticated
    if (firebaseUser) {
      firebaseMajlisService
        .sendMessage(activeRoom.id, {
          senderId: firebaseUser.uid,
          senderName: userName,
          senderPhoto: APP_IMAGES.avatarHoodedVip,
          senderVipTier: 'royal',
          text: trimmed,
          type: 'chat',
        })
        .catch(() => {});
    }
  };

  // Trigger HD Animated Gift & Deduct Coins + Add XP
  const triggerGiftSend = (gift: GiftCatalogItem, recipient: string) => {
    if (coins < gift.coins) {
      setShowTopupModal(true);
      showToast('رصيدك غير كافٍ، اشحن الكوينز الآن عبر الواتساب');
      return;
    }

    setCoins((c) => c - gift.coins);
    addExperience(gift.xpBonus);

    const giftMsgText = `أهدى ${gift.icon} ${gift.name} (${gift.coins} كوينز) إلى ${recipient} (+${gift.xpBonus} XP)`;
    const giftMsg: RoomChatMessage = {
      id: `gift_${Date.now()}`,
      sender: userName,
      senderId: myPlayerId,
      senderLevel: userLevel,
      avatar: APP_IMAGES.avatarHoodedVip,
      text: giftMsgText,
      isVip: true,
      isGift: true,
    };
    setRoomChat((prev) => [...prev, giftMsg]);

    // Sync gift broadcast to Firestore if authenticated
    if (firebaseUser) {
      firebaseMajlisService
        .sendMessage(activeRoom.id, {
          senderId: firebaseUser.uid,
          senderName: userName,
          senderPhoto: APP_IMAGES.avatarHoodedVip,
          senderVipTier: 'royal',
          text: giftMsgText,
          type: 'gift',
          giftName: gift.name,
          giftCoins: gift.coins,
          recipientName: recipient,
        })
        .catch(() => {});
    }

    setNotifications((prev) => [
      {
        id: `n_${Date.now()}`,
        category: 'gifts',
        title: `أرسلت هدية ${gift.name} إلى ${recipient} (+${gift.xpBonus} XP)`,
        timeAgo: 'الآن',
        icon: gift.icon,
        accent: 'border-amber-500/40 bg-amber-500/10',
      },
      ...prev,
    ]);

    setScreen('room');

    // Launch Full-Screen High-Definition Animated Gift Overlay
    setActiveHdAnimation({
      gift,
      senderName: userName,
      recipientName: recipient,
    });

    setTimeout(() => {
      setActiveHdAnimation((current) =>
        current?.gift.id === gift.id ? null : current
      );
    }, 4500);
  };

  // Create new room handler
  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;
    const catMeta = getRoomCategoryMeta(newRoomCategory);
    const created: RoomInfo = {
      id: `room_${Date.now()}`,
      roomCode: `${Math.floor(10000 + Math.random() * 89999)}`,
      title: newRoomName.trim(),
      category: 'active',
      topicCategory: newRoomCategory,
      listenersCount: '1 مستمع',
      activeMicsCount: 1,
      description:
        newRoomDesc.trim() || `${catMeta.label} — بإدارة ${userName}`,
      cover:
        newRoomCategory === 'music'
          ? APP_IMAGES.roomMusic
          : newRoomCategory === 'poetry'
          ? APP_IMAGES.roomPoetry
          : APP_IMAGES.goldMicBanner,
      badgeIcon: 'crown',
      hostName: userName,
      isFeatured: true,
    };
    setRooms((prev) => [created, ...prev]);

    // Persist new voice room to Firestore if authenticated
    if (firebaseUser) {
      firebaseMajlisService
        .createVoiceRoom({
          roomId: created.id,
          title: created.title,
          topic: created.description,
          category: 'عام',
          hostId: firebaseUser.uid,
          hostName: userName,
        })
        .catch(() => {});
    }

    setNewRoomName('');
    setNewRoomDesc('');
    setSelectedRoomCategory('all');
    setShowCreateRoomModal(false);
    openVoiceRoom(created);
    showToast(`تم افتتاح غرفتك في قسم «${catMeta.shortLabel}» بنجاح!`);
  };

  // Send direct private message
  const handleSendDirectMessage = () => {
    if (!directInput.trim() || !activeConversationId) return;
    const text = directInput.trim();
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== activeConversationId) return c;
        return {
          ...c,
          lastMessage: text,
          time: 'الآن',
          messages: [...c.messages, { fromMe: true, text, time: 'الآن' }],
        };
      })
    );
    setDirectInput('');
    addExperience(10);
  };

  // Add friend by Player ID search
  const handleAddFriendById = (e: React.FormEvent) => {
    e.preventDefault();
    const code = searchIdQuery.trim().toUpperCase();
    if (!code) return;
    const matchedSeat = seats.find(
      (s) => s.playerId.toUpperCase() === code || s.name.includes(searchIdQuery.trim())
    );
    if (matchedSeat && matchedSeat.occupied) {
      handleToggleFriend(
        matchedSeat.playerId,
        matchedSeat.name,
        matchedSeat.avatar,
        matchedSeat.level
      );
    } else {
      const normalizedId = code.startsWith('MJ-') ? code : `MJ-${code}`;
      handleToggleFriend(
        normalizedId,
        `صديق توب شات (${normalizedId})`,
        APP_IMAGES.avatarHoodedVip,
        8
      );
    }
    setSearchIdQuery('');
  };

  const activeConversation = conversations.find(
    (c) => c.id === activeConversationId
  );

  // Reusable Golden Crown Logo Header
  const BrandCrownLogo = ({ size = 'lg' }: { size?: 'sm' | 'lg' }) => (
    <div className="flex flex-col items-center select-none">
      <div className="relative flex items-center justify-center">
        <div className="absolute -inset-3 rounded-full bg-[#FFD700]/20 blur-md" />
        <Crown
          size={size === 'lg' ? 54 : 32}
          className="text-[#FFD700] fill-[#FFD700] drop-shadow-[0_0_12px_rgba(255,215,0,0.6)] relative"
        />
      </div>
      <h1
        className={`${
          size === 'lg' ? 'text-4xl mt-1' : 'text-2xl mt-0.5'
        } font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-[#FFE57F] via-[#FFD700] to-[#CA8A04] tracking-wide`}
      >
        توب شات
      </h1>
      <p className="text-xs text-slate-300/90 mt-1">
        مكان يجمعنا .. و الصوت يوصلنا
      </p>
    </div>
  );

  return (
    <div
      className="min-h-screen w-full bg-[#0B1426] text-white font-sans flex flex-col items-center justify-start sm:py-3 select-none"
      dir="rtl"
    >
      {/* Quick Screen Switcher Bar */}
      <div className="w-full max-w-md px-2 py-2 flex items-center gap-1.5 overflow-x-auto text-[11px] bg-[#080F1A]/90 sm:rounded-t-2xl border-x border-t border-white/10">
        <span className="text-[#FFD700] font-bold shrink-0 ml-1">الشاشات:</span>
        {(
          [
            { id: 'home', label: 'الرئيسية' },
            { id: 'room', label: 'غرفة الصوت (مايكات متجاورة)' },
            { id: 'greedy_cat', label: '🐱 لعبة القط الجشع' },
            { id: 'workspace_hub', label: '🌐 Google Workspace (5)' },
            { id: 'gifts', label: 'الهدايا HD' },
            { id: 'messages', label: 'الدردشة الخاصة' },
            { id: 'profile', label: 'الملف والمستويات' },
            { id: 'notifications', label: 'الإشعارات' },
            { id: 'settings', label: 'الإعدادات' },
            { id: 'login', label: 'دخول' },
            { id: 'register', label: 'تسجيل' },
            { id: 'splash', label: 'البداية' },
          ] as { id: ScreenName; label: string }[]
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveConversationId(null);
              setScreen(tab.id);
            }}
            className={`px-2.5 py-1 rounded-full shrink-0 transition font-semibold ${
              screen === tab.id
                ? 'bg-gradient-to-r from-[#FFD700] to-[#F59E0B] text-[#080F1A]'
                : 'bg-[#121F36] text-slate-200 border border-white/10 hover:border-[#FFD700]/40'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Mobile Frame (#080F1A Deep Midnight Blue) */}
      <div className="w-full max-w-md min-h-[780px] flex-1 bg-[#080F1A] sm:rounded-b-[32px] border border-white/15 shadow-2xl relative overflow-hidden flex flex-col">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="absolute top-12 inset-x-5 z-50 bg-[#131F33]/95 border border-[#FFD700]/60 text-[#FFD700] px-4 py-2.5 rounded-2xl text-xs font-bold text-center shadow-2xl backdrop-blur-md animate-bounce">
            {toastMessage}
          </div>
        )}

        {/* =========================================================
            HIGH-DEFINITION ANIMATED GIFT OVERLAY (هدية متحركة بدقة عالية HD)
           ========================================================= */}
        {activeHdAnimation && (
          <div
            onClick={() => setActiveHdAnimation(null)}
            className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center cursor-pointer animate-fadeIn"
          >
            {/* Animated Golden & Cyan Glow Aura */}
            <div className="relative flex items-center justify-center">
              <div className="absolute -inset-10 rounded-full bg-gradient-to-r from-[#FFD700]/40 via-[#00D1FF]/30 to-[#6C63FF]/40 blur-2xl animate-pulse" />
              <div className="absolute -inset-4 rounded-3xl border-2 border-[#FFD700] animate-ping opacity-30" />

              {activeHdAnimation.gift.hdImage ? (
                <div className="relative w-64 h-64 rounded-3xl overflow-hidden border-2 border-[#FFD700] shadow-[0_0_60px_rgba(255,215,0,0.6)]">
                  <img
                    src={activeHdAnimation.gift.hdImage}
                    alt={activeHdAnimation.gift.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover scale-105 transition-transform duration-700"
                  />
                  <div className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full bg-black/75 border border-[#FFD700] text-[10px] font-extrabold text-[#FFD700]">
                    HD 8K متحركة ✨
                  </div>
                </div>
              ) : (
                <div className="relative w-48 h-48 rounded-full bg-gradient-to-b from-[#FFD700]/30 to-[#13223A] border-2 border-[#FFD700] flex items-center justify-center text-7xl shadow-[0_0_50px_rgba(255,215,0,0.5)] animate-bounce">
                  {activeHdAnimation.gift.icon}
                </div>
              )}
            </div>

            <div className="relative z-10 mt-6 space-y-2 max-w-xs">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#FFD700]/20 border border-[#FFD700] text-[#FFD700] text-xs font-extrabold">
                <Sparkles size={14} />
                <span>إهداء ملكي فائق الدقة</span>
              </div>

              <h2 className="text-xl font-extrabold text-white drop-shadow">
                {activeHdAnimation.gift.animationTitle ||
                  `هدية ${activeHdAnimation.gift.name} الفاخرة!`}
              </h2>

              <p className="text-xs text-slate-200">
                أهدى{' '}
                <strong className="text-[#FFD700]">
                  {activeHdAnimation.senderName}
                </strong>{' '}
                هدية{' '}
                <strong className="text-[#00D1FF]">
                  {activeHdAnimation.gift.name}
                </strong>{' '}
                إلى{' '}
                <strong className="text-[#FFD700]">
                  {activeHdAnimation.recipientName}
                </strong>
              </p>

              <div className="pt-2 flex items-center justify-center gap-3 text-xs font-bold">
                <span className="px-3 py-1 rounded-full bg-amber-500/20 text-[#FFD700] border border-[#FFD700]/40">
                  💰 {activeHdAnimation.gift.coins} كوينز
                </span>
                <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-200 border border-purple-400/40">
                  ⭐ +{activeHdAnimation.gift.xpBonus} XP مستوى
                </span>
              </div>

              <p className="text-[10px] text-slate-400 pt-3">
                اضغط في أي مكان للإغلاق
              </p>
            </div>
          </div>
        )}

        {/* =========================================================
            1. SPLASH SCREEN (شاشة التحميل)
           ========================================================= */}
        {screen === 'splash' && (
          <div className="relative flex-1 flex flex-col justify-between items-center p-8 overflow-hidden">
            <img
              src={APP_IMAGES.goldMicBanner}
              alt="توب شات"
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover opacity-55 scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#080F1A]/90 via-[#080F1A]/50 to-[#080F1A]" />

            <div className="relative z-10 mt-14">
              <BrandCrownLogo size="lg" />
            </div>

            <div className="relative z-10 my-auto flex flex-col items-center">
              <div className="w-44 h-44 rounded-full bg-gradient-to-b from-[#FFD700]/20 to-transparent border border-[#FFD700]/40 p-2 shadow-[0_0_40px_rgba(255,215,0,0.3)] overflow-hidden">
                <img
                  src={APP_IMAGES.goldMicBanner}
                  alt="ميكروفون توب شات الذهبي"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
            </div>

            <div className="relative z-10 w-full max-w-xs mb-6 text-center">
              <p className="text-xs text-slate-300 mb-2.5 font-medium">
                جاري التحميل...
              </p>
              <div className="w-full h-2.5 bg-[#111C2D] rounded-full overflow-hidden border border-[#FFD700]/30 p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-[#F59E0B] via-[#FFD700] to-[#FEF08A] rounded-full transition-all duration-500"
                  style={{ width: `${splashProgress}%` }}
                />
              </div>
              <button
                onClick={() => setScreen('home')}
                className="mt-4 text-[11px] text-[#FFD700] underline"
              >
                تخطي والدخول مباشرة
              </button>
            </div>
          </div>
        )}

        {/* =========================================================
            2. LOGIN SCREEN (تسجيل الدخول)
           ========================================================= */}
        {screen === 'login' && (
          <div className="flex-1 flex flex-col justify-between px-7 py-8 bg-gradient-to-b from-[#0B1528] via-[#080F1A] to-[#080F1A] overflow-y-auto">
            <div className="mt-4">
              <BrandCrownLogo size="lg" />
            </div>

            <div className="my-auto space-y-5 pt-6">
              <div className="text-center space-y-1">
                <h2 className="text-2xl font-bold text-white">مرحبا بك</h2>
                <p className="text-xs text-slate-400">سجل دخولك للمتابعة</p>
              </div>

              <div className="space-y-3.5">
                <div className="relative">
                  <input
                    type="text"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="رقم الهاتف أو اسم المستخدم"
                    className="w-full bg-[#0F1A2C] border border-cyan-500/30 focus:border-[#00D1FF] rounded-2xl px-4 py-3.5 pr-11 text-xs text-white placeholder-slate-400 focus:outline-none transition"
                  />
                  <Phone
                    size={16}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                </div>

                <div className="relative">
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="كلمة المرور"
                    className="w-full bg-[#0F1A2C] border border-cyan-500/30 focus:border-[#00D1FF] rounded-2xl px-4 py-3.5 pr-11 text-xs text-white placeholder-slate-400 focus:outline-none transition"
                  />
                  <Lock
                    size={16}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      showToast('تم إرسال رمز استعادة كلمة المرور إلى هاتفك')
                    }
                    className="text-[11px] text-slate-300 hover:text-[#FFD700]"
                  >
                    نسيت كلمة المرور؟
                  </button>
                </div>

                <button
                  onClick={() => {
                    if (loginIdentifier.trim()) {
                      setUserName(loginIdentifier.trim());
                    }
                    setScreen('home');
                    showToast(
                      `أهلاً بك في توب شات يا ${
                        loginIdentifier.trim() || userName
                      }!`
                    );
                  }}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#F59E0B] via-[#FFD700] to-[#FBBF24] text-[#080F1A] font-extrabold text-sm shadow-[0_6px_20px_rgba(255,215,0,0.3)] hover:brightness-105 transition"
                >
                  تسجيل الدخول
                </button>
              </div>

              <div className="flex items-center gap-3 py-2">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-xs text-slate-400">أو</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => setScreen('home')}
                  className="w-11 h-11 rounded-full bg-[#1877F2] flex items-center justify-center text-white font-bold text-lg shadow-lg hover:scale-105 transition"
                >
                  f
                </button>
                <button
                  onClick={() => setScreen('home')}
                  className="w-11 h-11 rounded-full bg-[#152238] border border-white/15 flex items-center justify-center text-white font-bold text-sm shadow-lg hover:scale-105 transition"
                >
                  
                </button>
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  title="تسجيل الدخول عبر Google ومزامنة حساب Firebase"
                  className="w-11 h-11 rounded-full bg-white flex items-center justify-center text-slate-900 font-extrabold text-base shadow-lg hover:scale-105 transition"
                >
                  G
                </button>
              </div>
            </div>

            <div className="text-center text-xs text-slate-400 pt-4">
              ليس لديك حساب؟{' '}
              <button
                onClick={() => setScreen('register')}
                className="text-[#FFD700] font-bold hover:underline"
              >
                إنشاء حساب جديد
              </button>
            </div>
          </div>
        )}

        {/* =========================================================
            3. REGISTER SCREEN (إنشاء حساب جديد)
           ========================================================= */}
        {screen === 'register' && (
          <div className="flex-1 flex flex-col justify-between px-7 py-7 bg-gradient-to-b from-[#0B1528] via-[#080F1A] to-[#080F1A] overflow-y-auto">
            <div>
              <BrandCrownLogo size="sm" />
              <div className="text-center mt-4 space-y-1">
                <h2 className="text-xl font-bold text-white">إنشاء حساب جديد</h2>
                <p className="text-xs text-slate-400">
                  انضم إلى توب شات وابدأ رحلتك
                </p>
              </div>
            </div>

            <div className="space-y-3 my-4">
              <div className="relative">
                <input
                  type="text"
                  value={regNickname}
                  onChange={(e) => setRegNickname(e.target.value)}
                  placeholder="الاسم المستعار"
                  className="w-full bg-[#0F1A2C] border border-cyan-500/30 focus:border-[#00D1FF] rounded-2xl px-4 py-3 pr-11 text-xs text-white placeholder-slate-400 focus:outline-none"
                />
                <User
                  size={16}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>

              <div className="relative">
                <input
                  type="tel"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="رقم الهاتف"
                  className="w-full bg-[#0F1A2C] border border-cyan-500/30 focus:border-[#00D1FF] rounded-2xl px-4 py-3 pr-11 text-xs text-white placeholder-slate-400 focus:outline-none"
                />
                <Phone
                  size={16}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>

              <div className="relative">
                <input
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="كلمة المرور"
                  className="w-full bg-[#0F1A2C] border border-cyan-500/30 focus:border-[#00D1FF] rounded-2xl px-4 py-3 pr-11 text-xs text-white placeholder-slate-400 focus:outline-none"
                />
                <Lock
                  size={16}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>

              <div className="relative">
                <input
                  type="password"
                  value={regConfirm}
                  onChange={(e) => setRegConfirm(e.target.value)}
                  placeholder="تأكيد كلمة المرور"
                  className="w-full bg-[#0F1A2C] border border-cyan-500/30 focus:border-[#00D1FF] rounded-2xl px-4 py-3 pr-11 text-xs text-white placeholder-slate-400 focus:outline-none"
                />
                <Lock
                  size={16}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>

              <button
                onClick={() => {
                  if (regNickname.trim()) {
                    setUserName(regNickname.trim());
                  }
                  setScreen('home');
                  showToast('تم إنشاء حسابك بنجاح، أهلاً بك في توب شات!');
                }}
                className="w-full py-3.5 mt-2 rounded-2xl bg-gradient-to-r from-[#F59E0B] via-[#FFD700] to-[#FBBF24] text-[#080F1A] font-extrabold text-sm shadow-[0_6px_20px_rgba(255,215,0,0.3)] hover:brightness-105 transition"
              >
                إنشاء الحساب
              </button>
            </div>

            <div className="text-center space-y-2">
              <p className="text-[11px] text-slate-400 leading-relaxed">
                بالضغط على إنشاء الحساب أنت توافق على{' '}
                <span className="text-[#FFD700] underline cursor-pointer">
                  شروط الاستخدام
                </span>{' '}
                و{' '}
                <span className="text-[#FFD700] underline cursor-pointer">
                  سياسة الخصوصية
                </span>
              </p>
              <button
                onClick={() => setScreen('login')}
                className="text-xs text-[#00D1FF] font-semibold"
              >
                لديك حساب بالفعل؟ تسجيل الدخول
              </button>
            </div>
          </div>
        )}

        {/* =========================================================
            4. HOME SCREEN (الرئيسية - الغرف الصوتية والغرف المقترحة)
           ========================================================= */}
        {screen === 'home' && (
          <>
            {/* Top App Bar */}
            <div className="px-4 pt-4 pb-3 flex items-center justify-between bg-[#080F1A]">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDrawerOpen(true)}
                  className="p-2 rounded-xl bg-[#111C2F] border border-white/10 text-[#FFD700] hover:bg-[#17263F] transition"
                  title="القائمة الجانبية"
                >
                  <Menu size={20} />
                </button>
                <div>
                  <div className="flex items-center gap-1.5">
                    <Crown className="text-[#FFD700] fill-[#FFD700]" size={22} />
                    <span className="text-lg font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#FFE57F] to-[#FFD700]">
                      توب شات
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400">
                    <span>ID: {myPlayerId}</span>
                    <span>·</span>
                    <button
                      onClick={() => setShowLevelsModal(true)}
                      className="text-[#00D1FF] font-bold hover:underline"
                    >
                      Lv.{userLevel}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {!isInstalled && (
                  <button
                    onClick={async () => {
                      if (isInstallable) {
                        const ok = await install();
                        if (ok) showToast('تم تثبيت تطبيق توب شات بنجاح!');
                      } else {
                        setShowDownloadModal(true);
                      }
                    }}
                    className="flex items-center gap-1 bg-gradient-to-r from-[#6C63FF] to-[#00D1FF] text-white px-2.5 py-1.5 rounded-full text-[11px] font-extrabold shadow-md hover:brightness-110 transition"
                    title="تنزيل التطبيق"
                  >
                    <Download size={12} />
                    <span>تنزيل</span>
                  </button>
                )}

                <button
                  onClick={() => setShowTopupModal(true)}
                  className="flex items-center gap-1 bg-[#121E33] border border-[#FFD700]/40 px-2.5 py-1.5 rounded-full text-xs font-bold text-[#FFD700] hover:bg-[#192944] transition"
                >
                  <Coins size={13} className="text-[#FFD700]" />
                  <AnimatedCoinCounter value={coins} />
                  <span className="bg-[#FFD700] text-[#080F1A] rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-black">
                    +
                  </span>
                </button>

                <button
                  onClick={() => setShowContactsModal(true)}
                  className="p-2 rounded-xl bg-[#111C2F] border border-cyan-500/30 text-[#00D1FF] hover:bg-[#17263F] hover:border-[#00D1FF] transition"
                  title="جهات الاتصال (Google Contacts)"
                >
                  <Users size={18} />
                </button>

                <button
                  onClick={() => setScreen('messages')}
                  className="relative p-2 rounded-xl bg-[#111C2F] border border-white/10 text-slate-200 hover:text-[#00D1FF] transition"
                  title="الدردشة الخاصة"
                >
                  <MessageSquare size={18} />
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#6C63FF] text-white text-[9px] font-bold flex items-center justify-center">
                    2
                  </span>
                </button>
              </div>
            </div>

            {/* Search Input (by Room or Player ID) */}
            <div className="px-4 pb-3">
              <div className="relative">
                <input
                  type="text"
                  value={homeSearch}
                  onChange={(e) => setHomeSearch(e.target.value)}
                  placeholder="ابحث عن غرفة أو معرف لاعب (مثال: MJ-77501)..."
                  className="w-full bg-[#101B2E] border border-white/10 focus:border-[#00D1FF]/60 rounded-2xl py-2.5 pr-10 pl-4 text-xs text-white placeholder-slate-400 focus:outline-none"
                />
                <Search
                  size={16}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>
            </div>

            {/* Scrollable Home Content */}
            <div className="flex-1 overflow-y-auto px-4 pb-20 space-y-4">
              {/* Hero Welcome Banner */}
              <div className="relative h-36 rounded-2xl overflow-hidden border border-[#FFD700]/30 shadow-lg">
                <img
                  src={APP_IMAGES.goldMicBanner}
                  alt="مرحباً بك في توب شات"
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-l from-[#080F1A]/95 via-[#080F1A]/65 to-transparent" />
                <div className="relative z-10 h-full p-4 flex flex-col justify-between items-start">
                  <div>
                    <h2 className="text-lg font-extrabold text-white">
                      مرحباً بك في توب شات
                    </h2>
                    <p className="text-xs text-slate-300 mt-0.5">
                      مكان يجمعنا .. و الصوت يوصلنا
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openVoiceRoom(rooms[0])}
                      className="px-5 py-1.5 rounded-full bg-gradient-to-r from-[#F59E0B] to-[#FFD700] text-[#080F1A] font-extrabold text-xs shadow-md hover:brightness-105 transition"
                    >
                      إنضم الآن
                    </button>
                    <button
                      onClick={() => setShowCreateRoomModal(true)}
                      className="px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold text-xs hover:bg-white/20 transition flex items-center gap-1"
                    >
                      <Plus size={13} />
                      <span>إنشاء غرفة</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Google Workspace Integration Banner (Drive, Gmail, Keep, Tasks, Chat) */}
              <div className="rounded-2xl bg-gradient-to-r from-[#0F243D] via-[#13294B] to-[#1A1C3B] border border-[#00D1FF]/40 p-3.5 shadow-lg space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-[#00D1FF]/15 border border-[#00D1FF]/40 flex items-center justify-center text-lg">
                      🌐
                    </div>
                    <div>
                      <h3 className="text-xs font-extrabold text-white flex items-center gap-1.5">
                        <span>مركز خدمات Google Workspace</span>
                        <span className="px-1.5 py-0.2 rounded-full bg-[#00D1FF]/20 text-[#00D1FF] text-[9px] font-bold">
                          5 خدمات متصلة
                        </span>
                      </h3>
                      <p className="text-[10px] text-slate-300">
                        Drive · Gmail · Keep · Tasks · Chat مباشرة في توب شات
                      </p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {[
                    {
                      id: 'drive' as WorkspaceSubTabId,
                      label: 'Drive',
                      emoji: '📁',
                    },
                    {
                      id: 'gmail' as WorkspaceSubTabId,
                      label: 'Gmail',
                      emoji: '✉️',
                    },
                    {
                      id: 'keep' as WorkspaceSubTabId,
                      label: 'Keep',
                      emoji: '📝',
                    },
                    {
                      id: 'tasks' as WorkspaceSubTabId,
                      label: 'Tasks',
                      emoji: '✅',
                    },
                    {
                      id: 'chat' as WorkspaceSubTabId,
                      label: 'Chat',
                      emoji: '💬',
                    },
                  ].map((srv) => (
                    <button
                      key={srv.id}
                      type="button"
                      onClick={() => {
                        setWorkspaceSubTab(srv.id);
                        setScreen('workspace_hub');
                      }}
                      className="py-2 px-1 rounded-xl bg-[#080F1A]/80 hover:bg-[#FFD700]/20 border border-white/10 hover:border-[#FFD700]/50 text-white text-[10px] font-extrabold flex flex-col items-center justify-center gap-0.5 transition"
                    >
                      <span className="text-base">{srv.emoji}</span>
                      <span>{srv.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Coin Arcade Games Hub Banner (صالة ألعاب الكوينز - 4 ألعاب) */}
              <div className="rounded-2xl bg-gradient-to-br from-[#251042] via-[#15223E] to-[#2E1A08] border-2 border-[#FFD700]/60 p-3.5 shadow-[0_6px_25px_rgba(255,215,0,0.18)] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#FFD700] to-orange-500 flex items-center justify-center text-2xl shadow-lg shrink-0">
                      🎰
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-full bg-[#FFD700] text-[#080F1A] text-[9px] font-black">
                          4 ألعاب مباشرة 🔥
                        </span>
                        <h3 className="text-sm font-extrabold text-[#FFD700]">
                          صالة ألعاب الكوينز الملكية
                        </h3>
                      </div>
                      <p className="text-[11px] text-slate-200 mt-0.5">
                        العب بالكوينز الآن في 4 ألعاب وضاعف رصيدك حتى <strong>×100</strong>!
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setScreen('greedy_cat')}
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#FFD700] text-[#080F1A] text-xs font-black shrink-0 shadow-md"
                  >
                    كل الألعاب
                  </button>
                </div>

                {/* 4 Games Grid */}
                <div className="grid grid-cols-4 gap-2">
                  {[
                    {
                      id: 'greedy_cat' as ArcadeGameTabId,
                      title: 'القط الجشع',
                      emoji: '🐱',
                      badge: '×45',
                      bg: 'from-amber-500/25 to-orange-600/25 border-amber-400/50',
                    },
                    {
                      id: 'lion_vs_falcon' as ArcadeGameTabId,
                      title: 'الأسد × الصقر',
                      emoji: '🦁',
                      badge: '×9',
                      bg: 'from-rose-500/25 to-purple-600/25 border-rose-400/50',
                    },
                    {
                      id: 'car_race' as ArcadeGameTabId,
                      title: 'سباق السيارات',
                      emoji: '🏎️',
                      badge: '×25',
                      bg: 'from-cyan-500/25 to-blue-600/25 border-cyan-400/50',
                    },
                    {
                      id: 'treasure_dice' as ArcadeGameTabId,
                      title: 'نرد الكنز',
                      emoji: '🎲',
                      badge: '×15',
                      bg: 'from-emerald-500/25 to-teal-600/25 border-emerald-400/50',
                    },
                  ].map((game) => (
                    <button
                      key={game.id}
                      type="button"
                      onClick={() => {
                        setSelectedGameTab(game.id);
                        setScreen('greedy_cat');
                      }}
                      className={`p-2 rounded-xl bg-gradient-to-b ${game.bg} border flex flex-col items-center text-center hover:scale-[1.03] transition`}
                    >
                      <span className="text-2xl">{game.emoji}</span>
                      <span className="text-[10px] font-extrabold text-white mt-1 line-clamp-1">
                        {game.title}
                      </span>
                      <span className="mt-0.5 px-1.5 py-0.2 rounded-full bg-[#FFD700] text-[#080F1A] text-[9px] font-black">
                        ربح {game.badge}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Free Party Games Row (6 ألعاب مجانية بدون كوينزات) */}
                <div className="pt-2 border-t border-white/10">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-extrabold text-[#00D1FF] flex items-center gap-1">
                      <span>🎙️</span>
                      <span>ألعاب المجلس المجانية (6 ألعاب بدون كوينزات):</span>
                    </span>
                    <span className="px-2 py-0.2 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-[9px] font-bold text-emerald-300">
                      مجاناً 100%
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      {
                        id: 'grab_mic' as ArcadeGameTabId,
                        title: 'امسك المايك',
                        emoji: '🎙️',
                        tag: 'أكمل الأغنية',
                        bg: 'from-cyan-500/25 to-indigo-600/25 border-cyan-400/50',
                      },
                      {
                        id: 'guess_challenge' as ArcadeGameTabId,
                        title: 'لعبة التخمين',
                        emoji: '🧠',
                        tag: 'فوازير وإيموجي',
                        bg: 'from-purple-500/25 to-fuchsia-600/25 border-purple-400/50',
                      },
                      {
                        id: 'truth_or_dare' as ArcadeGameTabId,
                        title: 'صراحة أو جرأة',
                        emoji: '🍾',
                        tag: 'تدوير القارورة',
                        bg: 'from-rose-500/25 to-amber-600/25 border-rose-400/50',
                      },
                      {
                        id: 'xo_majlis' as ArcadeGameTabId,
                        title: 'إكس أو المجلس',
                        emoji: '⭕',
                        tag: 'تحدي ذكاء',
                        bg: 'from-sky-500/25 to-blue-600/25 border-sky-400/50',
                      },
                      {
                        id: 'spy_impostor' as ArcadeGameTabId,
                        title: 'من الجاسوس؟',
                        emoji: '🕵️',
                        tag: 'اكشف المموّه',
                        bg: 'from-emerald-500/25 to-teal-600/25 border-emerald-400/50',
                      },
                      {
                        id: 'spin_wheel_party' as ArcadeGameTabId,
                        title: 'عجلة الأحكام',
                        emoji: '🎡',
                        tag: 'أحكام المايك',
                        bg: 'from-amber-500/25 to-orange-600/25 border-amber-400/50',
                      },
                    ].map((freeGame) => (
                      <button
                        key={freeGame.id}
                        type="button"
                        onClick={() => {
                          setSelectedGameTab(freeGame.id);
                          setScreen('greedy_cat');
                        }}
                        className={`p-2 rounded-xl bg-gradient-to-b ${freeGame.bg} border flex flex-col items-center text-center hover:scale-[1.03] transition`}
                      >
                        <span className="text-xl">{freeGame.emoji}</span>
                        <span className="text-[10px] font-extrabold text-white mt-0.5 truncate w-full">
                          {freeGame.title}
                        </span>
                        <span className="mt-0.5 px-1.5 py-0.2 rounded-full bg-black/40 text-[#00D1FF] text-[8px] font-bold">
                          {freeGame.tag}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Room Categories Navigation Bar (تصنيفات الغرف الصوتية) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold text-[#FFD700] flex items-center gap-1.5">
                    <Sparkles size={13} />
                    <span>تصنيفات الغرف الصوتية</span>
                  </h3>
                  <span className="text-[10px] text-slate-400">
                    {rooms.length} غرفة نشطة الآن
                  </span>
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {ROOM_CATEGORIES.map((cat) => {
                    const isActive = selectedRoomCategory === cat.id;
                    const count =
                      cat.id === 'all'
                        ? rooms.length
                        : rooms.filter((r) => r.topicCategory === cat.id).length;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedRoomCategory(cat.id)}
                        className={`px-3 py-2 rounded-2xl text-xs font-extrabold flex items-center gap-1.5 shrink-0 transition border ${
                          isActive
                            ? `bg-gradient-to-r ${cat.badgeBg} border-transparent shadow-md`
                            : 'bg-[#101B2E] text-slate-300 border-white/10 hover:border-[#FFD700]/40'
                        }`}
                      >
                        <span>{cat.emoji}</span>
                        <span>{cat.shortLabel}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                            isActive
                              ? 'bg-black/25 text-white'
                              : 'bg-white/10 text-slate-300'
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quick Category Overview Cards (تظهر في عرض الكل لسهولة التصفح) */}
              {selectedRoomCategory === 'all' && !homeSearch.trim() && (
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      ROOM_CATEGORIES.find((c) => c.id === 'music')!,
                      ROOM_CATEGORIES.find((c) => c.id === 'discussion')!,
                      ROOM_CATEGORIES.find((c) => c.id === 'entertainment')!,
                    ] as const
                  ).map((cat) => {
                    const catCount = rooms.filter(
                      (r) => r.topicCategory === cat.id
                    ).length;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedRoomCategory(cat.id)}
                        className={`p-2.5 rounded-2xl bg-[#101C30] border ${cat.accentBorder} hover:border-[#FFD700] text-right transition flex flex-col justify-between`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-lg">{cat.emoji}</span>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-white/10 text-slate-200">
                            {catCount} غرف
                          </span>
                        </div>
                        <div className="mt-2">
                          <div className="text-[11px] font-extrabold text-white truncate">
                            {cat.shortLabel}
                          </div>
                          <div className="text-[9px] text-slate-400 line-clamp-1 mt-0.5">
                            {cat.description}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Organized Categorized Rooms Sections */}
              {(selectedRoomCategory === 'all'
                ? ROOM_CATEGORIES.filter((c) => c.id !== 'all')
                : ROOM_CATEGORIES.filter((c) => c.id === selectedRoomCategory)
              ).map((catSection) => {
                const sectionRooms = rooms.filter(
                  (r) =>
                    r.topicCategory === catSection.id &&
                    (!homeSearch.trim() ||
                      r.title.includes(homeSearch.trim()) ||
                      r.roomCode.includes(homeSearch.trim()) ||
                      r.hostName.includes(homeSearch.trim()))
                );

                if (sectionRooms.length === 0) return null;

                return (
                  <div key={catSection.id} className="space-y-2.5">
                    {/* Category Section Header */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-xl bg-[#121F36] border border-white/10 flex items-center justify-center text-sm">
                          {catSection.emoji}
                        </span>
                        <div>
                          <h3 className="text-sm font-extrabold text-white leading-tight">
                            {catSection.label}
                          </h3>
                          <p className="text-[10px] text-slate-400">
                            {catSection.description}
                          </p>
                        </div>
                      </div>
                      {selectedRoomCategory === 'all' ? (
                        <button
                          onClick={() => setSelectedRoomCategory(catSection.id)}
                          className="text-[11px] text-[#FFD700] font-bold hover:underline shrink-0"
                        >
                          عرض القسم ({sectionRooms.length})
                        </button>
                      ) : (
                        <button
                          onClick={() => setSelectedRoomCategory('all')}
                          className="text-[11px] text-[#00D1FF] font-bold hover:underline shrink-0"
                        >
                          عرض كل الأقسام
                        </button>
                      )}
                    </div>

                    {/* Structured Room Cards List */}
                    <div className="space-y-2.5">
                      {sectionRooms.map((room) => (
                        <div
                          key={room.id}
                          onClick={() => openVoiceRoom(room)}
                          className={`group relative rounded-2xl bg-[#101B2E] border ${catSection.accentBorder} hover:border-[#FFD700] p-3 flex items-center justify-between gap-3 cursor-pointer transition shadow-md`}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            {/* Room Cover Thumbnail with Live Mic Indicator */}
                            <div className="relative w-16 h-16 rounded-2xl overflow-hidden border border-white/15 shrink-0">
                              <img
                                src={room.cover}
                                alt={room.title}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-[#080F1A]/90 via-transparent to-transparent" />
                              <div className="absolute bottom-1 inset-x-1 flex items-center justify-between text-[9px] font-bold text-white px-1">
                                <span className="flex items-center gap-0.5 text-emerald-400">
                                  <Mic size={10} />
                                  {room.activeMicsCount}/8
                                </span>
                                {room.isFeatured && <span>👑</span>}
                              </div>
                            </div>

                            {/* Room Details */}
                            <div className="min-w-0 flex-1 text-right">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span
                                  className={`px-2 py-0.5 rounded-md bg-gradient-to-r ${catSection.badgeBg} text-[9px] font-extrabold`}
                                >
                                  {catSection.emoji} {catSection.shortLabel}
                                </span>
                                <span className="text-[10px] font-mono text-slate-400">
                                  #{room.roomCode}
                                </span>
                              </div>

                              <h4 className="text-xs font-extrabold text-white truncate mt-1">
                                {room.title}
                              </h4>

                              <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                                {room.description}
                              </p>

                              <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-300">
                                <span className="text-[#FFD700] font-semibold">
                                  المضيف: {room.hostName}
                                </span>
                                <span>·</span>
                                <span className="text-[#00D1FF] font-semibold">
                                  {room.listenersCount}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Join Room CTA Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openVoiceRoom(room);
                            }}
                            className="px-3 py-2 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#FFD700] text-[#080F1A] text-[10px] font-extrabold shrink-0 shadow hover:brightness-110 transition flex items-center gap-1"
                          >
                            <Mic size={12} />
                            <span>دخول</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Navigation Bar */}
            <div className="absolute bottom-0 inset-x-0 h-16 bg-[#0B1424]/95 backdrop-blur-md border-t border-white/10 grid grid-cols-5 items-center px-1 z-20">
              <button
                onClick={() => setScreen('home')}
                className="flex flex-col items-center justify-center text-[#FFD700]"
              >
                <Home size={19} />
                <span className="text-[10px] font-bold mt-1">الرئيسية</span>
              </button>
              <button
                onClick={() => openVoiceRoom(activeRoom)}
                className="flex flex-col items-center justify-center text-slate-400 hover:text-white"
              >
                <Mic size={19} />
                <span className="text-[10px] font-medium mt-1">الغرف</span>
              </button>
              <button
                onClick={() => {
                  setActiveConversationId(null);
                  setScreen('messages');
                }}
                className="flex flex-col items-center justify-center text-slate-400 hover:text-white relative"
              >
                <MessageSquare size={19} />
                <span className="text-[10px] font-medium mt-1">الخاص</span>
                <span className="absolute top-0 right-4 w-2 h-2 rounded-full bg-[#00D1FF]" />
              </button>
              <button
                onClick={() => setScreen('gifts')}
                className="flex flex-col items-center justify-center text-slate-400 hover:text-white"
              >
                <Gift size={19} />
                <span className="text-[10px] font-medium mt-1">الهدايا</span>
              </button>
              <button
                onClick={() => setScreen('profile')}
                className="flex flex-col items-center justify-center text-slate-400 hover:text-white"
              >
                <User size={19} />
                <span className="text-[10px] font-medium mt-1">حسابي</span>
              </button>
            </div>
          </>
        )}

        {/* =========================================================
            5. VOICE ROOM SCREEN (المايكات جنب بعض + بطاقة اللاعب + هدية HD + خلفية متحركة للمستوى 9)
           ========================================================= */}
        {screen === 'room' && (
          <div className="flex-1 flex flex-col bg-gradient-to-b from-[#0B1528] via-[#080F1A] to-[#080F1A] overflow-hidden relative">
            {/* Level 9 Animated Background Layer inside Voice Room */}
            {canUseAnimatedBg && activeAnimatedBgId !== 'none' && (
              <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
                <img
                  src={customAnimatedBgUrl.trim() || selectedAnimatedBg.previewImage}
                  alt={selectedAnimatedBg.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover opacity-35 scale-110 animate-pulse"
                />
                <div
                  className={`absolute inset-0 bg-gradient-to-b ${selectedAnimatedBg.overlayGradient}`}
                />
                <div className="absolute -top-12 -right-12 w-56 h-56 rounded-full bg-[#FFD700]/20 blur-3xl animate-ping" />
                <div className="absolute bottom-24 -left-12 w-56 h-56 rounded-full bg-[#00D1FF]/20 blur-3xl animate-pulse" />
              </div>
            )}

            {/* Room Header */}
            <div className="relative z-10 px-4 pt-3.5 pb-2.5 flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-[#FFD700]">
                  <img
                    src={APP_IMAGES.avatarHoodedVip}
                    alt={activeRoom.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-sm font-extrabold text-white">
                      {activeRoom.title}
                    </h2>
                    <Flame size={14} className="text-orange-500 fill-orange-500" />
                  </div>
                  <p className="text-[10px] text-slate-400 flex items-center gap-1.5">
                    <span className="text-[#00D1FF] font-bold">
                      {getRoomCategoryMeta(activeRoom.topicCategory).emoji}{' '}
                      {getRoomCategoryMeta(activeRoom.topicCategory).shortLabel}
                    </span>
                    <span>·</span>
                    <span>غرفة #{activeRoom.roomCode}</span>
                    <span>·</span>
                    <span>{activeRoom.listenersCount}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setShowAgoraModal(true)}
                  className={`px-2 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1 border transition ${
                    agoraStatus === 'connected'
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                      : agoraStatus === 'simulated'
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                      : 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                  }`}
                  title="إعدادات البث الصوتي المباشر Agora SDK"
                >
                  <Radio size={11} className={agoraStatus === 'connected' ? 'animate-pulse' : ''} />
                  <span>بث Agora</span>
                </button>
                <button
                  onClick={() => setShowContactsModal(true)}
                  className="px-2 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1 bg-[#14233D] border border-[#00D1FF]/40 text-[#00D1FF] hover:bg-[#00D1FF]/20 transition"
                  title="جهات الاتصال (Google Contacts) - دعوة الأصدقاء للمجلس"
                >
                  <Users size={11} />
                  <span>دعوة أصدقاء</span>
                </button>
                <button
                  onClick={() => setShowAnimatedBgModal(true)}
                  className={`px-2 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1 border transition ${
                    canUseAnimatedBg
                      ? 'bg-gradient-to-r from-[#FFD700] to-amber-500 text-[#080F1A] border-[#FFD700] shadow-md'
                      : 'bg-[#121E33] border-white/15 text-slate-300'
                  }`}
                  title="خلفية متحركة (تُفتح في المستوى 9)"
                >
                  <Sparkles size={11} />
                  <span>خلفية متحركة</span>
                </button>
                <button
                  onClick={() => setShowTopupModal(true)}
                  className="flex items-center gap-1 bg-[#121E33] border border-[#FFD700]/40 px-2.5 py-1 rounded-full text-[11px] font-bold text-[#FFD700]"
                >
                  <Coins size={12} />
                  <AnimatedCoinCounter value={coins} />
                </button>
                <button
                  onClick={() => setShowLevelsModal(true)}
                  className="px-2 py-1 rounded-full bg-[#6C63FF]/25 border border-[#6C63FF] text-[10px] font-extrabold text-purple-200"
                >
                  Lv.{userLevel}
                </button>
                <button
                  onClick={() => setScreen('home')}
                  className="p-1.5 rounded-full bg-white/5 border border-white/10 text-slate-300 hover:text-white"
                  title="العودة للرئيسية"
                >
                  <ChevronLeft size={16} />
                </button>
              </div>
            </div>

            {/* SIDE-BY-SIDE 8 MICROPHONES GRID (المايكات جنب بعض في صفوف متجاورة مرتبة) */}
            <div className="px-3 py-3 bg-[#0C172B]/80 border-b border-white/10">
              <div className="flex items-center justify-between mb-2.5 px-1">
                <span className="text-[11px] font-bold text-[#FFD700] flex items-center gap-1">
                  <Mic size={13} />
                  <span>مقاعد المايكات المتجاورة (8 مايكات)</span>
                </span>
                <span className="text-[10px] text-slate-400">
                  اضغط على أي لاعب لعرض معرفه أو إضافته كصديق
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2.5">
                {seats.map((seat) => {
                  const isFriend =
                    seat.occupied && friendIds.includes(seat.playerId);
                  const isSpeakingNow =
                    seat.occupied && speakingSeatIndices.includes(seat.id - 1);
                  return (
                    <div
                      key={seat.id}
                      onClick={() => handleSeatClick(seat)}
                      className="bg-[#101E36] hover:bg-[#162847] border border-white/10 hover:border-[#00D1FF]/60 rounded-2xl p-2 flex flex-col items-center text-center cursor-pointer transition relative group"
                    >
                      {/* Level Badge Top Right */}
                      {seat.occupied && (
                        <span className="absolute top-1.5 right-1.5 px-1.5 py-0.2 rounded-md bg-gradient-to-r from-[#6C63FF] to-[#00D1FF] text-[8px] font-extrabold text-white shadow">
                          Lv.{seat.level}
                        </span>
                      )}

                      {/* Friend Indicator Top Left */}
                      {isFriend && (
                        <span
                          className="absolute top-1.5 left-1.5 text-[10px]"
                          title="صديقك"
                        >
                          🤝
                        </span>
                      )}

                      {/* Speaking Soundwave Badge Top Left */}
                      {isSpeakingNow && (
                        <span
                          className="absolute top-1.5 left-1.5 text-[9px] animate-bounce"
                          title="يتحدث الآن في بث Agora"
                        >
                          🔊
                        </span>
                      )}

                      {/* Side-by-Side Avatar / Empty Mic Slot */}
                      <div
                        className={`relative w-13 h-13 rounded-full p-0.5 mt-1 transition ${
                          seat.occupied
                            ? isSpeakingNow
                              ? 'bg-gradient-to-tr from-emerald-400 via-[#00D1FF] to-[#FFD700] ring-4 ring-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.7)] animate-pulse'
                              : seat.id === 1
                              ? 'bg-gradient-to-tr from-[#FFD700] via-[#F59E0B] to-[#00D1FF] shadow-[0_0_15px_rgba(255,215,0,0.4)]'
                              : 'bg-gradient-to-tr from-[#00D1FF] to-[#6C63FF] shadow-[0_0_12px_rgba(0,209,255,0.25)]'
                            : 'border-2 border-dashed border-slate-600 bg-[#080F1A]/70 flex items-center justify-center'
                        }`}
                      >
                        {seat.occupied ? (
                          <img
                            src={seat.avatar}
                            alt={seat.name}
                            referrerPolicy="no-referrer"
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <Mic
                            size={18}
                            className="text-slate-500 group-hover:text-[#FFD700]"
                          />
                        )}

                        {seat.occupied && (
                          <span
                            className={`absolute -bottom-0.5 -left-0.5 w-4 h-4 rounded-full border border-[#080F1A] flex items-center justify-center text-[#080F1A] ${
                              isSpeakingNow
                                ? 'bg-emerald-400 animate-ping'
                                : 'bg-emerald-500'
                            }`}
                          >
                            <Mic size={9} />
                          </span>
                        )}
                      </div>

                      {/* Name */}
                      <div className="flex items-center justify-center gap-0.5 mt-1.5 w-full">
                        {seat.isVip && seat.occupied && (
                          <span className="text-[9px]">👑</span>
                        )}
                        <span className="text-[11px] font-extrabold text-white truncate">
                          {seat.occupied ? seat.name : seat.roleLabel}
                        </span>
                      </div>

                      {/* Player ID Badge under Name */}
                      <span className="text-[9px] text-slate-400 font-mono truncate w-full">
                        {seat.occupied ? `ID: ${seat.playerId}` : 'مقعد فارغ +'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick HD Animated Gift Bar + Greedy Cat Game Button inside Room */}
            <div className="px-3 py-2 bg-[#0B1324] border-b border-white/5 flex items-center justify-between gap-2 overflow-x-auto">
              <button
                onClick={() => setScreen('greedy_cat')}
                className="px-3 py-1 rounded-full bg-gradient-to-r from-[#F59E0B] to-[#FFD700] text-[#080F1A] flex items-center gap-1 text-[10px] font-black shrink-0 shadow-md hover:brightness-110 transition"
              >
                <span>🐱</span>
                <span>القط الجشع</span>
              </button>
              <div className="flex items-center gap-1.5">
                {GIFTS_LIST.filter((g) => g.isAnimatedHd)
                  .slice(0, 4)
                  .map((hdGift) => (
                    <button
                      key={hdGift.id}
                      onClick={() => triggerGiftSend(hdGift, giftRecipient)}
                      className="px-2.5 py-1 rounded-full bg-[#14223C] hover:bg-[#1C2F52] border border-[#FFD700]/40 flex items-center gap-1 text-[10px] font-bold text-white shrink-0 transition"
                    >
                      <span>{hdGift.icon}</span>
                      <span>{hdGift.name}</span>
                      <span className="text-[#FFD700]">({hdGift.coins})</span>
                    </button>
                  ))}
              </div>
            </div>

            {/* Live Chat Stream inside Room */}
            <div className="flex-1 overflow-y-auto px-4 py-2.5 space-y-2">
              {roomChat.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2.5 p-2.5 rounded-2xl text-xs ${
                    msg.isGift
                      ? 'bg-gradient-to-r from-[#FFD700]/25 to-[#6C63FF]/25 border border-[#FFD700]/50'
                      : 'bg-[#101C30]/90 border border-white/5'
                  }`}
                >
                  <img
                    src={msg.avatar}
                    alt={msg.sender}
                    referrerPolicy="no-referrer"
                    className="w-8 h-8 rounded-full object-cover border border-[#FFD700]/40 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-1.5">
                      <span className="px-1.5 py-0.2 rounded bg-[#6C63FF]/30 border border-[#6C63FF]/60 text-[9px] font-extrabold text-purple-200">
                        Lv.{msg.senderLevel}
                      </span>
                      {msg.isVip && <span className="text-[10px]">👑</span>}
                      <span className="font-bold text-[#FFD700]">
                        {msg.sender}
                      </span>
                      <span className="text-[9px] text-slate-400 font-mono">
                        ({msg.senderId})
                      </span>
                    </div>
                    <p className="text-slate-200 mt-1 break-words">{msg.text}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input Bar + Bottom Voice Controls */}
            <div className="p-3 bg-[#0B1424] border-t border-white/10 space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="flex-1 relative flex items-center bg-[#121F36] border border-white/10 rounded-full px-3.5 py-2">
                  <Smile size={16} className="text-slate-400 ml-2 shrink-0" />
                  <input
                    type="text"
                    value={roomInput}
                    onChange={(e) => setRoomInput(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === 'Enter' && handleSendRoomMessage()
                    }
                    placeholder="اكتب رسالة في المجلس..."
                    className="flex-1 bg-transparent text-xs text-white placeholder-slate-400 focus:outline-none"
                  />
                  <button
                    onClick={handleSendRoomMessage}
                    className="text-[#00D1FF] hover:text-[#FFD700] mr-1"
                  >
                    <Send size={16} className="rotate-180" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-1.5 pt-0.5">
                <button
                  onClick={handleToggleMyMic}
                  className="flex flex-col items-center justify-center py-1 text-slate-300 hover:text-[#00D1FF]"
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center border ${
                      myMicMuted
                        ? 'bg-rose-500/20 border-rose-500 text-rose-400'
                        : 'bg-[#13223A] border-[#00D1FF]/40 text-[#00D1FF]'
                    }`}
                  >
                    {myMicMuted ? <MicOff size={15} /> : <Mic size={15} />}
                  </div>
                  <span className="text-[10px] mt-1">ميكروفون</span>
                </button>

                <button
                  onClick={handleToggleSpeaker}
                  className="flex flex-col items-center justify-center py-1 text-slate-300 hover:text-[#00D1FF]"
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center border ${
                      speakerMuted
                        ? 'bg-rose-500/20 border-rose-500 text-rose-400'
                        : 'bg-[#13223A] border-white/15 text-slate-200'
                    }`}
                  >
                    {speakerMuted ? (
                      <VolumeX size={15} />
                    ) : (
                      <Volume2 size={15} />
                    )}
                  </div>
                  <span className="text-[10px] mt-1">سماعة</span>
                </button>

                <button
                  onClick={() => setScreen('gifts')}
                  className="flex flex-col items-center justify-center py-1 text-[#FFD700]"
                >
                  <div className="w-9 h-9 rounded-full bg-[#FFD700]/15 border border-[#FFD700]/50 flex items-center justify-center text-[#FFD700]">
                    <Gift size={15} />
                  </div>
                  <span className="text-[10px] mt-1 font-bold">هدايا HD</span>
                </button>

                <button
                  onClick={() => {
                    setActiveConversationId(null);
                    setScreen('messages');
                  }}
                  className="flex flex-col items-center justify-center py-1 text-[#00D1FF]"
                >
                  <div className="w-9 h-9 rounded-full bg-[#13223A] border border-[#00D1FF]/40 flex items-center justify-center">
                    <MessageSquare size={15} />
                  </div>
                  <span className="text-[10px] mt-1">الخاص</span>
                </button>

                <button
                  onClick={() => setDrawerOpen(true)}
                  className="flex flex-col items-center justify-center py-1 text-slate-300 hover:text-white"
                >
                  <div className="w-9 h-9 rounded-full bg-[#13223A] border border-white/15 flex items-center justify-center">
                    <MoreHorizontal size={15} />
                  </div>
                  <span className="text-[10px] mt-1">المزيد</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            5B. COIN ARCADE GAMES HUB SCREEN (صالة ألعاب الكوينز - 4 ألعاب)
           ========================================================= */}
        {screen === 'greedy_cat' && (
          <GreedyCatGame
            coins={coins}
            setCoins={setCoins}
            onOpenTopup={() => setShowTopupModal(true)}
            onBack={() => setScreen('room')}
            showToast={showToast}
            initialGameTab={selectedGameTab}
            onAnnounceWinInRoom={(winText) => {
              setRoomChat((prev) => [
                ...prev,
                {
                  id: `gc_win_${Date.now()}`,
                  sender: userName,
                  senderId: myPlayerId,
                  senderLevel: userLevel,
                  avatar: APP_IMAGES.avatarHoodedVip,
                  text: winText,
                  isVip: true,
                  isGift: true,
                },
              ]);
            }}
          />
        )}

        {/* =========================================================
            5C. GOOGLE WORKSPACE HUB SCREEN (Google Tasks & Google Chat)
           ========================================================= */}
        {screen === 'workspace_hub' && (
          <GoogleWorkspaceHub
            onBack={() => setScreen('home')}
            showToast={showToast}
            initialSubTab={workspaceSubTab}
          />
        )}

        {/* =========================================================
            6. GIFTS SCREEN (شاشة الهدايا المتحركة عالية الدقة HD)
           ========================================================= */}
        {screen === 'gifts' && (
          <div className="flex-1 flex flex-col bg-[#080F1A] overflow-hidden">
            <div className="px-4 pt-4 pb-3 flex items-center justify-between border-b border-white/10">
              <button
                onClick={() => setShowTopupModal(true)}
                className="flex items-center gap-1.5 bg-[#121E33] border border-[#FFD700]/40 px-3 py-1 rounded-full text-xs font-extrabold text-[#FFD700]"
              >
                <Coins size={14} />
                <AnimatedCoinCounter value={coins} suffix={<span className="mr-1">رصيدي</span>} />
                <span className="bg-[#FFD700] text-[#080F1A] rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                  +
                </span>
              </button>

              <h2 className="text-base font-extrabold text-white">
                الهدايا الملكية HD
              </h2>

              <button
                onClick={() => setScreen('room')}
                className="p-2 rounded-xl bg-white/5 text-slate-300 hover:text-white"
              >
                <ChevronLeft size={18} />
              </button>
            </div>

            {/* Category Tabs */}
            <div className="px-4 py-3 flex items-center gap-2">
              {(
                [
                  { id: 'all', label: 'كل الهدايا' },
                  { id: 'vip', label: 'هدايا HD متحركة' },
                  { id: 'seasonal', label: 'موسمية' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setGiftFilter(tab.id)}
                  className={`flex-1 py-2 rounded-full text-xs font-bold transition ${
                    giftFilter === tab.id
                      ? 'bg-gradient-to-r from-[#F59E0B] to-[#FFD700] text-[#080F1A] shadow-md'
                      : 'bg-[#101C30] text-slate-300 border border-white/10'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* 3x4 Gift Items Grid with HD Previews */}
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              <div className="grid grid-cols-3 gap-3">
                {GIFTS_LIST.filter(
                  (g) => giftFilter === 'all' || g.category === giftFilter
                ).map((gift) => {
                  const isSelected = selectedGift.id === gift.id;
                  return (
                    <button
                      key={gift.id}
                      onClick={() => setSelectedGift(gift)}
                      className={`relative p-2.5 rounded-2xl bg-gradient-to-b ${
                        gift.gradient
                      } border transition flex flex-col items-center justify-between text-center ${
                        isSelected
                          ? 'border-[#FFD700] ring-2 ring-[#FFD700]/40 scale-[1.02]'
                          : 'border-white/10 hover:border-white/30'
                      }`}
                    >
                      {gift.isAnimatedHd && (
                        <span className="absolute top-1.5 right-1.5 px-1.5 py-0.2 rounded bg-[#FFD700] text-[#080F1A] text-[8px] font-black">
                          HD متحركة
                        </span>
                      )}

                      {gift.hdImage ? (
                        <img
                          src={gift.hdImage}
                          alt={gift.name}
                          referrerPolicy="no-referrer"
                          className="w-16 h-16 rounded-xl object-cover my-1 border border-[#FFD700]/40 shadow-md"
                        />
                      ) : (
                        <span className="text-3xl my-2 drop-shadow">
                          {gift.icon}
                        </span>
                      )}

                      <span className="text-[11px] font-extrabold text-white truncate w-full">
                        {gift.name}
                      </span>
                      <div className="flex items-center gap-1 mt-0.5 text-[11px] font-bold text-[#FFD700]">
                        <Coins size={11} />
                        <span>{gift.coins}</span>
                      </div>
                      <span className="text-[9px] text-purple-300">
                        +{gift.xpBonus} XP
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Recipient & Send CTA */}
            <div className="p-4 bg-[#0C1628] border-t border-white/10 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">
                  إهداء إلى:{' '}
                  <strong className="text-[#FFD700]">{giftRecipient}</strong>
                </span>
                <button
                  onClick={() => setShowTopupModal(true)}
                  className="text-[#00D1FF] font-bold hover:underline"
                >
                  شحن كوينز عبر واتساب
                </button>
              </div>

              <button
                onClick={() => triggerGiftSend(selectedGift, giftRecipient)}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#6C63FF] to-[#8B5CF6] hover:brightness-110 text-white font-extrabold text-sm shadow-[0_6px_20px_rgba(108,99,255,0.4)] transition flex items-center justify-center gap-2"
              >
                <Sparkles size={16} />
                <span>
                  إهداء الآن ({selectedGift.name} - {selectedGift.coins} كوينز)
                </span>
              </button>
            </div>
          </div>
        )}

        {/* =========================================================
            7. PROFILE SCREEN (معرف اللاعب ID + مستويات الشحن 1-9 + الخلفية المتحركة للمستوى 9)
           ========================================================= */}
        {screen === 'profile' && (
          <div className="flex-1 flex flex-col bg-[#080F1A] overflow-y-auto relative">
            {/* Level 9 Animated Background Layer on Profile */}
            {canUseAnimatedBg && activeAnimatedBgId !== 'none' && (
              <div className="absolute inset-x-0 top-0 h-80 pointer-events-none z-0 overflow-hidden">
                <img
                  src={customAnimatedBgUrl.trim() || selectedAnimatedBg.previewImage}
                  alt={selectedAnimatedBg.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover opacity-45 scale-105 animate-pulse"
                />
                <div
                  className={`absolute inset-0 bg-gradient-to-b ${selectedAnimatedBg.overlayGradient}`}
                />
                <div className="absolute top-6 right-10 w-36 h-36 rounded-full bg-[#FFD700]/25 blur-2xl animate-ping" />
              </div>
            )}

            <div className="relative z-10 px-4 pt-4 pb-2 flex items-center justify-between">
              <button
                onClick={() => setScreen('settings')}
                className="p-2 rounded-xl bg-white/5 text-slate-300 hover:text-white"
              >
                <Settings size={18} />
              </button>
              <h2 className="text-sm font-extrabold text-white">
                الملف الشخصي ومستوى الشحن
              </h2>
              <button
                onClick={() => setScreen('home')}
                className="p-2 rounded-xl bg-white/5 text-slate-300 hover:text-white"
              >
                <ChevronLeft size={18} />
              </button>
            </div>

            <div className="relative z-10 px-5 pt-2 pb-4 flex flex-col items-center text-center">
              <div className="relative w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-[#FFD700] via-[#F59E0B] to-[#00D1FF] shadow-[0_0_25px_rgba(255,215,0,0.3)]">
                <img
                  src={APP_IMAGES.avatarHoodedVip}
                  alt={userName}
                  referrerPolicy="no-referrer"
                  className="w-full h-full rounded-full object-cover border-2 border-[#080F1A]"
                />
                <span className="absolute -bottom-1 inset-x-3 py-0.5 rounded-full bg-gradient-to-r from-[#6C63FF] to-[#00D1FF] text-[10px] font-black text-white">
                  Lv.{userLevel}
                </span>
              </div>

              <h1 className="text-xl font-extrabold text-white mt-3 flex items-center gap-1.5">
                <span>{userName}</span>
                <span className="text-sm">👑</span>
              </h1>
              <span className="text-xs font-bold text-[#FFD700] mt-0.5">
                {getRankTitle(userLevel)}
              </span>

              {/* Player Unique ID Badge with Copy Button */}
              <div className="mt-2.5 inline-flex items-center gap-2 bg-[#101C30] border border-[#00D1FF]/40 px-3.5 py-1.5 rounded-full">
                <Hash size={13} className="text-[#00D1FF]" />
                <span className="text-xs font-mono font-bold text-white">
                  معرف اللاعب ID: {myPlayerId}
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(myPlayerId);
                    showToast(`تم نسخ معرف اللاعب (${myPlayerId}) بنجاح!`);
                  }}
                  className="text-[10px] bg-[#00D1FF] text-[#080F1A] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1"
                >
                  <Copy size={10} />
                  <span>نسخ</span>
                </button>
              </div>

              {/* Coin Recharge Level Progress Bar (Lv.1 at 10,000 -> Lv.9 at 1,100,000) */}
              <div
                onClick={() => setShowLevelsModal(true)}
                className="w-full mt-4 bg-[#101C30]/95 border border-[#FFD700]/30 rounded-2xl p-3.5 cursor-pointer hover:border-[#FFD700] transition"
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-extrabold text-[#FFD700] flex items-center gap-1">
                    <Award size={14} />
                    <span>المستوى {userLevel} من 9</span>
                  </span>
                  <span className="text-[11px] text-emerald-300 font-mono font-bold">
                    شحن: {totalRechargedCoins.toLocaleString('en-US')} /{' '}
                    {nextLevelCoinsTarget.toLocaleString('en-US')} كوينز
                  </span>
                </div>
                <div className="w-full h-2.5 bg-[#080F1A] rounded-full overflow-hidden p-0.5 border border-white/10">
                  <div
                    className="h-full bg-gradient-to-r from-[#6C63FF] via-[#00D1FF] to-[#FFD700] rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round(
                          (totalRechargedCoins / nextLevelCoinsTarget) * 100
                        )
                      )}%`,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between mt-2 text-[10px]">
                  <span className="text-slate-300">
                    {nextTier
                      ? `متبقي ${(
                          nextTier.requiredRechargedCoins - totalRechargedCoins
                        ).toLocaleString('en-US')} كوينز للوصول إلى المستوى ${
                          nextTier.level
                        }`
                      : '👑 وصلت إلى أعلى مستوى (المستوى 9 — الخلفية المتحركة مفتوحة!)'}
                  </span>
                  <span className="text-[#00D1FF] font-bold underline">
                    جدول المستويات
                  </span>
                </div>
              </div>

              {/* Level 9 Exclusive Feature: Animated Background Studio Button */}
              <button
                onClick={() => setShowAnimatedBgModal(true)}
                className={`w-full mt-3 p-3 rounded-2xl border flex items-center justify-between transition ${
                  canUseAnimatedBg
                    ? 'bg-gradient-to-r from-amber-500/20 via-purple-600/20 to-cyan-500/20 border-[#FFD700] text-white shadow-lg'
                    : 'bg-[#101C30] border-white/10 text-slate-300 hover:border-[#FFD700]/40'
                }`}
              >
                <div className="flex items-center gap-2.5 text-right">
                  <div className="w-10 h-10 rounded-xl bg-[#FFD700]/20 border border-[#FFD700]/50 flex items-center justify-center text-lg">
                    {canUseAnimatedBg ? '👑' : '🔒'}
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-[#FFD700] flex items-center gap-1">
                      <span>تخصيص خلفية متحركة (ميزة المستوى 9)</span>
                      <Sparkles size={12} />
                    </div>
                    <p className="text-[10px] text-slate-300 mt-0.5">
                      {canUseAnimatedBg
                        ? `مفعلة الآن: ${selectedAnimatedBg.name}`
                        : 'تُفتح عند شحن 1,100,000 كوينز (المستوى 9) — اضغط للمعاينة أو الترقية'}
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-xl bg-[#FFD700] text-[#080F1A] text-[10px] font-extrabold shrink-0">
                  {canUseAnimatedBg ? 'تغيير الخلفية' : 'معاينة'}
                </span>
              </button>

              {/* 3 Stat Boxes */}
              <div className="w-full grid grid-cols-3 gap-2.5 mt-3">
                <div className="bg-[#101C30] border border-white/10 rounded-2xl py-2.5 px-2">
                  <div className="text-xs text-slate-400">إجمالي الشحن</div>
                  <div className="text-xs font-extrabold text-emerald-400 mt-0.5 font-mono">
                    {totalRechargedCoins.toLocaleString('en-US')}
                  </div>
                </div>
                <div className="bg-[#101C30] border border-white/10 rounded-2xl py-2.5 px-2">
                  <div className="text-xs text-slate-400">الأصدقاء</div>
                  <div className="text-sm font-extrabold text-[#00D1FF] mt-0.5">
                    {friendIds.length}
                  </div>
                </div>
                <div className="bg-[#101C30] border border-white/10 rounded-2xl py-2.5 px-2">
                  <div className="text-xs text-slate-400">مستوى اللاعب</div>
                  <div className="text-sm font-extrabold text-[#FFD700] mt-0.5">
                    Lv.{userLevel} / 9
                  </div>
                </div>
              </div>

              {/* Bio & Edit Button */}
              {isEditingProfile ? (
                <div className="w-full mt-4 space-y-2 bg-[#101C30] p-3 rounded-2xl border border-[#FFD700]/40">
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full bg-[#080F1A] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                    placeholder="الاسم"
                  />
                  <input
                    type="text"
                    value={userBio}
                    onChange={(e) => setUserBio(e.target.value)}
                    className="w-full bg-[#080F1A] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                    placeholder="النبذة الشخصية"
                  />
                  <button
                    onClick={() => {
                      setIsEditingProfile(false);
                      showToast('تم حفظ تعديلات الملف الشخصي');
                    }}
                    className="w-full py-2 rounded-xl bg-[#FFD700] text-[#080F1A] text-xs font-extrabold"
                  >
                    حفظ التعديلات
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-xs text-slate-300 mt-4">{userBio}</p>
                  <button
                    onClick={() => setIsEditingProfile(true)}
                    className="mt-3 px-6 py-2 rounded-full bg-[#13223A] border border-[#6C63FF]/50 text-xs font-bold text-slate-200 hover:border-[#FFD700] transition"
                  >
                    تعديل الملف الشخصي
                  </button>
                </>
              )}
            </div>

            {/* الهدايا المستلمة */}
            <div className="px-5 py-3">
              <h3 className="text-xs font-extrabold text-slate-200 mb-2.5">
                الهدايا المستلمة
              </h3>
              <div className="grid grid-cols-4 gap-2.5">
                {[
                  { icon: '🦁', count: 12 },
                  { icon: '🏎️', count: 28 },
                  { icon: '🦅', count: 45 },
                  { icon: '🌹', count: 160 },
                ].map((g, i) => (
                  <div
                    key={i}
                    className="bg-[#101C30] border border-white/10 rounded-2xl p-2.5 flex flex-col items-center"
                  >
                    <span className="text-2xl">{g.icon}</span>
                    <span className="text-[11px] font-bold text-[#FFD700] mt-1">
                      ♦ {g.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            8. NOTIFICATIONS SCREEN (الإشعارات)
           ========================================================= */}
        {screen === 'notifications' && (
          <div className="flex-1 flex flex-col bg-[#080F1A] overflow-hidden">
            <div className="px-4 pt-4 pb-3 flex items-center justify-between border-b border-white/10">
              <button
                onClick={() => {
                  setNotifications([]);
                  showToast('تم مسح الإشعارات');
                }}
                className="text-[11px] text-slate-400 hover:text-[#FFD700]"
              >
                مسح الكل
              </button>
              <h2 className="text-base font-extrabold text-white">الإشعارات</h2>
              <button
                onClick={() => setScreen('home')}
                className="p-2 rounded-xl bg-white/5 text-slate-300 hover:text-white"
              >
                <ChevronLeft size={18} />
              </button>
            </div>

            <div className="px-4 py-3 flex items-center gap-2">
              {(
                [
                  { id: 'all', label: 'الكل' },
                  { id: 'gifts', label: 'الهدايا' },
                  { id: 'follows', label: 'الأصدقاء' },
                  { id: 'system', label: 'المستويات' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setNotifFilter(tab.id)}
                  className={`flex-1 py-1.5 rounded-full text-xs font-bold transition ${
                    notifFilter === tab.id
                      ? 'bg-[#FFD700] text-[#080F1A]'
                      : 'bg-[#101C30] text-slate-300 border border-white/10'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-2.5">
              {notifications
                .filter(
                  (n) => notifFilter === 'all' || n.category === notifFilter
                )
                .map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setScreen('room')}
                    className="p-3.5 rounded-2xl bg-[#101C30] border border-white/10 hover:border-[#FFD700]/40 flex items-center justify-between cursor-pointer transition"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-11 h-11 rounded-full border flex items-center justify-center text-xl ${item.accent}`}
                      >
                        {item.icon}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">
                          {item.title}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {item.timeAgo}
                        </p>
                      </div>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* =========================================================
            9. PRIVATE CHAT & FRIENDS SCREEN (الدردشة الخاصة + إضافة صديق بالمعرف)
           ========================================================= */}
        {screen === 'messages' && (
          <div className="flex-1 flex flex-col bg-[#080F1A] overflow-hidden relative">
            {!activeConversation ? (
              <>
                <div className="px-4 pt-4 pb-2 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-[#00D1FF]">
                    معرفي: {myPlayerId}
                  </span>
                  <h2 className="text-base font-extrabold text-white">
                    الدردشة الخاصة والأصدقاء
                  </h2>
                  <button
                    onClick={() => setScreen('home')}
                    className="p-2 rounded-xl bg-white/5 text-slate-300 hover:text-white"
                  >
                    <ChevronLeft size={18} />
                  </button>
                </div>

                {/* Add Friend by Player ID Bar */}
                <form
                  onSubmit={handleAddFriendById}
                  className="px-4 py-2 flex items-center gap-2"
                >
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={searchIdQuery}
                      onChange={(e) => setSearchIdQuery(e.target.value)}
                      placeholder="أدخل معرف اللاعب (مثال: MJ-20491) لإضافته كصديق..."
                      className="w-full bg-[#101B2E] border border-[#00D1FF]/30 rounded-2xl py-2.5 pr-9 pl-3 text-[11px] text-white placeholder-slate-400 focus:outline-none focus:border-[#FFD700]"
                    />
                    <Hash
                      size={14}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#00D1FF]"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-[#F59E0B] to-[#FFD700] text-[#080F1A] text-xs font-extrabold flex items-center gap-1 shrink-0"
                  >
                    <UserPlus size={14} />
                    <span>إضافة صديق</span>
                  </button>
                </form>

                {/* Filter Tabs: الكل | أصدقائي | غير مقروءة */}
                <div className="px-4 py-2 flex items-center gap-2">
                  <button
                    onClick={() => setMsgFilter('all')}
                    className={`flex-1 py-1.5 rounded-full text-xs font-bold transition ${
                      msgFilter === 'all'
                        ? 'bg-gradient-to-r from-[#F59E0B] to-[#FFD700] text-[#080F1A]'
                        : 'bg-[#101C30] text-slate-300 border border-white/10'
                    }`}
                  >
                    كل المحادثات
                  </button>
                  <button
                    onClick={() => setMsgFilter('friends')}
                    className={`flex-1 py-1.5 rounded-full text-xs font-bold transition ${
                      msgFilter === 'friends'
                        ? 'bg-gradient-to-r from-[#F59E0B] to-[#FFD700] text-[#080F1A]'
                        : 'bg-[#101C30] text-slate-300 border border-white/10'
                    }`}
                  >
                    أصدقائي ({friendIds.length})
                  </button>
                  <button
                    onClick={() => setMsgFilter('unread')}
                    className={`flex-1 py-1.5 rounded-full text-xs font-bold transition ${
                      msgFilter === 'unread'
                        ? 'bg-gradient-to-r from-[#F59E0B] to-[#FFD700] text-[#080F1A]'
                        : 'bg-[#101C30] text-slate-300 border border-white/10'
                    }`}
                  >
                    غير مقروءة
                  </button>
                </div>

                {/* Conversations List */}
                <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
                  {conversations
                    .filter((c) => {
                      const isFriend = friendIds.includes(c.playerId);
                      if (msgFilter === 'friends' && !isFriend) return false;
                      if (msgFilter === 'unread' && c.unreadCount === 0)
                        return false;
                      return true;
                    })
                    .map((conv) => {
                      const isFriend = friendIds.includes(conv.playerId);
                      return (
                        <div
                          key={conv.id}
                          className="w-full p-3 rounded-2xl bg-[#101C30] border border-white/10 hover:border-[#00D1FF]/40 flex items-center justify-between text-right transition"
                        >
                          <div
                            onClick={() => {
                              setConversations((prev) =>
                                prev.map((item) =>
                                  item.id === conv.id
                                    ? { ...item, unreadCount: 0 }
                                    : item
                                )
                              );
                              setActiveConversationId(conv.id);
                            }}
                            className="flex items-center gap-3 flex-1 cursor-pointer"
                          >
                            <div className="relative">
                              <img
                                src={conv.avatar}
                                alt={conv.name}
                                referrerPolicy="no-referrer"
                                className="w-12 h-12 rounded-full object-cover border border-[#FFD700]/40"
                              />
                              <span className="absolute -bottom-1 -right-1 px-1.5 rounded bg-[#6C63FF] text-[8px] font-bold text-white">
                                Lv.{conv.level}
                              </span>
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-extrabold text-white">
                                  {conv.name}
                                </span>
                                <span className="text-[9px] font-mono text-slate-400">
                                  ({conv.playerId})
                                </span>
                                {isFriend && (
                                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 rounded-full">
                                    صديقك 🤝
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                                {conv.lastMessage}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {!isFriend && (
                              <button
                                onClick={() =>
                                  handleToggleFriend(
                                    conv.playerId,
                                    conv.name,
                                    conv.avatar,
                                    conv.level
                                  )
                                }
                                className="px-2.5 py-1.5 rounded-xl bg-[#FFD700]/15 border border-[#FFD700]/50 text-[#FFD700] text-[10px] font-extrabold flex items-center gap-1"
                                title="أضفتك كصديق"
                              >
                                <UserPlus size={12} />
                                <span>صديق</span>
                              </button>
                            )}
                            <button
                              onClick={() => setActiveConversationId(conv.id)}
                              className="p-2 rounded-xl bg-[#6C63FF]/20 text-[#00D1FF] hover:bg-[#6C63FF]/40"
                              title="فتح الدردشة الخاصة"
                            >
                              <MessageSquare size={15} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </>
            ) : (
              /* Active Private Chat Thread */
              <div className="flex-1 flex flex-col">
                <div className="px-4 pt-4 pb-3 bg-[#101C30] border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={activeConversation.avatar}
                      alt={activeConversation.name}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-full object-cover border border-[#FFD700]"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-xs font-extrabold text-white">
                          {activeConversation.name}
                        </h3>
                        <span className="px-1.5 py-0.2 rounded bg-[#6C63FF] text-[9px] font-bold text-white">
                          Lv.{activeConversation.level}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        معرف اللاعب: {activeConversation.playerId}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() =>
                        handleToggleFriend(
                          activeConversation.playerId,
                          activeConversation.name,
                          activeConversation.avatar,
                          activeConversation.level
                        )
                      }
                      className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1 border ${
                        friendIds.includes(activeConversation.playerId)
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                          : 'bg-[#FFD700] border-[#FFD700] text-[#080F1A]'
                      }`}
                    >
                      {friendIds.includes(activeConversation.playerId) ? (
                        <>
                          <UserCheck size={12} />
                          <span>صديقك</span>
                        </>
                      ) : (
                        <>
                          <UserPlus size={12} />
                          <span>أضف كصديق</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => setActiveConversationId(null)}
                      className="p-2 rounded-xl bg-white/5 text-slate-300"
                    >
                      <ChevronLeft size={18} />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
                  {activeConversation.messages.map((m, idx) => (
                    <div
                      key={idx}
                      className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-xs ${
                        m.fromMe
                          ? 'bg-gradient-to-r from-[#6C63FF] to-[#5B52E5] text-white mr-auto'
                          : 'bg-[#101C30] text-slate-200 border border-white/10 ml-auto'
                      }`}
                    >
                      <p>{m.text}</p>
                      <span className="block text-[9px] opacity-70 mt-1 text-left">
                        {m.time}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Quick Actions inside Private Chat (Send HD Gift or Quick Friend Greeting) */}
                <div className="px-3 py-1.5 bg-[#0C1526] border-t border-white/5 flex items-center gap-2 overflow-x-auto">
                  <button
                    onClick={() => {
                      setGiftRecipient(activeConversation.name);
                      triggerGiftSend(GIFTS_LIST[0], activeConversation.name);
                    }}
                    className="px-2.5 py-1 rounded-full bg-[#FFD700]/15 border border-[#FFD700]/40 text-[10px] font-bold text-[#FFD700] shrink-0"
                  >
                    🦁 إهداء الأسد الملكي HD
                  </button>
                  <button
                    onClick={() => {
                      setDirectInput(
                        `أضفتك كصديق يا ${activeConversation.name} 🤝 تشرفنا بمعرفتك!`
                      );
                    }}
                    className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] text-slate-300 shrink-0"
                  >
                    🤝 رسالة «أضفتك كصديق»
                  </button>
                </div>

                <div className="p-3 bg-[#101C30] border-t border-white/10 flex items-center gap-2">
                  <input
                    type="text"
                    value={directInput}
                    onChange={(e) => setDirectInput(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === 'Enter' && handleSendDirectMessage()
                    }
                    placeholder="اكتب رسالتك في الدردشة الخاصة..."
                    className="flex-1 bg-[#080F1A] border border-white/10 rounded-full px-4 py-2.5 text-xs text-white focus:outline-none"
                  />
                  <button
                    onClick={handleSendDirectMessage}
                    className="p-2.5 rounded-full bg-[#FFD700] text-[#080F1A]"
                  >
                    <Send size={16} className="rotate-180" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =========================================================
            10. SETTINGS SCREEN (الإعدادات)
           ========================================================= */}
        {screen === 'settings' && (
          <div className="flex-1 flex flex-col bg-[#080F1A] overflow-y-auto">
            <div className="px-4 pt-4 pb-3 flex items-center justify-between border-b border-white/10">
              <Settings size={18} className="text-slate-400" />
              <h2 className="text-base font-extrabold text-white">الإعدادات</h2>
              <button
                onClick={() => setScreen('home')}
                className="p-2 rounded-xl bg-white/5 text-slate-300 hover:text-white"
              >
                <ChevronLeft size={18} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <button
                onClick={() => setScreen('profile')}
                className="w-full p-3.5 rounded-2xl bg-[#101C30] border border-white/10 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={APP_IMAGES.avatarHoodedVip}
                    alt={userName}
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 rounded-full object-cover border border-[#FFD700]"
                  />
                  <div className="text-right">
                    <div className="text-sm font-extrabold text-white">
                      {userName} (Lv.{userLevel})
                    </div>
                    <div className="text-xs text-[#00D1FF] font-mono mt-0.5">
                      ID: {myPlayerId}
                    </div>
                  </div>
                </div>
                <ChevronLeft size={16} className="text-slate-400" />
              </button>

              <div className="bg-[#101C30] border border-white/10 rounded-2xl divide-y divide-white/5 overflow-hidden">
                <button
                  onClick={() => setShowLevelsModal(true)}
                  className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-white/5 transition"
                >
                  <div className="flex items-center gap-3 text-xs font-bold text-slate-200">
                    <Award size={17} className="text-[#FFD700]" />
                    <span>المستويات والترقيات الملكية</span>
                  </div>
                  <span className="text-xs font-bold text-[#FFD700]">
                    Lv.{userLevel}
                  </span>
                </button>

                <button
                  onClick={() => setNotifEnabled(!notifEnabled)}
                  className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-white/5 transition"
                >
                  <div className="flex items-center gap-3 text-xs font-bold text-slate-200">
                    <Bell size={17} className="text-rose-400" />
                    <span>الإشعارات</span>
                  </div>
                  <span className="text-[11px] text-[#00D1FF] font-bold">
                    {notifEnabled ? 'مفعلة' : 'مغلقة'}
                  </span>
                </button>

                <button
                  onClick={() =>
                    setLanguage(language === 'العربية' ? 'English' : 'العربية')
                  }
                  className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-white/5 transition"
                >
                  <div className="flex items-center gap-3 text-xs font-bold text-slate-200">
                    <Globe size={17} className="text-purple-400" />
                    <span>اللغة</span>
                  </div>
                  <span className="text-xs text-slate-400">{language}</span>
                </button>

                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-white/5 transition"
                >
                  <div className="flex items-center gap-3 text-xs font-bold text-slate-200">
                    <Moon size={17} className="text-[#FFD700]" />
                    <span>المظهر</span>
                  </div>
                  <span className="text-xs text-slate-400">داكن</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            PLAYER INSPECT MODAL (معرف اللاعب + أضفتك كصديق + دردشة خاصة + إهداء HD)
           ========================================================= */}
        {inspectedPlayer && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 p-4 flex flex-col justify-center">
            <div className="bg-[#0F1A2E] border border-[#00D1FF]/50 rounded-3xl p-5 shadow-2xl relative text-center space-y-4">
              <button
                onClick={() => setInspectedPlayer(null)}
                className="absolute top-4 left-4 text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>

              <div className="flex flex-col items-center">
                <div className="relative w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-[#FFD700] to-[#00D1FF]">
                  <img
                    src={inspectedPlayer.avatar}
                    alt={inspectedPlayer.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full rounded-full object-cover"
                  />
                  <span className="absolute -bottom-1 inset-x-2 py-0.5 rounded-full bg-[#6C63FF] text-[10px] font-black text-white">
                    المستوى {inspectedPlayer.level}
                  </span>
                </div>

                <h3 className="text-base font-extrabold text-white mt-3">
                  {inspectedPlayer.name} 👑
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  {inspectedPlayer.bio || 'عضو نشط في الغرف الصوتية بمجلسنا'}
                </p>

                {/* Player ID Copy Pill */}
                <div className="mt-2.5 inline-flex items-center gap-2 bg-[#080F1A] border border-white/15 px-3 py-1 rounded-full">
                  <span className="text-xs font-mono font-bold text-[#00D1FF]">
                    معرف اللاعب ID: {inspectedPlayer.playerId}
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(inspectedPlayer.playerId);
                      showToast(
                        `تم نسخ معرف ${inspectedPlayer.name} (${inspectedPlayer.playerId})`
                      );
                    }}
                    className="text-[10px] bg-[#FFD700] text-[#080F1A] font-extrabold px-2 py-0.5 rounded-full"
                  >
                    نسخ
                  </button>
                </div>
              </div>

              {/* Action Buttons: Add Friend + Private Chat + Send HD Gift */}
              <div className="grid grid-cols-2 gap-2.5 pt-2">
                <button
                  onClick={() =>
                    handleToggleFriend(
                      inspectedPlayer.playerId,
                      inspectedPlayer.name,
                      inspectedPlayer.avatar,
                      inspectedPlayer.level
                    )
                  }
                  className={`py-2.5 px-3 rounded-2xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition ${
                    friendIds.includes(inspectedPlayer.playerId)
                      ? 'bg-emerald-500/20 border border-emerald-500 text-emerald-300'
                      : 'bg-gradient-to-r from-[#F59E0B] to-[#FFD700] text-[#080F1A]'
                  }`}
                >
                  {friendIds.includes(inspectedPlayer.playerId) ? (
                    <>
                      <UserCheck size={15} />
                      <span>تمت إضافته كصديق</span>
                    </>
                  ) : (
                    <>
                      <UserPlus size={15} />
                      <span>أضفتك كصديقي</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() =>
                    openPrivateChatWithPlayer(
                      inspectedPlayer.playerId,
                      inspectedPlayer.name,
                      inspectedPlayer.avatar,
                      inspectedPlayer.level
                    )
                  }
                  className="py-2.5 px-3 rounded-2xl bg-[#6C63FF] hover:bg-[#5a52e0] text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <MessageSquare size={15} />
                  <span>دردشة خاصة</span>
                </button>
              </div>

              <button
                onClick={() => {
                  const target = inspectedPlayer.name;
                  setInspectedPlayer(null);
                  triggerGiftSend(GIFTS_LIST[0], target);
                }}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500/25 to-purple-600/25 border border-[#FFD700] text-[#FFD700] font-extrabold text-xs flex items-center justify-center gap-2 hover:bg-[#FFD700]/20 transition"
              >
                <Sparkles size={15} />
                <span>إهداء الأسد الملكي المتحرك HD لـ {inspectedPlayer.name}</span>
              </button>
            </div>
          </div>
        )}

        {/* =========================================================
            LEVELS & COIN RECHARGE RANKS MODAL (المستويات 1 إلى 9 حسب شحن الكوينز)
           ========================================================= */}
        {showLevelsModal && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md z-50 p-4 flex flex-col justify-center">
            <div className="bg-[#0F1A2E] border border-[#FFD700]/40 rounded-3xl p-4 shadow-2xl relative space-y-3.5 max-h-[88vh] overflow-y-auto">
              <button
                onClick={() => setShowLevelsModal(false)}
                className="absolute top-4 left-4 text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>

              <div className="text-center">
                <Award size={30} className="text-[#FFD700] mx-auto mb-1" />
                <h2 className="text-base font-extrabold text-[#FFD700]">
                  جدول مستويات شحن اللاعب (Lv.1 — Lv.9)
                </h2>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  مستواك الحالي: <strong className="text-[#FFD700]">Lv.{userLevel}</strong> · إجمالي شحنك:{' '}
                  <strong className="text-emerald-400 font-mono">
                    {totalRechargedCoins.toLocaleString('en-US')}
                  </strong>{' '}
                  كوينز
                </p>
              </div>

              {/* All 9 Recharge Tiers */}
              <div className="space-y-2">
                {LEVEL_TIERS.map((tier) => {
                  const unlocked =
                    totalRechargedCoins >= tier.requiredRechargedCoins;
                  return (
                    <div
                      key={tier.level}
                      className={`p-3 rounded-2xl border flex items-center justify-between gap-2 ${
                        unlocked
                          ? 'bg-[#152542] border-[#FFD700]/60'
                          : 'bg-[#0B1424] border-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`px-2.5 py-1.5 rounded-xl bg-gradient-to-r ${tier.badgeColor} text-xs font-black text-white shrink-0 shadow`}
                        >
                          Lv.{tier.level}
                        </span>
                        <div className="min-w-0">
                          <div className="text-xs font-extrabold text-white flex items-center gap-1 flex-wrap">
                            <span>{tier.title}</span>
                            {tier.unlocksAnimatedBackground && (
                              <span className="px-1.5 py-0.2 rounded bg-[#FFD700] text-[#080F1A] text-[9px] font-black">
                                خلفية متحركة ✨
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-[#00D1FF] font-mono font-bold mt-0.5">
                            عند شحن {tier.requiredRechargedCoins.toLocaleString('en-US')} كوينز
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {tier.perks}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {unlocked ? (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-[10px] font-extrabold">
                            مفعل ✓
                          </span>
                        ) : (
                          <button
                            onClick={() =>
                              handleJumpToRechargeMilestone(
                                tier.requiredRechargedCoins,
                                tier.level
                              )
                            }
                            className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#FFD700] text-[#080F1A] text-[10px] font-extrabold hover:brightness-110 transition"
                          >
                            شحن للمستوى {tier.level}
                          </button>
                        )}

                        {tier.unlocksAnimatedBackground && unlocked && (
                          <button
                            onClick={() => {
                              setShowLevelsModal(false);
                              setShowAnimatedBgModal(true);
                            }}
                            className="text-[10px] text-[#FFD700] underline font-bold"
                          >
                            اختر خلفية متحركة
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            LEVEL 9 ANIMATED BACKGROUND STUDIO MODAL (تخصيص خلفية متحركة لمستوى 9)
           ========================================================= */}
        {showAnimatedBgModal && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md z-50 p-4 flex flex-col justify-center">
            <div className="bg-[#0F1A2E] border border-[#FFD700]/50 rounded-3xl p-5 shadow-2xl relative space-y-4 max-h-[88vh] overflow-y-auto">
              <button
                onClick={() => setShowAnimatedBgModal(false)}
                className="absolute top-4 left-4 text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>

              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-2xl bg-[#FFD700]/15 border border-[#FFD700]/50 flex items-center justify-center mx-auto text-2xl">
                  👑
                </div>
                <h2 className="text-base font-extrabold text-[#FFD700]">
                  استوديو الخلفيات المتحركة (حصري للمستوى 9)
                </h2>
                <p className="text-[11px] text-slate-300">
                  عند شحن <strong>1,100,000 كوينز</strong> والوصول إلى{' '}
                  <strong>المستوى 9</strong> يقدر اللاعب يسوي خلفية متحركة لحسابه وغرفته الصوتية!
                </p>
              </div>

              {!canUseAnimatedBg && (
                <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-[#FFD700]/50 text-center space-y-2">
                  <p className="text-xs font-bold text-[#FFD700]">
                    🔒 مستواك الحالي Lv.{userLevel} (شحنت{' '}
                    {totalRechargedCoins.toLocaleString('en-US')} من 1,100,000 كوينز)
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleJumpToRechargeMilestone(1100000, 9)}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#FFD700] text-[#080F1A] text-xs font-extrabold shadow-md"
                    >
                      ⚡ شحن فوري 1,100,000 كوينز (تفعيل المستوى 9 الآن)
                    </button>
                    <button
                      onClick={() =>
                        buyCoinsViaWhatsapp(
                          1100000,
                          'باقة المستوى 9 (1,100,000 كوينز + خلفية متحركة)'
                        )
                      }
                      className="px-3 py-2 rounded-xl bg-[#13223A] border border-[#00D1FF]/40 text-[#00D1FF] text-xs font-bold"
                    >
                      طلب عبر واتساب
                    </button>
                  </div>
                </div>
              )}

              {/* Animated Background Presets Grid */}
              <div className="space-y-2.5">
                {ANIMATED_BACKGROUNDS.map((bg) => {
                  const isSelected = activeAnimatedBgId === bg.id;
                  return (
                    <div
                      key={bg.id}
                      onClick={() => {
                        if (!canUseAnimatedBg) {
                          showToast(
                            'هذه الميزة تتطلب الوصول إلى المستوى 9 (شحن 1,100,000 كوينز) — اضغط زر التفعيل بالأعلى!'
                          );
                          return;
                        }
                        setActiveAnimatedBgId(bg.id);
                        setCustomAnimatedBgUrl('');
                        showToast(`✨ تم تفعيل «${bg.name}» كخلفية متحركة!`);
                      }}
                      className={`relative rounded-2xl overflow-hidden border p-3 flex items-center justify-between cursor-pointer transition ${
                        isSelected && canUseAnimatedBg
                          ? 'border-[#FFD700] ring-2 ring-[#FFD700]/40 bg-[#162746]'
                          : 'border-white/10 bg-[#0B1424] hover:border-white/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-[#FFD700]/40 shrink-0">
                          <img
                            src={bg.previewImage}
                            alt={bg.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover animate-pulse"
                          />
                          <span className="absolute bottom-0.5 right-0.5 text-xs">
                            {bg.particleEmoji}
                          </span>
                        </div>
                        <div>
                          <div className="text-xs font-extrabold text-white">
                            {bg.name}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {bg.subtitle}
                          </div>
                        </div>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold shrink-0 ${
                          isSelected && canUseAnimatedBg
                            ? 'bg-[#FFD700] text-[#080F1A]'
                            : 'bg-white/10 text-slate-300'
                        }`}
                      >
                        {isSelected && canUseAnimatedBg ? 'مفعلة ✓' : 'تطبيق'}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Custom Animated GIF / Image URL for Level 9 */}
              <div className="bg-[#0B1424] border border-white/10 rounded-2xl p-3 space-y-2">
                <label className="block text-[11px] font-bold text-[#00D1FF]">
                  أو ضع رابط خلفية متحركة خاصة بك (GIF / صورة عالية الدقة):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={customAnimatedBgUrl}
                    onChange={(e) => setCustomAnimatedBgUrl(e.target.value)}
                    disabled={!canUseAnimatedBg}
                    placeholder="https://example.com/animated-background.gif"
                    dir="ltr"
                    className="flex-1 bg-[#101C30] border border-white/10 rounded-xl px-3 py-2 text-[11px] text-white placeholder-slate-500 focus:outline-none disabled:opacity-50"
                  />
                  <button
                    type="button"
                    disabled={!canUseAnimatedBg}
                    onClick={() => {
                      if (!customAnimatedBgUrl.trim()) return;
                      setActiveAnimatedBgId('royal_gold_nebula');
                      showToast('تم تطبيق رابط الخلفية المتحركة الخاصة بك بنجاح!');
                    }}
                    className="px-3 py-2 rounded-xl bg-[#FFD700] text-[#080F1A] text-xs font-extrabold disabled:opacity-50"
                  >
                    حفظ
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            SIDE NAVIGATION DRAWER (القائمة الجانبية)
           ========================================================= */}
        {drawerOpen && (
          <div className="absolute inset-0 z-40 flex">
            <div
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-xs"
            />
            <div className="relative z-10 w-72 h-full bg-[#0B1426] border-l border-white/10 p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 pb-4 border-b border-white/10">
                  <img
                    src={APP_IMAGES.avatarHoodedVip}
                    alt={userName}
                    referrerPolicy="no-referrer"
                    className="w-14 h-14 rounded-full object-cover border-2 border-[#FFD700]"
                  />
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-extrabold text-white">
                        {userName}
                      </span>
                      <span className="text-xs">👑</span>
                    </div>
                    <span className="text-[11px] text-[#00D1FF] font-mono block">
                      ID: {myPlayerId}
                    </span>
                    <span className="text-[11px] text-[#FFD700] font-semibold">
                      {getRankTitle(userLevel)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 my-4">
                  <button
                    onClick={() => {
                      setDrawerOpen(false);
                      setShowTopupModal(true);
                    }}
                    className="flex-1 py-1.5 px-3 rounded-full bg-[#13223A] border border-[#FFD700]/40 flex items-center justify-center gap-1.5 text-xs font-extrabold text-[#FFD700]"
                  >
                    <Coins size={13} />
                    <AnimatedCoinCounter value={coins} />
                  </button>
                  <button
                    onClick={() => {
                      setDrawerOpen(false);
                      setShowLevelsModal(true);
                    }}
                    className="flex-1 py-1.5 px-3 rounded-full bg-[#6C63FF]/20 border border-[#6C63FF]/50 text-center text-xs font-bold text-purple-200"
                  >
                    المستوى {userLevel}
                  </button>
                </div>

                <nav className="space-y-1">
                  {[
                    {
                      label: 'صفحتي الشخصية والمعرّف',
                      icon: User,
                      action: () => setScreen('profile'),
                    },
                    {
                      label: 'الغرفة الصوتية (مايكات متجاورة)',
                      icon: Mic,
                      action: () => setScreen('room'),
                    },
                    {
                      label: 'الدردشة الخاصة والأصدقاء',
                      icon: MessageSquare,
                      action: () => {
                        setActiveConversationId(null);
                        setScreen('messages');
                      },
                    },
                    {
                      label: 'خدمات Google (Drive, Gmail, Keep, Tasks, Chat)',
                      icon: Globe,
                      action: () => setScreen('workspace_hub'),
                    },
                    {
                      label: 'جهات الاتصال (Google Contacts)',
                      icon: Users,
                      action: () => setShowContactsModal(true),
                    },
                    {
                      label: 'الهدايا المتحركة HD',
                      icon: Gift,
                      action: () => setScreen('gifts'),
                    },
                    {
                      label: 'نظام المستويات',
                      icon: Award,
                      action: () => setShowLevelsModal(true),
                    },
                    {
                      label: 'الإعدادات',
                      icon: Settings,
                      action: () => setScreen('settings'),
                    },
                    {
                      label: 'تنزيل وتثبيت التطبيق',
                      icon: Download,
                      action: () => setShowDownloadModal(true),
                    },
                  ].map((item, idx) => {
                    const IconComp = item.icon;
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          setDrawerOpen(false);
                          item.action();
                        }}
                        className="w-full px-3 py-2.5 rounded-xl hover:bg-white/5 flex items-center justify-between text-xs font-bold text-slate-200 transition"
                      >
                        <div className="flex items-center gap-3">
                          <IconComp size={16} className="text-slate-400" />
                          <span>{item.label}</span>
                        </div>
                        <ChevronLeft size={14} className="text-slate-500" />
                      </button>
                    );
                  })}
                </nav>
              </div>

              <div className="pt-3 border-t border-white/10 text-center">
                <BrandCrownLogo size="sm" />
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            WHATSAPP COIN TOP-UP STORE MODAL (+967776551633)
           ========================================================= */}
        {showTopupModal && (
          <div className="absolute inset-0 bg-[#050811]/90 backdrop-blur-md z-50 p-4 flex flex-col justify-center">
            <div className="bg-[#0F1A2E] border border-[#FFD700]/40 rounded-3xl p-5 shadow-2xl relative max-h-[88vh] overflow-y-auto">
              <button
                onClick={() => setShowTopupModal(false)}
                className="absolute top-4 left-4 text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>

              <div className="text-center mb-4">
                <div className="w-12 h-12 bg-[#FFD700]/10 text-[#FFD700] rounded-full flex items-center justify-center mx-auto mb-2 border border-[#FFD700]/30">
                  <ShoppingBag size={24} />
                </div>
                <h2 className="text-lg font-extrabold text-[#FFD700]">
                  متجر شحن كوينز وترقية مستويات توب شات
                </h2>
                <p className="text-xs text-slate-300 mt-0.5">
                  معرف اللاعب: <strong className="text-white">{myPlayerId}</strong> · مستواك:{' '}
                  <strong className="text-[#FFD700]">Lv.{userLevel}</strong> (إجمالي شحنك:{' '}
                  <strong className="text-emerald-400 font-mono">
                    {totalRechargedCoins.toLocaleString('en-US')}
                  </strong>
                  )
                </p>
                <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-[#122137] border border-[#FFD700]/40 rounded-full text-xs font-bold text-amber-200">
                  <Coins size={14} className="text-[#FFD700]" />
                  <span>رصيدك الحالي:</span>
                  <AnimatedCoinCounter value={coins} className="text-sm font-black text-[#FFD700]" />
                  <span>كوينز</span>
                </div>
              </div>

              <div className="space-y-2.5 mb-4">
                {TOPUP_PACKAGES.map((pkg) => (
                  <div
                    key={pkg.id}
                    className={`flex justify-between items-center p-3 rounded-2xl border gap-2 ${
                      pkg.popular
                        ? 'bg-[#FFD700]/10 border-[#FFD700] text-white'
                        : 'bg-[#15233C] border-white/10 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Coins size={20} className="text-[#FFD700] shrink-0" />
                      <div className="min-w-0">
                        <div className="text-[11px] font-bold text-[#00D1FF] truncate">
                          {pkg.title}
                        </div>
                        <div className="font-extrabold text-xs flex items-center gap-1.5 flex-wrap text-white">
                          <span>{pkg.coins.toLocaleString('en-US')} كوينزة</span>
                          {pkg.bonus > 0 && (
                            <span className="text-[10px] text-emerald-400">
                              +{pkg.bonus.toLocaleString('en-US')} هدية
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-black text-[#FFD700] mt-0.5">
                          السعر: {pkg.price}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5 shrink-0">
                      <button
                        onClick={() => handleApplyCoinRecharge(pkg.coins)}
                        className="bg-gradient-to-r from-[#F59E0B] to-[#FFD700] hover:brightness-110 text-[#080F1A] text-[11px] px-3 py-1.5 rounded-xl font-extrabold flex items-center justify-center gap-1 transition"
                      >
                        <Sparkles size={12} />
                        <span>شحن فوري</span>
                      </button>
                      <button
                        onClick={() => buyCoinsViaWhatsapp(pkg.coins, pkg.price)}
                        className="bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-[10px] px-2.5 py-1 rounded-xl font-bold flex items-center justify-center gap-1 hover:bg-emerald-500/30 transition"
                      >
                        <MessageSquare size={11} />
                        <span>واتساب</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-[10px] text-center text-slate-400">
                رقم الإدارة المعتمد للشحن المباشر عبر الواتساب: +{WHATSAPP_NUMBER}
              </p>
            </div>
          </div>
        )}

        {/* =========================================================
            CREATE NEW ROOM MODAL
           ========================================================= */}
        {showCreateRoomModal && (
          <div className="absolute inset-0 bg-[#050811]/90 backdrop-blur-md z-50 p-4 flex flex-col justify-center">
            <form
              onSubmit={handleCreateRoom}
              className="bg-[#0F1A2E] border border-[#00D1FF]/40 rounded-3xl p-5 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-white">
                  إنشاء غرفة صوتية جديدة
                </h3>
                <button
                  type="button"
                  onClick={() => setShowCreateRoomModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <input
                type="text"
                required
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                placeholder="اسم الغرفة (مثال: ديوان السمر والشعر)"
                className="w-full bg-[#080F1A] border border-white/15 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#FFD700]"
              />

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-300">
                  اختر تصنيف الغرفة الصوتية:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {ROOM_CATEGORIES.filter((c) => c.id !== 'all').map((cat) => {
                    const selected = newRoomCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() =>
                          setNewRoomCategory(
                            cat.id as Exclude<RoomTopicCategory, 'all'>
                          )
                        }
                        className={`p-2.5 rounded-xl border text-right text-xs font-bold flex items-center gap-2 transition ${
                          selected
                            ? 'bg-[#162847] border-[#FFD700] text-[#FFD700]'
                            : 'bg-[#080F1A] border-white/10 text-slate-300'
                        }`}
                      >
                        <span>{cat.emoji}</span>
                        <span className="truncate">{cat.shortLabel}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <input
                type="text"
                value={newRoomDesc}
                onChange={(e) => setNewRoomDesc(e.target.value)}
                placeholder="وصف مختصر للغرفة (اختياري)..."
                className="w-full bg-[#080F1A] border border-white/15 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#00D1FF]"
              />

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#F59E0B] to-[#FFD700] text-[#080F1A] font-extrabold text-xs"
              >
                افتتاح الغرفة الآن
              </button>
            </form>
          </div>
        )}

        {/* =========================================================
            DOWNLOAD & INSTALL APP MODAL
           ========================================================= */}
        {showDownloadModal && (
          <div className="absolute inset-0 bg-[#050811]/92 backdrop-blur-md z-50 p-4 flex flex-col justify-center">
            <div className="bg-[#0F1A2E] border border-[#FFD700]/40 rounded-3xl p-5 shadow-2xl relative space-y-4">
              <button
                onClick={() => setShowDownloadModal(false)}
                className="absolute top-4 left-4 text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>

              <div className="text-center space-y-1">
                <div className="w-12 h-12 bg-[#FFD700]/15 text-[#FFD700] rounded-2xl flex items-center justify-center mx-auto mb-2 border border-[#FFD700]/40">
                  <Smartphone size={24} />
                </div>
                <h2 className="text-base font-extrabold text-[#FFD700]">
                  تنزيل وتثبيت تطبيق توب شات
                </h2>
              </div>

              <div className="bg-[#080F1A] border border-white/15 rounded-2xl p-3 space-y-2">
                <div className="text-[11px] font-bold text-[#00D1FF]">
                  رابط التطبيق المباشر للمشاركة والتنزيل:
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={SHARED_APP_URL}
                    dir="ltr"
                    className="flex-1 bg-[#101C30] border border-white/10 rounded-xl px-2.5 py-2 text-[10px] text-slate-200 select-all focus:outline-none"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(SHARED_APP_URL);
                      showToast('تم نسخ رابط تنزيل تطبيق توب شات بنجاح!');
                    }}
                    className="px-3 py-2 rounded-xl bg-[#FFD700] text-[#080F1A] text-xs font-extrabold flex items-center gap-1 shrink-0"
                  >
                    <Copy size={13} />
                    <span>نسخ</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Agora Voice Settings Modal */}
        <AgoraVoiceSettingsModal
          isOpen={showAgoraModal}
          onClose={() => setShowAgoraModal(false)}
          roomCode={activeRoom.roomCode}
          roomTitle={activeRoom.title}
          myMicMuted={myMicMuted}
          speakerMuted={speakerMuted}
          onToggleMic={handleToggleMyMic}
          onToggleSpeaker={handleToggleSpeaker}
        />

        {/* Google Contacts Modal (Google People API) */}
        <GoogleContactsModal
          isOpen={showContactsModal}
          onClose={() => setShowContactsModal(false)}
          roomCode={activeRoom?.roomCode}
          roomTitle={activeRoom?.title}
          onShowToast={showToast}
          onRequestGoogleSignIn={handleGoogleSignIn}
        />
      </div>
    </div>
  );
}
