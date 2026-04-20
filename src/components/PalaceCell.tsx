import React from 'react';
import { Palace, GOOD_STARS } from '@/src/lib/astrology';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { STAR_MEANINGS, MINOR_STAR_MEANINGS, TU_HOA_MEANINGS } from '@/src/lib/starMeanings';

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

  // Decide on font size based on density
  const getStarFontSize = () => {
    if (totalStarsCount > 22) return 'text-[7px]';
    if (totalStarsCount > 18) return 'text-[8px]';
    if (totalStarsCount > 12) return 'text-[9px]';
    return 'text-[9.5px]'; 
  };

  const getElementColor = (element: string) => {
    switch (element) {
      case 'Kim': return 'text-[#71717a]'; // Gray/Zinc
      case 'Mộc': return 'text-[#16a34a]'; // Green
      case 'Thủy': return 'text-[#2563eb]'; // Blue
      case 'Hỏa': return 'text-[#dc2626]'; // Red
      case 'Thổ': return 'text-[#b45309]'; // Amber/Brown
      default: return 'text-foreground/70';
    }
  };

  const getBranchElementColor = (branch: string) => {
    if (['Tỵ', 'Ngọ'].includes(branch)) return 'text-red-700';
    if (['Thân', 'Dậu'].includes(branch)) return 'text-slate-600';
    if (['Hợi', 'Tý'].includes(branch)) return 'text-blue-700';
    if (['Dần', 'Mão'].includes(branch)) return 'text-green-700';
    return 'text-amber-700'; // Thìn, Tuất, Sửu, Mùi
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
        "flex flex-col leading-none",
        isMajor && "items-center",
        !isMajor && "w-full",
        getElementColor(star.element)
      )}>
        <div className={cn(
          "flex items-baseline gap-0.5",
          !isMajor && "w-full",
          !isMajor && alignRight ? "justify-end" : "justify-start"
        )}>
          <span className={cn(
            isMajor ? "font-bold whitespace-nowrap tracking-tighter text-slate-800" : "font-semibold whitespace-nowrap tracking-tighter",
            isMajor 
              ? (palace.majorStars.length > 2 ? "text-[11px] uppercase" : "text-[12px] uppercase")
              : getStarFontSize()
          )}>
            {star.name} {isMajor && star.brightness && `(${star.brightness})`}
          </span>
          {!isMajor && star.brightness && (
            <span className="text-[7.5px] font-semibold opacity-60 shrink-0">({star.brightness})</span>
          )}
        </div>
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
        "tuvi-cell group hover:bg-slate-50 hover:ring-2 hover:ring-primary/40 transition-all cursor-pointer relative flex flex-col min-h-[240px] border border-border bg-white",
        isMenh && "bg-primary/5 ring-1 ring-inset ring-primary/40",
        highlight === 'tam-hop' && !isMenh && "bg-primary/5 ring-1 ring-inset ring-primary/20",
        highlight === 'xung-chieu' && "bg-secondary/10 ring-1 ring-inset ring-primary/10"
      )}
    >
      {/* Header: Branch and Palace Name */}
      <div className="flex justify-between items-start px-2 pt-1 mb-1 relative z-10 border-b border-border/10">
        <span className="text-[9.5px] font-bold text-muted-foreground uppercase tracking-widest w-6 opacity-30">
          {palace.branch}
        </span>
        <div className="text-center flex-1">
          <h3 className={cn(
            "text-[12px] font-heading font-black uppercase tracking-widest leading-none mb-0.5 shadow-primary/20",
            getBranchElementColor(palace.branch)
          )}>
            {palace.name}
            {isThan && (
              <span className="ml-1 text-[8px] font-bold text-white bg-primary px-0.5 rounded-[1px]">
                THÂN
              </span>
            )}
          </h3>
        </div>
        <span className="text-[9.5px] font-mono font-bold text-muted-foreground w-6 text-right opacity-30">
          {palace.decadalRange[0]}
        </span>
      </div>

      {/* Major Stars Section */}
      {showMajorStars && (
        <div className={cn(
          "flex flex-col items-center mt-1 mb-2 relative z-10",
          palace.majorStars.length > 1 ? "gap-0.5" : "gap-0"
        )}>
          {palace.majorStars.map((star, idx) => renderStar(star, idx, true))}
        </div>
      )}

      {/* Minor Stars Section (Dynamic Flexible Distribution) */}
      <div className={cn(
        "px-1 flex-1 relative z-10 pb-1.5 border-t border-border/20 pt-2 flex bg-secondary/5",
        totalStarsCount > 12 ? "gap-0.5" : "gap-1"
      )}>
        {/* Left container: Good Stars */}
        <div className={cn(
          "flex flex-col gap-1",
          badStars.length === 0 ? "flex-1 grid grid-cols-2 gap-x-1" : "flex-1"
        )}>
          {goodStars.map((star, idx) => renderStar(star, idx, false, false))}
        </div>

        {/* Right container: Bad Stars */}
        {badStars.length > 0 && (
          <div className={cn(
            "flex flex-col gap-1 text-right border-l border-border/20 flex-[1.1]",
            totalStarsCount > 12 ? "pl-1" : "pl-1.5",
            goodStars.length === 0 && "grid grid-cols-2 gap-x-1 text-left border-l-0 pl-0"
          )}>
            {badStars.map((star, idx) => renderStar(star, idx, false, goodStars.length > 0))}
          </div>
        )}
      </div>

      {/* Footer: Tràng Sinh, Decadal, Small Luck */}
      <div className="mt-auto border-t border-border/50 bg-secondary/40 px-2 py-1 flex justify-between items-center relative z-10 text-[9px]">
        <span className="font-bold text-primary uppercase tracking-[0.2em]">
          {palace.changsheng12}
        </span>
        <div className="flex gap-2">
          <span className="font-mono font-bold text-muted-foreground/40">
            {palace.decadalRange[0]}
          </span>
          <div className="flex gap-0.5">
            {palace.smallLuckAge.slice(0, 2).map(age => (
              <span key={age} className="font-mono font-semibold text-muted-foreground/20">
                {age}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
