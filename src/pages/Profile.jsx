import { useState, useEffect } from 'react';
import { entities } from '@/api/entities';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Save, User, Target, Heart, Activity, Trophy, Clock, Zap } from 'lucide-react';
import BodyFatReference from '@/components/BodyFatReference';

// Arrays de opciones
const GOALS = ['Pérdida de peso', 'Ganancia muscular', 'Rehabilitación', 'Rendimiento deportivo', 'Salud general', 'Flexibilidad y movilidad'];
const ACTIVITY_LEVELS = ['Sedentario', 'Levemente activo', 'Moderadamente activo', 'Muy activo', 'Extremadamente activo'];
const EQUIPMENT = ['Sin equipamiento (casa)', 'Equipamiento básico (casa)', 'Gimnasio completo', 'Piscina', 'Exterior/Parque'];
const GENDERS = ['Masculino', 'Femenino', 'Otro'];
const ACTIVITIES = ['Caminata', 'Trote/Running', 'Ciclismo', 'Natación', 'Fútbol', 'Tenis', 'Yoga', 'Pilates', 'Crossfit', 'Musculación', 'Boxeo', 'Danza', 'Senderismo', 'Remo'];
const BODY_TYPES = ['Ectomorfo (delgado)', 'Mesomorfo (atlético)', 'Endomorfo (robusto)', 'Mixto'];
const POSTURE_TYPES = ['Neutra/alineada', 'Cifosis (joroba)', 'Lordosis lumbar exagerada', 'Escoliosis', 'Cabeza adelantada', 'Hombros caídos', 'Rodillas en valgo', 'Rodillas en varo', 'Pies planos', 'No estoy seguro'];
const WORK_TYPES = ['Sedentario (oficina)', 'Semi-sedentario', 'De pie/caminando', 'Físico moderado', 'Físico intenso'];
const ALCOHOL_FREQ = ['Nunca', '1-2 veces/mes', '1 vez/semana', '2-3 veces/semana', '4+ veces/semana', 'Diario'];
const SMOKING = ['No fumo', 'Fumador ocasional', 'Fumador diario', 'Vapeador', 'Ex-fumador'];
const CAFFEINE = ['Nada', '1 taza café', '2-3 tazas', '4+ tazas', 'Bebidas energéticas'];
const TRAINING_TIME = ['Mañana (6-9h)', 'Mediodía (10-14h)', 'Tarde (15-18h)', 'Noche (19-22h)', 'Variable'];
const TRAINING_STYLE = ['Solo', 'Con amigo/a', 'Grupo/clase', 'Con entrenador personal', 'Online/remoto'];
const COMPETITIVE = ['Recreativo / salud', 'Semi-competitivo', 'Competitivo amateur', 'Competitivo profesional'];

export default function Profile() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [customActivity, setCustomActivity] = useState('');

  const { data: profiles, isLoading } = useQuery({
    queryKey: ['profiles'],
    queryFn: () => entities.UserProfile.list(),
  });

  const existing = profiles?.[0];

  // Estado inicial con TODOS los campos nuevos
  const [form, setForm] = useState({
    // Datos personales (originales)
    full_name: '', birth_date: '', gender: '', height_cm: '', weight_kg: '',
    occupation: '', goal: '', activity_level: '', available_days: '',
    session_duration_min: '', equipment_access: '', preferred_activities: [],
    
    // Físico y salud (nuevos)
    body_fat_pct_estimate: '', muscle_mass_kg_estimate: '', neck_circumference_cm: '',
    wrist_circumference_cm: '', body_type: '', posture: '', flexibility_level: '',
    chronic_pain_areas: '',
    
    // Estilo de vida (nuevos)
    sleep_hours: '', sleep_quality: '', stress_level: '', work_type: '',
    preferred_training_time: '', meals_per_day: '', alcohol_frequency: '',
    smoking_status: '', caffeine_intake: '', current_supplements: '',
    
    // Historial deportivo (nuevos)
    previous_sports: '', personal_best_record: '', years_training: '',
    previous_coach: '', past_injuries: '', orthopedic_surgeries: '',
    hospitalizations: '', food_allergies: '', food_intolerances: '',
    
    // Metas y preferencias (nuevos)
    target_date: '', target_weight_kg: '', target_body_fat_pct: '',
    training_location_pref: '', hated_exercises: '', loved_exercises: '',
    competitive_level: '', training_companions: '',
  });

  useEffect(() => {
    if (existing) {
      setForm(prev => ({
        ...prev,
        ...existing,
        preferred_activities: existing.preferred_activities || [],
      }));
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
      height_cm: Number(form.height_cm) || undefined,
      weight_kg: Number(form.weight_kg) || undefined,
      available_days: Number(form.available_days) || undefined,
      session_duration_min: Number(form.session_duration_min) || undefined,
      body_fat_pct_estimate: Number(form.body_fat_pct_estimate) || undefined,
      muscle_mass_kg_estimate: Number(form.muscle_mass_kg_estimate) || undefined,
      neck_circumference_cm: Number(form.neck_circumference_cm) || undefined,
      wrist_circumference_cm: Number(form.wrist_circumference_cm) || undefined,
      flexibility_level: Number(form.flexibility_level) || undefined,
      sleep_hours: Number(form.sleep_hours) || undefined,
      sleep_quality: Number(form.sleep_quality) || undefined,
      stress_level: Number(form.stress_level) || undefined,
      meals_per_day: Number(form.meals_per_day) || undefined,
      years_training: Number(form.years_training) || undefined,
      target_weight_kg: Number(form.target_weight_kg) || undefined,
      target_body_fat_pct: Number(form.target_body_fat_pct) || undefined,
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

  const setVal = (key) => (val) => setForm(f => ({ ...f, [key]: val }));

  if (isLoading) return <div className="flex items-center justify-center h-48"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium text-primary uppercase tracking-widest mb-1">Paso 01</p>
        <h1 className="text-2xl font-bold text-foreground">Mi Perfil</h1>
        <p className="text-muted-foreground mt-1">Completa tu ficha para que el especialista arme tu plan ideal.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">

        {/* ========== DATOS PERSONALES ========== */}
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
              <Select value={form.gender} onValueChange={setVal('gender')}>
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
              <Input value={form.occupation} onChange={e => setForm(f => ({ ...f, occupation: e.target.value }))} placeholder="Oficinista, estudiante, obrero..." className="mt-1" />
            </div>
          </div>
        </section>

        {/* ========== BASELINE FÍSICO ========== */}
        <section className="step-card space-y-5">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-foreground">Baseline Físico</h2>
          </div>
          {/* % Grasa con referencia visual */}
<div className="sm:col-span-2">
  <Label>% Grasa corporal estimado (compará con las imágenes)</Label>
  <BodyFatReference 
    gender={form.gender} 
    onSelect={(pct) => setForm(f => ({ ...f, body_fat_pct_estimate: pct }))} 
  />
  <input type="hidden" value={form.body_fat_pct_estimate} />
</div>

{/* Masa muscular calculada automáticamente */}
<div>
  <Label>Masa magra estimada (kg) — calculada automáticamente</Label>
  <div className="mt-1 p-3 bg-secondary/50 rounded-lg">
    <p className="text-lg font-semibold text-foreground">
      {form.weight_kg && form.body_fat_pct_estimate
        ? (Number(form.weight_kg) * (1 - Number(form.body_fat_pct_estimate) / 100)).toFixed(1)
        : '—'} kg
    </p>
    <p className="text-xs text-muted-foreground mt-1">
      Fórmula: Peso × (1 - %grasa/100)
    </p>
  </div>
</div>

<div>
  <Label>Masa muscular estimada (kg) — aproximado</Label>
  <div className="mt-1 p-3 bg-secondary/50 rounded-lg">
    <p className="text-lg font-semibold text-foreground">
      {form.weight_kg && form.body_fat_pct_estimate
        ? (Number(form.weight_kg) * (1 - Number(form.body_fat_pct_estimate) / 100) - 4).toFixed(1)
        : '—'} kg
    </p>
    <p className="text-xs text-muted-foreground mt-1">
      Fórmula: Masa magra - 4kg (peso huesos/órganos)
    </p>
  </div>
</div>
              <Label>Circunferencia cuello (cm)</Label>
              <Input type="number" value={form.neck_circumference_cm} onChange={e => setForm(f => ({ ...f, neck_circumference_cm: e.target.value }))} placeholder="38" className="mt-1" />
            </div>
            <div>
              <Label>Circunferencia muñeca (cm)</Label>
              <Input type="number" value={form.wrist_circumference_cm} onChange={e => setForm(f => ({ ...f, wrist_circumference_cm: e.target.value }))} placeholder="17" className="mt-1" />
            </div>
            <div>
              <Label>Tipo de cuerpo</Label>
              <Select value={form.body_type} onValueChange={setVal('body_type')}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>{BODY_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Postura / Alineación</Label>
              <Select value={form.posture} onValueChange={setVal('posture')}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>{POSTURE_TYPES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Flexibilidad general (1-10)</Label>
              <Input type="number" min="1" max="10" value={form.flexibility_level} onChange={e => setForm(f => ({ ...f, flexibility_level: e.target.value }))} placeholder="5" className="mt-1" />
            </div>
            <div className="sm:col-span-2">
              <Label>Dolor crónico actual (zonas)</Label>
              <Textarea value={form.chronic_pain_areas} onChange={e => setForm(f => ({ ...f, chronic_pain_areas: e.target.value }))} placeholder="Ej: lumbar baja, rodilla derecha, hombro izquierdo..." className="mt-1" />
            </div>
          </div>
        </section>

        {/* ========== ESTILO DE VIDA ========== */}
        <section className="step-card space-y-5">
          <div className="flex items-center gap-2 mb-2">
            <Heart className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-foreground">Estilo de Vida</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Horas de sueño promedio</Label>
              <Input type="number" min="3" max="14" step="0.5" value={form.sleep_hours} onChange={e => setForm(f => ({ ...f, sleep_hours: e.target.value }))} placeholder="7.5" className="mt-1" />
            </div>
            <div>
              <Label>Calidad del sueño (1-10)</Label>
              <Input type="number" min="1" max="10" value={form.sleep_quality} onChange={e => setForm(f => ({ ...f, sleep_quality: e.target.value }))} placeholder="7" className="mt-1" />
            </div>
            <div>
              <Label>Nivel de estrés (1-10)</Label>
              <Input type="number" min="1" max="10" value={form.stress_level} onChange={e => setForm(f => ({ ...f, stress_level: e.target.value }))} placeholder="5" className="mt-1" />
            </div>
            <div>
              <Label>Tipo de trabajo</Label>
              <Select value={form.work_type} onValueChange={setVal('work_type')}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>{WORK_TYPES.map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Horario de entrenamiento preferido</Label>
              <Select value={form.preferred_training_time} onValueChange={setVal('preferred_training_time')}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>{TRAINING_TIME.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Comidas por día</Label>
              <Input type="number" min="1" max="10" value={form.meals_per_day} onChange={e => setForm(f => ({ ...f, meals_per_day: e.target.value }))} placeholder="3" className="mt-1" />
            </div>
            <div>
              <Label>Consumo de alcohol</Label>
              <Select value={form.alcohol_frequency} onValueChange={setVal('alcohol_frequency')}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>{ALCOHOL_FREQ.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tabaco / Vapeo</Label>
              <Select value={form.smoking_status} onValueChange={setVal('smoking_status')}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>{SMOKING.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Cafeína diaria</Label>
              <Select value={form.caffeine_intake} onValueChange={setVal('caffeine_intake')}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>{CAFFEINE.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label>Suplementos actuales</Label>
              <Textarea value={form.current_supplements} onChange={e => setForm(f => ({ ...f, current_supplements: e.target.value }))} placeholder="Ej: Whey protein, creatina, omega 3, multivitamínico..." className="mt-1" />
            </div>
          </div>
        </section>

        {/* ========== HISTORIAL DEPORTIVO ========== */}
        <section className="step-card space-y-5">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-foreground">Historial Deportivo</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label>Deportes practicados anteriormente</Label>
              <Textarea value={form.previous_sports} onChange={e => setForm(f => ({ ...f, previous_sports: e.target.value }))} placeholder="Ej: Fútbol 5 años, natación 2 años, crossfit 1 año..." className="mt-1" />
            </div>
            <div>
              <Label>Mejor marca personal</Label>
              <Input value={form.personal_best_record} onChange={e => setForm(f => ({ ...f, personal_best_record: e.target.value }))} placeholder="Ej: 10K en 45min, 100kg sentadilla..." className="mt-1" />
            </div>
            <div>
              <Label>Años entrenando</Label>
              <Input type="number" value={form.years_training} onChange={e => setForm(f => ({ ...f, years_training: e.target.value }))} placeholder="3" className="mt-1" />
            </div>
            <div>
              <Label>¿Tuviste entrenador antes?</Label>
              <Input value={form.previous_coach} onChange={e => setForm(f => ({ ...f, previous_coach: e.target.value }))} placeholder="Nombre o tipo de entrenamiento..." className="mt-1" />
            </div>
            <div className="sm:col-span-2">
              <Label>Lesiones pasadas (detalladas)</Label>
              <Textarea value={form.past_injuries} onChange={e => setForm(f => ({ ...f, past_injuries: e.target.value }))} placeholder="Ej: Esguince tobillo derecho 2022, tendinitis rotuliana 2023..." className="mt-1" />
            </div>
            <div className="sm:col-span-2">
              <Label>Cirugías ortopédicas</Label>
              <Textarea value={form.orthopedic_surgeries} onChange={e => setForm(f => ({ ...f, orthopedic_surgeries: e.target.value }))} placeholder="Ej: Menisco izquierdo 2021, hombro 2020..." className="mt-1" />
            </div>
            <div className="sm:col-span-2">
              <Label>Hospitalizaciones / condiciones médicas graves</Label>
              <Textarea value={form.hospitalizations} onChange={e => setForm(f => ({ ...f, hospitalizations: e.target.value }))} placeholder="Ej: COVID grave 2021, neumonía 2019..." className="mt-1" />
            </div>
            <div>
              <Label>Alergias alimentarias</Label>
              <Input value={form.food_allergies} onChange={e => setForm(f => ({ ...f, food_allergies: e.target.value }))} placeholder="Mariscos, frutos secos, gluten..." className="mt-1" />
            </div>
            <div>
              <Label>Intolerancias alimentarias</Label>
              <Input value={form.food_intolerances} onChange={e => setForm(f => ({ ...f, food_intolerances: e.target.value }))} placeholder="Lactosa, gluten, FODMAPs..." className="mt-1" />
            </div>
          </div>
        </section>

        {/* ========== METAS Y PREFERENCIAS ========== */}
        <section className="step-card space-y-5">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-foreground">Metas y Preferencias</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label>Objetivo principal</Label>
              <Select value={form.goal} onValueChange={setVal('goal')}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccionar objetivo" /></SelectTrigger>
                <SelectContent>{GOALS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Fecha objetivo (evento/competencia)</Label>
              <Input type="date" value={form.target_date} onChange={e => setForm(f => ({ ...f, target_date: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label>Peso objetivo (kg)</Label>
              <Input type="number" value={form.target_weight_kg} onChange={e => setForm(f => ({ ...f, target_weight_kg: e.target.value }))} placeholder="70" className="mt-1" />
            </div>
            <div>
              <Label>% Grasa objetivo</Label>
              <Input type="number" min="3" max="60" value={form.target_body_fat_pct} onChange={e => setForm(f => ({ ...f, target_body_fat_pct: e.target.value }))} placeholder="15" className="mt-1" />
            </div>
            <div>
              <Label>Preferencia de entrenamiento</Label>
              <Select value={form.training_location_pref} onValueChange={setVal('training_location_pref')}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>{EQUIPMENT.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Nivel competitivo</Label>
              <Select value={form.competitive_level} onValueChange={setVal('competitive_level')}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>{COMPETITIVE.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Compañía de entrenamiento</Label>
              <Select value={form.training_companions} onValueChange={setVal('training_companions')}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>{TRAINING_STYLE.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label>Ejercicios que ODIA (evitar en el plan)</Label>
              <Textarea value={form.hated_exercises} onChange={e => setForm(f => ({ ...f, hated_exercises: e.target.value }))} placeholder="Ej: Burpees, correr en cinta, sentadilla búlgara..." className="mt-1" />
            </div>
            <div className="sm:col-span-2">
              <Label>Ejercicios que AMA (incluir en el plan)</Label>
              <Textarea value={form.loved_exercises} onChange={e => setForm(f => ({ ...f, loved_exercises: e.target.value }))} placeholder="Ej: Peso muerto, dominadas, natación..." className="mt-1" />
            </div>
          </div>
        </section>

        {/* ========== OBJETIVOS Y DISPONIBILIDAD ========== */}
        <section className="step-card space-y-5">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-foreground">Disponibilidad</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Nivel de actividad actual</Label>
              <Select value={form.activity_level} onValueChange={setVal('activity_level')}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccionar nivel" /></SelectTrigger>
                <SelectContent>{ACTIVITY_LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
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

        {/* ========== ACTIVIDADES PREFERIDAS ========== */}
        <section className="step-card">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-primary" />
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
          {saveMutation.isPending ? 'Guardando...' : 'Guardar Perfil Completo'}
        </Button>
      </form>
    </div>
  );
}