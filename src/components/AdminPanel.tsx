/**
 * Versione: 2.3.0
 * Data e Ora Modifica: 09/07/2026 11:00:00 (Ora di Roma)
 * Problema Risolto: Aggiunta la sezione "Osservazioni Giocatori" nel pannello admin (lista feedback da GET /api/admin/feedback con modale di dettaglio).
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Lock, 
  Database, 
  Trash2, 
  Plus, 
  LogOut, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft, 
  RefreshCw,
  HelpCircle,
  Users,
  Edit3,
  Download,
  Terminal,
  UserPlus,
  Mail,
  Key,
  MessageSquare,
  ImagePlus,
  X
} from 'lucide-react';
import { API_BASE_URL } from '../utils/apiConfig';

// Module-scope fetch wrapper to automatically prepend API_BASE_URL for API requests
const fetch = (input: RequestInfo | URL, init?: RequestInit) => {
  let url = typeof input === 'string' ? input : input.toString();
  if ((url.startsWith('/api/') || url.startsWith('/uploads/')) && API_BASE_URL) {
    url = `${API_BASE_URL.replace(/\/$/, '')}${url}`;
  }
  return window.fetch(url, init);
};

interface FeedbackItem {
  id: string;
  playerName: string;
  title: string;
  message: string;
  createdAt?: string;
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

  // Brevo (Email) Config inputs
  const [brevoApiKeyInput, setBrevoApiKeyInput] = useState<string>('');
  const [brevoApiKeyMasked, setBrevoApiKeyMasked] = useState<string | null>(null);
  const [brevoSenderEmail, setBrevoSenderEmail] = useState<string>('');
  const [brevoSenderName, setBrevoSenderName] = useState<string>('');
  const [brevoConfigured, setBrevoConfigured] = useState<boolean>(false);
  const [brevoConfigError, setBrevoConfigError] = useState<string | null>(null);
  const [brevoConfigSuccess, setBrevoConfigSuccess] = useState<string | null>(null);
  const [savingBrevo, setSavingBrevo] = useState<boolean>(false);

  // Users management states
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(false);

  // Player feedback states
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [loadingFeedback, setLoadingFeedback] = useState<boolean>(false);
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null);

  // Hero photos upload states
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState<boolean>(false);
  const [photoUploadResult, setPhotoUploadResult] = useState<{
    uploaded: { originalName: string; url: string }[];
    skipped: { originalName: string; reason: string }[];
  } | null>(null);
  const [photoUploadError, setPhotoUploadError] = useState<string | null>(null);
  
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
  const [logFilter, setLogFilter] = useState<'all' | 'smtp'>('all');

  // Load session token on mount
  useEffect(() => {
    const storedToken = sessionStorage.getItem('admin_token');
    const storedUser = sessionStorage.getItem('admin_username');
    if (storedToken && storedUser) {
      setIsAdminLoggedIn(true);
      setAdminToken(storedToken);
      setAdminUsername(storedUser);
      fetchDbStatus(storedToken);
      fetchBrevoConfig(storedToken);
    }
  }, []);

  // Periodic polling for Logs and Users when logged in
  useEffect(() => {
    if (isAdminLoggedIn && adminToken) {
      fetchUsers();
      fetchLogs();
      fetchFeedback();
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

  const fetchFeedback = async () => {
    if (!adminToken) return;
    setLoadingFeedback(true);
    try {
      const res = await fetch('/api/admin/feedback', {
        headers: { 'x-admin-token': adminToken }
      });
      const data = await res.json();
      if (data.success && data.feedback) {
        setFeedback(data.feedback);
      }
    } catch (err) {
      console.error('Errore nel caricamento dei feedback:', err);
    } finally {
      setLoadingFeedback(false);
    }
  };

  const handleUploadPhotos = async () => {
    if (!adminToken || photoFiles.length === 0) return;
    setUploadingPhotos(true);
    setPhotoUploadError(null);
    setPhotoUploadResult(null);
    try {
      const formData = new FormData();
      // Il campo "photos" viene ripetuto per ogni file.
      photoFiles.forEach((file) => formData.append('photos', file));
      // NB: non impostiamo Content-Type manualmente: il browser aggiunge il
      // boundary corretto per il multipart/form-data.
      const res = await fetch('/api/admin/photos/upload', {
        method: 'POST',
        headers: { 'x-admin-token': adminToken || '' },
        body: formData
      });
      if (!res.ok) {
        // Non scartiamo il corpo: proviamo a leggere il vero motivo dal server.
        let message = `Errore durante il caricamento (HTTP ${res.status}), riprova`;
        try {
          const errData = await res.json();
          if (errData && errData.message) message = errData.message;
        } catch {
          /* nessun corpo JSON leggibile: resta il messaggio con lo status HTTP */
        }
        setPhotoUploadError(message);
        return;
      }
      const data = await res.json();
      if (data && data.success) {
        setPhotoUploadResult({ uploaded: data.uploaded || [], skipped: data.skipped || [] });
        // Svuota la selezione per permettere un nuovo upload pulito.
        setPhotoFiles([]);
        if (photoInputRef.current) photoInputRef.current.value = '';
      } else {
        setPhotoUploadError('Errore durante il caricamento, riprova');
      }
    } catch (err) {
      setPhotoUploadError('Errore durante il caricamento, riprova');
    } finally {
      setUploadingPhotos(false);
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

  const fetchBrevoConfig = async (token: string) => {
    try {
      const res = await fetch('/api/admin/config/brevo', {
        headers: { 'x-admin-token': token }
      });
      const data = await res.json();
      if (data.success && data.config) {
        setBrevoConfigured(!!data.config.configured);
        setBrevoApiKeyMasked(data.config.apiKeyMasked || null);
        setBrevoSenderEmail(data.config.senderEmail || '');
        setBrevoSenderName(data.config.senderName || '');
      }
    } catch (err) {
      console.error('Failed to fetch Brevo config:', err);
    }
  };

  const handleSaveBrevoConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setBrevoConfigError(null);
    setBrevoConfigSuccess(null);
    setSavingBrevo(true);

    try {
      const res = await fetch('/api/admin/config/brevo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': adminToken || ''
        },
        body: JSON.stringify({
          apiKey: brevoApiKeyInput.trim() || undefined,
          senderEmail: brevoSenderEmail,
          senderName: brevoSenderName
        })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setBrevoConfigSuccess(data.message || 'Configurazione Brevo salvata con successo!');
        setBrevoApiKeyInput('');
        if (adminToken) {
          fetchBrevoConfig(adminToken);
        }
      } else {
        setBrevoConfigError(data.message || 'Errore di salvataggio.');
      }
    } catch (err: any) {
      setBrevoConfigError('Impossibile connettersi al server per salvare la configurazione Brevo.');
    } finally {
      setSavingBrevo(false);
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
        fetchBrevoConfig(data.token);
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
      } else {
        setDbConfigError(data.message || 'Errore di configurazione.');
      }
    } catch (err: any) {
      setDbConfigError('Impossibile connettersi al server per testare la connessione.');
    } finally {
      setTestingConnection(false);
    }
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
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-app-panel hover:bg-app-panel/70 text-app-text text-xs font-semibold border border-app-border transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Ritorna alla Lobby del Gioco
        </a>
        
        {isAdminLoggedIn && (
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-app-danger-bg hover:opacity-80 text-app-danger-text text-xs font-semibold border border-app-danger-text/30 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" /> Esci Sessione
          </button>
        )}
      </div>

      {/* LOGIN SCREEN */}
      {!isAdminLoggedIn ? (
        <div className="w-full max-w-md mx-auto p-8 rounded-3xl glass-panel border border-app-border shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(217,119,6,0.06)_0%,transparent_60%)] pointer-events-none" />
          
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-app-accent/30 border border-app-accent/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Lock className="w-6 h-6 text-app-accent animate-pulse" />
            </div>
            <h2 className="font-serif text-xl font-black text-app-text">Accesso Amministrazione</h2>
            <p className="text-app-text-muted text-xs mt-1">
              Inserisci le credenziali di amministratore per gestire il database e la configurazione email.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-app-text-muted mb-1.5 font-bold">
                Username Amministratore
              </label>
              <input
                type="text"
                placeholder="admin"
                value={loginUser}
                onChange={(e) => setLoginUser(e.target.value)}
                className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-3 text-sm text-app-text placeholder-app-text-muted outline-none focus:border-app-accent/50 transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-app-text-muted mb-1.5 font-bold">
                Password Amministratore
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-3 text-sm text-app-text placeholder-app-text-muted outline-none focus:border-app-accent/50 transition-all"
              />
            </div>

            {loginError && (
              <div className="bg-app-danger-bg border border-app-danger-text/30 rounded-xl p-3 text-app-danger-text text-xs text-center font-medium">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 bg-app-accent hover:bg-app-accent-hover text-app-on-accent rounded-xl font-bold text-sm border border-app-accent/10 shadow-lg cursor-pointer transition transform active:scale-95 outline-none"
            >
              Accedi al Pannello
            </button>
          </form>
        </div>
      ) : (
        /* ADMIN DASHBOARD PANELS */
        <div className="space-y-8">
          
          {/* Header Banner */}
          <div className="glass-panel border border-app-border p-6 rounded-3xl relative overflow-hidden shadow-xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_right,rgba(217,119,6,0.04)_0%,transparent_60%)] pointer-events-none" />
            <h1 className="font-serif text-2xl font-black text-app-text">Pannello dell'Amministratore</h1>
            <p className="text-xs text-app-text-muted mt-1">
              Benvenuto, <strong className="text-app-accent font-bold">{adminUsername}</strong>. Da qui puoi connettere il database PostgreSQL di Render e configurare l'invio delle email.
            </p>
          </div>

          {/* TWO COLUMNS LAYOUT */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Column 1: Configurazione Database & Email */}
            <div className="lg:col-span-7 space-y-8">
              
              {/* PostgreSQL Config Card */}
              <div className="glass-panel border border-app-border p-6 rounded-3xl shadow-xl">
                <div className="flex items-center gap-2 border-b border-app-border pb-3 mb-4">
                  <Database className="w-5 h-5 text-app-accent" />
                  <h3 className="font-serif text-base font-bold text-app-text">Configurazione Database PostgreSQL</h3>
                </div>

                {dbStatus && (
                  <div className="mb-4 p-3.5 rounded-xl border bg-app-bg/45 flex items-start gap-2.5">
                    {dbStatus.postgresConfigured ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-app-success-text mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs text-app-success-text font-semibold">PostgreSQL Connesso!</p>
                          <p className="text-[10px] text-app-text-muted font-mono mt-0.5 truncate max-w-sm">
                            {dbStatus.postgresUrl}
                          </p>
                          {dbStatus.isEnvVar && (
                            <span className="inline-block mt-1 text-[8px] font-mono bg-app-accent/40 border border-app-accent/20 px-2 py-0.5 rounded text-app-accent uppercase font-semibold">
                              Configurato tramite variabile d'ambiente
                            </span>
                          )}
                        </div>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-app-accent mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs text-app-accent font-semibold">Database Locale (JSON) in Uso</p>
                          <p className="text-[10px] text-app-text-muted mt-0.5 leading-relaxed">
                            Nessun database Postgres esterno configurato. Le modifiche verranno salvate localmente nel file JSON del server.
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                )}

                <form onSubmit={handleSaveDbConfig} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-app-text-muted mb-1.5 font-bold flex items-center gap-1.5">
                      Stringa di Connessione PostgreSQL (DATABASE_URL)
                    </label>
                    <textarea
                      placeholder="postgresql://username:password@hostname:5432/database?sslmode=require"
                      value={dbConnectionString}
                      onChange={(e) => setDbConnectionString(e.target.value)}
                      className="w-full h-20 bg-app-bg border border-app-border rounded-xl px-4 py-3 text-xs text-app-text placeholder-app-text-muted outline-none focus:border-app-accent/50 transition-all font-mono"
                    />
                  </div>

                  {/* Render Link Guide */}
                  <div className="p-3 bg-app-accent/10 border border-app-accent/10 rounded-xl flex items-start gap-2 text-[11px] text-app-text-muted">
                    <HelpCircle className="w-4 h-4 text-app-accent shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-app-text">Guida Render PostgreSQL</p>
                      <p className="mt-1 leading-relaxed">
                        Su Render devi copiare la <strong className="text-app-accent">External Database URL (External Connection String)</strong>. 
                        Il link "interno" (Internal Database URL) funziona solamente tra servizi che girano dentro la stessa infrastruttura privata di Render, mentre questa app per connettersi da fuori ha bisogno della stringa esterna.
                      </p>
                    </div>
                  </div>

                  {dbConfigError && (
                    <div className="bg-app-danger-bg border border-app-danger-text/30 rounded-xl p-3 text-app-danger-text text-xs text-center font-medium">
                      {dbConfigError}
                    </div>
                  )}

                  {dbConfigSuccess && (
                    <div className="bg-app-success-bg border border-app-success-text/30 rounded-xl p-3 text-app-success-text text-xs text-center font-medium">
                      {dbConfigSuccess}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={testingConnection}
                      className="px-5 py-2.5 bg-app-panel hover:bg-app-panel/70 text-app-text text-xs font-bold rounded-xl border border-app-border transition-all flex items-center justify-center gap-2 shrink-0 disabled:opacity-50 cursor-pointer"
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
                            }
                          } catch (e) {
                            setDbConfigError('Impossibile scollegare il database.');
                          } finally {
                            setTestingConnection(false);
                          }
                        }}
                        className="px-4 py-2.5 bg-app-panel hover:bg-app-panel/70 text-app-text-muted hover:text-app-text text-xs font-bold rounded-xl border border-app-border transition-all cursor-pointer"
                      >
                        Scollega DB
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Brevo (Email) Configuration Card */}
              <div className="glass-panel border border-app-border p-6 rounded-3xl shadow-xl">
                <div className="flex items-center justify-between gap-2 border-b border-app-border pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Mail className="w-5 h-5 text-app-accent" />
                    <h3 className="font-serif text-base font-bold text-app-text">Configurazione Brevo (Email)</h3>
                  </div>
                  {brevoConfigured ? (
                    <span className="inline-flex items-center gap-1 text-[9px] font-mono uppercase tracking-wider bg-app-success-bg border border-app-success-text/30 px-2 py-1 rounded-full text-app-success-text font-bold">
                      <CheckCircle2 className="w-3 h-3" /> Configurato
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[9px] font-mono uppercase tracking-wider bg-app-panel border border-app-border px-2 py-1 rounded-full text-app-text-muted font-bold">
                      <AlertCircle className="w-3 h-3" /> Non configurato
                    </span>
                  )}
                </div>

                <p className="text-app-text-muted text-xs mb-4 leading-relaxed">
                  Configura l'invio delle email transazionali (verifica account, notifiche, comunicazioni) tramite <strong className="text-app-accent">Brevo</strong>.
                </p>

                <form onSubmit={handleSaveBrevoConfig} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-app-text-muted mb-1.5 font-bold">
                      API Key Brevo
                    </label>
                    <input
                      type="password"
                      placeholder={brevoApiKeyMasked || 'Inserisci la API Key Brevo'}
                      value={brevoApiKeyInput}
                      onChange={(e) => setBrevoApiKeyInput(e.target.value)}
                      className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-2.5 text-xs text-app-text placeholder-app-text-muted outline-none focus:border-app-accent/50 transition-all font-mono"
                    />
                    <p className="text-[10px] text-app-text-muted mt-1.5 leading-relaxed">
                      Lascia vuoto per mantenere la chiave già salvata. Usa una API Key standard di Brevo (SMTP & API → API Keys), NON quella con scope MCP.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-app-text-muted mb-1.5 font-bold">
                        Email Mittente
                      </label>
                      <input
                        type="text"
                        placeholder="E.g. no-reply@circoloscacchi.it"
                        value={brevoSenderEmail}
                        onChange={(e) => setBrevoSenderEmail(e.target.value)}
                        className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-2.5 text-xs text-app-text placeholder-app-text-muted outline-none focus:border-app-accent/50 transition-all font-mono"
                      />
                      <p className="text-[10px] text-app-text-muted mt-1.5 leading-relaxed">
                        Deve essere un mittente verificato / dominio autenticato su Brevo.
                      </p>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-app-text-muted mb-1.5 font-bold">
                        Nome Mittente
                      </label>
                      <input
                        type="text"
                        placeholder="E.g. Club Scacchi"
                        value={brevoSenderName}
                        onChange={(e) => setBrevoSenderName(e.target.value)}
                        className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-2.5 text-xs text-app-text placeholder-app-text-muted outline-none focus:border-app-accent/50 transition-all font-mono"
                      />
                    </div>
                  </div>

                  {brevoConfigError && (
                    <div className="bg-app-danger-bg border border-app-danger-text/30 rounded-xl p-3 text-app-danger-text text-xs text-center font-medium font-mono">
                      {brevoConfigError}
                    </div>
                  )}

                  {brevoConfigSuccess && (
                    <div className="bg-app-success-bg border border-app-success-text/30 rounded-xl p-3 text-app-success-text text-xs text-center font-medium">
                      {brevoConfigSuccess}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={savingBrevo}
                    className="px-5 py-2.5 bg-app-panel hover:bg-app-panel/70 text-app-text text-xs font-bold rounded-xl border border-app-border transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {savingBrevo ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                    Salva Configurazione Brevo
                  </button>
                </form>
              </div>
            </div>

          </div>

          {/* USER MANAGEMENT GESTIONE UTENTI PANEL */}
          <div className="glass-panel border border-app-border p-6 rounded-3xl shadow-xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-app-border pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-app-accent/20 border border-app-accent/15 flex items-center justify-center text-app-accent">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-base font-bold text-app-text">Gestione Giocatori e Utenti</h3>
                  <p className="text-[10px] text-app-text-muted">Vedi, crea, modifica, elimina, e resetta le password dei giocatori.</p>
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
                  className="px-3.5 py-1.5 bg-app-panel hover:bg-app-panel/70 text-app-text text-xs font-bold rounded-xl border border-app-border transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" /> Nuovo Giocatore
                </button>
                <button
                  onClick={handleDownloadCSV}
                  className="px-3.5 py-1.5 bg-app-panel hover:bg-app-panel/70 text-app-text text-xs font-bold rounded-xl border border-app-border transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Esporta lista giocatori in CSV"
                >
                  <Download className="w-3.5 h-3.5" /> Esporta CSV
                </button>
                <button
                  onClick={fetchUsers}
                  title="Aggiorna lista giocatori"
                  className="p-1.5 text-app-text-muted hover:text-app-accent transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingUsers ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {loadingUsers ? (
              <div className="py-12 text-center text-xs text-app-text-muted font-mono animate-pulse">
                Caricamento giocatori in corso...
              </div>
            ) : users.length === 0 ? (
              <div className="py-12 text-center rounded-2xl border border-app-border bg-app-bg/10">
                <Users className="w-8 h-8 text-app-text-muted mx-auto mb-2.5" />
                <p className="text-xs text-app-text-muted">Nessun utente registrato nel sistema.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-app-border bg-app-bg/20">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-app-bg/60 border-b border-app-border text-[10px] font-mono uppercase tracking-wider text-app-text-muted font-bold select-none">
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
                          className="rounded border-app-border bg-app-panel text-app-accent focus:ring-app-accent cursor-pointer"
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
                  <tbody className="divide-y divide-amber-950/10 text-app-text">
                    {users.map((user) => (
                      <tr key={user.id} className={selectedUserIds.includes(user.id) ? "bg-app-accent/10 hover:bg-app-accent/15 transition-colors" : "hover:bg-app-accent/5 transition-colors"}>
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
                            className="rounded border-app-border bg-app-panel text-app-accent focus:ring-app-accent cursor-pointer"
                          />
                        </td>
                        <td className="px-4 py-3.5 font-mono text-[10px] text-app-text-muted">
                          <div>{user.id}</div>
                          <div className="text-[9px] text-app-text-muted mt-0.5">
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/D'}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 font-medium text-app-text font-serif">
                          {user.username}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-app-text-muted">
                          {user.email}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-[11px] text-app-text-muted">
                          <span className="bg-app-panel/40 px-2 py-0.5 rounded border border-app-border/60" title="Password salvata in chiaro">
                            {user.password || '••••••••'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center font-bold text-app-accent font-mono">
                          🏆 {user.rating} Elo
                        </td>
                        <td className="px-4 py-3.5 text-center font-mono text-[11px]">
                          <span className="text-app-success-text font-bold">{user.wins}W</span>
                          <span className="mx-1 text-app-text-muted">/</span>
                          <span className="text-app-danger-text font-bold">{user.losses}L</span>
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
                            className="p-1.5 bg-app-accent/15 hover:bg-app-accent/10 text-app-accent hover:text-app-accent rounded border border-app-border transition-all cursor-pointer"
                            title="Modifica account giocatore"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id, user.username)}
                            className="p-1.5 bg-app-danger-bg hover:opacity-80 text-app-danger-text hover:text-app-danger-text rounded border border-app-danger-text/30 transition-all cursor-pointer"
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
              <div className="bg-app-panel/60 border border-app-border rounded-2xl p-5 space-y-4 transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-app-border pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-app-accent/10 flex items-center justify-center text-app-accent">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-serif text-sm font-bold text-app-text">Invia Comunicazione Email</h4>
                      <p className="text-[10px] text-app-text-muted">
                        Stai inviando una comunicazione a <strong className="text-app-accent font-mono">{selectedUserIds.length}</strong> {selectedUserIds.length === 1 ? 'destinatario' : 'destinatari'}.
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setSelectedUserIds([]);
                      setCommunicationError(null);
                      setCommunicationSuccess(null);
                    }}
                    className="text-[10px] text-app-accent hover:text-app-accent font-mono transition-colors text-left"
                  >
                    Annulla / Deseleziona Tutti
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] uppercase font-mono tracking-wider text-app-text-muted font-bold">Mittente configurato</label>
                    <input
                      type="text"
                      value="webmaster@granmasterchess.it"
                      disabled
                      className="w-full text-xs bg-app-bg border border-app-border text-app-text-muted px-3.5 py-2 rounded-xl cursor-not-allowed font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] uppercase font-mono tracking-wider text-app-text-muted font-bold">Oggetto dell'email</label>
                    <input
                      type="text"
                      placeholder="Esempio: Torneo Straordinario del Circolo degli Scacchi..."
                      value={communicationSubject}
                      onChange={(e) => setCommunicationSubject(e.target.value)}
                      className="w-full text-xs bg-app-bg border border-app-border text-app-text px-3.5 py-2 rounded-xl focus:border-app-accent/60 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-app-text-muted font-bold">Corpo del messaggio (HTML o Testo Semplice)</label>
                  <textarea
                    rows={6}
                    placeholder="Scrivi qui la tua comunicazione per i giocatori del circolo..."
                    value={communicationBody}
                    onChange={(e) => setCommunicationBody(e.target.value)}
                    className="w-full text-xs bg-app-bg border border-app-border text-app-text px-3.5 py-2 rounded-xl focus:border-app-accent/60 focus:outline-none font-sans leading-relaxed"
                  />
                </div>

                {communicationError && (
                  <div className="p-3 bg-app-danger-bg border border-app-danger-text/30 rounded-xl text-app-danger-text text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{communicationError}</span>
                  </div>
                )}

                {communicationSuccess && (
                  <div className="p-3 bg-app-success-bg border border-app-success-text/30 rounded-xl text-app-success-text text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{communicationSuccess}</span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    disabled={isSendingCommunication}
                    onClick={handleSendCommunication}
                    className="px-4 py-2 bg-app-accent hover:bg-app-accent-hover disabled:bg-app-accent/15 text-app-on-accent text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-app-accent/20"
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
          <div className="glass-panel border border-app-border p-6 rounded-3xl shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-app-border pb-3 gap-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-app-accent" />
                <h3 className="font-serif text-base font-bold text-app-text">Terminal Log delle Operazioni</h3>
              </div>
              
              <div className="flex items-center gap-2">
                {/* FILTER TABS */}
                <div className="flex items-center bg-app-bg p-0.5 rounded-lg border border-app-border select-none">
                  <button
                    type="button"
                    onClick={() => setLogFilter('all')}
                    className={`text-[9px] uppercase font-mono tracking-wider font-bold py-1 px-2.5 rounded-md transition-all ${logFilter === 'all' ? 'bg-app-accent text-app-on-accent' : 'text-app-text-muted hover:text-app-text'}`}
                  >
                    Tutti i Log
                  </button>
                  <button
                    type="button"
                    onClick={() => setLogFilter('smtp')}
                    className={`text-[9px] uppercase font-mono tracking-wider font-bold py-1 px-2.5 rounded-md transition-all flex items-center gap-1 ${logFilter === 'smtp' ? 'bg-app-accent text-app-on-accent' : 'text-app-text-muted hover:text-app-text'}`}
                  >
                    <Mail className="w-2.5 h-2.5" /> Audit SMTP
                  </button>
                </div>

                <button 
                  onClick={fetchLogs}
                  title="Aggiorna Log"
                  className="p-1.5 bg-app-bg border border-app-border rounded-lg text-app-text-muted hover:text-app-accent transition-colors flex items-center justify-center"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingLogs ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            <p className="text-app-text-muted text-xs leading-relaxed">
              {logFilter === 'all' 
                ? "Visualizza in tempo reale le azioni degli utenti (registrazioni, login, match vinti o persi, connessioni DB, invio mail)." 
                : "Registro di audit per il tracciamento della trasmissione email SMTP (connessione, autenticazione, invio busta, errori, sandbox)."
              }
            </p>

            <div className="bg-app-bg border border-app-border rounded-2xl p-4 h-64 overflow-y-auto font-mono text-[10px] text-app-text-muted space-y-1.5 shadow-inner">
              {(() => {
                const filteredLogs = logFilter === 'all'
                  ? logs
                  : logs.filter(log => 
                      log.message.includes('[SMTP_') || 
                      log.message.includes('[EMAIL') || 
                      log.message.includes('[CONFIG SMTP]') || 
                      log.message.includes('[MOCK EMAIL]') || 
                      log.message.includes('[ERRORE SMTP]')
                    );

                if (filteredLogs.length === 0) {
                  return (
                    <div className="text-app-text-muted text-center py-20">
                      {logFilter === 'all' ? 'Nessun log disponibile nel sistema.' : 'Nessun evento di audit SMTP registrato.'}
                    </div>
                  );
                }

                return filteredLogs.map((log, idx) => {
                  const timestampStr = log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : '00:00:00';
                  let label = 'SYSTEM:';
                  let labelColor = 'text-app-success-text';
                  let textColor = 'text-app-text';
                  let message = log.message;

                  if (log.message.includes('[SMTP_CONNECT]')) {
                    label = 'SMTP [CONN]:';
                    labelColor = 'text-sky-500';
                    textColor = 'text-sky-300';
                    message = log.message.replace('[SMTP_CONNECT] ', '');
                  } else if (log.message.includes('[SMTP_AUTH]')) {
                    label = 'SMTP [AUTH]:';
                    labelColor = 'text-app-accent';
                    textColor = 'text-app-text';
                    message = log.message.replace('[SMTP_AUTH] ', '');
                  } else if (log.message.includes('[SMTP_DISPATCH]')) {
                    label = 'SMTP [SEND]:';
                    labelColor = 'text-violet-500';
                    textColor = 'text-violet-300';
                    message = log.message.replace('[SMTP_DISPATCH] ', '');
                  } else if (log.message.includes('[SMTP_SUCCESS]')) {
                    label = 'SMTP [OK]:';
                    labelColor = 'text-app-success-text';
                    textColor = 'text-app-success-text font-semibold';
                    message = log.message.replace('[SMTP_SUCCESS] ', '');
                  } else if (log.message.includes('[SMTP_ERROR]')) {
                    label = 'SMTP [ERR]:';
                    labelColor = 'text-app-danger-text font-bold';
                    textColor = 'text-app-danger-text font-semibold';
                    message = log.message.replace('[SMTP_ERROR] ', '');
                  } else if (log.message.includes('[SMTP_BYPASS]')) {
                    label = 'SMTP [BYPS]:';
                    labelColor = 'text-app-text-muted';
                    textColor = 'text-app-text-muted';
                    message = log.message.replace('[SMTP_BYPASS] ', '');
                  } else if (log.message.includes('[SMTP_CONFIG]') || log.message.includes('[CONFIG SMTP]')) {
                    label = 'SMTP [CONF]:';
                    labelColor = 'text-teal-500';
                    textColor = 'text-teal-300';
                    message = log.message.replace('[SMTP_CONFIG] ', '').replace('[CONFIG SMTP] ', '');
                  } else if (log.message.includes('[EMAIL INVIATA]')) {
                    label = 'SMTP [SEND]:';
                    labelColor = 'text-app-success-text';
                    textColor = 'text-app-text';
                  } else if (log.message.includes('[ERRORE SMTP]')) {
                    label = 'SMTP [ERR]:';
                    labelColor = 'text-app-danger-text';
                    textColor = 'text-app-text';
                  } else if (log.message.includes('[MOCK EMAIL]')) {
                    label = 'SMTP [MOCK]:';
                    labelColor = 'text-app-accent';
                    textColor = 'text-app-text';
                  }

                  return (
                    <div key={log.id || idx} className="flex gap-2.5 items-start leading-relaxed border-b border-app-border pb-1 select-text">
                      <span className="text-app-text-muted select-none shrink-0">[{timestampStr}]</span>
                      <span className={`${labelColor} font-bold shrink-0 font-mono`}>{label}</span>
                      <span className={`${textColor} break-all`}>{message}</span>
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          {/* PLAYER FEEDBACK / OSSERVAZIONI GIOCATORI PANEL */}
          <div className="glass-panel border border-app-border p-6 rounded-3xl shadow-xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-app-border pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-app-accent/20 border border-app-accent/15 flex items-center justify-center text-app-accent">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-base font-bold text-app-text">Osservazioni Giocatori</h3>
                  <p className="text-[10px] text-app-text-muted">Feedback e suggerimenti inviati dai giocatori.</p>
                </div>
              </div>
              <button
                onClick={fetchFeedback}
                className="px-3.5 py-1.5 bg-app-panel hover:bg-app-panel/70 text-app-text text-xs font-bold rounded-xl border border-app-border transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${loadingFeedback ? 'animate-spin' : ''}`} />
                Aggiorna
              </button>
            </div>

            {loadingFeedback ? (
              <div className="text-center py-8 text-app-text-muted text-xs">Caricamento osservazioni...</div>
            ) : feedback.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="w-8 h-8 text-app-text-muted mx-auto mb-2.5" />
                <p className="text-xs text-app-text-muted">Nessun feedback ricevuto.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {feedback.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedFeedback(item)}
                    className="w-full text-left bg-app-bg border border-app-border rounded-xl p-3.5 hover:border-app-accent/50 hover:bg-app-accent/5 transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <span className="font-bold text-sm text-app-text truncate">{item.title}</span>
                      <span className="text-[10px] font-mono text-app-accent shrink-0">{item.playerName}</span>
                    </div>
                    <p className="text-xs text-app-text-muted leading-relaxed">
                      {item.message.length > 80 ? item.message.slice(0, 80) + '…' : item.message}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* HERO PHOTOS UPLOAD PANEL */}
          <div className="glass-panel border border-app-border p-6 rounded-3xl shadow-xl space-y-4">
            <div className="flex items-center gap-2.5 border-b border-app-border pb-4">
              <div className="w-9 h-9 rounded-xl bg-app-accent/20 border border-app-accent/15 flex items-center justify-center text-app-accent">
                <ImagePlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif text-base font-bold text-app-text">Foto Hero Landing</h3>
                <p className="text-[10px] text-app-text-muted">Carica le foto mostrate nello slideshow della landing page (JPG, PNG o WEBP).</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              <input
                ref={photoInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => {
                  setPhotoFiles(e.target.files ? Array.from(e.target.files) : []);
                  setPhotoUploadResult(null);
                  setPhotoUploadError(null);
                }}
                className="flex-1 text-xs text-app-text-muted file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border file:border-app-border file:bg-app-panel file:text-app-text file:text-xs file:font-bold file:cursor-pointer hover:file:bg-app-panel/70 bg-app-bg border border-app-border rounded-xl p-2 cursor-pointer"
              />
              <button
                onClick={handleUploadPhotos}
                disabled={uploadingPhotos || photoFiles.length === 0}
                className="px-5 py-2.5 bg-app-accent hover:bg-app-accent-hover text-app-on-accent text-xs font-bold uppercase tracking-wider rounded-xl border border-app-accent shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              >
                {uploadingPhotos ? (
                  <><RefreshCw className="w-4 h-4 animate-spin" /> Caricamento...</>
                ) : (
                  <><ImagePlus className="w-4 h-4" /> Carica foto</>
                )}
              </button>
            </div>

            {photoFiles.length > 0 && !uploadingPhotos && (
              <p className="text-[10px] font-mono text-app-text-muted">
                {photoFiles.length} file selezionat{photoFiles.length === 1 ? 'o' : 'i'} (max 10 per volta).
              </p>
            )}

            {photoUploadError && (
              <div className="bg-app-danger-bg border border-app-danger-text/30 rounded-xl p-3 text-app-danger-text text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{photoUploadError}</span>
              </div>
            )}

            {photoUploadResult && (
              <div className="space-y-2">
                <div className="bg-app-success-bg border border-app-success-text/30 rounded-xl p-3 text-app-success-text text-xs font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>
                    {photoUploadResult.uploaded.length} fot{photoUploadResult.uploaded.length === 1 ? 'o caricata' : 'o caricate'} con successo.
                  </span>
                </div>

                {photoUploadResult.skipped.length > 0 && (
                  <div className="bg-app-bg border border-app-border rounded-xl p-3 space-y-1.5">
                    <p className="text-[10px] font-mono uppercase tracking-wider text-app-text-muted font-bold">
                      {photoUploadResult.skipped.length} file scartat{photoUploadResult.skipped.length === 1 ? 'o' : 'i'}:
                    </p>
                    {photoUploadResult.skipped.map((s, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-app-danger-text">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">
                          <span className="font-bold">{s.originalName}</span>: {s.reason}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      )}

      {/* MODAL PER REGISTRAZIONE / MODIFICA UTENTE */}
      {showUserModal && (
        <div className="fixed inset-0 bg-app-bg/85 backdrop-blur-sm flex items-center justify-center z-50 p-4 select-none animate-fade-in">
          <div className="bg-app-bg border-2 border-app-border p-6 max-w-md w-full rounded-2xl shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(217,119,6,0.05)_0%,transparent_60%)] pointer-events-none" />
            
            <h3 className="font-serif text-lg font-bold text-app-text border-b border-app-border pb-3 mb-4">
              {editingUserId ? 'Modifica Account Giocatore' : 'Crea Nuovo Giocatore'}
            </h3>

            <form onSubmit={handleSubmitUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-app-text-muted mb-1 font-bold">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    value={userForm.username}
                    onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                    className="w-full bg-app-bg border border-app-border rounded-xl px-3 py-2 text-xs text-app-text placeholder-app-text-muted outline-none focus:border-app-accent/50"
                    placeholder="E.g. Spassky_99"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-app-text-muted mb-1 font-bold">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    className="w-full bg-app-bg border border-app-border rounded-xl px-3 py-2 text-xs text-app-text placeholder-app-text-muted outline-none focus:border-app-accent/50"
                    placeholder="E.g. player@mail.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-app-text-muted mb-1 font-bold">
                  {editingUserId ? 'Password (lascia vuota per non modificare)' : 'Password'}
                </label>
                <input
                  type="text"
                  required={!editingUserId}
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  className="w-full bg-app-bg border border-app-border rounded-xl px-3 py-2 text-xs text-app-text placeholder-app-text-muted outline-none focus:border-app-accent/50"
                  placeholder="Inserisci password di accesso..."
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-app-text-muted mb-1 font-bold">
                    Rating Elo
                  </label>
                  <input
                    type="number"
                    value={userForm.rating}
                    onChange={(e) => setUserForm({ ...userForm, rating: Number(e.target.value) })}
                    className="w-full bg-app-bg border border-app-border rounded-xl px-3 py-2 text-xs text-app-text outline-none focus:border-app-accent/50 font-mono"
                    min={500}
                    max={3000}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-app-text-muted mb-1 font-bold">
                    Vittorie
                  </label>
                  <input
                    type="number"
                    value={userForm.wins}
                    onChange={(e) => setUserForm({ ...userForm, wins: Number(e.target.value) })}
                    className="w-full bg-app-bg border border-app-border rounded-xl px-3 py-2 text-xs text-app-text outline-none focus:border-app-accent/50 font-mono"
                    min={0}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-app-text-muted mb-1 font-bold">
                    Sconfitte
                  </label>
                  <input
                    type="number"
                    value={userForm.losses}
                    onChange={(e) => setUserForm({ ...userForm, losses: Number(e.target.value) })}
                    className="w-full bg-app-bg border border-app-border rounded-xl px-3 py-2 text-xs text-app-text outline-none focus:border-app-accent/50 font-mono"
                    min={0}
                  />
                </div>
              </div>

              {userFormError && (
                <div className="bg-app-danger-bg border border-app-danger-text/30 rounded-xl p-3 text-app-danger-text text-xs text-center font-medium">
                  {userFormError}
                </div>
              )}

              {userFormSuccess && (
                <div className="bg-app-success-bg border border-app-success-text/30 rounded-xl p-3 text-app-success-text text-xs text-center font-medium flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-app-success-text" />
                  <span>{userFormSuccess}</span>
                </div>
              )}

              <div className="flex justify-end gap-2.5 pt-4 border-t border-app-border">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2 bg-app-panel hover:bg-app-panel/70 text-app-text-muted rounded-xl border border-app-border text-xs font-bold transition-all cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-app-accent hover:bg-app-accent-hover text-app-on-accent rounded-xl border border-app-accent text-xs font-bold transition-all cursor-pointer"
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
        <div className="fixed inset-0 bg-app-bg/85 backdrop-blur-sm flex items-center justify-center z-50 p-4 select-none animate-fade-in">
          <div className="bg-app-bg border-2 border-app-border p-6 max-w-md w-full rounded-2xl shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.05)_0%,transparent_60%)] pointer-events-none" />
            
            <h3 className="font-serif text-lg font-bold text-blue-400 border-b border-app-border pb-3 mb-4 flex items-center gap-2">
              <Key className="w-5 h-5 text-blue-400" /> Resetta Password Giocatore
            </h3>

            <p className="text-xs text-app-text-muted mb-4 leading-relaxed">
              Stai reimpostando la password per l'utente <strong className="text-app-accent font-bold">{resettingUser.username}</strong> ({resettingUser.email}).
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
                    className="flex-1 bg-app-bg border border-blue-900/40 rounded-xl px-3 py-2 text-xs text-app-text placeholder-app-text-muted outline-none focus:border-blue-500/50 font-mono font-bold"
                    placeholder="Inserisci nuova password..."
                  />
                  <button
                    type="button"
                    onClick={() => setNewPasswordInput('scacchi_' + Math.floor(1000 + Math.random() * 9000))}
                    className="px-3 py-2 bg-app-panel hover:bg-app-panel/70 text-app-text border border-app-border rounded-xl text-xs font-bold transition-all cursor-pointer"
                    title="Genera nuova password casuale"
                  >
                    Rigenera
                  </button>
                </div>
              </div>

              {resetError && (
                <div className="bg-app-danger-bg border border-app-danger-text/30 rounded-xl p-3 text-app-danger-text text-xs text-center font-medium">
                  {resetError}
                </div>
              )}

              {resetSuccess && (
                <div className="bg-app-success-bg border border-app-success-text/30 rounded-xl p-3 text-app-success-text text-xs text-center font-medium flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-app-success-text" />
                  <span>{resetSuccess}</span>
                </div>
              )}

              <div className="flex justify-end gap-2.5 pt-4 border-t border-app-border">
                <button
                  type="button"
                  onClick={() => setResettingUser(null)}
                  className="px-4 py-2 bg-app-panel hover:bg-app-panel/70 text-app-text-muted rounded-xl border border-app-border text-xs font-bold transition-all cursor-pointer"
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

      {/* MODAL DETTAGLIO FEEDBACK / OSSERVAZIONE */}
      {selectedFeedback && (
        <div className="fixed inset-0 bg-app-bg/85 backdrop-blur-sm flex items-center justify-center z-50 p-4 select-none animate-fade-in">
          <div className="bg-app-bg border-2 border-app-border p-6 max-w-lg w-full rounded-2xl shadow-2xl relative overflow-hidden">
            <div className="flex items-start justify-between gap-3 border-b border-app-border pb-3 mb-4">
              <h3 className="font-serif text-lg font-bold text-app-text flex items-center gap-2 min-w-0">
                <MessageSquare className="w-5 h-5 text-app-accent shrink-0" />
                <span className="truncate">{selectedFeedback.title}</span>
              </h3>
              <button
                onClick={() => setSelectedFeedback(null)}
                className="text-app-text-muted hover:text-app-text transition-colors cursor-pointer shrink-0"
                title="Chiudi"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-app-text-muted mb-4 font-mono">
              <span>Da: <strong className="text-app-accent">{selectedFeedback.playerName}</strong></span>
              {selectedFeedback.createdAt && (
                <span>{new Date(selectedFeedback.createdAt).toLocaleString('it-IT')}</span>
              )}
            </div>

            <div className="bg-app-bg border border-app-border rounded-xl p-4 max-h-[50vh] overflow-y-auto">
              <p className="text-sm text-app-text whitespace-pre-wrap break-words leading-relaxed">{selectedFeedback.message}</p>
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setSelectedFeedback(null)}
                className="px-5 py-2 bg-app-panel hover:bg-app-panel/70 text-app-text rounded-xl border border-app-border text-xs font-bold transition-all cursor-pointer"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
