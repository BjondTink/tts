import React from 'react';
import { Mic, Check, Sparkles, Star } from 'lucide-react';

export type LanguageCode = 'sq' | 'en' | 'it' | 'de';

export interface VoiceItem {
  id: string;
  name: string;
  gender: 'Femër' | 'Mashkull';
  language: LanguageCode;
  languageLabel: string;
  flag: string;
  toneDesc: string;
  recommendedFor: string;
  samplePitch: string;
  isPrimary?: boolean;
}

export const LANGUAGES: { id: LanguageCode; label: string; flag: string }[] = [
  { id: 'sq', label: 'Shqip', flag: '🇦🇱' },
  { id: 'en', label: 'English', flag: '🇬🇧' },
  { id: 'it', label: 'Italiano', flag: '🇮🇹' },
  { id: 'de', label: 'Deutsch', flag: '🇩🇪' },
];

interface VoiceSelectorProps {
  voices: VoiceItem[];
  selectedVoiceId: string;
  selectedLanguage: LanguageCode;
  onSelectLanguage: (lang: LanguageCode) => void;
  onSelectVoice: (voiceId: string) => void;
}

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  voices,
  selectedVoiceId,
  selectedLanguage,
  onSelectLanguage,
  onSelectVoice,
}) => {
  // Filter voices for currently selected language
  const languageVoices = voices.filter((v) => v.language === selectedLanguage);
  // Fallback to all if matching none
  const displayedVoices = languageVoices.length > 0 ? languageVoices : voices.slice(0, 2);

  const currentLangObj = LANGUAGES.find((l) => l.id === selectedLanguage) || LANGUAGES[0];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
      {/* Header with Title and Language Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Mic className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">
              Zgjedhja e Zërit
            </h3>
            <p className="text-xs text-slate-400">
              {currentLangObj.flag} 2 Zëra për {currentLangObj.label} (1 Mashkull & 1 Femër)
            </p>
          </div>
        </div>

        {/* Language Tabs */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800/80">
          {LANGUAGES.map((lang) => {
            const isActive = selectedLanguage === lang.id;
            return (
              <button
                key={lang.id}
                type="button"
                onClick={() => {
                  onSelectLanguage(lang.id);
                  // Find primary voice for this language and select it
                  const targetVoices = voices.filter((v) => v.language === lang.id);
                  const prim = targetVoices.find((v) => v.isPrimary) || targetVoices[0];
                  if (prim) {
                    onSelectVoice(prim.id);
                  }
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-500 text-slate-950 shadow-sm font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <span>{lang.flag}</span>
                <span>{lang.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2 Voices Grid for Active Language */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {displayedVoices.map((voice) => {
          const isSelected = voice.id === selectedVoiceId;
          const isPrimary = voice.isPrimary || voice.id === 'Charon' || voice.id === 'Puck' || voice.id === 'Orus' || voice.id === 'Fenrir';
          const isFemale = voice.gender === 'Femër';

          return (
            <button
              key={voice.id}
              type="button"
              onClick={() => onSelectVoice(voice.id)}
              className={`p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between cursor-pointer group ${
                isSelected
                  ? 'bg-slate-800/95 border-emerald-500 ring-2 ring-emerald-500/30 shadow-lg'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/70'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                        !isFemale
                          ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                          : 'bg-pink-500/20 text-pink-300 border border-pink-500/30'
                      }`}
                    >
                      {voice.id[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-white">
                          {voice.name}
                        </span>
                        {isPrimary && (
                          <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold">
                            <Star className="w-2.5 h-2.5 fill-amber-300" />
                            {voice.language === 'sq' ? 'Primar' : 'Featured'}
                          </span>
                        )}
                      </div>
                      <span
                        className={`text-[10px] font-medium ${
                          isFemale ? 'text-pink-300' : 'text-sky-300'
                        }`}
                      >
                        {voice.gender} • {voice.samplePitch}
                      </span>
                    </div>
                  </div>

                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                      isSelected
                        ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                        : 'border-slate-700 bg-slate-900 text-transparent'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed mb-2">
                  {voice.toneDesc}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-start gap-1.5">
                <Sparkles className="w-3 h-3 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span className="line-clamp-2">{voice.recommendedFor}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
