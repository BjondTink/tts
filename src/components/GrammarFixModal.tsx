import React from 'react';
import { Check, X, Wand2, Sparkles, ArrowRight } from 'lucide-react';

interface GrammarFixModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalText: string;
  correctedText: string;
  summaryOfFixes: string[];
  mode: 'grammar' | 'enhance';
  onAccept: (newText: string) => void;
}

export const GrammarFixModal: React.FC<GrammarFixModalProps> = ({
  isOpen,
  onClose,
  originalText,
  correctedText,
  summaryOfFixes,
  mode,
  onAccept,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              {mode === 'enhance' ? <Sparkles className="w-5 h-5" /> : <Wand2 className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-semibold text-lg text-white">
                {mode === 'enhance' ? 'Optimizimi për Real Estate (Shqip)' : 'Rregullimi Gramatikor në Shqip'}
              </h3>
              <p className="text-xs text-slate-400">
                Përmirësim i shkronjave (ë, ç), shenjave të pikësimit dhe rrjedhshmërisë për lexim me zë
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Mbyll"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Summary of fixes */}
          {summaryOfFixes && summaryOfFixes.length > 0 && (
            <div className="bg-emerald-950/30 border border-emerald-500/20 rounded-xl p-4">
              <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Check className="w-4 h-4" /> Ndryshimet e Bëra:
              </h4>
              <ul className="text-sm text-emerald-200/90 space-y-1 list-disc list-inside">
                {summaryOfFixes.map((fix, idx) => (
                  <li key={idx}>{fix}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Comparison */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Original */}
            <div className="flex flex-col">
              <div className="text-xs font-medium text-slate-400 mb-1.5 flex items-center justify-between">
                <span>Teksti Origjinal</span>
                <span className="text-[11px] bg-slate-800 px-2 py-0.5 rounded text-slate-400">Para</span>
              </div>
              <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-slate-300 leading-relaxed font-sans whitespace-pre-wrap flex-1 max-h-60 overflow-y-auto">
                {originalText}
              </div>
            </div>

            {/* Corrected */}
            <div className="flex flex-col">
              <div className="text-xs font-medium text-amber-400 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  Teksti i Korrigjuar <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                </span>
                <span className="text-[11px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                  Gati për TTS
                </span>
              </div>
              <div className="p-3.5 bg-slate-950 border border-amber-500/40 rounded-xl text-sm text-slate-100 leading-relaxed font-sans whitespace-pre-wrap flex-1 max-h-60 overflow-y-auto shadow-inner ring-1 ring-amber-500/20">
                {correctedText}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-sm font-medium transition-colors"
          >
            Anulo
          </button>
          <button
            onClick={() => {
              onAccept(correctedText);
              onClose();
            }}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-semibold text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.01]"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            Prano Ndryshimet
          </button>
        </div>
      </div>
    </div>
  );
};
