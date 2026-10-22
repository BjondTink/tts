/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Volume2,
  Check,
  AlertCircle,
  Clock,
  FileText,
  Trash2,
  Copy,
} from 'lucide-react';
import { VoiceSelector, VoiceItem } from './components/VoiceSelector.tsx';
import { AudioPlayer } from './components/AudioPlayer.tsx';

const INITIAL_VOICES: VoiceItem[] = [
  {
    id: 'Charon',
    name: 'Charon (Mashkull - Primar)',
    gender: 'Mashkull',
    toneDesc: 'Zë i thellë, autoritar, serioz dhe bindës',
    recommendedFor: 'Vila elitare, apartamente premium, video promocionale dhe njoftime shitjesh',
    samplePitch: 'E thellë / Bariton',
  },
  {
    id: 'Kore',
    name: 'Kore (Femër)',
    gender: 'Femër',
    toneDesc: 'E ngrohtë, e qetë, me artikulim kristal të pastër',
    recommendedFor: 'Apartamente luksoze, rezidenca private dhe prezantime të rafinuara',
    samplePitch: 'E mesme / E butë',
  },
];

export default function App() {
  // State
  const [text, setText] = useState<string>(
    'Shitet apartament modern 2+1 ne nje nga zonat me te mira te Tiranes. Siperfaqe 95 metra katrore me ndricim natyral, dy tualete dhe ballkon me pamje fantastike. Pallat i ri me ashensor dhe dokumentacion te rregullt hipotekor. Kontaktoni per nje vizite ne prone!'
  );
  const [voices, setVoices] = useState<VoiceItem[]>(INITIAL_VOICES);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>('Charon');
  const [selectedTone, setSelectedTone] = useState<string>('Profesional');
  const [speedPrompt, setSpeedPrompt] = useState<string>('Normal');

  // Generation status
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Audio result
  const [generatedAudio, setGeneratedAudio] = useState<{
    wavBase64: string;
    mp3Base64?: string;
    voiceUsed: string;
    toneUsed: string;
  } | null>(null);

  const [copiedNotification, setCopiedNotification] = useState<boolean>(false);

  // Fetch voices on mount
  useEffect(() => {
    fetch('/api/voices')
      .then((res) => res.json())
      .then((data) => {
        if (data.voices && data.voices.length > 0) {
          setVoices(data.voices);
        }
      })
      .catch((err) => console.error('Failed to load voices:', err));
  }, []);

  // Text statistics
  const textStats = useMemo(() => {
    const trimmed = text.trim();
    if (!trimmed) {
      return { words: 0, characters: 0, estimatedSeconds: 0 };
    }
    const words = trimmed.split(/\s+/).length;
    const characters = text.length;
    // Average speaking rate in Albanian ~ 130 words per minute (~2.16 words/sec)
    const estimatedSeconds = Math.max(1, Math.round(words / 2.2));
    return { words, characters, estimatedSeconds };
  }, [text]);

  // Handle Audio Generation
  const handleGenerateAudio = async () => {
    if (!text.trim()) {
      setGenerationError('Ju lutem shkruani ose ngjitni një tekst para se të gjeneroni audio.');
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);

    try {
      const res = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.trim(),
          voice: selectedVoiceId,
          tone: selectedTone,
          speedInstruction: speedPrompt,
        }),
      });

      if (!res.ok) {
        let errMsg = 'Dështoi gjenerimi i audios.';
        try {
          const errData = await res.json();
          if (errData?.error) errMsg = errData.error;
        } catch {
          errMsg = `Gabim nga serveri (${res.status}). Ju lutem provoni përsëri.`;
        }
        throw new Error(errMsg);
      }

      const data = await res.json();
      if (!data || !data.audioBase64) {
        throw new Error(data?.error || 'Nuk u morën të dhëna audio nga serveri.');
      }

      setGeneratedAudio({
        wavBase64: data.audioBase64,
        mp3Base64: data.mp3Base64,
        voiceUsed: data.voiceUsed || selectedVoiceId,
        toneUsed: data.toneUsed || selectedTone,
      });

      // Scroll smoothly to player
      setTimeout(() => {
        const playerElement = document.getElementById('audio-player-section');
        if (playerElement) {
          playerElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);
    } catch (err: any) {
      console.warn('TTS Generation notice:', err);
      let userFriendlyMsg = 'Ndodhi një gabim gjatë krijimit të audios. Ju lutem provoni përsëri pas pak sekondash.';
      if (
        err?.message &&
        !err.message.includes('{') &&
        !err.message.includes('503') &&
        !err.message.includes('expected pattern')
      ) {
        userFriendlyMsg = err.message;
      }
      setGenerationError(userFriendlyMsg);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyTextToClipboard = () => {
    navigator.clipboard.writeText(text);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg shadow-emerald-500/20 tracking-wider">
              TTS
            </div>
            <div>
              <h1 className="font-bold text-lg text-white tracking-tight">TTS</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1 w-full space-y-6">
        {/* Main Work Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left / Center Column: Text Input & Grammar Polish (7 cols on lg) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
              {/* Textarea Header */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <label htmlFor="tts-text-input" className="text-sm font-semibold text-white">
                    Teksti i Pronës (Shqip)
                  </label>
                </div>

                {/* Right toolbar buttons */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={copyTextToClipboard}
                    className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors text-xs flex items-center gap-1"
                    title="Kopjo tekstin"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{copiedNotification ? 'U kopjua!' : 'Kopjo'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setText('')}
                    className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors text-xs flex items-center gap-1"
                    title="Fshij tekstin"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Pastro</span>
                  </button>
                </div>
              </div>

              {/* Textarea */}
              <div className="relative">
                <textarea
                  id="tts-text-input"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Shkruani ose ngjisni përshkrimin e pronës këtu... P.sh.: Shitet apartament 2+1 tek Komuna e Parisit..."
                  rows={8}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all resize-y leading-relaxed"
                />
              </div>

              {/* Text Metrics */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                  <span>{textStats.words} fjalë</span>
                  <span>•</span>
                  <span>{textStats.characters} karaktere</span>
                  <span>•</span>
                  <span className="text-amber-400 font-sans flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Kohëzgjatja: ~{textStats.estimatedSeconds}s
                  </span>
                </div>
              </div>
            </div>

            {/* Error Message if any */}
            {generationError && (
              <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-rose-300">Njoftim</p>
                  <p className="text-xs text-rose-200/90">{generationError}</p>
                </div>
              </div>
            )}

            {/* BIG GENERATE AUDIO BUTTON */}
            <div>
              <button
                type="button"
                onClick={handleGenerateAudio}
                disabled={isGenerating || !text.trim()}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 active:scale-[0.99] text-slate-950 font-extrabold text-base flex items-center justify-center gap-3 shadow-xl shadow-emerald-500/25 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <div className="w-5 h-5 border-3 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                    <span>Duke gjeneruar audion...</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-5 h-5 stroke-[2.5]" />
                    <span>Gjenero Zërin (Audio)</span>
                    <span className="text-xs bg-slate-950/20 px-2.5 py-0.5 rounded-full font-sans font-semibold">
                      Zëri: {selectedVoiceId}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: Voice Selection Catalog (5 cols on lg) */}
          <div className="lg:col-span-5 space-y-4">
            <VoiceSelector
              voices={voices}
              selectedVoiceId={selectedVoiceId}
              onSelectVoice={(voiceId) => setSelectedVoiceId(voiceId)}
            />
          </div>
        </div>

        {/* Audio Player Section (Shows up as soon as audio is generated) */}
        {generatedAudio && (
          <div id="audio-player-section" className="pt-2 animate-fade-in">
            <AudioPlayer
              wavBase64={generatedAudio.wavBase64}
              mp3Base64={generatedAudio.mp3Base64}
              voiceName={generatedAudio.voiceUsed}
              toneUsed={generatedAudio.toneUsed}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-center text-xs text-slate-400 mt-12">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-center">
          <p>Mundësuar me Dashuri nga Reni</p>
        </div>
      </footer>
    </div>
  );
}
