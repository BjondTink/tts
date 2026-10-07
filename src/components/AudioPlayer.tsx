import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  Download,
  RotateCcw,
  Volume2,
  VolumeX,
  Sliders,
  Sparkles,
  Music,
  Check,
  Radio,
  FileAudio,
} from 'lucide-react';
import { base64ToArrayBuffer, audioBufferToMp3Blob, renderProcessedAudio } from '../utils/audioEngine.ts';

interface AudioPlayerProps {
  wavBase64: string;
  mp3Base64?: string;
  voiceName: string;
  toneUsed: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  wavBase64,
  mp3Base64,
  voiceName,
  toneUsed,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [volume, setVolume] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState(false);

  // Audio effects
  const [bassBoost, setBassBoost] = useState(false);
  const [clarity, setClarity] = useState(false);
  const [roomReverb, setRoomReverb] = useState(false);

  // Export states
  const [isExporting, setIsExporting] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const decodedBufferRef = useRef<AudioBuffer | null>(null);

  // Load and decode audio buffer when wavBase64 changes
  useEffect(() => {
    if (!wavBase64) return;

    const loadAudio = async () => {
      try {
        const arrayBuf = base64ToArrayBuffer(wavBase64);
        if (!arrayBuf || arrayBuf.byteLength === 0) return;

        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;

        const ctx = new AudioCtx();
        audioContextRef.current = ctx;

        // Decode audio data for offline rendering / effects
        const decoded = await ctx.decodeAudioData(arrayBuf.slice(0));
        decodedBufferRef.current = decoded;
        setDuration(decoded.duration);
        setCurrentTime(0);
        setIsPlaying(false);
      } catch (err) {
        console.warn('Audio decode notice:', err);
      }
    };

    loadAudio();
  }, [wavBase64]);

  // Update playback rate and volume on HTMLAudioElement
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch((e) => console.error(e));
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current && audioRef.current.duration) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const restartAudio = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  // Format seconds to mm:ss
  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Download MP3 (.mp3)
  const handleDownloadMp3 = async () => {
    setIsExporting(true);
    setExportNotice('Duke përgatitur skedarin MP3...');

    try {
      // If user adjusted speed or audio effects, re-render through AudioContext to bake in changes!
      const hasCustomProcessing = playbackSpeed !== 1.0 || bassBoost || clarity || roomReverb;

      let blob: Blob;

      if (hasCustomProcessing && decodedBufferRef.current) {
        const processedBuffer = await renderProcessedAudio(decodedBufferRef.current, {
          speed: playbackSpeed,
          bassBoost,
          clarity,
          reverb: roomReverb,
        });
        blob = audioBufferToMp3Blob(processedBuffer, 192);
      } else if (mp3Base64) {
        // Direct MP3 already generated from server
        const arrayBuf = base64ToArrayBuffer(mp3Base64);
        blob = new Blob([arrayBuf], { type: 'audio/mp3' });
      } else if (decodedBufferRef.current) {
        blob = audioBufferToMp3Blob(decodedBufferRef.current, 192);
      } else {
        throw new Error('Audio nuk është gati për shkarkim.');
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const filename = `TTS-RealEstate-${voiceName.toLowerCase()}-${Date.now()}.mp3`;
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportNotice('Skedari MP3 u shkarkua me sukses!');
      setTimeout(() => setExportNotice(null), 3500);
    } catch (err: any) {
      console.error('Export error:', err);
      setExportNotice('Gabim gjatë shkarkimit: ' + (err.message || 'Provo përsëri'));
      setTimeout(() => setExportNotice(null), 4000);
    } finally {
      setIsExporting(false);
    }
  };

  // Download WAV (.wav)
  const handleDownloadWav = () => {
    try {
      const arrayBuf = base64ToArrayBuffer(wavBase64);
      const blob = new Blob([arrayBuf], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `TTS-RealEstate-${voiceName.toLowerCase()}-${Date.now()}.wav`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('WAV download error:', err);
    }
  };

  return (
    <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-emerald-500/30 rounded-2xl p-5 shadow-xl text-slate-100">
      {/* Hidden audio element for smooth native streaming playback */}
      <audio
        ref={audioRef}
        src={`data:audio/wav;base64,${wavBase64}`}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
      />

      {/* Header bar of the player */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white">Audio e Gjeneruar</span>
              <span className="text-[11px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 font-medium">
                Zëri: {voiceName}
              </span>
              <span className="text-[11px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                {toneUsed}
              </span>
            </div>
            <p className="text-xs text-slate-400">Format MP3 192kbps / WAV 24kHz</p>
          </div>
        </div>

        {/* Action badges */}
        <div className="flex items-center gap-2">
          {exportNotice && (
            <span className="text-xs bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 px-3 py-1.5 rounded-lg animate-fade-in flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              {exportNotice}
            </span>
          )}
        </div>
      </div>

      {/* Progress scrubber & timeline */}
      <div className="space-y-1.5 mb-5">
        <div className="relative group">
          <input
            type="range"
            min="0"
            max={duration || 100}
            step="0.05"
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-400 focus:outline-none transition-all"
          />
        </div>
        <div className="flex justify-between text-xs text-slate-400 font-mono">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Primary Playback controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={restartAudio}
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Kthehu në fillim"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={togglePlay}
            className="w-13 h-13 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 flex items-center justify-center font-bold shadow-lg shadow-emerald-500/25 transition-all hover:scale-105 active:scale-95"
            title={isPlaying ? 'Pauzë' : 'Luaj'}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 fill-slate-950" />
            ) : (
              <Play className="w-6 h-6 fill-slate-950 ml-0.5" />
            )}
          </button>

          {/* Volume slider */}
          <div className="flex items-center gap-2 bg-slate-950/60 border border-slate-800/80 rounded-xl px-3 py-1.5">
            <button
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              className="text-slate-400 hover:text-slate-200 transition-colors"
              title={isMuted ? 'Aktivizo zërin' : 'Hesht'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-red-400" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                setVolume(parseFloat(e.target.value));
                if (isMuted) setIsMuted(false);
              }}
              className="w-16 h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-emerald-500"
            />
          </div>
        </div>

        {/* Speed Controls */}
        <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800/80 p-1.5 rounded-xl">
          <span className="text-xs text-slate-400 px-2 font-medium">Shpejtësia:</span>
          {[0.8, 1.0, 1.15, 1.25, 1.5].map((speed) => (
            <button
              key={speed}
              type="button"
              onClick={() => setPlaybackSpeed(speed)}
              className={`text-xs px-2.5 py-1 rounded-lg font-mono transition-all ${
                playbackSpeed === speed
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {speed}x
            </button>
          ))}
        </div>
      </div>

      {/* Sound Effects & Filters */}
      <div className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-xl mb-6">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold text-slate-200">
              Efektet e Zërit (Përmirësim Akustik)
            </span>
          </div>
          <span className="text-[11px] text-slate-400">Zbatohen automatikisht në MP3</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {/* Bass boost */}
          <button
            type="button"
            onClick={() => setBassBoost(!bassBoost)}
            className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between ${
              bassBoost
                ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200 shadow-sm'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div>
              <p className="text-xs font-medium text-slate-200">📻 Ngrohtësi & Bas</p>
              <p className="text-[10px] text-slate-400">Zë i thellë radiofonik</p>
            </div>
            <div
              className={`w-4 h-4 rounded border flex items-center justify-center ${
                bassBoost ? 'bg-emerald-500 border-emerald-500 text-slate-950' : 'border-slate-700'
              }`}
            >
              {bassBoost && <Check className="w-3 h-3 stroke-[3]" />}
            </div>
          </button>

          {/* Clarity */}
          <button
            type="button"
            onClick={() => setClarity(!clarity)}
            className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between ${
              clarity
                ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200 shadow-sm'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div>
              <p className="text-xs font-medium text-slate-200">🎙️ Qartësi Studio</p>
              <p className="text-[10px] text-slate-400">Artikulim i mprehtë</p>
            </div>
            <div
              className={`w-4 h-4 rounded border flex items-center justify-center ${
                clarity ? 'bg-emerald-500 border-emerald-500 text-slate-950' : 'border-slate-700'
              }`}
            >
              {clarity && <Check className="w-3 h-3 stroke-[3]" />}
            </div>
          </button>

          {/* Room Reverb */}
          <button
            type="button"
            onClick={() => setRoomReverb(!roomReverb)}
            className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between ${
              roomReverb
                ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200 shadow-sm'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div>
              <p className="text-xs font-medium text-slate-200">🏛️ Akustikë Dhome</p>
              <p className="text-[10px] text-slate-400">Prezencë hapësire të gjerë</p>
            </div>
            <div
              className={`w-4 h-4 rounded border flex items-center justify-center ${
                roomReverb ? 'bg-emerald-500 border-emerald-500 text-slate-950' : 'border-slate-700'
              }`}
            >
              {roomReverb && <Check className="w-3 h-3 stroke-[3]" />}
            </div>
          </button>
        </div>
      </div>

      {/* Main Download Actions */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        {/* Primary MP3 Download Button */}
        <button
          type="button"
          onClick={handleDownloadMp3}
          disabled={isExporting}
          className="w-full sm:flex-1 py-3 px-5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-[0.99] text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
        >
          <Download className="w-4 h-4 stroke-[2.5]" />
          <span>{isExporting ? 'Duke shkarkuar...' : 'Shkarko Audio (.mp3)'}</span>
          <span className="text-xs bg-slate-950/20 px-2 py-0.5 rounded font-mono font-normal">
            192 kbps
          </span>
        </button>

        {/* Secondary WAV Download */}
        <button
          type="button"
          onClick={handleDownloadWav}
          className="w-full sm:w-auto py-3 px-4 rounded-xl border border-slate-700 hover:border-slate-600 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
          title="Shkarko formatin origjinal WAV pa ngjeshje"
        >
          <FileAudio className="w-4 h-4 text-slate-400" />
          <span>Shkarko si WAV (.wav)</span>
        </button>
      </div>
    </div>
  );
};
