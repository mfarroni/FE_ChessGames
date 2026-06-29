import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  AlertCircle
} from 'lucide-react';
import { API_BASE_URL, getResourceUrl } from '../utils/apiConfig';

interface MusicTrack {
  id: string;
  name: string;
  url: string;
  isLocal?: boolean;
}

export default function MusicPlayer() {
  // Audio Playback states
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.4);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [audioError, setAudioError] = useState<string | null>(null);

  // Refs & synchronization with isPlaying state to avoid stale closure issues
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isPlayingRef = useRef<boolean>(false);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Load tracks on mount
  const fetchTracks = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/music`);
      const data = await res.json();
      if (data.success && data.tracks) {
        setTracks(data.tracks);
      }
    } catch (err) {
      console.error('Errore nel caricamento delle musiche:', err);
    }
  };

  useEffect(() => {
    fetchTracks();
  }, []);

  // Set up audio object & handlers
  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    audio.loop = false; // We handle track ending manually or loop list
    audio.volume = isMuted ? 0 : volume;

    const handleEnded = () => {
      // Auto-advance to next track
      if (tracks.length > 0) {
        setCurrentTrackIndex((prevIndex) => (prevIndex + 1) % tracks.length);
      }
    };

    const handleCanPlay = () => {
      setAudioError(null);
    };

    const handleError = () => {
      if (audio.error) {
        // Code 1 is MEDIA_ERR_ABORTED, which can be normal when changing src.
        if (audio.error.code === 1) return;
        console.warn('Audio load error:', audio.error);
        
        // ONLY trigger visible error warning to the player if they are actively trying to play
        if (isPlayingRef.current) {
          setAudioError('Impossibile riprodurre questa traccia d\'atmosfera.');
          setIsPlaying(false);
        }
      }
    };

    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);

    return () => {
      audio.pause();
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
    };
  }, [tracks]);

  // Handle playing, pausing, track changes, and lazy-loading
  useEffect(() => {
    if (!audioRef.current) return;

    if (tracks.length === 0) {
      audioRef.current.pause();
      return;
    }

    const track = tracks[currentTrackIndex];
    if (!track) return;

    if (isPlaying) {
      const currentAbsoluteSrc = audioRef.current.src;
      const targetSrc = getResourceUrl(track.url);
      // Compare URLs safely whether relative or absolute
      const isSameTrack = currentAbsoluteSrc === targetSrc || 
                          (track.url.startsWith('/') && currentAbsoluteSrc.endsWith(track.url));

      if (!isSameTrack) {
        setAudioError(null);
        audioRef.current.src = targetSrc;
        audioRef.current.load();
      }

      audioRef.current.play().catch(err => {
        console.warn('Playback interrupted or prevented by browser policy:', err);
        if (err.name === 'NotAllowedError') {
          setIsPlaying(false);
        } else if (err.name !== 'AbortError') {
          setAudioError('Impossibile riprodurre questa traccia d\'atmosfera. Controlla l\'URL.');
          setIsPlaying(false);
        }
      });
    } else {
      audioRef.current.pause();
    }
  }, [currentTrackIndex, tracks, isPlaying]);

  // Handle volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const togglePlay = () => {
    if (tracks.length === 0) return;
    setIsPlaying(!isPlaying);
  };

  const handleTrackChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const idx = parseInt(e.target.value, 10);
    setCurrentTrackIndex(idx);
    setIsPlaying(true);
  };

  return (
    <div id="music-player-widget" className="flex items-center gap-2 bg-[#241c14] px-3 py-1.5 rounded-xl border border-[#3d2f21]">
      <button 
        onClick={togglePlay}
        disabled={tracks.length === 0}
        className={`p-1.5 rounded-lg text-amber-100 hover:bg-amber-900/30 transition-colors ${isPlaying ? 'animate-pulse text-amber-400' : 'text-amber-500/80'}`}
        title={isPlaying ? "Sospendi musica" : "Riproduci musica di sottofondo"}
      >
        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
      </button>

      <div className="flex flex-col min-w-[110px] md:min-w-[130px]">
        {tracks.length > 0 ? (
          <select 
            value={currentTrackIndex} 
            onChange={handleTrackChange}
            className="bg-black/60 text-[10px] text-amber-200/90 py-0.5 px-1 rounded border border-amber-900/20 max-w-[150px] outline-none font-sans cursor-pointer"
          >
            {tracks.map((track, idx) => (
              <option key={track.id} value={idx} className="bg-[#15110d] text-amber-100">
                {track.name}
              </option>
            ))}
          </select>
        ) : (
          <span className="text-[10px] text-amber-500/50">Nessuna musica</span>
        )}
      </div>

      <div className="flex items-center gap-1.5 border-l border-[#3d2f21] pl-2">
        <button 
          onClick={() => setIsMuted(!isMuted)}
          className="text-amber-500 hover:text-amber-300 transition-colors p-1 cursor-pointer"
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
        </button>
        <input 
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={volume}
          onChange={(e) => {
            setVolume(parseFloat(e.target.value));
            setIsMuted(false);
          }}
          className="w-12 h-1 accent-amber-500 rounded bg-black/60 cursor-pointer appearance-none outline-none"
          title="Volume musica"
        />
      </div>

      {/* Floating alert for audio loading error */}
      {audioError && (
        <div className="absolute top-18 right-8 bg-red-950/90 border border-red-500/50 rounded-xl px-4 py-2.5 flex items-center gap-2 text-xs text-red-200 z-50 animate-bounce shadow-lg">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{audioError}</span>
        </div>
      )}
    </div>
  );
}
