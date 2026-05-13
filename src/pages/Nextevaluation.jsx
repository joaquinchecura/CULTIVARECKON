import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, FileText, ArrowRight, Info, Clock, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

function formatDate(d) {
  if (!d || d === 'null' || d === 'undefined') return '—';
  const date = new Date(d);
  if (isNaN(date.getTime())) return '—';
  try { return format(date, "d 'de' MMMM yyyy", { locale: es }); }
  catch { return '—'; }
}

export default function NextEvaluation() {
  const navigate = useNavigate();
  
  const rawDate = localStorage.getItem('lastEvaluationDate');
  const lastEvaluationDate = rawDate && rawDate !== 'null' && rawDate !== 'undefined' 
    ? rawDate 
    : null;
  const hasPreviousEvaluation = !!lastEvaluationDate;

  const getNextEvaluationDate = () => {
    if (!lastEvaluationDate) return null;
    const date = new Date(lastEvaluationDate);
    if (isNaN(date.getTime())) return null;
    date.setMonth(date.getMonth() + 3);
    return date;
  };

  const nextDate = getNextEvaluationDate();
  const daysUntilNext = nextDate && !isNaN(nextDate.getTime()) 
    ? Math.ceil((nextDate - new Date()) / (1000 * 60 * 60 * 24)) 
    : null;
  const canEvaluate = !daysUntilNext || daysUntilNext <= 0;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-primary uppercase tracking-widest mb-1">Evaluación</p>
        <h1 className="text-2xl font-bold text-foreground">Seguimiento y Evolución</h1>
        <p className="text-muted-foreground mt-1">
          Tu historial se guarda en los PDFs que generás. Compará evaluaciones para ver tu progreso.
        </p>
      </div>

      <div className="step-card space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-foreground">
              {hasPreviousEvaluation ? 'Evaluación registrada' : 'Sin evaluaciones previas'}
            </p>
            <p className="text-sm text-muted-foreground">
              {hasPreviousEvaluation 
                ? `Última evaluación: ${formatDate(lastEvaluationDate)}`
                : 'Completá tu primera evaluación para generar tu informe'}
            </p>
          </div>
        </div>

        {hasPreviousEvaluation && nextDate && !isNaN(nextDate.getTime()) && (
          <div className="bg-secondary/50 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Próxima evaluación sugerida</span>
              <span className={`text-sm font-semibold ${canEvaluate ? 'text-green-600' : 'text-primary'}`}>
                {canEvaluate ? '¡Ya podés evaluarte!' : `En ${daysUntilNext} días`}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {formatDate(nextDate)} — Se recomienda esperar 2-3 meses entre evaluaciones para ver cambios significativos.
            </p>
            {canEvaluate && (
              <div className="flex items-center gap-1.5 text-xs text-green-600 mt-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Período mínimo de espera completado</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="step-card space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Info className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground">¿Cómo funciona el seguimiento?</h3>
        </div>
        <div className="space-y-3">
          <Step number={1} title="Completá tu evaluación" 
                text="Respondé las secciones de Cuerpo, Dieta y Rendimiento con tus datos actuales." />
          <Step number={2} title="Generá tu PDF" 
                text="Descargá tu informe completo con todos los datos, análisis y recomendaciones." />
          <Step number={3} title="Enviá a tu especialista" 
                text="Compartí el PDF para que analice tu situación actual y diseñe tu plan." />
          <Step number={4} title="Repetí en 2-3 meses" 
                text="Volvé a completar todo, generá un nuevo PDF y compará con el anterior para ver tu evolución." />
        </div>
      </div>

      <Button 
        onClick={() => navigate('/evaluaciones')} 
        className="w-full h-12 text-base gap-2"
      >
        {hasPreviousEvaluation ? (
          <>
            {canEvaluate ? 'Iniciar nueva evaluación' : 'Iniciar evaluación anticipada'}
            <ArrowRight className="w-4 h-4" />
          </>
        ) : (
          <>
            Comenzar primera evaluación
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </Button>

      {hasPreviousEvaluation && (
        <div className="flex items-start gap-3 text-sm text-muted-foreground bg-secondary/30 rounded-lg p-4">
          <FileText className="w-4 h-4 mt-0.5 shrink-0" />
          <p>
            <strong>Consejo:</strong> Guardá todos tus PDFs en una carpeta. Así podés comparar fácilmente 
            tu evolución entre evaluaciones. Tu especialista usará estos documentos para ajustar tu plan.
          </p>
        </div>
      )}

      {!hasPreviousEvaluation && (
        <div className="flex items-start gap-3 text-sm text-muted-foreground bg-secondary/30 rounded-lg p-4">
          <Clock className="w-4 h-4 mt-0.5 shrink-0" />
          <p>
            <strong>Importante:</strong> La primera evaluación sirve como línea base. 
            Cuando vuelvas en 2-3 meses, el especialista podrá comparar tus resultados y medir tu progreso real.
          </p>
        </div>
      )}
    </div>
  );
}

function Step({ number, title, text }) {
  return (
    <div className="flex gap-3">
      <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
        {number}
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}