import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useCreateEvent, useGroups, Group } from './useEvents';
import { Loader2, ChevronDown, ChevronUp, Repeat } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CreateEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate?: Date;
}

const EVENT_TYPES = [
  { id: 'TRAINING', label: 'Trening' },
  { id: 'MATCH', label: 'Utakmica' },
  { id: 'OTHER', label: 'Ostalo' },
];

const DAYS_OF_WEEK = [
  { id: 0, label: 'Ned' },
  { id: 1, label: 'Pon' },
  { id: 2, label: 'Uto' },
  { id: 3, label: 'Sre' },
  { id: 4, label: 'Čet' },
  { id: 5, label: 'Pet' },
  { id: 6, label: 'Sub' },
];

const toLocalDateStr = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export function CreateEventDialog({ open, onOpenChange, selectedDate }: CreateEventDialogProps) {
  const { toast } = useToast();
  const createEventMutation = useCreateEvent();
  const { data: groups, isLoading: isLoadingGroups } = useGroups();

  const [formData, setFormData] = useState({
    groupId: '',
    type: 'TRAINING',
    date: toLocalDateStr(new Date()),
    startTime: '18:00',
    endTime: '19:30',
    title: '',
    description: '',
    location: '',
    isRecurring: false,
    recurringFrequency: 'weekly' as 'daily' | 'weekly' | 'monthly',
    recurringDays: [] as number[],
    recurringUntil: '',
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (selectedDate) {
      setFormData((prev) => ({
        ...prev,
        date: toLocalDateStr(selectedDate),
      }));
    }
  }, [selectedDate]);

  useEffect(() => {
    if (groups && groups.length > 0 && !formData.groupId) {
      setFormData((prev) => ({ ...prev, groupId: groups[0]._id }));
    }
  }, [groups, formData.groupId]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.groupId) {
      newErrors.groupId = 'Izaberite grupu';
    }
    if (!formData.date) {
      newErrors.date = 'Izaberite datum';
    }
    if (!formData.startTime) {
      newErrors.startTime = 'Unesite vreme početka';
    }
    if (!formData.endTime) {
      newErrors.endTime = 'Unesite vreme završetka';
    }
    if (formData.startTime >= formData.endTime) {
      newErrors.endTime = 'Vreme završetka mora biti posle početka';
    }
    if (formData.isRecurring && !formData.recurringUntil) {
      newErrors.recurringUntil = 'Izaberite datum do kog se ponavlja';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateTitle = () => {
    const typeName = EVENT_TYPES.find((t) => t.id === formData.type)?.label || formData.type;
    const groupName = groups?.find((g: Group) => g._id === formData.groupId)?.name || '';
    return `${typeName} - ${groupName}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const [y, m, d] = formData.date.split('-').map(Number);
      const startDateTime = new Date(y, m - 1, d);
      const [startHour, startMin] = formData.startTime.split(':').map(Number);
      startDateTime.setHours(startHour, startMin, 0, 0);

      const endDateTime = new Date(y, m - 1, d);
      const [endHour, endMin] = formData.endTime.split(':').map(Number);
      endDateTime.setHours(endHour, endMin, 0, 0);

      const eventData: any = {
        groupId: formData.groupId,
        title: formData.title.trim() || generateTitle(),
        description: formData.description.trim() || undefined,
        type: formData.type,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        location: formData.location.trim() || undefined,
        isRecurring: formData.isRecurring,
      };

      if (formData.isRecurring) {
        const [uy, um, ud] = formData.recurringUntil.split('-').map(Number);
        eventData.recurringPattern = {
          frequency: formData.recurringFrequency,
          days: formData.recurringFrequency === 'weekly' ? formData.recurringDays : undefined,
          until: new Date(uy, um - 1, ud).toISOString(),
        };
      }

      await createEventMutation.mutateAsync(eventData);

      toast({
        title: 'Uspešno',
        description: 'Događaj je kreiran!',
      });

      resetForm();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Failed to create event:', error);
      setErrors({
        submit: error.response?.data?.error?.message || 'Greška pri kreiranju događaja',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      groupId: groups?.[0]?._id || '',
      type: 'TRAINING',
      date: toLocalDateStr(new Date()),
      startTime: '18:00',
      endTime: '19:30',
      title: '',
      description: '',
      location: '',
      isRecurring: false,
      recurringFrequency: 'weekly',
      recurringDays: [],
      recurringUntil: '',
    });
    setShowAdvanced(false);
    setErrors({});
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleStartTimeChange = (value: string) => {
    handleChange('startTime', value);
    if (value) {
      const [h, m] = value.split(':').map(Number);
      const totalMin = h * 60 + m + 90;
      const endH = Math.floor(totalMin / 60) % 24;
      const endM = totalMin % 60;
      handleChange('endTime', `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`);
    }
  };

  const toggleRecurringDay = (dayId: number) => {
    setFormData((prev) => ({
      ...prev,
      recurringDays: prev.recurringDays.includes(dayId)
        ? prev.recurringDays.filter((d) => d !== dayId)
        : [...prev.recurringDays, dayId],
    }));
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          resetForm();
        }
        onOpenChange(isOpen);
      }}
    >
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novi događaj</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Event Type */}
            <div className="grid gap-2">
              <Label htmlFor="type">
                Tip događaja <span className="text-red-500">*</span>
              </Label>
              <Select value={formData.type} onValueChange={(value) => handleChange('type', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Group */}
            <div className="grid gap-2">
              <Label htmlFor="groupId">
                Grupa <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.groupId}
                onValueChange={(value) => handleChange('groupId', value)}
                disabled={isLoadingGroups}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Izaberite grupu" />
                </SelectTrigger>
                <SelectContent>
                  {groups?.map((group: Group) => (
                    <SelectItem key={group._id} value={group._id}>
                      <div className="flex items-center gap-2">
                        {group.color && (
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: group.color }}
                          />
                        )}
                        {group.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.groupId && <p className="text-sm text-red-500">{errors.groupId}</p>}
            </div>

            {/* Date */}
            <div className="grid gap-2">
              <Label htmlFor="date">
                Datum <span className="text-red-500">*</span>
              </Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleChange('date', e.target.value)}
                min={toLocalDateStr(new Date())}
              />
              {errors.date && <p className="text-sm text-red-500">{errors.date}</p>}
            </div>

            {/* Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startTime">
                  Početak <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => handleStartTimeChange(e.target.value)}
                />
                {errors.startTime && <p className="text-sm text-red-500">{errors.startTime}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endTime">
                  Završetak <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => handleChange('endTime', e.target.value)}
                />
                {errors.endTime && <p className="text-sm text-red-500">{errors.endTime}</p>}
              </div>
            </div>

            {/* Recurring Toggle */}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <Repeat className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="isRecurring" className="cursor-pointer">Ponavljanje</Label>
              </div>
              <Switch
                id="isRecurring"
                checked={formData.isRecurring}
                onCheckedChange={(checked) => handleChange('isRecurring', checked)}
              />
            </div>

            {/* Recurring Options */}
            {formData.isRecurring && (
              <div className="space-y-3 rounded-lg border-l-4 border-primary pl-4 py-2">
                <div className="flex gap-2">
                  {(['daily', 'weekly', 'monthly'] as const).map((freq) => (
                    <Button
                      key={freq}
                      type="button"
                      size="sm"
                      variant={formData.recurringFrequency === freq ? 'default' : 'outline'}
                      onClick={() => handleChange('recurringFrequency', freq)}
                    >
                      {freq === 'daily' ? 'Dnevno' : freq === 'weekly' ? 'Nedeljno' : 'Mesečno'}
                    </Button>
                  ))}
                </div>

                {formData.recurringFrequency === 'weekly' && (
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Dani u nedelji</Label>
                    <div className="flex gap-1">
                      {DAYS_OF_WEEK.map((day) => (
                        <Button
                          key={day.id}
                          type="button"
                          size="sm"
                          variant={formData.recurringDays.includes(day.id) ? 'default' : 'outline'}
                          className="w-10 h-8 p-0 text-xs"
                          onClick={() => toggleRecurringDay(day.id)}
                        >
                          {day.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid gap-1">
                  <Label className="text-xs text-muted-foreground">Ponavlja se do</Label>
                  <Input
                    type="date"
                    value={formData.recurringUntil}
                    onChange={(e) => handleChange('recurringUntil', e.target.value)}
                    min={formData.date}
                  />
                  {errors.recurringUntil && <p className="text-sm text-red-500">{errors.recurringUntil}</p>}
                </div>
              </div>
            )}

            {/* Separator */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
            </div>

            {/* Advanced Options Toggle */}
            <Button
              type="button"
              variant="ghost"
              className="w-full justify-between"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <span className="text-sm font-medium">Napredne opcije</span>
              {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>

            {showAdvanced && (
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Naziv (opciono)</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    placeholder={generateTitle()}
                  />
                  <p className="text-xs text-muted-foreground">
                    Ako ostavite prazno, automatski će se generisati naziv
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="location">Lokacija (opciono)</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleChange('location', e.target.value)}
                    placeholder="Unesite lokaciju"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Opis (opciono)</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Dodatne informacije o događaju..."
                    className="min-h-[80px]"
                  />
                </div>
              </div>
            )}

            {errors.submit && <p className="text-sm text-red-500">{errors.submit}</p>}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createEventMutation.isPending}
            >
              Otkaži
            </Button>
            <Button
              type="submit"
              disabled={createEventMutation.isPending || isLoadingGroups || !groups?.length}
              className="bg-green-600 hover:bg-green-700"
            >
              {createEventMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Kreiranje...
                </>
              ) : (
                'Kreiraj događaj'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
