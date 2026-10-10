/**
 * Security Rules Verification Suite — مجلسنا (Majlisna)
 * Validates the "Dirty Dozen" adversarial payloads against Firestore rules.
 */

export interface AdversarialPayloadTest {
  id: number;
  name: string;
  collection: string;
  operation: 'create' | 'update' | 'delete' | 'get' | 'list';
  expectedOutcome: 'PERMISSION_DENIED';
  payload: Record<string, unknown>;
}

export const DIRTY_DOZEN_TESTS: AdversarialPayloadTest[] = [
  {
    id: 1,
    name: 'Shadow Field Injection on UserProfile',
    collection: '/users/user_1',
    operation: 'create',
    expectedOutcome: 'PERMISSION_DENIED',
    payload: {
      uid: 'user_1',
      displayName: 'فهد',
      photoURL: '',
      bio: 'مرحباً',
      coins: 500,
      totalCoinsSpent: 0,
      totalGiftsReceived: 0,
      vipTier: 'member',
      activeBadge: 'عضو',
      isAdmin: true
    }
  },
  {
    id: 2,
    name: 'Identity Spoofing on VoiceRoom Create',
    collection: '/rooms/room_1',
    operation: 'create',
    expectedOutcome: 'PERMISSION_DENIED',
    payload: {
      roomId: 'room_1',
      title: 'مجلس الشعر',
      topic: 'أمسية شعرية',
      category: 'شعر وأدب',
      hostId: 'spoofed_other_uid',
      hostName: 'خالد',
      status: 'active',
      totalCoinsSupport: 0,
      speakerCount: 0
    }
  },
  {
    id: 3,
    name: 'Unverified Email Write on Room Create',
    collection: '/rooms/room_2',
    operation: 'create',
    expectedOutcome: 'PERMISSION_DENIED',
    payload: {
      email_verified: false,
      roomId: 'room_2',
      title: 'مجلس السمر',
      topic: 'سوالف',
      category: 'عام'
    }
  },
  {
    id: 4,
    name: 'ID Poisoning with Special Characters',
    collection: '/rooms/invalid$id!@#',
    operation: 'create',
    expectedOutcome: 'PERMISSION_DENIED',
    payload: {
      roomId: 'invalid$id!@#'
    }
  },
  {
    id: 5,
    name: 'Terminal State Bypass on Closed Room',
    collection: '/rooms/closed_room_1',
    operation: 'update',
    expectedOutcome: 'PERMISSION_DENIED',
    payload: {
      status: 'active',
      title: 'إعادة فتح غير مصرح بها'
    }
  },
  {
    id: 6,
    name: 'Master Gate Violation (Orphaned Message in Closed/Missing Room)',
    collection: '/rooms/missing_room/messages/msg_1',
    operation: 'create',
    expectedOutcome: 'PERMISSION_DENIED',
    payload: {
      roomId: 'missing_room',
      senderId: 'user_1',
      text: 'رسالة يتيمة'
    }
  },
  {
    id: 7,
    name: 'Temporal Forgery on Room Creation',
    collection: '/rooms/room_3',
    operation: 'create',
    expectedOutcome: 'PERMISSION_DENIED',
    payload: {
      createdAt: '2020-01-01T00:00:00Z'
    }
  },
  {
    id: 8,
    name: 'Immortal Field Mutation (Changing hostId)',
    collection: '/rooms/room_1',
    operation: 'update',
    expectedOutcome: 'PERMISSION_DENIED',
    payload: {
      hostId: 'attacker_uid'
    }
  },
  {
    id: 9,
    name: 'Value Poisoning on User Coins Update (Negative Coins)',
    collection: '/users/user_1',
    operation: 'update',
    expectedOutcome: 'PERMISSION_DENIED',
    payload: {
      coins: -99999
    }
  },
  {
    id: 10,
    name: 'Unauthorized Transaction Scraping Across Users',
    collection: '/transactions',
    operation: 'list',
    expectedOutcome: 'PERMISSION_DENIED',
    payload: {
      filterUid: 'other_user_uid'
    }
  },
  {
    id: 11,
    name: 'Oversized String Denial-of-Wallet in RoomMessage',
    collection: '/rooms/room_1/messages/msg_2',
    operation: 'create',
    expectedOutcome: 'PERMISSION_DENIED',
    payload: {
      text: 'أ'.repeat(1000)
    }
  },
  {
    id: 12,
    name: 'Cross-User Seat Hijack by Non-Host',
    collection: '/rooms/room_1/seats/seat_0',
    operation: 'delete',
    expectedOutcome: 'PERMISSION_DENIED',
    payload: {
      requesterUid: 'random_visitor_uid'
    }
  }
];
