import React, { useState } from 'react';
import { Crown, Trophy, Edit3, Check } from 'lucide-react';
import { UserProfile, VIP_TIER_LABELS } from '../types';

interface LeaderboardAndProfileProps {
  topUsers: UserProfile[];
  currentUser: UserProfile;
  onUpdateProfile: (displayName: string, bio: string) => Promise<void>;
}

export const LeaderboardView: React.FC<{ topUsers: UserProfile[] }> = ({
  topUsers,
}) => {
  return (
    <div className="space-y-8">
      <div className="bg-[#131B2E] border border-white/10 rounded-xl p-6 sm:p-8">
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
          <span>مجلس الشرف</span>
          <span aria-hidden="true">·</span>
          <span>تحديث مباشر</span>
        </div>
        <h1 className="text-3xl font-bold font-display text-white">
          كبار داعمي ووجهاء توب شات
        </h1>
        <p className="text-sm text-slate-300 mt-2 max-w-2xl">
          قائمة الشرف لأكثر الأعضاء دعماً وإهداءً في الغرف الصوتية وأصحاب المراتب
          الملكية في الديوان.
        </p>
      </div>

      <div className="bg-[#131B2E] border border-white/10 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-[#0B0F17] text-xs text-slate-400 border-b border-white/10">
              <tr>
                <th className="py-3.5 px-5 font-medium">المرتبة</th>
                <th className="py-3.5 px-5 font-medium">العضو</th>
                <th className="py-3.5 px-5 font-medium">اللقب التشريفي</th>
                <th className="py-3.5 px-5 font-medium text-left">إجمالي الدعم</th>
                <th className="py-3.5 px-5 font-medium text-left">الرصيد الحالي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {topUsers.map((member, idx) => (
                <tr key={member.uid} className="hover:bg-white/[0.02]">
                  <td className="py-4 px-5 font-mono-num font-bold text-[#D4AF37]">
                    #{idx + 1}
                  </td>
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-800 overflow-hidden flex items-center justify-center border border-white/10 shrink-0">
                        {member.photoURL ? (
                          <img
                            src={member.photoURL}
                            alt={member.displayName}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xs font-bold text-[#D4AF37]">
                            {member.displayName.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-white">
                          {member.displayName}
                        </p>
                        <p className="text-xs text-slate-400 line-clamp-1">
                          {member.bio}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-5 text-xs text-slate-300">
                    {VIP_TIER_LABELS[member.vipTier]} · {member.activeBadge}
                  </td>
                  <td className="py-4 px-5 font-mono-num text-left text-emerald-400 font-semibold">
                    {member.totalCoinsSpent.toLocaleString('en-US')} كوينز
                  </td>
                  <td className="py-4 px-5 font-mono-num text-left text-[#D4AF37] font-semibold">
                    {member.coins.toLocaleString('en-US')} كوينز
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export const ProfileView: React.FC<{
  currentUser: UserProfile;
  onUpdateProfile: (displayName: string, bio: string) => Promise<void>;
}> = ({ currentUser, onUpdateProfile }) => {
  const [name, setName] = useState(currentUser.displayName);
  const [bio, setBio] = useState(currentUser.bio);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || saving) return;
    setSaving(true);
    try {
      await onUpdateProfile(name.trim().slice(0, 60), bio.trim().slice(0, 200));
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="bg-[#131B2E] border border-white/10 rounded-xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 pb-6 border-b border-white/10">
          <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[#D4AF37] bg-slate-800 flex items-center justify-center shrink-0">
            {currentUser.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt={currentUser.displayName}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-2xl font-bold text-[#D4AF37]">
                {currentUser.displayName.charAt(0)}
              </span>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
              <span>{VIP_TIER_LABELS[currentUser.vipTier]}</span>
              <span aria-hidden="true">·</span>
              <span>الوسام: {currentUser.activeBadge}</span>
            </div>
            <h1 className="text-2xl font-bold text-white">
              {currentUser.displayName}
            </h1>
            <p className="text-sm text-slate-300 mt-1">{currentUser.bio}</p>
          </div>
        </div>

        {/* Quantitative Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 py-6 border-b border-white/10">
          <div>
            <span className="text-xs text-slate-400 block">رصيد الكوينز المتاح</span>
            <span className="font-mono-num text-2xl font-bold text-[#D4AF37] mt-1 block">
              {currentUser.coins.toLocaleString('en-US')}
            </span>
          </div>
          <div>
            <span className="text-xs text-slate-400 block">إجمالي دعم المجالس</span>
            <span className="font-mono-num text-2xl font-bold text-white mt-1 block">
              {currentUser.totalCoinsSpent.toLocaleString('en-US')}
            </span>
          </div>
          <div>
            <span className="text-xs text-slate-400 block">قيمة الهدايا المستلمة</span>
            <span className="font-mono-num text-2xl font-bold text-emerald-400 mt-1 block">
              {currentUser.totalGiftsReceived.toLocaleString('en-US')}
            </span>
          </div>
        </div>

        {/* Profile Edit Form */}
        <form onSubmit={handleSave} className="pt-6 space-y-4">
          <h2 className="text-base font-bold text-white">تعديل بيانات البطاقة الشخصية</h2>

          <div>
            <label className="block text-xs text-slate-400 mb-1.5">
              الاسم الظاهر في المجالس
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
              required
              className="w-full bg-[#0B0F17] border border-white/15 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1.5">
              النبذة التعريفية أو بيت الشعر المفضل
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={200}
              rows={3}
              className="w-full bg-[#0B0F17] border border-white/15 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-lg text-xs font-bold bg-[#D4AF37] text-[#0B0F17] hover:bg-[#e3be42] disabled:opacity-50 transition-colors whitespace-nowrap"
            >
              {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
            </button>

            {savedMsg && (
              <span className="text-xs text-emerald-400 flex items-center gap-1">
                <Check className="w-4 h-4" />
                تم تحديث ملفك الشخصي بنجاح
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
