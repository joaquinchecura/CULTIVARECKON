import { useState, useEffect, useRef } from 'react';
import { entities } from '@/api/entities';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Save, User, Users, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';
import { TESTS, SECTIONS } from '@/config/tests.config';
import TestCard from './TestCard';

const today = new Date().toISOString().split('T')[0];

// ---------- Scoring (igual lógica que antes) ----------
function scoreChair(reps) {
  const r = Number(reps);
  if (!r) return null;
  if (r >= 25) return { label: 'Excelente', className: 'level-avanzado' };
  if (r >= 20) return { label: 'Bueno', className: 'level-avanzado' };
  if (r >= 15) return { label: 'Normal', className: 'level-intermedio' };
  if (r >= 10) return { label: 'Bajo', className: 'level-basico' };
  return { label: 'Muy bajo', className: 'level-basico' };
}
function scorePushup(reps) {
  const r = Number(reps);
  if (!r) return null;
  if (r >= 30) return { label: 'Excelente', className: 'level-avanzado' };
  if (r >= 20) return { label: 'Bueno', className: 'level-avanzado' };
  if (r >= 12) return { label: 'Normal', className: 'level-intermedio' };
  if (r >= 6) return { label: 'Bajo', className: 'level-basico' };
  return { label: 'Muy bajo', className: 'level-basico' };
}
function scoreSquatDepth(depth) {
  if (depth === 'Completa') return { label: 'Bueno', className: 'level-avanzado' };
  if (depth === 'Paralela') return { label: 'Normal', className: 'level-intermedio' };
  if (depth === 'Incompleta') return { label: 'Bajo', className: 'level-basico' };
  return null;
}
function scoreBalance(sec) {
  const s = Number(sec);
  if (!s) return null;
  if (s >= 50) return { label: 'Excelente', className: 'level-avanzado' };
  if (s >= 30) return { label: 'Bueno', className: 'level-avanzado' };
  if (s >= 15) return { label: 'Normal', className: 'level-intermedio' };
  if (s >= 5) return { label: 'Bajo', className: 'level-basico' };
  return { label: 'Muy bajo', className: 'level-basico' };
}
function scoreStep(hr) {
  const h = Number(hr);
  if (!h) return null;
  if (h <= 92) return { label: 'Excelente', className: 'level-avanzado' };
  if (h <= 106) return { label: 'Bueno', className: 'level-avanzado' };
  if (h <= 122) return { label: 'Normal', className: 'level-intermedio' };
  if (h <= 135) return { label: 'Bajo', className: 'level-basico' };
  return { label: 'Muy bajo', className: 'level-basico' };
}
function scorePlank(sec) {
  const s = Number(sec);
  if (!s) return null;
  if (s >= 120) return { label: 'Excelente', className: 'level-avanzado' };
  if (s >= 90) return { label: 'Bueno', className: 'level-avanzado' };
  if (s >= 60) return { label: 'Normal', className: 'level-intermedio' };
  if (s >= 30) return { label: 'Bajo', className: 'level-basico' };
  return { label: 'Muy bajo', className: 'level-basico' };
}

const SCORERS = {
  chair_test: (v) => scoreChair(v.chair_test_reps),
  pushup: (v) => scorePushup(v.pushup_reps),
  deep_squat: (v) => scoreSquatDepth(v.deep_squat_depth),
  balance: (v) => scoreBalance(v.balance_dominant_sec),
  step_test: (v) => scoreStep(v.step_test_heart_rate),
  plank: (v) => scorePlank(v.plank_sec),
};

const DERIVED = {
  cooper_vo2max: (v) => {
    const d = Number(v.cooper_distance_m);
    if (!d) return '';
    const vo2 = (d - 504.9) / 44.73;
    return vo2 > 0 ? vo2.toFixed(1) : '';
  },
};

function buildInitialForm() {
  const form = { test_date: today, notes: '' };
  TESTS.forEach(test => {
    test.inputs.forEach(input => { form[input.key] = ''; });
    form[`${test.id}_skip_reason`] = '';
  });
  return form;
}
const FORM_INITIAL = buildInitialForm();

// Un test cuenta como "tocado" si tiene algún input con valor, o si se
// marcó como "no realizado" con un motivo.
function isTestTouched(test, form) {
  if (form[`${test.id}_skip_reason`]) return true;
  return test.inputs.some(i => form[i.key] !== '' && form[i.key] !== undefined);
}

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

  const [mode, setMode] = useState('self');
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
      if (reason) {
        const testId = skipKey.replace('_skip_reason', '');
        const test = TESTS.find(t => t.id === testId);
        test?.inputs.forEach(input => { next[input.key] = ''; });
      }
      return next;
    });
  };

  const visibleTests = mode === 'self' ? TESTS.filter(t => t.mode !== 'professional') : TESTS;
  const hiddenCount = TESTS.length - visibleTests.length;
  const visibleSections = SECTIONS.filter(s => visibleTests.some(t => t.section === s.id));

  const sectionStats = (sectionId) => {
    const sectionTests = visibleTests.filter(t => t.section === sectionId);
    const completed = sectionTests.filter(t => isTestTouched(t, form)).length;
    return { completed, total: sectionTests.length };
  };

  // ───────── Acordeón: solo una sección abierta a la vez, con auto-avance ─────────
  const [openSection, setOpenSection] = useState(visibleSections[0]?.id ?? null);
  const autoAdvancedRef = useRef(new Set());

  useEffect(() => {
    if (!openSection) return;
    if (autoAdvancedRef.current.has(openSection)) return;
    const { completed, total } = sectionStats(openSection);
    if (total > 0 && completed === total) {
      autoAdvancedRef.current.add(openSection);
      const idx = visibleSections.findIndex(s => s.id === openSection);
      const next = visibleSections[idx + 1];
      setOpenSection(next ? next.id : null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, mode]);

  const toggleSection = (id) => setOpenSection(current => (current === id ? null : id));

  const completedCount = visibleTests.filter(t => isTestTouched(t, form)).length;

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
    TESTS.forEach(test => {
      test.inputs.forEach(input => {
        if (input.type === 'number' && data[input.key] !== '') {
          data[input.key] = Number(data[input.key]);
        }
      });
    });
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="step-card space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <Label>Fecha del test</Label>
            <Input type="date" value={form.test_date} onChange={e => setField('test_date', e.target.value)} className="mt-1 max-w-xs" />
          </div>
          <div className="text-sm text-muted-foreground font-mono">
            {completedCount} / {visibleTests.length} tests con datos cargados
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={() => setMode('self')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-sm text-sm font-medium border transition-colors ${
              mode === 'self' ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary/50'
            }`}
          >
            <User className="w-4 h-4" /> Lo hago solo/a
          </button>
          <button
            type="button"
            onClick={() => setMode('all')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-sm text-sm font-medium border transition-colors ${
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
          <p className="text-xs text-alert bg-alert-soft rounded-sm px-3 py-2">
            Tu PAR-Q dio positivo: los tests de esfuerzo alto están bloqueados por seguridad hasta tener el OK médico.
          </p>
        )}
      </div>

      {visibleSections.map(section => {
        const sectionTests = visibleTests.filter(t => t.section === section.id);
        const { completed, total } = sectionStats(section.id);
        const isOpen = openSection === section.id;
        const isDone = total > 0 && completed === total;

        return (
          <div key={section.id} className="step-card !p-0 overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection(section.id)}
              className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left"
            >
              <div className="flex items-center gap-3">
                {isDone ? (
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                ) : (
                  <span className="w-5 h-5 rounded-full border-2 border-border flex-shrink-0" />
                )}
                <div>
                  <h2 className="font-display font-semibold text-foreground text-[15px]">{section.title}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">{section.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-xs font-mono text-muted-foreground">{completed}/{total}</span>
                {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </div>
            </button>

            {isOpen && (
              <div className="px-5 pb-5 space-y-4 border-t border-border pt-4">
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
            )}
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