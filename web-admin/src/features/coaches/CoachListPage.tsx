import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { GenerateInviteDialog } from './GenerateInviteDialog';
import { useCoaches, useDeleteCoach } from './useCoaches';
import { Coach } from '@/types';
import { Plus, Trash2, UserPlus, AlertTriangle } from 'lucide-react';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import { ErrorMessage } from '@/components/shared/ErrorMessage';

export function CoachListPage() {
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);

  const { data: coaches, isLoading, isError, refetch } = useCoaches();
  const deleteCoachMutation = useDeleteCoach();

  const handleDeleteClick = (coach: Coach) => {
    setSelectedCoach(coach);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedCoach) {
      await deleteCoachMutation.mutateAsync(selectedCoach.id);
      setSelectedCoach(null);
    }
  };

  const isContractExpiringSoon = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil(
      (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

  const isContractExpired = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    return expiry < today;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('sr-RS', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (isError) {
    return <ErrorMessage message="Failed to load coaches" onRetry={refetch} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Coaches</h1>
          <p className="text-muted-foreground">
            Manage coaches and their contracts
          </p>
        </div>
        <Button
          onClick={() => setInviteDialogOpen(true)}
          className="bg-green-600 hover:bg-green-700"
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Invite Coach
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Groups</TableHead>
                <TableHead>Contract Expiry</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coaches && coaches.length > 0 ? (
                coaches.map((coach) => (
                  <TableRow key={coach.id}>
                    <TableCell>
                      <div className="font-medium">{coach.fullName}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{coach.email}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{coach.phoneNumber}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{coach.groupsCount} groups</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">
                          {formatDate(coach.contractExpiryDate)}
                        </span>
                        {isContractExpired(coach.contractExpiryDate) && (
                          <Badge variant="destructive" className="gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Expired
                          </Badge>
                        )}
                        {isContractExpiringSoon(coach.contractExpiryDate) && (
                          <Badge
                            variant="outline"
                            className="gap-1 border-yellow-600 text-yellow-600"
                          >
                            <AlertTriangle className="h-3 w-3" />
                            Expiring Soon
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(coach)}
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
                      <UserPlus className="h-12 w-12 text-muted-foreground" />
                      <p className="text-muted-foreground">No coaches found</p>
                      <Button
                        onClick={() => setInviteDialogOpen(true)}
                        variant="outline"
                        className="mt-2"
                      >
                        <UserPlus className="mr-2 h-4 w-4" />
                        Invite First Coach
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
      <GenerateInviteDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
      />
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Remove Coach"
        message={`Are you sure you want to remove ${selectedCoach?.fullName}? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        confirmText="Remove"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
}
