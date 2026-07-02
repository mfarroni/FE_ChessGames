/**
 * Versione: 1.0.1
 * Data e Ora Modifica: 02/07/2026 12:30:15
 * Problema Risolto: Implementazione selezione dei giocatori (singola o multipla) e relativo pannello di invio email di comunicazioni SMTP da webmaster@granmasterchess.it.
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Lock, 
  Database, 
  Music, 
  Trash2, 
  Plus, 
  LogOut, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft, 
  Upload, 
  RefreshCw,
  HelpCircle,
  Users,
  Edit3,
  Download,
  Terminal,
  UserPlus,
  Mail,
  Key
} from 'lucide-react';
import { API_BASE_URL, getResourceUrl } from '../utils/apiConfig';

// Module-scope fetch wrapper to automatically prepend API_BASE_URL for API requests
const fetch = (input: RequestInfo | URL, init?: RequestInit) => {
  let url = typeof input === 'string' ? input : input.toString();
  if ((url.startsWith('/api/') || url.startsWith('/uploads/')) && API_BASE_URL) {
    url = `${API_BASE_URL.replace(/\/$/, '')}${url}`;
  }
  return window.fetch(url, init);
};

interface MusicTrack {
  id: string;
  name: string;
  url: string;
  isLocal?: boolean;
}

export default function AdminPanel() {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [adminUsername, setAdminUsername] = useState<string>('admin');

  // Login inputs
  const [loginUser, setLoginUser] = useState<string>('');
  const [loginPass, setLoginPass] = useState<string>('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // PostgreSQL Config inputs
  const [dbConnectionString, setDbConnectionString] = useState<string>('');
  const [dbStatus, setDbStatus] = useState<{
    postgresConfigured: boolean;
    postgresUrl: string;
    isEnvVar: boolean;
  } | null>(null);
  const [dbConfigError, setDbConfigError] = useState<string | null>(null);
  const [dbConfigSuccess, setDbConfigSuccess] = useState<string | null>(null);
  const [testingConnection, setTestingConnection] = useState<boolean>(false);

  // SMTP Config inputs
  const [smtpHost, setSmtpHost] = useState<string>('');
  const [smtpPort, setSmtpPort] = useState<string>('');
  const [smtpUser, setSmtpUser] = useState<string>('');
  const [smtpPass, setSmtpPass] = useState<string>('');
  const [smtpFrom, setSmtpFrom] = useState<string>('');
  const [smtpIsEnvVar, setSmtpIsEnvVar] = useState<boolean>(false);
  const [smtpConfigError, setSmtpConfigError] = useState<string | null>(null);
  const [smtpConfigSuccess, setSmtpConfigSuccess] = useState<string | null>(null);
  const [savingSmtp, setSavingSmtp] = useState<boolean>(false);

  // Tracks list
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [loadingTracks, setLoadingTracks] = useState<boolean>(false);

  // File upload states
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Users management states
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(false);
  
  // User Modal states
  const [showUserModal, setShowUserModal] = useState<boolean>(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null); // null = add, string = edit
  const [userForm, setUserForm] = useState({
    username: '',
    email: '',
    password: '',
    rating: 1500,
    wins: 0,
    losses: 0
  });
  const [userFormError, setUserFormError] = useState<string | null>(null);
  const [userFormSuccess, setUserFormSuccess] = useState<string | null>(null);

  // Reset Password states
  const [resettingUser, setResettingUser] = useState<any | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState<string>('');
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);

  // Selected user IDs for mass/individual emails
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [communicationSubject, setCommunicationSubject] = useState<string>('');
  const [communicationBody, setCommunicationBody] = useState<string>('');
  const [isSendingCommunication, setIsSendingCommunication] = useState<boolean>(false);
  const [communicationSuccess, setCommunicationSuccess] = useState<string | null>(null);
  const [communicationError, setCommunicationError] = useState<string | null>(null);

  // Live Logs states
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState<boolean>(false);

  // Load session token on mount
  useEffect(() => {
    const storedToken = sessionStorage.getItem('admin_token');
    const storedUser = sessionStorage.getItem('admin_username');
    if (storedToken && storedUser) {
      setIsAdminLoggedIn(true);
      setAdminToken(storedToken);
      setAdminUsername(storedUser);
      fetchDbStatus(storedToken);
      fetchSmtpConfig(storedToken);
      fetchTracks();
    }
  }, []);

  // Periodic polling for Logs and Users when logged in
  useEffect(() => {
    if (isAdminLoggedIn && adminToken) {
      fetchUsers();
      fetchLogs();
      const interval = setInterval(() => {
        fetchLogs();
      }, 4000); // refresh system logs every 4 seconds
      return () => clearInterval(interval);
    }
  }, [isAdminLoggedIn, adminToken]);

  const fetchUsers = async () => {
    if (!adminToken) return;
    setLoadingUsers(true);
    try {
      const res = await fetch('/api/admin/users', {
        headers: { 'x-admin-token': adminToken }
      });
      const data = await res.json();
      if (data.success && data.users) {
        setUsers(data.users);
      }
    } catch (err) {
      console.error('Errore nel caricamento degli utenti:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchLogs = async () => {
    if (!adminToken) return;
    setLoadingLogs(true);
    try {
      const res = await fetch('/api/admin/logs', {
        headers: { 'x-admin-token': adminToken }
      });
      const data = await res.json();
      if (data.success && data.logs) {
        setLogs(data.logs);
      }
    } catch (err) {
      console.error('Errore nel caricamento dei log:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleSubmitUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserFormError(null);
    setUserFormSuccess(null);

    if (!userForm.username.trim() || !userForm.email.trim() || (!editingUserId && !userForm.password.trim())) {
      setUserFormError('Username, Email e Password sono obbligatori.');
      return;
    }

    try {
      const url = editingUserId ? `/api/admin/users/${editingUserId}` : '/api/admin/users';
      const method = editingUserId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': adminToken || ''
        },
        body: JSON.stringify(userForm)
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setUserFormSuccess(data.message || 'Operazione completata con successo!');
        fetchUsers();
        fetchLogs();
        setTimeout(() => {
          setShowUserModal(false);
          setEditingUserId(null);
          setUserForm({
            username: '',
            email: '',
            password: '',
            rating: 1500,
            wins: 0,
            losses: 0
          });
          setUserFormSuccess(null);
        }, 1500);
      } else {
        setUserFormError(data.message || 'Errore durante l\'operazione.');
      }
    } catch (err) {
      setUserFormError('Impossibile connettersi al server.');
    }
  };

  const handleEditUserClick = (user: any) => {
    setEditingUserId(user.id);
    setUserForm({
      username: user.username,
      email: user.email,
      password: user.password || '',
      rating: user.rating,
      wins: user.wins,
      losses: user.losses
    });
    setUserFormError(null);
    setUserFormSuccess(null);
    setShowUserModal(true);
  };

  const handleDeleteUser = async (id: string, username: string) => {
    if (!confirm(`Sei sicuro di voler eliminare definitivamente l'utente "${username}"?`)) return;
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-token': adminToken || '' }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchUsers();
        fetchLogs();
      } else {
        alert(data.message || 'Errore durante l\'eliminazione dell\'utente.');
      }
    } catch (err) {
      alert('Errore di rete durante l\'eliminazione.');
    }
  };

  const handleResetPasswordClick = (user: any) => {
    setResettingUser(user);
    const randomPass = 'scacchi_' + Math.floor(1000 + Math.random() * 9000);
    setNewPasswordInput(randomPass);
    setResetSuccess(null);
    setResetError(null);
  };

  const handleConfirmResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingUser) return;
    if (!newPasswordInput.trim()) {
      setResetError('La password non può essere vuota.');
      return;
    }
    try {
      const res = await fetch(`/api/admin/users/${resettingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': adminToken || ''
        },
        body: JSON.stringify({
          ...resettingUser,
          password: newPasswordInput.trim()
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setResetSuccess(`Password reimpostata con successo per l'utente ${resettingUser.username}!`);
        fetchUsers();
        fetchLogs();
        setTimeout(() => {
          setResettingUser(null);
          setResetSuccess(null);
        }, 2000);
      } else {
        setResetError(data.message || 'Errore durante la reimpostazione della password.');
      }
    } catch (err) {
      setResetError('Impossibile connettersi al server.');
    }
  };

  const handleDownloadCSV = () => {
    if (!adminToken) return;
    window.open(`/api/admin/users/csv?token=${adminToken}`, '_blank');
  };

  const handleSendCommunication = async () => {
    if (!adminToken) return;
    if (selectedUserIds.length === 0) {
      setCommunicationError('Seleziona almeno un utente per inviare la comunicazione.');
      return;
    }
    if (!communicationSubject.trim()) {
      setCommunicationError('L\'oggetto della comunicazione è richiesto.');
      return;
    }
    if (!communicationBody.trim()) {
      setCommunicationError('Il corpo del messaggio è richiesto.');
      return;
    }

    setIsSendingCommunication(true);
    setCommunicationError(null);
    setCommunicationSuccess(null);

    try {
      const selectedEmails = users
        .filter(u => selectedUserIds.includes(u.id))
        .map(u => u.email)
        .filter(Boolean);

      const res = await fetch('/api/admin/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': adminToken
        },
        body: JSON.stringify({
          emails: selectedEmails,
          subject: communicationSubject.trim(),
          body: communicationBody.trim()
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setCommunicationSuccess(data.message || 'Comunicazione email inviata con successo!');
        setCommunicationSubject('');
        setCommunicationBody('');
        setSelectedUserIds([]);
        fetchLogs();
      } else {
        setCommunicationError(data.message || 'Errore durante l\'invio della comunicazione.');
      }
    } catch (err: any) {
      setCommunicationError('Errore di connessione con il server: ' + err.message);
    } finally {
      setIsSendingCommunication(false);
    }
  };

  const fetchDbStatus = async (token: string) => {
    try {
      const res = await fetch('/api/admin/config/status', {
        headers: { 'x-admin-token': token }
      });
      const data = await res.json();
      if (data.success) {
        setDbStatus(data);
        if (data.postgresConfigured && !dbConnectionString) {
          setDbConnectionString(''); // Don't overwrite with masked value
        }
      }
    } catch (err) {
      console.error('Failed to fetch DB status:', err);
    }
  };

  const fetchSmtpConfig = async (token: string) => {
    try {
      const res = await fetch('/api/admin/config/smtp', {
        headers: { 'x-admin-token': token }
      });
      const data = await res.json();
      if (data.success && data.smtp) {
        setSmtpHost(data.smtp.host || '');
        setSmtpPort(data.smtp.port || '');
        setSmtpUser(data.smtp.user || '');
        setSmtpPass(data.smtp.pass || '');
        setSmtpFrom(data.smtp.from || '');
        setSmtpIsEnvVar(!!data.isEnvVar);
      }
    } catch (err) {
      console.error('Failed to fetch SMTP config:', err);
    }
  };

  const handleSaveSmtpConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSmtpConfigError(null);
    setSmtpConfigSuccess(null);
    setSavingSmtp(true);

    try {
      const res = await fetch('/api/admin/config/smtp', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-token': adminToken || ''
        },
        body: JSON.stringify({ 
          host: smtpHost,
          port: smtpPort,
          user: smtpUser,
          pass: smtpPass,
          from: smtpFrom
        })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setSmtpConfigSuccess(data.message);
        if (adminToken) {
          fetchSmtpConfig(adminToken);
        }
      } else {
        setSmtpConfigError(data.message || 'Errore di salvataggio.');
      }
    } catch (err: any) {
      setSmtpConfigError('Impossibile connettersi al server per salvare la configurazione SMTP.');
    } finally {
      setSavingSmtp(false);
    }
  };

  const fetchTracks = async () => {
    setLoadingTracks(true);
    try {
      const res = await fetch('/api/music');
      const data = await res.json();
      if (data.success && data.tracks) {
        setTracks(data.tracks);
      }
    } catch (err) {
      console.error('Errore nel caricamento delle musiche:', err);
    } finally {
      setLoadingTracks(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!loginUser.trim() || !loginPass) {
      setLoginError('Tutti i campi sono obbligatori.');
      return;
    }

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUser.trim(), password: loginPass })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setIsAdminLoggedIn(true);
        setAdminToken(data.token);
        setAdminUsername(data.username);
        sessionStorage.setItem('admin_token', data.token);
        sessionStorage.setItem('admin_username', data.username);
        fetchDbStatus(data.token);
        fetchSmtpConfig(data.token);
        fetchTracks();
      } else {
        setLoginError(data.message || 'Credenziali non valide.');
      }
    } catch (err) {
      setLoginError('Errore di connessione al server.');
    }
  };

  const handleLogout = () => {
    setIsAdminLoggedIn(false);
    setAdminToken(null);
    sessionStorage.removeItem('admin_token');
    sessionStorage.removeItem('admin_username');
    setDbStatus(null);
  };

  const handleSaveDbConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setDbConfigError(null);
    setDbConfigSuccess(null);
    setTestingConnection(true);

    try {
      const res = await fetch('/api/admin/config/database', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-token': adminToken || ''
        },
        body: JSON.stringify({ connectionString: dbConnectionString })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setDbConfigSuccess(data.message);
        if (adminToken) {
          fetchDbStatus(adminToken);
        }
        fetchTracks(); // Refetch tracks from PostgreSQL!
      } else {
        setDbConfigError(data.message || 'Errore di configurazione.');
      }
    } catch (err: any) {
      setDbConfigError('Impossibile connettersi al server per testare la connessione.');
    } finally {
      setTestingConnection(false);
    }
  };

  // Drag-and-drop & File uploads handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      await uploadFile(file);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      await uploadFile(file);
    }
  };

  const uploadFile = async (file: File) => {
    if (tracks.length >= 5) {
      setUploadError('Limite massimo di 5 tracce raggiunto. Elimina un brano prima di caricarne uno nuovo.');
      setUploadSuccess(null);
      return;
    }

    if (!file.name.toLowerCase().endsWith('.mp3')) {
      setUploadError('Puoi caricare solo file in formato .mp3');
      setUploadSuccess(null);
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setUploadError('Il file è troppo grande. Il limite massimo è di 25 MB.');
      setUploadSuccess(null);
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      if (!base64) {
        setUploadError('Errore durante la lettura del file.');
        setIsUploading(false);
        return;
      }

      try {
        const res = await fetch('/api/music/upload', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-admin-token': adminToken || ''
          },
          body: JSON.stringify({ name: file.name, base64 })
        });
        const data = await res.json();

        if (res.ok && data.success) {
          setUploadSuccess(`"${data.track.name}" caricato con successo!`);
          fetchTracks();
        } else {
          setUploadError(data.message || 'Errore nel caricamento del file.');
        }
      } catch (err) {
        setUploadError('Errore di connessione al server.');
      } finally {
        setIsUploading(false);
      }
    };

    reader.onerror = () => {
      setUploadError('Errore durante la lettura del file.');
      setIsUploading(false);
    };

    reader.readAsDataURL(file);
  };

  const handleDeleteTrack = async (trackId: string, trackName: string) => {
    if (!confirm(`Sei sicuro di voler eliminare la traccia d'atmosfera "${trackName}"?`)) return;

    try {
      const res = await fetch(`/api/music/${trackId}`, {
        method: 'DELETE',
        headers: { 'x-admin-token': adminToken || '' }
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setUploadSuccess('Traccia d\'atmosfera eliminata con successo.');
        fetchTracks();
      } else {
        alert(data.message || 'Errore durante l\'eliminazione della traccia.');
      }
    } catch (err) {
      alert('Errore di rete durante l\'eliminazione.');
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div id="admin-panel-container" className="w-full max-w-4xl mx-auto px-4 py-8 relative z-20 animate-fade-in duration-500">
      
      {/* Return Button to return to player homepage */}
      <div className="mb-6 flex justify-between items-center">
        <a 
          href="/" 
          onClick={(e) => {
            e.preventDefault();
            window.location.href = '/';
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-200 text-xs font-semibold border border-stone-800 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Ritorna alla Lobby del Gioco
        </a>
        
        {isAdminLoggedIn && (
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-950/20 hover:bg-rose-950/40 text-rose-400 text-xs font-semibold border border-rose-900/30 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" /> Esci Sessione
          </button>
        )}
      </div>

      {/* LOGIN SCREEN */}
      {!isAdminLoggedIn ? (
        <div className="w-full max-w-md mx-auto p-8 rounded-3xl glass-panel border border-[#2d2218] shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(217,119,6,0.06)_0%,transparent_60%)] pointer-events-none" />
          
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-amber-950/30 border border-amber-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Lock className="w-6 h-6 text-amber-500 animate-pulse" />
            </div>
            <h2 className="font-serif text-xl font-black text-amber-100">Accesso Amministrazione</h2>
            <p className="text-stone-400 text-xs mt-1">
              Inserisci le credenziali di amministratore per gestire il database e caricare i brani MP3.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-amber-700 mb-1.5 font-bold">
                Username Amministratore
              </label>
              <input
                type="text"
                placeholder="admin"
                value={loginUser}
                onChange={(e) => setLoginUser(e.target.value)}
                className="w-full bg-[#080504] border border-amber-900/40 rounded-xl px-4 py-3 text-sm text-stone-100 placeholder-stone-600 outline-none focus:border-amber-500/50 transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-amber-700 mb-1.5 font-bold">
                Password Amministratore
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                className="w-full bg-[#080504] border border-amber-900/40 rounded-xl px-4 py-3 text-sm text-stone-100 placeholder-stone-600 outline-none focus:border-amber-500/50 transition-all"
              />
            </div>

            {loginError && (
              <div className="bg-rose-950/20 border border-rose-800/30 rounded-xl p-3 text-rose-400 text-xs text-center font-medium">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-amber-700 to-amber-900 hover:from-amber-600 hover:to-amber-800 text-amber-100 rounded-xl font-bold text-sm border border-amber-500/10 shadow-lg cursor-pointer transition transform active:scale-95 outline-none"
            >
              Accedi al Pannello
            </button>
          </form>
        </div>
      ) : (
        /* ADMIN DASHBOARD PANELS */
        <div className="space-y-8">
          
          {/* Header Banner */}
          <div className="glass-panel border border-[#2d2218] p-6 rounded-3xl relative overflow-hidden shadow-xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_right,rgba(217,119,6,0.04)_0%,transparent_60%)] pointer-events-none" />
            <h1 className="font-serif text-2xl font-black text-amber-100">Pannello dell'Amministratore</h1>
            <p className="text-xs text-stone-400 mt-1">
              Benvenuto, <strong className="text-amber-500 font-bold">{adminUsername}</strong>. Da qui puoi connettere il database PostgreSQL di Render ed effettuare l'upload di file MP3 di atmosfera.
            </p>
          </div>

          {/* TWO COLUMNS LAYOUT */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Column 1: DB Configuration & Uploads */}
            <div className="lg:col-span-7 space-y-8">
              
              {/* PostgreSQL Config Card */}
              <div className="glass-panel border border-[#2d2218] p-6 rounded-3xl shadow-xl">
                <div className="flex items-center gap-2 border-b border-amber-950/40 pb-3 mb-4">
                  <Database className="w-5 h-5 text-amber-500" />
                  <h3 className="font-serif text-base font-bold text-amber-200">Configurazione Database PostgreSQL</h3>
                </div>

                {dbStatus && (
                  <div className="mb-4 p-3.5 rounded-xl border bg-black/45 flex items-start gap-2.5">
                    {dbStatus.postgresConfigured ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs text-green-400 font-semibold">PostgreSQL Connesso!</p>
                          <p className="text-[10px] text-stone-400 font-mono mt-0.5 truncate max-w-sm">
                            {dbStatus.postgresUrl}
                          </p>
                          {dbStatus.isEnvVar && (
                            <span className="inline-block mt-1 text-[8px] font-mono bg-amber-950/40 border border-amber-500/20 px-2 py-0.5 rounded text-amber-500 uppercase font-semibold">
                              Configurato tramite variabile d'ambiente
                            </span>
                          )}
                        </div>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs text-amber-400 font-semibold">Database Locale (JSON) in Uso</p>
                          <p className="text-[10px] text-stone-400 mt-0.5 leading-relaxed">
                            Nessun database Postgres esterno configurato. Le modifiche verranno salvate localmente nel file JSON del server.
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                )}

                <form onSubmit={handleSaveDbConfig} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-amber-800 mb-1.5 font-bold flex items-center gap-1.5">
                      Stringa di Connessione PostgreSQL (DATABASE_URL)
                    </label>
                    <textarea
                      placeholder="postgresql://username:password@hostname:5432/database?sslmode=require"
                      value={dbConnectionString}
                      onChange={(e) => setDbConnectionString(e.target.value)}
                      className="w-full h-20 bg-[#080504] border border-amber-900/40 rounded-xl px-4 py-3 text-xs text-stone-100 placeholder-stone-700 outline-none focus:border-amber-500/50 transition-all font-mono"
                    />
                  </div>

                  {/* Render Link Guide */}
                  <div className="p-3 bg-amber-950/10 border border-amber-600/10 rounded-xl flex items-start gap-2 text-[11px] text-stone-400">
                    <HelpCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-amber-200">Guida Render PostgreSQL</p>
                      <p className="mt-1 leading-relaxed">
                        Su Render devi copiare la <strong className="text-amber-400">External Database URL (External Connection String)</strong>. 
                        Il link "interno" (Internal Database URL) funziona solamente tra servizi che girano dentro la stessa infrastruttura privata di Render, mentre questa app per connettersi da fuori ha bisogno della stringa esterna.
                      </p>
                    </div>
                  </div>

                  {dbConfigError && (
                    <div className="bg-rose-950/20 border border-rose-800/30 rounded-xl p-3 text-rose-400 text-xs text-center font-medium">
                      {dbConfigError}
                    </div>
                  )}

                  {dbConfigSuccess && (
                    <div className="bg-green-950/20 border border-green-800/30 rounded-xl p-3 text-green-400 text-xs text-center font-medium">
                      {dbConfigSuccess}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={testingConnection}
                      className="px-5 py-2.5 bg-[#251711] hover:bg-[#3d271c] text-amber-200 text-xs font-bold rounded-xl border border-amber-800/30 transition-all flex items-center justify-center gap-2 shrink-0 disabled:opacity-50 cursor-pointer"
                    >
                      {testingConnection ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
                      Salva e Connetti
                    </button>
                    
                    {dbStatus?.postgresConfigured && (
                      <button
                        type="button"
                        onClick={async () => {
                          setDbConnectionString('');
                          setDbConfigError(null);
                          setDbConfigSuccess(null);
                          setTestingConnection(true);
                          try {
                            const res = await fetch('/api/admin/config/database', {
                              method: 'POST',
                              headers: { 
                                'Content-Type': 'application/json',
                                'x-admin-token': adminToken || ''
                              },
                              body: JSON.stringify({ connectionString: '' })
                            });
                            const data = await res.json();
                            if (res.ok && data.success) {
                              setDbConfigSuccess(data.message);
                              if (adminToken) fetchDbStatus(adminToken);
                              fetchTracks();
                            }
                          } catch (e) {
                            setDbConfigError('Impossibile scollegare il database.');
                          } finally {
                            setTestingConnection(false);
                          }
                        }}
                        className="px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-stone-300 text-xs font-bold rounded-xl border border-stone-800 transition-all cursor-pointer"
                      >
                        Scollega DB
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* SMTP Configuration Card */}
              <div className="glass-panel border border-[#2d2218] p-6 rounded-3xl shadow-xl">
                <div className="flex items-center gap-2 border-b border-amber-950/40 pb-3 mb-4">
                  <Mail className="w-5 h-5 text-amber-500" />
                  <h3 className="font-serif text-base font-bold text-amber-200">Configurazione Servizio Email SMTP</h3>
                </div>

                <p className="text-stone-400 text-xs mb-4 leading-relaxed">
                  Configura i parametri del tuo server SMTP per l'invio reale delle email di verifica. Se lasciati vuoti, il sistema utilizzerà i valori di fallback locali o le variabili d'ambiente.
                </p>

                {smtpIsEnvVar && (
                  <div className="mb-4 p-3 rounded-xl border border-amber-500/20 bg-amber-950/10 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                    <p className="text-[10px] text-amber-400 font-mono leading-relaxed">
                      SMTP configurato e sovrascritto tramite variabili d'ambiente del server (.env). Le modifiche effettuate qui prenderanno precedenza se non impostate in locale.
                    </p>
                  </div>
                )}

                <form onSubmit={handleSaveSmtpConfig} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-amber-800 mb-1.5 font-bold">
                        Host SMTP
                      </label>
                      <input
                        type="text"
                        placeholder="E.g. smtp.gmail.com"
                        value={smtpHost}
                        onChange={(e) => setSmtpHost(e.target.value)}
                        className="w-full bg-[#080504] border border-amber-900/40 rounded-xl px-4 py-2.5 text-xs text-stone-100 placeholder-stone-700 outline-none focus:border-amber-500/50 transition-all font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-amber-800 mb-1.5 font-bold">
                        Porta SMTP
                      </label>
                      <input
                        type="text"
                        placeholder="E.g. 465 o 587"
                        value={smtpPort}
                        onChange={(e) => setSmtpPort(e.target.value)}
                        className="w-full bg-[#080504] border border-amber-900/40 rounded-xl px-4 py-2.5 text-xs text-stone-100 placeholder-stone-700 outline-none focus:border-amber-500/50 transition-all font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-amber-800 mb-1.5 font-bold">
                        Username / Email SMTP
                      </label>
                      <input
                        type="text"
                        placeholder="E.g. utente@gmail.com"
                        value={smtpUser}
                        onChange={(e) => setSmtpUser(e.target.value)}
                        className="w-full bg-[#080504] border border-amber-900/40 rounded-xl px-4 py-2.5 text-xs text-stone-100 placeholder-stone-700 outline-none focus:border-amber-500/50 transition-all font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-amber-800 mb-1.5 font-bold">
                        Password SMTP / App Password
                      </label>
                      <input
                        type="password"
                        placeholder="••••••••••••"
                        value={smtpPass}
                        onChange={(e) => setSmtpPass(e.target.value)}
                        className="w-full bg-[#080504] border border-amber-900/40 rounded-xl px-4 py-2.5 text-xs text-stone-100 placeholder-stone-700 outline-none focus:border-amber-500/50 transition-all font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-amber-800 mb-1.5 font-bold">
                      Mittente Personalizzato (SMTP_FROM)
                    </label>
                    <input
                      type="text"
                      placeholder='E.g. "Club Scacchi" <no-reply@circoloscacchi.it>'
                      value={smtpFrom}
                      onChange={(e) => setSmtpFrom(e.target.value)}
                      className="w-full bg-[#080504] border border-amber-900/40 rounded-xl px-4 py-2.5 text-xs text-stone-100 placeholder-stone-700 outline-none focus:border-amber-500/50 transition-all font-mono"
                    />
                  </div>

                  {smtpConfigError && (
                    <div className="bg-rose-950/20 border border-rose-800/30 rounded-xl p-3 text-rose-400 text-xs text-center font-medium font-mono">
                      {smtpConfigError}
                    </div>
                  )}

                  {smtpConfigSuccess && (
                    <div className="bg-green-950/20 border border-green-800/30 rounded-xl p-3 text-green-400 text-xs text-center font-medium">
                      {smtpConfigSuccess}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={savingSmtp}
                    className="px-5 py-2.5 bg-[#251711] hover:bg-[#3d271c] text-amber-200 text-xs font-bold rounded-xl border border-amber-800/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {savingSmtp ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                    Salva Configurazione SMTP
                  </button>
                </form>
              </div>

              {/* Upload MP3 Section */}
              <div className="glass-panel border border-[#2d2218] p-6 rounded-3xl shadow-xl">
                <div className="flex items-center gap-2 border-b border-amber-950/40 pb-3 mb-4 justify-between">
                  <div className="flex items-center gap-2">
                    <Music className="w-5 h-5 text-amber-500" />
                    <h3 className="font-serif text-base font-bold text-amber-200">Carica Brani MP3</h3>
                  </div>
                  <span className="text-xs font-mono bg-stone-900 px-2.5 py-1 rounded-full border border-stone-800 text-amber-400">
                    {tracks.length}/5 tracce
                  </span>
                </div>

                <p className="text-stone-400 text-xs mb-4 leading-relaxed">
                  Carica un file audio in formato <strong className="text-amber-400">.mp3</strong> per la musica di sottofondo d'atmosfera. Puoi caricare file di durata variabile. Limite massimo: 25 MB.
                </p>

                {/* Drag & Drop Canvas */}
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={handleButtonClick}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer select-none flex flex-col items-center justify-center gap-2.5 ${
                    dragActive
                      ? 'border-amber-500 bg-amber-950/10 shadow-[0_0_15px_rgba(217,119,6,0.1)]'
                      : 'border-amber-900/30 hover:border-amber-600/30 bg-black/10 hover:bg-black/20'
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="audio/mp3,audio/mpeg"
                    className="hidden"
                  />
                  <div className="w-12 h-12 rounded-xl bg-amber-950/20 border border-amber-600/15 flex items-center justify-center text-amber-400">
                    {isUploading ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
                  </div>
                  <div>
                    <p className="text-xs text-amber-100 font-semibold">
                      {isUploading ? 'Lettura ed elaborazione file in corso...' : 'Trascina qui il file .mp3 o clicca per sfogliare'}
                    </p>
                    <p className="text-[10px] text-stone-500 mt-1">Formati supportati: MPEG-3 (.mp3)</p>
                  </div>
                </div>

                {uploadError && (
                  <div className="bg-rose-950/20 border border-rose-800/30 rounded-xl p-3 text-rose-400 text-xs text-center font-medium mt-4">
                    {uploadError}
                  </div>
                )}

                {uploadSuccess && (
                  <div className="bg-green-950/20 border border-green-800/30 rounded-xl p-3 text-green-400 text-xs text-center font-medium mt-4 flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                    <span>{uploadSuccess}</span>
                  </div>
                )}
              </div>

            </div>

            {/* Column 2: Track list */}
            <div className="lg:col-span-5">
              <div className="glass-panel border border-[#2d2218] p-6 rounded-3xl shadow-xl">
                <div className="flex items-center justify-between border-b border-amber-950/40 pb-3 mb-4">
                  <h3 className="font-serif text-base font-bold text-amber-200">Tracce Atmosfera Caricate</h3>
                  <button 
                    onClick={fetchTracks}
                    title="Aggiorna lista"
                    className="p-1 text-stone-400 hover:text-amber-400 transition-colors"
                  >
                    <RefreshCw className={`w-4 h-4 ${loadingTracks ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                {loadingTracks ? (
                  <div className="py-12 text-center text-xs text-stone-500 font-mono animate-pulse">
                    Caricamento brani...
                  </div>
                ) : tracks.length === 0 ? (
                  <div className="py-12 text-center rounded-2xl border border-amber-950/10 bg-black/10">
                    <Music className="w-8 h-8 text-stone-700 mx-auto mb-2.5" />
                    <p className="text-xs text-stone-500">Nessuna traccia d'atmosfera caricata.</p>
                    <p className="text-[10px] text-stone-600 mt-1">Carica un file MP3 per cominciare.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tracks.map((track) => (
                      <div 
                        key={track.id} 
                        className="flex items-center justify-between p-3 rounded-xl border border-amber-950/20 bg-black/25 hover:bg-black/45 hover:border-amber-900/20 transition-all"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                          <div className="w-8 h-8 rounded bg-amber-950/20 border border-amber-600/10 flex items-center justify-center text-amber-400 font-serif font-semibold shrink-0">
                            ♬
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs text-amber-100 font-semibold truncate" title={track.name}>
                              {track.name}
                            </p>
                            <p className="text-[9px] text-stone-500 font-mono truncate" title={track.url}>
                              {track.url.startsWith('/uploads/') ? 'File Caricato' : 'Link Remoto'}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeleteTrack(track.id, track.name)}
                          className="p-2 bg-rose-950/10 hover:bg-rose-900/30 text-rose-400 rounded-lg border border-rose-900/20 transition-all cursor-pointer"
                          title="Elimina traccia d'atmosfera"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* USER MANAGEMENT GESTIONE UTENTI PANEL */}
          <div className="glass-panel border border-[#2d2218] p-6 rounded-3xl shadow-xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-amber-950/40 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-950/20 border border-amber-600/15 flex items-center justify-center text-amber-400">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-base font-bold text-amber-200">Gestione Giocatori e Utenti</h3>
                  <p className="text-[10px] text-stone-400">Vedi, crea, modifica, elimina, e resetta le password dei giocatori.</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setEditingUserId(null);
                    setUserForm({
                      username: '',
                      email: '',
                      password: '',
                      rating: 1500,
                      wins: 0,
                      losses: 0
                    });
                    setUserFormError(null);
                    setUserFormSuccess(null);
                    setShowUserModal(true);
                  }}
                  className="px-3.5 py-1.5 bg-[#251711] hover:bg-[#3d271c] text-amber-200 text-xs font-bold rounded-xl border border-amber-800/30 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" /> Nuovo Giocatore
                </button>
                <button
                  onClick={handleDownloadCSV}
                  className="px-3.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-stone-300 text-xs font-bold rounded-xl border border-stone-800 transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Esporta lista giocatori in CSV"
                >
                  <Download className="w-3.5 h-3.5" /> Esporta CSV
                </button>
                <button
                  onClick={fetchUsers}
                  title="Aggiorna lista giocatori"
                  className="p-1.5 text-stone-400 hover:text-amber-400 transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingUsers ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {loadingUsers ? (
              <div className="py-12 text-center text-xs text-stone-500 font-mono animate-pulse">
                Caricamento giocatori in corso...
              </div>
            ) : users.length === 0 ? (
              <div className="py-12 text-center rounded-2xl border border-amber-950/10 bg-black/10">
                <Users className="w-8 h-8 text-stone-700 mx-auto mb-2.5" />
                <p className="text-xs text-stone-500">Nessun utente registrato nel sistema.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-amber-950/20 bg-black/20">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-stone-950/60 border-b border-amber-950/30 text-[10px] font-mono uppercase tracking-wider text-amber-800 font-bold select-none">
                      <th className="px-4 py-3 text-center w-12">
                        <input
                          type="checkbox"
                          checked={users.length > 0 && selectedUserIds.length === users.length}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUserIds(users.map(u => u.id));
                            } else {
                              setSelectedUserIds([]);
                            }
                          }}
                          className="rounded border-amber-950/40 bg-stone-900 text-amber-500 focus:ring-amber-500 cursor-pointer"
                        />
                      </th>
                      <th className="px-4 py-3">ID / Creato il</th>
                      <th className="px-4 py-3">Username</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Password</th>
                      <th className="px-4 py-3 text-center">Punteggio (Elo)</th>
                      <th className="px-4 py-3 text-center">Vittorie / Sconfitte</th>
                      <th className="px-4 py-3 text-right">Azioni</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-950/10 text-stone-300">
                    {users.map((user) => (
                      <tr key={user.id} className={selectedUserIds.includes(user.id) ? "bg-amber-950/10 hover:bg-amber-950/15 transition-colors" : "hover:bg-amber-950/5 transition-colors"}>
                        <td className="px-4 py-3.5 text-center w-12">
                          <input
                            type="checkbox"
                            checked={selectedUserIds.includes(user.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedUserIds(prev => [...prev, user.id]);
                              } else {
                                setSelectedUserIds(prev => prev.filter(id => id !== user.id));
                              }
                            }}
                            className="rounded border-amber-950/40 bg-stone-900 text-amber-500 focus:ring-amber-500 cursor-pointer"
                          />
                        </td>
                        <td className="px-4 py-3.5 font-mono text-[10px] text-stone-500">
                          <div>{user.id}</div>
                          <div className="text-[9px] text-stone-600 mt-0.5">
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/D'}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 font-medium text-amber-100 font-serif">
                          {user.username}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-stone-400">
                          {user.email}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-[11px] text-stone-400">
                          <span className="bg-stone-900/40 px-2 py-0.5 rounded border border-stone-800/20" title="Password salvata in chiaro">
                            {user.password || '••••••••'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center font-bold text-amber-400 font-mono">
                          🏆 {user.rating} Elo
                        </td>
                        <td className="px-4 py-3.5 text-center font-mono text-[11px]">
                          <span className="text-emerald-500 font-bold">{user.wins}W</span>
                          <span className="mx-1 text-stone-600">/</span>
                          <span className="text-rose-500 font-bold">{user.losses}L</span>
                        </td>
                        <td className="px-4 py-3.5 text-right space-x-1 shrink-0 whitespace-nowrap">
                          <button
                            onClick={() => handleResetPasswordClick(user)}
                            className="p-1.5 bg-blue-950/15 hover:bg-blue-900/30 text-blue-400 hover:text-blue-300 rounded border border-blue-900/20 transition-all cursor-pointer"
                            title="Resetta password giocatore"
                          >
                            <Key className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleEditUserClick(user)}
                            className="p-1.5 bg-amber-950/15 hover:bg-amber-900/30 text-amber-400 hover:text-amber-300 rounded border border-amber-900/20 transition-all cursor-pointer"
                            title="Modifica account giocatore"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id, user.username)}
                            className="p-1.5 bg-rose-950/15 hover:bg-rose-900/30 text-rose-400 hover:text-rose-300 rounded border border-rose-900/20 transition-all cursor-pointer"
                            title="Elimina giocatore"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* MASS EMAIL / COMMUNICATION COMPOSER */}
            {selectedUserIds.length > 0 && (
              <div className="bg-[#1a0e05]/60 border border-amber-900/40 rounded-2xl p-5 space-y-4 transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-950/30 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-serif text-sm font-bold text-amber-200">Invia Comunicazione Email</h4>
                      <p className="text-[10px] text-stone-400">
                        Stai inviando una comunicazione a <strong className="text-amber-400 font-mono">{selectedUserIds.length}</strong> {selectedUserIds.length === 1 ? 'destinatario' : 'destinatari'}.
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setSelectedUserIds([]);
                      setCommunicationError(null);
                      setCommunicationSuccess(null);
                    }}
                    className="text-[10px] text-amber-600 hover:text-amber-400 font-mono transition-colors text-left"
                  >
                    Annulla / Deseleziona Tutti
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] uppercase font-mono tracking-wider text-amber-700 font-bold">Mittente configurato</label>
                    <input
                      type="text"
                      value="webmaster@granmasterchess.it"
                      disabled
                      className="w-full text-xs bg-[#090503] border border-amber-950/40 text-stone-400 px-3.5 py-2 rounded-xl cursor-not-allowed font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] uppercase font-mono tracking-wider text-amber-700 font-bold">Oggetto dell'email</label>
                    <input
                      type="text"
                      placeholder="Esempio: Torneo Straordinario del Circolo degli Scacchi..."
                      value={communicationSubject}
                      onChange={(e) => setCommunicationSubject(e.target.value)}
                      className="w-full text-xs bg-[#090503] border border-amber-950/40 text-stone-200 px-3.5 py-2 rounded-xl focus:border-amber-600/60 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-amber-700 font-bold">Corpo del messaggio (HTML o Testo Semplice)</label>
                  <textarea
                    rows={6}
                    placeholder="Scrivi qui la tua comunicazione per i giocatori del circolo..."
                    value={communicationBody}
                    onChange={(e) => setCommunicationBody(e.target.value)}
                    className="w-full text-xs bg-[#090503] border border-amber-950/40 text-stone-200 px-3.5 py-2 rounded-xl focus:border-amber-600/60 focus:outline-none font-sans leading-relaxed"
                  />
                </div>

                {communicationError && (
                  <div className="p-3 bg-rose-950/20 border border-rose-500/10 rounded-xl text-rose-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{communicationError}</span>
                  </div>
                )}

                {communicationSuccess && (
                  <div className="p-3 bg-emerald-950/20 border border-emerald-500/10 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{communicationSuccess}</span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    disabled={isSendingCommunication}
                    onClick={handleSendCommunication}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-amber-800/40 text-stone-950 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-950/30"
                  >
                    {isSendingCommunication ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Inviando...
                      </>
                    ) : (
                      <>
                        <Mail className="w-3.5 h-3.5" /> Invia a {selectedUserIds.length} {selectedUserIds.length === 1 ? 'destinatario' : 'destinatari'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* SYSTEM OPERATIONS LOGS & DEBUG WINDOW */}
          <div className="glass-panel border border-[#2d2218] p-6 rounded-3xl shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-amber-950/40 pb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-amber-500" />
                <h3 className="font-serif text-base font-bold text-amber-200">Terminal Log delle Operazioni</h3>
              </div>
              <button 
                onClick={fetchLogs}
                title="Aggiorna Log"
                className="p-1 text-stone-400 hover:text-amber-400 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loadingLogs ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <p className="text-stone-400 text-xs leading-relaxed">
              Visualizza in tempo reale le azioni degli utenti (registrazioni, login, match vinti o persi, connessioni DB, invio mail di verifica).
            </p>

            <div className="bg-[#050302] border border-amber-950/30 rounded-2xl p-4 h-48 overflow-y-auto font-mono text-[10px] text-stone-400 space-y-1.5 shadow-inner">
              {logs.length === 0 ? (
                <div className="text-stone-600 text-center py-12">Nessun log disponibile nel sistema.</div>
              ) : (
                logs.map((log, idx) => (
                  <div key={log.id || idx} className="flex gap-2.5 items-start leading-relaxed border-b border-amber-950/5 pb-1">
                    <span className="text-amber-700 select-none">[{log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : '00:00:00'}]</span>
                    <span className="text-emerald-500 font-bold shrink-0">SYSTEM:</span>
                    <span className="text-stone-300 break-all">{log.message}</span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      )}

      {/* MODAL PER REGISTRAZIONE / MODIFICA UTENTE */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50 p-4 select-none animate-fade-in">
          <div className="bg-stone-950 border-2 border-[#2d2218] p-6 max-w-md w-full rounded-2xl shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(217,119,6,0.05)_0%,transparent_60%)] pointer-events-none" />
            
            <h3 className="font-serif text-lg font-bold text-amber-200 border-b border-amber-950/40 pb-3 mb-4">
              {editingUserId ? 'Modifica Account Giocatore' : 'Crea Nuovo Giocatore'}
            </h3>

            <form onSubmit={handleSubmitUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-amber-700 mb-1 font-bold">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    value={userForm.username}
                    onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                    className="w-full bg-[#080504] border border-amber-900/40 rounded-xl px-3 py-2 text-xs text-stone-100 placeholder-stone-700 outline-none focus:border-amber-500/50"
                    placeholder="E.g. Spassky_99"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-amber-700 mb-1 font-bold">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    className="w-full bg-[#080504] border border-amber-900/40 rounded-xl px-3 py-2 text-xs text-stone-100 placeholder-stone-700 outline-none focus:border-amber-500/50"
                    placeholder="E.g. player@mail.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-amber-700 mb-1 font-bold">
                  {editingUserId ? 'Password (lascia vuota per non modificare)' : 'Password'}
                </label>
                <input
                  type="text"
                  required={!editingUserId}
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  className="w-full bg-[#080504] border border-amber-900/40 rounded-xl px-3 py-2 text-xs text-stone-100 placeholder-stone-700 outline-none focus:border-amber-500/50"
                  placeholder="Inserisci password di accesso..."
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-amber-700 mb-1 font-bold">
                    Rating Elo
                  </label>
                  <input
                    type="number"
                    value={userForm.rating}
                    onChange={(e) => setUserForm({ ...userForm, rating: Number(e.target.value) })}
                    className="w-full bg-[#080504] border border-amber-900/40 rounded-xl px-3 py-2 text-xs text-stone-100 outline-none focus:border-amber-500/50 font-mono"
                    min={500}
                    max={3000}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-amber-700 mb-1 font-bold">
                    Vittorie
                  </label>
                  <input
                    type="number"
                    value={userForm.wins}
                    onChange={(e) => setUserForm({ ...userForm, wins: Number(e.target.value) })}
                    className="w-full bg-[#080504] border border-amber-900/40 rounded-xl px-3 py-2 text-xs text-stone-100 outline-none focus:border-amber-500/50 font-mono"
                    min={0}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-amber-700 mb-1 font-bold">
                    Sconfitte
                  </label>
                  <input
                    type="number"
                    value={userForm.losses}
                    onChange={(e) => setUserForm({ ...userForm, losses: Number(e.target.value) })}
                    className="w-full bg-[#080504] border border-amber-900/40 rounded-xl px-3 py-2 text-xs text-stone-100 outline-none focus:border-amber-500/50 font-mono"
                    min={0}
                  />
                </div>
              </div>

              {userFormError && (
                <div className="bg-rose-950/20 border border-rose-800/30 rounded-xl p-3 text-rose-400 text-xs text-center font-medium">
                  {userFormError}
                </div>
              )}

              {userFormSuccess && (
                <div className="bg-green-950/20 border border-green-800/30 rounded-xl p-3 text-green-400 text-xs text-center font-medium flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>{userFormSuccess}</span>
                </div>
              )}

              <div className="flex justify-end gap-2.5 pt-4 border-t border-amber-950/30">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-stone-400 rounded-xl border border-stone-800 text-xs font-bold transition-all cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-700 hover:bg-amber-600 text-amber-100 rounded-xl border border-amber-600/20 text-xs font-bold transition-all cursor-pointer"
                >
                  Salva Giocatore
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESET PASSWORD DIALOG MODAL */}
      {resettingUser && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50 p-4 select-none animate-fade-in">
          <div className="bg-stone-950 border-2 border-[#2d2218] p-6 max-w-md w-full rounded-2xl shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.05)_0%,transparent_60%)] pointer-events-none" />
            
            <h3 className="font-serif text-lg font-bold text-blue-400 border-b border-amber-950/40 pb-3 mb-4 flex items-center gap-2">
              <Key className="w-5 h-5 text-blue-400" /> Resetta Password Giocatore
            </h3>

            <p className="text-xs text-stone-400 mb-4 leading-relaxed">
              Stai reimpostando la password per l'utente <strong className="text-amber-400 font-bold">{resettingUser.username}</strong> ({resettingUser.email}).
            </p>

            <form onSubmit={handleConfirmResetPassword} className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-blue-500 mb-1.5 font-bold">
                  Nuova Password
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    className="flex-1 bg-[#080504] border border-blue-900/40 rounded-xl px-3 py-2 text-xs text-stone-100 placeholder-stone-700 outline-none focus:border-blue-500/50 font-mono font-bold"
                    placeholder="Inserisci nuova password..."
                  />
                  <button
                    type="button"
                    onClick={() => setNewPasswordInput('scacchi_' + Math.floor(1000 + Math.random() * 9000))}
                    className="px-3 py-2 bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    title="Genera nuova password casuale"
                  >
                    Rigenera
                  </button>
                </div>
              </div>

              {resetError && (
                <div className="bg-rose-950/20 border border-rose-800/30 rounded-xl p-3 text-rose-400 text-xs text-center font-medium">
                  {resetError}
                </div>
              )}

              {resetSuccess && (
                <div className="bg-green-950/20 border border-green-800/30 rounded-xl p-3 text-green-400 text-xs text-center font-medium flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>{resetSuccess}</span>
                </div>
              )}

              <div className="flex justify-end gap-2.5 pt-4 border-t border-amber-950/30">
                <button
                  type="button"
                  onClick={() => setResettingUser(null)}
                  className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-stone-400 rounded-xl border border-stone-800 text-xs font-bold transition-all cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-700 hover:bg-blue-600 text-blue-100 rounded-xl border border-blue-600/20 text-xs font-bold transition-all cursor-pointer"
                >
                  Conferma Reset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
