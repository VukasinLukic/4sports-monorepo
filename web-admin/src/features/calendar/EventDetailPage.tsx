import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  Check,
  X,
  Search,
  Loader2,
  FileText,
  UserCheck,
  UserX,
  AlertCircle,
} from 'lucide-react';
import {
  useEvent,
  useEventParticipants,
  useMarkAttendance,
  Participant,
} from './useEvents';
import { cn } from '@/lib/utils';

const getEventTypeColor = (type: string): string => {
  const upperType = type?.toUpperCase() || '';
  if (upperType === 'TRAINING' || upperType.includes('TRENING')) return 'bg-green-500';
  if (upperType === 'MATCH' || upperType.includes('UTAKMICA')) return 'bg-red-500';
  return 'bg-blue-500';
};

const getEventTypeLabel = (type: string): string => {
  const upperType = type?.toUpperCase() || '';
  if (upperType === 'TRAINING') return 'Trening';
  if (upperType === 'MATCH') return 'Utakmica';
  return type;
};

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
};

export function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: event, isLoading: eventLoading, error: eventError } = useEvent(id || null);
  const { data: participantsData, isLoading: participantsLoading } = useEventParticipants(id || null);
  const markAttendanceMutation = useMarkAttendance();

  const participants = participantsData?.participants || [];
  const stats = participantsData?.stats || {
    total: 0, confirmed: 0, declined: 0, pending: 0,
    present: 0, absent: 0, excused: 0, late: 0,
  };

  const filteredParticipants = participants.filter((p) => {
    if (!searchQuery) return true;
    const name = typeof p.memberId === 'object' ? p.memberId.fullName : '';
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleMarkAttendance = (memberId: string, status: 'PRESENT' | 'ABSENT') => {
    if (!id) return;
    markAttendanceMutation.mutate({ eventId: id, memberId, status });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('sr-RS', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('sr-RS', { hour: '2-digit', minute: '2-digit' });
  };

  if (eventLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (eventError || !event) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate('/calendar')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Nazad na kalendar
        </Button>
        <Card className="p-8 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium">Događaj nije pronađen</p>
        </Card>
      </div>
    );
  }

  const groupName = typeof event.groupId === 'object' ? event.groupId.name : '';
  const groupColor = typeof event.groupId === 'object' ? event.groupId.color : '#3b82f6';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/calendar')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{event.title}</h1>
            <Badge className={`${getEventTypeColor(event.type)} text-white`}>
              {getEventTypeLabel(event.type)}
            </Badge>
            {event.status === 'CANCELLED' && (
              <Badge variant="destructive">Otkazano</Badge>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Event Info */}
        <div className="lg:col-span-2 space-y-4">
          {/* Date & Time */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Datum</p>
                  <p className="font-medium capitalize">{formatDate(event.startTime)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Vreme</p>
                  <p className="font-medium">
                    {formatTime(event.startTime)} - {formatTime(event.endTime)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          {event.location && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Lokacija</p>
                    <p className="font-medium">{event.location}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Group */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${groupColor}20` }}
                >
                  <Users className="h-5 w-5" style={{ color: groupColor }} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Grupa</p>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: groupColor }}
                    />
                    <p className="font-medium">{groupName}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          {event.description && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                    <FileText className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Opis</p>
                    <p className="text-sm mt-1">{event.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Attendance Stats */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Evidencija prisustva</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                  <p className="text-2xl font-bold text-green-600">{stats.confirmed}</p>
                  <p className="text-xs text-muted-foreground">Potvrđeno</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                  <p className="text-xs text-muted-foreground">Na čekanju</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                  <p className="text-2xl font-bold text-blue-600">{stats.present}</p>
                  <p className="text-xs text-muted-foreground">Prisutno</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Participants */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                Učesnici ({stats.total})
              </CardTitle>
            </div>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pretraži učesnike..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent>
            {participantsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredParticipants.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nema učesnika</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {filteredParticipants.map((participant) => (
                  <ParticipantCard
                    key={participant._id}
                    participant={participant}
                    onMarkPresent={() =>
                      handleMarkAttendance(
                        typeof participant.memberId === 'object'
                          ? participant.memberId._id
                          : participant.memberId as string,
                        'PRESENT'
                      )
                    }
                    onMarkAbsent={() =>
                      handleMarkAttendance(
                        typeof participant.memberId === 'object'
                          ? participant.memberId._id
                          : participant.memberId as string,
                        'ABSENT'
                      )
                    }
                    isLoading={markAttendanceMutation.isPending}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ParticipantCard({
  participant,
  onMarkPresent,
  onMarkAbsent,
  isLoading,
}: {
  participant: Participant;
  onMarkPresent: () => void;
  onMarkAbsent: () => void;
  isLoading: boolean;
}) {
  const member = typeof participant.memberId === 'object' ? participant.memberId : null;
  const name = member?.fullName || 'Nepoznat';
  const avatar = member?.profileImage;

  const isPresent = participant.status === 'PRESENT' || participant.status === 'LATE';
  const isAbsent = participant.status === 'ABSENT';
  const isConfirmed = participant.rsvpStatus === 'CONFIRMED';

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border transition-colors',
        isPresent && 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800',
        isAbsent && 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800',
      )}
    >
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-semibold flex-shrink-0">
        {avatar ? (
          <img src={avatar} alt={name} className="w-10 h-10 rounded-full object-cover" />
        ) : (
          <span className="text-sm">{getInitials(name)}</span>
        )}
      </div>

      {/* Name & Status */}
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{name}</p>
        <div className="flex items-center gap-2">
          {isConfirmed ? (
            <span className="text-xs text-green-600 flex items-center gap-1">
              <UserCheck className="h-3 w-3" />
              Potvrđeno
            </span>
          ) : participant.rsvpStatus === 'DECLINED' ? (
            <span className="text-xs text-red-600 flex items-center gap-1">
              <UserX className="h-3 w-3" />
              Odbijeno
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">Nije potvrđeno</span>
          )}
          {participant.status === 'LATE' && (
            <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-300">
              Kasni
            </Badge>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-1 flex-shrink-0">
        <Button
          variant="outline"
          size="icon"
          className={cn(
            'h-9 w-9',
            isPresent && 'bg-green-500 text-white border-green-500 hover:bg-green-600 hover:text-white'
          )}
          onClick={onMarkPresent}
          disabled={isLoading}
        >
          <Check className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className={cn(
            'h-9 w-9',
            isAbsent && 'bg-red-500 text-white border-red-500 hover:bg-red-600 hover:text-white'
          )}
          onClick={onMarkAbsent}
          disabled={isLoading}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
