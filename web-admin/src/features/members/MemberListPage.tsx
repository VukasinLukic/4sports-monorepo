import { useState } from 'react';
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

export function MemberListPage() {
  const [search, setSearch] = useState('');

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

  const { data: members, isLoading, isError, refetch } = useMembers({
    search,
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
    setSearch('');
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
    return <ErrorMessage message="Failed to load members" onRetry={refetch} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Members</h1>
          <p className="text-muted-foreground">
            Manage club members and their information
          </p>
        </div>
        <Button
          onClick={() => setAddDialogOpen(true)}
          className="bg-green-600 hover:bg-green-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Member
        </Button>
      </div>

      <FilterPanel onClear={handleClearFilters} title="Advanced Filters">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Search */}
          <div className="space-y-2">
            <Label htmlFor="search">Search by Name</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Search by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {/* Payment Status Filter */}
          <div className="space-y-2">
            <Label htmlFor="payment-status">Payment Status</Label>
            <Select
              value={tempPaymentStatus}
              onValueChange={(value) => setTempPaymentStatus(value as any)}
            >
              <SelectTrigger id="payment-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Payment Status</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="UNPAID">Unpaid</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Medical Status Filter */}
          <div className="space-y-2">
            <Label htmlFor="medical-status">Medical Status</Label>
            <Select
              value={tempMedicalStatus}
              onValueChange={(value) => setTempMedicalStatus(value as any)}
            >
              <SelectTrigger id="medical-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Medical Status</SelectItem>
                <SelectItem value="VALID">Valid</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Gender Filter */}
          <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            <Select
              value={tempGender}
              onValueChange={(value) => setTempGender(value as any)}
            >
              <SelectTrigger id="gender">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Genders</SelectItem>
                <SelectItem value="MALE">Male</SelectItem>
                <SelectItem value="FEMALE">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Min Age Filter */}
          <div className="space-y-2">
            <Label htmlFor="min-age">Min Age</Label>
            <Input
              id="min-age"
              type="number"
              placeholder="Min age"
              value={tempMinAge}
              onChange={(e) => setTempMinAge(e.target.value)}
              min="0"
              max="100"
            />
          </div>

          {/* Max Age Filter */}
          <div className="space-y-2">
            <Label htmlFor="max-age">Max Age</Label>
            <Input
              id="max-age"
              type="number"
              placeholder="Max age"
              value={tempMaxAge}
              onChange={(e) => setTempMaxAge(e.target.value)}
              min="0"
              max="100"
            />
          </div>
        </div>

        {/* Apply Filters Button */}
        <div className="flex justify-end gap-2 pt-4 border-t border-border mt-4">
          <Button
            onClick={handleApplyFilters}
            className="bg-green-600 hover:bg-green-700"
          >
            <Search className="mr-2 h-4 w-4" />
            Apply Filters
          </Button>
        </div>
      </FilterPanel>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Group</TableHead>
                <TableHead>Payment Status</TableHead>
                <TableHead>Medical Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
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
                    <TableCell>{member.age} years</TableCell>
                    <TableCell>{member.groupName}</TableCell>
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
                      <p className="text-muted-foreground">No members found</p>
                      <Button
                        onClick={() => setAddDialogOpen(true)}
                        variant="outline"
                        className="mt-2"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add First Member
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
        title="Delete Member"
        message={`Are you sure you want to delete ${selectedMember?.fullName}? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
}
