import { useState } from 'react';
import { entities } from '@/api/entities';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { FileDown, Dumbbell, CheckCircle2, User, Heart, Ruler, Activity } from 'lucide-react';
import { jsPDF } from 'jspdf';

const PLAN_TYPES = ['Entrenamiento', 'Rehabilitación', 'Mixto'];

export default function Plan() {
  const { toast } = useToast();
  const [planType, setPlanType] = useState('Entrenamiento');

  const { data: profiles } = useQuery({ queryKey: ['profiles'], queryFn: () => entities.UserProfile.list() });
  const { data: healthRecords } = useQuery({ queryKey: ['health'], queryFn: () => entities.HealthHistory.list() });
  const { data: assessments } = useQuery({ queryKey: ['assessments'], queryFn: () => entities.PhysicalAssessment.list('-assessment_date', 1) });
  const { data: tests } = useQuery({ queryKey: ['tests'], queryFn: () => entities.FitnessTest.list('-test_date', 1) });
  const { data: plans } = useQuery({ queryKey: ['plans'], queryFn: () => entities.FitnessPlan.list('-generated_date', 5) });

  const activePlan = plans?.find(p => p.status === 'Activo');

  const profile = profiles?.[0];
  const health = healthRecords?.[0];
  const assessment = assessments?.[0];
  const test = tests?.[0];

  const hasEnoughData = profile && health;

  const generatePDF = () => {
    if (!profile || !health) {
      toast({ title: 'Datos incompletos', description: 'Completá al menos el Perfil y el Historial de Salud.', variant: 'destructive' });
      return;
    }

    const doc = new jsPDF();
    const age = profile.birth_date
      ? Math.floor((new Date() - new Date(profile.birth_date)) / (1000 * 60 * 60 * 24 * 365.25))
      : 'N/D';

    let y = 20;
    const line = (text, size = 12, bold = false) => {
      doc.setFontSize(size);
      if (bold) doc.setFont('helvetica', 'bold');
      else doc.setFont('helvetica', 'normal');
      doc.text(text, 20, y);
      y += size * 0.6;
      if (y > 270) { doc.addPage(); y = 20; }
    };

    // Header
    doc.setFillColor(59, 130, 246);
    doc.rect(0, 0, 210, 15, 'F');
    doc.setTextColor(255, 255, 255);
    line('CULTIVAFITNESS RECKON - FICHA DEL USUARIO', 14, true);
    y += 5;

    // Profile
    doc.setTextColor(0, 0, 0);
    line('DATOS PERSONALES', 13, true);
    line(`Nombre: ${profile.full_name || 'N/D'}`, 11);
    line(`Edad: ${age} años | Género: ${profile.gender || 'N/D'}`, 11);
    line(`Altura: ${profile.height_cm || 'N/D'} cm | Peso: ${profile.weight_kg || 'N/D'} kg`, 11);
    line(`Ocupación: ${profile.occupation || 'N/D'}`, 11);
    line(`Nivel de actividad: ${profile.activity_level || 'N/D'}`, 11);
    line(`Objetivo: ${profile.goal || 'N/D'}`, 11);
    line(`Equipamiento: ${profile.equipment_access || 'N/D'}`, 11);
    line(`Días disponibles: ${profile.available_days || 'N/D'} por semana`, 11);
    line(`Duración por sesión: ${profile.session_duration_min || 'N/D'} min`, 11);
    line(`Actividades preferidas: ${(profile.preferred_activities || []).join(', ') || 'N/D'}`, 11);
    y += 5;

    // Health
    line('HISTORIAL DE SALUD', 13, true);
    const parq = health.parq_answers || {};
    const anyYes = Object.values(parq).some(Boolean);
    line(`PAR-Q positivo: ${anyYes ? 'SI - Requiere precaución' : 'No'}`, 11);
    line(`Condiciones médicas: ${(health.medical_conditions || []).join(', ') || 'Ninguna'}`, 11);
    line(`Lesiones previas: ${(health.injuries || []).join(', ') || 'Ninguna'}`, 11);
    line(`Cirugías: ${(health.surgeries || []).join(', ') || 'Ninguna'}`, 11);
    line(`Medicamentos: ${(health.medications || []).join(', ') || 'Ninguno'}`, 11);
    line(`Informe clínico: ${health.clinical_report || 'No proporcionado'}`, 11);
    line(`Historial deportivo: ${health.sports_history || 'No especificado'}`, 11);
    line(`Entrenamiento actual: ${health.current_training || 'No especificado'}`, 11);
    y += 5;

    // Assessment
    if (assessment) {
      line('MEDICIONES CORPORALES', 13, true);
      line(`Fecha: ${assessment.assessment_date || 'N/D'}`, 11);
      line(`IMC: ${assessment.imc || 'N/D'}`, 11);
      line(`Cintura: ${assessment.waist_cm || 'N/D'} cm | Cadera: ${assessment.hip_cm || 'N/D'} cm`, 11);
      line(`ICC: ${assessment.waist_hip_ratio || 'N/D'}`, 11);
      line(`% Grasa corporal: ${assessment.body_fat_pct || 'N/D'}%`, 11);
      line(`Masa muscular: ${assessment.muscle_mass_kg || 'N/D'} kg`, 11);
      line(`Grasa visceral: ${assessment.visceral_fat || 'N/D'}`, 11);
      line(`Edad metabólica: ${assessment.metabolic_age || 'N/D'} años`, 11);
      line(`Somatotipo: Endo ${assessment.somatotype_endomorphy || '-'} / Meso ${assessment.somatotype_mesomorphy || '-'} / Ecto ${assessment.somatotype_ectomorphy || '-'}`, 11);
      y += 5;
    }

    // Tests
    if (test) {
      line('TESTS DE CONDICIÓN FÍSICA', 13, true);
      line(`Fecha: ${test.test_date || 'N/D'}`, 11);
      line(`Fuerza tren inferior (silla): ${test.chair_test_reps || 'N/D'} reps`, 11);
      line(`Fuerza tren superior (flexiones): ${test.pushup_reps || 'N/D'} reps`, 11);
      line(`Movilidad (sentadilla profunda): ${test.deep_squat_depth || 'N/D'}`, 11);
      line(`Equilibrio unipodal: D ${test.balance_dominant_sec || 'N/D'} seg / ND ${test.balance_nondominant_sec || 'N/D'} seg`, 11);
      line(`Test SRT: ${test.srt_score || 'N/D'} / 10`, 11);
      line(`Test del escalón: FC ${test.step_test_heart_rate || 'N/D'} lpm | VO2max est. ${test.vo2max_estimate || 'N/D'} ml/kg/min`, 11);
      y += 5;
    }

    // Footer
    line('', 10);
    line('═══════════════════════════════════════', 10);
    line('Enviar este PDF al especialista para', 10);
    line('la elaboración del plan personalizado.', 10);
    line('═══════════════════════════════════════', 10);

    doc.save(`Ficha_${profile.full_name?.replace(/\s+/g, '_') || 'Usuario'}_${new Date().toISOString().split('T')[0]}.pdf`);
    toast({ title: 'PDF descargado correctamente.' });
  };

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium text-primary uppercase tracking-widest mb-1">Paso 03</p>
        <h1 className="text-2xl font-bold text-foreground">Mi Plan de Actividad Física</h1>
        <p className="text-muted-foreground mt-1">Descargá tu ficha y enviásela al especialista para que arme tu plan.</p>
      </div>

      {!hasEnoughData && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-secondary border border-border">
          <Activity className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-foreground text-sm">Datos insuficientes</p>
            <p className="text-sm text-muted-foreground mt-1">
              Para generar la ficha necesitás completar <strong>Perfil</strong> y <strong>Historial de Salud</strong>.
            </p>
          </div>
        </div>
      )}

      {/* Data Summary */}
      {profile && (
        <div className="step-card space-y-4">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            Resumen de tus datos
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="p-3 bg-secondary/50 rounded-lg">
              <span className="text-muted-foreground">Nombre:</span> {profile.full_name}
            </div>
            <div className="p-3 bg-secondary/50 rounded-lg">
              <span className="text-muted-foreground">Objetivo:</span> {profile.goal}
            </div>
            <div className="p-3 bg-secondary/50 rounded-lg">
              <span className="text-muted-foreground">Nivel:</span> {profile.activity_level}
            </div>
            <div className="p-3 bg-secondary/50 rounded-lg">
              <span className="text-muted-foreground">Días/semana:</span> {profile.available_days}
            </div>
          </div>
          {health && (
            <div className="flex items-center gap-2 p-3 bg-secondary/50 rounded-lg text-sm">
              <Heart className="w-4 h-4 text-primary" />
              <span>Historial de salud completado</span>
            </div>
          )}
          {assessment && (
            <div className="flex items-center gap-2 p-3 bg-secondary/50 rounded-lg text-sm">
              <Ruler className="w-4 h-4 text-primary" />
              <span>Mediciones corporales registradas ({assessment.assessment_date})</span>
            </div>
          )}
          {test && (
            <div className="flex items-center gap-2 p-3 bg-secondary/50 rounded-lg text-sm">
              <Dumbbell className="w-4 h-4 text-primary" />
              <span>Tests de condición física registrados ({test.test_date})</span>
            </div>
          )}
        </div>
      )}

      {/* PDF Generator */}
      <div className="step-card space-y-4">
        <h2 className="font-semibold text-foreground">Generar ficha para el especialista</h2>
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1">
            <Label>Tipo de plan solicitado</Label>
            <Select value={planType} onValueChange={setPlanType}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>{PLAN_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Button
            onClick={generatePDF}
            disabled={!hasEnoughData}
            className="w-full sm:w-auto"
          >
            <FileDown className="w-4 h-4 mr-2" />
            Descargar PDF de mis datos
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          El PDF incluye: datos personales, historial de salud, mediciones y tests de condición física.
          Enviáselo al especialista para que arme tu plan personalizado.
        </p>
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
          <div className="p-4 bg-secondary/30 rounded-xl text-sm text-muted-foreground">
            {activePlan.ai_plan_content || 'Plan en preparación. El especialista está armando tu rutina personalizada.'}
          </div>
        </div>
      )}
    </div>
  );
}