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
  Sparkles,
} from 'lucide-react';
import { VoiceSelector, VoiceItem, LanguageCode, LANGUAGES } from './components/VoiceSelector.tsx';
import { AudioPlayer } from './components/AudioPlayer.tsx';

const INITIAL_VOICES: VoiceItem[] = [
  // 🇦🇱 Shqip
  {
    id: 'Charon',
    name: 'Charon',
    gender: 'Mashkull',
    language: 'sq',
    languageLabel: 'Shqip',
    flag: '🇦🇱',
    toneDesc: 'Zë i thellë, autoritar, serioz dhe shumë bindës',
    recommendedFor: 'Vila elitare, apartamente premium, video promocionale dhe njoftime shitjesh',
    samplePitch: 'E thellë / Bariton',
    isPrimary: true,
  },
  {
    id: 'Kore',
    name: 'Kore',
    gender: 'Femër',
    language: 'sq',
    languageLabel: 'Shqip',
    flag: '🇦🇱',
    toneDesc: 'E ngrohtë, e qetë, me artikulim kristal të pastër',
    recommendedFor: 'Apartamente luksoze, rezidenca private dhe prezantime të rafinuara',
    samplePitch: 'E mesme / E butë',
  },

  // 🇬🇧 Anglisht
  {
    id: 'Puck',
    name: 'Puck',
    gender: 'Mashkull',
    language: 'en',
    languageLabel: 'English',
    flag: '🇬🇧',
    toneDesc: 'Confident, dynamic, fluent international English delivery',
    recommendedFor: 'Luxury commercial ads, Reels, global buyer presentations',
    samplePitch: 'Mid / Dynamic',
    isPrimary: true,
  },
  {
    id: 'Zephyr',
    name: 'Zephyr',
    gender: 'Femër',
    language: 'en',
    languageLabel: 'English',
    flag: '🇬🇧',
    toneDesc: 'Warm, elegant, clear British & international pronunciation',
    recommendedFor: 'Penthouses, vacation retreats, corporate property listings',
    samplePitch: 'Bright / Polished',
  },

  // 🇮🇹 Italisht
  {
    id: 'Orus',
    name: 'Orus',
    gender: 'Mashkull',
    language: 'it',
    languageLabel: 'Italiano',
    flag: '🇮🇹',
    toneDesc: 'Voce maschile calda, autorevole, naturale ed elegante',
    recommendedFor: 'Dimore storiche, ville sul lago/mare, annunci immobiliari di pregio',
    samplePitch: 'Profonda / Calda',
    isPrimary: true,
  },
  {
    id: 'Aoede',
    name: 'Aoede',
    gender: 'Femër',
    language: 'it',
    languageLabel: 'Italiano',
    flag: '🇮🇹',
    toneDesc: 'Voce femminile melodica, raffinata ed espressiva',
    recommendedFor: 'Appartamenti moderni, open space, video tour emozionali',
    samplePitch: 'Media / Espressiva',
  },

  // 🇩🇪 Gjermanisht
  {
    id: 'Fenrir',
    name: 'Fenrir',
    gender: 'Mashkull',
    language: 'de',
    languageLabel: 'Deutsch',
    flag: '🇩🇪',
    toneDesc: 'Souveräne, präzise und vertrauenswürdige Männerstimme',
    recommendedFor: 'Kapitalanlagen, Neubauprojekte, Gewerbe- und Luxusimmobilien',
    samplePitch: 'Kräftig / Souverän',
    isPrimary: true,
  },
  {
    id: 'Leda',
    name: 'Leda',
    gender: 'Femër',
    language: 'de',
    languageLabel: 'Deutsch',
    flag: '🇩🇪',
    toneDesc: 'Freundliche, professionelle und kristallklare Frauenstimme',
    recommendedFor: 'Familienhäuser, Ferienwohnungen, ansprechende Social-Media-Clips',
    samplePitch: 'Mittel / Freundlich',
  },
];

const SAMPLE_TEXTS: Record<LanguageCode, string> = {
  sq: 'Shitet apartament modern 2+1 në një nga zonat më të mira të Tiranës. Sipërfaqe 95 metra katrorë me ndriçim natyral, dy tualete dhe ballkon me pamje fantastike. Pallat i ri me ashensor dhe dokumentacion të rregullt hipotekor. Kontaktoni për një vizitë në pronë!',
  en: 'Luxury 2-bedroom apartment for sale in a prime location. 95 square meters of bright living space with natural light, two modern bathrooms, and a private balcony with panoramic views. New building with elevator and complete legal title deeds. Contact us today for a private viewing!',
  it: 'Vendesi moderno appartamento trilocale in una delle zone più richieste della città. Superficie di 95 metri quadri con ottima luminosità naturale, due bagni rifiniti e balcone con vista panoramica. Edificio di recente costruzione con ascensore e documentazione in regola. Contattaci per organizzare una visita!',
  de: 'Exklusive 3-Zimmer-Wohnung in begehrter Spitzenlage zu verkaufen. 95 Quadratmeter Wohnfläche mit lichtdurchfluteten Räumen, zwei modernen Bädern und großem Balkon mit traumhaftem Ausblick. Neubau mit Aufzug und vollständigen Grundbuchunterlagen. Kontaktieren Sie uns noch heute für eine Besichtigung!',
};

export default function App() {
  // State
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>('sq');
  const [text, setText] = useState<string>(SAMPLE_TEXTS.sq);
  const [voices, setVoices] = useState<VoiceItem[]>(INITIAL_VOICES);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>('Charon');
  const [selectedTone] = useState<string>('Profesional');
  const [speedPrompt] = useState<string>('Normal');

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
    // Average speaking rate ~ 130 words per minute (~2.16 words/sec)
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
          language: selectedLanguage,
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
        !err.message.includes('HTML')
      ) {
        userFriendlyMsg = err.message;
      }
      setGenerationError(userFriendlyMsg);
    } finally {
      setIsGenerating(false);
    }
  };

  // Copy text to clipboard
  const handleCopyText = () => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
  };

  // When language changes, optionally auto-switch sample text if user hasn't typed custom
  const handleLanguageChange = (lang: LanguageCode) => {
    setSelectedLanguage(lang);
    // Find default voice for this language
    const langVoices = voices.filter((v) => v.language === lang);
    const prim = langVoices.find((v) => v.isPrimary) || langVoices[0];
    if (prim) {
      setSelectedVoiceId(prim.id);
    }
  };

  const activeLangMeta = LANGUAGES.find((l) => l.id === selectedLanguage) || LANGUAGES[0];
  const activeVoiceMeta = voices.find((v) => v.id === selectedVoiceId);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-slate-950 font-black tracking-tight text-lg">
              TTS
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white text-base tracking-tight">
                  TTS
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Multilingual
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Text Input Workspace (7 cols on lg) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              {/* Header inside text container */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <h2 className="text-sm font-semibold text-white">
                    Teksti i Pronës ({activeLangMeta.flag} {activeLangMeta.label})
                  </h2>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setText(SAMPLE_TEXTS[selectedLanguage])}
                    className="p-1.5 px-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-emerald-300 transition-colors text-xs flex items-center gap-1 border border-slate-700/60 cursor-pointer"
                    title="Ngarko tekst shembull për këtë gjuhë"
                  >
                    <Sparkles className="w-3 h-3 text-emerald-400" />
                    <span>Shembull {activeLangMeta.label}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyText}
                    disabled={!text}
                    className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors text-xs flex items-center gap-1 cursor-pointer disabled:opacity-40"
                    title="Kopjo tekstin"
                  >
                    {copiedNotification ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span className="hidden sm:inline">
                      {copiedNotification ? 'U kopjua' : 'Kopjo'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setText('')}
                    className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors text-xs flex items-center gap-1 cursor-pointer"
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
                  placeholder={`Shkruani ose ngjisni tekstin e pronës në ${activeLangMeta.label}...`}
                  rows={8}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all resize-y leading-relaxed font-sans"
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
                    <span>Duke gjeneruar audion ({activeLangMeta.label})...</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-5 h-5 stroke-[2.5]" />
                    <span>Gjenero Zërin (Audio)</span>
                    <span className="text-xs bg-slate-950/20 px-2.5 py-0.5 rounded-full font-sans font-semibold flex items-center gap-1.5">
                      <span>{activeLangMeta.flag}</span>
                      <span>Zëri: {selectedVoiceId} ({activeVoiceMeta?.gender || 'Audio'})</span>
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
              selectedLanguage={selectedLanguage}
              onSelectLanguage={handleLanguageChange}
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
              voiceName={`${generatedAudio.voiceUsed} (${activeLangMeta.flag} ${activeLangMeta.label})`}
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
