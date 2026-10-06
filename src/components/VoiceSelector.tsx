import React, { useState } from 'react';
import { Mic, User, Sparkles, Check, ChevronDown } from 'lucide-react';

export interface VoiceItem {
  id: string;
  name: string;
  gender: 'Femër' | 'Mashkull';
  toneDesc: string;
  recommendedFor: string;
  samplePitch: string;
}

interface VoiceSelectorProps {
  voices: VoiceItem[];
  selectedVoiceId: string;
  onSelectVoice: (voiceId: string) => void;
}

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  voices,
  selectedVoiceId,
  onSelectVoice,
}) => {
  const [filterGender, setFilterGender] = useState<'all' | 'Femër' | 'Mashkull'>('all');
  const [isExpanded, setIsExpanded] = useState(false);

  const selectedVoice = voices.find((v) => v.id === selectedVoiceId) || voices[0];

  const filteredVoices = voices.filter((v) => {
    if (filterGender === 'all') return true;
    return v.gender === filterGender;
  });

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Mic className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              Zëri i Gemini AI
              <span className="text-[11px] font-normal text-slate-400">
                ({voices.length} zëra në dispozicion)
              </span>
            </h3>
          </div>
        </div>

        {/* Gender filter tabs */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800/80 text-xs">
          <button
            type="button"
            onClick={() => setFilterGender('all')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              filterGender === 'all'
                ? 'bg-slate-800 text-white font-medium shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Të Gjithë ({voices.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterGender('Femër')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              filterGender === 'Femër'
                ? 'bg-pink-950/60 text-pink-300 font-medium border border-pink-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Femër
          </button>
          <button
            type="button"
            onClick={() => setFilterGender('Mashkull')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              filterGender === 'Mashkull'
                ? 'bg-sky-950/60 text-sky-300 font-medium border border-sky-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Mashkull
          </button>
        </div>
      </div>

      {/* Selected Voice Spotlight Badge */}
      {selectedVoice && (
        <div className="mb-3.5 p-3 rounded-xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/30 border border-indigo-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-md ${
                selectedVoice.gender === 'Femër'
                  ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30'
                  : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
              }`}
            >
              {selectedVoice.name[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white text-sm">{selectedVoice.name}</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    selectedVoice.gender === 'Femër'
                      ? 'bg-pink-500/10 text-pink-300 border border-pink-500/20'
                      : 'bg-sky-500/10 text-sky-300 border border-sky-500/20'
                  }`}
                >
                  {selectedVoice.gender}
                </span>
                <span className="text-[11px] text-slate-400">{selectedVoice.samplePitch}</span>
              </div>
              <p className="text-xs text-slate-300 line-clamp-1">{selectedVoice.toneDesc}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 transition-colors"
          >
            <span>{isExpanded ? 'Mbyll Listën' : 'Ndrysho Zërin'}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      )}

      {/* Voice Selection Cards */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 ${isExpanded ? 'block' : 'max-h-60 overflow-y-auto sm:max-h-none'}`}>
        {filteredVoices.map((voice) => {
          const isSelected = voice.id === selectedVoiceId;
          const isFemale = voice.gender === 'Femër';

          return (
            <button
              key={voice.id}
              type="button"
              onClick={() => {
                onSelectVoice(voice.id);
                // keep open or collapse if user wants
              }}
              className={`p-3 rounded-xl border text-left transition-all relative group flex flex-col justify-between ${
                isSelected
                  ? 'bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/30 shadow-md'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-slate-100 group-hover:text-white">
                      {voice.name}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                        isFemale
                          ? 'bg-pink-500/10 text-pink-300 border border-pink-500/20'
                          : 'bg-sky-500/10 text-sky-300 border border-sky-500/20'
                      }`}
                    >
                      {voice.gender}
                    </span>
                  </div>
                  {isSelected && (
                    <span className="w-5 h-5 rounded-full bg-indigo-500 text-slate-950 flex items-center justify-center">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-400 group-hover:text-slate-300 mb-1 leading-snug">
                  {voice.toneDesc}
                </p>
              </div>

              <div className="mt-2 pt-2 border-t border-slate-800/80 text-[11px] text-amber-400/90 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-amber-400 flex-shrink-0" />
                <span className="line-clamp-1">{voice.recommendedFor}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
