import { GroupByOption } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from 'react-i18next';

interface TransactionGroupingControlsProps {
  groupBy: GroupByOption;
  onGroupByChange: (groupBy: GroupByOption) => void;
}

export function TransactionGroupingControls({ groupBy, onGroupByChange }: TransactionGroupingControlsProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-4">
      <span className="text-base text-muted-foreground font-medium">{t('finances.groupBy')}:</span>
      <Select value={groupBy} onValueChange={(v) => onGroupByChange(v as GroupByOption)}>
        <SelectTrigger className={`w-[200px] ${groupBy !== 'none' ? 'text-green-500 font-semibold' : ''}`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">{t('finances.groupByNone')}</SelectItem>
          <SelectItem value="month">{t('finances.groupByMonth')}</SelectItem>
          <SelectItem value="group">{t('finances.groupByGroup')}</SelectItem>
          <SelectItem value="category">{t('finances.groupByCategory')}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
