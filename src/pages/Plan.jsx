import { useState } from 'react';
import { entities } from '@/api/entities';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { FileDown, Dumbbell, CheckCircle2, User, Heart, Ruler, Activity, Brain, Battery, Apple, Droplets, AlertTriangle } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { useReckonQuery } from '@/hooks/useReckonQuery';

const PLAN_TYPES = ['Entrenamiento', 'Rehabilitación', 'Mixto'];

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

  const yesNo = (v) => v === true ? 'Sí' : v === false ? 'No' : 'N/D';
  const fmt = (v, unit = '') => v !== undefined && v !== '' && v !== null ? `${v}${unit}` : 'N/D';
  const arr = (v) => Array.isArray(v) && v.length ? v.join(', ') : 'Ninguno/a';
  const age = profile?.birth_date
    ? Math.floor((new Date() - new Date(profile.birth_date)) / (1000 * 60 * 60 * 24 * 365.25))
    : 'N/D';

  const generatePDF = () => {
    if (!profile || !health) {
      toast({ title: 'Datos incompletos', description: 'Completá al menos el Perfil y el Historial de Salud.', variant: 'destructive' });
      return;
    }

    const doc = new jsPDF();
    let y = 15;  // ← Empezar más arriba
    
    const line = (text, size = 12, bold = false) => {
      doc.setFontSize(size);
      if (bold) doc.setFont('helvetica', 'bold');
      else doc.setFont('helvetica', 'normal');
      y += size * 0.35;  // ← Padding antes de escribir
      doc.text(text, 20, y);
      y += size * 0.45;  // ← Espacio después
      if (y > 275) { doc.addPage(); y = 15; }
    };
    
    const section = (title) => {
      y += 4;  // ← Más espacio antes de la sección
      doc.setFillColor(59, 130, 246);
      doc.rect(18, y - 3, 174, 7, 'F');  // ← Rectángulo más compacto
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(title, 20, y + 2);  // ← Texto centrado en el rectángulo
      doc.setTextColor(0, 0, 0);
      y += 6;  // ← Espacio después de la sección
    };

    // Header principal
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, 210, 22, 'F');  // ← Más alto para no cortar
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('CULTIVAFITNESS RECKON - FICHA COMPLETA DEL USUARIO', 20, 14);  // ← Posición fija
    doc.setTextColor(0, 0, 0);
    y = 26;  // ← Empezar contenido debajo del header

    section('1. DATOS PERSONALES Y FÍSICO');
    line(`Nombre: ${fmt(profile.full_name)} | Edad: ${age} años | Género: ${fmt(profile.gender)}`, 10);
    line(`Altura: ${fmt(profile.height_cm, ' cm')} | Peso: ${fmt(profile.weight_kg, ' kg')} | IMC: ${fmt(assessment?.imc)}`, 10);
    line(`Ocupación: ${fmt(profile.occupation)} | Tipo de trabajo: ${fmt(profile.work_type)}`, 10);
    line(`Objetivo: ${fmt(profile.goal)} | Nivel actividad: ${fmt(profile.activity_level)}`, 10);
    line(`Días disponibles: ${fmt(profile.available_days, '/semana')} | Duración: ${fmt(profile.session_duration_min, ' min')} | Horario preferido: ${fmt(profile.preferred_training_time)}`, 10);
    line(`Equipamiento: ${fmt(profile.equipment_access)} | Compañía: ${fmt(profile.training_companions)} | Nivel competitivo: ${fmt(profile.competitive_level)}`, 10);
    line(`Actividades preferidas: ${arr(profile.preferred_activities)}`, 10);
    line(`Ejercicios que AMA: ${fmt(profile.loved_exercises)}`, 10);
    line(`Ejercicios que ODIA: ${fmt(profile.hated_exercises)}`, 10);
    y += 2;

    line(`Tipo de cuerpo: ${fmt(profile.body_type)} | Postura: ${fmt(profile.posture)} | Flexibilidad: ${fmt(profile.flexibility_level, '/10')}`, 10);
    line(`% Grasa estimado: ${fmt(profile.body_fat_pct_estimate, '%')} | Masa magra calc: ${profile.weight_kg && profile.body_fat_pct_estimate ? (Number(profile.weight_kg) * (1 - Number(profile.body_fat_pct_estimate) / 100)).toFixed(1) + ' kg' : 'N/D'}`, 10);
    line(`Masa muscular estimada: ${fmt(profile.muscle_mass_kg_estimate, ' kg')} | Preferencia de entrenamiento: ${fmt(profile.training_location_pref)}`, 10);
    line(`Circunferencia cuello: ${fmt(profile.neck_circumference_cm, ' cm')} | Muñeca: ${fmt(profile.wrist_circumference_cm, ' cm')}`, 10);
    line(`Dolor crónico: ${fmt(profile.chronic_pain_areas)}`, 10);
    y += 2;

    line(`Sueño: ${fmt(profile.sleep_hours, ' h')} (calidad ${fmt(profile.sleep_quality, '/10')}) | Estrés: ${fmt(profile.stress_level, '/10')}`, 10);
    line(`Comidas/día: ${fmt(profile.meals_per_day)} | Alcohol: ${fmt(profile.alcohol_frequency)} | Tabaco: ${fmt(profile.smoking_status)}`, 10);
    line(`Cafeína: ${fmt(profile.caffeine_intake)} | Suplementos: ${fmt(profile.current_supplements)}`, 10);
    y += 2;

    line(`Deportes previos: ${fmt(profile.previous_sports)}`, 10);
    line(`Años entrenando: ${fmt(profile.years_training)} | Mejor marca: ${fmt(profile.personal_best_record)} | Coach previo: ${fmt(profile.previous_coach)}`, 10);
    line(`Lesiones pasadas: ${fmt(profile.past_injuries)}`, 10);
    line(`Cirugías ortopédicas: ${fmt(profile.orthopedic_surgeries)}`, 10);
    line(`Hospitalizaciones: ${fmt(profile.hospitalizations)}`, 10);
    line(`Alergias: ${fmt(profile.food_allergies)} | Intolerancias: ${fmt(profile.food_intolerances)}`, 10);
    y += 2;

    line(`Peso objetivo: ${fmt(profile.target_weight_kg, ' kg')} | % Grasa objetivo: ${fmt(profile.target_body_fat_pct, '%')} | Fecha objetivo: ${fmt(profile.target_date)}`, 10);

    section('2. SCREENING CARDIOVASCULAR Y DOLOR');
    const parq = health.parq_answers || {};
    const anyYes = Object.values(parq).some(Boolean);
    line(`PAR-Q positivo: ${anyYes ? 'SI - Requiere precaución médica' : 'No'}`, 10);
    line(`Notas PAR-Q: ${fmt(health.parq_notes)}`, 10);
    line(`Dolor en reposo: ${fmt(health.pain_at_rest, '/10')} | Dolor con movimiento: ${fmt(health.pain_with_movement)}`, 10);
    line(`Mareos con esfuerzo: ${yesNo(health.dizziness_exertion)} | Palpitaciones: ${yesNo(health.palpitations)} | Historia familiar cardíaca: ${yesNo(health.family_heart_history)}`, 10);
    line(`Colesterol: ${fmt(health.cholesterol_known, ' mg/dL')} | Triglicéridos: ${fmt(health.triglycerides_known, ' mg/dL')}`, 10);
    line(`Presión arterial: ${fmt(health.blood_pressure_known)} | Glucemia ayunas: ${fmt(health.fasting_glucose_known, ' mg/dL')}`, 10);
    line(`COVID / long COVID: ${fmt(health.covid_history)} ${health.long_covid ? '(Long COVID confirmado)' : ''}`, 10);
    y += 2;

    section('3. HISTORIAL CLÍNICO');
    line(`Condiciones médicas: ${arr(health.medical_conditions)}`, 10);
    line(`Lesiones previas: ${arr(health.injuries)}`, 10);
    line(`Cirugías: ${arr(health.surgeries)}`, 10);
    line(`Medicamentos: ${arr(health.medications)}`, 10);
    line(`Informe clínico: ${fmt(health.clinical_report)}`, 10);
    line(`Historial deportivo: ${fmt(health.sports_history)}`, 10);
    line(`Entrenamiento actual: ${fmt(health.current_training)}`, 10);

    section('4. BIOMARCADORES DE RECUPERACIÓN');
    line(`HRV matutino: ${fmt(health.hrv_morning, ' ms')} | SpO2: ${fmt(health.spo2, '%')} | Temp matutina: ${fmt(health.morning_temperature, ' °C')}`, 10);
    line(`FC en reposo: ${fmt(health.resting_heart_rate, ' lpm')}`, 10);

    section('5. MENTALIDAD Y ADHERENCIA');
    line(`Motivación: ${fmt(health.motivation_level, '/10')} | Autoconfianza: ${fmt(health.exercise_confidence, '/10')}`, 10);
    line(`Barreras percibidas: ${fmt(health.perceived_barriers)}`, 10);
    line(`Soporte social: ${fmt(health.social_support)}`, 10);
    line(`Historial de abandono: ${fmt(health.dropout_history, ' veces')}`, 10);

    if (assessment) {
      section('6. MEDICIONES CORPORALES Y COMPOSICIÓN');
      line(`Fecha: ${fmt(assessment.assessment_date)} | Peso: ${fmt(assessment.weight_kg, ' kg')} | Altura: ${fmt(assessment.height_cm, ' cm')}`, 10);
      line(`IMC: ${fmt(assessment.imc)} | Cintura: ${fmt(assessment.waist_cm, ' cm')} | Cadera: ${fmt(assessment.hip_cm, ' cm')} | ICC: ${fmt(assessment.waist_hip_ratio)}`, 10);
      line(`Cuello: ${fmt(assessment.neck_cm, ' cm')} | Brazo: ${fmt(assessment.arm_cm, ' cm')} | Muslo: ${fmt(assessment.thigh_cm, ' cm')} | Pantorrilla: ${fmt(assessment.calf_cm, ' cm')}`, 10);
      line(`Fémur: ${fmt(assessment.femur_cm, ' cm')} | Tibia: ${fmt(assessment.tibia_cm, ' cm')} | Húmero: ${fmt(assessment.humerus_cm, ' cm')}`, 10);
      line(`% Grasa (BIA): ${fmt(assessment.body_fat_pct, '%')} | Masa muscular: ${fmt(assessment.muscle_mass_kg, ' kg')} | Grasa visceral: ${fmt(assessment.visceral_fat)}`, 10);
      line(`Masa ósea: ${fmt(assessment.bone_mass_kg, ' kg')} | Edad metabólica: ${fmt(assessment.metabolic_age, ' años')}`, 10);
      line(`Somatotipo: Endo ${fmt(assessment.somatotype_endomorphy)} / Meso ${fmt(assessment.somatotype_mesomorphy)} / Ecto ${fmt(assessment.somatotype_ectomorphy)}`, 10);
      line(`Pliegues: Pecho ${fmt(assessment.skinfold_chest_mm, ' mm')} / Abd ${fmt(assessment.skinfold_abdominal_mm, ' mm')} / Muslo ${fmt(assessment.skinfold_thigh_mm, ' mm')}`, 10);
      line(`Peso matutino (tendencia): ${fmt(assessment.morning_weight_trend)}`, 10);
      y += 2;

      section('7. NUTRICIÓN E HIDRATACIÓN - DATOS BÁSICOS');
      line(`Agua: ${fmt(assessment.water_intake_liters, ' L/día')} | Proteína: ${fmt(assessment.protein_intake_g, ' g/día')} | Verduras: ${fmt(assessment.vegetables_per_day, '/día')}`, 10);
      line(`Comidas procesadas: ${fmt(assessment.processed_meals_per_week, '/semana')} | Ayuno intermitente: ${yesNo(assessment.intermittent_fasting)} ${assessment.fasting_schedule ? `(${assessment.fasting_schedule})` : ''}`, 10);

      section('7B. ESTRUCTURA ALIMENTARIA');
      line(`Frecuencia de comidas: ${fmt(assessment.meal_frequency)} | Tipo de alimentación: ${fmt(assessment.diet_type)}`, 10);
      line(`Alergias/intolerancias: ${fmt(assessment.food_allergies)}`, 10);
      line(`Suplementos: ${fmt(assessment.supplements)}`, 10);

      section('7C. CALIDAD Y COMPORTAMIENTO ALIMENTARIO');
      line(`Alcohol: ${fmt(assessment.alcohol_frequency)} | Azúcar/agregados: ${fmt(assessment.sugar_intake)} | Delivery/fuera: ${fmt(assessment.eating_out_frequency)}`, 10);
      line(`Frutas: ${fmt(assessment.fruits_per_day, '/día')} | Pescado: ${fmt(assessment.fish_frequency)} | Café/cafeína: ${fmt(assessment.caffeine_cups, ' tazas/día')}`, 10);
      line(`Picoteo entre comidas: ${yesNo(assessment.snacking_habit)}`, 10);

      section('7D. TIMING Y ORGANIZACIÓN');
      line(`Última comida: ${fmt(assessment.last_meal_time)} | Quién cocina: ${fmt(assessment.meal_planner)}`, 10);

      if (assessment.notes) {
        line(`Notas adicionales: ${fmt(assessment.notes)}`, 10);
      }
    }

    if (test) {
      section('8. MOVILIDAD ARTICULAR');
      line(`Apley scratch: ${fmt(test.apley_scratch)} | Thomas test: ${fmt(test.thomas_test)}`, 10);
      line(`Knee-to-wall: ${fmt(test.knee_to_wall_cm, ' cm')} | Rotación torácica: ${fmt(test.thoracic_rotation_deg, '°')}`, 10);
      line(`Extensión lumbar: ${fmt(test.lumbar_extension_notes)}`, 10);

      section('9. ESTABILIDAD Y CONTROL');
      line(`Plank: ${fmt(test.plank_sec, ' seg')} (${fmt(test.plank_score)}) | Side plank: I ${fmt(test.side_plank_left_sec, 's')} / D ${fmt(test.side_plank_right_sec, 's')}`, 10);
      line(`Bird dog: ${fmt(test.bird_dog_reps, ' reps')} | Dead bug: ${fmt(test.dead_bug_reps, ' reps')} | SL glute bridge: ${fmt(test.single_leg_glute_bridge_reps, ' reps')}`, 10);
      line(`Y-balance: ${fmt(test.y_balance_notes)}`, 10);

      section('10. FUERZA MÁXIMA ESTIMADA');
      line(`Push-ups: ${fmt(test.pushup_reps, ' reps')} (${fmt(test.pushup_score)}) | Squat BW: ${fmt(test.max_squat_reps, ' reps')} | Pull-ups: ${fmt(test.max_pullup_reps, ' reps')}`, 10);
      line(`Wall sit: ${fmt(test.wall_sit_sec, ' seg')} | Plank to push-up: ${fmt(test.plank_to_pushup_reps, ' reps')}`, 10);
      line(`Test silla: ${fmt(test.chair_test_reps, ' reps')} (${fmt(test.chair_test_score)}) | Tiempo: ${fmt(test.chair_test_time_sec, ' seg')} | Fecha: ${fmt(test.test_date)}`, 10);

      section('11. POTENCIA Y VELOCIDAD');
      line(`Vertical jump: ${fmt(test.vertical_jump_cm, ' cm')} | Broad jump: ${fmt(test.broad_jump_cm, ' cm')} | Medball throw: ${fmt(test.medball_throw_m, ' m')}`, 10);
      line(`Sprint 10m: ${fmt(test.sprint_10m_sec, ' seg')} | Agility 5-10-5: ${fmt(test.agility_5_10_5_sec, ' seg')}`, 10);

      section('12. CAPACIDAD AERÓBICA');
      line(`Cooper test: ${fmt(test.cooper_distance_m, ' m')} -> VO2max est: ${fmt(test.cooper_vo2max, ' ml/kg/min')}`, 10);
      line(`2-step HR recovery: ${fmt(test.two_step_hr_recovery, ' lpm')} | RPE marcha: ${fmt(test.rpe_3min_walk, '/10')}`, 10);
      line(`Talk test: ${fmt(test.talk_test_result)} | Step test FC: ${fmt(test.step_test_heart_rate, ' lpm')} (${fmt(test.step_test_score)})`, 10);
      line(`VO2max estimado (step): ${fmt(test.vo2max_estimate, ' ml/kg/min')}`, 10);

      section('13. TESTS ADICIONALES');
      line(`Sentadilla profunda: ${fmt(test.deep_squat_depth)} (${fmt(test.deep_squat_score)}) | Compensaciones: ${fmt(test.deep_squat_compensation)}`, 10);
      line(`Equilibrio unipodal: D ${fmt(test.balance_dominant_sec, 's')} / ND ${fmt(test.balance_nondominant_sec, 's')} (${fmt(test.balance_score)})`, 10);
      line(`SRT: ${fmt(test.srt_score, '/10')} | ${fmt(test.srt_interpretation)}`, 10);
      line(`Notas de los tests: ${fmt(test.notes)}`, 10);
    }

       // Footer limpio
       y += 8;
       doc.setDrawColor(59, 130, 246);
       doc.line(20, y, 190, y);
       y += 8;
       
       // Usar doc.text directo en vez de line() para evitar caracteres de control
       doc.setFontSize(9);
       doc.setFont('helvetica', 'normal');
       doc.text('═══════════════════════════════════════════════════', 20, y);
       y += 6;
       doc.text('Ficha generada automaticamente por CULTIVAFITNESS RECKON', 20, y);
       y += 6;
       doc.text(`Tipo de plan solicitado: ${planType} | Fecha: ${new Date().toLocaleDateString('es-AR')}`, 20, y);
       y += 6;
       doc.text('Enviar este PDF al especialista para la elaboracion del plan personalizado.', 20, y);
       y += 6;
       doc.text('═══════════════════════════════════════════════════', 20, y);

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
          El PDF incluye <strong>13+ secciones</strong>: perfil completo, screening cardiovascular, historial clínico, biomarcadores, mentalidad, mediciones corporales, nutrición completa, movilidad, estabilidad, fuerza, potencia, aeróbico y tests adicionales.
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