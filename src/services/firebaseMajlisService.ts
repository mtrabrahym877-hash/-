import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  updateDoc,
  deleteDoc,
  Unsubscribe,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import {
  UserProfile,
  VoiceRoom,
  RoomSeat,
  RoomMessage,
  VipTier,
  RoomCategory,
} from '../types';

export class FirebaseMajlisService {
  /**
   * Syncs user profile with Firestore (/users/{userId})
   */
  public async syncUserProfile(
    uid: string,
    profileData: {
      displayName: string;
      photoURL?: string;
      bio?: string;
      coins?: number;
      totalCoinsSpent?: number;
      totalGiftsReceived?: number;
      vipTier?: VipTier;
      activeBadge?: string;
    }
  ): Promise<void> {
    const userRef = doc(db, 'users', uid);
    try {
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        await updateDoc(userRef, {
          displayName: profileData.displayName.slice(0, 60),
          photoURL: (profileData.photoURL || '').slice(0, 500),
          bio: (profileData.bio || 'مرحباً بكم في مجلسنا').slice(0, 200),
          coins: profileData.coins ?? snap.data()?.coins ?? 12450,
          vipTier: profileData.vipTier || snap.data()?.vipTier || 'member',
          activeBadge: profileData.activeBadge || snap.data()?.activeBadge || 'وجيه المجلس',
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(userRef, {
          uid,
          displayName: profileData.displayName.slice(0, 60),
          photoURL: (profileData.photoURL || '').slice(0, 500),
          bio: (profileData.bio || 'مرحباً بكم في مجلسنا').slice(0, 200),
          coins: profileData.coins ?? 12450,
          totalCoinsSpent: profileData.totalCoinsSpent ?? 0,
          totalGiftsReceived: profileData.totalGiftsReceived ?? 0,
          vipTier: profileData.vipTier || 'member',
          activeBadge: profileData.activeBadge || 'وجيه المجلس',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${uid}`);
    }
  }

  /**
   * Listen to user profile changes in real-time
   */
  public subscribeUserProfile(
    uid: string,
    callback: (profile: UserProfile | null) => void
  ): Unsubscribe {
    const userRef = doc(db, 'users', uid);
    return onSnapshot(
      userRef,
      (snap) => {
        if (snap.exists()) {
          callback(snap.data() as UserProfile);
        } else {
          callback(null);
        }
      },
      (err) => {
        handleFirestoreError(err, OperationType.GET, `users/${uid}`);
      }
    );
  }

  /**
   * Real-time subscription to voice rooms collection (/rooms)
   */
  public subscribeRooms(
    callback: (rooms: VoiceRoom[]) => void
  ): Unsubscribe {
    if (!auth.currentUser) {
      return () => {};
    }

    const roomsQuery = query(
      collection(db, 'rooms'),
      where('status', 'in', ['active', 'closed']),
      limit(20)
    );

    return onSnapshot(
      roomsQuery,
      (snapshot) => {
        const rooms: VoiceRoom[] = [];
        snapshot.forEach((docSnap) => {
          rooms.push(docSnap.data() as VoiceRoom);
        });
        callback(rooms);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'rooms');
      }
    );
  }

  /**
   * Create a new Voice Room in Firestore
   */
  public async createVoiceRoom(
    room: {
      roomId: string;
      title: string;
      topic: string;
      category: RoomCategory;
      hostId: string;
      hostName: string;
    }
  ): Promise<void> {
    const activeHostId = auth.currentUser?.uid || room.hostId;
    const roomRef = doc(db, 'rooms', room.roomId);
    try {
      await setDoc(roomRef, {
        roomId: room.roomId,
        title: room.title.slice(0, 80),
        topic: (room.topic || 'مجلس حواري هادف وسوالف طيبة').slice(0, 160),
        category: room.category,
        hostId: activeHostId,
        hostName: room.hostName.slice(0, 60),
        status: 'active',
        totalCoinsSupport: 0,
        speakerCount: 1,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `rooms/${room.roomId}`);
    }
  }

  /**
   * Subscribe to real-time seats inside a Voice Room (/rooms/{roomId}/seats)
   */
  public subscribeSeats(
    roomId: string,
    callback: (seats: RoomSeat[]) => void
  ): Unsubscribe {
    if (!auth.currentUser) {
      return () => {};
    }

    const seatsRef = collection(db, 'rooms', roomId, 'seats');
    const seatsQuery = query(seatsRef, where('roomId', '==', roomId));

    return onSnapshot(
      seatsQuery,
      (snapshot) => {
        const seats: RoomSeat[] = [];
        snapshot.forEach((docSnap) => {
          seats.push(docSnap.data() as RoomSeat);
        });
        callback(seats);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, `rooms/${roomId}/seats`);
      }
    );
  }

  /**
   * Take or claim a mic seat in a room
   */
  public async takeSeat(
    roomId: string,
    seatIndex: number,
    user: {
      uid: string;
      displayName: string;
      photoURL?: string;
      vipTier?: VipTier;
    }
  ): Promise<void> {
    const activeUid = auth.currentUser?.uid || user.uid;
    const seatId = `seat_${seatIndex}`;
    const seatRef = doc(db, 'rooms', roomId, 'seats', seatId);
    try {
      await setDoc(seatRef, {
        seatIndex,
        roomId,
        uid: activeUid,
        displayName: user.displayName.slice(0, 60),
        photoURL: (user.photoURL || '').slice(0, 500),
        vipTier: user.vipTier || 'member',
        isMuted: false,
        isSpeaking: false,
        joinedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `rooms/${roomId}/seats/${seatId}`);
    }
  }

  /**
   * Leave a microphone seat
   */
  public async leaveSeat(roomId: string, seatIndex: number): Promise<void> {
    const seatId = `seat_${seatIndex}`;
    const seatRef = doc(db, 'rooms', roomId, 'seats', seatId);
    try {
      await deleteDoc(seatRef);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `rooms/${roomId}/seats/${seatId}`);
    }
  }

  /**
   * Toggle mute for a microphone seat
   */
  public async toggleSeatMute(
    roomId: string,
    seatIndex: number,
    isMuted: boolean
  ): Promise<void> {
    const seatId = `seat_${seatIndex}`;
    const seatRef = doc(db, 'rooms', roomId, 'seats', seatId);
    try {
      await updateDoc(seatRef, {
        isMuted,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `rooms/${roomId}/seats/${seatId}`);
    }
  }

  /**
   * Real-time subscription to room chat messages (/rooms/{roomId}/messages)
   */
  public subscribeMessages(
    roomId: string,
    callback: (messages: RoomMessage[]) => void
  ): Unsubscribe {
    if (!auth.currentUser) {
      return () => {};
    }

    const messagesRef = collection(db, 'rooms', roomId, 'messages');
    const q = query(
      messagesRef,
      where('roomId', '==', roomId),
      limit(50)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const msgs: RoomMessage[] = [];
        snapshot.forEach((docSnap) => {
          msgs.push({
            id: docSnap.id,
            ...(docSnap.data() as Omit<RoomMessage, 'id'>),
          });
        });
        callback(msgs);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, `rooms/${roomId}/messages`);
      }
    );
  }

  /**
   * Send a real-time text chat message or gift broadcast in the room
   */
  public async sendMessage(
    roomId: string,
    msg: {
      senderId: string;
      senderName: string;
      senderPhoto?: string;
      senderVipTier?: VipTier;
      text: string;
      type?: 'chat' | 'gift' | 'system';
      giftName?: string;
      giftCoins?: number;
      recipientName?: string;
    }
  ): Promise<void> {
    const activeSenderId = auth.currentUser?.uid || msg.senderId;
    const messageId = `msg_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const msgRef = doc(db, 'rooms', roomId, 'messages', messageId);

    try {
      await setDoc(msgRef, {
        roomId,
        senderId: activeSenderId,
        senderName: msg.senderName.slice(0, 60),
        senderPhoto: (msg.senderPhoto || '').slice(0, 500),
        senderVipTier: msg.senderVipTier || 'member',
        text: msg.text.slice(0, 400),
        type: msg.type || 'chat',
        giftName: (msg.giftName || '').slice(0, 60),
        giftCoins: msg.giftCoins ?? 0,
        recipientName: (msg.recipientName || '').slice(0, 60),
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.CREATE,
        `rooms/${roomId}/messages/${messageId}`
      );
    }
  }
}

export const firebaseMajlisService = new FirebaseMajlisService();
