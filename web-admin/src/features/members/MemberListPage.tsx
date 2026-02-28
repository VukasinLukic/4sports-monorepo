import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { FilterPanel } from '@/components/shared/FilterPanel';
import { AddMemberDialog } from './AddMemberDialog';
import { EditMemberDialog } from './EditMemberDialog';
import { useMembers, useDeleteMember } from './useMembers';
import { Member } from '@/types';
import { Plus, Pencil, Trash2, Search, User } from 'lucide-react';
import { SkeletonTable } from '@/components/shared/SkeletonTable';
import { ErrorMessage } from '@/components/shared/ErrorMessage';
import { Label } from '@/components/ui/label';
import { useOnboarding } from '@/context/OnboardingContext';

export function MemberListPage() {
  const { t } = useTranslation();
  const { checkAndStartTutorial } = useOnboarding();
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Applied filters (actually used for filtering)
  const [appliedPaymentStatus, setAppliedPaymentStatus] = useState<'ALL' | 'PAID' | 'UNPAID'>('ALL');
  const [appliedMedicalStatus, setAppliedMedicalStatus] = useState<'ALL' | 'VALID' | 'EXPIRED'>('ALL');
  const [appliedGender, setAppliedGender] = useState<'ALL' | 'MALE' | 'FEMALE'>('ALL');
  const [appliedMinAge, setAppliedMinAge] = useState('');
  const [appliedMaxAge, setAppliedMaxAge] = useState('');

  // Temporary filters (in the filter panel, not yet applied)
  const [tempPaymentStatus, setTempPaymentStatus] = useState<'ALL' | 'PAID' | 'UNPAID'>('ALL');
  const [tempMedicalStatus, setTempMedicalStatus] = useState<'ALL' | 'VALID' | 'EXPIRED'>('ALL');
  const [tempGender, setTempGender] = useState<'ALL' | 'MALE' | 'FEMALE'>('ALL');
  const [tempMinAge, setTempMinAge] = useState('');
  const [tempMaxAge, setTempMaxAge] = useState('');

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Start tutorial on first visit
  useEffect(() => {
    checkAndStartTutorial('members');
  }, [checkAndStartTutorial]);

  const { data: members, isLoading, isError, refetch } = useMembers({
    search: debouncedSearch,
    paymentStatus: appliedPaymentStatus,
    medicalStatus: appliedMedicalStatus,
  });

  const deleteMemberMutation = useDeleteMember();

  const handleEdit = (member: Member) => {
    setSelectedMember(member);
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (member: Member) => {
    setSelectedMember(member);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedMember) {
      await deleteMemberMutation.mutateAsync(selectedMember.id);
      setSelectedMember(null);
    }
  };

  const handleApplyFilters = () => {
    setAppliedPaymentStatus(tempPaymentStatus);
    setAppliedMedicalStatus(tempMedicalStatus);
    setAppliedGender(tempGender);
    setAppliedMinAge(tempMinAge);
    setAppliedMaxAge(tempMaxAge);
  };

  const handleClearFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setTempPaymentStatus('ALL');
    setTempMedicalStatus('ALL');
    setTempGender('ALL');
    setTempMinAge('');
    setTempMaxAge('');
    setAppliedPaymentStatus('ALL');
    setAppliedMedicalStatus('ALL');
    setAppliedGender('ALL');
    setAppliedMinAge('');
    setAppliedMaxAge('');
  };

  // Client-side filtering for gender and age
  const filteredMembers = members?.filter((member) => {
    if (appliedGender !== 'ALL' && member.gender !== appliedGender) return false;
    if (appliedMinAge && member.age < parseInt(appliedMinAge)) return false;
    if (appliedMaxAge && member.age > parseInt(appliedMaxAge)) return false;
    return true;
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-9 w-48 bg-muted animate-pulse rounded" />
            <div className="h-5 w-64 bg-muted animate-pulse rounded" />
          </div>
          <div className="h-10 w-32 bg-muted animate-pulse rounded" />
        </div>
        <SkeletonTable rows={8} columns={6} />
      </div>
    );
  }

  if (isError) {
    return <ErrorMessage message={t('errors.loadMembers')} onRetry={refetch} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('members.title')}</h1>
          <p className="text-muted-foreground">
            {t('members.subtitle')}
          </p>
        </div>
        <Button
          data-tour="add-member"
          onClick={() => setAddDialogOpen(true)}
          className="bg-green-600 hover:bg-green-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          {t('members.addMember')}
        </Button>
      </div>

      <FilterPanel onClear={handleClearFilters} title={t('members.advancedFilters')}>
        <div data-tour="filters">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Search */}
          <div className="space-y-2">
            <Label htmlFor="search">{t('members.searchByName')}</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder={t('members.searchPlaceholder')}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {/* Payment Status Filter */}
          <div className="space-y-2">
            <Label htmlFor="payment-status">{t('members.paymentStatus')}</Label>
            <Select
              value={tempPaymentStatus}
              onValueChange={(value) => setTempPaymentStatus(value as any)}
            >
              <SelectTrigger id="payment-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t('members.allPaymentStatus')}</SelectItem>
                <SelectItem value="PAID">{t('status.paid')}</SelectItem>
                <SelectItem value="UNPAID">{t('status.unpaid')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Medical Status Filter */}
          <div className="space-y-2">
            <Label htmlFor="medical-status">{t('members.medicalStatus')}</Label>
            <Select
              value={tempMedicalStatus}
              onValueChange={(value) => setTempMedicalStatus(value as any)}
            >
              <SelectTrigger id="medical-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t('members.allMedicalStatus')}</SelectItem>
                <SelectItem value="VALID">{t('status.valid')}</SelectItem>
                <SelectItem value="EXPIRED">{t('status.expired')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Gender Filter */}
          <div className="space-y-2">
            <Label htmlFor="gender">{t('members.gender')}</Label>
            <Select
              value={tempGender}
              onValueChange={(value) => setTempGender(value as any)}
            >
              <SelectTrigger id="gender">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t('members.allGenders')}</SelectItem>
                <SelectItem value="MALE">{t('members.male')}</SelectItem>
                <SelectItem value="FEMALE">{t('members.female')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Min Age Filter */}
          <div className="space-y-2">
            <Label htmlFor="min-age">{t('members.minAge')}</Label>
            <Input
              id="min-age"
              type="number"
              placeholder={t('members.minAge')}
              value={tempMinAge}
              onChange={(e) => setTempMinAge(e.target.value)}
              min="0"
              max="100"
            />
          </div>

          {/* Max Age Filter */}
          <div className="space-y-2">
            <Label htmlFor="max-age">{t('members.maxAge')}</Label>
            <Input
              id="max-age"
              type="number"
              placeholder={t('members.maxAge')}
              value={tempMaxAge}
              onChange={(e) => setTempMaxAge(e.target.value)}
              min="0"
              max="100"
            />
          </div>
        </div>
        </div>

        {/* Apply Filters Button */}
        <div className="flex justify-end gap-2 pt-4 border-t border-border mt-4">
          <Button
            onClick={handleApplyFilters}
            className="bg-green-600 hover:bg-green-700"
          >
            <Search className="mr-2 h-4 w-4" />
            {t('members.applyFilters')}
          </Button>
        </div>
      </FilterPanel>

      <Card data-tour="members-table">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('members.member')}</TableHead>
                <TableHead>{t('members.age')}</TableHead>
                <TableHead>{t('members.group')}</TableHead>
                <TableHead>{t('profile.monthlyFee')}</TableHead>
                <TableHead>{t('members.paymentStatus')}</TableHead>
                <TableHead>{t('members.medicalStatus')}</TableHead>
                <TableHead className="text-right">{t('members.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers && filteredMembers.length > 0 ? (
                filteredMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-green-600 flex items-center justify-center text-white font-semibold">
                          {member.profileImage ? (
                            <img
                              src={member.profileImage}
                              alt={member.fullName}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <User className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{member.fullName}</div>
                          <div className="text-sm text-muted-foreground">
                            {member.gender}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{member.age} {t('members.years')}</TableCell>
                    <TableCell>{member.groupName}</TableCell>
                    <TableCell>{(member as any).membershipFee || '--'} RSD</TableCell>
                    <TableCell>
                      <StatusBadge
                        status={member.paymentStatus}
                        type="payment"
                      />
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        status={member.medicalStatus}
                        type="medical"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(member)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(member)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">
                    <div className="flex flex-col items-center gap-2">
                      <User className="h-12 w-12 text-muted-foreground" />
                      <p className="text-muted-foreground">{t('members.noMembers')}</p>
                      <Button
                        onClick={() => setAddDialogOpen(true)}
                        variant="outline"
                        className="mt-2"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        {t('members.addFirstMember')}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <AddMemberDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
      <EditMemberDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        member={selectedMember}
      />
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={t('members.deleteMember')}
        message={t('members.deleteConfirm', { name: selectedMember?.fullName })}
        onConfirm={handleDeleteConfirm}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        variant="destructive"
      />

    </div>
  );
}
