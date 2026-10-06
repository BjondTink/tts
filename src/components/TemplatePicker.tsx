import React from 'react';
import { Building2, Home, Store, Waves, Flame, Sparkles } from 'lucide-react';

export interface TemplateItem {
  id: string;
  title: string;
  category: string;
  text: string;
}

interface TemplatePickerProps {
  templates: TemplateItem[];
  onSelectTemplate: (text: string) => void;
}

export const TemplatePicker: React.FC<TemplatePickerProps> = ({
  templates,
  onSelectTemplate,
}) => {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Vilë':
        return <Home className="w-3.5 h-3.5 text-amber-400" />;
      case 'Komerciale':
        return <Store className="w-3.5 h-3.5 text-blue-400" />;
      case 'Bregdet':
        return <Waves className="w-3.5 h-3.5 text-cyan-400" />;
      case 'Okazion':
        return <Flame className="w-3.5 h-3.5 text-rose-400" />;
      default:
        return <Building2 className="w-3.5 h-3.5 text-emerald-400" />;
    }
  };

  return (
    <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          Modele të Gatshme për Real Estate (1-Klik):
        </span>
        <span className="text-[11px] text-slate-400">Klikoni për të ngarkuar</span>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {templates.map((tpl) => (
          <button
            key={tpl.id}
            type="button"
            onClick={() => onSelectTemplate(tpl.text)}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-850 text-xs text-slate-300 hover:text-white transition-all whitespace-nowrap active:scale-95 group"
          >
            {getCategoryIcon(tpl.category)}
            <span>{tpl.title.split('(')[0].trim()}</span>
            <span className="text-[10px] text-slate-400 group-hover:text-slate-300">
              ({tpl.category})
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
