import { useState, useEffect } from 'react';
import { entities } from '@/api/entities';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Save, User, Users } from 'lucide-react';
import { TESTS, SECTIONS } from '@/config/tests.config';
import TestCard from './TestCard';

const today = new Date().toISOString().split('T')[0];

// ---------- Scoring (igual lógica que antes, centralizada) ----------
function scoreChair(reps) {
  const r = Number(reps);
  if (!r) return null;
  if (r >= 25) return { label: 'Excelente', color: 'bg-green-50 text-green-700' };
  if (r >= 20) return { label: 'Bueno', color: 'bg-blue-50 text-blue-700' };
  if (r >= 15) return { label: 'Normal', color: 'bg-yellow-50 text-yellow-700' };
  if (r >= 10) return { label: 'Bajo', color: 'bg-amber-50 text-amber-700' };
  return { label: 'Muy bajo', color: 'bg-red-50 text-red-700' };
}
function scorePushup(reps) {
  const r = Number(reps);
  if (!r) return null;
  if (r >= 30) return { label: 'Excelente', color: 'bg-green-50 text-green-700' };
  if (r >= 20) return { label: 'Bueno', color: 'bg-blue-50 text-blue-700' };
  if (r >= 12) return { label: 'Normal', color: 'bg-yellow-50 text-yellow-700' };
  if (r >= 6) return { label: 'Bajo', color: 'bg-amber-50 text-amber-700' };
  return { label: 'Muy bajo', color: 'bg-red-50 text-red-700' };
}
function scoreSquatDepth(depth) {
  if (depth === 'Completa') return { label: 'Bueno', color: 'bg-blue-50 text-blue-700' };
  if (depth === 'Paralela') return { label: 'Normal', color: 'bg-yellow-50 text-yellow-700' };
  if (depth === 'Incompleta') return { label: 'Bajo', color: 'bg-amber-50 text-amber-700' };
  return null;
}
function scoreBalance(sec) {
  const s = Number(sec);
  if (!s) return null;
  if (s >= 50) return { label: 'Excelente', color: 'bg-green-50 text-green-700' };
  if (s >= 30) return { label: 'Bueno', color: 'bg-blue-50 text-blue-700' };
  if (s >= 15) return { label: 'Normal', color: 'bg-yellow-50 text-yellow-700' };
  if (s >= 5) return { label: 'Bajo', color: 'bg-amber-50 text-amber-700' };
  return { label: 'Muy bajo', color: 'bg-red-50 text-red-700' };
}
function scoreStep(hr) {
  const h = Number(hr);
  if (!h) return null;
  if (h <= 92) return { label: 'Excelente', color: 'bg-green-50 text-green-700' };
  if (h <= 106) return { label: 'Bueno', color: 'bg-blue-50 text-blue-700' };
  if (h <= 122) return { label: 'Normal', color: 'bg-yellow-50 text-yellow-700' };
  if (h <= 135) return { label: 'Bajo', color: 'bg-amber-50 text-amber-700' };
  return { label: 'Muy bajo', color: 'bg-red-50 text-red-700' };
}
function scorePlank(sec) {
  const s = Number(sec);
  if (!s) return null;
  if (s >= 120) return { label: 'Excelente', color: 'bg-green-50 text-green-700' };
  if (s >= 90) return { label: 'Bueno', color: 'bg-blue-50 text-blue-700' };
  if (s >= 60) return { label: 'Normal', color: 'bg-yellow-50 text-yellow-700' };
  if (s >= 30) return { label: 'Bajo', color: 'bg-amber-50 text-amber-700' };
  return { label: 'Muy bajo', color: 'bg-red-50 text-red-700' };
}

// Valores derivados que no son "puntaje" (badge) sino un número calculado
// que el PDF necesita guardado con un nombre de campo específico.
const DERIVED = {
  cooper_vo2max: (v) => {
    const d = Number(v.cooper_distance_m);
    if (!d) return '';
    const vo2 = (d - 504.9) / 44.73;
    return vo2 > 0 ? vo2.toFixed(1) : '';
  },
};

// Mapa test.id -> función de score (los tests sin función no muestran badge)
const SCORERS = {
  chair_test: (v) => scoreChair(v.chair_test_reps),
  pushup: (v) => scorePushup(v.pushup_reps),
  deep_squat: (v) => scoreSquatDepth(v.deep_squat_depth),
  balance: (v) => scoreBalance(v.balance_dominant_sec),
  step_test: (v) => scoreStep(v.step_test_heart_rate),
  plank: (v) => scorePlank(v.plank_sec),
};

// Estado inicial: un campo por cada input de cada test, + fecha + notas
function buildInitialForm() {
  const form = { test_date: today, notes: '' };
  TESTS.forEach(test => {
    test.inputs.forEach(input => { form[input.key] = ''; });
    form[`${test.id}_skip_reason`] = '';
  });
  return form;
}
const FORM_INITIAL = buildInitialForm();

export default function FitnessTestsForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: profiles } = useQuery({ queryKey: ['profiles'], queryFn: () => entities.UserProfile.list() });
  const { data: tests } = useQuery({ queryKey: ['tests'], queryFn: () => entities.FitnessTest.list('-test_date', 1) });
  const { data: healthRecords } = useQuery({ queryKey: ['health'], queryFn: () => entities.HealthHistory.list() });

  const profileId = profiles?.[0]?.id;
  const latestTest = tests?.[0];
  const health = healthRecords?.[0];
  const parqPositive = Object.values(health?.parq_answers || {}).some(Boolean);

  const [mode, setMode] = useState('self'); // 'self' | 'all'

  const [form, setForm] = useState(() => {
    try { const s = localStorage.getItem('fitness-tests-form'); return s ? JSON.parse(s) : FORM_INITIAL; }
    catch { return FORM_INITIAL; }
  });

  useEffect(() => { localStorage.setItem('fitness-tests-form', JSON.stringify(form)); }, [form]);

  useEffect(() => {
    if (latestTest) {
      const saved = localStorage.getItem('fitness-tests-form');
      if (!saved) {
        const next = { test_date: latestTest.test_date || today, notes: latestTest.notes ?? '' };
        TESTS.forEach(test => {
          test.inputs.forEach(input => { next[input.key] = latestTest[input.key] ?? ''; });
          next[`${test.id}_skip_reason`] = latestTest[`${test.id}_skip_reason`] ?? '';
        });
        setForm(next);
      }
    }
  }, [latestTest]);

  const setField = (key, value) => setForm(f => ({ ...f, [key]: value }));

  const setSkip = (skipKey, reason) => {
    setForm(f => {
      const next = { ...f, [skipKey]: reason || '' };
      // al marcar como saltado, limpiamos los inputs de ese test para no
      // confundir "0" (valor real) con "no hecho"
      if (reason) {
        const testId = skipKey.replace('_skip_reason', '');
        const test = TESTS.find(t => t.id === testId);
        test?.inputs.forEach(input => { next[input.key] = ''; });
      }
      return next;
    });
  };

  const saveMutation = useMutation({
    mutationFn: (data) => entities.FitnessTest.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tests'] });
      localStorage.setItem('_reckon_sync', Date.now().toString());
      toast({ title: 'Tests guardados correctamente.' });
      localStorage.removeItem('fitness-tests-form');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { user_profile_id: profileId, ...form };
    // convertir a número los campos numéricos que tengan valor
    TESTS.forEach(test => {
      test.inputs.forEach(input => {
        if (input.type === 'number' && data[input.key] !== '') {
          data[input.key] = Number(data[input.key]);
        }
      });
    });
    // Guardar el puntaje calculado con el mismo nombre de campo que usa el
    // PDF (ej: chair_test_score, pushup_score) — Plan.jsx lee estos campos
    // directo del registro, no los recalcula.
    Object.entries(SCORERS).forEach(([testId, scorer]) => {
      const score = scorer(form);
      if (score) data[`${testId}_score`] = score.label;
    });
    Object.entries(DERIVED).forEach(([field, calc]) => {
      const val = calc(form);
      if (val !== '') data[field] = Number(val);
    });
    saveMutation.mutate(data);
  };

  const visibleTests = mode === 'self' ? TESTS.filter(t => t.mode !== 'professional') : TESTS;
  const hiddenCount = TESTS.length - visibleTests.length;

  const completedCount = visibleTests.filter(t =>
    t.inputs.some(i => form[i.key] !== '') || form[`${t.id}_skip_reason`]
  ).length;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="step-card space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <Label>Fecha del test</Label>
            <Input type="date" value={form.test_date} onChange={e => setField('test_date', e.target.value)} className="mt-1 max-w-xs" />
          </div>
          <div className="text-sm text-muted-foreground">
            {completedCount} / {visibleTests.length} tests con datos cargados
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={() => setMode('self')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
              mode === 'self' ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary/50'
            }`}
          >
            <User className="w-4 h-4" /> Lo hago solo/a
          </button>
          <button
            type="button"
            onClick={() => setMode('all')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
              mode === 'all' ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary/50'
            }`}
          >
            <Users className="w-4 h-4" /> Con profesional
          </button>
        </div>
        {mode === 'self' && hiddenCount > 0 && (
          <p className="text-xs text-muted-foreground">
            Ocultamos {hiddenCount} tests que necesitan elementos específicos o lectura técnica. El profesional los puede
            completar después cambiando a "Con profesional".
          </p>
        )}
        {parqPositive && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            Tu PAR-Q dio positivo: los tests de esfuerzo alto están bloqueados por seguridad hasta tener el OK médico.
          </p>
        )}
      </div>

      {SECTIONS.map(section => {
        const sectionTests = visibleTests.filter(t => t.section === section.id);
        if (!sectionTests.length) return null;
        return (
          <div key={section.id} className="space-y-4">
            <div>
              <h2 className="font-semibold text-foreground text-lg">{section.title}</h2>
              <p className="text-sm text-muted-foreground">{section.description}</p>
            </div>
            {sectionTests.map(test => (
              <TestCard
                key={test.id}
                test={test}
                values={form}
                onChange={setField}
                onSkip={setSkip}
                parqPositive={parqPositive}
                score={SCORERS[test.id]?.(form)}
              />
            ))}
          </div>
        );
      })}

      <div className="step-card">
        <Label>Notas generales de los tests</Label>
        <Textarea
          value={form.notes}
          onChange={e => setField('notes', e.target.value)}
          placeholder="Observaciones adicionales sobre los tests realizados..."
          className="mt-1"
          rows={3}
        />
      </div>

      <Button type="submit" disabled={saveMutation.isPending} className="w-full sm:w-auto">
        <Save className="w-4 h-4 mr-2" />
        {saveMutation.isPending ? 'Guardando...' : 'Guardar Tests de Rendimiento'}
      </Button>
    </form>
  );
}