import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTranslation } from 'react-i18next';

export type DateRangePreset = 'all' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'lastYear' | 'custom';

export interface DateRangeValue {
  startDate: string | null;
  endDate: string | null;
  preset: DateRangePreset;
}

interface DateRangePickerProps {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
}

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  // Temporary state for custom date range
  const [tempStartDate, setTempStartDate] = useState<string | null>(null);
  const [tempEndDate, setTempEndDate] = useState<string | null>(null);

  const handlePresetChange = (preset: DateRangePreset) => {
    const now = new Date();
    let startDate: string | null = null;
    let endDate: string | null = null;

    switch (preset) {
      case 'thisMonth':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
        break;
      case 'lastMonth':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
        endDate = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
        break;
      case 'thisYear':
        startDate = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
        endDate = new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0];
        break;
      case 'lastYear':
        startDate = new Date(now.getFullYear() - 1, 0, 1).toISOString().split('T')[0];
        endDate = new Date(now.getFullYear() - 1, 11, 31).toISOString().split('T')[0];
        break;
      case 'all':
        startDate = null;
        endDate = null;
        break;
      case 'custom':
        // Keep existing dates or reset to null
        startDate = value.startDate;
        endDate = value.endDate;
        // Initialize temp dates
        setTempStartDate(value.startDate);
        setTempEndDate(value.endDate);
        break;
    }

    onChange({ startDate, endDate, preset });
  };

  const handleStartDateChange = (date: Date | undefined) => {
    if (date) {
      setTempStartDate(format(date, 'yyyy-MM-dd'));
    }
  };

  const handleEndDateChange = (date: Date | undefined) => {
    if (date) {
      setTempEndDate(format(date, 'yyyy-MM-dd'));
    }
  };

  const handleApplyCustomRange = () => {
    if (tempStartDate && tempEndDate) {
      onChange({
        startDate: tempStartDate,
        endDate: tempEndDate,
        preset: 'custom',
      });
    }
  };

  return (
    <div className="space-y-2">
      <Select value={value.preset} onValueChange={(v) => handlePresetChange(v as DateRangePreset)}>
        <SelectTrigger className={`w-[200px] ${value.preset !== 'all' ? 'text-green-500 font-semibold' : ''}`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('finances.allTime')}</SelectItem>
          <SelectItem value="thisMonth">{t('finances.thisMonth')}</SelectItem>
          <SelectItem value="lastMonth">{t('finances.lastMonth')}</SelectItem>
          <SelectItem value="thisYear">{t('finances.thisYear')}</SelectItem>
          <SelectItem value="lastYear">{t('finances.lastYear')}</SelectItem>
          <SelectItem value="custom">{t('finances.customRange')}</SelectItem>
        </SelectContent>
      </Select>

      {value.preset === 'custom' && (
        <div className="space-y-2">
          <div className="flex gap-2 items-center">
            <Popover open={isOpen} onOpenChange={setIsOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[200px] justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {tempStartDate ? format(new Date(tempStartDate), 'MMM d, yyyy') : t('finances.startDate')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={tempStartDate ? new Date(tempStartDate) : undefined}
                  onSelect={(date) => {
                    handleStartDateChange(date);
                    setIsOpen(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <span className="text-muted-foreground">→</span>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[200px] justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {tempEndDate ? format(new Date(tempEndDate), 'MMM d, yyyy') : t('finances.endDate')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={tempEndDate ? new Date(tempEndDate) : undefined}
                  onSelect={handleEndDateChange}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            {tempStartDate && tempEndDate && (
              <Button
                onClick={handleApplyCustomRange}
                className="bg-green-600 hover:bg-green-700"
              >
                {t('common.apply')}
              </Button>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
