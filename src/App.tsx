/**
 * Versione: 1.0.1
 * Data e Ora Modifica: 02/07/2026 15:53:56
 * Problema Risolto: Sincronizzazione delle modifiche di versione con l'inizializzazione del caricamento SMTP del server.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Player, ChessGame, Square, LeaderboardEntry, ChatMessage, ChessPiece } from './types';
import { executeMove, getComputerMove, INITIAL_FEN, parseFen, isCheckmate, isStalemate, squareToCoords } from './utils/chessLogic';
import { API_BASE_URL, getWebSocketUrl } from './utils/apiConfig';
import ChessBoard from './components/ChessBoard';
import Leaderboard from './components/Leaderboard';
import PlayerList from './components/PlayerList';
import Chat from './components/Chat';
import MusicPlayer from './components/MusicPlayer';
import AdminPanel from './components/AdminPanel';
import { AudioEngine } from './components/AudioEngine';
import { 
  Crown, 
  Volume2, 
  VolumeX, 
  Cpu, 
  Users, 
  LogOut, 
  Gamepad2, 
  Sparkles, 
  Award,
  ChevronRight,
  ShieldCheck,
  Radio,
  Share2,
  Mail,
  RefreshCw,
  Lock,
  Smartphone,
  ArrowLeft
} from 'lucide-react';

export default function App() {
  // Authentication & Lobby States
  const [player, setPlayer] = useState<Player | null>(null);
  const playerRef = useRef<Player | null>(null);
  
  const [hasConfirmedName, setHasConfirmedName] = useState(() => {
    return sessionStorage.getItem('chess_name_confirmed') === 'true';
  });

  useEffect(() => {
    playerRef.current = player;
  }, [player]);

  const [usernameInput, setUsernameInput] = useState('');
  const [registerError, setRegisterError] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [newNameInput, setNewNameInput] = useState('');

  // Tabbed Auth States
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');

  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  // Captcha & Verification States
  const [captchaId, setCaptchaId] = useState('');
  const [captchaSvg, setCaptchaSvg] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [verificationStep, setVerificationStep] = useState(false);
  const [verifyCode, setVerifyCode] = useState('');
  const [unverifiedUserId, setUnverifiedUserId] = useState('');
  const [unverifiedUserEmail, setUnverifiedUserEmail] = useState('');
  const [landingView, setLandingView] = useState(() => {
    return sessionStorage.getItem('chess_name_confirmed') !== 'true';
  });

  const loadCaptcha = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/captcha`);
      const data = await res.json();
      if (data.success) {
        setCaptchaId(data.captchaId);
        setCaptchaSvg(data.svg);
        setCaptchaAnswer('');
      }
    } catch (err) {
      console.error('Failed to load CAPTCHA:', err);
    }
  };

  useEffect(() => {
    if (authTab === 'register' && !hasConfirmedName) {
      loadCaptcha();
    }
  }, [authTab, hasConfirmedName]);

  const handleResendCode = async () => {
    if (!unverifiedUserId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: regUsername || loginUsername,
          password: regPassword || loginPassword
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('Nuovo codice di verifica inviato con successo alla tua email!');
      } else {
        alert(data.message || 'Errore durante l\'invio del codice.');
      }
    } catch (err) {
      alert('Errore di connessione.');
    }
  };
  
  // Real-time Lists
  const [onlinePlayers, setOnlinePlayers] = useState<Player[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [activeGamesCount, setActiveGamesCount] = useState(0);

  // Active Chess Game State
  const [activeGame, setActiveGame] = useState<ChessGame | null>(null);
  const [playerColor, setPlayerColor] = useState<'w' | 'b'>('w');

  // Challenge Handshake States
  const [incomingChallenge, setIncomingChallenge] = useState<{ challengerId: string; challengerName: string } | null>(null);
  const [pendingChallengeTarget, setPendingChallengeTarget] = useState<string | null>(null);

  // Multi-player Connection States
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [lobbyPending, setLobbyPending] = useState(false);

  // Audio state
  const [ambienceEnabled, setAmbienceEnabled] = useState(false);

  // Move List State (Visual notation helper)
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [difficulty, setDifficulty] = useState<'facile' | 'medio' | 'difficile'>('medio');

  // Automatically request WebSocket link on load
  useEffect(() => {
    const socketUrl = getWebSocketUrl();
    
    console.log('[ChessClient] Establishing WebSocket to:', socketUrl);
    setConnectionStatus('connecting');
    const socket = new WebSocket(socketUrl);

    socket.onopen = () => {
      console.log('[ChessClient] WebSocket connected successfully.');
      setConnectionStatus('connected');

      // Re-register if previously confirmed in this session
      const savedUser = sessionStorage.getItem('chess_username');
      const confirmedBefore = sessionStorage.getItem('chess_name_confirmed') === 'true';
      if (savedUser && confirmedBefore) {
        socket.send(JSON.stringify({
          type: 'register_player',
          payload: { name: savedUser }
        }));
      }
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        const { type, payload } = message;

        if (type === 'connect_ack') {
          setPlayer(payload.player);
          setLeaderboard(payload.leaderboard);
          setOnlinePlayers(payload.onlinePlayers);
          setActiveGamesCount(payload.activeGamesCount);
          setRegisterError('');

          const submitted = sessionStorage.getItem('chess_name_submitted') === 'true';
          const confirmedBefore = sessionStorage.getItem('chess_name_confirmed') === 'true';

          if (submitted || confirmedBefore) {
            setHasConfirmedName(true);
            sessionStorage.setItem('chess_name_confirmed', 'true');
            sessionStorage.setItem('chess_username', payload.player.name);
            sessionStorage.removeItem('chess_name_submitted');
          }
        } else if (type === 'players_update') {
          setOnlinePlayers(payload.onlinePlayers);
        } else if (type === 'player_update') {
          setPlayer(payload.player);
        } else if (type === 'leaderboard_update') {
          setLeaderboard(payload.leaderboard);
        } else if (type === 'incoming_challenge') {
          setIncomingChallenge({
            challengerId: payload.challengerId,
            challengerName: payload.challengerName
          });
          AudioEngine.playCheck(); // play alerting sound!
        } else if (type === 'challenge_pending') {
          setLobbyPending(true);
          setPendingChallengeTarget(payload.targetName);
        } else if (type === 'challenge_declined') {
          setLobbyPending(false);
          setPendingChallengeTarget(null);
          alert(`La sfida è stata rifiutata da ${payload.targetName || 'giocatore'}.`);
        } else if (type === 'game_start') {
          // Initialize active multiplayer game
          const game: ChessGame = payload.game;
          setActiveGame(game);
          
          // Determine assigned side
          const isWhite = game.whitePlayer.id === payload.game.whitePlayer.id && game.whitePlayer.id === playerRef.current?.id;
          setPlayerColor(isWhite ? 'w' : 'b');
          setLobbyPending(false);
          setPendingChallengeTarget(null);
          setIncomingChallenge(null);
          AudioEngine.playCheck(); // ring bell to focus players!
        } else if (type === 'game_update') {
          const game: ChessGame = payload.game;
          setActiveGame(game);

          // If opponent made a move, play corresponding sound
          if (payload.opponentSound) {
            if (payload.opponentSound === 'checkmate' || payload.opponentSound === 'check') {
              AudioEngine.playCheck();
            } else if (payload.opponentSound === 'capture') {
              AudioEngine.playCapture();
            } else {
              AudioEngine.playMove();
            }
          }
        } else if (type === 'error') {
          setRegisterError(payload.message);
          setLobbyPending(false);
        }
      } catch (err) {
        console.error('[ChessClient] Error processing WebSocket packet:', err);
      }
    };

    socket.onclose = () => {
      console.warn('[ChessClient] WebSocket disconnected.');
      setConnectionStatus('disconnected');
    };

    setWs(socket);

    return () => {
      socket.close();
    };
  }, []);

  // Handle register request on backend with Captcha and Email verification
  const handleAuthRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setRegSuccess('');

    if (!regUsername.trim() || !regEmail.trim() || !regPassword || !captchaAnswer.trim()) {
      setRegError('Tutti i campi, compreso il CAPTCHA, sono obbligatori.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: regUsername.trim(),
          email: regEmail.trim(),
          password: regPassword,
          captchaId,
          captchaAnswer: captchaAnswer.trim()
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.unverified) {
          setUnverifiedUserId(data.userId);
          setUnverifiedUserEmail(data.email);
          setVerificationStep(true);
          setRegSuccess(data.message);
        }
      } else {
        setRegError(data.message || 'Errore durante la registrazione.');
        loadCaptcha();
      }
    } catch (err) {
      setRegError('Errore di connessione al server.');
    }
  };

  const handleAuthLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!loginUsername.trim() || !loginPassword) {
      setLoginError('Inserisci username e password.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: loginUsername.trim(),
          password: loginPassword
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.unverified) {
          setUnverifiedUserId(data.userId);
          setUnverifiedUserEmail(data.email);
          setVerificationStep(true);
          setLoginError(data.message);
          return;
        }

        sessionStorage.setItem('chess_username', data.user.username);
        sessionStorage.setItem('chess_name_confirmed', 'true');
        sessionStorage.setItem('chess_name_submitted', 'true'); // sets confirmed in socket ack

        if (ws && connectionStatus === 'connected') {
          ws.send(JSON.stringify({
            type: 'register_player',
            payload: { name: data.user.username }
          }));
        } else {
          setPlayer({
            id: data.user.id,
            name: data.user.username,
            rating: data.user.rating || 1500,
            wins: data.user.wins || 0,
            losses: data.user.losses || 0,
            status: 'attesa',
            lastActive: Date.now()
          });
          setHasConfirmedName(true);
        }
        setLandingView(false);
      } else {
        setLoginError(data.message || 'Credenziali non valide.');
      }
    } catch (err) {
      setLoginError('Errore di connessione al server.');
    }
  };

  const handleVerifyEmailCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyCode.trim()) {
      alert('Inserisci il codice di verifica.');
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: unverifiedUserId,
          code: verifyCode.trim()
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        sessionStorage.setItem('chess_username', data.user.username);
        sessionStorage.setItem('chess_name_confirmed', 'true');
        sessionStorage.setItem('chess_name_submitted', 'true');
        
        if (ws && connectionStatus === 'connected') {
          ws.send(JSON.stringify({
            type: 'register_player',
            payload: { name: data.user.username }
          }));
        } else {
          setPlayer({
            id: data.user.id,
            name: data.user.username,
            rating: data.user.rating || 1500,
            wins: data.user.wins || 0,
            losses: data.user.losses || 0,
            status: 'attesa',
            lastActive: Date.now()
          });
          setHasConfirmedName(true);
        }
        setVerificationStep(false);
        setLandingView(false);
        setRegSuccess('');
        alert('Email verificata con successo! Benvenuto nel club!');
      } else {
        alert(data.message || 'Codice errato. Riprova.');
      }
    } catch (err) {
      alert('Errore di connessione durante la verifica.');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput.trim()) {
      setRegisterError("Il nome non può essere vuoto. Inserisci un nome per giocare.");
      return;
    }
    if (usernameInput.trim().length < 2) {
      setRegisterError("Il nome deve contenere almeno 2 caratteri.");
      return;
    }

    if (ws && connectionStatus === 'connected') {
      sessionStorage.setItem('chess_name_submitted', 'true');
      ws.send(JSON.stringify({
        type: 'register_player',
        payload: { name: usernameInput.trim() }
      }));
    } else {
      setRegisterError("Il server non è connesso. Riprova tra pochi secondi.");
    }
  };

  const handleLogout = () => {
    setHasConfirmedName(false);
    sessionStorage.removeItem('chess_name_confirmed');
    sessionStorage.removeItem('chess_username');
    sessionStorage.removeItem('chess_name_submitted');
    setUsernameInput('');
    setPlayer(null);

    // Re-register as guest on server so name is freed up
    if (ws && connectionStatus === 'connected') {
      const guestNum = Math.floor(1000 + Math.random() * 9000);
      ws.send(JSON.stringify({
        type: 'register_player',
        payload: { name: `Ospite_${guestNum}` }
      }));
    }
  };

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNameInput.trim()) return;

    if (ws && connectionStatus === 'connected') {
      ws.send(JSON.stringify({
        type: 'register_player',
        payload: { name: newNameInput.trim() }
      }));
      setIsEditingName(false);
    }
  };

  // Launch offline Vs Computer match
  const startComputerMatch = () => {
    if (!player) return;

    const gameId = `local_ai_${Date.now()}`;
    const newGame: ChessGame = {
      id: gameId,
      whitePlayer: { ...player, status: 'occupato' },
      blackPlayer: { id: 'computer', name: 'Computer AI', rating: 1500, status: 'occupato', wins: 0, losses: 0, lastActive: Date.now() },
      status: 'attivo',
      fen: INITIAL_FEN,
      turn: 'w',
      moves: [],
      chat: [
        {
          id: 'welcome',
          senderName: 'Tavolo',
          text: `Partita offline avviata contro il Computer (${difficulty.toUpperCase()}). Muovi i pezzi bianchi per cominciare!`,
          timestamp: Date.now()
        }
      ],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isVsComputer: true,
      difficulty
    };

    setPlayerColor('w');
    setActiveGame(newGame);
    AudioEngine.playCheck(); // alerting bell
  };

  // Challenge game trigger
  const handleChallengePlayer = (targetId: string) => {
    if (!ws || connectionStatus !== 'connected') return;

    setLobbyPending(true);
    ws.send(JSON.stringify({
      type: 'challenge_player',
      payload: { targetId }
    }));
  };

  // Accept/Decline challenge handshakes
  const handleAcceptChallenge = () => {
    if (!ws || !incomingChallenge) return;
    ws.send(JSON.stringify({
      type: 'accept_challenge',
      payload: { challengerId: incomingChallenge.challengerId }
    }));
    setIncomingChallenge(null);
  };

  const handleDeclineChallenge = () => {
    if (!ws || !incomingChallenge) return;
    ws.send(JSON.stringify({
      type: 'decline_challenge',
      payload: { challengerId: incomingChallenge.challengerId }
    }));
    setIncomingChallenge(null);
  };

  // Core chess pieces move callback
  const handleChessMove = (from: Square, to: Square, promotion: ChessPiece['type'] = 'q', localSound?: string) => {
    if (!activeGame) return;

    const result = executeMove(activeGame.fen, from, to, promotion);
    if (!result.success) return;

    // Build move data
    const newMoveData = {
      from,
      to,
      piece: parseFen(activeGame.fen).board[squareToCoords(from).r][squareToCoords(from).c]!,
      captured: result.captured || undefined,
      promotion: promotion !== 'q' ? promotion : undefined,
      notation: result.notation
    };

    const updatedGame: ChessGame = {
      ...activeGame,
      fen: result.newFen,
      turn: activeGame.turn === 'w' ? 'b' : 'w',
      moves: [...activeGame.moves, newMoveData],
      updatedAt: Date.now()
    };

    // Calculate outcomes of the move
    const { board, turn, castlingRights, enPassantSquare } = parseFen(result.newFen);
    
    if (isCheckmate(board, turn, castlingRights, enPassantSquare)) {
      updatedGame.status = 'scacco_matto';
      updatedGame.winnerId = activeGame.turn === 'w' ? activeGame.whitePlayer.id : activeGame.blackPlayer.id;
    } else if (isStalemate(board, turn, castlingRights, enPassantSquare)) {
      updatedGame.status = 'patta';
    }

    if (activeGame.isVsComputer) {
      // Offline local update
      if (updatedGame.status === 'scacco_matto') {
         const hasUserWon = updatedGame.winnerId !== 'computer';
        updatedGame.chat.push({
          id: `sys_${Date.now()}`,
          senderName: 'Tavolo',
          text: hasUserWon 
            ? `Complimenti! Hai sconfitto il Computer!` 
            : `Il Computer ti ha dato scacco matto! Non arrenderti!`,
          timestamp: Date.now()
        });

        // Send outcome to server to save wins/losses/ratings
        if (ws && connectionStatus === 'connected') {
          ws.send(JSON.stringify({
            type: 'computer_game_over',
            payload: { won: hasUserWon }
          }));
        }
      }

      setActiveGame(updatedGame);
    } else {
      // Multiplayer WebSocket sync
      if (ws && connectionStatus === 'connected') {
        ws.send(JSON.stringify({
          type: 'game_move',
          payload: {
            gameId: activeGame.id,
            from,
            to,
            fen: result.newFen,
            moves: updatedGame.moves,
            turn: updatedGame.turn,
            status: updatedGame.status,
            winnerId: updatedGame.winnerId,
            opponentSound: localSound
          }
        }));
      }
    }
  };

  // AI response engine loop
  useEffect(() => {
    if (!activeGame || !activeGame.isVsComputer || activeGame.status !== 'attivo') return;

    const isAITurn = activeGame.turn === 'b';
    if (isAITurn && !isAiThinking) {
      setIsAiThinking(true);

      // Add a realistic cognitive decision thinking lag (700-1200ms)
      const delay = Math.random() * 500 + 700;
      setTimeout(() => {
        const move = getComputerMove(activeGame.fen, difficulty);
        if (move) {
          const result = executeMove(activeGame.fen, move.from, move.to, 'q');
          if (result.success) {
            
            // Trigger move sounds
            if (result.soundType === 'checkmate' || result.soundType === 'check') {
              AudioEngine.playCheck();
            } else if (result.soundType === 'capture') {
              AudioEngine.playCapture();
            } else {
              AudioEngine.playMove();
            }

            const aiPiece = parseFen(activeGame.fen).board[squareToCoords(move.from).r][squareToCoords(move.from).c]!;
            const newMoveData = {
              from: move.from,
              to: move.to,
              piece: aiPiece,
              captured: result.captured || undefined,
              notation: result.notation
            };

            const updatedGame: ChessGame = {
              ...activeGame,
              fen: result.newFen,
              turn: 'w',
              moves: [...activeGame.moves, newMoveData],
              updatedAt: Date.now()
            };

            // Evaluate state
            const { board, turn, castlingRights, enPassantSquare } = parseFen(result.newFen);
            if (isCheckmate(board, turn, castlingRights, enPassantSquare)) {
              updatedGame.status = 'scacco_matto';
              updatedGame.winnerId = 'computer';
              updatedGame.chat.push({
                id: `sys_${Date.now()}`,
                senderName: 'Tavolo',
                text: `Il Computer ti ha dato scacco matto! Mettiti alla prova ancora!`,
                timestamp: Date.now()
              });

              // Send outcome to server to save wins/losses/ratings
              if (ws && connectionStatus === 'connected') {
                ws.send(JSON.stringify({
                  type: 'computer_game_over',
                  payload: { won: false }
                }));
              }
            } else if (isStalemate(board, turn, castlingRights, enPassantSquare)) {
              updatedGame.status = 'patta';
              updatedGame.chat.push({
                id: `sys_${Date.now()}`,
                senderName: 'Tavolo',
                text: `Patta per stallo contro il Computer. Ottimo sforzo!`,
                timestamp: Date.now()
              });
            }

            setActiveGame(updatedGame);
          }
        }
        setIsAiThinking(false);
      }, delay);
    }
  }, [activeGame?.fen, activeGame?.turn, activeGame?.isVsComputer]);

  // Transmitting chat strings
  const handleSendChatMessage = (text: string) => {
    if (!activeGame) return;

    if (activeGame.isVsComputer) {
      // Local AI Chat - let's make the computer respond with delightful witty wooden commentary!
      const userMsg: ChatMessage = {
        id: `user_${Date.now()}`,
        senderName: player?.name || 'Tu',
        text,
        timestamp: Date.now()
      };

      const computerResponses = [
        "Un'ottima mossa! La mia logica di legno consiglia prudenza.",
        "Rifletto sulla venatura della situazione...",
        "Interessante sviluppo tattico! Sarà una partita memorabile.",
        "Arroccamento o attacco aggressivo? Vediamo come te la cavi.",
        "Il mio blocco intagliato vibra di passione scacchistica!"
      ];
      const randomAiResponse = computerResponses[Math.floor(Math.random() * computerResponses.length)];

      const aiMsg: ChatMessage = {
        id: `ai_${Date.now()}`,
        senderName: 'Computer AI',
        text: randomAiResponse,
        timestamp: Date.now() + 800
      };

      setActiveGame({
        ...activeGame,
        chat: [...activeGame.chat, userMsg, aiMsg]
      });
      AudioEngine.playTick();
    } else {
      // Send message to Server
      if (ws && connectionStatus === 'connected') {
        ws.send(JSON.stringify({
          type: 'game_chat',
          payload: { gameId: activeGame.id, text }
        }));
      }
    }
  };

  // Surrender/Resign Callback
  const handleResign = () => {
    if (!activeGame) return;

    if (activeGame.isVsComputer) {
      setActiveGame({
        ...activeGame,
        status: 'abbandono',
        winnerId: 'computer',
        chat: [
          ...activeGame.chat,
          {
            id: `resign_${Date.now()}`,
            senderName: 'Tavolo',
            text: 'Hai abbandonato la partita.',
            timestamp: Date.now()
          }
        ]
      });

      // Send outcome to server to save wins/losses/ratings
      if (ws && connectionStatus === 'connected') {
        ws.send(JSON.stringify({
          type: 'computer_game_over',
          payload: { won: false }
        }));
      }
    } else {
      if (ws && connectionStatus === 'connected') {
        ws.send(JSON.stringify({
          type: 'game_resign',
          payload: { gameId: activeGame.id }
        }));
      }
    }
  };

  // Toggle ambient coffee-shop/chess-club acoustics
  const handleToggleAmbience = () => {
    const isPlaying = AudioEngine.toggleAmbience();
    setAmbienceEnabled(isPlaying);
  };

  const quitToLobby = () => {
    setActiveGame(null);
  };

  // Check if we are on the admin path
  const isAdminPath = window.location.pathname === '/admin' || window.location.hash === '#/admin';

  if (isAdminPath) {
    return (
      <div id="application-root" className="min-h-screen bg-[#0a0806] text-amber-100 flex flex-col justify-between font-sans selection:bg-amber-800 selection:text-amber-100 antialiased relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(40,25,18,0.15)_0%,rgba(0,0,0,0)_80%)] pointer-events-none select-none" />
        <div className="absolute inset-0 spotlight pointer-events-none z-10" />
        
        {/* Simple Header for Admin */}
        <header className="h-16 flex items-center justify-between px-8 bg-[#15110d] border-b border-[#2d2218] z-40 relative select-none">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-amber-600 rounded flex items-center justify-center text-xl font-serif">♚</div>
            <div>
              <h1 className="text-lg font-bold tracking-widest text-[#f5e8d0] uppercase">Grandmaster Live</h1>
              <p className="text-[10px] text-amber-500/60 font-mono tracking-wider">Area Riservata Amministrazione</p>
            </div>
          </div>
        </header>

        <main className="flex-1 w-full flex items-center justify-center relative z-20">
          <AdminPanel />
        </main>

        <footer className="border-t border-stone-900/80 bg-stone-950/60 py-4.5 px-6 text-center select-none relative z-10">
          <p className="text-stone-600 text-[10px] font-mono">
            Scacchi di Legno © 2026 • Portale Amministrazione Protetto
          </p>
        </footer>
      </div>
    );
  }

  return (
    <div id="application-root" className="min-h-screen bg-[#0a0806] text-amber-100 flex flex-col justify-between font-sans selection:bg-amber-800 selection:text-amber-100 antialiased relative overflow-hidden">
      
      {/* Absolute decorative tabletop wooden background texture underlays */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(40,25,18,0.15)_0%,rgba(0,0,0,0)_80%)] pointer-events-none select-none" />
      <div className="absolute inset-0 spotlight pointer-events-none z-10" />

      {/* Elegant Header */}
      <header className="h-16 flex items-center justify-between px-8 bg-[#15110d] border-b border-[#2d2218] z-40 relative select-none">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-amber-600 rounded flex items-center justify-center text-xl font-serif">♚</div>
          <div>
            <h1 className="text-lg font-bold tracking-widest text-[#f5e8d0] uppercase">Grandmaster Live</h1>
            <p className="text-[10px] text-amber-500/60 font-mono tracking-wider">In Tempo Reale • Audio Procedurale • Illuminazione Tridimensionale</p>
          </div>
        </div>

        {/* Dynamic header indicators */}
        <div className="flex items-center gap-4">
          <MusicPlayer />

          <button
            id="ambient-acoustics-toggle"
            className={`p-2.5 rounded-xl border flex items-center justify-center outline-none transition-all duration-150 cursor-pointer ${
              ambienceEnabled
                ? 'bg-amber-950/20 border-amber-600/50 text-amber-300 shadow-[0_0_8px_rgba(217,119,6,0.15)]'
                : 'bg-[#241c14] border-[#3d2f21] text-amber-500/80 hover:text-[#f2e6d0]'
            }`}
            onClick={handleToggleAmbience}
            title={ambienceEnabled ? "Disattiva Acustica di Sottofondo" : "Abilita Acustica di Sottofondo"}
          >
            {ambienceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {hasConfirmedName && player && (
            <div className="flex items-center gap-3 bg-[#241c14] px-4 py-1.5 rounded-full border border-[#3d2f21]">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              {isEditingName ? (
                <form onSubmit={handleRenameSubmit} className="flex items-center gap-2">
                  <input
                    type="text"
                    maxLength={18}
                    value={newNameInput}
                    onChange={(e) => setNewNameInput(e.target.value)}
                    className="bg-black/60 text-xs text-amber-100 px-2 py-0.5 rounded border border-amber-900/40 outline-none w-28 focus:border-amber-500/50"
                    autoFocus
                  />
                  <button type="submit" className="text-[10px] text-green-400 font-bold hover:text-green-300 cursor-pointer">Salva</button>
                  <button type="button" onClick={() => setIsEditingName(false)} className="text-[10px] text-stone-400 hover:text-stone-300 cursor-pointer">Annulla</button>
                </form>
              ) : (
                <span className="text-sm text-amber-200/80 flex items-center gap-1.5 select-none">
                  Benvenuto, <span className="font-bold text-amber-100 italic tracking-wide font-serif">{player.name}</span> 
                  <span className="text-xs text-amber-600 font-mono">({player.rating} Elo)</span>
                  <button 
                    onClick={() => {
                      setNewNameInput(player.name);
                      setIsEditingName(true);
                    }} 
                    className="text-[10px] text-amber-500 hover:text-amber-400 underline cursor-pointer ml-1"
                  >
                    modifica
                  </button>
                  <button 
                    onClick={handleLogout} 
                    className="text-[10px] text-red-400 hover:text-red-300 underline cursor-pointer ml-2 border-l border-[#3d2f21] pl-2"
                    title="Torna alla Home / Cambia Nome"
                  >
                    esci
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 flex flex-col items-center justify-center relative z-20">
        
        {/* INCOMING CHALLENGE HANDSHAKE BANNER */}
        {incomingChallenge && (
          <div 
            id="incoming-challenge-banner"
            className="w-full max-w-2xl bg-gradient-to-r from-[#20150d] via-[#3d2414] to-[#20150d] border-2 border-amber-600/60 p-6 rounded-2xl shadow-[0_15px_45px_rgba(0,0,0,0.85)] text-center relative overflow-hidden mb-8 animate-pulse z-50"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.08)_0%,transparent_70%)] pointer-events-none" />
            <h3 className="font-serif text-lg md:text-xl font-bold text-amber-100 flex items-center justify-center gap-2">
              <span>⚔️ Sfidante al Tavolo ⚔️</span>
            </h3>
            <p className="text-sm md:text-base text-amber-200 mt-2.5">
              Il giocatore <strong className="text-amber-400 font-serif font-black italic text-lg">{incomingChallenge.challengerName}</strong> vuole sfidarti: accetti o no?
            </p>
            <div className="flex items-center justify-center gap-4 mt-5">
              <button
                id="accept-challenge-btn"
                onClick={handleAcceptChallenge}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-700 to-emerald-900 hover:from-emerald-600 hover:to-emerald-800 text-emerald-100 font-serif font-bold text-xs rounded-xl border border-emerald-500/20 shadow-lg cursor-pointer transform transition hover:scale-105 active:scale-95 outline-none"
              >
                Accetto la sfida
              </button>
              <button
                id="decline-challenge-btn"
                onClick={handleDeclineChallenge}
                className="px-6 py-2.5 bg-gradient-to-r from-rose-700 to-rose-950 hover:from-rose-600 hover:to-rose-850 text-rose-100 font-serif font-bold text-xs rounded-xl border border-rose-500/20 shadow-lg cursor-pointer transform transition hover:scale-105 active:scale-95 outline-none"
              >
                Rifiuto la sfida
              </button>
            </div>
          </div>
        )}

        {/* OUTGOING PENDING CHALLENGE STATUS */}
        {lobbyPending && pendingChallengeTarget && (
          <div 
            id="outgoing-challenge-banner"
            className="w-full max-w-2xl bg-gradient-to-r from-[#140f0c] via-[#211712] to-[#140f0c] border border-amber-900/30 p-4 rounded-xl shadow-lg text-center mb-8 z-50 animate-pulse"
          >
            <p className="text-xs md:text-sm text-stone-400 font-mono flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              In attesa che <strong className="text-amber-500 font-serif font-bold italic">{pendingChallengeTarget}</strong> accetti o rifiuti la sfida...
            </p>
          </div>
        )}

        {/* LANDING PAGE, CAPTCHA FORM, AND VERIFICATION SCREEN */}
        {!hasConfirmedName && (
          <div className="w-full flex flex-col items-center justify-center animate-fade-in duration-500">
            
            {/* 1. PORTAL LANDING PAGE */}
            {landingView && (
              <div className="w-full max-w-5xl space-y-12">
                
                {/* Brand Hero & App Store Pitch */}
                <div className="text-center space-y-4 max-w-3xl mx-auto">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-950/40 border border-amber-600/20 rounded-full text-[10px] font-mono font-bold tracking-widest text-amber-400 uppercase">
                    <Sparkles className="w-3.5 h-3.5 animate-spin-slow text-amber-500" />
                    L'arena degli scacchi d'élite
                  </div>
                  <h1 className="font-serif text-4xl md:text-5xl font-black text-amber-100 leading-tight">
                    Circolo degli Scacchi
                  </h1>
                  <p className="text-sm md:text-base text-stone-400 leading-relaxed max-w-2xl mx-auto font-sans">
                    Gioca gratis in tempo reale, sfida un'Intelligenza Artificiale evoluta su tre livelli di difficoltà, e accumula punti per scalare la classifica Elo ufficiale. L'app definitiva per veri maestri.
                  </p>
                  
                  {/* Action CTA Buttons */}
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                    <button
                      onClick={() => {
                        setAuthTab('register');
                        setLandingView(false);
                        setVerificationStep(false);
                      }}
                      className="px-8 py-4 w-full sm:w-auto bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-500 hover:to-amber-700 text-stone-950 font-sans font-black text-sm uppercase tracking-wider rounded-2xl shadow-[0_15px_30px_rgba(217,119,6,0.3)] transition transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer flex items-center justify-center gap-2 border border-amber-400/20"
                    >
                      Unisciti al Club (Registrati) <ChevronRight className="w-5 h-5 text-stone-950" />
                    </button>
                    <button
                      onClick={() => {
                        setAuthTab('login');
                        setLandingView(false);
                        setVerificationStep(false);
                      }}
                      className="px-8 py-4 w-full sm:w-auto bg-[#140f0c] hover:bg-[#1a1410] text-amber-300 font-sans font-bold text-sm uppercase tracking-wider rounded-2xl shadow-lg border border-amber-900/40 transition transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer flex items-center justify-center gap-2"
                    >
                      Hai già un account? Accedi
                    </button>
                  </div>
                </div>

                {/* Aesthetic Bento Grid - Features with Unsplash Images */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                  
                  {/* Live Multiplayer */}
                  <div className="glass-panel border border-[#2d2218] rounded-3xl overflow-hidden shadow-2xl flex flex-col group hover:border-amber-600/20 transition-all duration-300">
                    <div className="h-44 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0e0a07] via-transparent to-transparent z-10" />
                      <img 
                        src="https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=600&q=80" 
                        alt="Scacchi Online Classificati" 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-6 flex-1 flex flex-col justify-between space-y-2 bg-[#0e0a07]">
                      <div>
                        <div className="flex items-center gap-2 text-amber-400 font-serif font-bold text-base">
                          <Users className="w-5 h-5 text-amber-500" />
                          Sfide PvP in Tempo Reale
                        </div>
                        <p className="text-xs text-stone-400 mt-2 leading-relaxed">
                          Connettiti con appassionati di tutto il mondo. Gioca partite online istantanee con matchmaking autoritativo e tracciamento Elo sincronizzato su PostgreSQL.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* AI Engine */}
                  <div className="glass-panel border border-[#2d2218] rounded-3xl overflow-hidden shadow-2xl flex flex-col group hover:border-amber-600/20 transition-all duration-300">
                    <div className="h-44 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0e0a07] via-transparent to-transparent z-10" />
                      <img 
                        src="https://images.unsplash.com/photo-1523821741446-edb2b68bb7a0?auto=format&fit=crop&w=600&q=80" 
                        alt="Chess AI Motore di gioco" 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-6 flex-1 flex flex-col justify-between space-y-2 bg-[#0e0a07]">
                      <div>
                        <div className="flex items-center gap-2 text-amber-400 font-serif font-bold text-base">
                          <Cpu className="w-5 h-5 text-amber-500" />
                          Motore AI Avanzato
                        </div>
                        <p className="text-xs text-stone-400 mt-2 leading-relaxed">
                          Metti alla prova le tue tattiche contro la nostra CPU. Scegli tra Facile per fare pratica, Medio per metterti alla prova, o Difficile per sperimentare una vera sfida.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Persistent Leaderboard */}
                  <div className="glass-panel border border-[#2d2218] rounded-3xl overflow-hidden shadow-2xl flex flex-col group hover:border-amber-600/20 transition-all duration-300">
                    <div className="h-44 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0e0a07] via-transparent to-transparent z-10" />
                      <img 
                        src="https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&w=600&q=80" 
                        alt="Classifica Elo persistent" 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-6 flex-1 flex flex-col justify-between space-y-2 bg-[#0e0a07]">
                      <div>
                        <div className="flex items-center gap-2 text-amber-400 font-serif font-bold text-base">
                          <Award className="w-5 h-5 text-amber-500" />
                          Classifica Elo & Storico
                        </div>
                        <p className="text-xs text-stone-400 mt-2 leading-relaxed">
                          La tua scalata viene salvata in modo sicuro nel database. Guadagna punti Elo battendo la CPU o altri giocatori reali e diventa una leggenda della scacchiera.
                        </p>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Play Store & App Store Badge Mockups */}
                <div className="bg-[#110c08] border border-amber-900/30 rounded-3xl p-8 max-w-3xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden select-none">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_right,rgba(217,119,6,0.03)_0%,transparent_55%)] pointer-events-none" />
                  <div className="space-y-1 text-center md:text-left">
                    <h3 className="font-serif text-lg font-bold text-amber-200 flex items-center justify-center md:justify-start gap-2">
                      <Smartphone className="w-5 h-5 text-amber-500 animate-bounce" />
                      Gioca Ovunque Ti Trovi
                    </h3>
                    <p className="text-xs text-stone-400 max-w-sm leading-relaxed">
                      L'applicazione è progettata per adattarsi perfettamente su tutti gli schermi ed è pronta per essere pubblicata gratuitamente sugli store digitali iOS e Android.
                    </p>
                  </div>
                  
                  {/* Store Badges */}
                  <div className="flex flex-wrap items-center justify-center gap-4">
                    {/* App Store */}
                    <div className="bg-stone-950 hover:bg-stone-900 border border-stone-800 rounded-xl px-4 py-2 flex items-center gap-2.5 w-40 cursor-not-allowed shadow-md transition">
                      <Smartphone className="w-6 h-6 text-white" />
                      <div className="text-left leading-none">
                        <span className="text-[9px] font-mono text-stone-400 block uppercase font-medium">Download on the</span>
                        <span className="text-xs font-sans text-stone-100 font-bold block mt-0.5">App Store</span>
                      </div>
                    </div>
                    {/* Google Play */}
                    <div className="bg-stone-950 hover:bg-stone-900 border border-stone-800 rounded-xl px-4 py-2 flex items-center gap-2.5 w-40 cursor-not-allowed shadow-md transition">
                      <Gamepad2 className="w-6 h-6 text-amber-500" />
                      <div className="text-left leading-none">
                        <span className="text-[9px] font-mono text-stone-400 block uppercase font-medium">Get it on</span>
                        <span className="text-xs font-sans text-stone-100 font-bold block mt-0.5">Google Play</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-center text-[10px] font-mono text-stone-600 select-none">
                  Licenza App Store Gratuita • Circolo degli Scacchi d'Elite v2.0 • Protetto da CAPTCHA
                </div>
              </div>
            )}

            {/* 2. SECURITY EMAIL VERIFICATION FLOW SCREEN */}
            {!landingView && verificationStep && (
              <div 
                id="verification-panel"
                className="w-full max-w-md p-8 rounded-3xl glass-panel border border-[#2d2218] shadow-[0_30px_90px_rgba(0,0,0,0.8)] relative overflow-hidden transition-all duration-300"
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(217,119,6,0.06)_0%,transparent_60%)] pointer-events-none" />
                
                <div className="text-center mb-6">
                  <div className="w-14 h-14 bg-amber-950/40 border border-amber-600/30 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                    <Lock className="w-7 h-7 text-amber-500" />
                  </div>
                  <h2 className="font-serif text-2xl font-black text-amber-100 mb-1">
                    Verifica Email
                  </h2>
                  <p className="text-stone-400 text-xs leading-relaxed max-w-xs mx-auto">
                    Inserisci il codice di sicurezza a 6 cifre che abbiamo spedito all'indirizzo:
                  </p>
                  <p className="text-amber-400 font-mono text-xs font-bold mt-1 max-w-xs mx-auto truncate">
                    {unverifiedUserEmail}
                  </p>
                </div>

                <form onSubmit={handleVerifyEmailCode} className="space-y-5">
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-amber-800 mb-2 font-bold text-center">
                      Codice di Sicurezza (6 Cifre)
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="E.g. 584102"
                      value={verifyCode}
                      onChange={(e) => setVerifyCode(e.target.value.replace(/[^0-9]/g, ''))}
                      className="w-full bg-[#080504] border-2 border-amber-900/60 rounded-xl px-4 py-3.5 text-center text-lg tracking-[8px] text-amber-400 placeholder-stone-800 outline-none focus:border-amber-500 font-mono font-bold"
                    />
                  </div>

                  {/* Sandbox Hint for easy testing! */}
                  <div className="bg-amber-950/20 border border-amber-800/30 rounded-xl p-3 text-stone-400 text-[11px] leading-relaxed">
                    <strong className="text-amber-500 font-serif">Nota per il Collaudo:</strong> Dal momento che ti trovi in un ambiente di anteprima sandbox, se non hai configurato le variabili SMTP nel file `.env`, il codice è stato memorizzato in sicurezza e stampato nei <strong className="text-amber-400">Log di Sistema (Admin Panel / System Logs)</strong>. Copialo da lì per completare il test!
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-500 hover:to-amber-700 text-stone-950 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg cursor-pointer transform transition active:scale-95 outline-none flex items-center justify-center gap-2"
                  >
                    Verifica e Attiva Account <ShieldCheck className="w-4 h-4 text-stone-950" />
                  </button>
                </form>

                <div className="flex flex-col gap-3 mt-6 pt-5 border-t border-amber-950/40 text-center select-none">
                  <button
                    onClick={handleResendCode}
                    className="text-[10px] font-mono uppercase text-amber-600 hover:text-amber-500 font-bold transition cursor-pointer"
                  >
                    Non hai ricevuto il codice? Invialo di nuovo
                  </button>
                  
                  <button
                    onClick={() => {
                      setVerificationStep(false);
                      setLandingView(false);
                    }}
                    className="flex items-center justify-center gap-1.5 text-[10px] font-mono uppercase text-stone-500 hover:text-stone-400 transition mt-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Torna a Accedi/Registrati
                  </button>
                </div>
              </div>
            )}

            {/* 3. TABBED LOGIN & REGISTRATION WITH CAPTCHA */}
            {!landingView && !verificationStep && (
              <div 
                id="login-panel"
                className="w-full max-w-md p-8 rounded-3xl glass-panel border border-[#2d2218] shadow-[0_30px_90px_rgba(0,0,0,0.8)] relative overflow-hidden transition-all duration-300"
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(217,119,6,0.06)_0%,transparent_60%)] pointer-events-none" />
                
                {/* Back to landing link */}
                <button
                  onClick={() => setLandingView(true)}
                  className="absolute top-4 left-4 flex items-center gap-1 text-[9px] font-mono text-stone-500 hover:text-stone-400 transition cursor-pointer outline-none"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Landing
                </button>

                <div className="text-center mb-6 pt-2">
                  <div className="w-14 h-14 bg-amber-900/25 border border-amber-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                    <Gamepad2 className="w-7 h-7 text-amber-400 font-serif" />
                  </div>
                  <h2 className="font-serif text-2xl font-black text-amber-100 mb-1">
                    Club degli Scacchi
                  </h2>
                  <p className="text-stone-400 text-xs leading-relaxed max-w-xs mx-auto">
                    Accedi o crea un account per tracciare le tue statistiche e giocare partite classificate con salvataggio sicuro in Postgres.
                  </p>
                </div>

                {/* TAB SELECTOR */}
                <div className="flex border-b border-amber-950/40 mb-6 select-none">
                  <button
                    type="button"
                    onClick={() => setAuthTab('login')}
                    className={`flex-1 pb-3 text-xs font-mono uppercase tracking-wider font-bold transition-all border-b-2 text-center cursor-pointer ${
                      authTab === 'login' 
                        ? 'border-amber-500 text-amber-300' 
                        : 'border-transparent text-stone-500 hover:text-stone-400'
                    }`}
                  >
                    Accedi (Login)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthTab('register')}
                    className={`flex-1 pb-3 text-xs font-mono uppercase tracking-wider font-bold transition-all border-b-2 text-center cursor-pointer ${
                      authTab === 'register' 
                        ? 'border-amber-500 text-amber-300' 
                        : 'border-transparent text-stone-500 hover:text-stone-400'
                    }`}
                  >
                    Nuova Iscrizione
                  </button>
                </div>

                {/* LOGIN FORM */}
                {authTab === 'login' ? (
                  <form onSubmit={handleAuthLogin} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-amber-800 mb-1.5 font-bold">
                        Username
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="E.g. Bobby_Fischer"
                        value={loginUsername}
                        onChange={(e) => setLoginUsername(e.target.value)}
                        className="w-full bg-[#080504] border border-amber-900/40 rounded-xl px-4 py-3 text-xs text-stone-100 placeholder-stone-700 outline-none focus:border-amber-500/50 transition-all font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-amber-800 mb-1.5 font-bold">
                        Password
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="w-full bg-[#080504] border border-amber-900/40 rounded-xl px-4 py-3 text-xs text-stone-100 placeholder-stone-700 outline-none focus:border-amber-500/50 transition-all font-mono"
                      />
                    </div>

                    {loginError && (
                      <div className="bg-rose-950/20 border border-rose-800/30 rounded-xl p-3 text-rose-400 text-xs text-center font-medium">
                        {loginError}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={connectionStatus !== 'connected'}
                      className="w-full py-3.5 bg-gradient-to-r from-amber-700 to-amber-900 hover:from-amber-600 hover:to-amber-800 text-amber-100 rounded-xl font-bold text-xs uppercase tracking-wider border border-amber-500/10 shadow-lg cursor-pointer transform transition active:scale-95 outline-none flex items-center justify-center gap-2"
                    >
                      Accedi al Tavolo <ChevronRight className="w-4 h-4" />
                    </button>
                  </form>
                ) : (
                  /* REGISTRATION FORM WITH INTEGRATED SECURITY CAPTCHA */
                  <form onSubmit={handleAuthRegister} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-amber-800 mb-1.5 font-bold">
                        Scegli Username
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={18}
                        placeholder="E.g. Bobby_Fischer"
                        value={regUsername}
                        onChange={(e) => setRegUsername(e.target.value)}
                        className="w-full bg-[#080504] border border-amber-900/40 rounded-xl px-4 py-3 text-xs text-stone-100 placeholder-stone-700 outline-none focus:border-amber-500/50 transition-all font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-amber-800 mb-1.5 font-bold">
                        Indirizzo Email
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="E.g. giocatore@circolo.it"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        className="w-full bg-[#080504] border border-amber-900/40 rounded-xl px-4 py-3 text-xs text-stone-100 placeholder-stone-700 outline-none focus:border-amber-500/50 transition-all font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-amber-800 mb-1.5 font-bold">
                        Crea Password
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="Scegli una password sicura..."
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        className="w-full bg-[#080504] border border-amber-900/40 rounded-xl px-4 py-3 text-xs text-stone-100 placeholder-stone-700 outline-none focus:border-amber-500/50 transition-all font-mono"
                      />
                    </div>

                    {/* INTERACTIVE GRAPHICAL CAPTCHA SECURITY BLOCK */}
                    <div className="bg-[#110c08] border border-amber-950/40 p-4 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="block text-[10px] font-mono uppercase tracking-wider text-amber-700 font-bold">
                          Controlli Antispam CAPTCHA
                        </label>
                        <button
                          type="button"
                          onClick={loadCaptcha}
                          className="text-[10px] font-mono text-amber-500 hover:text-amber-400 flex items-center gap-1 cursor-pointer outline-none"
                          title="Genera nuovo captcha"
                        >
                          <RefreshCw className="w-3 h-3 text-amber-500 animate-spin-slow" /> Rigenera
                        </button>
                      </div>
                      
                      <div className="flex items-center gap-4 justify-center">
                        {captchaSvg ? (
                          <div 
                            dangerouslySetInnerHTML={{ __html: captchaSvg }} 
                            className="flex-shrink-0 select-none shadow-md"
                          />
                        ) : (
                          <div className="w-40 h-14 bg-[#090504] border border-amber-950 rounded-xl flex items-center justify-center text-stone-600 text-[10px] font-mono animate-pulse">
                            Caricamento...
                          </div>
                        )}
                        
                        <div className="flex-1">
                          <input
                            type="text"
                            required
                            maxLength={5}
                            placeholder="Inserisci i 5 caratteri..."
                            value={captchaAnswer}
                            onChange={(e) => setCaptchaAnswer(e.target.value.toUpperCase())}
                            className="w-full bg-[#080504] border border-amber-900/40 rounded-xl px-3 py-2.5 text-center text-xs text-amber-400 font-mono font-bold tracking-widest outline-none focus:border-amber-500"
                          />
                        </div>
                      </div>
                    </div>

                    {regError && (
                      <div className="bg-rose-950/20 border border-rose-800/30 rounded-xl p-3 text-rose-400 text-xs text-center font-medium">
                        {regError}
                      </div>
                    )}

                    {regSuccess && (
                      <div className="bg-green-950/20 border border-green-800/30 rounded-xl p-3 text-green-400 text-xs text-center font-medium">
                        {regSuccess}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={connectionStatus !== 'connected'}
                      className="w-full py-3.5 bg-gradient-to-r from-amber-700 to-amber-900 hover:from-amber-600 hover:to-amber-800 text-amber-100 rounded-xl font-bold text-xs uppercase tracking-wider border border-amber-500/10 shadow-lg cursor-pointer transform transition active:scale-95 outline-none flex items-center justify-center gap-2"
                    >
                      Verifica e Spedisci Email <ChevronRight className="w-4 h-4" />
                    </button>
                  </form>
                )}

                <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-amber-950/40 text-center select-none">
                  <div className="flex flex-col items-center">
                    <ShieldCheck className="w-5 h-5 text-amber-600 mb-1" />
                    <span className="text-[10px] font-mono uppercase text-stone-500 font-bold">PostgreSQL Active</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <Radio className="w-5 h-5 text-amber-600 mb-1" />
                    <span className="text-[10px] font-mono uppercase text-stone-500 font-bold">{connectionStatus === 'connected' ? 'Servizio Attivo' : 'Scollegato'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PLAYERS LOBBY SCREEN */}
        {hasConfirmedName && player && !activeGame && (
          <div id="lobby-grid" className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start duration-500 animate-fade-in">
            
            {/* Play options Panel */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Computer Offline Challenge Card */}
              <div 
                id="ai-opponent-card"
                className="glass-panel border border-[#2d2218] rounded-2xl p-6 shadow-2xl relative overflow-hidden"
              >
                <div className="absolute right-0 top-0 w-48 h-48 bg-[radial-gradient(circle_at_right,rgba(217,119,6,0.06)_0%,transparent_70%)] pointer-events-none" />

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-amber-900/15 pb-4 mb-4">
                  <div>
                    <h3 className="font-serif text-xl font-black text-amber-100 flex items-center gap-2">
                      <Cpu className="w-5 h-5 text-amber-500" /> Sfida l'Intelligenza Artificiale
                    </h3>
                    <p className="text-xs text-stone-400 mt-1">
                      Gioca offline contro il motore euristico locale. Ottimo per fare pratica immediata.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {(['facile', 'medio', 'difficile'] as const).map((diff) => (
                      <button
                        key={diff}
                        id={`ai-diff-${diff}`}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all outline-none cursor-pointer ${
                          difficulty === diff
                            ? 'bg-amber-800 text-amber-100 border border-amber-600/40 shadow-inner'
                            : 'bg-stone-900 text-stone-400 border border-stone-800'
                        }`}
                        onClick={() => {
                          setDifficulty(diff);
                          AudioEngine.playTick();
                        }}
                      >
                        {diff}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center bg-[#070504]/55 p-4 rounded-xl border border-amber-950/20">
                  <span className="text-xs text-stone-400">Pronto per il match?</span>
                  <button
                    id="play-vs-ai-btn"
                    onClick={startComputerMatch}
                    className="px-5 py-2.5 bg-gradient-to-r from-amber-700 to-amber-900 hover:from-amber-600 hover:to-amber-800 text-amber-100 font-bold text-xs rounded-lg border border-amber-500/15 shadow-md flex items-center gap-2 transform transition active:scale-95 outline-none cursor-pointer"
                  >
                    Avvia Partita Locale <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Online Real-Time Multiplayer Card */}
              <div id="online-players-card">
                <PlayerList
                  players={onlinePlayers}
                  currentPlayerId={player.id}
                  onChallenge={handleChallengePlayer}
                  isLobbyPending={lobbyPending}
                />
              </div>
            </div>

            {/* Sidebar Leaderboards Panel */}
            <div className="lg:col-span-4">
              <Leaderboard 
                entries={leaderboard} 
                currentUsername={player.name} 
              />
            </div>

          </div>
        )}

        {/* ACTIVE PLAYING CHESS MATCH SCREEN */}
        {hasConfirmedName && player && activeGame && (
          <div id="active-game-screen" className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start duration-500 animate-fade-in">
            
            {/* Large Interactive Chess Panel */}
            <div className="lg:col-span-8 flex flex-col items-center">
              
              {/* Top Bar Turn Monitor */}
              <div className="w-full flex justify-between items-center bg-[#15110d] border border-[#2d2218] px-5 py-3 rounded-2xl mb-4 shadow-lg select-none">
                <div className="flex items-center gap-3">
                  <div className={`w-3.5 h-3.5 rounded-full ${activeGame.turn === 'w' ? 'bg-amber-100 border border-stone-300' : 'bg-stone-900 border border-[#2d2218]'} ring-2 ring-amber-500/30 animate-pulse`} />
                  <span className="text-xs text-stone-300 font-medium">
                    Tocca a: <strong className="text-amber-400 capitalize">{activeGame.turn === 'w' ? 'Bianco' : 'Nero'}</strong>
                  </span>
                  {isAiThinking && (
                    <span className="text-[10px] text-amber-600 font-mono animate-pulse ml-2">
                      (Il Computer sta pensando...)
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-stone-500 font-mono">
                    Partita: {activeGame.isVsComputer ? `Computer AI (${activeGame.difficulty})` : 'Online multiplayer'}
                  </span>
                </div>
              </div>

              {/* The Actual Tabletop Chessboard */}
              {(() => {
                const opponent = activeGame.isVsComputer
                  ? activeGame.blackPlayer
                  : (playerColor === 'w' ? activeGame.blackPlayer : activeGame.whitePlayer);

                const selfPlayer = activeGame.isVsComputer
                  ? activeGame.whitePlayer
                  : (playerColor === 'w' ? activeGame.whitePlayer : activeGame.blackPlayer);

                return (
                  <>
                    {/* Opponent Profile Card */}
                    <div className="w-full flex items-center justify-between bg-stone-950/40 border border-[#2d2218]/40 px-4 py-2.5 rounded-xl mb-3 shadow select-none">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded bg-stone-900 border border-amber-900/20 flex items-center justify-center text-xs font-serif">
                          {opponent.id === 'computer' ? '🤖' : '👤'}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-amber-200">
                            Avversario: <span className="text-amber-100 font-serif font-bold italic">{opponent.name}</span>
                          </p>
                          <p className="text-[10px] text-stone-500 font-mono">Rating: {opponent.rating} Elo</p>
                        </div>
                      </div>
                      {activeGame.turn === (playerColor === 'w' ? 'b' : 'w') && (
                        <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded animate-pulse font-mono uppercase tracking-wider">
                          Sta pensando...
                        </span>
                      )}
                    </div>

                    <ChessBoard
                      game={activeGame}
                      playerColor={playerColor}
                      interactive={activeGame.status === 'attivo'}
                      onMove={handleChessMove}
                    />

                    {/* Self Profile Card */}
                    <div className="w-full flex items-center justify-between bg-stone-950/40 border border-[#2d2218]/40 px-4 py-2.5 rounded-xl mt-3 shadow select-none">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded bg-stone-900 border border-amber-900/20 flex items-center justify-center text-xs font-serif text-amber-500">
                          👤
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-stone-300">
                            Tu: <span className="text-stone-100 font-serif font-bold italic">{selfPlayer?.name || player.name}</span>
                          </p>
                          <p className="text-[10px] text-stone-500 font-mono">Rating: {selfPlayer?.rating || player.rating} Elo</p>
                        </div>
                      </div>
                      {activeGame.turn === playerColor && (
                        <span className="text-[9px] bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded animate-pulse font-mono uppercase tracking-wider">
                          Tocca a te!
                        </span>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Sidebar drawer: Chats, logs and actions */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Chess Match Actions & Notation lists */}
              <div className="glass-panel border border-[#2d2218] p-5 rounded-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[300px]">
                <div className="flex items-center justify-between mb-3 border-b border-amber-950/40 pb-2.5">
                  <span className="font-serif text-sm font-bold text-amber-100 tracking-wider">
                    Cronologia Mosse
                  </span>
                  <Award className="w-4 h-4 text-amber-500" />
                </div>

                {/* Staggered moves records in classic desktop chess form */}
                <div className="flex-1 overflow-y-auto font-mono text-xs text-stone-400 space-y-1.5 max-h-[140px] pr-1">
                  {activeGame.moves.length === 0 ? (
                    <p className="text-stone-600 italic text-center text-xs py-4">Nessuna mossa ancora.</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 pl-2">
                      {activeGame.moves.reduce((acc: string[][], m, i) => {
                        if (i % 2 === 0) {
                          acc.push([`${Math.floor(i/2) + 1}. ${m.notation}`]);
                        } else {
                          acc[acc.length - 1].push(m.notation);
                        }
                        return acc;
                      }, []).map((round, index) => (
                        <div key={`m_${index}`} className="flex justify-between border-b border-amber-950/10 py-1 font-semibold">
                          <span className="text-amber-500/90">{round[0]}</span>
                          <span className="text-stone-300 pr-4">{round[1] || ''}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-amber-950/40 flex gap-3">
                  <button
                    id="resign-current-match-btn"
                    disabled={activeGame.status !== 'attivo'}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all outline-none duration-150 cursor-pointer ${
                      activeGame.status !== 'attivo'
                        ? 'bg-stone-800 text-stone-600 border border-stone-900 cursor-not-allowed opacity-55'
                        : 'bg-rose-950/20 hover:bg-rose-900/30 text-rose-400 border border-rose-900/30 active:scale-95'
                    }`}
                    onClick={handleResign}
                  >
                    Abbandona Partita
                  </button>

                  <button
                    id="lobby-return-quit-btn"
                    className="flex-1 py-2 bg-stone-900 hover:bg-stone-800 text-stone-300 text-xs font-bold border border-stone-800 rounded-xl transition-all duration-150 active:scale-95 outline-none cursor-pointer"
                    onClick={quitToLobby}
                  >
                    Torna alla Lobby
                  </button>
                </div>
              </div>

              {/* Chat room sync drawer */}
              <Chat
                messages={activeGame.chat}
                playerUsername={player.name}
                onSendMessage={handleSendChatMessage}
              />

            </div>

          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-stone-900/80 bg-stone-950/60 py-4.5 px-6 select-none relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-stone-600 text-[10px] font-mono text-center sm:text-left">
          Scacchi di Legno © 2026 • Realizzato in React & WebSockets per un'esperienza a latenza ultra-bassa.
        </p>
        <div className="flex items-center gap-2">
          <a 
            href="#/admin" 
            onClick={() => {
              window.location.hash = '#/admin';
              window.location.reload();
            }}
            className="text-amber-500/80 hover:text-amber-400 text-[10px] font-mono tracking-wider flex items-center gap-1 border border-amber-900/30 bg-amber-950/10 px-2.5 py-1 rounded hover:bg-amber-950/20 transition-all cursor-pointer"
          >
            <ShieldCheck className="w-3 h-3" /> Area Amministratore
          </a>
        </div>
      </footer>

      {/* MATCH TERMINAL STATE OUTCOME MODALS OVERLAY */}
      {player && activeGame && (activeGame.status === 'scacco_matto' || activeGame.status === 'patta' || activeGame.status === 'abbandono') && (
        <div id="match-outcome-popup" className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-6 duration-300">
          <div className="bg-gradient-to-b from-[#251711] to-[#0c0806] border-2 border-amber-600/30 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl relative">
            
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(217,119,6,0.1)_0%,transparent_70%)] pointer-events-none" />

            <div className="w-16 h-16 rounded-full bg-amber-950/25 border border-amber-500/25 flex items-center justify-center mx-auto mb-4 text-amber-400">
              <Award className="w-9 h-9 animate-bounce" />
            </div>

            <h2 className="font-serif text-2xl font-black text-amber-100 mb-2">
              Partita Conclusa
            </h2>

            <div className="my-5 p-4 bg-stone-950/60 rounded-xl border border-amber-950/30">
              {activeGame.status === 'scacco_matto' && (
                <div>
                  <p className="text-sm text-stone-300">
                    Fine della partita per <strong className="text-amber-400">Scacco Matto</strong>!
                  </p>
                  <p className="text-xs text-stone-500 mt-1.5">
                    Vincitore: <strong className="text-amber-200">
                      {activeGame.winnerId === player.id ? 'Tu' : (activeGame.winnerId === 'computer' ? 'Computer AI' : 'Il tuo avversario')}
                    </strong>
                  </p>
                </div>
              )}

              {activeGame.status === 'abbandono' && (
                <div>
                  <p className="text-sm text-stone-300">
                    La partita si è conclusa per <strong className="text-amber-400">Abbandono</strong>.
                  </p>
                  <p className="text-xs text-stone-400 mt-1.5">
                    {activeGame.winnerId === player.id ? 'Hai vinto la partita!' : 'Il tuo avversario ha vinto la partita.'}
                  </p>
                </div>
              )}

              {activeGame.status === 'patta' && (
                <p className="text-sm text-stone-300">
                  La partita si è conclusa in parità per <strong className="text-amber-400">Stallo</strong>.
                </p>
              )}
            </div>

            <button
              id="close-match-outcome-btn"
              className="px-6 py-3 bg-gradient-to-r from-amber-700 to-amber-900 hover:from-amber-600 hover:to-amber-800 text-amber-100 rounded-xl font-bold text-xs border border-amber-500/10 shadow-lg cursor-pointer transform transition active:scale-95 outline-none w-full"
              onClick={quitToLobby}
            >
              Ritorna alla Lobby
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
