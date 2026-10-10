import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  MessageSquare,
  Plus,
  Trash2,
  RefreshCw,
  Send,
  ChevronLeft,
  Check,
  AlertTriangle,
  ExternalLink,
  LogOut,
  Users,
  Calendar,
  Sparkles,
  Folder,
  Mail,
  StickyNote,
  FileText,
  Search,
} from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import {
  initWorkspaceAuth,
  googleWorkspaceSignIn,
  getAccessToken,
  workspaceLogout,
} from '../firebase';
import firebaseConfig from '../../firebase-applet-config.json';

export type WorkspaceSubTabId = 'tasks' | 'chat' | 'drive' | 'gmail' | 'keep';

interface GoogleTaskList {
  id: string;
  title: string;
}

interface GoogleTaskItem {
  id: string;
  title: string;
  notes?: string;
  status: 'needsAction' | 'completed';
  due?: string;
}

interface GoogleChatSpace {
  name: string;
  displayName?: string;
  spaceType?: string;
  type?: string;
}

interface GoogleChatMessage {
  name: string;
  text?: string;
  createTime?: string;
  sender?: {
    name?: string;
    displayName?: string;
    type?: string;
  };
}

interface GoogleDriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  modifiedTime?: string;
  size?: string;
}

interface GmailMessageSummary {
  id: string;
  threadId: string;
  snippet: string;
  subject: string;
  from: string;
  date: string;
}

interface GoogleKeepNoteItem {
  name: string;
  title?: string;
  createTime?: string;
  updateTime?: string;
  body?: {
    text?: {
      text?: string;
    };
  };
}

interface ConfirmActionState {
  title: string;
  description: string;
  confirmLabel: string;
  isDanger?: boolean;
  onConfirm: () => Promise<void>;
}

interface GoogleWorkspaceHubProps {
  onBack: () => void;
  showToast: (msg: string) => void;
  initialSubTab?: WorkspaceSubTabId;
}

function encodeBase64UrlUtf8(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export default function GoogleWorkspaceHub({
  onBack,
  showToast,
  initialSubTab = 'tasks',
}: GoogleWorkspaceHubProps) {
  const [activeTab, setActiveTab] = useState<WorkspaceSubTabId>(initialSubTab);
  const [needsAuth, setNeedsAuth] = useState<boolean>(true);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // Confirmation modal state (Mandatory for all mutating/destructive operations)
  const [pendingConfirmation, setPendingConfirmation] =
    useState<ConfirmActionState | null>(null);
  const [isExecutingConfirm, setIsExecutingConfirm] = useState<boolean>(false);

  // 1) Google Tasks State
  const [taskLists, setTaskLists] = useState<GoogleTaskList[]>([]);
  const [selectedTaskListId, setSelectedTaskListId] = useState<string>('');
  const [tasks, setTasks] = useState<GoogleTaskItem[]>([]);
  const [tasksLoading, setTasksLoading] = useState<boolean>(false);
  const [tasksError, setTasksError] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState<string>('');
  const [newTaskNotes, setNewTaskNotes] = useState<string>('');
  const [newListName, setNewListName] = useState<string>('');
  const [showNewListForm, setShowNewListForm] = useState<boolean>(false);

  // 2) Google Chat State
  const [spaces, setSpaces] = useState<GoogleChatSpace[]>([]);
  const [selectedSpaceName, setSelectedSpaceName] = useState<string>('');
  const [messages, setMessages] = useState<GoogleChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState<boolean>(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [chatNotConfigured404, setChatNotConfigured404] =
    useState<boolean>(false);
  const [newChatMessage, setNewChatMessage] = useState<string>('');
  const [newSpaceDisplayName, setNewSpaceDisplayName] = useState<string>('');
  const [showCreateSpaceForm, setShowCreateSpaceForm] =
    useState<boolean>(false);

  // 3) Google Drive State
  const [driveFiles, setDriveFiles] = useState<GoogleDriveFileItem[]>([]);
  const [driveLoading, setDriveLoading] = useState<boolean>(false);
  const [driveError, setDriveError] = useState<string | null>(null);
  const [driveSearchQuery, setDriveSearchQuery] = useState<string>('');
  const [newDriveFileName, setNewDriveFileName] = useState<string>('');
  const [newDriveFileContent, setNewDriveFileContent] = useState<string>('');
  const [showCreateDriveForm, setShowCreateDriveForm] =
    useState<boolean>(false);

  // 4) Gmail State
  const [gmailMessages, setGmailMessages] = useState<GmailMessageSummary[]>([]);
  const [gmailLoading, setGmailLoading] = useState<boolean>(false);
  const [gmailError, setGmailError] = useState<string | null>(null);
  const [showComposeEmail, setShowComposeEmail] = useState<boolean>(false);
  const [emailTo, setEmailTo] = useState<string>('');
  const [emailSubject, setEmailSubject] = useState<string>('');
  const [emailBody, setEmailBody] = useState<string>('');

  // 5) Google Keep State
  const [keepNotes, setKeepNotes] = useState<GoogleKeepNoteItem[]>([]);
  const [keepLoading, setKeepLoading] = useState<boolean>(false);
  const [keepError, setKeepError] = useState<string | null>(null);
  const [newKeepTitle, setNewKeepTitle] = useState<string>('');
  const [newKeepText, setNewKeepText] = useState<string>('');
  const [showCreateKeepForm, setShowCreateKeepForm] = useState<boolean>(false);

  const projectId = firebaseConfig.projectId || 'gen-lang-client-0705277192';
  const chatConsoleConfigUrl = `https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat?project=${projectId}`;

  useEffect(() => {
    setActiveTab(initialSubTab);
  }, [initialSubTab]);

  useEffect(() => {
    const unsubscribe = initWorkspaceAuth(
      (authedUser, accessToken) => {
        setUser(authedUser);
        setToken(accessToken);
        setNeedsAuth(false);
      },
      () => {
        setNeedsAuth(true);
        setToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!needsAuth && token) {
      if (activeTab === 'tasks') fetchTaskLists(token);
      else if (activeTab === 'chat') fetchChatSpaces(token);
      else if (activeTab === 'drive') fetchDriveFiles(token);
      else if (activeTab === 'gmail') fetchGmailMessages(token);
      else if (activeTab === 'keep') fetchKeepNotes(token);
    }
  }, [needsAuth, token, activeTab]);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setTasksError(null);
    setChatError(null);
    setDriveError(null);
    setGmailError(null);
    setKeepError(null);
    try {
      const result = await googleWorkspaceSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
        setNeedsAuth(false);
        showToast(
          `مرحباً بك ${result.user.displayName || ''} في خدمات Google Workspace!`
        );
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'تعذر تسجيل الدخول عبر Google';
      setTasksError(msg);
      showToast('تعذر إكمال تسجيل الدخول بحساب Google');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await workspaceLogout();
    setUser(null);
    setToken(null);
    setNeedsAuth(true);
    setTaskLists([]);
    setTasks([]);
    setSpaces([]);
    setMessages([]);
    setDriveFiles([]);
    setGmailMessages([]);
    setKeepNotes([]);
    showToast('تم تسجيل الخروج من حساب Google Workspace');
  };

  const handleRefreshActiveTab = () => {
    if (activeTab === 'tasks') fetchTaskLists();
    else if (activeTab === 'chat') fetchChatSpaces();
    else if (activeTab === 'drive') fetchDriveFiles();
    else if (activeTab === 'gmail') fetchGmailMessages();
    else if (activeTab === 'keep') fetchKeepNotes();
  };

  // ============================================================================
  // 1. GOOGLE TASKS API CALLS
  // ============================================================================
  const fetchTaskLists = async (overrideToken?: string) => {
    const activeToken = overrideToken || (await getAccessToken());
    if (!activeToken) {
      setNeedsAuth(true);
      return;
    }
    setTasksLoading(true);
    setTasksError(null);
    try {
      const res = await fetch(
        'https://tasks.googleapis.com/tasks/v1/users/@me/lists',
        {
          headers: { Authorization: `Bearer ${activeToken}` },
        }
      );
      if (res.status === 401) {
        setNeedsAuth(true);
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data?.error?.message || 'فشل تحميل قوائم مهام Google Tasks'
        );
      }
      const lists: GoogleTaskList[] = data.items || [];
      setTaskLists(lists);
      if (lists.length > 0) {
        const targetId =
          selectedTaskListId && lists.some((l) => l.id === selectedTaskListId)
            ? selectedTaskListId
            : lists[0].id;
        setSelectedTaskListId(targetId);
        await fetchTasksForList(targetId, activeToken);
      } else {
        setTasks([]);
      }
    } catch (err: unknown) {
      setTasksError(
        err instanceof Error ? err.message : 'حدث خطأ أثناء جلب قوائم المهام'
      );
    } finally {
      setTasksLoading(false);
    }
  };

  const fetchTasksForList = async (listId: string, overrideToken?: string) => {
    const activeToken = overrideToken || (await getAccessToken());
    if (!activeToken || !listId) return;
    setTasksLoading(true);
    setTasksError(null);
    try {
      const res = await fetch(
        `https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(
          listId
        )}/tasks?showCompleted=true&showHidden=true`,
        {
          headers: { Authorization: `Bearer ${activeToken}` },
        }
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || 'تعذر جلب المهام من القائمة');
      }
      setTasks(data.items || []);
    } catch (err: unknown) {
      setTasksError(
        err instanceof Error ? err.message : 'خطأ في تحميل المهام'
      );
    } finally {
      setTasksLoading(false);
    }
  };

  const handleCreateTaskList = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = newListName.trim();
    if (!title) return;
    const activeToken = await getAccessToken();
    if (!activeToken) {
      setNeedsAuth(true);
      return;
    }
    setTasksLoading(true);
    try {
      const res = await fetch(
        'https://tasks.googleapis.com/tasks/v1/users/@me/lists',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${activeToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ title }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || 'تعذر إنشاء قائمة المهام');
      }
      setNewListName('');
      setShowNewListForm(false);
      showToast(`تم إنشاء قائمة "${title}" في Google Tasks!`);
      await fetchTaskLists(activeToken);
    } catch (err: unknown) {
      setTasksError(
        err instanceof Error ? err.message : 'فشل إنشاء قائمة المهام'
      );
    } finally {
      setTasksLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = newTaskTitle.trim();
    if (!title || !selectedTaskListId) return;
    const activeToken = await getAccessToken();
    if (!activeToken) {
      setNeedsAuth(true);
      return;
    }
    setTasksLoading(true);
    setTasksError(null);
    try {
      const res = await fetch(
        `https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(
          selectedTaskListId
        )}/tasks`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${activeToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title,
            notes: newTaskNotes.trim() || undefined,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || 'تعذر إضافة المهمة');
      }
      setNewTaskTitle('');
      setNewTaskNotes('');
      showToast('تمت إضافة المهمة إلى Google Tasks بنجاح!');
      await fetchTasksForList(selectedTaskListId, activeToken);
    } catch (err: unknown) {
      setTasksError(
        err instanceof Error ? err.message : 'فشل إنشاء المهمة الجديدة'
      );
    } finally {
      setTasksLoading(false);
    }
  };

  const promptToggleTaskStatus = (task: GoogleTaskItem) => {
    const nextStatus =
      task.status === 'completed' ? 'needsAction' : 'completed';
    const actionText =
      nextStatus === 'completed'
        ? `تحديد المهمة "${task.title}" كمكتملة في Google Tasks؟`
        : `إعادة فتح المهمة "${task.title}" كغير مكتملة في Google Tasks؟`;

    setPendingConfirmation({
      title: 'تأكيد تحديث حالة المهمة',
      description: actionText,
      confirmLabel: 'تأكيد التحديث',
      isDanger: false,
      onConfirm: async () => {
        const activeToken = await getAccessToken();
        if (!activeToken) {
          setNeedsAuth(true);
          return;
        }
        const res = await fetch(
          `https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(
            selectedTaskListId
          )}/tasks/${encodeURIComponent(task.id)}`,
          {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${activeToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: nextStatus }),
          }
        );
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData?.error?.message || 'فشل تحديث المهمة');
        }
        showToast('تم تحديث حالة المهمة في Google Tasks');
        await fetchTasksForList(selectedTaskListId, activeToken);
      },
    });
  };

  const promptDeleteTask = (task: GoogleTaskItem) => {
    setPendingConfirmation({
      title: 'تأكيد حذف المهمة نهائياً',
      description: `هل أنت متأكد من حذف المهمة "${task.title}" من حسابك في Google Tasks؟ لا يمكن التراجع عن هذا الإجراء.`,
      confirmLabel: 'نعم، احذف المهمة',
      isDanger: true,
      onConfirm: async () => {
        const activeToken = await getAccessToken();
        if (!activeToken) {
          setNeedsAuth(true);
          return;
        }
        const res = await fetch(
          `https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(
            selectedTaskListId
          )}/tasks/${encodeURIComponent(task.id)}`,
          {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${activeToken}` },
          }
        );
        if (!res.ok && res.status !== 204) {
          throw new Error('فشل حذف المهمة من Google Tasks');
        }
        showToast('تم حذف المهمة من Google Tasks');
        await fetchTasksForList(selectedTaskListId, activeToken);
      },
    });
  };

  // ============================================================================
  // 2. GOOGLE CHAT API CALLS
  // ============================================================================
  const fetchChatSpaces = async (overrideToken?: string) => {
    const activeToken = overrideToken || (await getAccessToken());
    if (!activeToken) {
      setNeedsAuth(true);
      return;
    }
    setChatLoading(true);
    setChatError(null);
    setChatNotConfigured404(false);
    try {
      const res = await fetch('https://chat.googleapis.com/v1/spaces', {
        headers: { Authorization: `Bearer ${activeToken}` },
      });
      if (res.status === 401) {
        setNeedsAuth(true);
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        const rawMsg: string =
          data?.error?.message ||
          'تعذر الاتصال بـ Google Chat API. تأكد من استخدام حساب Google Workspace.';
        if (
          res.status === 404 ||
          rawMsg.toLowerCase().includes('google chat app not found') ||
          rawMsg.toLowerCase().includes('configure the app')
        ) {
          setChatNotConfigured404(true);
        }
        throw new Error(rawMsg);
      }
      const fetchedSpaces: GoogleChatSpace[] = data.spaces || [];
      setSpaces(fetchedSpaces);
      if (fetchedSpaces.length > 0) {
        const targetSpace =
          selectedSpaceName &&
          fetchedSpaces.some((s) => s.name === selectedSpaceName)
            ? selectedSpaceName
            : fetchedSpaces[0].name;
        setSelectedSpaceName(targetSpace);
        await fetchSpaceMessages(targetSpace, activeToken);
      } else {
        setMessages([]);
      }
    } catch (err: unknown) {
      setChatError(
        err instanceof Error
          ? err.message
          : 'حدث خطأ أثناء جلب مساحات Google Chat'
      );
    } finally {
      setChatLoading(false);
    }
  };

  const fetchSpaceMessages = async (
    spaceName: string,
    overrideToken?: string
  ) => {
    const activeToken = overrideToken || (await getAccessToken());
    if (!activeToken || !spaceName) return;
    setChatLoading(true);
    setChatError(null);
    try {
      const res = await fetch(
        `https://chat.googleapis.com/v1/${spaceName}/messages?pageSize=25`,
        {
          headers: { Authorization: `Bearer ${activeToken}` },
        }
      );
      const data = await res.json();
      if (!res.ok) {
        const rawMsg: string =
          data?.error?.message || 'تعذر جلب الرسائل من المساحة';
        if (
          res.status === 404 ||
          rawMsg.toLowerCase().includes('google chat app not found')
        ) {
          setChatNotConfigured404(true);
        }
        throw new Error(rawMsg);
      }
      setMessages(data.messages || []);
    } catch (err: unknown) {
      setChatError(
        err instanceof Error ? err.message : 'تعذر تحميل رسائل Google Chat'
      );
    } finally {
      setChatLoading(false);
    }
  };

  const handleCreateSpace = async (e: React.FormEvent) => {
    e.preventDefault();
    const displayName = newSpaceDisplayName.trim();
    if (!displayName) return;
    const activeToken = await getAccessToken();
    if (!activeToken) {
      setNeedsAuth(true);
      return;
    }
    setChatLoading(true);
    setChatError(null);
    try {
      const res = await fetch('https://chat.googleapis.com/v1/spaces', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${activeToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          spaceType: 'SPACE',
          displayName,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data?.error?.message || 'تعذر إنشاء مساحة جديدة في Google Chat'
        );
      }
      setNewSpaceDisplayName('');
      setShowCreateSpaceForm(false);
      showToast(`تم إنشاء مساحة "${displayName}" في Google Chat!`);
      await fetchChatSpaces(activeToken);
    } catch (err: unknown) {
      setChatError(
        err instanceof Error ? err.message : 'فشل إنشاء مساحة Google Chat'
      );
    } finally {
      setChatLoading(false);
    }
  };

  const promptSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const text = newChatMessage.trim();
    if (!text || !selectedSpaceName) return;
    const currentSpace = spaces.find((s) => s.name === selectedSpaceName);
    const spaceLabel = currentSpace?.displayName || selectedSpaceName;

    setPendingConfirmation({
      title: 'تأكيد إرسال رسالة في Google Chat',
      description: `هل ترغب في إرسال الرسالة التالية باسمك إلى مساحة "${spaceLabel}" في Google Chat؟\n\n"${text}"`,
      confirmLabel: 'إرسال الرسالة الآن',
      isDanger: false,
      onConfirm: async () => {
        const activeToken = await getAccessToken();
        if (!activeToken) {
          setNeedsAuth(true);
          return;
        }
        const res = await fetch(
          `https://chat.googleapis.com/v1/${selectedSpaceName}/messages`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${activeToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text }),
          }
        );
        const data = await res.json();
        if (!res.ok) {
          throw new Error(
            data?.error?.message || 'تعذر إرسال الرسالة عبر Google Chat'
          );
        }
        setNewChatMessage('');
        showToast('تم إرسال رسالتك إلى Google Chat بنجاح!');
        await fetchSpaceMessages(selectedSpaceName, activeToken);
      },
    });
  };

  // ============================================================================
  // 3. GOOGLE DRIVE API CALLS
  // ============================================================================
  const fetchDriveFiles = async (overrideToken?: string) => {
    const activeToken = overrideToken || (await getAccessToken());
    if (!activeToken) {
      setNeedsAuth(true);
      return;
    }
    setDriveLoading(true);
    setDriveError(null);
    try {
      const qParam = driveSearchQuery.trim()
        ? `&q=${encodeURIComponent(
            `name contains '${driveSearchQuery
              .trim()
              .replace(/'/g, "\\'")}' and trashed = false`
          )}`
        : `&q=${encodeURIComponent('trashed = false')}`;
      const res = await fetch(
        `https://www.googleapis.com/drive/v3/files?pageSize=25&fields=files(id,name,mimeType,webViewLink,modifiedTime,size)&orderBy=modifiedTime desc${qParam}`,
        {
          headers: { Authorization: `Bearer ${activeToken}` },
        }
      );
      if (res.status === 401) {
        setNeedsAuth(true);
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data?.error?.message || 'فشل تحميل ملفات Google Drive'
        );
      }
      setDriveFiles(data.files || []);
    } catch (err: unknown) {
      setDriveError(
        err instanceof Error
          ? err.message
          : 'حدث خطأ أثناء جلب ملفات Google Drive'
      );
    } finally {
      setDriveLoading(false);
    }
  };

  const handleCreateDriveNoteFile = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newDriveFileName.trim();
    if (!name) return;
    const activeToken = await getAccessToken();
    if (!activeToken) {
      setNeedsAuth(true);
      return;
    }
    setDriveLoading(true);
    setDriveError(null);
    try {
      const metadata = {
        name: name.endsWith('.txt') ? name : `${name}.txt`,
        mimeType: 'text/plain',
      };
      const boundary = '-------majlisna_drive_boundary';
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelimiter = `\r\n--${boundary}--`;
      const multipartBody =
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: text/plain; charset=UTF-8\r\n\r\n' +
        (newDriveFileContent || 'مستند نصي من تطبيق مجلسنا') +
        closeDelimiter;

      const res = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${activeToken}`,
            'Content-Type': `multipart/related; boundary=${boundary}`,
          },
          body: multipartBody,
        }
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data?.error?.message || 'تعذر إنشاء الملف في Google Drive'
        );
      }
      setNewDriveFileName('');
      setNewDriveFileContent('');
      setShowCreateDriveForm(false);
      showToast(`تم حفظ الملف "${data.name}" في Google Drive!`);
      await fetchDriveFiles(activeToken);
    } catch (err: unknown) {
      setDriveError(
        err instanceof Error ? err.message : 'فشل إنشاء الملف في Google Drive'
      );
    } finally {
      setDriveLoading(false);
    }
  };

  // Deleting a file from Google Drive -> Requires explicit user confirmation dialog
  const promptDeleteDriveFile = (file: GoogleDriveFileItem) => {
    setPendingConfirmation({
      title: 'تأكيد حذف ملف من Google Drive',
      description: `هل أنت متأكد من حذف الملف "${file.name}" نهائياً من حسابك في Google Drive؟ لا يمكن التراجع عن هذا الإجراء.`,
      confirmLabel: 'نعم، احذف الملف',
      isDanger: true,
      onConfirm: async () => {
        const activeToken = await getAccessToken();
        if (!activeToken) {
          setNeedsAuth(true);
          return;
        }
        const res = await fetch(
          `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(
            file.id
          )}`,
          {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${activeToken}` },
          }
        );
        if (!res.ok && res.status !== 204) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(
            errData?.error?.message || 'فشل حذف الملف من Google Drive'
          );
        }
        showToast(`تم حذف الملف "${file.name}" من Google Drive`);
        await fetchDriveFiles(activeToken);
      },
    });
  };

  // ============================================================================
  // 4. GMAIL API CALLS
  // ============================================================================
  const fetchGmailMessages = async (overrideToken?: string) => {
    const activeToken = overrideToken || (await getAccessToken());
    if (!activeToken) {
      setNeedsAuth(true);
      return;
    }
    setGmailLoading(true);
    setGmailError(null);
    try {
      const listRes = await fetch(
        'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=12',
        {
          headers: { Authorization: `Bearer ${activeToken}` },
        }
      );
      if (listRes.status === 401) {
        setNeedsAuth(true);
        return;
      }
      const listData = await listRes.json();
      if (!listRes.ok) {
        throw new Error(
          listData?.error?.message || 'تعذر جلب رسائل البريد من Gmail'
        );
      }

      const rawList: { id: string; threadId: string }[] =
        listData.messages || [];
      if (rawList.length === 0) {
        setGmailMessages([]);
        return;
      }

      const detailed = await Promise.all(
        rawList.slice(0, 10).map(async (item) => {
          const msgRes = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${item.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
            {
              headers: { Authorization: `Bearer ${activeToken}` },
            }
          );
          const msgData = await msgRes.json();
          const headers: { name: string; value: string }[] =
            msgData?.payload?.headers || [];
          const getHeader = (name: string) =>
            headers.find((h) => h.name.toLowerCase() === name.toLowerCase())
              ?.value || '';

          return {
            id: item.id,
            threadId: item.threadId,
            snippet: msgData.snippet || '',
            subject: getHeader('Subject') || '(بدون عنوان)',
            from: getHeader('From') || 'مرسل غير معروف',
            date: getHeader('Date') || '',
          };
        })
      );

      setGmailMessages(detailed);
    } catch (err: unknown) {
      setGmailError(
        err instanceof Error
          ? err.message
          : 'حدث خطأ أثناء تحميل رسائل البريد الإلكتروني Gmail'
      );
    } finally {
      setGmailLoading(false);
    }
  };

  // Sending an Email via Gmail -> Requires explicit user confirmation dialog
  const promptSendGmail = (e: React.FormEvent) => {
    e.preventDefault();
    const to = emailTo.trim();
    const subject = emailSubject.trim();
    const body = emailBody.trim();
    if (!to || !subject || !body) return;

    setPendingConfirmation({
      title: 'تأكيد إرسال بريد إلكتروني عبر Gmail',
      description: `هل أنت متأكد من إرسال هذا البريد الإلكتروني من حسابك في Gmail؟\n\nإلى: ${to}\nالموضوع: ${subject}\nالمحتوى: "${body}"`,
      confirmLabel: 'تأكيد وإرسال البريد',
      isDanger: false,
      onConfirm: async () => {
        const activeToken = await getAccessToken();
        if (!activeToken) {
          setNeedsAuth(true);
          return;
        }
        const mimeMessage = [
          `To: ${to}`,
          'Content-Type: text/plain; charset="UTF-8"',
          'MIME-Version: 1.0',
          `Subject: =?utf-8?B?${btoa(
            unescape(encodeURIComponent(subject))
          )}?=`,
          '',
          body,
        ].join('\r\n');

        const raw = encodeBase64UrlUtf8(mimeMessage);
        const res = await fetch(
          'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${activeToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ raw }),
          }
        );
        const data = await res.json();
        if (!res.ok) {
          throw new Error(
            data?.error?.message || 'تعذر إرسال البريد الإلكتروني عبر Gmail'
          );
        }
        setEmailTo('');
        setEmailSubject('');
        setEmailBody('');
        setShowComposeEmail(false);
        showToast('تم إرسال البريد الإلكتروني عبر Gmail بنجاح!');
        await fetchGmailMessages(activeToken);
      },
    });
  };

  // Moving a Gmail message to Trash -> Requires explicit user confirmation dialog
  const promptTrashGmailMessage = (msg: GmailMessageSummary) => {
    setPendingConfirmation({
      title: 'تأكيد نقل الرسالة إلى المهملات (Gmail)',
      description: `هل تريد نقل رسالة البريد "${msg.subject}" إلى سلة المهملات في حساب Gmail الخاص بك؟`,
      confirmLabel: 'نعم، انقل للمهملات',
      isDanger: true,
      onConfirm: async () => {
        const activeToken = await getAccessToken();
        if (!activeToken) {
          setNeedsAuth(true);
          return;
        }
        const res = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${encodeURIComponent(
            msg.id
          )}/trash`,
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${activeToken}` },
          }
        );
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(
            errData?.error?.message || 'تعذر نقل الرسالة إلى المهملات'
          );
        }
        showToast('تم نقل الرسالة إلى سلة المهملات في Gmail');
        await fetchGmailMessages(activeToken);
      },
    });
  };

  // ============================================================================
  // 5. GOOGLE KEEP API CALLS
  // ============================================================================
  const fetchKeepNotes = async (overrideToken?: string) => {
    const activeToken = overrideToken || (await getAccessToken());
    if (!activeToken) {
      setNeedsAuth(true);
      return;
    }
    setKeepLoading(true);
    setKeepError(null);
    try {
      const res = await fetch('https://keep.googleapis.com/v1/notes?pageSize=20', {
        headers: { Authorization: `Bearer ${activeToken}` },
      });
      if (res.status === 401) {
        setNeedsAuth(true);
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data?.error?.message ||
            'واجهة Google Keep API مخصصة لحسابات المؤسسات (Enterprise Workspace) مع تفعيل Domain-Wide Delegation.'
        );
      }
      setKeepNotes(data.notes || []);
    } catch (err: unknown) {
      setKeepError(
        err instanceof Error
          ? err.message
          : 'تعذر جلب الملاحظات من Google Keep API'
      );
    } finally {
      setKeepLoading(false);
    }
  };

  const handleCreateKeepNote = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = newKeepTitle.trim();
    const text = newKeepText.trim();
    if (!title && !text) return;
    const activeToken = await getAccessToken();
    if (!activeToken) {
      setNeedsAuth(true);
      return;
    }
    setKeepLoading(true);
    setKeepError(null);
    try {
      const res = await fetch('https://keep.googleapis.com/v1/notes', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${activeToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          body: {
            text: { text },
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data?.error?.message ||
            'تعذر إنشاء ملاحظة في Google Keep (يتطلب حساب Google Workspace Enterprise مفعل الصلاحيات).'
        );
      }
      setNewKeepTitle('');
      setNewKeepText('');
      setShowCreateKeepForm(false);
      showToast('تم إنشاء الملاحظة في Google Keep بنجاح!');
      await fetchKeepNotes(activeToken);
    } catch (err: unknown) {
      setKeepError(
        err instanceof Error ? err.message : 'فشل إنشاء ملاحظة Google Keep'
      );
    } finally {
      setKeepLoading(false);
    }
  };

  // Deleting a Keep Note -> Requires explicit user confirmation dialog
  const promptDeleteKeepNote = (note: GoogleKeepNoteItem) => {
    setPendingConfirmation({
      title: 'تأكيد حذف ملاحظة من Google Keep',
      description: `هل أنت متأكد من حذف الملاحظة "${
        note.title || note.name
      }" نهائياً من Google Keep؟`,
      confirmLabel: 'نعم، احذف الملاحظة',
      isDanger: true,
      onConfirm: async () => {
        const activeToken = await getAccessToken();
        if (!activeToken) {
          setNeedsAuth(true);
          return;
        }
        const res = await fetch(
          `https://keep.googleapis.com/v1/${note.name}`,
          {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${activeToken}` },
          }
        );
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(
            errData?.error?.message || 'فشل حذف الملاحظة من Google Keep'
          );
        }
        showToast('تم حذف الملاحظة من Google Keep');
        await fetchKeepNotes(activeToken);
      },
    });
  };

  const executeConfirmation = async () => {
    if (!pendingConfirmation) return;
    setIsExecutingConfirm(true);
    try {
      await pendingConfirmation.onConfirm();
      setPendingConfirmation(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'فشلت العملية';
      if (activeTab === 'tasks') setTasksError(msg);
      else if (activeTab === 'chat') setChatError(msg);
      else if (activeTab === 'drive') setDriveError(msg);
      else if (activeTab === 'gmail') setGmailError(msg);
      else if (activeTab === 'keep') setKeepError(msg);
      setPendingConfirmation(null);
    } finally {
      setIsExecutingConfirm(false);
    }
  };

  const isAnyLoading =
    tasksLoading || chatLoading || driveLoading || gmailLoading || keepLoading;

  return (
    <div className="flex-1 flex flex-col bg-[#080F1A] text-white overflow-y-auto pb-20">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 bg-gradient-to-b from-[#13223A] to-[#080F1A] border-b border-white/10 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-2.5">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-200 hover:text-[#FFD700] transition"
            title="رجوع"
          >
            <ChevronLeft size={18} className="rotate-180" />
          </button>
          <div>
            <div className="flex items-center gap-1.5">
              <Sparkles size={15} className="text-[#FFD700]" />
              <h2 className="text-sm font-extrabold text-white">
                مركز خدمات Google Workspace
              </h2>
            </div>
            <p className="text-[10px] text-slate-400">
              Drive · Gmail · Keep · Tasks · Chat
            </p>
          </div>
        </div>

        {!needsAuth && user && (
          <button
            onClick={handleLogout}
            className="px-2.5 py-1.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[10px] font-bold flex items-center gap-1 hover:bg-rose-500/25 transition"
          >
            <LogOut size={12} />
            <span>خروج</span>
          </button>
        )}
      </div>

      {/* 5-Service Switcher Tabs: Drive | Gmail | Keep | Tasks | Chat */}
      <div className="px-3.5 pt-3">
        <div className="grid grid-cols-5 gap-1.5 p-1 rounded-2xl bg-[#0F1B30] border border-white/10">
          {[
            { id: 'drive' as WorkspaceSubTabId, label: 'Drive', icon: Folder },
            { id: 'gmail' as WorkspaceSubTabId, label: 'Gmail', icon: Mail },
            {
              id: 'keep' as WorkspaceSubTabId,
              label: 'Keep',
              icon: StickyNote,
            },
            {
              id: 'tasks' as WorkspaceSubTabId,
              label: 'Tasks',
              icon: CheckSquare,
            },
            {
              id: 'chat' as WorkspaceSubTabId,
              label: 'Chat',
              icon: MessageSquare,
            },
          ].map((tab) => {
            const IconComp = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1.5 rounded-xl text-[11px] font-extrabold flex flex-col items-center justify-center gap-1 transition ${
                  isSelected
                    ? 'bg-gradient-to-r from-[#FFD700] to-[#F59E0B] text-[#080F1A] shadow-md'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <IconComp size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-4 space-y-4 flex-1">
        {/* Authentication Gate */}
        {needsAuth ? (
          <div className="bg-gradient-to-b from-[#13223A] to-[#0C1628] border border-[#FFD700]/40 rounded-3xl p-5 text-center space-y-4 shadow-xl">
            <div className="w-14 h-14 rounded-2xl bg-[#FFD700]/15 border border-[#FFD700]/40 flex items-center justify-center mx-auto text-[#FFD700]">
              {activeTab === 'drive' && <Folder size={28} />}
              {activeTab === 'gmail' && <Mail size={28} />}
              {activeTab === 'keep' && <StickyNote size={28} />}
              {activeTab === 'tasks' && <CheckSquare size={28} />}
              {activeTab === 'chat' && <MessageSquare size={28} />}
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-extrabold text-white">
                ربط حساب Google Workspace
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                سجّل الدخول باستخدام حساب Google للوصول إلى ملفاتك في{' '}
                <strong className="text-[#FFD700]">Google Drive</strong>، وبريدك
                في <strong className="text-rose-400">Gmail</strong>، وملاحظات{' '}
                <strong className="text-amber-300">Google Keep</strong>، ومهام{' '}
                <strong className="text-emerald-400">Google Tasks</strong>،
                ومحادثات <strong className="text-[#00D1FF]">Google Chat</strong>
                .
              </p>
            </div>

            {/* Prerequisites Notice for Google Keep & Google Chat */}
            <div className="bg-[#080F1A]/90 border border-amber-500/30 rounded-2xl p-3 text-right space-y-1.5 text-[11px] text-slate-300">
              <div className="font-extrabold text-amber-400 flex items-center gap-1.5">
                <AlertTriangle size={14} />
                <span>ملاحظات هامة حول Google Keep و Google Chat:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-[10px] text-slate-300">
                <li>
                  <strong>Google Drive & Gmail & Tasks:</strong> تعمل مباشرة مع
                  جميع حسابات Google الشخصية (<code>@gmail.com</code>) وحسابات
                  Workspace.
                </li>
                <li>
                  <strong>Google Keep API:</strong> واجهة مخصصة للمؤسسات فقط (
                  <strong>Enterprise-only Google Workspace API</strong>) وتتطلب
                  تفويضاً على مستوى النطاق (Domain-Wide Delegation)، ولا تدعم
                  حسابات <code>@gmail.com</code> الشخصية.
                </li>
                <li>
                  <strong>Google Chat API:</strong> تتطلب حساب Google Workspace
                  للأعمال وإعداد تطبيق Chat في{' '}
                  <a
                    href={chatConsoleConfigUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#00D1FF] underline font-bold inline-flex items-center gap-0.5"
                  >
                    <span>Google Cloud Console</span>
                    <ExternalLink size={10} />
                  </a>
                  .
                </li>
              </ul>
            </div>

            {/* Official Google Sign-In Material Button */}
            <div className="pt-1 flex justify-center">
              <button
                type="button"
                onClick={handleLogin}
                disabled={isLoggingIn}
                className="gsi-material-button bg-white hover:bg-slate-100 text-[#1f1f1f] font-medium rounded-full px-5 py-2.5 flex items-center justify-center gap-3 shadow-lg transition disabled:opacity-60 cursor-pointer border border-slate-300"
              >
                <div className="w-5 h-5 shrink-0">
                  <svg
                    version="1.1"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 48 48"
                    className="w-full h-full block"
                  >
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    ></path>
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                    ></path>
                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                    ></path>
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                    ></path>
                    <path fill="none" d="M0 0h48v48H0z"></path>
                  </svg>
                </div>
                <span className="text-xs font-extrabold text-slate-900">
                  {isLoggingIn ? 'جاري تسجيل الدخول...' : 'Sign in with Google'}
                </span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Connected User Banner */}
            {user && (
              <div className="bg-[#101C30] border border-white/10 rounded-2xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      referrerPolicy="no-referrer"
                      className="w-9 h-9 rounded-full border border-[#FFD700]"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-[#FFD700]/20 text-[#FFD700] flex items-center justify-center font-bold text-xs">
                      {user.displayName?.[0] || 'G'}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="text-xs font-extrabold text-white truncate">
                      {user.displayName || 'مستخدم Google'}
                    </div>
                    <div className="text-[10px] text-emerald-400 truncate">
                      {user.email} · متصل بـ Google Workspace
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRefreshActiveTab}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 transition"
                  title="تحديث البيانات"
                >
                  <RefreshCw
                    size={15}
                    className={isAnyLoading ? 'animate-spin' : ''}
                  />
                </button>
              </div>
            )}

            {/* ==============================================================
                TAB: GOOGLE DRIVE VIEW
               ============================================================== */}
            {activeTab === 'drive' && (
              <div className="space-y-3.5">
                <div className="bg-[#101C30] border border-white/10 rounded-2xl p-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-[#FFD700] flex items-center gap-1.5">
                      <Folder size={15} />
                      <span>ملفاتي في Google Drive</span>
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setShowCreateDriveForm(!showCreateDriveForm)
                      }
                      className="px-2.5 py-1 rounded-xl bg-[#FFD700]/15 border border-[#FFD700]/40 text-[#FFD700] text-[10px] font-bold flex items-center gap-1"
                    >
                      <Plus size={12} />
                      <span>ملف نصي جديد</span>
                    </button>
                  </div>

                  {/* Search Drive Files */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      fetchDriveFiles();
                    }}
                    className="flex items-center gap-2"
                  >
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={driveSearchQuery}
                        onChange={(e) => setDriveSearchQuery(e.target.value)}
                        placeholder="ابحث عن ملف في Google Drive..."
                        className="w-full bg-[#080F1A] border border-white/15 rounded-xl pr-8 pl-3 py-2 text-xs text-white focus:outline-none focus:border-[#FFD700]"
                      />
                      <Search
                        size={13}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-3 py-2 rounded-xl bg-[#162847] border border-white/10 text-xs font-bold text-white shrink-0"
                    >
                      بحث
                    </button>
                  </form>

                  {/* Create Drive File Form */}
                  {showCreateDriveForm && (
                    <form
                      onSubmit={handleCreateDriveNoteFile}
                      className="bg-[#080F1A] border border-[#FFD700]/30 rounded-xl p-3 space-y-2"
                    >
                      <div className="text-[11px] font-extrabold text-[#FFD700]">
                        إنشاء مستند نصي في Google Drive
                      </div>
                      <input
                        type="text"
                        required
                        value={newDriveFileName}
                        onChange={(e) => setNewDriveFileName(e.target.value)}
                        placeholder="اسم الملف (مثال: ملاحظات مجلسنا.txt)"
                        className="w-full bg-[#101C30] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FFD700]"
                      />
                      <textarea
                        rows={3}
                        value={newDriveFileContent}
                        onChange={(e) => setNewDriveFileContent(e.target.value)}
                        placeholder="محتوى الملف النصي..."
                        className="w-full bg-[#101C30] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00D1FF]"
                      />
                      <button
                        type="submit"
                        disabled={driveLoading}
                        className="w-full py-2 rounded-xl bg-gradient-to-r from-[#FFD700] to-[#F59E0B] text-[#080F1A] text-xs font-extrabold"
                      >
                        حفظ في Google Drive
                      </button>
                    </form>
                  )}
                </div>

                {driveError && (
                  <div className="bg-rose-500/15 border border-rose-500/40 text-rose-200 rounded-2xl p-3 text-xs">
                    {driveError}
                  </div>
                )}

                <div className="space-y-2">
                  {driveLoading ? (
                    <div className="text-center py-8 text-xs text-slate-400">
                      جاري تحميل ملفات Google Drive...
                    </div>
                  ) : driveFiles.length === 0 ? (
                    <div className="bg-[#101C30]/60 border border-white/10 rounded-2xl p-6 text-center text-xs text-slate-400">
                      لا توجد ملفات مطابقة في Google Drive.
                    </div>
                  ) : (
                    driveFiles.map((file) => (
                      <div
                        key={file.id}
                        className="p-3 rounded-2xl bg-[#122038] border border-white/10 flex items-center justify-between gap-2.5"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-[#FFD700]/15 border border-[#FFD700]/30 flex items-center justify-center text-[#FFD700] shrink-0">
                            <FileText size={16} />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-white truncate">
                              {file.name}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">
                              {file.mimeType}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {file.webViewLink && (
                            <a
                              href={file.webViewLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-[#00D1FF] transition"
                              title="فتح في Google Drive"
                            >
                              <ExternalLink size={14} />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => promptDeleteDriveFile(file)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                            title="حذف الملف"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* ==============================================================
                TAB: GMAIL VIEW
               ============================================================== */}
            {activeTab === 'gmail' && (
              <div className="space-y-3.5">
                <div className="bg-[#101C30] border border-white/10 rounded-2xl p-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-rose-400 flex items-center gap-1.5">
                      <Mail size={15} />
                      <span>البريد الوارد في Gmail</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowComposeEmail(!showComposeEmail)}
                      className="px-2.5 py-1 rounded-xl bg-rose-500/20 border border-rose-400/40 text-rose-300 text-[10px] font-bold flex items-center gap-1"
                    >
                      <Plus size={12} />
                      <span>رسالة بريد جديدة</span>
                    </button>
                  </div>

                  {showComposeEmail && (
                    <form
                      onSubmit={promptSendGmail}
                      className="bg-[#080F1A] border border-rose-400/30 rounded-xl p-3 space-y-2"
                    >
                      <div className="text-[11px] font-extrabold text-rose-300">
                        إرسال بريد إلكتروني عبر Gmail (مع تأكيد قبل الإرسال)
                      </div>
                      <input
                        type="email"
                        required
                        value={emailTo}
                        onChange={(e) => setEmailTo(e.target.value)}
                        placeholder="إلى (البريد الإلكتروني للمستلم)..."
                        dir="ltr"
                        className="w-full bg-[#101C30] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-400"
                      />
                      <input
                        type="text"
                        required
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                        placeholder="موضوع الرسالة..."
                        className="w-full bg-[#101C30] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-400"
                      />
                      <textarea
                        rows={3}
                        required
                        value={emailBody}
                        onChange={(e) => setEmailBody(e.target.value)}
                        placeholder="نص رسالة البريد الإلكتروني..."
                        className="w-full bg-[#101C30] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-400"
                      />
                      <button
                        type="submit"
                        disabled={gmailLoading}
                        className="w-full py-2 rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 text-white text-xs font-extrabold flex items-center justify-center gap-1.5"
                      >
                        <Send size={13} />
                        <span>مراجعة وإرسال البريد</span>
                      </button>
                    </form>
                  )}
                </div>

                {gmailError && (
                  <div className="bg-rose-500/15 border border-rose-500/40 text-rose-200 rounded-2xl p-3 text-xs">
                    {gmailError}
                  </div>
                )}

                <div className="space-y-2">
                  {gmailLoading ? (
                    <div className="text-center py-8 text-xs text-slate-400">
                      جاري جلب رسائل Gmail...
                    </div>
                  ) : gmailMessages.length === 0 ? (
                    <div className="bg-[#101C30]/60 border border-white/10 rounded-2xl p-6 text-center text-xs text-slate-400">
                      لا توجد رسائل بريد إلكتروني للعرض حالياً.
                    </div>
                  ) : (
                    gmailMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className="p-3 rounded-2xl bg-[#122038] border border-white/10 space-y-1.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="text-xs font-extrabold text-white truncate">
                              {msg.subject}
                            </div>
                            <div className="text-[10px] text-[#00D1FF] truncate">
                              {msg.from}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => promptTrashGmailMessage(msg)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition shrink-0"
                            title="نقل إلى المهملات"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                          {msg.snippet}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* ==============================================================
                TAB: GOOGLE KEEP VIEW
               ============================================================== */}
            {activeTab === 'keep' && (
              <div className="space-y-3.5">
                {/* Enterprise Prerequisite Notice for Google Keep */}
                <div className="bg-amber-500/15 border border-amber-400/50 rounded-2xl p-3 text-[11px] text-amber-100 space-y-1">
                  <div className="font-extrabold text-amber-300 flex items-center gap-1.5">
                    <AlertTriangle size={14} />
                    <span>ملاحظة حول Google Keep API (Enterprise-Only):</span>
                  </div>
                  <p className="text-[10px] text-slate-200 leading-relaxed">
                    واجهة <code>keep.googleapis.com</code> مخصصة لحسابات مؤسسات{' '}
                    <strong>Google Workspace Enterprise</strong> مع تفعيل
                    Domain-Wide Delegation. حسابات <code>@gmail.com</code>{' '}
                    الشخصية لا تمنح صلاحية Keep عبر نافذة OAuth العادية، ويمكنك
                    حفظ ملاحظاتك البديلة مباشرة في تبويب{' '}
                    <strong>Google Drive</strong> أو{' '}
                    <strong>Google Tasks</strong>.
                  </p>
                </div>

                <div className="bg-[#101C30] border border-white/10 rounded-2xl p-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-amber-300 flex items-center gap-1.5">
                      <StickyNote size={15} />
                      <span>ملاحظات Google Keep</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowCreateKeepForm(!showCreateKeepForm)}
                      className="px-2.5 py-1 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] font-bold flex items-center gap-1"
                    >
                      <Plus size={12} />
                      <span>ملاحظة Keep جديدة</span>
                    </button>
                  </div>

                  {showCreateKeepForm && (
                    <form
                      onSubmit={handleCreateKeepNote}
                      className="bg-[#080F1A] border border-amber-400/30 rounded-xl p-3 space-y-2"
                    >
                      <input
                        type="text"
                        required
                        value={newKeepTitle}
                        onChange={(e) => setNewKeepTitle(e.target.value)}
                        placeholder="عنوان الملاحظة..."
                        className="w-full bg-[#101C30] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                      />
                      <textarea
                        rows={3}
                        required
                        value={newKeepText}
                        onChange={(e) => setNewKeepText(e.target.value)}
                        placeholder="نص الملاحظة..."
                        className="w-full bg-[#101C30] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                      />
                      <button
                        type="submit"
                        disabled={keepLoading}
                        className="w-full py-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-[#080F1A] text-xs font-extrabold"
                      >
                        إنشاء في Google Keep
                      </button>
                    </form>
                  )}
                </div>

                {keepError && (
                  <div className="bg-rose-500/15 border border-rose-500/40 text-rose-200 rounded-2xl p-3 text-xs">
                    {keepError}
                  </div>
                )}

                <div className="space-y-2">
                  {keepLoading ? (
                    <div className="text-center py-8 text-xs text-slate-400">
                      جاري الاتصال بـ Google Keep API...
                    </div>
                  ) : keepNotes.length === 0 ? (
                    <div className="bg-[#101C30]/60 border border-white/10 rounded-2xl p-6 text-center text-xs text-slate-400">
                      لا توجد ملاحظات معروضة من Google Keep حالياً.
                    </div>
                  ) : (
                    keepNotes.map((note) => (
                      <div
                        key={note.name}
                        className="p-3 rounded-2xl bg-[#122038] border border-amber-400/30 flex items-start justify-between gap-2.5"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-extrabold text-amber-300">
                            {note.title || 'ملاحظة بدون عنوان'}
                          </div>
                          <p className="text-xs text-slate-200 mt-1 whitespace-pre-line">
                            {note.body?.text?.text || ''}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => promptDeleteKeepNote(note)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition shrink-0"
                          title="حذف الملاحظة"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* ==============================================================
                TAB: GOOGLE TASKS VIEW
               ============================================================== */}
            {activeTab === 'tasks' && (
              <div className="space-y-3.5">
                <div className="bg-[#101C30] border border-white/10 rounded-2xl p-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-[#FFD700] flex items-center gap-1.5">
                      <Calendar size={14} />
                      <span>قوائم مهامي (Task Lists)</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowNewListForm(!showNewListForm)}
                      className="px-2.5 py-1 rounded-xl bg-[#FFD700]/15 border border-[#FFD700]/40 text-[#FFD700] text-[10px] font-bold flex items-center gap-1"
                    >
                      <Plus size={12} />
                      <span>قائمة جديدة</span>
                    </button>
                  </div>

                  {showNewListForm && (
                    <form
                      onSubmit={handleCreateTaskList}
                      className="flex items-center gap-2 pt-1"
                    >
                      <input
                        type="text"
                        required
                        value={newListName}
                        onChange={(e) => setNewListName(e.target.value)}
                        placeholder="اسم القائمة (مثال: مهام إدارة المجلس)"
                        className="flex-1 bg-[#080F1A] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FFD700]"
                      />
                      <button
                        type="submit"
                        className="px-3 py-2 rounded-xl bg-[#FFD700] text-[#080F1A] text-xs font-extrabold shrink-0"
                      >
                        إنشاء
                      </button>
                    </form>
                  )}

                  {taskLists.length > 0 ? (
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                      {taskLists.map((list) => (
                        <button
                          key={list.id}
                          type="button"
                          onClick={() => {
                            setSelectedTaskListId(list.id);
                            fetchTasksForList(list.id);
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition ${
                            selectedTaskListId === list.id
                              ? 'bg-[#FFD700] text-[#080F1A]'
                              : 'bg-[#080F1A] text-slate-300 border border-white/10'
                          }`}
                        >
                          {list.title}
                        </button>
                      ))}
                    </div>
                  ) : (
                    !tasksLoading && (
                      <p className="text-[11px] text-slate-400">
                        لا توجد قوائم مهام حالياً. أنشئ قائمة جديدة للبدء.
                      </p>
                    )
                  )}
                </div>

                {selectedTaskListId && (
                  <form
                    onSubmit={handleCreateTask}
                    className="bg-[#101C30] border border-[#FFD700]/30 rounded-2xl p-3 space-y-2.5"
                  >
                    <div className="text-xs font-extrabold text-white">
                      إضافة مهمة جديدة إلى القائمة الحالية
                    </div>
                    <input
                      type="text"
                      required
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      placeholder="عنوان المهمة (مثال: تجهيز مسابقة المجلس الليلة)..."
                      className="w-full bg-[#080F1A] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FFD700]"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newTaskNotes}
                        onChange={(e) => setNewTaskNotes(e.target.value)}
                        placeholder="ملاحظات إضافية (اختياري)..."
                        className="flex-1 bg-[#080F1A] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00D1FF]"
                      />
                      <button
                        type="submit"
                        disabled={tasksLoading}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#FFD700] to-[#F59E0B] text-[#080F1A] text-xs font-extrabold flex items-center gap-1 shrink-0 disabled:opacity-50"
                      >
                        <Plus size={14} />
                        <span>إضافة</span>
                      </button>
                    </div>
                  </form>
                )}

                {tasksError && (
                  <div className="bg-rose-500/15 border border-rose-500/40 text-rose-200 rounded-2xl p-3 text-xs">
                    {tasksError}
                  </div>
                )}

                <div className="space-y-2">
                  {tasksLoading ? (
                    <div className="text-center py-8 text-xs text-slate-400">
                      جاري مزامنة المهام مع Google Tasks...
                    </div>
                  ) : tasks.length === 0 ? (
                    <div className="bg-[#101C30]/60 border border-white/10 rounded-2xl p-6 text-center text-xs text-slate-400">
                      لا توجد مهام في هذه القائمة بعد. أضف أول مهمة من الأعلى!
                    </div>
                  ) : (
                    tasks.map((task) => {
                      const isDone = task.status === 'completed';
                      return (
                        <div
                          key={task.id}
                          className={`p-3 rounded-2xl border flex items-start justify-between gap-2.5 transition ${
                            isDone
                              ? 'bg-[#0C1524] border-emerald-500/30 opacity-75'
                              : 'bg-[#122038] border-white/10'
                          }`}
                        >
                          <div className="flex items-start gap-2.5 min-w-0">
                            <button
                              type="button"
                              onClick={() => promptToggleTaskStatus(task)}
                              className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition ${
                                isDone
                                  ? 'bg-emerald-500 border-emerald-400 text-[#080F1A]'
                                  : 'border-slate-400 hover:border-[#FFD700]'
                              }`}
                              title={
                                isDone ? 'تحديد كغير مكتملة' : 'تحديد كمكتملة'
                              }
                            >
                              {isDone && <Check size={13} />}
                            </button>
                            <div className="min-w-0">
                              <div
                                className={`text-xs font-bold break-words ${
                                  isDone
                                    ? 'line-through text-slate-400'
                                    : 'text-white'
                                }`}
                              >
                                {task.title}
                              </div>
                              {task.notes && (
                                <p className="text-[11px] text-slate-400 mt-0.5 break-words">
                                  {task.notes}
                                </p>
                              )}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => promptDeleteTask(task)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition shrink-0"
                            title="حذف المهمة"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* ==============================================================
                TAB: GOOGLE CHAT VIEW
               ============================================================== */}
            {activeTab === 'chat' && (
              <div className="space-y-3.5">
                <div className="bg-[#101C30] border border-[#00D1FF]/30 rounded-2xl p-3 text-[11px] text-slate-300 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-[#00D1FF] flex items-center gap-1.5">
                      <Users size={14} />
                      <span>مساحات Google Chat (Workspace Spaces)</span>
                    </span>
                    <a
                      href={chatConsoleConfigUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-[#FFD700] underline flex items-center gap-1 font-bold"
                    >
                      <span>إعداد Chat API</span>
                      <ExternalLink size={11} />
                    </a>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    ملاحظة: يتطلب Google Chat حساب Google Workspace للأعمال
                    وإكمال إعداد تطبيق Chat في Google Cloud Console للمشروع{' '}
                    <code>{projectId}</code>.
                  </p>
                </div>

                {chatNotConfigured404 && (
                  <div className="bg-amber-500/15 border-2 border-amber-400/60 rounded-2xl p-3.5 space-y-2 text-xs text-amber-100">
                    <div className="font-extrabold text-amber-300 flex items-center gap-1.5">
                      <AlertTriangle size={16} />
                      <span>
                        Google Chat app not found (مطلوب تفعيل إعدادات تطبيق
                        Chat)
                      </span>
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      رسالة الخادم:{' '}
                      <code>
                        Google Chat app not found. To create a Chat app, you
                        must turn on the Chat API and configure the app in the
                        Google Cloud console.
                      </code>
                    </p>
                    <a
                      href={chatConsoleConfigUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#FFD700] text-[#080F1A] font-extrabold text-xs"
                    >
                      <span>فتح Google Chat API Configuration</span>
                      <ExternalLink size={13} />
                    </a>
                  </div>
                )}

                {chatError && !chatNotConfigured404 && (
                  <div className="bg-rose-500/15 border border-rose-500/40 text-rose-200 rounded-2xl p-3 text-xs space-y-1.5">
                    <div className="font-bold">{chatError}</div>
                    <a
                      href={chatConsoleConfigUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-[#00D1FF] underline"
                    >
                      <span>مراجعة إعدادات Google Chat API في Console</span>
                      <ExternalLink size={11} />
                    </a>
                  </div>
                )}

                <div className="bg-[#101C30] border border-white/10 rounded-2xl p-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-white">
                      اختر مساحة المحادثة (Space):
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setShowCreateSpaceForm(!showCreateSpaceForm)
                      }
                      className="px-2.5 py-1 rounded-xl bg-[#00D1FF]/15 border border-[#00D1FF]/40 text-[#00D1FF] text-[10px] font-bold flex items-center gap-1"
                    >
                      <Plus size={12} />
                      <span>مساحة جديدة</span>
                    </button>
                  </div>

                  {showCreateSpaceForm && (
                    <form
                      onSubmit={handleCreateSpace}
                      className="flex items-center gap-2 pt-1"
                    >
                      <input
                        type="text"
                        required
                        value={newSpaceDisplayName}
                        onChange={(e) => setNewSpaceDisplayName(e.target.value)}
                        placeholder="اسم المساحة (مثال: ديوانية مجلسنا)"
                        className="flex-1 bg-[#080F1A] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00D1FF]"
                      />
                      <button
                        type="submit"
                        className="px-3 py-2 rounded-xl bg-[#00D1FF] text-[#080F1A] text-xs font-extrabold shrink-0"
                      >
                        إنشاء
                      </button>
                    </form>
                  )}

                  {spaces.length > 0 ? (
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                      {spaces.map((space) => (
                        <button
                          key={space.name}
                          type="button"
                          onClick={() => {
                            setSelectedSpaceName(space.name);
                            fetchSpaceMessages(space.name);
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition ${
                            selectedSpaceName === space.name
                              ? 'bg-[#00D1FF] text-[#080F1A]'
                              : 'bg-[#080F1A] text-slate-300 border border-white/10'
                          }`}
                        >
                          {space.displayName || space.name}
                        </button>
                      ))}
                    </div>
                  ) : (
                    !chatLoading && (
                      <p className="text-[11px] text-slate-400">
                        لا توجد مساحات Google Chat متاحة حالياً.
                      </p>
                    )
                  )}
                </div>

                {selectedSpaceName && (
                  <div className="bg-[#101C30] border border-white/10 rounded-2xl p-3 space-y-3">
                    <div className="text-xs font-extrabold text-[#FFD700] flex items-center justify-between">
                      <span>رسائل المساحة المختارة</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {selectedSpaceName}
                      </span>
                    </div>

                    <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                      {chatLoading ? (
                        <div className="text-center py-6 text-xs text-slate-400">
                          جاري تحميل رسائل Google Chat...
                        </div>
                      ) : messages.length === 0 ? (
                        <div className="text-center py-6 text-xs text-slate-400">
                          لا توجد رسائل في هذه المساحة بعد.
                        </div>
                      ) : (
                        messages.map((msg) => (
                          <div
                            key={msg.name}
                            className="bg-[#080F1A] border border-white/10 rounded-xl p-2.5 space-y-1"
                          >
                            <div className="flex items-center justify-between text-[10px] text-[#00D1FF] font-bold">
                              <span>
                                {msg.sender?.displayName ||
                                  msg.sender?.name ||
                                  'عضو المساحة'}
                              </span>
                              {msg.createTime && (
                                <span className="text-slate-500">
                                  {new Date(msg.createTime).toLocaleTimeString(
                                    'ar-SA',
                                    { hour: '2-digit', minute: '2-digit' }
                                  )}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-white break-words">
                              {msg.text || '(رسالة بدون نص)'}
                            </p>
                          </div>
                        ))
                      )}
                    </div>

                    <form
                      onSubmit={promptSendChatMessage}
                      className="flex items-center gap-2 pt-2 border-t border-white/10"
                    >
                      <input
                        type="text"
                        required
                        value={newChatMessage}
                        onChange={(e) => setNewChatMessage(e.target.value)}
                        placeholder="اكتب رسالة لإرسالها عبر Google Chat..."
                        className="flex-1 bg-[#080F1A] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00D1FF]"
                      />
                      <button
                        type="submit"
                        disabled={chatLoading}
                        className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#00D1FF] to-[#3B82F6] text-[#080F1A] text-xs font-extrabold flex items-center gap-1 shrink-0"
                      >
                        <Send size={13} />
                        <span>إرسال</span>
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Explicit User Confirmation Modal for Mutating/Destructive Operations */}
      {pendingConfirmation && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#101C30] border border-[#FFD700]/50 rounded-3xl p-5 space-y-4 shadow-2xl text-right">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                  pendingConfirmation.isDanger
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                    : 'bg-[#FFD700]/20 text-[#FFD700] border border-[#FFD700]/40'
                }`}
              >
                <AlertTriangle size={20} />
              </div>
              <h3 className="text-sm font-extrabold text-white">
                {pendingConfirmation.title}
              </h3>
            </div>

            <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed">
              {pendingConfirmation.description}
            </p>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                disabled={isExecutingConfirm}
                onClick={executeConfirmation}
                className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition ${
                  pendingConfirmation.isDanger
                    ? 'bg-rose-500 hover:bg-rose-600 text-white'
                    : 'bg-gradient-to-r from-[#FFD700] to-[#F59E0B] text-[#080F1A]'
                }`}
              >
                {isExecutingConfirm
                  ? 'جاري التنفيذ...'
                  : pendingConfirmation.confirmLabel}
              </button>
              <button
                type="button"
                disabled={isExecutingConfirm}
                onClick={() => setPendingConfirmation(null)}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-bold transition"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
