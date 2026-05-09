import { useState, useEffect } from 'react';
import { entities } from '@/api/entities';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, User, Target, Calendar } from 'lucide-react';

const GOALS = ['Pérdida de peso', 'Ganancia muscular', 'Rehabilitación', 'Rendimiento deportivo', 'Salud general', 'Flexibilidad y movilidad'];
const ACTIVITY_LEVELS = ['Sedentario', 'Levemente activo', 'Moderadamente activo', 'Muy activo', 'Extremadamente activo'];
const EQUIPMENT = ['Sin equipamiento (casa)', 'Equipamiento básico (casa)', 'Gimnasio completo', 'Piscina', 'Exterior/Parque'];
const GENDERS = ['Masculino', 'Femenino', 'Otro'];
const ACTIVITIES = ['Caminata', 'Trote/Running', 'Ciclismo', 'Natación', 'Fútbol', 'Tenis', 'Yoga', 'Pilates', 'Crossfit', 'Musculación', 'Boxeo', 'Danza', 'Senderismo', 'Remo'];

export default function Profile() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [customActivity, setCustomActivity] = useState('');

  const { data: profiles, isLoading } = useQuery({
    queryKey: ['profiles'],
    queryFn: () => entities.UserProfile.list(),
  });

  const existing = profiles?.[0];

  const [form, setForm] = useState({
    full_name: '', birth_date: '', gender: '', height_cm: '', weight_kg: '',
    occupation: '', goal: '', activity_level: '', available_days: '',
    session_duration_min: '', equipment_access: '', preferred_activities: [],
  });

  useEffect(() => {
    if (existing) {
      setForm({
        full_name: existing.full_name || '',
        birth_date: existing.birth_date || '',
        gender: existing.gender || '',
        height_cm: existing.height_cm || '',
        weight_kg: existing.weight_kg || '',
        occupation: existing.occupation || '',
        goal: existing.goal || '',
        activity_level: existing.activity_level || '',
        available_days: existing.available_days || '',
        session_duration_min: existing.session_duration_min || '',
        equipment_access: existing.equipment_access || '',
        preferred_activities: existing.preferred_activities || [],
      });
    }
  }, [existing]);

  const saveMutation = useMutation({
    mutationFn: (data) => existing
      ? entities.UserProfile.update(existing.id, data)
      : entities.UserProfile.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      toast({ title: 'Perfil guardado correctamente.' });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate({
      ...form,
      height_cm: Number(form.height_cm),
      weight_kg: Number(form.weight_kg),
      available_days: Number(form.available_days),
      session_duration_min: Number(form.session_duration_min),
    });
  };

  const toggleActivity = (act) => {
    setForm(f => ({
      ...f,
      preferred_activities: f.preferred_activities.includes(act)
        ? f.preferred_activities.filter(a => a !== act)
        : [...f.preferred_activities, act],
    }));
  };

  const addCustomActivity = () => {
    const trimmed = customActivity.trim();
    if (!trimmed || form.preferred_activities.includes(trimmed)) return;
    setForm(f => ({ ...f, preferred_activities: [...f.preferred_activities, trimmed] }));
    setCustomActivity('');
  };

  const set = (key) => (val) => setForm(f => ({ ...f, [key]: val }));

  if (isLoading) return <div className="flex items-center justify-center h-48"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium text-primary uppercase tracking-widest mb-1">Paso 01</p>
        <h1 className="text-2xl font-bold text-foreground">Mi Perfil</h1>
        <p className="text-muted-foreground mt-1">Información personal, objetivos y preferencias.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Personal */}
        <section className="step-card space-y-5">
          <div className="flex items-center gap-2 mb-2">
            <User className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-foreground">Datos Personales</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label>Nombre completo</Label>
              <Input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} placeholder="Juan Pérez" className="mt-1" />
            </div>
            <div>
              <Label>Fecha de nacimiento</Label>
              <Input type="date" value={form.birth_date} onChange={e => setForm(f => ({ ...f, birth_date: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label>Género</Label>
              <Select value={form.gender} onValueChange={set('gender')}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>{GENDERS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Altura (cm)</Label>
              <Input type="number" value={form.height_cm} onChange={e => setForm(f => ({ ...f, height_cm: e.target.value }))} placeholder="175" className="mt-1" />
            </div>
            <div>
              <Label>Peso (kg)</Label>
              <Input type="number" value={form.weight_kg} onChange={e => setForm(f => ({ ...f, weight_kg: e.target.value }))} placeholder="75" className="mt-1" />
            </div>
            <div className="sm:col-span-2">
              <Label>Ocupación</Label>
              <Input value={form.occupation} onChange={e => setForm(f => ({ ...f, occupation: e.target.value }))} placeholder="Oficinista, estudiante..." className="mt-1" />
            </div>
          </div>
        </section>

        {/* Goals & Schedule */}
        <section className="step-card space-y-5">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-foreground">Objetivos y Disponibilidad</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label>Objetivo principal</Label>
              <Select value={form.goal} onValueChange={set('goal')}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccionar objetivo" /></SelectTrigger>
                <SelectContent>{GOALS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Nivel de actividad actual</Label>
              <Select value={form.activity_level} onValueChange={set('activity_level')}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccionar nivel" /></SelectTrigger>
                <SelectContent>{ACTIVITY_LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Equipamiento disponible</Label>
              <Select value={form.equipment_access} onValueChange={set('equipment_access')}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>{EQUIPMENT.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Días disponibles por semana</Label>
              <Input type="number" min="1" max="7" value={form.available_days} onChange={e => setForm(f => ({ ...f, available_days: e.target.value }))} placeholder="3" className="mt-1" />
            </div>
            <div>
              <Label>Duración por sesión (min)</Label>
              <Input type="number" value={form.session_duration_min} onChange={e => setForm(f => ({ ...f, session_duration_min: e.target.value }))} placeholder="45" className="mt-1" />
            </div>
          </div>
        </section>

        {/* Activities */}
        <section className="step-card">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-foreground">Actividades Preferidas</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {ACTIVITIES.map(act => (
              <button
                key={act}
                type="button"
                onClick={() => toggleActivity(act)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  form.preferred_activities.includes(act)
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-secondary text-secondary-foreground border-border hover:border-primary/50'
                }`}
              >
                {act}
              </button>
            ))}
            {/* Custom activities already added */}
            {form.preferred_activities.filter(a => !ACTIVITIES.includes(a)).map(act => (
              <button
                key={act}
                type="button"
                onClick={() => toggleActivity(act)}
                className="px-3 py-1.5 rounded-full text-sm border bg-primary text-primary-foreground border-primary"
              >
                {act} ✕
              </button>
            ))}
          </div>
          <div className="flex gap-2 mt-3">
            <Input
              value={customActivity}
              onChange={e => setCustomActivity(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomActivity(); } }}
              placeholder="Otra actividad..."
              className="max-w-xs"
            />
            <button
              type="button"
              onClick={addCustomActivity}
              className="px-3 py-1.5 rounded-md text-sm bg-secondary text-secondary-foreground border border-border hover:bg-secondary/80 transition-colors"
            >
              Agregar
            </button>
          </div>
        </section>

        <Button type="submit" disabled={saveMutation.isPending} className="w-full sm:w-auto">
          <Save className="w-4 h-4 mr-2" />
          {saveMutation.isPending ? 'Guardando...' : 'Guardar Perfil'}
        </Button>
      </form>
    </div>
  );
}
