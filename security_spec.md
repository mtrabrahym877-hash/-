# Security Specification — مجلسنا (Majlisna)

## 1. Data Invariants
1. **UserProfile (`/users/{userId}`)**:
   - Document ID `{userId}` must match `request.auth.uid` and `data.uid`.
   - Contains only public profile metadata and coin statistics (no PII like email or phone).
   - `coins`, `totalCoinsSpent`, `totalGiftsReceived` must be non-negative numbers.
   - `createdAt` is immutable and must equal `request.time` on creation.
   - `updatedAt` must equal `request.time`.

2. **VoiceRoom (`/rooms/{roomId}`)**:
   - `hostId` must equal `request.auth.uid` on creation and is immutable.
   - `status` must be `'active'` or `'closed'`. Once `'closed'`, no further updates are permitted (Terminal State Locking).
   - `speakerCount` must be between 0 and 8.

3. **RoomSeat (`/rooms/{roomId}/seats/{seatId}`)**:
   - Parent room `/rooms/{roomId}` must exist and have `status == 'active'` (Master Gate).
   - `uid` must match `request.auth.uid` on creation.
   - `seatIndex` must be an integer between 0 and 7.

4. **RoomMessage (`/rooms/{roomId}/messages/{messageId}`)**:
   - Parent room `/rooms/{roomId}` must exist and have `status == 'active'` (Master Gate).
   - `senderId` must match `request.auth.uid`.
   - Messages are immutable (no update or delete).

5. **CoinTransaction (`/transactions/{txId}`)**:
   - `uid` must match `request.auth.uid`.
   - `list` queries are strictly constrained to `resource.data.uid == request.auth.uid` (Query Enforcer).
   - Transactions are immutable ledger entries (no update or delete).

## 2. The "Dirty Dozen" Payloads (Adversarial Test Cases)
1. **Shadow Field Injection on UserProfile**: `{ uid: "u1", displayName: "Ali", ..., isAdmin: true }` -> Rejected by `hasOnly()`.
2. **Identity Spoofing on VoiceRoom Create**: Creating `/rooms/r1` where `hostId != request.auth.uid` -> Rejected by identity check.
3. **Unverified Email Write**: Authenticated user with `email_verified: false` attempting to create a room -> Rejected by `isVerifiedUser()`.
4. **ID Poisoning**: Creating `/rooms/invalid$id!@#` or 500-char ID -> Rejected by `isValidId()`.
5. **Terminal State Bypass**: Updating a `/rooms/{roomId}` where `existing().status == 'closed'` -> Rejected by Terminal State Lock.
6. **Master Gate Violation (Orphaned Message)**: Posting a message to `/rooms/non_existent/messages/m1` -> Rejected by parent `exists()` and `get()` check.
7. **Temporal Forgery**: Creating a room with `createdAt` set to a past/future timestamp instead of `request.time` -> Rejected by `incoming().createdAt == request.time`.
8. **Immortal Field Mutation**: Updating `hostId` or `createdAt` on `/rooms/{roomId}` -> Rejected by immutability guard.
9. **Value Poisoning on Update**: Updating `coins` on `/users/{userId}` with a string `"999999"` or negative number `-500` -> Rejected by `isValidUserProfile(incoming())` wrapper on update.
10. **Unauthorized Transaction Scraping**: Listing `/transactions` without filtering `uid == request.auth.uid` -> Rejected by `resource.data.uid == request.auth.uid`.
11. **Oversized String Denial-of-Wallet**: Sending a 10,000-character `text` in `/rooms/{roomId}/messages/{messageId}` -> Rejected by `.size() <= 400`.
12. **Cross-User Seat Hijack**: Updating or deleting another user's seat when neither seat owner nor room host -> Rejected by tiered identity check.
