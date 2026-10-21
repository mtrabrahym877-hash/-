import React, { useState, useEffect } from 'react';
import {
  X,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Radio,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Sparkles,
  Info,
  RefreshCw,
} from 'lucide-react';
import {
  agoraVoiceService,
  AgoraVoiceStatus,
  DEFAULT_AGORA_APP_ID,
} from '../services/agoraVoiceService';

interface AgoraVoiceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomCode: string;
  roomTitle: string;
  myMicMuted: boolean;
  speakerMuted: boolean;
  onToggleMic: () => void;
  onToggleSpeaker: () => void;
}

export const AgoraVoiceSettingsModal: React.FC<AgoraVoiceSettingsModalProps> = ({
  isOpen,
  onClose,
  roomCode,
  roomTitle,
  myMicMuted,
  speakerMuted,
  onToggleMic,
  onToggleSpeaker,
}) => {
  const [appIdInput, setAppIdInput] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [status, setStatus] = useState<AgoraVoiceStatus>('disconnected');
  const [statusError, setStatusError] = useState<string | null>(null);
  const [testMicLevel, setTestMicLevel] = useState(0);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAppIdInput(agoraVoiceService.getAppId());
      setTokenInput(agoraVoiceService.getToken());
      const unsubStatus = agoraVoiceService.onStatusChange((newStatus, err) => {
        setStatus(newStatus);
        setStatusError(err || null);
      });
      const unsubVolume = agoraVoiceService.onVolumeChange((volumes) => {
        if (volumes.length > 0) {
          const maxVol = Math.max(...volumes.map((v) => v.level));
          setTestMicLevel(maxVol);
        }
      });
      return () => {
        unsubStatus();
        unsubVolume();
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveAppId = () => {
    agoraVoiceService.setAppId(appIdInput);
    agoraVoiceService.setToken(tokenInput);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleResetDefault = () => {
    setAppIdInput(DEFAULT_AGORA_APP_ID);
    setTokenInput('');
    agoraVoiceService.setAppId(DEFAULT_AGORA_APP_ID);
    agoraVoiceService.setToken('');
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-[#0F1A2F] border border-cyan-500/30 rounded-3xl p-5 text-right shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 transition"
          >
            <X size={18} />
          </button>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-extrabold text-white">
              إعدادات البث الصوتي المباشر (Agora SDK)
            </h3>
            <span className="p-1.5 rounded-full bg-[#00D1FF]/20 text-[#00D1FF]">
              <Radio size={16} />
            </span>
          </div>
        </div>

        {/* Status Error / Notice Banner if present */}
        {statusError && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3.5 text-xs text-amber-200 flex items-start gap-2.5">
            <AlertCircle size={18} className="text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-amber-300 block">تنبيه اتصال Agora:</span>
              <p className="text-[11px] leading-relaxed text-amber-200/90">{statusError}</p>
            </div>
          </div>
        )}

        {/* Current Channel & Status Card */}
        <div className="bg-[#14233D] border border-white/10 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400">قناة البث الصوتي</span>
            <span className="text-xs font-mono font-bold text-[#FFD700]">
              majlisna_{roomCode}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400">الغرفة</span>
            <span className="text-xs font-bold text-white truncate max-w-[200px]">
              {roomTitle}
            </span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <span className="text-[11px] text-slate-400">حالة الاتصال</span>
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  status === 'connected'
                    ? 'bg-emerald-400 animate-ping'
                    : status === 'simulated'
                    ? 'bg-amber-400'
                    : status === 'connecting'
                    ? 'bg-cyan-400 animate-pulse'
                    : 'bg-rose-400'
                }`}
              />
              <span
                className={`text-xs font-bold ${
                  status === 'connected'
                    ? 'text-emerald-400'
                    : status === 'simulated'
                    ? 'text-amber-400'
                    : status === 'connecting'
                    ? 'text-cyan-400'
                    : 'text-rose-400'
                }`}
              >
                {status === 'connected'
                  ? 'متصل بالبث الصوتي المباشر'
                  : status === 'simulated'
                  ? 'بث صوتي مباشر (محاكاة نشطة)'
                  : status === 'connecting'
                  ? 'جاري الاتصال بقناة Agora...'
                  : 'غير متصل'}
              </span>
            </div>
          </div>
        </div>

        {/* Microphone Audio Level Indicator */}
        <div className="bg-[#14233D] border border-white/10 rounded-2xl p-4 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">مستوى التقاط الصوت (Mic Level):</span>
            <span className="font-mono text-[#00D1FF] font-bold">
              {testMicLevel}%
            </span>
          </div>
          <div className="w-full h-3 bg-[#080F1A] rounded-full overflow-hidden p-0.5 border border-white/10">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-[#00D1FF] to-[#FFD700] rounded-full transition-all duration-150"
              style={{ width: `${Math.min(100, Math.max(5, testMicLevel))}%` }}
            />
          </div>
          <div className="flex items-center justify-between pt-1">
            <button
              onClick={onToggleMic}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                myMicMuted
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              }`}
            >
              {myMicMuted ? <MicOff size={13} /> : <Mic size={13} />}
              <span>{myMicMuted ? 'الميكروفون مكتوم' : 'الميكروفون مفعل'}</span>
            </button>

            <button
              onClick={onToggleSpeaker}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                speakerMuted
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
              }`}
            >
              {speakerMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
              <span>{speakerMuted ? 'السماعة مكتومة' : 'السماعة مفعلة'}</span>
            </button>
          </div>
        </div>

        {/* Agora App ID & Token Configuration */}
        <div className="bg-[#14233D] border border-white/10 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-[#FFD700]" />
              <span>مفتاح تطبيق Agora (App ID)</span>
            </h4>
            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              مجاني 10,000 دقيقة/شهر
            </span>
          </div>

          <div className="space-y-2">
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">
                Agora App ID (32 حرف سداسي عشري):
              </label>
              <input
                type="text"
                value={appIdInput}
                onChange={(e) => setAppIdInput(e.target.value.trim())}
                placeholder="ضع Agora App ID الخاص بك هنا..."
                className="w-full bg-[#080F1A] border border-white/15 focus:border-[#00D1FF] rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block mb-1">
                رمز Token المؤقت (اختياري - لمشاريع Secured Mode):
              </label>
              <input
                type="text"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value.trim())}
                placeholder="اتركه فارغاً إذا كان مشروعك Testing Mode بدون شهادة أمان"
                className="w-full bg-[#080F1A] border border-white/15 focus:border-[#00D1FF] rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              onClick={handleResetDefault}
              className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
            >
              <RefreshCw size={11} />
              <span>استعادة الافتراضي</span>
            </button>

            <button
              onClick={handleSaveAppId}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#00D1FF] to-[#6C63FF] text-white text-xs font-extrabold hover:brightness-110 transition flex items-center gap-1"
            >
              {savedSuccess ? (
                <>
                  <CheckCircle2 size={13} className="text-emerald-300" />
                  <span>تم الحفظ بنجاح!</span>
                </>
              ) : (
                <span>حفظ وتطبيق</span>
              )}
            </button>
          </div>

          {/* Guide Note */}
          <div className="bg-[#0A1322] border border-cyan-500/20 rounded-xl p-3 text-[11px] text-slate-300 space-y-1.5">
            <div className="flex items-center gap-1 text-[#00D1FF] font-bold">
              <Info size={12} />
              <span>طريقة تشغيل Agora مجاناً وتفادي خطأ static key:</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[10px]">
              1. أنشئ حساباً مجانياً على موقع{' '}
              <a
                href="https://console.agora.io"
                target="_blank"
                rel="noreferrer"
                className="text-[#FFD700] underline"
              >
                console.agora.io
              </a>
              .<br />
              2. أنشئ مشروعاً باختيار «Testing Mode: App ID Only» (بدون App Certificate). إذا كان مشروعك الحالي يظهر خطأ dynamic use static key، عطل خيار Primary Certificate في لوحة Agora أو انسخ Temp Token.<br />
              3. الصق App ID في الحقل أعلاه لتشغيل الصوت الجماعي الفوري حتى 10,000 دقيقة مجاناً شهرياً.
            </p>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-2xl bg-[#14233D] hover:bg-[#1A2E50] border border-white/10 text-xs font-bold text-white transition"
        >
          إغلاق ومتابعة الغرفة
        </button>
      </div>
    </div>
  );
};
