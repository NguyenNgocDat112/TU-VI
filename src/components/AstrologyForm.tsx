import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BirthInfo } from '@/src/lib/astrology';
import { cn } from '@/lib/utils';
import { User, Calendar, Clock, Moon, Sun, Info, Shield, Sparkles } from 'lucide-react';

interface Props {
  onSubmit: (data: BirthInfo) => void;
  initialData?: BirthInfo;
  compact?: boolean;
}

export function AstrologyForm({ onSubmit, initialData, compact }: Props) {
  const { register, handleSubmit, setValue, watch, reset } = useForm<any>({
    defaultValues: initialData ? {
      name: initialData.name,
      gender: initialData.gender === 'male' ? 'Nam' : initialData.gender === 'female' ? 'Nữ' : initialData.gender,
      day: initialData.solarDate.getDate().toString(),
      month: (initialData.solarDate.getMonth() + 1).toString(),
      year: initialData.solarDate.getFullYear().toString(),
      hour: initialData.hour.toString(),
      minute: initialData.minute.toString(),
      dateType: initialData.isLunar ? 'lunar' : 'solar'
    } : {
      name: '',
      gender: 'Nam',
      day: new Date().getDate().toString(),
      month: (new Date().getMonth() + 1).toString(),
      year: new Date().getFullYear().toString(),
      hour: '12',
      minute: '0',
      dateType: 'solar'
    }
  });

  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name,
        gender: initialData.gender === 'male' ? 'Nam' : initialData.gender === 'female' ? 'Nữ' : initialData.gender,
        day: initialData.solarDate.getDate().toString(),
        month: (initialData.solarDate.getMonth() + 1).toString(),
        year: initialData.solarDate.getFullYear().toString(),
        hour: initialData.hour.toString(),
        minute: initialData.minute.toString(),
        dateType: initialData.isLunar ? 'lunar' : 'solar'
      });
    }
  }, [initialData, reset]);

  const onFormSubmit = (data: any) => {
    const solarDate = new Date(parseInt(data.year), parseInt(data.month) - 1, parseInt(data.day));
    onSubmit({
      name: data.name,
      gender: data.gender === 'Nam' ? 'male' : 'female',
      solarDate,
      hour: parseInt(data.hour),
      minute: parseInt(data.minute),
      isLunar: data.dateType === 'lunar',
      isLeap: false
    });
  };

  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString());
  const months = Array.from({ length: 12 }, (_, i) => (i + 1).toString());

  const genderValue = watch('gender') || 'Nam';
  const dateTypeValue = watch('dateType') || 'solar';
  const dayValue = watch('day') || '1';
  const monthValue = watch('month') || '1';

  return (
    <form 
      onSubmit={handleSubmit(onFormSubmit)} 
      className={cn(
        "bg-white rounded-[6px] border border-border shadow-2xl mx-auto overflow-hidden w-full",
        compact ? "p-4 border-none shadow-none bg-transparent" : "max-w-2xl"
      )}
    >
      {!compact && (
        <div className="p-4 text-center border-b border-border bg-slate-50/30">
          <h2 className="text-lg font-heading font-black text-primary tracking-tight uppercase mb-0.5">Lập Lá Số Tử Vi</h2>
          <p className="text-muted-foreground text-[10px] text-center font-medium leading-relaxed uppercase tracking-wider">Hành trình giải mã bản mệnh</p>
        </div>
      )}

      <div className={cn("p-4 space-y-4", compact && "p-0 space-y-3")}>
        {/* Section: Basic Info */}
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2 space-y-1">
              <Label htmlFor="name" className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Họ và Tên</Label>
              <div className="relative">
                <Input 
                  id="name" 
                  {...register('name')} 
                  placeholder="Nguyễn Văn A" 
                  required 
                  className="pl-9 bg-muted/30 border-border h-9 rounded-[6px] focus:ring-primary focus:border-primary transition-all text-sm"
                />
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40" />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Giới Tính</Label>
              <div className="relative">
                <Select 
                  onValueChange={(v: string) => setValue('gender', v as any)} 
                  value={genderValue}
                >
                  <SelectTrigger className="bg-muted/30 border-border h-9 rounded-[6px] focus:ring-primary text-sm">
                    <SelectValue placeholder="Nam" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-border rounded-[6px]">
                    <SelectItem value="Nam">Nam</SelectItem>
                    <SelectItem value="Nữ">Nữ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Section: Birth Date */}
        <div className="space-y-3">
          <div className="bg-muted/50 p-3 rounded-[6px] space-y-3 border border-border">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1">
                <div className="flex p-0.5 bg-background rounded-[6px] border border-border">
                  <button
                    type="button"
                    onClick={() => setValue('dateType', 'solar')}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-1.5 text-[10px] font-bold rounded-[6px] transition-all",
                      dateTypeValue === 'solar' 
                        ? "bg-primary text-white shadow-sm" 
                        : "text-muted-foreground hover:text-primary"
                    )}
                  >
                    <Sun className="w-3 h-3" />
                    Dương lịch
                  </button>
                  <button
                    type="button"
                    onClick={() => setValue('dateType', 'lunar')}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-1.5 text-[10px] font-bold rounded-[6px] transition-all",
                      dateTypeValue === 'lunar' 
                        ? "bg-primary text-white shadow-sm" 
                        : "text-muted-foreground hover:text-primary"
                    )}
                  >
                    <Moon className="w-3 h-3" />
                    Âm lịch
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Ngày</Label>
                <Select onValueChange={(v: string) => setValue('day', v)} value={dayValue}>
                  <SelectTrigger className="bg-white border-border h-9 rounded-[6px] text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-border rounded-[6px]">
                    {days.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Tháng</Label>
                <Select onValueChange={(v: string) => setValue('month', v)} value={monthValue}>
                  <SelectTrigger className="bg-white border-border h-9 rounded-[6px] text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-border rounded-[6px]">
                    {months.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Năm</Label>
                <Input 
                  type="number" 
                  {...register('year')} 
                  placeholder="1990" 
                  required 
                  className="bg-white border-border h-9 text-center font-mono rounded-[6px] text-sm w-full"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section: Birth Time */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2 md:gap-3 bg-muted/50 p-2.5 md:p-3 rounded-[6px] border border-border">
            <div className="space-y-1">
              <Label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Giờ (0-23)</Label>
              <div className="relative">
                <Input 
                  type="number" 
                  {...register('hour')} 
                  min="0" 
                  max="23" 
                  required 
                  className="pl-8 md:pl-9 bg-white border-border h-9 rounded-[6px] font-mono text-xs md:text-sm"
                />
                <Clock className="absolute left-2.5 md:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40" />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Phút (0-59)</Label>
              <div className="relative">
                <Input 
                  type="number" 
                  {...register('minute')} 
                  min="0" 
                  max="59" 
                  required 
                  className="pl-8 md:pl-9 bg-white border-border h-9 rounded-[6px] font-mono text-xs md:text-sm"
                />
                <Clock className="absolute left-2.5 md:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40" />
              </div>
            </div>
          </div>
        </div>

        <div className="pt-1">
          <Button 
            type="submit" 
            className="w-full bg-primary hover:bg-primary/90 text-white font-heading font-extrabold shadow-lg shadow-primary/10 transition-all active:scale-[0.98] uppercase tracking-[0.05em] text-[11px] md:text-sm rounded-[6px] h-12"
          >
            Lập Lá Số & Giải Mã AI
          </Button>
          {!compact && (
            <div className="flex items-center justify-center gap-3 mt-4 text-[9px] text-muted-foreground uppercase font-bold tracking-[0.2em] opacity-60">
              <Shield className="w-3.5 h-3.5" />
              <span>Bảo mật dữ liệu 100% • Somenh.ai</span>
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
