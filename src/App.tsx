/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Volume2,
  Wand2,
  Sparkles,
  Play,
  RotateCcw,
  Building,
  Check,
  AlertCircle,
  Clock,
  FileText,
  Trash2,
  Sliders,
  Copy,
  Layers,
  ChevronRight,
  Info,
} from 'lucide-react';
import { VoiceSelector, VoiceItem } from './components/VoiceSelector.tsx';
import { AudioPlayer } from './components/AudioPlayer.tsx';
import { GrammarFixModal } from './components/GrammarFixModal.tsx';

// Preset real estate tones
const REAL_ESTATE_TONES = [
  { id: 'Profesional', label: '👔 Profesional & Bindës', desc: 'I ekuilibruar, serioz dhe me besueshmëri' },
  { id: 'Luksoz', label: '💎 Luksoz & Qetë', desc: 'Prezantim elitar për vila dhe apartamente premium' },
  { id: 'Entuziast', label: '🤝 Entuziast & Mikpritës', desc: 'I ngrohtë, mikpritës për shtëpi familjare' },
  { id: 'Dinamik', label: '🚀 Dinamik (Reels & TikTok)', desc: 'Ritëm i shpejtë dhe energjik për video promovuese' },
  { id: 'Urgjent', label: '⚡ Ofertë Okazion / Urgjent', desc: 'Fokus tek çmimi i favorshëm dhe koha e kufizuar' },
];

// Speed instruction options for Gemini TTS prompt
const SPEED_PROMPT_OPTIONS = [
  { id: 'Normal', label: 'Normale (1.0x)' },
  { id: 'E qetë dhe e shtruar', label: 'E shtruar & e qetë (0.9x)' },
  { id: 'Pak më e shpejtë', label: 'Më e shpejtë (1.15x)' },
  { id: 'Dinamike', label: 'Dinamike / Video (1.25x)' },
];

export default function App() {
  // State
  const [text, setText] = useState<string>(
    'Shitet apartament modern 2+1 ne nje nga zonat me te mira te Tiranes. Siperfaqe 95 metra katrore me ndricim natyral, dy tualete dhe ballkon me pamje fantastike. Pallat i ri me ashensor dhe dokumentacion te rregullt hipotekor. Kontaktoni per nje vizite ne prone!'
  );
  const [voices, setVoices] = useState<VoiceItem[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>('Kore');
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

  // Grammar fix state
  const [isFixingGrammar, setIsFixingGrammar] = useState<boolean>(false);
  const [grammarModalData, setGrammarModalData] = useState<{
    isOpen: boolean;
    originalText: string;
    correctedText: string;
    summaryOfFixes: string[];
    mode: 'grammar' | 'enhance';
  }>({
    isOpen: false,
    originalText: '',
    correctedText: '',
    summaryOfFixes: [],
    mode: 'grammar',
  });

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

  // Handle Grammar Fix
  const handleFixGrammar = async (mode: 'grammar' | 'enhance') => {
    if (!text.trim()) return;
    setIsFixingGrammar(true);
    setGenerationError(null);

    try {
      const res = await fetch('/api/grammar/fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim(), mode }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Nuk u arrit të rregullohej teksti.');
      }

      setGrammarModalData({
        isOpen: true,
        originalText: text,
        correctedText: data.correctedText || text,
        summaryOfFixes: data.summaryOfFixes || ['U rregulluan shenjat dhe drejtshkrimi'],
        mode,
      });
    } catch (err: any) {
      console.warn('Grammar fix notice:', err);
      let userFriendlyMsg = 'Modeli AI ka ngarkesë të përkohshme. Ju lutem provoni përsëri pas pak sekondash.';
      if (err?.message && !err.message.includes('{') && !err.message.includes('503')) {
        userFriendlyMsg = err.message;
      }
      setGenerationError(userFriendlyMsg);
    } finally {
      setIsFixingGrammar(false);
    }
  };

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

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Dështoi gjenerimi i audios.');
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
      if (err?.message && !err.message.includes('{') && !err.message.includes('503')) {
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

              {/* Text Metrics & Grammar Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                {/* Metrics */}
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

                {/* Grammar Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleFixGrammar('grammar')}
                    disabled={isFixingGrammar || !text.trim()}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                    title="Korrigjon shkronjat ë, ç, gabimet e shkrimit dhe pikësimin"
                  >
                    <Wand2 className={`w-3.5 h-3.5 ${isFixingGrammar ? 'animate-spin' : ''}`} />
                    <span>{isFixingGrammar ? 'Duke rregulluar...' : 'Rregullim Gramatikor'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleFixGrammar('enhance')}
                    disabled={isFixingGrammar || !text.trim()}
                    className="px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                    title="Optimizon tekstin për reklamë tërheqëse shitjeje"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Optimizim Pronash</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Tone & Style Configuration */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Sliders className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-semibold text-white">Tonaliteti i Njoftimit</h3>
                </div>
                <p className="text-xs text-slate-400">
                  Zgjidh stilin e prezantimit sipas llojit të pronës
                </p>
              </div>

              {/* Tone Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {REAL_ESTATE_TONES.map((tone) => {
                  const isSelected = selectedTone === tone.id;
                  return (
                    <button
                      key={tone.id}
                      type="button"
                      onClick={() => setSelectedTone(tone.id)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                      }`}
                    >
                      <p className="text-xs font-semibold text-slate-100 mb-1">{tone.label}</p>
                      <p className="text-[11px] text-slate-400 leading-snug">{tone.desc}</p>
                    </button>
                  );
                })}
              </div>

              {/* Speed Prompt / Pace Selector */}
              <div className="pt-2 border-t border-slate-800/80">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-semibold text-slate-200">
                    Ritmi i Leximit (TTS Tempo):
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Kërkesë artikulimi për Gemini
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {SPEED_PROMPT_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSpeedPrompt(opt.id)}
                      className={`py-2 px-2.5 rounded-xl border text-xs font-medium text-center transition-all ${
                        speedPrompt === opt.id
                          ? 'bg-emerald-500 text-slate-950 font-bold border-emerald-500 shadow-sm'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
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
                    <span>Duke gjeneruar audion me Gemini AI...</span>
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

            {/* Real Estate Tips Card */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 text-xs text-slate-400 space-y-2">
              <div className="flex items-center gap-2 text-slate-200 font-semibold">
                <Info className="w-4 h-4 text-emerald-400" />
                <span>Këshilla për Pronat në Video:</span>
              </div>
              <ul className="space-y-1.5 list-disc list-inside text-slate-300/90 leading-relaxed">
                <li>
                  Përdor butonin <strong>Rregullim Gramatikor</strong> për të vendosur saktë ë/ç dhe presjet, sepse AI lexon pauza tek çdo presje dhe pikë.
                </li>
                <li>
                  Zërat mashkullorë si <strong>Charon</strong> dhe <strong>Fenrir</strong> janë perfektë për vila luksoze dhe investime.
                </li>
                <li>
                  Zërat femërorë si <strong>Kore</strong> dhe <strong>Zephyr</strong> janë idealë për apartamente familjare dhe ture shtëpish.
                </li>
              </ul>
            </div>
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

      {/* Grammar Fix Side-by-Side Modal */}
      <GrammarFixModal
        isOpen={grammarModalData.isOpen}
        onClose={() => setGrammarModalData((prev) => ({ ...prev, isOpen: false }))}
        originalText={grammarModalData.originalText}
        correctedText={grammarModalData.correctedText}
        summaryOfFixes={grammarModalData.summaryOfFixes}
        mode={grammarModalData.mode}
        onAccept={(newText) => {
          setText(newText);
        }}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-center text-xs text-slate-500 mt-12">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">TTS</span>
            <span>—</span>
            <span>Studio Audio për Njoftime Real Estate në Shqip</span>
          </div>
          <div className="text-slate-400">
            Mundësuar me Dashuri nga Reni • Shkarkim .mp3
          </div>
        </div>
      </footer>
    </div>
  );
}
