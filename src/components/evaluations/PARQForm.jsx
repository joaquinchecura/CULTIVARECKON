import { useState, useEffect } from 'react';
import { base44 } from '@/api/entities';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Save, AlertTriangle } from 'lucide-react';

const PARQ_QUESTIONS = [
  { key: 'q1_heart_condition', label: '¿Algún médico le ha dicho alguna vez que tiene una enfermedad cardíaca y que solo deba hacer actividad física recomendada por un médico?' },
  { key: 'q2_chest_pain_activity', label: '¿Siente dolor en el pecho cuando realiza actividad física?' },
  { key: 'q3_chest_pain_rest', label: 'En el último mes, ¿ha sentido dolor en el pecho en reposo?' },
  { key: 'q4_dizziness', label: '¿Pierde el equilibrio a causa de mareos o alguna vez ha perdido el conocimiento?' },
  { key: 'q5_bone_joint', label: '¿Tiene algún problema óseo o articular que empeore con el ejercicio físico?' },
  { key: 'q6_blood_pressure_medication', label: '¿Actualmente le recetan medicamentos para la tensión arterial o para el corazón?' },
  { key: 'q7_other_reason', label: '¿Existe algún otro motivo por el que no debería hacer actividad física?' },
];

export default function PARQForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: profiles } = useQuery({ queryKey: ['profiles'], queryFn: () => entities.UserProfile.list() });
  const { data: records } = useQuery({ queryKey: ['health'], queryFn: () => entities.HealthHistory.list() });

  const existing = records?.[0];
  const profileId = profiles?.[0]?.id;

  const [parq, setParq] = useState({
    q1_heart_condition: false, q2_chest_pain_activity: false, q3_chest_pain_rest: false,
    q4_dizziness: false, q5_bone_joint: false, q6_blood_pressure_medication: false, q7_other_reason: false,
  });
  const [form, setForm] = useState({
    parq_notes: '', medical_conditions: '', injuries: '', surgeries: '', medications: '',
    clinical_report: '', sports_history: '', current_training: '',
  });

  useEffect(() => {
    if (existing) {
      setParq(existing.parq_answers || parq);
      setForm({
        parq_notes: existing.parq_notes || '',
        medical_conditions: (existing.medical_conditions || []).join(', '),
        injuries: (existing.injuries || []).join(', '),
        surgeries: (existing.surgeries || []).join(', '),
        medications: (existing.medications || []).join(', '),
        clinical_report: existing.clinical_report || '',
        sports_history: existing.sports_history || '',
        current_training: existing.current_training || '',
      });
    }
  }, [existing]);

  const saveMutation = useMutation({
    mutationFn: (data) => existing
      ? entities.HealthHistory.update(existing.id, data)
      : entities.HealthHistory.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['health'] });
      toast({ title: 'Historial de salud guardado.' });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate({
      user_profile_id: profileId,
      parq_answers: parq,
      parq_notes: form.parq_notes,
      medical_conditions: form.medical_conditions.split(',').map(s => s.trim()).filter(Boolean),
      injuries: form.injuries.split(',').map(s => s.trim()).filter(Boolean),
      surgeries: form.surgeries.split(',').map(s => s.trim()).filter(Boolean),
      medications: form.medications.split(',').map(s => s.trim()).filter(Boolean),
      clinical_report: form.clinical_report,
      sports_history: form.sports_history,
      current_training: form.current_training,
    });
  };

  const anyParqYes = Object.values(parq).some(Boolean);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* PAR-Q */}
      <div className="step-card space-y-4">
        <h2 className="font-semibold text-foreground">Cuestionario PAR-Q</h2>
        <p className="text-sm text-muted-foreground">Por favor, respondé honestamente. Estas preguntas son esenciales para tu seguridad.</p>
        <div className="space-y-3">
          {PARQ_QUESTIONS.map(({ key, label }) => (
            <div key={key} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
              <div className="flex gap-2 mt-0.5 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setParq(p => ({ ...p, [key]: true }))}
                  className={`px-2.5 py-0.5 rounded text-xs font-medium border transition-colors ${parq[key] === true ? 'bg-destructive text-destructive-foreground border-destructive' : 'border-border text-muted-foreground hover:border-destructive/50'}`}
                >Sí</button>
                <button
                  type="button"
                  onClick={() => setParq(p => ({ ...p, [key]: false }))}
                  className={`px-2.5 py-0.5 rounded text-xs font-medium border transition-colors ${parq[key] === false ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary/50'}`}
                >No</button>
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
          <Textarea value={form.parq_notes} onChange={e => setForm(f => ({ ...f, parq_notes: e.target.value }))} placeholder="Aclaraciones sobre tus respuestas..." className="mt-1" rows={2} />
        </div>
      </div>

      {/* Medical History */}
      <div className="step-card space-y-4">
        <h2 className="font-semibold text-foreground">Historial Clínico</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label>Condiciones médicas (separadas por coma)</Label>
            <Input value={form.medical_conditions} onChange={e => setForm(f => ({ ...f, medical_conditions: e.target.value }))} placeholder="Hipertensión, diabetes..." className="mt-1" />
          </div>
          <div>
            <Label>Lesiones previas</Label>
            <Input value={form.injuries} onChange={e => setForm(f => ({ ...f, injuries: e.target.value }))} placeholder="Esguince tobillo, tendinitis..." className="mt-1" />
          </div>
          <div>
            <Label>Cirugías</Label>
            <Input value={form.surgeries} onChange={e => setForm(f => ({ ...f, surgeries: e.target.value }))} placeholder="Meniscectomía, apendicectomía..." className="mt-1" />
          </div>
          <div>
            <Label>Medicamentos actuales</Label>
            <Input value={form.medications} onChange={e => setForm(f => ({ ...f, medications: e.target.value }))} placeholder="Metformina, atenolol..." className="mt-1" />
          </div>
        </div>
        <div>
          <Label>Informe de estudios / observaciones clínicas</Label>
          <Textarea value={form.clinical_report} onChange={e => setForm(f => ({ ...f, clinical_report: e.target.value }))} placeholder="Pegá aquí el contenido de tus estudios médicos, resonancias, análisis de sangre, etc." className="mt-1" rows={4} />
        </div>
      </div>

      {/* Sports History */}
      <div className="step-card space-y-4">
        <h2 className="font-semibold text-foreground">Historial Físico / Deportivo</h2>
        <div>
          <Label>Historial deportivo y de actividad física</Label>
          <Textarea value={form.sports_history} onChange={e => setForm(f => ({ ...f, sports_history: e.target.value }))} placeholder="Deportes practicados, años de experiencia, nivel competitivo..." className="mt-1" rows={3} />
        </div>
        <div>
          <Label>Entrenamiento actual</Label>
          <Textarea value={form.current_training} onChange={e => setForm(f => ({ ...f, current_training: e.target.value }))} placeholder="Qué hacés actualmente, frecuencia, intensidad..." className="mt-1" rows={3} />
        </div>
      </div>

      <Button type="submit" disabled={saveMutation.isPending}>
        <Save className="w-4 h-4 mr-2" />
        {saveMutation.isPending ? 'Guardando...' : 'Guardar Historial'}
      </Button>
    </form>
  );
}
