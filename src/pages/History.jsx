import { entities } from '@/api/entities';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { BarChart3, Ruler, Dumbbell, FileText, Scale, Trash2, Download } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ReactMarkdown from 'react-markdown';

const Badge = ({ children, color = 'secondary' }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
    color === 'primary' ? 'bg-primary/10 text-primary' :
    color === 'green' ? 'bg-green-50 text-green-700 border border-green-200' :
    'bg-secondary text-secondary-foreground'
  }`}>{children}</span>
);

function formatDate(d) {
  if (!d) return '—';
  try { return format(new Date(d), "d 'de' MMMM yyyy", { locale: es }); }
  catch { return d; }
}

export default function History() {
  const queryClient = useQueryClient();
  const { data: assessments = [] } = useQuery({ queryKey: ['assessments'], queryFn: () => entities.PhysicalAssessment.list('-assessment_date', 20) });
  const { data: tests = [] } = useQuery({ queryKey: ['tests'], queryFn: () => entities.FitnessTest.list('-test_date', 20) });
  const { data: plans = [] } = useQuery({ queryKey: ['plans'], queryFn: () => entities.FitnessPlan.list('-generated_date', 20) });

  const deletePlanMutation = useMutation({
    mutationFn: (id) => entities.FitnessPlan.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['plans'] }),
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-primary uppercase tracking-widest mb-1">Historial</p>
        <h1 className="text-2xl font-bold text-foreground">Seguimiento y Evolución</h1>
        <p className="text-muted-foreground mt-1">Revisá tus mediciones, tests y planes anteriores.</p>
      </div>

      <Tabs defaultValue="assessments">
        <TabsList className="grid w-full grid-cols-3 bg-secondary">
          <TabsTrigger value="assessments" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <Ruler className="w-3.5 h-3.5" />Mediciones
          </TabsTrigger>
          <TabsTrigger value="tests" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <Dumbbell className="w-3.5 h-3.5" />Tests
          </TabsTrigger>
          <TabsTrigger value="plans" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <FileText className="w-3.5 h-3.5" />Planes
          </TabsTrigger>
        </TabsList>

        {/* Assessments */}
        <TabsContent value="assessments" className="space-y-3 mt-4">
          {assessments.length === 0 ? (
            <EmptyState icon={Scale} text="No hay mediciones registradas aún." />
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
              {/* Photos */}
              {(a.photo_front_url || a.photo_back_url || a.photo_side_url || a.photo_face_url) && (
                <div className="flex gap-2 flex-wrap border-t border-border pt-2">
                  {[['Frente', a.photo_front_url], ['Espalda', a.photo_back_url], ['Perfil', a.photo_side_url], ['Cara', a.photo_face_url]].filter(([, u]) => u).map(([label, url]) => (
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
            <EmptyState icon={Dumbbell} text="No hay tests registrados aún." />
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

        {/* Plans */}
        <TabsContent value="plans" className="space-y-3 mt-4">
          {plans.length === 0 ? (
            <EmptyState icon={FileText} text="No hay planes generados aún." />
          ) : plans.map(p => (
            <PlanItem key={p.id} plan={p} onDelete={() => {
              if (confirm('¿Eliminar este plan? Esta acción no se puede deshacer.')) {
                deletePlanMutation.mutate(p.id);
              }
            }} />
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

function PlanItem({ plan: p, onDelete }) {
  const [open, setOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const { data: content } = useQuery({
    queryKey: ['plan-content', p.id],
    queryFn: async () => {
      const res = await fetch(p.ai_plan_content);
      return res.text();
    },
    enabled: open && !!p.ai_plan_content,
  });

  const downloadPdf = async () => {
    setDownloading(true);
    // Fetch content if not already loaded
    let planText = content;
    if (!planText && p.ai_plan_content) {
      const res = await fetch(p.ai_plan_content);
      planText = await res.text();
    }
    if (!planText) { setDownloading(false); return; }

    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const maxWidth = pageWidth - margin * 2;

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Plan de Actividad Física Personalizado', margin, 20);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Tipo: ${p.plan_type} | Fecha: ${p.generated_date} | Estado: ${p.status}`, margin, 28);

    doc.setLineWidth(0.3);
    doc.line(margin, 31, pageWidth - margin, 31);

    const lines = planText.replace(/#{1,6}\s/g, '').split('\n');
    let y = 38;
    doc.setFontSize(9);

    for (const line of lines) {
      const wrapped = doc.splitTextToSize(line || ' ', maxWidth);
      for (const wl of wrapped) {
        if (y > 280) { doc.addPage(); y = 15; }
        doc.text(wl, margin, y);
        y += 5;
      }
    }

    doc.save(`plan-${p.generated_date}.pdf`);
    setDownloading(false);
  };

  return (
    <div className="step-card">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <button
          className="flex items-center gap-3 flex-wrap flex-1 text-left"
          onClick={() => setOpen(o => !o)}
        >
          <span className="font-semibold text-foreground">{formatDate(p.generated_date)}</span>
          <Badge color={p.status === 'Activo' ? 'primary' : 'secondary'}>{p.status}</Badge>
          <Badge>{p.plan_type}</Badge>
          <span className="text-xs text-muted-foreground">{open ? 'Cerrar ▴' : 'Ver plan ▾'}</span>
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={downloadPdf}
            disabled={downloading}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            {downloading ? 'Generando...' : 'PDF'}
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      {open && (
        <div className="mt-4 pt-4 border-t border-border">
          {!content ? (
            <div className="flex items-center justify-center py-6">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="text-sm text-foreground space-y-2 max-h-[500px] overflow-y-auto pr-1">
              <ReactMarkdown
                components={{
                  h1: ({children}) => <h1 className="text-lg font-bold text-foreground mt-3 mb-1">{children}</h1>,
                  h2: ({children}) => <h2 className="text-base font-semibold text-foreground mt-3 mb-1">{children}</h2>,
                  h3: ({children}) => <h3 className="text-sm font-semibold text-foreground mt-2 mb-1">{children}</h3>,
                  p: ({children}) => <p className="text-sm text-foreground mb-2">{children}</p>,
                  ul: ({children}) => <ul className="list-disc list-inside space-y-0.5 mb-2">{children}</ul>,
                  li: ({children}) => <li className="text-sm text-foreground">{children}</li>,
                  strong: ({children}) => <strong className="font-semibold">{children}</strong>,
                }}
              >{content}</ReactMarkdown>
            </div>
          )}
        </div>
      )}
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
