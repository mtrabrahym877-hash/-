import React, { useState } from 'react';
import {
  Mic,
  MicOff,
  Send,
  Gift,
  LogOut,
  Volume2,
  UserPlus,
  Coins,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import {
  VoiceRoom,
  RoomSeat,
  RoomMessage,
  UserProfile,
  GIFT_CATALOG,
  GiftItem,
  VIP_TIER_LABELS,
} from '../types';

interface VoiceRoomStageProps {
  room: VoiceRoom;
  seats: RoomSeat[];
  messages: RoomMessage[];
  currentUser: UserProfile;
  micActive: boolean;
  audioLevel: number;
  onTakeSeat: (seatIndex: number) => Promise<void>;
  onLeaveSeat: () => Promise<void>;
  onToggleMute: () => Promise<void>;
  onSendMessage: (text: string) => Promise<void>;
  onSendGift: (gift: GiftItem, recipientUid: string, recipientName: string) => Promise<void>;
  onCloseRoom: () => Promise<void>;
  onOpenStore: () => void;
}

export const VoiceRoomStage: React.FC<VoiceRoomStageProps> = ({
  room,
  seats,
  messages,
  currentUser,
  micActive,
  audioLevel,
  onTakeSeat,
  onLeaveSeat,
  onToggleMute,
  onSendMessage,
  onSendGift,
  onCloseRoom,
  onOpenStore,
}) => {
  const [chatInput, setChatInput] = useState('');
  const [showGiftDrawer, setShowGiftDrawer] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<{
    uid: string;
    name: string;
  } | null>(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [sendingGiftId, setSendingGiftId] = useState<string | null>(null);

  const mySeat = seats.find((s) => s.uid === currentUser.uid);
  const isHost = room.hostId === currentUser.uid;

  const seatSlots = Array.from({ length: 8 }, (_, idx) => {
    return seats.find((s) => s.seatIndex === idx) || null;
  });

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = chatInput.trim();
    if (!trimmed || sendingMessage) return;
    setSendingMessage(true);
    try {
      await onSendMessage(trimmed.slice(0, 400));
      setChatInput('');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleGiftTrigger = async (gift: GiftItem) => {
    if (sendingGiftId) return;
    const target = selectedRecipient || {
      uid: room.hostId,
      name: room.hostName,
    };
    setSendingGiftId(gift.id);
    try {
      await onSendGift(gift, target.uid, target.name);
      setShowGiftDrawer(false);
    } finally {
      setSendingGiftId(null);
    }
  };

  const getTierBorder = (tier: string) => {
    switch (tier) {
      case 'emperor':
        return 'border-[#D4AF37] ring-2 ring-[#D4AF37]/40';
      case 'royal':
        return 'border-emerald-400 ring-1 ring-emerald-400/30';
      case 'gold':
        return 'border-amber-400';
      default:
        return 'border-slate-700';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Voice Stage Column (7 cols on Desktop) */}
      <div className="lg:col-span-7 bg-[#131B2E] border border-white/10 rounded-xl p-6 flex flex-col justify-between">
        {/* Room Header Info */}
        <div className="flex flex-wrap items-start justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
              <span>{room.category}</span>
              <span aria-hidden="true">·</span>
              <span>المضيف: {room.hostName}</span>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-400">بث صوتي نشط</span>
            </div>
            <h2 className="text-2xl font-bold font-display text-white tracking-wide">
              {room.title}
            </h2>
            <p className="text-sm text-slate-300 mt-1">{room.topic}</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-left">
              <span className="block text-xs text-slate-400">دعم المجلس</span>
              <span className="font-mono-num text-sm font-semibold text-[#D4AF37]">
                {room.totalCoinsSupport.toLocaleString('en-US')} كوينز
              </span>
            </div>

            {isHost && room.status === 'active' && (
              <button
                onClick={onCloseRoom}
                className="px-3 py-2 text-xs font-medium text-rose-300 bg-rose-950/60 border border-rose-800/50 rounded-lg hover:bg-rose-900/70 transition-colors whitespace-nowrap"
              >
                إغلاق المجلس
              </button>
            )}
          </div>
        </div>

        {/* 8 Microphone Seats Grid */}
        <div className="my-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-300">
              مقاعد المتحدثين ({seats.length}/8)
            </h3>
            <span className="text-xs text-slate-400">
              اضغط على أي مقعد شاغر للصعود إلى المايك
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {seatSlots.map((occupant, index) => {
              const isMe = occupant?.uid === currentUser.uid;
              const isSeatHost = occupant?.uid === room.hostId;
              const isActivelySpeaking =
                occupant &&
                !occupant.isMuted &&
                (occupant.isSpeaking || (isMe && audioLevel > 12));

              return (
                <div
                  key={index}
                  className={`relative p-4 rounded-xl border transition-all flex flex-col items-center text-center ${
                    occupant
                      ? 'bg-[#0B0F17]/90 border-white/15'
                      : 'bg-[#0B0F17]/40 border-dashed border-white/10 hover:border-[#D4AF37]/50'
                  }`}
                >
                  <span className="absolute top-2.5 right-3 font-mono-num text-[11px] text-slate-500">
                    0{index + 1}
                  </span>

                  {occupant ? (
                    <>
                      {/* Avatar with speaking pulse */}
                      <div className="relative mb-3 mt-1">
                        {isActivelySpeaking && (
                          <span className="absolute -inset-1.5 rounded-full bg-emerald-500/30 animate-ping" />
                        )}
                        <div
                          className={`relative w-16 h-16 rounded-full overflow-hidden border-2 ${getTierBorder(
                            occupant.vipTier
                          )} bg-slate-800 flex items-center justify-center`}
                        >
                          {occupant.photoURL ? (
                            <img
                              src={occupant.photoURL}
                              alt={occupant.displayName}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-lg font-bold text-[#D4AF37]">
                              {occupant.displayName.charAt(0)}
                            </span>
                          )}
                        </div>

                        <span
                          className={`absolute -bottom-1 -left-1 w-6 h-6 rounded-full flex items-center justify-center border border-[#0B0F17] ${
                            occupant.isMuted
                              ? 'bg-rose-600 text-white'
                              : 'bg-emerald-600 text-white'
                          }`}
                        >
                          {occupant.isMuted ? (
                            <MicOff className="w-3.5 h-3.5" />
                          ) : (
                            <Mic className="w-3.5 h-3.5" />
                          )}
                        </span>
                      </div>

                      <p className="text-sm font-semibold text-white truncate max-w-full">
                        {occupant.displayName}
                      </p>

                      <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                        <span>
                          {isSeatHost
                            ? 'عميد المجلس'
                            : VIP_TIER_LABELS[occupant.vipTier]}
                        </span>
                      </div>

                      {/* Quick Gift Action */}
                      {!isMe && (
                        <button
                          onClick={() => {
                            setSelectedRecipient({
                              uid: occupant.uid,
                              name: occupant.displayName,
                            });
                            setShowGiftDrawer(true);
                          }}
                          className="mt-3 px-2.5 py-1 text-[11px] font-medium text-[#D4AF37] bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 rounded-md transition-colors whitespace-nowrap"
                        >
                          إهداء
                        </button>
                      )}

                      {isMe && (
                        <span className="mt-3 text-[11px] text-emerald-400">
                          مقعدك الحالي
                        </span>
                      )}
                    </>
                  ) : (
                    <button
                      onClick={() => onTakeSeat(index)}
                      disabled={Boolean(mySeat)}
                      className="w-full h-full min-h-[132px] flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-[#D4AF37] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center bg-[#131B2E]">
                        <UserPlus className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-medium whitespace-nowrap">
                        {mySeat ? 'أنت على المايك' : 'اصعد للمايك'}
                      </span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Audio Controls Bar */}
        <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {mySeat ? (
              <>
                <button
                  onClick={onToggleMute}
                  className={`px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors whitespace-nowrap ${
                    mySeat.isMuted
                      ? 'bg-rose-600 hover:bg-rose-500 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  {mySeat.isMuted ? (
                    <>
                      <MicOff className="w-4 h-4" />
                      <span>المايك مكتوم (اضغط للتحدث)</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4" />
                      <span>المايك مفتوح</span>
                    </>
                  )}
                </button>

                <button
                  onClick={onLeaveSeat}
                  className="px-4 py-2.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-2 transition-colors whitespace-nowrap"
                >
                  <LogOut className="w-4 h-4" />
                  <span>ترك المايك</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  const firstFree = seatSlots.findIndex((s) => s === null);
                  if (firstFree !== -1) onTakeSeat(firstFree);
                }}
                disabled={seats.length >= 8}
                className="px-4 py-2.5 rounded-lg text-xs font-semibold bg-[#D4AF37] text-[#0B0F17] hover:bg-[#e3be42] disabled:opacity-40 flex items-center gap-2 transition-colors whitespace-nowrap"
              >
                <Mic className="w-4 h-4" />
                <span>انضم للمتحدثين الآن</span>
              </button>
            )}

            {/* Live Microphone Meter */}
            {mySeat && !mySeat.isMuted && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#0B0F17] border border-white/10">
                <Volume2 className="w-4 h-4 text-emerald-400" />
                <div className="w-20 h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 transition-all duration-100"
                    style={{ width: `${Math.min(100, audioLevel)}%` }}
                  />
                </div>
                <span className="text-[11px] text-slate-400 font-mono-num">
                  {micActive ? 'متصل' : 'محاكاة'}
                </span>
              </div>
            )}
          </div>

          <button
            onClick={() => setShowGiftDrawer(!showGiftDrawer)}
            className="px-4 py-2.5 rounded-lg text-xs font-semibold bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/40 hover:bg-[#D4AF37]/25 flex items-center gap-2 transition-colors whitespace-nowrap"
          >
            <Gift className="w-4 h-4" />
            <span>إرسال هدية للمجلس</span>
          </button>
        </div>

        {/* Expandable Gift Catalog Drawer */}
        {showGiftDrawer && (
          <div className="mt-6 pt-5 border-t border-white/10">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div>
                <h4 className="text-sm font-bold text-white">
                  خزينة الهدايا والضيافة العربية
                </h4>
                <p className="text-xs text-slate-400">
                  الإهداء موجه إلى:{' '}
                  <span className="text-[#D4AF37] font-semibold">
                    {selectedRecipient ? selectedRecipient.name : room.hostName}
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-300 font-mono-num">
                  رصيدك: {currentUser.coins.toLocaleString('en-US')} كوينز
                </span>
                <button
                  onClick={onOpenStore}
                  className="px-3 py-1.5 text-xs font-semibold bg-[#D4AF37] text-[#0B0F17] rounded-md hover:bg-[#e2be46] transition-colors whitespace-nowrap"
                >
                  شحن كوينز
                </button>
              </div>
            </div>

            {/* Recipient Selector */}
            {seats.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-3">
                <span className="text-xs text-slate-400 shrink-0">اختر المستلم:</span>
                {seats.map((seat) => (
                  <button
                    key={seat.uid}
                    onClick={() =>
                      setSelectedRecipient({
                        uid: seat.uid,
                        name: seat.displayName,
                      })
                    }
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                      (selectedRecipient?.uid || room.hostId) === seat.uid
                        ? 'bg-[#D4AF37] text-[#0B0F17]'
                        : 'bg-[#0B0F17] text-slate-300 hover:text-white'
                    }`}
                  >
                    {seat.displayName}
                  </button>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {GIFT_CATALOG.map((gift) => {
                const canAfford = currentUser.coins >= gift.coins;
                return (
                  <button
                    key={gift.id}
                    onClick={() => handleGiftTrigger(gift)}
                    disabled={!canAfford || sendingGiftId !== null}
                    className="p-3 rounded-lg bg-[#0B0F17] border border-white/10 hover:border-[#D4AF37]/60 disabled:opacity-45 text-right flex flex-col justify-between transition-all"
                  >
                    <div className="flex items-center justify-between w-full mb-2">
                      <span className="text-2xl">{gift.symbol}</span>
                      <span className="font-mono-num text-xs font-semibold text-[#D4AF37]">
                        {gift.coins.toLocaleString('en-US')} كوينز
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">{gift.name}</p>
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                        {gift.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Live Room Chat Column (5 cols on Desktop) */}
      <div className="lg:col-span-5 bg-[#131B2E] border border-white/10 rounded-xl p-6 flex flex-col h-[620px]">
        <div className="pb-4 border-b border-white/10 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">ديوان الدردشة المباشرة</h3>
            <p className="text-xs text-slate-400">
              رسائل المجلس وإشعارات الهدايا الفورية
            </p>
          </div>
          <span className="font-mono-num text-xs text-slate-400">
            {messages.length} رسالة
          </span>
        </div>

        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3 pl-1">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-4">
              <Sparkles className="w-8 h-8 text-[#D4AF37]/60 mb-2" />
              <p className="text-sm font-medium text-slate-300">
                المجلس بانتظار أولى كلماتك الترحيبية
              </p>
              <p className="text-xs text-slate-500 mt-1">
                شارك بالتحية أو أرسل دلة القهوة العربية للمتحدثين
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              if (msg.type === 'gift') {
                return (
                  <div
                    key={msg.id}
                    className="p-3.5 rounded-lg bg-gradient-to-l from-[#D4AF37]/20 via-[#D4AF37]/10 to-transparent border border-[#D4AF37]/40"
                  >
                    <div className="flex items-center justify-between text-xs text-[#D4AF37] mb-1">
                      <span className="font-bold">إهداء ملكي في المجلس</span>
                      <span className="font-mono-num font-semibold">
                        +{msg.giftCoins.toLocaleString('en-US')} كوينز
                      </span>
                    </div>
                    <p className="text-sm text-white">
                      أهدى <span className="font-bold">{msg.senderName}</span> هدية{' '}
                      <span className="text-[#D4AF37] font-bold">{msg.giftName}</span>{' '}
                      إلى <span className="font-bold">{msg.recipientName}</span>
                    </p>
                  </div>
                );
              }

              return (
                <div
                  key={msg.id}
                  className="p-3 rounded-lg bg-[#0B0F17]/75 border border-white/5"
                >
                  <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                    <span className="font-semibold text-white">
                      {msg.senderName}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="text-[#D4AF37]">
                      {VIP_TIER_LABELS[msg.senderVipTier] || 'عضو المجلس'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-200 leading-relaxed break-words">
                    {msg.text}
                  </p>
                </div>
              );
            })
          )}
        </div>

        {/* Message Input Form */}
        <form
          onSubmit={handleChatSubmit}
          className="pt-4 border-t border-white/10 flex items-center gap-2"
        >
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            maxLength={400}
            placeholder="اكتب رسالتك في المجلس..."
            className="flex-1 bg-[#0B0F17] border border-white/15 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#D4AF37]"
          />
          <button
            type="submit"
            disabled={!chatInput.trim() || sendingMessage}
            className="px-4 py-2.5 bg-[#D4AF37] text-[#0B0F17] font-semibold text-xs rounded-lg hover:bg-[#e3be42] disabled:opacity-40 transition-colors flex items-center gap-1.5 whitespace-nowrap"
          >
            <span>إرسال</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
