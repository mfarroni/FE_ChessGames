/**
 * Versione: 1.1.0
 * Data e Ora Modifica: 04/07/2026 (Ora di Roma)
 * Problema Risolto: Aggiunta la gestione del consenso privacy in Registrazione (stato `privacyAccepted`, validazione obbligatoria prima della chiamata al backend, invio di `privacyAccepted`/`privacyPolicyVersion` all'API di registrazione).
 */

import React, { ReactNode, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Player, ChessGame, Square, LeaderboardEntry, ChatMessage, ChessPiece } from '../types';
import { executeMove, getComputerMove, INITIAL_FEN, parseFen, isCheckmate, isStalemate, squareToCoords } from '../utils/chessLogic';
import { API_BASE_URL, getWebSocketUrl } from '../utils/apiConfig';
import { AudioEngine } from '../components/AudioEngine';
import IdleWarningModal from '../components/IdleWarningModal';
import { SessionContext, SessionContextValue } from './useSession';
import { useInactivityLogout } from './useInactivityLogout';
import { PRIVACY_POLICY_VERSION } from '../constants/privacy';

const PUBLIC_PATHS = new Set(['/', '/login', '/register']);

export default function SessionProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();

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
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

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

    if (import.meta.env.DEV) console.log('[ChessClient] Establishing WebSocket to:', socketUrl);
    setConnectionStatus('connecting');
    const socket = new WebSocket(socketUrl);

    socket.onopen = () => {
      if (import.meta.env.DEV) console.log('[ChessClient] WebSocket connected successfully.');
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
          navigate('/game');
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Once the player's identity is confirmed (login, registration, OTP verification
  // or guest registration acknowledged by the server), leave the public auth pages
  // and enter the lobby. This covers the guest flow, whose confirmation only
  // arrives asynchronously through the 'connect_ack' WebSocket message above.
  useEffect(() => {
    if (hasConfirmedName && PUBLIC_PATHS.has(location.pathname)) {
      navigate('/lobby', { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasConfirmedName]);

  // Handle register request on backend with Captcha and Email verification
  const handleAuthRegister = async (e: React.FormEvent, marketingConsent: boolean = false, thirdPartyMarketingConsent: boolean = false) => {
    e.preventDefault();
    setRegError('');
    setRegSuccess('');

    if (!regUsername.trim() || !regEmail.trim() || !regPassword || !captchaAnswer.trim()) {
      setRegError('Tutti i campi, compreso il CAPTCHA, sono obbligatori.');
      return;
    }

    if (!privacyAccepted) {
      setRegError('Devi accettare l\'informativa sulla privacy per registrarti.');
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
          captchaAnswer: captchaAnswer.trim(),
          privacyAccepted: true,
          privacyPolicyVersion: PRIVACY_POLICY_VERSION,
          // Consensi marketing opzionali (non condizionano la registrazione).
          marketingConsent,
          thirdPartyMarketingConsent,
          marketingConsentPolicyVersion: PRIVACY_POLICY_VERSION
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
        navigate('/lobby', { replace: true });
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
        setRegSuccess('');
        navigate('/lobby', { replace: true });
        alert('Email verificata con successo! Benvenuto nel club!');
      } else {
        alert(data.message || 'Codice errato. Riprova.');
      }
    } catch (err) {
      alert('Errore di connessione durante la verifica.');
    }
  };

  // Guest access flow (name only, no account)
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
    setActiveGame(null);

    // Re-register as guest on server so name is freed up
    if (ws && connectionStatus === 'connected') {
      const guestNum = Math.floor(1000 + Math.random() * 9000);
      ws.send(JSON.stringify({
        type: 'register_player',
        payload: { name: `Ospite_${guestNum}` }
      }));
    }
  };

  const handleLogoutAndRedirect = () => {
    handleLogout();
    navigate('/login', { replace: true });
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
    navigate('/game');
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    navigate('/lobby', { replace: true });
  };

  // Inactivity / idle session timeout (30 min, with a 2 min warning if a game is active)
  const { idleWarningVisible, stayLoggedIn } = useInactivityLogout({
    player,
    activeGame,
    onLogout: handleLogout,
    navigate
  });

  const value: SessionContextValue = {
    player,
    hasConfirmedName,

    usernameInput,
    setUsernameInput,
    registerError,

    isEditingName,
    setIsEditingName,
    newNameInput,
    setNewNameInput,
    handleRenameSubmit,

    regUsername,
    setRegUsername,
    regEmail,
    setRegEmail,
    regPassword,
    setRegPassword,
    regError,
    regSuccess,
    privacyAccepted,
    setPrivacyAccepted,

    loginUsername,
    setLoginUsername,
    loginPassword,
    setLoginPassword,
    loginError,

    captchaSvg,
    captchaAnswer,
    setCaptchaAnswer,
    loadCaptcha,
    verificationStep,
    setVerificationStep,
    verifyCode,
    setVerifyCode,
    unverifiedUserEmail,
    handleResendCode,

    onlinePlayers,
    leaderboard,
    activeGamesCount,

    activeGame,
    playerColor,

    incomingChallenge,
    pendingChallengeTarget,

    connectionStatus,
    lobbyPending,

    ambienceEnabled,
    handleToggleAmbience,

    isAiThinking,
    difficulty,
    setDifficulty,

    handleAuthRegister,
    handleAuthLogin,
    handleVerifyEmailCode,
    handleRegister,
    handleLogout: handleLogoutAndRedirect,

    startComputerMatch,
    handleChallengePlayer,
    handleAcceptChallenge,
    handleDeclineChallenge,
    handleChessMove,
    handleSendChatMessage,
    handleResign,
    quitToLobby,

    idleWarningVisible,
    stayLoggedIn
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
      {idleWarningVisible && <IdleWarningModal onStayLoggedIn={stayLoggedIn} />}
    </SessionContext.Provider>
  );
}
