import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { FinanceFilters, Group, Coach } from '@/types';
import { useTranslation } from 'react-i18next';
import { X, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface FinanceFilterPanelProps {
  filters: FinanceFilters;
  onFilterChange: (filters: FinanceFilters) => void;
  groups: Group[] | undefined;
  coaches: Coach[] | undefined;
  stats: {
    count: number;
    totalIncome: number;
    totalExpense: number;
    net: number;
  };
  transactionCount: number;
}

export function FinanceFilterPanel({ filters, onFilterChange, groups, coaches, stats, transactionCount }: FinanceFilterPanelProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(true);

  const handleClearAll = () => {
    const now = new Date();
    onFilterChange({
      dateRange: {
        startDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0],
        endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0],
        preset: 'thisMonth',
      },
      groupIds: [],
      coachIds: [],
      transactionType: 'ALL',
      categories: [],
    });
  };


  const activeFilterCount =
    (filters.groupIds.length > 0 ? 1 : 0) +
    (filters.coachIds.length > 0 ? 1 : 0) +
    (filters.transactionType !== 'ALL' ? 1 : 0) +
    (filters.categories.length > 0 ? 1 : 0);

  const toggleGroup = (groupId: string) => {
    const newIds = filters.groupIds.includes(groupId)
      ? filters.groupIds.filter((id) => id !== groupId)
      : [...filters.groupIds, groupId];
    onFilterChange({ ...filters, groupIds: newIds });
  };

  const toggleCoach = (coachId: string) => {
    const newIds = filters.coachIds.includes(coachId)
      ? filters.coachIds.filter((id) => id !== coachId)
      : [...filters.coachIds, coachId];
    onFilterChange({ ...filters, coachIds: newIds });
  };

  // Categories matching AddFinanceDialog values
  const incomeCategories = [
    { value: 'MEMBERSHIP_FEE', label: t('finances.categories.membershipPayment') },
    { value: 'EVENT_FEE', label: t('finances.categories.eventFee') },
    { value: 'SPONSORSHIP', label: t('finances.categories.sponsorship') },
    { value: 'EQUIPMENT', label: t('finances.categories.equipmentSales') },
    { value: 'OTHER', label: t('finances.categories.otherIncome') },
  ];
  const expenseCategories = [
    { value: 'EQUIPMENT', label: t('finances.categories.equipmentPurchase') },
    { value: 'RENT', label: t('finances.categories.facilityRent') },
    { value: 'SALARY', label: t('finances.categories.coachSalary') },
    { value: 'UTILITIES', label: t('finances.categories.utilities') },
    { value: 'OTHER', label: t('finances.categories.otherExpense') },
  ];
  const availableCategories = filters.transactionType === 'INCOME'
    ? incomeCategories
    : filters.transactionType === 'EXPENSE'
      ? expenseCategories
      : [...incomeCategories, ...expenseCategories.filter((c) => !incomeCategories.some((ic) => ic.value === c.value))];

  const toggleCategory = (category: string) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter((c) => c !== category)
      : [...filters.categories, category];
    onFilterChange({ ...filters, categories: newCategories });
  };

  const scrollbarClass = 'max-h-60 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/40';

  return (
    <div className="space-y-2">
      <div
        className="bg-muted/70 p-4 rounded-lg cursor-pointer hover:bg-muted transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between gap-4">
          {/* Left: Title + Badge + Stats */}
          <div className="flex items-center gap-4 flex-1">
            <div className="flex items-center gap-3">
              <Filter className="h-6 w-6 text-muted-foreground" />
              <h3 className="text-base font-semibold">{t('finances.filters')}</h3>
              {activeFilterCount > 0 && (
                <Badge variant="secondary">{activeFilterCount}</Badge>
              )}
            </div>

            {/* Vertical separator */}
            <div className="h-8 w-px bg-border" />

            {/* Stats */}
            <div className="flex items-center gap-6">
              <p className="text-sm text-muted-foreground">
                {t('finances.showingTransactions', { count: transactionCount })}
              </p>
              <div className="flex items-center gap-1.5">
                <span className="text-sm text-muted-foreground">{t('finances.filteredIncome')}:</span>
                <span className="text-base font-semibold text-green-500">{stats.totalIncome.toLocaleString()} RSD</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm text-muted-foreground">{t('finances.filteredExpense')}:</span>
                <span className="text-base font-semibold text-red-500">{stats.totalExpense.toLocaleString()} RSD</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm text-muted-foreground">{t('finances.filteredNet')}:</span>
                <span className={`text-base font-semibold ${stats.net >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {stats.net >= 0 ? '+' : ''}{stats.net.toLocaleString()} RSD
                </span>
              </div>
            </div>
          </div>

          {/* Right: Buttons */}
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" onClick={handleClearAll}>
                <X className="h-4 w-4 mr-2" />
                {t('finances.clearAllFilters')}
              </Button>
            )}
            <div className="h-8 w-px bg-border" />
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="bg-muted/50 p-4 rounded-lg">
          {/* Main Filters - 4 columns in one row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Transaction Type */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground font-medium">{t('finances.transactionType')}</Label>
              <Select
                value={filters.transactionType}
                onValueChange={(value: string) =>
                  onFilterChange({ ...filters, transactionType: value as any, categories: [] })
                }
              >
                <SelectTrigger className={filters.transactionType !== 'ALL' ? 'text-green-500 font-semibold' : ''}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">{t('finances.all')}</SelectItem>
                  <SelectItem value="INCOME">{t('finances.incomeOnly')}</SelectItem>
                  <SelectItem value="EXPENSE">{t('finances.expensesOnly')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground font-medium">{t('finances.category')}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={`w-full justify-start ${filters.categories.length > 0 ? 'text-green-500 font-semibold' : ''}`}>
                    {filters.categories.length === 0
                      ? t('finances.allCategories')
                      : `${filters.categories.length} ${t('finances.category')}`}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className={`space-y-1 ${scrollbarClass}`}>
                    {availableCategories.map((cat) => (
                      <div
                        key={cat.value}
                        className="flex items-center gap-3 p-2 hover:bg-accent rounded cursor-pointer"
                        onClick={() => toggleCategory(cat.value)}
                      >
                        <Checkbox
                          checked={filters.categories.includes(cat.value)}
                          onCheckedChange={() => toggleCategory(cat.value)}
                        />
                        <span className="text-sm cursor-pointer">{cat.label}</span>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Groups */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground font-medium">{t('finances.groups')}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={`w-full justify-start ${filters.groupIds.length > 0 ? 'text-green-500 font-semibold' : ''}`}>
                    {filters.groupIds.length === 0
                      ? t('finances.allGroups')
                      : `${filters.groupIds.length} ${t('finances.groups')}`}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className={`space-y-1 ${scrollbarClass}`}>
                    {groups?.map((group) => (
                      <div
                        key={group._id}
                        className="flex items-center gap-3 p-2 hover:bg-accent rounded cursor-pointer"
                        onClick={() => toggleGroup(group._id)}
                      >
                        <Checkbox
                          checked={filters.groupIds.includes(group._id)}
                          onCheckedChange={() => toggleGroup(group._id)}
                        />
                        <span className="text-sm cursor-pointer flex items-center gap-2">
                          {group.color && (
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: group.color }} />
                          )}
                          {group.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Coaches */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground font-medium">{t('finances.coaches')}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={`w-full justify-start ${filters.coachIds.length > 0 ? 'text-green-500 font-semibold' : ''}`}>
                    {filters.coachIds.length === 0
                      ? t('finances.allCoaches')
                      : `${filters.coachIds.length} ${t('finances.coaches')}`}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className={`space-y-1 ${scrollbarClass}`}>
                    {coaches?.map((coach) => (
                      <div
                        key={coach.id}
                        className="flex items-center gap-3 p-2 hover:bg-accent rounded cursor-pointer"
                        onClick={() => toggleCoach(coach.id)}
                      >
                        <Checkbox
                          checked={filters.coachIds.includes(coach.id)}
                          onCheckedChange={() => toggleCoach(coach.id)}
                        />
                        <span className="text-sm cursor-pointer">{coach.fullName}</span>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
