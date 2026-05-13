import { useState, useEffect } from 'react';
import { entities } from '@/api/entities';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Save, AlertTriangle, Heart, Brain, Battery } from 'lucide-react';

const PARQ_QUESTIONS = [
  { key: 'q1_heart_condition', label: '¿Algún médico le ha dicho alguna vez que tiene una enfermedad cardíaca y que solo deba hacer actividad física recomendada por un médico?' },
  { key: 'q2_chest_pain_activity', label: '¿Siente dolor en el pecho cuando realiza actividad física?' },
  { key: 'q3_chest_pain_rest', label: 'En el último mes, ¿ha sentido dolor en el pecho en reposo?' },
  { key: 'q4_dizziness', label: '¿Pierde el equilibrio a causa de mareos o alguna vez ha perdido el conocimiento?' },
  { key: 'q5_bone_joint', label: '¿Tiene algún problema óseo o articular que empeore con el ejercicio físico?' },
  { key: 'q6_blood_pressure_medication', label: '¿Actualmente le recetan medicamentos para la tensión arterial o para el corazón?' },
  { key: 'q7_other_reason', label: '¿Existe algún otro motivo por el que no debería hacer actividad física?' },
];

const PARQ_INITIAL = {
  q1_heart_condition: false, q2_chest_pain_activity: false, q3_chest_pain_rest: false,
  q4_dizziness: false, q5_bone_joint: false, q6_blood_pressure_medication: false, q7_other_reason: false,
};

const FORM_INITIAL = {
  parq_notes: '',
  pain_at_rest: '', pain_with_movement: '', dizziness_exertion: false,
  palpitations: false, family_heart_history: false,
  cholesterol_known: '', triglycerides_known: '', blood_pressure_known: '', fasting_glucose_known: '',
  covid_history: '', long_covid: false,
  medical_conditions: '', injuries: '', surgeries: '', medications: '',
  clinical_report: '', sports_history: '', current_training: '',
  hrv_morning: '', spo2: '', morning_temperature: '', resting_heart_rate: '',
  motivation_level: '', exercise_confidence: '', perceived_barriers: '',
  social_support: '', dropout_history: '',
};

export default function PARQForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: profiles } = useQuery({ queryKey: ['profiles'], queryFn: () => entities.UserProfile.list() });
  const { data: records } = useQuery({ queryKey: ['health'], queryFn: () => entities.HealthHistory.list() });

  const existing = records?.[0];
  const profileId = profiles?.[0]?.id;

  // Estado con persistencia en localStorage
  const [parq, setParq] = useState(() => {
    try { const s = localStorage.getItem('parq-answers'); return s ? JSON.parse(s) : PARQ_INITIAL; }
    catch { return PARQ_INITIAL; }
  });

  const [form, setForm] = useState(() => {
    try { const s = localStorage.getItem('parq-form'); return s ? JSON.parse(s) : FORM_INITIAL; }
    catch { return FORM_INITIAL; }
  });

  // Guardar en localStorage en cada cambio
  useEffect(() => { localStorage.setItem('parq-answers', JSON.stringify(parq)); }, [parq]);
  useEffect(() => { localStorage.setItem('parq-form', JSON.stringify(form)); }, [form]);

  // Cargar del servidor solo si NO hay datos locales guardados
  useEffect(() => {
    if (existing) {
      const savedParq = localStorage.getItem('parq-answers');
      const savedForm = localStorage.getItem('parq-form');
      if (!savedParq) {
        setParq(existing.parq_answers || PARQ_INITIAL);
      }
      if (!savedForm) {
        setForm({
          parq_notes: existing.parq_notes || '',
          pain_at_rest: existing.pain_at_rest ?? '',
          pain_with_movement: existing.pain_with_movement ?? '',
          dizziness_exertion: existing.dizziness_exertion || false,
          palpitations: existing.palpitations || false,
          family_heart_history: existing.family_heart_history || false,
          cholesterol_known: existing.cholesterol_known ?? '',
          triglycerides_known: existing.triglycerides_known ?? '',
          blood_pressure_known: existing.blood_pressure_known ?? '',
          fasting_glucose_known: existing.fasting_glucose_known ?? '',
          covid_history: existing.covid_history || '',
          long_covid: existing.long_covid || false,
          medical_conditions: (existing.medical_conditions || []).join(', '),
          injuries: (existing.injuries || []).join(', '),
          surgeries: (existing.surgeries || []).join(', '),
          medications: (existing.medications || []).join(', '),
          clinical_report: existing.clinical_report || '',
          sports_history: existing.sports_history || '',
          current_training: existing.current_training || '',
          hrv_morning: existing.hrv_morning ?? '',
          spo2: existing.spo2 ?? '',
          morning_temperature: existing.morning_temperature ?? '',
          resting_heart_rate: existing.resting_heart_rate ?? '',
          motivation_level: existing.motivation_level ?? '',
          exercise_confidence: existing.exercise_confidence ?? '',
          perceived_barriers: existing.perceived_barriers || '',
          social_support: existing.social_support || '',
          dropout_history: existing.dropout_history ?? '',
        });
      }
    }
  }, [existing]);

  const saveMutation = useMutation({
    mutationFn: (data) => existing
      ? entities.HealthHistory.update(existing.id, data)
      : entities.HealthHistory.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['health'] });
      toast({ title: 'Evaluación de salud guardada.' });
      // Limpiar localStorage al guardar exitosamente
      localStorage.removeItem('parq-answers');
      localStorage.removeItem('parq-form');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate({
      user_profile_id: profileId,
      parq_answers: parq,
      parq_notes: form.parq_notes,
      pain_at_rest: form.pain_at_rest === '' ? undefined : Number(form.pain_at_rest),
      pain_with_movement: form.pain_with_movement,
      dizziness_exertion: form.dizziness_exertion,
      palpitations: form.palpitations,
      family_heart_history: form.family_heart_history,
      cholesterol_known: form.cholesterol_known,
      triglycerides_known: form.triglycerides_known,
      blood_pressure_known: form.blood_pressure_known,
      fasting_glucose_known: form.fasting_glucose_known,
      covid_history: form.covid_history,
      long_covid: form.long_covid,
      medical_conditions: form.medical_conditions.split(',').map(s => s.trim()).filter(Boolean),
      injuries: form.injuries.split(',').map(s => s.trim()).filter(Boolean),
      surgeries: form.surgeries.split(',').map(s => s.trim()).filter(Boolean),
      medications: form.medications.split(',').map(s => s.trim()).filter(Boolean),
      clinical_report: form.clinical_report,
      sports_history: form.sports_history,
      current_training: form.current_training,
      hrv_morning: form.hrv_morning === '' ? undefined : Number(form.hrv_morning),
      spo2: form.spo2 === '' ? undefined : Number(form.spo2),
      morning_temperature: form.morning_temperature === '' ? undefined : Number(form.morning_temperature),
      resting_heart_rate: form.resting_heart_rate === '' ? undefined : Number(form.resting_heart_rate),
      motivation_level: form.motivation_level === '' ? undefined : Number(form.motivation_level),
      exercise_confidence: form.exercise_confidence === '' ? undefined : Number(form.exercise_confidence),
      perceived_barriers: form.perceived_barriers,
      social_support: form.social_support,
      dropout_history: form.dropout_history === '' ? undefined : Number(form.dropout_history),
    });
  };

  const anyParqYes = Object.values(parq).some(Boolean);
  const setF = (key) => (val) => setForm(f => ({ ...f, [key]: val }));
  const setInput = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const YesNo = ({ value, onChange }) => (
    <div className="flex gap-2">
      <button type="button" onClick={() => onChange(true)} className={`px-2.5 py-0.5 rounded text-xs font-medium border transition-colors ${value === true ? 'bg-destructive text-destructive-foreground border-destructive' : 'border-border text-muted-foreground hover:border-destructive/50'}`}>Sí</button>
      <button type="button" onClick={() => onChange(false)} className={`px-2.5 py-0.5 rounded text-xs font-medium border transition-colors ${value === false ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary/50'}`}>No</button>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="step-card space-y-4">
        <h2 className="font-semibold text-foreground flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-primary" />
          Cuestionario PAR-Q
        </h2>
        <p className="text-sm text-muted-foreground">Respondé honestamente. Estas preguntas son esenciales para tu seguridad.</p>
        <div className="space-y-3">
          {PARQ_QUESTIONS.map(({ key, label }) => (
            <div key={key} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
              <div className="flex gap-2 mt-0.5 flex-shrink-0">
                <button type="button" onClick={() => setParq(p => ({ ...p, [key]: true }))} className={`px-2.5 py-0.5 rounded text-xs font-medium border transition-colors ${parq[key] === true ? 'bg-destructive text-destructive-foreground border-destructive' : 'border-border text-muted-foreground hover:border-destructive/50'}`}>Sí</button>
                <button type="button" onClick={() => setParq(p => ({ ...p, [key]: false }))} className={`px-2.5 py-0.5 rounded text-xs font-medium border transition-colors ${parq[key] === false ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary/50'}`}>No</button>
              </div>
              <p className="text-sm text-foreground">{label}</p>
            </div>
          ))}
        </div>
        {anyParqYes && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">Respondiste "Sí" a una o más preguntas. Se recomienda consultar con un médico antes de iniciar el programa.</p>
          </div>
        )}
        <div>
          <Label>Notas adicionales del PAR-Q</Label>
          <Textarea value={form.parq_notes} onChange={setInput('parq_notes')} placeholder="Aclaraciones sobre tus respuestas..." className="mt-1" rows={2} />
        </div>
      </div>

      <div className="step-card space-y-4">
        <h2 className="font-semibold text-foreground flex items-center gap-2">
          <Heart className="w-4 h-4 text-primary" />
          Screening Cardiovascular y Dolor
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label>Dolor en reposo (0-10)</Label>
            <Input type="number" min="0" max="10" value={form.pain_at_rest} onChange={setInput('pain_at_rest')} placeholder="0 = sin dolor" className="mt-1" />
            <p className="text-xs text-muted-foreground mt-1">Linea base de dolor general</p>
          </div>
          <div>
            <Label>Dolor con movimiento</Label>
            <Input value={form.pain_with_movement} onChange={setInput('pain_with_movement')} placeholder="Ej: al agacharme, al girar..." className="mt-1" />
            <p className="text-xs text-muted-foreground mt-1">Diferencial mecánico</p>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
            <div>
              <p className="text-sm font-medium text-foreground">Mareos con esfuerzo</p>
              <p className="text-xs text-muted-foreground">Riesgo cardiovascular</p>
            </div>
            <YesNo value={form.dizziness_exertion} onChange={setF('dizziness_exertion')} />
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
            <div>
              <p className="text-sm font-medium text-foreground">Palpitaciones / taquicardia</p>
              <p className="text-xs text-muted-foreground">ECG recomendado</p>
            </div>
            <YesNo value={form.palpitations} onChange={setF('palpitations')} />
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
            <div>
              <p className="text-sm font-medium text-foreground">Historia familiar cardíaca</p>
              <p className="text-xs text-muted-foreground">Riesgo genético</p>
            </div>
            <YesNo value={form.family_heart_history} onChange={setF('family_heart_history')} />
          </div>
          <div>
            <Label>Colesterol (mg/dL) — si lo sabe</Label>
            <Input value={form.cholesterol_known} onChange={setInput('cholesterol_known')} placeholder="Ej: 190" className="mt-1" />
            <p className="text-xs text-muted-foreground mt-1">Riesgo metabólico</p>
          </div>
          <div>
            <Label>Triglicéridos (mg/dL) — si lo sabe</Label>
            <Input value={form.triglycerides_known} onChange={setInput('triglycerides_known')} placeholder="Ej: 110" className="mt-1" />
          </div>
          <div>
            <Label>Presión arterial — si la mide</Label>
            <Input value={form.blood_pressure_known} onChange={setInput('blood_pressure_known')} placeholder="Ej: 120/80" className="mt-1" />
            <p className="text-xs text-muted-foreground mt-1">Riesgo cardiovascular</p>
          </div>
          <div>
            <Label>Glucemia en ayunas (mg/dL)</Label>
            <Input value={form.fasting_glucose_known} onChange={setInput('fasting_glucose_known')} placeholder="Ej: 92" className="mt-1" />
            <p className="text-xs text-muted-foreground mt-1">Riesgo metabólico</p>
          </div>
          <div className="sm:col-span-2">
            <Label>Antecedentes de COVID / long COVID</Label>
            <Textarea value={form.covid_history} onChange={setInput('covid_history')} placeholder="¿Cuándo? ¿Síntomas persistentes?" className="mt-1" rows={2} />
            <div className="flex items-center gap-2 mt-2">
              <input type="checkbox" id="long_covid" checked={form.long_covid} onChange={e => setF('long_covid')(e.target.checked)} className="rounded border-border" />
              <label htmlFor="long_covid" className="text-sm text-muted-foreground">Padezco long COVID (fatiga persistente, problemas pulmonares)</label>
            </div>
          </div>
        </div>
      </div>

      <div className="step-card space-y-4">
        <h2 className="font-semibold text-foreground">Historial Clínico</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label>Condiciones médicas (separadas por coma)</Label>
            <Input value={form.medical_conditions} onChange={setInput('medical_conditions')} placeholder="Hipertensión, diabetes..." className="mt-1" />
          </div>
          <div>
            <Label>Lesiones previas</Label>
            <Input value={form.injuries} onChange={setInput('injuries')} placeholder="Esguince tobillo, tendinitis..." className="mt-1" />
          </div>
          <div>
            <Label>Cirugías</Label>
            <Input value={form.surgeries} onChange={setInput('surgeries')} placeholder="Meniscectomía, apendicectomía..." className="mt-1" />
          </div>
          <div>
            <Label>Medicamentos actuales</Label>
            <Input value={form.medications} onChange={setInput('medications')} placeholder="Metformina, atenolol..." className="mt-1" />
          </div>
        </div>
        <div>
          <Label>Informe de estudios / observaciones clínicas</Label>
          <Textarea value={form.clinical_report} onChange={setInput('clinical_report')} placeholder="Pegá aquí el contenido de tus estudios médicos, resonancias, análisis de sangre, etc." className="mt-1" rows={4} />
        </div>
      </div>

      <div className="step-card space-y-4">
        <h2 className="font-semibold text-foreground">Historial Físico / Deportivo</h2>
        <div>
          <Label>Historial deportivo y de actividad física</Label>
          <Textarea value={form.sports_history} onChange={setInput('sports_history')} placeholder="Deportes practicados, años de experiencia, nivel competitivo..." className="mt-1" rows={3} />
        </div>
        <div>
          <Label>Entrenamiento actual</Label>
          <Textarea value={form.current_training} onChange={setInput('current_training')} placeholder="Que haces actualmente, frecuencia, intensidad..." className="mt-1" rows={3} />
        </div>
      </div>

      <div className="step-card space-y-4">
        <h2 className="font-semibold text-foreground flex items-center gap-2">
          <Battery className="w-4 h-4 text-primary" />
          Biomarcadores de Recuperación
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label>HRV matutino (ms)</Label>
            <Input type="number" value={form.hrv_morning} onChange={setInput('hrv_morning')} placeholder="Ej: 45" className="mt-1" />
            <p className="text-xs text-muted-foreground mt-1">Sobrecarga vs recuperación (si tenés smartwatch)</p>
          </div>
          <div>
            <Label>Saturación O₂ (%)</Label>
            <Input type="number" min="70" max="100" value={form.spo2} onChange={setInput('spo2')} placeholder="Ej: 98" className="mt-1" />
            <p className="text-xs text-muted-foreground mt-1">Función pulmonar (si tenés oxímetro)</p>
          </div>
          <div>
            <Label>Temperatura corporal matutina (°C)</Label>
            <Input type="number" step="0.1" value={form.morning_temperature} onChange={setInput('morning_temperature')} placeholder="Ej: 36.5" className="mt-1" />
            <p className="text-xs text-muted-foreground mt-1">Metabolismo basal</p>
          </div>
          <div>
            <Label>Frecuencia cardíaca en reposo (lpm)</Label>
            <Input type="number" value={form.resting_heart_rate} onChange={setInput('resting_heart_rate')} placeholder="Ej: 58" className="mt-1" />
            <p className="text-xs text-muted-foreground mt-1">Fitness cardiovascular</p>
          </div>
        </div>
      </div>

      <div className="step-card space-y-4">
        <h2 className="font-semibold text-foreground flex items-center gap-2">
          <Brain className="w-4 h-4 text-primary" />
          Mentalidad y Adherencia
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label>Motivación actual (1-10)</Label>
            <Input type="number" min="1" max="10" value={form.motivation_level} onChange={setInput('motivation_level')} placeholder="¿Del 1 al 10, cuán motivado estás?" className="mt-1" />
            <p className="text-xs text-muted-foreground mt-1">Para diseñar desafíos a tu medida</p>
          </div>
          <div>
            <Label>Autoconfianza para ejercicio (1-10)</Label>
            <Input type="number" min="1" max="10" value={form.exercise_confidence} onChange={setInput('exercise_confidence')} placeholder="¿Te sentís seguro haciendo ejercicio?" className="mt-1" />
            <p className="text-xs text-muted-foreground mt-1">Nivel de instrucción y supervisión necesario</p>
          </div>
          <div className="sm:col-span-2">
            <Label>Barreras percibidas</Label>
            <Textarea value={form.perceived_barriers} onChange={setInput('perceived_barriers')} placeholder="Tiempo, energía, dolor, miedo al gimnasio, dinero..." className="mt-1" rows={2} />
            <p className="text-xs text-muted-foreground mt-1">Para encontrar soluciones dentro de tu plan</p>
          </div>
          <div>
            <Label>Soporte social</Label>
            <Input value={form.social_support} onChange={setInput('social_support')} placeholder="Familia, amigos, coach, grupo..." className="mt-1" />
            <p className="text-xs text-muted-foreground mt-1">Accountability y red de apoyo</p>
          </div>
          <div>
            <Label>Historial de abandono</Label>
            <Input type="number" min="0" value={form.dropout_history} onChange={setInput('dropout_history')} placeholder="¿Cuántas veces dejaste de entrenar?" className="mt-1" />
            <p className="text-xs text-muted-foreground mt-1">Para estrategias de adherencia personalizadas</p>
          </div>
        </div>
      </div>

      <Button type="submit" disabled={saveMutation.isPending} className="w-full sm:w-auto">
        <Save className="w-4 h-4 mr-2" />
        {saveMutation.isPending ? 'Guardando...' : 'Guardar Evaluación de Salud'}
      </Button>
    </form>
  );
}