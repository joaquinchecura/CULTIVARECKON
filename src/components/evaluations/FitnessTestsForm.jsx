import { useState, useEffect } from 'react';
import { entities } from '@/api/entities';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Save, ChevronDown, ChevronUp } from 'lucide-react';
import { useReckonQuery } from '@/hooks/useReckonQuery';

const today = new Date().toISOString().split('T')[0];
const SQUAT_DEPTH = ['Incompleta', 'Paralela', 'Completa'];
const TALK_TEST = ['Puedo hablar fluido', 'Puedo hablar con dificultad', 'No puedo hablar'];

function scoreChair(reps) {
  const r = Number(reps);
  if (!r) return '';
  if (r >= 25) return 'Excelente';
  if (r >= 20) return 'Bueno';
  if (r >= 15) return 'Normal';
  if (r >= 10) return 'Bajo';
  return 'Muy bajo';
}

function scorePushup(reps) {
  const r = Number(reps);
  if (!r) return '';
  if (r >= 30) return 'Excelente';
  if (r >= 20) return 'Bueno';
  if (r >= 12) return 'Normal';
  if (r >= 6)  return 'Bajo';
  return 'Muy bajo';
}

function scoreSquat(depth) {
  if (depth === 'Completa')  return 'Bueno';
  if (depth === 'Paralela')  return 'Normal';
  if (depth === 'Incompleta') return 'Bajo';
  return '';
}

function scoreBalance(dominant) {
  const s = Number(dominant);
  if (!s) return '';
  if (s >= 50) return 'Excelente';
  if (s >= 30) return 'Bueno';
  if (s >= 15) return 'Normal';
  if (s >= 5)  return 'Bajo';
  return 'Muy bajo';
}

function scoreStep(hr) {
  const h = Number(hr);
  if (!h) return '';
  if (h <= 92)  return 'Excelente';
  if (h <= 106) return 'Bueno';
  if (h <= 122) return 'Normal';
  if (h <= 135) return 'Bajo';
  return 'Muy bajo';
}

function scorePlank(sec) {
  const s = Number(sec);
  if (!s) return '';
  if (s >= 120) return 'Excelente';
  if (s >= 90)  return 'Bueno';
  if (s >= 60)  return 'Normal';
  if (s >= 30)  return 'Bajo';
  return 'Muy bajo';
}

function scoreCooper(distanceMeters) {
  const d = Number(distanceMeters);
  if (!d) return '';
  const vo2 = ((d - 504.9) / 44.73).toFixed(1);
  return vo2 > 0 ? vo2 : '';
}

const scoreColors = {
  'Muy bajo': 'bg-red-50 text-red-700',
  'Bajo':     'bg-amber-50 text-amber-700',
  'Normal':   'bg-yellow-50 text-yellow-700',
  'Bueno':    'bg-blue-50 text-blue-700',
  'Excelente':'bg-green-50 text-green-700',
};

function StandardsTable({ rows }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="col-span-full">
      <button type="button" onClick={() => setOpen(o => !o)} className="flex items-center gap-1.5 text-xs text-primary hover:underline">
        {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        Ver estándares de valoración
      </button>
      {open && (
        <div className="mt-2 flex flex-wrap gap-2">
          {rows.map(([score, range]) => (
            <span key={score} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${scoreColors[score]}`}>
              <strong>{score}:</strong> {range}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

const TestSection = ({ title, description, children }) => (
  <div className="step-card space-y-4">
    <div>
      <h2 className="font-semibold text-foreground">{title}</h2>
      {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">{children}</div>
  </div>
);

function ScoreBadge({ score }) {
  if (!score) return null;
  return (
    <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${scoreColors[score] || 'bg-secondary text-secondary-foreground'}`}>
      {score}
    </span>
  );
}

export default function FitnessTestsForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: profiles } = useReckonQuery('profiles', () => entities.UserProfile.list());

  const profileId = profiles?.[0]?.id;

  const [form, setForm] = useState({
    test_date: today,
    chair_test_reps: '', chair_test_time_sec: '', chair_test_score: '',
    pushup_reps: '', pushup_score: '',
    deep_squat_depth: '', deep_squat_compensation: '', deep_squat_score: '',
    balance_dominant_sec: '', balance_nondominant_sec: '', balance_score: '',
    srt_score: '', srt_interpretation: '',
    step_test_heart_rate: '', step_test_score: '',
    vo2max_estimate: '',
    apley_scratch: '', thomas_test: '', knee_to_wall_cm: '',
    thoracic_rotation_deg: '', lumbar_extension_notes: '',
    plank_sec: '', plank_score: '',
    side_plank_left_sec: '', side_plank_right_sec: '',
    bird_dog_reps: '', dead_bug_reps: '',
    single_leg_glute_bridge_reps: '', y_balance_notes: '',
    max_squat_reps: '', max_pullup_reps: '',
    wall_sit_sec: '', plank_to_pushup_reps: '',
    vertical_jump_cm: '', broad_jump_cm: '',
    medball_throw_m: '', sprint_10m_sec: '', agility_5_10_5_sec: '',
    cooper_distance_m: '', cooper_vo2max: '',
    two_step_hr_recovery: '', rpe_3min_walk: '', talk_test_result: '',
    notes: '',
  });

  const setField = (key) => (val) => setForm(f => ({ ...f, [key]: val }));
  const setInput = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  useEffect(() => { setForm(f => ({ ...f, chair_test_score: scoreChair(f.chair_test_reps) })); }, [form.chair_test_reps]);
  useEffect(() => { setForm(f => ({ ...f, pushup_score: scorePushup(f.pushup_reps) })); }, [form.pushup_reps]);
  useEffect(() => { setForm(f => ({ ...f, deep_squat_score: scoreSquat(f.deep_squat_depth) })); }, [form.deep_squat_depth]);
  useEffect(() => { setForm(f => ({ ...f, balance_score: scoreBalance(f.balance_dominant_sec) })); }, [form.balance_dominant_sec]);
  useEffect(() => { setForm(f => ({ ...f, step_test_score: scoreStep(f.step_test_heart_rate) })); }, [form.step_test_heart_rate]);
  useEffect(() => { setForm(f => ({ ...f, plank_score: scorePlank(f.plank_sec) })); }, [form.plank_sec]);
  useEffect(() => { setForm(f => ({ ...f, cooper_vo2max: scoreCooper(f.cooper_distance_m) })); }, [form.cooper_distance_m]);

  const saveMutation = useMutation({
    mutationFn: (data) => entities.FitnessTest.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tests'] });
      localStorage.setItem('_reckon_sync', Date.now().toString());
      toast({ title: 'Tests guardados correctamente.' });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const numFields = [
      'chair_test_reps', 'chair_test_time_sec', 'pushup_reps',
      'balance_dominant_sec', 'balance_nondominant_sec', 'srt_score',
      'step_test_heart_rate', 'vo2max_estimate',
      'knee_to_wall_cm', 'thoracic_rotation_deg',
      'plank_sec', 'side_plank_left_sec', 'side_plank_right_sec',
      'bird_dog_reps', 'dead_bug_reps', 'single_leg_glute_bridge_reps',
      'max_squat_reps', 'max_pullup_reps', 'wall_sit_sec', 'plank_to_pushup_reps',
      'vertical_jump_cm', 'broad_jump_cm', 'medball_throw_m', 'sprint_10m_sec', 'agility_5_10_5_sec',
      'cooper_distance_m', 'two_step_hr_recovery', 'rpe_3min_walk',
    ];
    const data = { user_profile_id: profileId, ...form };
    numFields.forEach(k => { if (data[k]) data[k] = Number(data[k]); });
    saveMutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="step-card">
        <Label>Fecha del test</Label>
        <Input type="date" value={form.test_date} onChange={setInput('test_date')} className="mt-1 max-w-xs" />
      </div>

      <TestSection title="1. Movilidad Articular" description="Evalúa rangos de movimiento clave para prevenir lesiones y optimizar patrones de movimiento.">
        <div>
          <Label>Test de hombro (Apley scratch)</Label>
          <Input value={form.apley_scratch} onChange={setInput('apley_scratch')} placeholder="Ej: Alcanza L5, falta 5cm" className="mt-1" />
          <p className="text-xs text-muted-foreground mt-1">Rango flexión/extensión</p>
        </div>
        <div>
          <Label>Test de cadera (Thomas)</Label>
          <Input value={form.thomas_test} onChange={setInput('thomas_test')} placeholder="Ej: Pierna izq elevada 15cm" className="mt-1" />
          <p className="text-xs text-muted-foreground mt-1">Flexor tightness</p>
        </div>
        <div>
          <Label>Test de tobillo (knee-to-wall)</Label>
          <Input type="number" value={form.knee_to_wall_cm} onChange={setInput('knee_to_wall_cm')} placeholder="12" className="mt-1" />
          <p className="text-xs text-muted-foreground mt-1">Dorsiflexión (cm)</p>
        </div>
        <div>
          <Label>Rotación torácica</Label>
          <Input type="number" value={form.thoracic_rotation_deg} onChange={setInput('thoracic_rotation_deg')} placeholder="45" className="mt-1" />
          <p className="text-xs text-muted-foreground mt-1">Grados de rotación</p>
        </div>
        <div className="col-span-2 sm:col-span-3">
          <Label>Extensión lumbar (prone press-up)</Label>
          <Input value={form.lumbar_extension_notes} onChange={setInput('lumbar_extension_notes')} placeholder="Dolor vs movilidad observada..." className="mt-1" />
        </div>
      </TestSection>

      <TestSection title="2. Estabilidad y Control Motor" description="Core endurance, asimetrías y control lumbopélvico.">
        <div>
          <Label>Plank (seg)</Label>
          <Input type="number" value={form.plank_sec} onChange={setInput('plank_sec')} placeholder="60" className="mt-1" />
          <ScoreBadge score={form.plank_score} />
        </div>
        <div>
          <Label>Side plank izquierdo (seg)</Label>
          <Input type="number" value={form.side_plank_left_sec} onChange={setInput('side_plank_left_sec')} placeholder="45" className="mt-1" />
          <p className="text-xs text-muted-foreground mt-1">Asimetrías oblicuos</p>
        </div>
        <div>
          <Label>Side plank derecho (seg)</Label>
          <Input type="number" value={form.side_plank_right_sec} onChange={setInput('side_plank_right_sec')} placeholder="40" className="mt-1" />
        </div>
        <div>
          <Label>Bird dog (reps controladas)</Label>
          <Input type="number" value={form.bird_dog_reps} onChange={setInput('bird_dog_reps')} placeholder="10" className="mt-1" />
          <p className="text-xs text-muted-foreground mt-1">Control motor lumbopélvico</p>
        </div>
        <div>
          <Label>Dead bug (reps)</Label>
          <Input type="number" value={form.dead_bug_reps} onChange={setInput('dead_bug_reps')} placeholder="10" className="mt-1" />
          <p className="text-xs text-muted-foreground mt-1">Estabilidad lumbar</p>
        </div>
        <div>
          <Label>Single leg glute bridge (reps)</Label>
          <Input type="number" value={form.single_leg_glute_bridge_reps} onChange={setInput('single_leg_glute_bridge_reps')} placeholder="12" className="mt-1" />
          <p className="text-xs text-muted-foreground mt-1">Fuerza + estabilidad cadera</p>
        </div>
        <div className="col-span-2 sm:col-span-3">
          <Label>Y-balance test (simplificado)</Label>
          <Input value={form.y_balance_notes} onChange={setInput('y_balance_notes')} placeholder="Anotá alcances en cm o asimetrías observadas..." className="mt-1" />
          <p className="text-xs text-muted-foreground mt-1">Riesgo de lesión de miembro inferior</p>
        </div>
        <StandardsTable rows={[
          ['Muy bajo', '< 30 seg plank'], ['Bajo', '30–59 seg'], ['Normal', '60–89 seg'],
          ['Bueno', '90–119 seg'], ['Excelente', '≥ 120 seg'],
        ]} />
      </TestSection>

      <TestSection title="3. Fuerza Máxima Estimada (sin equipo)" description="Tests de resistencia muscular para estimar fuerza relativa.">
        <div>
          <Label>Max rep push-up</Label>
          <Input type="number" value={form.pushup_reps} onChange={setInput('pushup_reps')} placeholder="20" className="mt-1" />
          <ScoreBadge score={form.pushup_score} />
          <p className="text-xs text-muted-foreground mt-1">Fuerza tren superior</p>
        </div>
        <div>
          <Label>Max rep squat (bodyweight)</Label>
          <Input type="number" value={form.max_squat_reps} onChange={setInput('max_squat_reps')} placeholder="30" className="mt-1" />
          <p className="text-xs text-muted-foreground mt-1">Fuerza tren inferior</p>
        </div>
        <div>
          <Label>Max rep pull-up / inverted row</Label>
          <Input type="number" value={form.max_pullup_reps} onChange={setInput('max_pullup_reps')} placeholder="8" className="mt-1" />
          <p className="text-xs text-muted-foreground mt-1">Fuerza de tracción</p>
        </div>
        <div>
          <Label>Wall sit (seg máximo)</Label>
          <Input type="number" value={form.wall_sit_sec} onChange={setInput('wall_sit_sec')} placeholder="90" className="mt-1" />
          <p className="text-xs text-muted-foreground mt-1">Isométrico cuádriceps</p>
        </div>
        <div>
          <Label>Plank to push-up (reps)</Label>
          <Input type="number" value={form.plank_to_pushup_reps} onChange={setInput('plank_to_pushup_reps')} placeholder="15" className="mt-1" />
          <p className="text-xs text-muted-foreground mt-1">Fuerza + estabilidad</p>
        </div>
        <StandardsTable rows={[
          ['Muy bajo', '< 6 push-ups'], ['Bajo', '6–11'], ['Normal', '12–19'],
          ['Bueno', '20–29'], ['Excelente', '≥ 30'],
        ]} />
      </TestSection>

      <TestSection title="4. Potencia y Velocidad" description="Expresiones de potencia neuromuscular y capacidad de aceleración.">
        <div>
          <Label>Vertical jump (cm)</Label>
          <Input type="number" value={form.vertical_jump_cm} onChange={setInput('vertical_jump_cm')} placeholder="45" className="mt-1" />
          <p className="text-xs text-muted-foreground mt-1">Potencia tren inferior</p>
        </div>
        <div>
          <Label>Broad jump (cm)</Label>
          <Input type="number" value={form.broad_jump_cm} onChange={setInput('broad_jump_cm')} placeholder="200" className="mt-1" />
          <p className="text-xs text-muted-foreground mt-1">Potencia horizontal</p>
        </div>
        <div>
          <Label>Medicine ball throw (m)</Label>
          <Input type="number" step="0.1" value={form.medball_throw_m} onChange={setInput('medball_throw_m')} placeholder="5.5" className="mt-1" />
          <p className="text-xs text-muted-foreground mt-1">Potencia tren superior (si tiene)</p>
        </div>
        <div>
          <Label>10m sprint (seg)</Label>
          <Input type="number" step="0.01" value={form.sprint_10m_sec} onChange={setInput('sprint_10m_sec')} placeholder="2.10" className="mt-1" />
          <p className="text-xs text-muted-foreground mt-1">Velocidad aceleración</p>
        </div>
        <div>
          <Label>5-10-5 agility (seg)</Label>
          <Input type="number" step="0.01" value={form.agility_5_10_5_sec} onChange={setInput('agility_5_10_5_sec')} placeholder="5.20" className="mt-1" />
          <p className="text-xs text-muted-foreground mt-1">Cambios de dirección</p>
        </div>
      </TestSection>

      <TestSection title="5. Capacidad Aeróbica (simplificada)" description="Tests de campo para estimar resistencia cardiovascular.">
        <div>
          <Label>Cooper test — distancia (m)</Label>
          <Input type="number" value={form.cooper_distance_m} onChange={setInput('cooper_distance_m')} placeholder="2200" className="mt-1" />
          <p className="text-xs text-muted-foreground mt-1">12 min caminata/carrera</p>
          {form.cooper_vo2max && (
            <div className="mt-2 p-2 bg-secondary/50 rounded-lg">
              <span className="text-xs text-muted-foreground">VO₂max estimado: </span>
              <span className="text-sm font-bold text-foreground">{form.cooper_vo2max} ml/kg/min</span>
            </div>
          )}
        </div>
        <div>
          <Label>2-step test — FC recuperación (lpm)</Label>
          <Input type="number" value={form.two_step_hr_recovery} onChange={setInput('two_step_hr_recovery')} placeholder="110" className="mt-1" />
          <p className="text-xs text-muted-foreground mt-1">FC a 1 min post-ejercicio</p>
        </div>
        <div>
          <Label>RPE después de 3 min marcha rápida (1-10)</Label>
          <Input type="number" min="1" max="10" value={form.rpe_3min_walk} onChange={setInput('rpe_3min_walk')} placeholder="5" className="mt-1" />
          <p className="text-xs text-muted-foreground mt-1">Percepción de esfuerzo</p>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <Label>Talk test</Label>
          <Select value={form.talk_test_result} onValueChange={setField('talk_test_result')}>
            <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
            <SelectContent>{TALK_TEST.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">Umbral ventilatorio</p>
        </div>
      </TestSection>

      <TestSection title="Test de Fuerza de Tren Inferior (Test de la Silla)" description="Sentarse y levantarse de una silla en 30 segundos sin apoyo de brazos.">
        <div>
          <Label>Repeticiones</Label>
          <Input type="number" value={form.chair_test_reps} onChange={setInput('chair_test_reps')} placeholder="15" className="mt-1" />
        </div>
        <div>
          <Label>Tiempo (seg)</Label>
          <Input type="number" value={form.chair_test_time_sec} onChange={setInput('chair_test_time_sec')} placeholder="30" className="mt-1" />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <Label>Valoración (automática)</Label>
          <ScoreBadge score={form.chair_test_score} />
          {!form.chair_test_score && <p className="text-xs text-muted-foreground mt-1">Ingresá las repeticiones</p>}
        </div>
        <StandardsTable rows={[
          ['Muy bajo', '< 10 reps'], ['Bajo', '10–14 reps'], ['Normal', '15–19 reps'],
          ['Bueno', '20–24 reps'], ['Excelente', '≥ 25 reps'],
        ]} />
      </TestSection>

      <TestSection title="Movilidad / Flexibilidad (Sentadilla Profunda)" description="Evalúa la movilidad global: tobillo, cadera, columna torácica y hombros.">
        <div>
          <Label>Profundidad alcanzada</Label>
          <Select value={form.deep_squat_depth} onValueChange={setField('deep_squat_depth')}>
            <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
            <SelectContent>{SQUAT_DEPTH.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label>Valoración (automática)</Label>
          <ScoreBadge score={form.deep_squat_score} />
          {!form.deep_squat_score && <p className="text-xs text-muted-foreground mt-1">Seleccioná la profundidad</p>}
        </div>
        <div className="col-span-2 sm:col-span-1">
          <Label>Compensaciones observadas</Label>
          <Input value={form.deep_squat_compensation} onChange={setInput('deep_squat_compensation')} placeholder="Valgos de rodilla, inclinación de tronco..." className="mt-1" />
        </div>
        <StandardsTable rows={[
          ['Bajo', 'Incompleta — no alcanza paralela'], ['Normal', 'Paralela — muslos horizontales'],
          ['Bueno', 'Completa — muslos bajo horizontal'],
        ]} />
      </TestSection>

      <TestSection title="Test de Equilibrio (Unipodal)" description="Pararse en un solo pie con ojos abiertos. Registrar tiempo máximo por lado.">
        <div>
          <Label>Pierna dominante (seg)</Label>
          <Input type="number" value={form.balance_dominant_sec} onChange={setInput('balance_dominant_sec')} placeholder="45" className="mt-1" />
        </div>
        <div>
          <Label>Pierna no dominante (seg)</Label>
          <Input type="number" value={form.balance_nondominant_sec} onChange={setInput('balance_nondominant_sec')} placeholder="38" className="mt-1" />
        </div>
        <div>
          <Label>Valoración (automática)</Label>
          <ScoreBadge score={form.balance_score} />
          {!form.balance_score && <p className="text-xs text-muted-foreground mt-1">Ingresá los segundos</p>}
        </div>
        <StandardsTable rows={[
          ['Muy bajo', '< 5 seg'], ['Bajo', '5–14 seg'], ['Normal', '15–29 seg'],
          ['Bueno', '30–49 seg'], ['Excelente', '≥ 50 seg'],
        ]} />
      </TestSection>

      <TestSection title="Test Sentarse-Levantarse (SRT)" description="Sentarse y levantarse del suelo sin apoyo de manos, rodillas ni codos. Puntuación del 0 al 10.">
        <div>
          <Label>Puntuación (0–10)</Label>
          <Input type="number" min="0" max="10" step="0.5" value={form.srt_score} onChange={setInput('srt_score')} placeholder="7.5" className="mt-1" />
        </div>
        <div className="col-span-2">
          <Label>Interpretación / observaciones</Label>
          <Input value={form.srt_interpretation} onChange={setInput('srt_interpretation')} placeholder="Observaciones sobre la ejecución..." className="mt-1" />
        </div>
        <StandardsTable rows={[
          ['Muy bajo', '0–3 puntos'], ['Bajo', '3.5–5 puntos'], ['Normal', '5.5–7 puntos'],
          ['Bueno', '7.5–8.5 puntos'], ['Excelente', '9–10 puntos'],
        ]} />
      </TestSection>

      <TestSection title="Test del Escalón (Step Test)" description="3 minutos subiendo y bajando un escalón de 30 cm a ritmo constante. Medir FC a los 60 seg post-ejercicio.">
        <div>
          <Label>FC post-ejercicio (lpm)</Label>
          <Input type="number" value={form.step_test_heart_rate} onChange={setInput('step_test_heart_rate')} placeholder="110" className="mt-1" />
        </div>
        <div>
          <Label>VO₂ máx estimado (ml/kg/min)</Label>
          <Input type="number" step="0.1" value={form.vo2max_estimate} onChange={setInput('vo2max_estimate')} placeholder="42" className="mt-1" />
        </div>
        <div>
          <Label>Valoración (automática)</Label>
          <ScoreBadge score={form.step_test_score} />
          {!form.step_test_score && <p className="text-xs text-muted-foreground mt-1">Ingresá la FC</p>}
        </div>
        <StandardsTable rows={[
          ['Muy bajo', 'FC > 135 lpm'], ['Bajo', 'FC 123–135 lpm'], ['Normal', 'FC 107–122 lpm'],
          ['Bueno', 'FC 93–106 lpm'], ['Excelente', 'FC ≤ 92 lpm'],
        ]} />
      </TestSection>

      <div className="step-card">
        <Label>Notas generales de los tests</Label>
        <Textarea value={form.notes} onChange={setInput('notes')} placeholder="Observaciones adicionales sobre los tests realizados..." className="mt-1" rows={3} />
      </div>

      <Button type="submit" disabled={saveMutation.isPending} className="w-full sm:w-auto">
        <Save className="w-4 h-4 mr-2" />
        {saveMutation.isPending ? 'Guardando...' : 'Guardar Tests de Rendimiento'}
      </Button>
    </form>
  );
}