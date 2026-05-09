import { useState } from 'react';
import { entities } from '@/api/entities';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, RefreshCw, AlertCircle, CheckCircle2, Dumbbell } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const PLAN_TYPES = ['Entrenamiento', 'Rehabilitación', 'Mixto'];

export default function Plan() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [planType, setPlanType] = useState('Entrenamiento');
  const [generating, setGenerating] = useState(false);

  const { data: profiles } = useQuery({ queryKey: ['profiles'], queryFn: () => entities.UserProfile.list() });
  const { data: healthRecords } = useQuery({ queryKey: ['health'], queryFn: () => entities.HealthHistory.list() });
  const { data: assessments } = useQuery({ queryKey: ['assessments'], queryFn: () => entities.PhysicalAssessment.list('-assessment_date', 1) });
  const { data: tests } = useQuery({ queryKey: ['tests'], queryFn: () => entities.FitnessTest.list('-test_date', 1) });
  const { data: plans } = useQuery({ queryKey: ['plans'], queryFn: () => entities.FitnessPlan.list('-generated_date', 5) });

  const activePlan = plans?.find(p => p.status === 'Activo');

  const { data: planContent } = useQuery({
    queryKey: ['plan-content', activePlan?.id],
    queryFn: async () => {
      if (!activePlan?.ai_plan_content) return null;
      const res = await fetch(activePlan.ai_plan_content);
      return res.text();
    },
    enabled: !!activePlan?.ai_plan_content,
  });

  const profile = profiles?.[0];
  const health = healthRecords?.[0];
  const assessment = assessments?.[0];
  const test = tests?.[0];

  const hasEnoughData = profile && health;

  const savePlanMutation = useMutation({
    mutationFn: (data) => entities.FitnessPlan.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['plans'] }),
  });

  const archivePrevious = async () => {
    if (activePlan) {
      await entities.FitnessPlan.update(activePlan.id, { status: 'Archivado' });
      queryClient.invalidateQueries({ queryKey: ['plans'] });
    }
  };

  const generatePlan = async () => {
    if (!hasEnoughData) {
      toast({ title: 'Datos incompletos', description: 'Completá al menos el Perfil y el Historial de Salud.', variant: 'destructive' });
      return;
    }
    setGenerating(true);

    const prompt = buildPrompt(profile, health, assessment, test, planType);

    const result = await entities.integrations.Core.InvokeLLM({
      prompt,
      model: 'claude_sonnet_4_6',
    });

    // Upload plan content as a file to avoid field size limits
    const blob = new Blob([result], { type: 'text/plain' });
    const file = new File([blob], 'plan.txt', { type: 'text/plain' });
    const { file_url } = await entities.integrations.Core.UploadFile({ file });

    await archivePrevious();

    await savePlanMutation.mutateAsync({
      user_profile_id: profile.id,
      generated_date: new Date().toISOString().split('T')[0],
      plan_type: planType,
      objective: profile.goal,
      days_per_week: profile.available_days,
      activities_selected: profile.preferred_activities || [],
      ai_plan_content: file_url,
      status: 'Activo',
    });

    setGenerating(false);
    toast({ title: 'Plan generado exitosamente.' });
  };

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium text-primary uppercase tracking-widest mb-1">Paso 03</p>
        <h1 className="text-2xl font-bold text-foreground">Mi Plan de Actividad Física</h1>
        <p className="text-muted-foreground mt-1">La IA analiza tus datos y genera un plan profesional personalizado.</p>
      </div>

      {!hasEnoughData && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-secondary border border-border">
          <AlertCircle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-foreground text-sm">Datos insuficientes</p>
            <p className="text-sm text-muted-foreground mt-1">
              Para generar el plan necesitás completar <strong>Perfil</strong> y <strong>Historial de Salud</strong>. Las mediciones y tests mejoran la calidad del plan.
            </p>
          </div>
        </div>
      )}

      {/* Generator */}
      <div className="step-card space-y-4">
        <h2 className="font-semibold text-foreground">Generar nuevo plan</h2>
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1">
            <Label>Tipo de plan</Label>
            <Select value={planType} onValueChange={setPlanType}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>{PLAN_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Button
            onClick={generatePlan}
            disabled={generating || !hasEnoughData}
            className="w-full sm:w-auto"
          >
            {generating ? (
              <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Generando plan...</>
            ) : (
              <><Sparkles className="w-4 h-4 mr-2" />Generar Plan con IA</>
            )}
          </Button>
        </div>
        {generating && (
          <div className="p-4 bg-secondary/50 rounded-lg text-sm text-muted-foreground text-center animate-pulse">
            La IA está analizando tus datos y creando un plan personalizado... esto puede tomar unos segundos.
          </div>
        )}
      </div>

      {/* Active Plan Display */}
      {activePlan && (
        <div className="step-card space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-foreground">Plan Activo</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="badge-pill bg-accent text-accent-foreground">{activePlan.plan_type}</span>
              <span className="badge-pill bg-secondary text-secondary-foreground">{activePlan.generated_date}</span>
            </div>
          </div>
          {activePlan.objective && (
            <div className="flex items-center gap-2 p-3 bg-secondary/50 rounded-lg">
              <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="text-sm text-foreground"><strong>Objetivo:</strong> {activePlan.objective}</span>
            </div>
          )}
          <div className="prose prose-sm max-w-none">
            <div className="p-4 bg-secondary/30 rounded-xl text-foreground leading-relaxed space-y-2">
              <ReactMarkdown
                key={activePlan.id}
                components={{
                  h1: ({children}) => <h1 className="text-xl font-bold text-foreground mt-4 mb-2">{children}</h1>,
                  h2: ({children}) => <h2 className="text-lg font-semibold text-foreground mt-4 mb-2">{children}</h2>,
                  h3: ({children}) => <h3 className="text-base font-semibold text-foreground mt-3 mb-1">{children}</h3>,
                  p: ({children}) => <p className="text-sm text-foreground mb-2 leading-relaxed">{children}</p>,
                  ul: ({children}) => <ul className="list-disc list-inside space-y-1 mb-2">{children}</ul>,
                  ol: ({children}) => <ol className="list-decimal list-inside space-y-1 mb-2">{children}</ol>,
                  li: ({children}) => <li className="text-sm text-foreground">{children}</li>,
                  strong: ({children}) => <strong className="font-semibold text-foreground">{children}</strong>,
                  hr: () => <hr className="border-border my-4" />,
                }}
              >
                {planContent || ''}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function buildPrompt(profile, health, assessment, test, planType) {
  const age = profile.birth_date
    ? Math.floor((new Date() - new Date(profile.birth_date)) / (1000 * 60 * 60 * 24 * 365.25))
    : 'No especificada';

  const parq = health?.parq_answers || {};
  const anyYes = Object.values(parq).some(Boolean);

  return `
Actúa como un equipo multidisciplinario de profesionales de la salud y el ejercicio físico (deportólogo, traumatólogo, cardiólogo, fisioterapeuta, kinesiólogo, nutricionista y licenciado en educación física).

Tu tarea es generar un PLAN DE ${planType.toUpperCase()} personalizado, seguro y progresivo para el siguiente usuario.

═══════════════════════════════
📋 DATOS PERSONALES
═══════════════════════════════
• Nombre: ${profile.full_name}
• Edad: ${age} años
• Género: ${profile.gender || 'No especificado'}
• Altura: ${profile.height_cm || 'N/D'} cm | Peso: ${profile.weight_kg || 'N/D'} kg
• Ocupación: ${profile.occupation || 'No especificada'}
• Nivel de actividad actual: ${profile.activity_level || 'No especificado'}
• Objetivo principal: ${profile.goal || 'No especificado'}
• Equipamiento disponible: ${profile.equipment_access || 'No especificado'}
• Días disponibles: ${profile.available_days || 'N/D'} por semana
• Duración por sesión: ${profile.session_duration_min || 'N/D'} minutos
• Actividades preferidas: ${(profile.preferred_activities || []).join(', ') || 'No especificadas'}

═══════════════════════════════
🏥 HISTORIAL DE SALUD
═══════════════════════════════
• PAR-Q con respuestas afirmativas: ${anyYes ? 'SÍ — requiere precaución' : 'No'}
• Condiciones médicas: ${(health.medical_conditions || []).join(', ') || 'Ninguna reportada'}
• Lesiones previas: ${(health.injuries || []).join(', ') || 'Ninguna reportada'}
• Cirugías: ${(health.surgeries || []).join(', ') || 'Ninguna reportada'}
• Medicamentos: ${(health.medications || []).join(', ') || 'Ninguno'}
• Informe clínico: ${health.clinical_report || 'No proporcionado'}
• Historial deportivo: ${health.sports_history || 'No especificado'}
• Entrenamiento actual: ${health.current_training || 'No especificado'}

${assessment ? `
═══════════════════════════════
📏 MEDICIONES CORPORALES (${assessment.assessment_date})
═══════════════════════════════
• IMC: ${assessment.imc || 'N/D'}
• Cintura: ${assessment.waist_cm || 'N/D'} cm | Cadera: ${assessment.hip_cm || 'N/D'} cm
• ICC: ${assessment.waist_hip_ratio || 'N/D'}
• % Grasa corporal: ${assessment.body_fat_pct || 'N/D'}%
• Masa muscular: ${assessment.muscle_mass_kg || 'N/D'} kg
• Grasa visceral: ${assessment.visceral_fat || 'N/D'}
• Edad metabólica: ${assessment.metabolic_age || 'N/D'} años
• Somatotipo: Endo ${assessment.somatotype_endomorphy || '-'} / Meso ${assessment.somatotype_mesomorphy || '-'} / Ecto ${assessment.somatotype_ectomorphy || '-'}
` : ''}

${test ? `
═══════════════════════════════
💪 TESTS DE CONDICIÓN FÍSICA (${test.test_date})
═══════════════════════════════
• Fuerza tren inferior (silla): ${test.chair_test_reps || 'N/D'} reps — ${test.chair_test_score || 'N/D'}
• Fuerza tren superior (flexiones): ${test.pushup_reps || 'N/D'} reps — ${test.pushup_score || 'N/D'}
• Movilidad (sentadilla profunda): ${test.deep_squat_depth || 'N/D'} — ${test.deep_squat_score || 'N/D'}
  Compensaciones: ${test.deep_squat_compensation || 'Ninguna reportada'}
• Equilibrio unipodal: dominante ${test.balance_dominant_sec || 'N/D'} seg / no dominante ${test.balance_nondominant_sec || 'N/D'} seg — ${test.balance_score || 'N/D'}
• Test SRT: ${test.srt_score || 'N/D'} / 10 — ${test.srt_interpretation || ''}
• Test del escalón: FC ${test.step_test_heart_rate || 'N/D'} lpm — VO₂ máx est. ${test.vo2max_estimate || 'N/D'} ml/kg/min — ${test.step_test_score || 'N/D'}
` : ''}

═══════════════════════════════
📝 INSTRUCCIONES PARA EL PLAN
═══════════════════════════════
Genera un plan detallado con la siguiente estructura:

1. **ANÁLISIS DEL PERFIL** — Evaluación del estado actual, fortalezas, áreas de mejora y consideraciones especiales.
2. **OBJETIVOS DEL PLAN** — Objetivos específicos, medibles y alcanzables.
3. **PLAN SEMANAL** — Distribución de los días de entrenamiento con tipo de sesión y duración.
4. **DESCRIPCIÓN DE SESIONES** — Para cada tipo de sesión: calentamiento, parte principal (ejercicios, series, repeticiones, descansos), vuelta a la calma.
5. **PROGRESIÓN** — Cómo debe progresar el plan en las primeras 4-8 semanas.
6. **RECOMENDACIONES ADICIONALES** — Recuperación, nutrición general, sueño, hidratación.
7. **INDICADORES DE PROGRESO** — Qué medir para saber si el plan está funcionando.
${anyYes ? '8. **PRECAUCIONES MÉDICAS** — Indicaciones especiales por el PAR-Q positivo.' : ''}

Sé específico, práctico y usa lenguaje claro. Incluye ejercicios concretos con nombre, descripción breve y parámetros (series × reps o tiempo).
`;
}
