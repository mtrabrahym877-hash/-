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
          bio: (profileData.bio || 'مرحباً بكم في توب شات').slice(0, 200),
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
          bio: (profileData.bio || 'مرحباً بكم في توب شات').slice(0, 200),
          coins: profileData.coins ?? 12450,
          totalCoinsSpent: profileData.totalCoinsSpent ?? 0,
          totalGiftsReceived: profileData.totalGiftsReceived ?? 0,
          vipTier: profileData.vipTier || 'member',
          activeBadge: profileData.activeBadge || 'وجيه المجلس',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (
        msg.includes('the client is offline') ||
        msg.includes('offline') ||
        msg.includes('unavailable') ||
        msg.includes('network')
      ) {
        console.warn('Firestore offline notice during syncUserProfile:', msg);
        return;
      }
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
    const roomsQuery = query(
      collection(db, 'rooms'),
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
        console.warn('Firestore rooms subscription status:', err.message || err);
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
    if (!auth.currentUser) {
      console.warn('Cannot create room in Firestore: user not authenticated');
      return;
    }
    const activeHostId = auth.currentUser.uid;
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
      console.warn('Could not create room in Firestore:', err);
    }
  }

  /**
   * Subscribe to real-time seats inside a Voice Room (/rooms/{roomId}/seats)
   */
  public subscribeSeats(
    roomId: string,
    callback: (seats: RoomSeat[]) => void
  ): Unsubscribe {
    const seatsRef = collection(db, 'rooms', roomId, 'seats');
    return onSnapshot(
      seatsRef,
      (snapshot) => {
        const seats: RoomSeat[] = [];
        snapshot.forEach((docSnap) => {
          seats.push(docSnap.data() as RoomSeat);
        });
        callback(seats);
      },
      (err) => {
        console.warn('Firestore seats subscription status:', err.message || err);
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
    if (!auth.currentUser) return;
    const activeUid = auth.currentUser.uid;
    const seatId = `seat_${seatIndex}`;
    const seatRef = doc(db, 'rooms', roomId, 'seats', seatId);
    try {
      await setDoc(seatRef, {
        seatIndex,
        roomId,
        uid: activeUid,
        displayName: (user.displayName || 'عضو المجلس').slice(0, 60),
        photoURL: (user.photoURL || '').slice(0, 500),
        vipTier: user.vipTier || 'member',
        isMuted: false,
        isSpeaking: false,
        joinedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn('Could not take seat in Firestore:', err);
    }
  }

  /**
   * Leave a microphone seat
   */
  public async leaveSeat(roomId: string, seatIndex: number): Promise<void> {
    if (!auth.currentUser) return;
    const seatId = `seat_${seatIndex}`;
    const seatRef = doc(db, 'rooms', roomId, 'seats', seatId);
    try {
      await deleteDoc(seatRef);
    } catch (err) {
      console.warn('Could not remove seat from Firestore:', err);
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
    if (!auth.currentUser) return;
    const seatId = `seat_${seatIndex}`;
    const seatRef = doc(db, 'rooms', roomId, 'seats', seatId);
    try {
      const snap = await getDoc(seatRef);
      if (!snap.exists()) return;
      await updateDoc(seatRef, {
        isMuted,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn('Could not update seat mute in Firestore:', err);
    }
  }

  /**
   * Real-time subscription to room chat messages (/rooms/{roomId}/messages)
   */
  public subscribeMessages(
    roomId: string,
    callback: (messages: RoomMessage[]) => void
  ): Unsubscribe {
    const messagesRef = collection(db, 'rooms', roomId, 'messages');
    const q = query(messagesRef, limit(50));

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
        console.warn('Firestore messages subscription status:', err.message || err);
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
    if (!auth.currentUser) return;
    const activeSenderId = auth.currentUser.uid;
    const messageId = `msg_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const msgRef = doc(db, 'rooms', roomId, 'messages', messageId);

    try {
      await setDoc(msgRef, {
        roomId,
        senderId: activeSenderId,
        senderName: (msg.senderName || 'عضو المجلس').slice(0, 60),
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
      console.warn('Could not write message to Firestore:', err);
    }
  }
}

export const firebaseMajlisService = new FirebaseMajlisService();
