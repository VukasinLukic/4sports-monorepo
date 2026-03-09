import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { format, addMonths } from 'date-fns';
import { sr } from 'date-fns/locale';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useCreateEvent, useUpdateEvent, useGroups, Group, Event } from './useEvents';
import { Loader2, ChevronDown, ChevronUp, Repeat, X, Plus, CalendarIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CreateEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate?: Date;
  event?: Event | null; // If provided, dialog is in edit mode
}

const toLocalDateStr = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseLocalDateStr = (dateStr: string): Date => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export function CreateEventDialog({ open, onOpenChange, selectedDate, event }: CreateEventDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const createEventMutation = useCreateEvent();
  const updateEventMutation = useUpdateEvent();
  const { data: groups, isLoading: isLoadingGroups } = useGroups();
  const isEditMode = !!event;

  const STORAGE_KEY_TYPES = '4sports_custom_event_types';
  const STORAGE_KEY_EQUIPMENT = '4sports_saved_equipment';

  const [customTypes, setCustomTypes] = useState<{ id: string; label: string }[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_TYPES);
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });
  const [savedEquipment, setSavedEquipment] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_EQUIPMENT);
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });
  const [newTypeName, setNewTypeName] = useState('');
  const [showAddType, setShowAddType] = useState(false);
  const [newEquipmentName, setNewEquipmentName] = useState('');
  const [showAddEquipment, setShowAddEquipment] = useState(false);

  const DEFAULT_TYPES = [
    { id: 'TRAINING', label: t('calendar.training') },
    { id: 'MATCH', label: t('calendar.match') },
    { id: 'OTHER', label: t('calendar.other') },
  ];
  const EVENT_TYPES = [...DEFAULT_TYPES, ...customTypes];
  const DAYS_OF_WEEK_LABELS = t('calendar.days', { returnObjects: true }) as string[];
  const DAYS_OF_WEEK = DAYS_OF_WEEK_LABELS.map((label, i) => ({ id: i, label }));

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
    equipment: [] as string[],
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (selectedDate && !event) {
      setFormData((prev) => ({
        ...prev,
        date: toLocalDateStr(selectedDate),
      }));
    }
  }, [selectedDate, event]);

  useEffect(() => {
    if (groups && groups.length > 0 && !formData.groupId && !event) {
      setFormData((prev) => ({ ...prev, groupId: groups[0]._id }));
    }
  }, [groups, formData.groupId, event]);

  // Populate form when editing
  useEffect(() => {
    if (event && open) {
      const startDate = new Date(event.startTime);
      const endDate = new Date(event.endTime);

      const groupId = typeof event.groupId === 'string'
        ? event.groupId
        : event.groupId._id;

      // Ensure event type exists in customTypes if it's not a default type
      if (event.type && !DEFAULT_TYPES.some((t) => t.id === event.type) && !customTypes.some((t) => t.id === event.type)) {
        const newCustomType = { id: event.type, label: event.type };
        const updatedCustomTypes = [...customTypes, newCustomType];
        setCustomTypes(updatedCustomTypes);
        localStorage.setItem(STORAGE_KEY_TYPES, JSON.stringify(updatedCustomTypes));
      }

      setFormData({
        groupId: groupId,
        type: event.type || 'TRAINING',
        date: toLocalDateStr(startDate),
        startTime: `${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')}`,
        endTime: `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`,
        title: event.title || '',
        description: event.description || '',
        location: event.location || '',
        isRecurring: event.isRecurring || false,
        recurringFrequency: event.recurringPattern?.frequency || 'weekly',
        recurringDays: event.recurringPattern?.days || [],
        recurringUntil: event.recurringPattern?.until ? toLocalDateStr(new Date(event.recurringPattern.until)) : '',
        equipment: event.equipment || [],
      });

      // Advanced options remain closed by default
      setShowAdvanced(false);
    }
  }, [event, open]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.groupId) {
      newErrors.groupId = t('validation.selectGroup');
    }
    if (!formData.date) {
      newErrors.date = t('validation.selectDate');
    }
    if (!formData.startTime) {
      newErrors.startTime = t('validation.enterStartTime');
    }
    if (!formData.endTime) {
      newErrors.endTime = t('validation.enterEndTime');
    }
    if (formData.startTime >= formData.endTime) {
      newErrors.endTime = t('validation.endTimeAfterStart');
    }
    if (formData.isRecurring && !formData.recurringUntil) {
      newErrors.recurringUntil = t('validation.selectRepeatEnd');
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
        equipment: formData.equipment.length > 0 ? formData.equipment : undefined,
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

      if (isEditMode && event) {
        // Update existing event
        await updateEventMutation.mutateAsync({ id: event._id, data: eventData });
        toast({
          title: t('common.success'),
          description: t('calendar.eventUpdated') || 'Događaj uspešno izmenjen',
        });
      } else {
        // Create new event
        await createEventMutation.mutateAsync(eventData);
        toast({
          title: t('common.success'),
          description: t('calendar.eventCreated'),
        });
      }

      resetForm();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Failed to save event:', error);
      setErrors({
        submit: error.response?.data?.error?.message || (isEditMode ? t('calendar.eventUpdateFailed') || 'Izmena nije uspela' : t('calendar.eventCreateFailed')),
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
      equipment: [],
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

  const addCustomType = () => {
    const name = newTypeName.trim();
    if (!name) return;
    const id = name.toUpperCase().replace(/\s+/g, '_');
    if (EVENT_TYPES.some((t) => t.id === id)) return;
    const updated = [...customTypes, { id, label: name }];
    setCustomTypes(updated);
    localStorage.setItem(STORAGE_KEY_TYPES, JSON.stringify(updated));
    handleChange('type', id);
    setNewTypeName('');
    setShowAddType(false);
  };

  const addEquipmentItem = () => {
    const name = newEquipmentName.trim();
    if (!name) return;
    if (!savedEquipment.includes(name)) {
      const updated = [...savedEquipment, name];
      setSavedEquipment(updated);
      localStorage.setItem(STORAGE_KEY_EQUIPMENT, JSON.stringify(updated));
    }
    if (!formData.equipment.includes(name)) {
      handleChange('equipment', [...formData.equipment, name]);
    }
    setNewEquipmentName('');
    setShowAddEquipment(false);
  };

  const removeEquipmentItem = (item: string) => {
    handleChange('equipment', formData.equipment.filter((e) => e !== item));
  };

  const toggleEquipmentItem = (item: string) => {
    if (formData.equipment.includes(item)) {
      removeEquipmentItem(item);
    } else {
      handleChange('equipment', [...formData.equipment, item]);
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
          <DialogTitle>{isEditMode ? (t('calendar.editEvent') || 'Izmeni događaj') : t('calendar.newEvent')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Event Type */}
            <div className="grid gap-2">
              <Label htmlFor="type">
                {t('calendar.eventType')} <span className="text-red-500">*</span>
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
              {!showAddType ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="justify-start text-xs text-muted-foreground px-0"
                  onClick={() => setShowAddType(true)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {t('calendar.addCustomType')}
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Input
                    value={newTypeName}
                    onChange={(e) => setNewTypeName(e.target.value)}
                    placeholder={t('calendar.customTypePlaceholder')}
                    className="h-8 text-sm"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomType())}
                  />
                  <Button type="button" size="sm" className="h-8" onClick={addCustomType}>
                    {t('common.add')}
                  </Button>
                  <Button type="button" variant="ghost" size="sm" className="h-8" onClick={() => { setShowAddType(false); setNewTypeName(''); }}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>

            {/* Group */}
            <div className="grid gap-2">
              <Label htmlFor="groupId">
                {t('calendar.group')} <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.groupId}
                onValueChange={(value) => handleChange('groupId', value)}
                disabled={isLoadingGroups}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('calendar.selectGroup')} />
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
              <Label>
                {t('calendar.date')} <span className="text-red-500">*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.date
                      ? format(parseLocalDateStr(formData.date), 'PPP', { locale: sr })
                      : t('validation.selectDate')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.date ? parseLocalDateStr(formData.date) : undefined}
                    onSelect={(date) => {
                      if (date) handleChange('date', toLocalDateStr(date));
                    }}
                    disabled={{ before: new Date() }}
                  />
                </PopoverContent>
              </Popover>
              {errors.date && <p className="text-sm text-red-500">{errors.date}</p>}
            </div>

            {/* Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startTime">
                  {t('calendar.startTime')} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => handleStartTimeChange(e.target.value)}
                  className="[&::-webkit-calendar-picker-indicator]:opacity-60 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                />
                {errors.startTime && <p className="text-sm text-red-500">{errors.startTime}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endTime">
                  {t('calendar.endTime')} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => handleChange('endTime', e.target.value)}
                  className="[&::-webkit-calendar-picker-indicator]:opacity-60 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                />
                {errors.endTime && <p className="text-sm text-red-500">{errors.endTime}</p>}
              </div>
            </div>

            {/* Recurring Toggle */}
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div className="flex items-center gap-2">
                <Repeat className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="isRecurring" className="cursor-pointer">{t('calendar.recurring')}</Label>
              </div>
              <Switch
                id="isRecurring"
                checked={formData.isRecurring}
                onCheckedChange={(checked) => {
                  if (checked && formData.date) {
                    const eventDate = parseLocalDateStr(formData.date);
                    const dayOfWeek = eventDate.getDay(); // 0=Sun ... 6=Sat
                    const untilDate = addMonths(eventDate, 1);
                    setFormData((prev) => ({
                      ...prev,
                      isRecurring: true,
                      recurringUntil: toLocalDateStr(untilDate),
                      recurringDays: prev.recurringDays.includes(dayOfWeek) ? prev.recurringDays : [...prev.recurringDays, dayOfWeek],
                    }));
                  } else {
                    handleChange('isRecurring', checked);
                  }
                }}
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
                      {freq === 'daily' ? t('calendar.daily') : freq === 'weekly' ? t('calendar.weekly') : t('calendar.monthly')}
                    </Button>
                  ))}
                </div>

                {formData.recurringFrequency === 'weekly' && (
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">{t('calendar.daysOfWeek')}</Label>
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
                  <Label className="text-xs text-muted-foreground">{t('calendar.repeatUntil')}</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-start text-left font-normal h-9 text-sm"
                      >
                        <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                        {formData.recurringUntil
                          ? format(parseLocalDateStr(formData.recurringUntil), 'PPP', { locale: sr })
                          : t('validation.selectRepeatEnd')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.recurringUntil ? parseLocalDateStr(formData.recurringUntil) : undefined}
                        onSelect={(date) => {
                          if (date) handleChange('recurringUntil', toLocalDateStr(date));
                        }}
                        disabled={{ before: formData.date ? parseLocalDateStr(formData.date) : new Date() }}
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.recurringUntil && <p className="text-sm text-red-500">{errors.recurringUntil}</p>}
                </div>
              </div>
            )}

            {/* Separator */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
            </div>

            {/* Advanced Options Toggle */}
            <Button
              type="button"
              variant="ghost"
              className="w-full justify-between"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <span className="text-sm font-medium">{t('calendar.advancedOptions')}</span>
              {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>

            {showAdvanced && (
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">{t('calendar.titleOptional')}</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    placeholder={generateTitle()}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('calendar.titleAutoGenerate')}
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="location">{t('calendar.locationOptional')}</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleChange('location', e.target.value)}
                    placeholder={t('calendar.enterLocation')}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">{t('calendar.descriptionOptional')}</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder={t('calendar.descriptionPlaceholder')}
                    className="min-h-[80px]"
                  />
                </div>

                {/* Equipment */}
                <div className="grid gap-2">
                  <Label>{t('calendar.equipmentOptional')}</Label>
                  {formData.equipment.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {formData.equipment.map((item) => (
                        <span
                          key={item}
                          className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs font-medium px-2.5 py-1 rounded-full"
                        >
                          {item}
                          <button type="button" onClick={() => removeEquipmentItem(item)} className="hover:text-destructive">
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  {savedEquipment.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {savedEquipment.filter((e) => !formData.equipment.includes(e)).map((item) => (
                        <Button
                          key={item}
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => toggleEquipmentItem(item)}
                        >
                          + {item}
                        </Button>
                      ))}
                    </div>
                  )}
                  {!showAddEquipment ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="justify-start text-xs text-muted-foreground px-0"
                      onClick={() => setShowAddEquipment(true)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      {t('calendar.addEquipment')}
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        value={newEquipmentName}
                        onChange={(e) => setNewEquipmentName(e.target.value)}
                        placeholder={t('calendar.equipmentPlaceholder')}
                        className="h-8 text-sm"
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addEquipmentItem())}
                      />
                      <Button type="button" size="sm" className="h-8" onClick={addEquipmentItem}>
                        {t('common.add')}
                      </Button>
                      <Button type="button" variant="ghost" size="sm" className="h-8" onClick={() => { setShowAddEquipment(false); setNewEquipmentName(''); }}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
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
              disabled={createEventMutation.isPending || updateEventMutation.isPending}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={createEventMutation.isPending || updateEventMutation.isPending || isLoadingGroups || !groups?.length}
              className="bg-green-600 hover:bg-green-700"
            >
              {(createEventMutation.isPending || updateEventMutation.isPending) ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditMode ? (t('common.updating') || 'Ažuriram...') : t('common.creating')}
                </>
              ) : (
                isEditMode ? (t('calendar.updateEvent') || 'Izmeni') : t('calendar.createEvent')
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
