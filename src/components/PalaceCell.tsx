import React from 'react';
import { Palace, GOOD_STARS } from '@/src/lib/astrology';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { STAR_MEANINGS, MINOR_STAR_MEANINGS, TU_HOA_MEANINGS } from '@/src/lib/starMeanings';
import { Zap } from 'lucide-react';

interface PalaceCellProps {
  key?: React.Key;
  palace: Palace;
  isMenh?: boolean;
  isThan?: boolean;
  showYearlyStars?: boolean;
  showYearlyMutagens?: boolean;
  showDecadalStars?: boolean;
  showMajorStars?: boolean;
  showGoodStars?: boolean;
  showBadStars?: boolean;
  highlight?: 'tam-hop' | 'xung-chieu' | 'none';
  onClick?: () => void;
}

export function PalaceCell({ 
  palace, 
  isMenh, 
  isThan, 
  showYearlyStars = true, 
  showYearlyMutagens = true, 
  showDecadalStars = true,
  showMajorStars = true,
  showGoodStars = true,
  showBadStars = true,
  highlight = 'none',
  onClick
}: PalaceCellProps) {
  const filterStars = (stars: any[]) => {
    return stars.filter(s => {
      // Filter out Tuan/Triet as they are shown on edges
      if (s.name.includes('Tuần') || s.name.includes('Triệt')) return false;
      if (s.isYearlyMutagen) return showYearlyMutagens;
      if ((s as any).isDecadal) return showDecadalStars;
      if (s.isYearly) return showYearlyStars;
      return true;
    });
  };

  const goodStars = showGoodStars ? filterStars(palace.minorStars) : [];
  const badStars = showBadStars ? filterStars(palace.adjectiveStars) : [];
  const totalStarsCount = goodStars.length + badStars.length;

  // Uniform font size for all stars (except major stars)
  const getStarFontSize = () => 'text-[10px]';

  const getElementColor = (element: string) => {
    switch (element) {
      case 'Kim': return 'text-slate-600'; 
      case 'Mộc': return 'text-green-700'; 
      case 'Thủy': return 'text-blue-800'; 
      case 'Hỏa': return 'text-red-700'; 
      case 'Thổ': return 'text-amber-800'; 
      default: return 'text-foreground/80';
    }
  };

  const getBranchElementColor = (branch: string) => {
    if (['Tỵ', 'Ngọ'].includes(branch)) return 'text-red-700';
    if (['Thân', 'Dậu'].includes(branch)) return 'text-slate-600';
    if (['Hợi', 'Tý'].includes(branch)) return 'text-blue-700';
    if (['Dần', 'Mão'].includes(branch)) return 'text-green-700';
    return 'text-amber-800'; // Thìn, Tuất, Sửu, Mùi
  };

  const getStarMeaning = (name: string) => {
    if (STAR_MEANINGS[name]) return STAR_MEANINGS[name];
    if (MINOR_STAR_MEANINGS[name]) return MINOR_STAR_MEANINGS[name];
    if (name.startsWith('Hóa ')) return TU_HOA_MEANINGS[name]?.desc || '';
    return null;
  };

  const renderStar = (star: any, idx: number, isMajor: boolean = false, alignRight: boolean = false) => {
    const meaning = getStarMeaning(star.name);
    
    const content = (
      <div className={cn(
        "flex leading-tight items-baseline gap-0.5",
        isMajor && "items-center justify-center leading-none",
        !isMajor && "w-full min-w-0 relative", // removed overflow-hidden to prevent clipping, added min-w-0
        !isMajor && alignRight ? "justify-end" : "justify-start",
        getElementColor(star.element)
      )}>
        <span className={cn(
          isMajor ? "font-bold tracking-tighter drop-shadow-sm" : "font-semibold whitespace-nowrap tracking-tighter shrink-0",
          isMajor ? "text-[16px] uppercase" : "text-[11.5px]" // increased font sizes
        )}>
          {star.name}
        </span>
        {star.brightness && (
          <span className={cn("font-bold opacity-80 shrink-0 uppercase", isMajor ? "text-[11px] ml-1" : "text-[9.5px] ml-0.5")}>
            ({star.brightness})
          </span>
        )}
      </div>
    );

    if (!meaning) return <React.Fragment key={`${star.name}-${idx}`}>{content}</React.Fragment>;

    return (
      <Tooltip key={`${star.name}-${idx}`}>
        <TooltipTrigger 
          className="cursor-help hover:opacity-70 transition-opacity border-none outline-none bg-transparent p-0 text-left" 
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {content}
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[200px] text-xs z-[100] shadow-xl">
          <p className="font-bold border-b border-border/50 pb-1 mb-1">{star.name}</p>
          <p className="text-muted-foreground whitespace-normal break-words">{meaning}</p>
        </TooltipContent>
      </Tooltip>
    );
  };

  return (
    <div 
      onClick={onClick}
      className={cn(
        "tuvi-cell group hover:bg-slate-50 hover:ring-2 hover:ring-primary/40 transition-all cursor-pointer relative flex flex-col min-h-[260px] border-r border-b border-border bg-white overflow-visible",
        isMenh && "bg-primary/5 ring-1 ring-inset ring-primary/40",
        highlight === 'tam-hop' && !isMenh && "bg-primary/5 ring-1 ring-inset ring-primary/20",
        highlight === 'xung-chieu' && "bg-secondary/10 ring-1 ring-inset ring-primary/10"
      )}
    >
      {/* Header: Branch and Palace Name */}
      <div className="flex justify-between items-start px-2 pt-1.5 mb-1 relative z-10 border-b border-border/10 pb-0.5">
        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest w-6 opacity-30">
          {palace.branch}
        </span>
        <div className="text-center flex-1 min-w-0">
          <h3 className={cn(
            "text-[14px] font-heading font-black uppercase tracking-widest leading-none mb-0.5 shadow-primary/20 flex items-center justify-center gap-1",
            getBranchElementColor(palace.branch)
          )}>
            <span className="whitespace-nowrap">{palace.name}</span>
            {isThan && (
              <span className="text-[9px] font-bold text-white bg-primary px-1 rounded-[2px] h-3.5 flex items-center shrink-0">
                THÂN
              </span>
            )}
          </h3>
        </div>
        <span className="text-[11px] font-mono font-bold text-muted-foreground w-6 text-right opacity-30">
          {palace.decadalRange[0]}
        </span>
      </div>

      {/* Major Stars Section */}
      {showMajorStars && (
        <div className={cn(
          "flex flex-col items-center mt-1.5 mb-2.5 relative z-10",
          palace.majorStars.length > 1 ? "gap-0.5" : "gap-0"
        )}>
          {palace.majorStars.map((star, idx) => renderStar(star, idx, true))}
        </div>
      )}

      {/* Minor Stars Section */}
      <div className="px-1 flex-1 relative z-10 pb-2 border-t border-border/20 pt-2 flex w-full bg-secondary/5">
        {/* Left container: Good Stars */}
        <div className="w-[50%] flex flex-col gap-[2px] pr-0.5">
          {goodStars.map((star, idx) => renderStar(star, idx, false, false))}
        </div>

        {/* Right container: Bad Stars */}
        <div className="w-[50%] flex flex-col gap-[2px] pl-0.5 text-right border-l border-border/20">
          {badStars.map((star, idx) => renderStar(star, idx, false, true))}
        </div>
      </div>

      {/* Footer: Tràng Sinh, Decadal, Small Luck */}
      <div className="mt-auto border-t border-border/50 bg-secondary/40 px-2 py-1 flex justify-between items-center relative z-10 text-[11px]">
        <div className="flex items-center gap-1.5 h-4">
           <span className="font-black text-primary uppercase tracking-[0.2em] leading-none text-[11px]">
             {palace.changsheng12}
           </span>
        </div>
        <div className="flex gap-2">
          <span className="font-mono font-bold text-muted-foreground/40 text-[11px]">
            {palace.decadalRange[0]}
          </span>
          <div className="flex gap-1">
            {palace.smallLuckAge.slice(0, 2).map(age => (
              <span key={age} className="font-mono font-semibold text-muted-foreground/20 text-[11px]">
                {age}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
