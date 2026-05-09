import { useState, useEffect } from 'react';
import { base44 } from '@/api/entities';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Save, ChevronDown, ChevronUp } from 'lucide-react';

const today = new Date().toISOString().split('T')[0];
const SCORES = ['Muy bajo', 'Bajo', 'Normal', 'Bueno', 'Excelente'];
const SQUAT_DEPTH = ['Incompleta', 'Paralela', 'Completa'];

// ── Auto-score logic ─────────────────────────────────────────────────────────

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

// ── Standards table component ────────────────────────────────────────────────

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
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 text-xs text-primary hover:underline"
      >
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

// ── Section wrapper ──────────────────────────────────────────────────────────

const TestSection = ({ title, description, children }) => (
  <div className="step-card space-y-4">
    <div>
      <h2 className="font-semibold text-foreground">{title}</h2>
      {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">{children}</div>
  </div>
);

// ── Score badge ──────────────────────────────────────────────────────────────

function ScoreBadge({ score }) {
  if (!score) return null;
  return (
    <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${scoreColors[score] || 'bg-secondary text-secondary-foreground'}`}>
      {score}
    </span>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function FitnessTestsForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: profiles } = useQuery({ queryKey: ['profiles'], queryFn: () => entities.UserProfile.list() });

  const profileId = profiles?.[0]?.id;

  const [form, setForm] = useState({
    test_date: today,
    chair_test_reps: '', chair_test_time_sec: '', chair_test_score: '',
    pushup_reps: '', pushup_score: '',
    deep_squat_depth: '', deep_squat_compensation: '', deep_squat_score: '',
    balance_dominant_sec: '', balance_nondominant_sec: '', balance_score: '',
    srt_score: '', srt_interpretation: '',
    step_test_heart_rate: '', step_test_score: '',
    vo2max_estimate: '', notes: '',
  });

  const setField = (key) => (val) => setForm(f => ({ ...f, [key]: val }));
  const setInput = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  // Auto-calculate scores when relevant fields change
  useEffect(() => {
    setForm(f => ({ ...f, chair_test_score: scoreChair(f.chair_test_reps) }));
  }, [form.chair_test_reps]);

  useEffect(() => {
    setForm(f => ({ ...f, pushup_score: scorePushup(f.pushup_reps) }));
  }, [form.pushup_reps]);

  useEffect(() => {
    setForm(f => ({ ...f, deep_squat_score: scoreSquat(f.deep_squat_depth) }));
  }, [form.deep_squat_depth]);

  useEffect(() => {
    setForm(f => ({ ...f, balance_score: scoreBalance(f.balance_dominant_sec) }));
  }, [form.balance_dominant_sec]);

  useEffect(() => {
    setForm(f => ({ ...f, step_test_score: scoreStep(f.step_test_heart_rate) }));
  }, [form.step_test_heart_rate]);

  const saveMutation = useMutation({
    mutationFn: (data) => entities.FitnessTest.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tests'] });
      toast({ title: 'Tests guardados correctamente.' });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const numFields = ['chair_test_reps', 'chair_test_time_sec', 'pushup_reps', 'balance_dominant_sec',
      'balance_nondominant_sec', 'srt_score', 'step_test_heart_rate', 'vo2max_estimate'];
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

      {/* ── Test de la Silla ── */}
      <TestSection
        title="Test de Fuerza de Tren Inferior (Test de la Silla)"
        description="Sentarse y levantarse de una silla en 30 segundos sin apoyo de brazos."
      >
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

      {/* ── Flexiones ── */}
      <TestSection
        title="Test de Fuerza de Tren Superior (Flexiones)"
        description="Máximo de flexiones correctas sin pausa."
      >
        <div>
          <Label>Repeticiones</Label>
          <Input type="number" value={form.pushup_reps} onChange={setInput('pushup_reps')} placeholder="20" className="mt-1" />
        </div>
        <div>
          <Label>Valoración (automática)</Label>
          <ScoreBadge score={form.pushup_score} />
          {!form.pushup_score && <p className="text-xs text-muted-foreground mt-1">Ingresá las repeticiones</p>}
        </div>
        <StandardsTable rows={[
          ['Muy bajo', '< 6 reps'], ['Bajo', '6–11 reps'], ['Normal', '12–19 reps'],
          ['Bueno', '20–29 reps'], ['Excelente', '≥ 30 reps'],
        ]} />
      </TestSection>

      {/* ── Sentadilla Profunda ── */}
      <TestSection
        title="Movilidad / Flexibilidad (Sentadilla Profunda)"
        description="Evalúa la movilidad global: tobillo, cadera, columna torácica y hombros."
      >
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

      {/* ── Equilibrio ── */}
      <TestSection
        title="Test de Equilibrio (Unipodal)"
        description="Pararse en un solo pie con ojos abiertos. Registrar tiempo máximo por lado."
      >
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

      {/* ── SRT ── */}
      <TestSection
        title="Test Sentarse-Levantarse (SRT)"
        description="Sentarse y levantarse del suelo sin apoyo de manos, rodillas ni codos. Puntuación del 0 al 10."
      >
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

      {/* ── Step Test ── */}
      <TestSection
        title="Test del Escalón (Step Test)"
        description="3 minutos subiendo y bajando un escalón de 30 cm a ritmo constante. Medir FC a los 60 seg post-ejercicio."
      >
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

      <Button type="submit" disabled={saveMutation.isPending}>
        <Save className="w-4 h-4 mr-2" />
        {saveMutation.isPending ? 'Guardando...' : 'Guardar Tests'}
      </Button>
    </form>
  );
}
