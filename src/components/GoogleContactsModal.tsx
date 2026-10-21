import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  UserPlus,
  Phone,
  Mail,
  Share2,
  Trash2,
  RefreshCw,
  Users,
  Check,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import {
  googleContactsService,
  GoogleContact,
} from '../services/googleContactsService';
import { getAccessToken } from '../firebase';

interface GoogleContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomCode?: string;
  roomTitle?: string;
  onShowToast: (msg: string) => void;
  onRequestGoogleSignIn?: () => void;
}

export const GoogleContactsModal: React.FC<GoogleContactsModalProps> = ({
  isOpen,
  onClose,
  roomCode,
  roomTitle,
  onShowToast,
  onRequestGoogleSignIn,
}) => {
  const [contacts, setContacts] = useState<GoogleContact[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasToken, setHasToken] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // New Contact Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newGivenName, setNewGivenName] = useState('');
  const [newFamilyName, setNewFamilyName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [addingContact, setAddingContact] = useState(false);

  // Confirmation Modal State (MANDATORY per Workspace guidelines)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmLabel: string;
    isDestructive?: boolean;
    onConfirm: () => Promise<void>;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      checkAuthAndLoad();
    }
  }, [isOpen]);

  const checkAuthAndLoad = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const token = await getAccessToken();
      if (!token) {
        setHasToken(false);
        setLoading(false);
        return;
      }
      setHasToken(true);
      const list = await googleContactsService.listContacts(100);
      setContacts(list);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (!hasToken) return;
    setLoading(true);
    try {
      const results = await googleContactsService.searchContacts(q);
      setContacts(results);
    } catch (err) {
      console.warn('Contacts search notice:', err);
    } finally {
      setLoading(false);
    }
  };

  // Invite Contact to Room
  const handleInvite = (contact: GoogleContact) => {
    const inviteText = `حياك الله معنا في تطبيق توب شات الصوتي! 🎙️\nانضم لغرفة: "${roomTitle || 'غرفة عامة'}"\nرمز الغرفة: ${roomCode || '88420'}\nرابط الحضور: ${window.location.origin}`;
    
    if (contact.phoneNumber) {
      const cleanPhone = contact.phoneNumber.replace(/[^0-9]/g, '');
      const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(inviteText)}`;
      window.open(waUrl, '_blank');
      onShowToast(`جاري إرسال الدعوة لـ ${contact.displayName} عبر WhatsApp`);
    } else {
      navigator.clipboard?.writeText(inviteText);
      onShowToast(`تم نسخ رسالة دعوة ${contact.displayName} إلى الحافظة!`);
    }
  };

  // Create Contact with explicit user confirmation
  const handleCreateContactSubmit = () => {
    if (!newGivenName.trim()) {
      onShowToast('يرجى إدخال الاسم الأول على الأقل');
      return;
    }

    const fullName = `${newGivenName} ${newFamilyName}`.trim();
    setConfirmDialog({
      isOpen: true,
      title: 'تأكيد إضافة جهة اتصال إلى Google',
      description: `هل توافق على حفظ "${fullName}" في حساب Google Contacts الخاص بك؟`,
      confirmLabel: 'نعم، حفظ في Google Contacts',
      onConfirm: async () => {
        setAddingContact(true);
        try {
          const created = await googleContactsService.createContact({
            givenName: newGivenName.trim(),
            familyName: newFamilyName.trim(),
            phoneNumber: newPhone.trim(),
            email: newEmail.trim(),
          });
          setContacts((prev) => [created, ...prev]);
          setShowAddForm(false);
          setNewGivenName('');
          setNewFamilyName('');
          setNewPhone('');
          setNewEmail('');
          onShowToast(`تمت إضافة "${created.displayName}" بنجاح إلى حسابك في Google!`);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          onShowToast(msg);
        } finally {
          setAddingContact(false);
          setConfirmDialog(null);
        }
      },
    });
  };

  // Delete Contact with explicit confirmation
  const handleDeleteContact = (contact: GoogleContact) => {
    setConfirmDialog({
      isOpen: true,
      title: 'تأكيد حذف جهة الاتصال',
      description: `هل أنت متأكد من حذف "${contact.displayName}" نهائياً من حساب Google Contacts؟ لا يمكن التراجع عن هذا الإجراء.`,
      confirmLabel: 'حذف نهائياً',
      isDestructive: true,
      onConfirm: async () => {
        try {
          await googleContactsService.deleteContact(contact.resourceName);
          setContacts((prev) => prev.filter((c) => c.resourceName !== contact.resourceName));
          onShowToast(`تم حذف "${contact.displayName}" من جهات الاتصال`);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          onShowToast(msg);
        } finally {
          setConfirmDialog(null);
        }
      },
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg bg-[#0F1A2F] border border-cyan-500/30 rounded-3xl p-5 text-right shadow-2xl relative max-h-[90vh] flex flex-col space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 transition"
          >
            <X size={18} />
          </button>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-extrabold text-white">
              جهات الاتصال (Google Contacts)
            </h3>
            <span className="p-2 rounded-xl bg-gradient-to-tr from-[#00D1FF]/20 to-[#6C63FF]/30 text-[#00D1FF] border border-[#00D1FF]/30">
              <Users size={18} />
            </span>
          </div>
        </div>

        {/* Not Logged in state */}
        {!hasToken && (
          <div className="bg-[#14233D] border border-white/10 rounded-2xl p-5 text-center space-y-4 my-auto">
            <div className="w-14 h-14 rounded-2xl bg-[#00D1FF]/10 text-[#00D1FF] flex items-center justify-center mx-auto border border-[#00D1FF]/30">
              <Users size={28} />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white">ربط جهات اتصال Google</h4>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                قم بتسجيل الدخول بحساب Google لعرض جهات اتصالك، دعوتهم للمجالس الصوتية بنقرة واحدة، وإضافة الأصدقاء الجدد.
              </p>
            </div>
            <button
              onClick={() => {
                if (onRequestGoogleSignIn) {
                  onRequestGoogleSignIn();
                }
              }}
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-[#00D1FF] to-[#6C63FF] text-white text-xs font-bold shadow-lg shadow-cyan-500/20 hover:brightness-110 transition inline-flex items-center gap-2"
            >
              <ExternalLink size={14} />
              <span>تسجيل الدخول ومزامنة جهات الاتصال</span>
            </button>
          </div>
        )}

        {/* Logged in Content */}
        {hasToken && (
          <>
            {/* Search and Action Bar */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="ابحث بالاسم، الهاتف، أو البريد..."
                  className="w-full bg-[#14233D] border border-white/10 focus:border-[#00D1FF] rounded-2xl pr-9 pl-3 py-2 text-xs text-white focus:outline-none placeholder:text-slate-500"
                />
                <Search size={15} className="absolute right-3 top-2.5 text-slate-400" />
              </div>

              <button
                onClick={() => setShowAddForm((v) => !v)}
                className="px-3 py-2 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold hover:bg-emerald-500/30 transition flex items-center gap-1.5 shrink-0"
              >
                <UserPlus size={14} />
                <span>{showAddForm ? 'إلغاء' : 'إضافة'}</span>
              </button>

              <button
                onClick={checkAuthAndLoad}
                disabled={loading}
                className="p-2 rounded-2xl bg-[#14233D] border border-white/10 text-slate-300 hover:text-white transition shrink-0"
                title="تحديث"
              >
                <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>

            {/* Error Message if any */}
            {errorMsg && (
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-3 text-xs text-rose-300 flex items-center gap-2 shrink-0">
                <AlertCircle size={15} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Add Contact Form Drawer */}
            {showAddForm && (
              <div className="bg-[#14233D] border border-emerald-500/30 rounded-2xl p-4 space-y-3 shrink-0 animate-in slide-in-from-top-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <UserPlus size={14} className="text-emerald-400" />
                    <span>إضافة جهة اتصال جديدة إلى Google</span>
                  </h4>
                  <span className="text-[10px] text-slate-400">ستُحفظ في حسابك</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={newGivenName}
                    onChange={(e) => setNewGivenName(e.target.value)}
                    placeholder="الاسم الأول *"
                    className="bg-[#0A1322] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-400"
                  />
                  <input
                    type="text"
                    value={newFamilyName}
                    onChange={(e) => setNewFamilyName(e.target.value)}
                    placeholder="اسم العائلة"
                    className="bg-[#0A1322] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="tel"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="رقم الهاتف (مثل +966...)"
                    className="bg-[#0A1322] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-400"
                  />
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="البريد الإلكتروني"
                    className="bg-[#0A1322] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <button
                  onClick={handleCreateContactSubmit}
                  disabled={addingContact}
                  className="w-full py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold hover:brightness-110 transition flex items-center justify-center gap-1.5"
                >
                  <Check size={14} />
                  <span>{addingContact ? 'جاري الحفظ...' : 'حفظ في جهات اتصال Google'}</span>
                </button>
              </div>
            )}

            {/* Contacts List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {loading && contacts.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400 space-y-2">
                  <RefreshCw size={24} className="animate-spin text-[#00D1FF] mx-auto" />
                  <p>جاري مزامنة جهات الاتصال من Google...</p>
                </div>
              ) : contacts.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400 space-y-1">
                  <Users size={32} className="text-slate-600 mx-auto" />
                  <p className="text-slate-300 font-bold">لا توجد جهات اتصال تطابق بحثك</p>
                  <p className="text-[11px] text-slate-500">
                    يمكنك إضافة جهة اتصال جديدة باستخدام الزر أعلاه.
                  </p>
                </div>
              ) : (
                contacts.map((contact) => (
                  <div
                    key={contact.resourceName}
                    className="bg-[#14233D]/80 hover:bg-[#14233D] border border-white/5 hover:border-white/15 rounded-2xl p-3 flex items-center justify-between transition gap-2"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {contact.photoUrl ? (
                        <img
                          src={contact.photoUrl}
                          alt={contact.displayName}
                          className="w-10 h-10 rounded-full object-cover border border-[#00D1FF]/30 shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#00D1FF]/20 to-[#6C63FF]/30 border border-[#00D1FF]/30 text-[#00D1FF] font-extrabold flex items-center justify-center text-sm shrink-0">
                          {contact.displayName.charAt(0) || 'ص'}
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white truncate">
                            {contact.displayName}
                          </span>
                          {contact.organization && (
                            <span className="text-[10px] text-slate-400 truncate hidden sm:inline">
                              • {contact.organization}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-[10px] text-slate-400 truncate mt-0.5 font-mono">
                          {contact.phoneNumber && (
                            <span className="flex items-center gap-1">
                              <Phone size={10} className="text-emerald-400" />
                              <span dir="ltr">{contact.phoneNumber}</span>
                            </span>
                          )}
                          {contact.email && (
                            <span className="flex items-center gap-1 truncate">
                              <Mail size={10} className="text-cyan-400" />
                              <span className="truncate">{contact.email}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleInvite(contact)}
                        className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-[#00D1FF]/20 to-[#6C63FF]/20 border border-[#00D1FF]/40 text-[#00D1FF] hover:bg-[#00D1FF]/30 text-[11px] font-bold transition flex items-center gap-1"
                        title="دعوة للمجلس الصوتي"
                      >
                        <Share2 size={12} />
                        <span>دعوة</span>
                      </button>

                      <button
                        onClick={() => handleDeleteContact(contact)}
                        className="p-1.5 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                        title="حذف من جهات الاتصال"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* Footer */}
        <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
          <span>إجمالي جهات الاتصال: {contacts.length}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition"
          >
            إغلاق
          </button>
        </div>
      </div>

      {/* Confirmation Dialog Modal (Required by Workspace Constitution) */}
      {confirmDialog && confirmDialog.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-sm bg-[#0B1424] border border-cyan-500/40 rounded-3xl p-5 text-right shadow-2xl space-y-4">
            <div className="flex items-center gap-2">
              <span
                className={`p-2 rounded-xl ${
                  confirmDialog.isDestructive
                    ? 'bg-rose-500/20 text-rose-400'
                    : 'bg-[#00D1FF]/20 text-[#00D1FF]'
                }`}
              >
                <AlertCircle size={20} />
              </span>
              <h4 className="text-sm font-extrabold text-white">
                {confirmDialog.title}
              </h4>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {confirmDialog.description}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 text-xs font-bold transition"
              >
                إلغاء
              </button>

              <button
                onClick={() => confirmDialog.onConfirm()}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                  confirmDialog.isDestructive
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30'
                    : 'bg-gradient-to-r from-[#00D1FF] to-[#6C63FF] hover:brightness-110 text-white shadow-lg shadow-cyan-500/30'
                }`}
              >
                {confirmDialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
