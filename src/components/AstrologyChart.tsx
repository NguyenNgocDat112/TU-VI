import React, { useRef, useState, useEffect } from 'react';
import { Palace, BirthInfo } from '@/src/lib/astrology';
import { PalaceCell } from './PalaceCell';
import { cn } from '@/lib/utils';
import { Sparkles, User, Calendar, Clock, Moon, Sun, Shield, Layers, Download, Image as ImageIcon, FileText } from 'lucide-react';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { Button } from '@/components/ui/button';

interface Props {
  palaces: Palace[];
  menhIdx: number;
  thanIdx: number;
  birthInfo: BirthInfo;
  lunar: any;
  solar: any;
  stemBranchYear: string;
  yinYang: string;
  yinYangHarmony: string;
  fiveElementsClass: string;
  menhFull: string;
  thanPalace: string;
  patterns: string;
  elementHarmony: string;
  canLuong: string;
  chuMenh: string;
  chuThan: string;
  laiNhanCung: string;
  currentAge: number;
  currentDecadal: string;
  showYearlyStars?: boolean;
  showYearlyMutagens?: boolean;
  showDecadalStars?: boolean;
  showMajorStars?: boolean;
  showGoodStars?: boolean;
  showBadStars?: boolean;
  onPalaceClick?: (idx: number) => void;
  exportRef?: React.MutableRefObject<{ exportImage: () => void, exportPDF: () => void } | null>;
}

export function AstrologyChart({ 
  palaces, 
  menhIdx, 
  thanIdx, 
  birthInfo, 
  lunar, 
  solar,
  stemBranchYear, 
  yinYang, 
  yinYangHarmony,
  fiveElementsClass,
  menhFull,
  thanPalace,
  patterns,
  elementHarmony,
  canLuong,
  chuMenh,
  chuThan,
  laiNhanCung,
  currentAge,
  currentDecadal,
  showYearlyStars = true,
  showYearlyMutagens = true,
  showDecadalStars = true,
  showMajorStars = true,
  showGoodStars = true,
  showBadStars = true,
  onPalaceClick,
  exportRef
}: Props) {
  const chartRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (exportRef) {
      exportRef.current = {
        exportImage,
        exportPDF
      };
    }
  }, [isExporting]);

  useEffect(() => {
    let animationFrameId: number;

    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        if (containerWidth === 0) return; // Wait until container is visible
        
        const targetWidth = 800; // Fixed logical width
        
        // Calculate scale based on container width
        const newScale = containerWidth < targetWidth ? (containerWidth / targetWidth) : 1;
        
        animationFrameId = window.requestAnimationFrame(() => {
          setScale(newScale);
          
          if (containerRef.current && chartRef.current) {
            // Force container height to match scaled chart height to avoid whitespace below
            const chartHeight = chartRef.current.offsetHeight;
            containerRef.current.style.height = `${Math.ceil(chartHeight * newScale)}px`;
          }
        });
      }
    };

    handleResize();
    const resizeObserver = new ResizeObserver(() => {
      // Defer the execution to the next frame
      if (animationFrameId) window.cancelAnimationFrame(animationFrameId);
      handleResize();
    });
    
    if (containerRef.current) resizeObserver.observe(containerRef.current);
    if (chartRef.current) resizeObserver.observe(chartRef.current);
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameId) window.cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
    };
  }, []);

  const exportImage = async () => {
    if (chartRef.current === null || isExporting) return;
    
    setIsExporting(true);
    chartRef.current.classList.add('export-mode');
    
    try {
      await new Promise(resolve => setTimeout(resolve, 300));

      const actualHeight = chartRef.current.offsetHeight;
      const dataUrl = await toPng(chartRef.current, {
        cacheBust: true,
        backgroundColor: '#FFFFFF',
        pixelRatio: 3,
        width: 800,
        height: actualHeight,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
          margin: '0',
          padding: '0',
        }
      });
      
      const link = document.createElement('a');
      link.download = `la-so-tu-vi-${birthInfo.name.replace(/\s+/g, '-')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      chartRef.current.classList.remove('export-mode');
      setIsExporting(false);
      setTimeout(() => window.dispatchEvent(new Event('resize')), 100);
    }
  };

  const exportPDF = async () => {
    if (chartRef.current === null || isExporting) return;
    
    setIsExporting(true);
    chartRef.current.classList.add('export-mode');
    
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const actualHeight = chartRef.current.offsetHeight;
      const dataUrl = await toPng(chartRef.current, {
        cacheBust: true,
        backgroundColor: '#FFFFFF',
        pixelRatio: 3, 
        width: 800,
        height: actualHeight,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
          margin: '0',
          padding: '0',
        }
      });
      
      const pdf = new jsPDF({
        orientation: actualHeight > 800 ? 'portrait' : 'landscape',
        unit: 'px',
        format: [800, actualHeight]
      });
      
      pdf.addImage(dataUrl, 'PNG', 0, 0, 800, actualHeight);
      pdf.save(`la-so-tu-vi-${birthInfo.name.replace(/\s+/g, '-')}.pdf`);
    } catch (err) {
      console.error('PDF Export failed:', err);
    } finally {
      chartRef.current.classList.remove('export-mode');
      setIsExporting(false);
      setTimeout(() => window.dispatchEvent(new Event('resize')), 100);
    }
  };
  // Mapping branches to grid positions
  // 5 6 7 8
  // 4     9
  // 3    10
  // 2 1 0 11
  
  const gridMap = [
    5, 6, 7, 8,
    4, -1, -1, 9,
    3, -1, -1, 10,
    2, 1, 0, 11
  ];

  // Define edges for Tuan/Triet labels
  // Each edge: { type: 'v' | 'h', x: number, y: number, branches: [number, number] }
  // x, y are grid line indices (0-4)
  const edges = [
    { type: 'v', x: 2, y: 3, branches: [0, 1] }, // Tý-Sửu
    { type: 'v', x: 1, y: 3, branches: [1, 2] }, // Sửu-Dần
    { type: 'h', x: 0, y: 3, branches: [2, 3] }, // Dần-Mão
    { type: 'h', x: 0, y: 2, branches: [3, 4] }, // Mão-Thìn
    { type: 'h', x: 0, y: 1, branches: [4, 5] }, // Thìn-Tỵ
    { type: 'v', x: 1, y: 0, branches: [5, 6] }, // Tỵ-Ngọ
    { type: 'v', x: 2, y: 0, branches: [6, 7] }, // Ngọ-Mùi
    { type: 'v', x: 3, y: 0, branches: [7, 8] }, // Mùi-Thân
    { type: 'h', x: 3, y: 1, branches: [8, 9] }, // Thân-Dậu
    { type: 'h', x: 3, y: 2, branches: [9, 10] }, // Dậu-Tuất
    { type: 'h', x: 3, y: 3, branches: [10, 11] }, // Tuất-Hợi
    { type: 'v', x: 3, y: 3, branches: [11, 0] } // Hợi-Tý
  ];

  const InfoRow = ({ label, value, subValue }: { label: string, value: string, subValue?: string }) => (
    <div className="flex items-center gap-1.5 py-0.5 border-b border-border/40 last:border-0 w-full text-left leading-tight">
      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider w-[70px] shrink-0">{label}</span>
      <div className="flex flex-col items-start flex-1 min-w-0">
        <div className="flex items-center gap-1.5 w-full">
          <span className="text-[12px] font-bold text-foreground tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">{value}</span>
          {subValue && !subValue.includes('Bản mệnh') && (
            <span className="text-[10px] font-semibold text-blue-600"> ({subValue})</span>
          )}
        </div>
        {subValue && subValue.includes('Bản mệnh') && (
          <span className="text-[9px] font-semibold text-primary italic leading-none mt-0.5">{subValue}</span>
        )}
      </div>
    </div>
  );

  return (
    <div ref={containerRef} className="w-full relative overflow-hidden">
      <div 
        ref={chartRef} 
        className={cn("bg-white absolute top-0", isExporting && "shadow-none border-none relative")}
        style={{ 
          width: '800px', 
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          left: `calc(50% - ${400 * scale}px)`
        }}
      >
        <div className="w-full p-1">
          <div className="tuvi-grid border border-border relative bg-white mx-auto">
            {gridMap.map((idx, i) => {
              if (idx === -1) {
                if (i === 5) { // Center piece (spans 2x2)
                  return (
                    <div key="center" className="tuvi-center col-span-2 row-span-2 flex flex-col items-center justify-center p-6 bg-white/95 backdrop-blur-sm relative overflow-hidden border border-border m-1 rounded-md shadow-xl">
                      {/* Decorative Background for Center */}
                      <div className="absolute inset-0 opacity-10 pointer-events-none">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full border border-primary animate-[spin_20s_linear_infinite]" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] rounded-full border border-blue-400/40 animate-[spin_15s_linear_infinite_reverse]" />
                      </div>

                      <div className="relative z-10 w-full flex flex-col items-center">
                        <div className="text-center mb-4">
                          <h2 className="text-[16px] font-heading font-black text-primary tracking-widest mb-0.5 drop-shadow-md uppercase">LÁ SỐ TỬ VI</h2>
                          <div className="h-0.5 w-16 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto" />
                        </div>

                        <div className="grid grid-cols-1 w-full max-w-[300px] gap-y-0.5 bg-slate-50/50 rounded-xl p-3 shadow-lg border border-border">
                          <InfoRow label="Họ tên" value={birthInfo.name} />
                          <InfoRow label="Ngày sinh" value={`${solar.day}/${solar.month}/${solar.year} (DL)`} />
                          <InfoRow label="Âm lịch" value={`${lunar.day}/${lunar.month}/${lunar.year}`} subValue={stemBranchYear} />
                          <InfoRow label="Giờ sinh" value={`${birthInfo.hour}h${birthInfo.minute}`} />
                          <InfoRow label="Âm dương" value={yinYang} subValue={yinYangHarmony} />
                          <InfoRow label="Cục" value={fiveElementsClass} />
                          <InfoRow label="Thân cư" value={`Cung ${thanPalace}`} />
                          <InfoRow label="Cân lượng" value={canLuong} />
                          <InfoRow label="Chủ mệnh" value={chuMenh} />
                          <InfoRow label="Chủ thân" value={chuThan} />
                          <InfoRow label="Lai nhân" value={`Cung ${laiNhanCung}`} />
                          <InfoRow label="Tuổi/Vận" value={`${currentAge} tuổi`} subValue={currentDecadal} />
                        </div>
                        
                        <div className="mt-4 flex flex-col items-center">
                          <div className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-60">Tử Vi Chiêm Cát</div>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }
              
              const palace = palaces[idx];
              const isTamHop = idx === (menhIdx + 4) % 12 || idx === (menhIdx + 8) % 12 || idx === menhIdx;
              const isXungChieu = idx === (menhIdx + 6) % 12;

              return (
                <PalaceCell 
                  key={palace.branch} 
                  palace={palace} 
                  isMenh={idx === menhIdx}
                  isThan={idx === thanIdx}
                  showDecadalStars={showDecadalStars}
                  showYearlyStars={showYearlyStars}
                  showYearlyMutagens={showYearlyMutagens}
                  showMajorStars={showMajorStars}
                  showGoodStars={showGoodStars}
                  showBadStars={showBadStars}
                  highlight={isTamHop ? 'tam-hop' : isXungChieu ? 'xung-chieu' : 'none'}
                  onClick={() => onPalaceClick?.(idx)}
                />
              );
            })}
            
            {/* Overlay lines for Mệnh - Tài - Quan - Di */}
            {(() => {
              const getInnerAnchor = (branchIdx: number) => {
                const map: Record<number, {x: number, y: number}> = {
                  5: {x: 25, y: 25}, 6: {x: 37.5, y: 25}, 7: {x: 62.5, y: 25}, 8: {x: 75, y: 25},
                  9: {x: 75, y: 37.5}, 10: {x: 75, y: 62.5}, 11: {x: 75, y: 75},
                  0: {x: 62.5, y: 75}, 1: {x: 37.5, y: 75}, 2: {x: 25, y: 75},
                  3: {x: 25, y: 62.5}, 4: {x: 25, y: 37.5},
                };
                const pos = map[branchIdx];
                if (!pos) return { x: '0%', y: '0%' };
                return {
                  x: `${pos.x}%`,
                  y: `${pos.y}%`
                };
              };

              const menhCenter = getInnerAnchor(menhIdx);
              const taiCenter = getInnerAnchor((menhIdx + 8) % 12);
              const quanCenter = getInnerAnchor((menhIdx + 4) % 12);
              const diCenter = getInnerAnchor((menhIdx + 6) % 12);

              return (
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-20">
                  <line x1={menhCenter.x} y1={menhCenter.y} x2={taiCenter.x} y2={taiCenter.y} stroke="#7C3AED" strokeWidth="1.5" opacity="0.4" />
                  <line x1={taiCenter.x} y1={taiCenter.y} x2={quanCenter.x} y2={quanCenter.y} stroke="#7C3AED" strokeWidth="1.5" opacity="0.4" />
                  <line x1={quanCenter.x} y1={quanCenter.y} x2={menhCenter.x} y2={menhCenter.y} stroke="#7C3AED" strokeWidth="1.5" opacity="0.4" />
                  <line x1={menhCenter.x} y1={menhCenter.y} x2={diCenter.x} y2={diCenter.y} stroke="#3B82F6" strokeWidth="1.5" opacity="0.5" strokeDasharray="6,4" />
                </svg>
              );
            })()}

            {/* Render Tuan/Triet labels on edges */}
            {edges.map((edge, idx) => {
              const p1 = palaces[edge.branches[0]];
              const p2 = palaces[edge.branches[1]];
              
              const labels = [];
              if (p1.isTuan && p2.isTuan) labels.push({ text: 'TUẦN', color: 'bg-black' });
              if (p1.isTriet && p2.isTriet) labels.push({ text: 'TRIỆT', color: 'bg-red-600' });

              if (labels.length === 0) return null;

              const style: React.CSSProperties = {
                position: 'absolute',
                zIndex: 50,
                display: 'flex',
                flexDirection: 'row',
                gap: '2px',
                pointerEvents: 'none',
                alignItems: 'center'
              };

              if (edge.type === 'v') {
                style.left = `${(edge.x / 4) * 100}%`;
                style.top = `${(edge.y / 4) * 100 + 12.5}%`;
                style.transform = 'translate(-50%, -50%)';
              } else {
                style.top = `${(edge.y / 4) * 100}%`;
                style.left = `${(edge.x / 4) * 100 + 12.5}%`;
                style.transform = 'translate(-50%, -50%)';
              }

              return (
                <div key={idx} style={style}>
                  {labels.map((l, i) => (
                    <span key={i} className={cn(
                      "text-[8px] font-black text-white px-1 py-0 rounded shadow-sm border border-white/40 whitespace-nowrap uppercase tracking-tighter",
                      l.color
                    )}>
                      {l.text}
                    </span>
                  ))}
                </div>
              );
            })}
          </div>

          <div className="mt-4 bg-white border border-border rounded-lg p-3 flex flex-wrap justify-between items-center gap-2 text-[9px] font-bold uppercase tracking-tight text-muted-foreground shadow-sm">
            <div className="flex gap-3">
              <div className="flex items-center gap-0.5"><span className="text-red-600">M:</span> Miếu</div>
              <div className="flex items-center gap-0.5"><span className="text-red-600">V:</span> Vượng</div>
              <div className="flex items-center gap-0.5"><span className="text-red-600">Đ:</span> Đắc</div>
              <div className="flex items-center gap-0.5"><span className="text-red-600">B:</span> Bình</div>
              <div className="flex items-center gap-0.5"><span className="text-red-600">H:</span> Hãm</div>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 bg-slate-600 rounded-full shadow-sm"></div> Kim
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 bg-green-700 rounded-full shadow-sm"></div> Mộc
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 bg-blue-700 rounded-full shadow-sm"></div> Thủy
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 bg-red-700 rounded-full shadow-sm"></div> Hỏa
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 bg-amber-700 rounded-full shadow-sm"></div> Thổ
              </div>
            </div>
            <div className="text-primary/60 font-mono tracking-widest bg-slate-50 px-2 py-0.5 rounded-full border border-border text-[8px]">
              LÁ SỐ • SOMENH.AI.VN
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
