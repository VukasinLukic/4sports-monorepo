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
import { Loader2 } from 'lucide-react';
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

export function CreateEventDialog({ open, onOpenChange, selectedDate }: CreateEventDialogProps) {
  const { toast } = useToast();
  const createEventMutation = useCreateEvent();
  const { data: groups, isLoading: isLoadingGroups } = useGroups();

  const [formData, setFormData] = useState({
    groupId: '',
    type: 'TRAINING',
    date: new Date().toISOString().split('T')[0],
    startTime: '18:00',
    endTime: '19:30',
    title: '',
    description: '',
    location: '',
    isMandatory: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (selectedDate) {
      setFormData((prev) => ({
        ...prev,
        date: selectedDate.toISOString().split('T')[0],
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
      const startDateTime = new Date(formData.date);
      const [startHour, startMin] = formData.startTime.split(':').map(Number);
      startDateTime.setHours(startHour, startMin, 0, 0);

      const endDateTime = new Date(formData.date);
      const [endHour, endMin] = formData.endTime.split(':').map(Number);
      endDateTime.setHours(endHour, endMin, 0, 0);

      await createEventMutation.mutateAsync({
        groupId: formData.groupId,
        title: formData.title.trim() || generateTitle(),
        description: formData.description.trim() || undefined,
        type: formData.type,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        location: formData.location.trim() || undefined,
        isMandatory: formData.isMandatory,
      });

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
      date: new Date().toISOString().split('T')[0],
      startTime: '18:00',
      endTime: '19:30',
      title: '',
      description: '',
      location: '',
      isMandatory: true,
    });
    setErrors({});
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
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
                min={new Date().toISOString().split('T')[0]}
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
                  onChange={(e) => handleChange('startTime', e.target.value)}
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

            {/* Title (optional) */}
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

            {/* Location (optional) */}
            <div className="grid gap-2">
              <Label htmlFor="location">Lokacija (opciono)</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleChange('location', e.target.value)}
                placeholder="Unesite lokaciju"
              />
            </div>

            {/* Description (optional) */}
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

            {/* Mandatory switch */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="isMandatory">Obavezan dolazak</Label>
                <p className="text-xs text-muted-foreground">
                  Članovi će biti obavešteni da je prisustvo obavezno
                </p>
              </div>
              <Switch
                id="isMandatory"
                checked={formData.isMandatory}
                onCheckedChange={(checked) => handleChange('isMandatory', checked)}
              />
            </div>

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
