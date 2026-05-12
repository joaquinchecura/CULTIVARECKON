import { entities } from '@/api/entities';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Ruler, Dumbbell, Scale } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Badge = ({ children }) => (
  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
    {children}
  </span>
);

function formatDate(d) {
  if (!d) return '—';
  try { return format(new Date(d), "d 'de' MMMM yyyy", { locale: es }); }
  catch { return d; }
}

export default function History() {
  const { data: assessments = [] } = useQuery({ 
    queryKey: ['assessments'], 
    queryFn: () => entities.PhysicalAssessment.list('-assessment_date', 20) 
  });
  const { data: tests = [] } = useQuery({ 
    queryKey: ['tests'], 
    queryFn: () => entities.FitnessTest.list('-test_date', 20) 
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-primary uppercase tracking-widest mb-1">Historial</p>
        <h1 className="text-2xl font-bold text-foreground">Seguimiento y Evolución</h1>
        <p className="text-muted-foreground mt-1">
          Revisá tus mediciones y tests guardados. Tu especialista analiza estos datos para ajustar tu plan.
        </p>
      </div>

      <Tabs defaultValue="assessments">
        <TabsList className="grid w-full grid-cols-2 bg-secondary">
          <TabsTrigger value="assessments" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <Ruler className="w-3.5 h-3.5" />Mediciones
          </TabsTrigger>
          <TabsTrigger value="tests" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <Dumbbell className="w-3.5 h-3.5" />Tests
          </TabsTrigger>
        </TabsList>

        {/* Mediciones */}
        <TabsContent value="assessments" className="space-y-3 mt-4">
          {assessments.length === 0 ? (
            <EmptyState icon={Scale} text="No hay mediciones registradas aún. Completá tu evaluación de Cuerpo & Dieta." />
          ) : assessments.map(a => (
            <div key={a.id} className="step-card space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="font-semibold text-foreground">{formatDate(a.assessment_date)}</span>
                <div className="flex gap-2 flex-wrap">
                  {a.imc && <Badge>{`IMC: ${a.imc}`}</Badge>}
                  {a.body_fat_pct && <Badge>{`Grasa: ${a.body_fat_pct}%`}</Badge>}
                  {a.waist_hip_ratio && <Badge>{`ICC: ${a.waist_hip_ratio}`}</Badge>}
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Stat label="Peso" value={a.weight_kg} unit="kg" />
                <Stat label="Cintura" value={a.waist_cm} unit="cm" />
                <Stat label="Cadera" value={a.hip_cm} unit="cm" />
                <Stat label="Masa Muscular" value={a.muscle_mass_kg} unit="kg" />
              </div>
              {a.notes && <p className="text-xs text-muted-foreground border-t border-border pt-2">{a.notes}</p>}
              {/* Fotos */}
              {(a.photo_front_url || a.photo_back_url || a.photo_side_url || a.photo_face_url) && (
                <div className="flex gap-2 flex-wrap border-t border-border pt-2">
                  {[['Frente', a.photo_front_url], ['Espalda', a.photo_back_url], ['Perfil', a.photo_side_url], ['Cara', a.photo_face_url]]
                    .filter(([, u]) => u).map(([label, url]) => (
                    <a key={label} href={url} target="_blank" rel="noopener noreferrer" className="group">
                      <img src={url} alt={label} className="w-16 h-20 object-cover rounded-md border border-border group-hover:border-primary transition-colors" />
                      <span className="block text-xs text-center text-muted-foreground mt-0.5">{label}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </TabsContent>

        {/* Tests */}
        <TabsContent value="tests" className="space-y-3 mt-4">
          {tests.length === 0 ? (
            <EmptyState icon={Dumbbell} text="No hay tests registrados aún. Completá tu evaluación de Rendimiento." />
          ) : tests.map(t => (
            <div key={t.id} className="step-card space-y-3">
              <span className="font-semibold text-foreground">{formatDate(t.test_date)}</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <Stat label="Fuerza Inferior (silla)" value={t.chair_test_reps} unit="reps" score={t.chair_test_score} />
                <Stat label="Fuerza Superior (flex.)" value={t.pushup_reps} unit="reps" score={t.pushup_score} />
                <Stat label="Sentadilla Profunda" value={t.deep_squat_depth} score={t.deep_squat_score} />
                <Stat label="Equilibrio (dominante)" value={t.balance_dominant_sec} unit="seg" score={t.balance_score} />
                <Stat label="Test SRT" value={t.srt_score} unit="/10" />
                <Stat label="FC Step Test" value={t.step_test_heart_rate} unit="lpm" score={t.step_test_score} />
              </div>
              {t.notes && <p className="text-xs text-muted-foreground border-t border-border pt-2">{t.notes}</p>}
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Stat({ label, value, unit, score }) {
  const scoreColor = {
    'Excelente': 'text-green-600', 'Bueno': 'text-primary', 'Normal': 'text-foreground',
    'Bajo': 'text-amber-600', 'Muy bajo': 'text-destructive',
  };
  return (
    <div className="bg-secondary/50 rounded-lg p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-semibold text-foreground mt-0.5">
        {value !== undefined && value !== null && value !== '' ? `${value}${unit ? ` ${unit}` : ''}` : '—'}
      </p>
      {score && <p className={`text-xs mt-0.5 font-medium ${scoreColor[score] || 'text-muted-foreground'}`}>{score}</p>}
    </div>
  );
}

function EmptyState({ icon: Icon, text }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-3">
        <Icon className="w-6 h-6 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}