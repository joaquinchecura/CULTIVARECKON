import { useState } from 'react';
import { entities } from '@/api/entities';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { FileDown, Dumbbell, CheckCircle2, User, Heart, Ruler, Activity, Brain, Battery, Apple, Droplets, AlertTriangle } from 'lucide-react';
import { useReckonQuery } from '@/hooks/useReckonQuery';
import autoTable from 'jspdf-autotable';
import { sectionCompleteness, fieldsScore } from '@/lib/completeness';

const PLAN_TYPES = ['Entrenamiento', 'Rehabilitación', 'Mixto'];

// ---------- Helpers de formato (únicos, nivel de módulo) ----------
// Importante: 0 es un valor válido (ej. dolor 0/10), no se pierde.
// Devuelven null (no 'N/D') a propósito: así section()/rows() puede
// descartar filas vacías en vez de imprimir "N/D" por todos lados.
const fmt = (v, unit = '') => (v !== undefined && v !== '' && v !== null) ? `${v}${unit}` : null;
const yesNo = (v) => v === true ? 'Sí' : v === false ? 'No' : null;
const arr = (v) => Array.isArray(v) && v.length ? v.join(', ') : null;

// Arma filas [label, value] y descarta automáticamente las que están vacías.
function rows(pairs) {
  return pairs
    .map(([label, value]) => [label, value])
    .filter(([, value]) => value !== null && value !== undefined && value !== '');
}

// ---------- PAR-Q estructurado (no solo true/false global) ----------
const PARQ_LABELS = {
  q1_heart_condition: 'Enfermedad cardíaca diagnosticada',
  q2_chest_pain_activity: 'Dolor en el pecho con actividad física',
  q3_chest_pain_rest: 'Dolor en el pecho en reposo (último mes)',
  q4_dizziness: 'Pérdida de equilibrio / mareos / desmayos',
  q5_bone_joint: 'Problema óseo o articular que empeora con ejercicio',
  q6_blood_pressure_medication: 'Medicado para presión arterial o corazón',
  q7_other_reason: 'Otro motivo médico para no hacer actividad física',
};

function parqSummary(health) {
  const parq = health?.parq_answers || {};
  const positives = Object.entries(parq)
    .filter(([, v]) => v === true)
    .map(([k]) => PARQ_LABELS[k] || k);
  return { positives, isPositive: positives.length > 0 };
}

// ---------- Completitud (nivel de módulo, no depende del componente) ----------
function computeOverallCompleteness({ profile, health, assessment, test }) {
  const scores = [
    fieldsScore([profile?.full_name, profile?.birth_date, profile?.gender, profile?.goal, profile?.available_days], 'essential'),
    fieldsScore(Object.values(health?.parq_answers || {}), 'essential'),
    fieldsScore([assessment?.weight_kg, assessment?.height_cm, assessment?.waist_cm, assessment?.hip_cm], 'accessible'),
    fieldsScore([test?.pushup_reps, test?.plank_sec, test?.chair_test_reps, test?.deep_squat_depth], 'accessible'),
    fieldsScore([assessment?.body_fat_pct, assessment?.muscle_mass_kg, assessment?.somatotype_endomorphy], 'pro'),
    fieldsScore([test?.cooper_distance_m, test?.vertical_jump_cm, test?.y_balance_notes], 'pro'),
  ];
  return sectionCompleteness(scores);
}

export default function Plan() {
  const { toast } = useToast();
  const [planType, setPlanType] = useState('Entrenamiento');

  const { data: profiles } = useReckonQuery('profiles', () => entities.UserProfile.list());
  const { data: healthRecords } = useReckonQuery('health', () => entities.HealthHistory.list());
  const { data: assessments } = useReckonQuery('assessments', () => entities.PhysicalAssessment.list('-assessment_date', 1));
  const { data: tests } = useReckonQuery('tests', () => entities.FitnessTest.list('-test_date', 1));
  const { data: plans } = useReckonQuery('plans', () => entities.FitnessPlan.list('-generated_date', 5));

  const activePlan = plans?.find(p => p.status === 'Activo');

  const profile = profiles?.[0];
  const health = healthRecords?.[0];
  const assessment = assessments?.[0];
  const test = tests?.[0];

  const hasEnoughData = profile && health;

  const age = profile?.birth_date
    ? Math.floor((new Date() - new Date(profile.birth_date)) / (1000 * 60 * 60 * 24 * 365.25))
    : null;

  // ---------- Generador principal ----------
  const generatePDF = async () => {
    if (!profile || !health) {
      toast({ title: 'Datos incompletos', description: 'Completá al menos el Perfil y el Historial de Salud.', variant: 'destructive' });
      return;
    }

    // Carga perezosa: jsPDF solo se descarga cuando hace falta
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    let y = 20;

    const { positives: parqPositives, isPositive: parqIsPositive } = parqSummary(health);
    const completeness = computeOverallCompleteness({ profile, health, assessment, test });

    // ---------- Header ----------
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, pageWidth, 24, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('CULTIVAFITNESS · RECKON', margin, 15);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Ficha de evaluación para generación de plan con IA', margin, 20);
    doc.setTextColor(0, 0, 0);
    y = 32;

    // ---------- Portada / resumen ejecutivo ----------
    autoTable(doc, {
      startY: y,
      theme: 'plain',
      margin: { left: margin, right: margin },
      styles: { fontSize: 10, cellPadding: 2 },
      body: [
        ['Tipo de plan solicitado', planType],
        ['Cliente', `${fmt(profile.full_name) || 'N/D'} — ${age ?? 'N/D'} años — ${fmt(profile.gender) || 'N/D'}`],
        ['Fecha de generación', new Date().toLocaleDateString('es-AR')],
        ['Nivel de detalle de la ficha', `${completeness.level.label} (${completeness.pct}%)`],
        ['PAR-Q', parqIsPositive ? 'POSITIVO — ver alertas abajo' : 'Negativo — sin alertas cardiovasculares reportadas'],
      ],
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 55 } },
    });
    y = doc.lastAutoTable.finalY + 4;

    if (parqIsPositive) {
      doc.setFillColor(254, 242, 242);
      doc.setDrawColor(239, 68, 68);
      const boxHeight = 8 + parqPositives.length * 5;
      doc.roundedRect(margin, y, pageWidth - margin * 2, boxHeight, 2, 2, 'FD');
      doc.setTextColor(185, 28, 28);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('⚠ Atención médica previa recomendada — PAR-Q positivo:', margin + 3, y + 6);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      parqPositives.forEach((p, i) => doc.text(`• ${p}`, margin + 5, y + 11 + i * 5));
      doc.setTextColor(0, 0, 0);
      y += boxHeight + 6;
    }

    if (health.pain_at_rest || health.chronic_pain_areas || profile.chronic_pain_areas) {
      doc.setFontSize(9);
      doc.setTextColor(120, 53, 15);
      doc.text(
        `⚠ Dolor reportado — considerar al prescribir ejercicios. (Reposo: ${fmt(health.pain_at_rest, '/10') || 'N/D'})`,
        margin, y
      );
      doc.setTextColor(0, 0, 0);
      y += 6;
    }

    // ---------- Secciones dinámicas ----------
    const section = (title, pairs) => {
      const data = rows(pairs);
      if (!data.length) return; // sección vacía → no se imprime, sin culpa
      if (y > 260) { doc.addPage(); y = 20; }
      doc.setFillColor(59, 130, 246);
      doc.rect(margin, y, pageWidth - margin * 2, 7, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(title, margin + 2, y + 5);
      doc.setTextColor(0, 0, 0);
      y += 9;
      autoTable(doc, {
        startY: y,
        theme: 'striped',
        margin: { left: margin, right: margin },
        styles: { fontSize: 9, cellPadding: 1.8, overflow: 'linebreak' },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 55 }, 1: { cellWidth: 'auto' } },
        body: data,
      });
      y = doc.lastAutoTable.finalY + 5;
    };

    section('Datos personales y objetivos', [
      ['Ocupación / tipo de trabajo', [fmt(profile.occupation), fmt(profile.work_type)].filter(Boolean).join(' — ') || null],
      ['Objetivo principal', fmt(profile.goal)],
      ['Nivel de actividad actual', fmt(profile.activity_level)],
      ['Disponibilidad', [fmt(profile.available_days, ' días/sem'), fmt(profile.session_duration_min, ' min/sesión'), fmt(profile.preferred_training_time)].filter(Boolean).join(' — ') || null],
      ['Equipamiento disponible', fmt(profile.equipment_access) || fmt(profile.training_location_pref)],
      ['Compañía / nivel competitivo', [fmt(profile.training_companions), fmt(profile.competitive_level)].filter(Boolean).join(' — ') || null],
      ['Actividades preferidas', arr(profile.preferred_activities)],
      ['Ejercicios que ama', fmt(profile.loved_exercises)],
      ['Ejercicios que evitar', fmt(profile.hated_exercises)],
      ['Peso / % grasa / fecha objetivo', [fmt(profile.target_weight_kg, ' kg'), fmt(profile.target_body_fat_pct, '%'), fmt(profile.target_date)].filter(Boolean).join(' — ') || null],
    ]);

    section('Antropometría y composición', [
      ['Altura / peso / IMC', [fmt(profile.height_cm, ' cm'), fmt(profile.weight_kg, ' kg'), fmt(assessment?.imc)].filter(Boolean).join(' — ') || null],
      ['Cintura / cadera / ICC', [fmt(assessment?.waist_cm, ' cm'), fmt(assessment?.hip_cm, ' cm'), fmt(assessment?.waist_hip_ratio)].filter(Boolean).join(' — ') || null],
      ['Cuello / brazo / muslo / pantorrilla', [fmt(assessment?.neck_cm, 'cm'), fmt(assessment?.arm_cm, 'cm'), fmt(assessment?.thigh_cm, 'cm'), fmt(assessment?.calf_cm, 'cm')].filter(Boolean).join(' — ') || null],
      ['% Grasa corporal', fmt(assessment?.body_fat_pct, '%')],
      ['Masa muscular / ósea', [fmt(assessment?.muscle_mass_kg, ' kg'), fmt(assessment?.bone_mass_kg, ' kg')].filter(Boolean).join(' — ') || null],
      ['Grasa visceral / edad metabólica', [fmt(assessment?.visceral_fat), fmt(assessment?.metabolic_age, ' años')].filter(Boolean).join(' — ') || null],
      ['Somatotipo (Endo/Meso/Ecto)', [assessment?.somatotype_endomorphy, assessment?.somatotype_mesomorphy, assessment?.somatotype_ectomorphy].every(v => v !== undefined && v !== '') ? `${assessment.somatotype_endomorphy} / ${assessment.somatotype_mesomorphy} / ${assessment.somatotype_ectomorphy}` : null],
      ['Tipo de cuerpo / postura', [fmt(profile.body_type), fmt(profile.posture)].filter(Boolean).join(' — ') || null],
      ['Flexibilidad general', fmt(profile.flexibility_level, '/10')],
      ['Dolor crónico (zonas)', fmt(profile.chronic_pain_areas) || fmt(health.chronic_pain_areas)],
    ]);

    section('Screening cardiovascular', [
      ['Mareos con esfuerzo', yesNo(health.dizziness_exertion)],
      ['Palpitaciones', yesNo(health.palpitations)],
      ['Historia familiar cardíaca', yesNo(health.family_heart_history)],
      ['Presión arterial', fmt(health.blood_pressure_known)],
      ['Colesterol / triglicéridos', [fmt(health.cholesterol_known, ' mg/dL'), fmt(health.triglycerides_known, ' mg/dL')].filter(Boolean).join(' — ') || null],
      ['Glucemia en ayunas', fmt(health.fasting_glucose_known, ' mg/dL')],
      ['COVID / long COVID', [fmt(health.covid_history), health.long_covid ? 'Long COVID confirmado' : null].filter(Boolean).join(' — ') || null],
      ['FC en reposo', fmt(health.resting_heart_rate, ' lpm')],
    ]);

    section('Historial clínico y deportivo', [
      ['Condiciones médicas', arr(health.medical_conditions)],
      ['Lesiones / cirugías', [arr(health.injuries), arr(health.surgeries)].filter(Boolean).join(' · ') || null],
      ['Medicamentos', arr(health.medications)],
      ['Lesiones pasadas (detalle)', fmt(profile.past_injuries)],
      ['Cirugías ortopédicas', fmt(profile.orthopedic_surgeries)],
      ['Hospitalizaciones', fmt(health.hospitalizations) || fmt(profile.hospitalizations)],
      ['Alergias / intolerancias alimentarias', [fmt(profile.food_allergies) || fmt(assessment?.food_allergies), fmt(profile.food_intolerances)].filter(Boolean).join(' — ') || null],
      ['Deportes previos / años entrenando', [fmt(profile.previous_sports), fmt(profile.years_training, ' años')].filter(Boolean).join(' — ') || null],
      ['Entrenamiento actual', fmt(health.current_training)],
      ['Informe clínico / estudios', fmt(health.clinical_report)],
    ]);

    section('Nutrición', [
      ['Tipo de alimentación', fmt(assessment?.diet_type)],
      ['Comidas por día', fmt(profile.meals_per_day) || fmt(assessment?.meal_frequency)],
      ['Agua / proteína estimada', [fmt(assessment?.water_intake_liters, ' L/día'), fmt(assessment?.protein_intake_g, ' g/día')].filter(Boolean).join(' — ') || null],
      ['Verduras / frutas por día', [fmt(assessment?.vegetables_per_day), fmt(assessment?.fruits_per_day)].filter(Boolean).join(' — ') || null],
      ['Alcohol / azúcar / comidas afuera', [fmt(assessment?.alcohol_frequency), fmt(assessment?.sugar_intake), fmt(assessment?.eating_out_frequency)].filter(Boolean).join(' — ') || null],
      ['Ayuno intermitente', assessment?.intermittent_fasting ? (fmt(assessment.fasting_schedule) || 'Sí') : null],
      ['Suplementos actuales', fmt(profile.current_supplements) || fmt(assessment?.supplements)],
    ]);

    section('Estilo de vida', [
      ['Sueño', [fmt(profile.sleep_hours, ' h'), fmt(profile.sleep_quality, '/10 calidad')].filter(Boolean).join(' — ') || null],
      ['Nivel de estrés', fmt(profile.stress_level, '/10')],
      ['Tabaco / cafeína', [fmt(profile.smoking_status), fmt(profile.caffeine_intake)].filter(Boolean).join(' — ') || null],
    ]);

    section('Mentalidad y adherencia', [
      ['Motivación / autoconfianza', [fmt(health.motivation_level, '/10'), fmt(health.exercise_confidence, '/10')].filter(Boolean).join(' — ') || null],
      ['Barreras percibidas', fmt(health.perceived_barriers)],
      ['Soporte social', fmt(health.social_support)],
      ['Historial de abandono', fmt(health.dropout_history, ' veces')],
    ]);

    if (test) {
      section('Movilidad y estabilidad', [
        ['Apley scratch (hombro)', fmt(test.apley_scratch)],
        ['Thomas test (cadera)', fmt(test.thomas_test)],
        ['Knee-to-wall (tobillo)', fmt(test.knee_to_wall_cm, ' cm')],
        ['Rotación torácica', fmt(test.thoracic_rotation_deg, '°')],
        ['Sentadilla profunda', [fmt(test.deep_squat_depth), fmt(test.deep_squat_score)].filter(Boolean).join(' — ') || null],
        ['Compensaciones observadas', fmt(test.deep_squat_compensation)],
        ['Plank / side plank I-D', [fmt(test.plank_sec, 's'), fmt(test.side_plank_left_sec, 's'), fmt(test.side_plank_right_sec, 's')].filter(Boolean).join(' — ') || null],
        ['Bird dog / dead bug', [fmt(test.bird_dog_reps, ' reps'), fmt(test.dead_bug_reps, ' reps')].filter(Boolean).join(' — ') || null],
        ['Equilibrio unipodal (dom/no-dom)', [fmt(test.balance_dominant_sec, 's'), fmt(test.balance_nondominant_sec, 's')].filter(Boolean).join(' — ') || null],
        ['Y-balance', fmt(test.y_balance_notes)],
        ['Test sentarse-levantarse (SRT)', fmt(test.srt_score, '/10')],
      ]);

      section('Fuerza, potencia y capacidad aeróbica', [
        ['Push-ups (max)', [fmt(test.pushup_reps, ' reps'), fmt(test.pushup_score)].filter(Boolean).join(' — ') || null],
        ['Sentadilla / dominadas (max reps)', [fmt(test.max_squat_reps), fmt(test.max_pullup_reps)].filter(Boolean).join(' / ') || null],
        ['Test de silla', [fmt(test.chair_test_reps, ' reps'), fmt(test.chair_test_score)].filter(Boolean).join(' — ') || null],
        ['Salto vertical / horizontal', [fmt(test.vertical_jump_cm, ' cm'), fmt(test.broad_jump_cm, ' cm')].filter(Boolean).join(' — ') || null],
        ['Sprint 10m / agilidad 5-10-5', [fmt(test.sprint_10m_sec, ' s'), fmt(test.agility_5_10_5_sec, ' s')].filter(Boolean).join(' — ') || null],
        ['Cooper (distancia → VO2max est.)', test.cooper_distance_m ? `${test.cooper_distance_m} m → ${fmt(test.cooper_vo2max, ' ml/kg/min')}` : null],
        ['Step test (FC → nivel)', [fmt(test.step_test_heart_rate, ' lpm'), fmt(test.step_test_score)].filter(Boolean).join(' — ') || null],
        ['Talk test', fmt(test.talk_test_result)],
      ]);

      if (test.notes) section('Notas del profesional (tests)', [['Notas', test.notes]]);
    }

    if (planType === 'Rehabilitación' || planType === 'Mixto') {
      section('Información para plan de rehabilitación', [
        ['Diagnóstico / lesión actual', fmt(health.clinical_report)],
        ['Zona de dolor', fmt(profile.chronic_pain_areas) || fmt(health.chronic_pain_areas)],
        ['Dolor en reposo / movimiento', [fmt(health.pain_at_rest, '/10'), fmt(health.pain_with_movement)].filter(Boolean).join(' — ') || null],
      ]);
    }

    // ---------- Footer: nota de completitud, no de "faltante" ----------
    y = doc.lastAutoTable ? doc.lastAutoTable.finalY + 8 : y + 8;
    if (y > 265) { doc.addPage(); y = 20; }
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(`Ficha generada por CULTIVAFITNESS RECKON · Nivel de detalle: ${completeness.level.label} (${completeness.pct}%)`, margin, y);
    y += 4;
    doc.text('Las secciones sin datos no se incluyeron. Se puede completar más adelante y regenerar la ficha.', margin, y);
    doc.setTextColor(0, 0, 0);

    // ---------- Guardar PDF + exportar JSON estructurado (para pasarlo a la IA) ----------
    const fileBase = `RECKON_${(profile.full_name || 'Usuario').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`;
    doc.save(`${fileBase}.pdf`);

    const structuredData = {
      plan_type: planType,
      generated_at: new Date().toISOString(),
      completeness,
      parq: { positive: parqIsPositive, positives: parqPositives, notes: health.parq_notes || null },
      profile, health, assessment: assessment || null, test: test || null,
    };
    const blob = new Blob([JSON.stringify(structuredData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${fileBase}.json`; a.click();
    URL.revokeObjectURL(url);

    toast({ title: 'Ficha descargada', description: 'Se descargó el PDF y un archivo .json con los mismos datos estructurados para la IA.' });
    localStorage.setItem('lastEvaluationDate', new Date().toISOString());
  };

  const DataCard = ({ icon: Icon, label, value, color = 'text-primary' }) => (
    <div className="flex items-center gap-2 p-3 bg-secondary/50 rounded-lg text-sm">
      <Icon className={`w-4 h-4 ${color} flex-shrink-0`} />
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium text-foreground truncate">{value || 'N/D'}</span>
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium text-primary uppercase tracking-widest mb-1">Paso 03</p>
        <h1 className="text-2xl font-bold text-foreground">Mi Plan de Actividad Física</h1>
        <p className="text-muted-foreground mt-1">Descargá tu ficha completa y enviásela al especialista para que arme tu plan.</p>
      </div>

      {!hasEnoughData && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20">
          <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-destructive text-sm">Faltan datos obligatorios</p>
            <p className="text-sm text-destructive/80 mt-1">
              Para generar la ficha necesitás completar <strong>Perfil</strong> y <strong>Historial de Salud</strong>.
            </p>
          </div>
        </div>
      )}

      <div className="step-card space-y-4">
        <h2 className="font-semibold text-foreground">Estado de tus evaluaciones</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className={`flex flex-col items-center gap-2 p-4 rounded-xl border ${profile ? 'bg-green-50 border-green-200' : 'bg-secondary/50 border-border'}`}>
            <User className={`w-6 h-6 ${profile ? 'text-green-600' : 'text-muted-foreground'}`} />
            <span className={`text-xs font-medium ${profile ? 'text-green-700' : 'text-muted-foreground'}`}>Perfil</span>
            {profile && <CheckCircle2 className="w-4 h-4 text-green-600" />}
          </div>
          <div className={`flex flex-col items-center gap-2 p-4 rounded-xl border ${health ? 'bg-green-50 border-green-200' : 'bg-secondary/50 border-border'}`}>
            <Heart className={`w-6 h-6 ${health ? 'text-green-600' : 'text-muted-foreground'}`} />
            <span className={`text-xs font-medium ${health ? 'text-green-700' : 'text-muted-foreground'}`}>Salud</span>
            {health && <CheckCircle2 className="w-4 h-4 text-green-600" />}
          </div>
          <div className={`flex flex-col items-center gap-2 p-4 rounded-xl border ${assessment ? 'bg-green-50 border-green-200' : 'bg-secondary/50 border-border'}`}>
            <Ruler className={`w-6 h-6 ${assessment ? 'text-green-600' : 'text-muted-foreground'}`} />
            <span className={`text-xs font-medium ${assessment ? 'text-green-700' : 'text-muted-foreground'}`}>Cuerpo</span>
            {assessment && <CheckCircle2 className="w-4 h-4 text-green-600" />}
          </div>
          <div className={`flex flex-col items-center gap-2 p-4 rounded-xl border ${test ? 'bg-green-50 border-green-200' : 'bg-secondary/50 border-border'}`}>
            <Dumbbell className={`w-6 h-6 ${test ? 'text-green-600' : 'text-muted-foreground'}`} />
            <span className={`text-xs font-medium ${test ? 'text-green-700' : 'text-muted-foreground'}`}>Tests</span>
            {test && <CheckCircle2 className="w-4 h-4 text-green-600" />}
          </div>
        </div>
      </div>

      {profile && (
        <div className="step-card space-y-4">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            Resumen de tus datos
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <DataCard icon={User} label="Nombre" value={profile.full_name} />
            <DataCard icon={Heart} label="Objetivo" value={profile.goal} />
            <DataCard icon={Activity} label="Nivel actividad" value={profile.activity_level} />
            <DataCard icon={Dumbbell} label="Días/semana" value={profile.available_days} />
            <DataCard icon={Ruler} label="Peso" value={profile.weight_kg ? `${profile.weight_kg} kg` : null} />
            <DataCard icon={Ruler} label="Altura" value={profile.height_cm ? `${profile.height_cm} cm` : null} />
            {health && (
              <>
                <DataCard icon={Brain} label="Motivación" value={health.motivation_level ? `${health.motivation_level}/10` : null} color="text-purple-500" />
                <DataCard icon={Battery} label="FC reposo" value={health.resting_heart_rate ? `${health.resting_heart_rate} lpm` : null} color="text-orange-500" />
              </>
            )}
            {assessment && (
              <>
                <DataCard icon={Apple} label="Proteína" value={assessment.protein_intake_g ? `${assessment.protein_intake_g} g/día` : null} color="text-green-500" />
                <DataCard icon={Droplets} label="Agua" value={assessment.water_intake_liters ? `${assessment.water_intake_liters} L/día` : null} color="text-blue-500" />
              </>
            )}
          </div>
        </div>
      )}

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
          <Button onClick={generatePDF} disabled={!hasEnoughData} className="w-full sm:w-auto">
            <FileDown className="w-4 h-4 mr-2" />
            Descargar PDF completo
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          El PDF incluye todas las secciones con datos cargados: perfil, screening cardiovascular, historial clínico, mentalidad, mediciones corporales, nutrición y tests de rendimiento.
        </p>
      </div>

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