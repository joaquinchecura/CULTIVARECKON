import { Link } from 'react-router-dom';
import { entities } from '@/api/entities';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, User, ClipboardList, Dumbbell, BarChart3, CheckCircle2, AlertCircle, HeadphonesIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import ContactSpecialistModal from '@/components/ContactSpecialistModal';

const steps = [
  {
    number: '01',
    title: 'Completa tu Perfil',
    description: 'Datos personales, objetivos y disponibilidad.',
    path: '/perfil',
    icon: User,
    entity: 'UserProfile',
  },
  {
    number: '02',
    title: 'Evaluaciones de Salud',
    description: 'PAR-Q, historial clínico, mediciones y tests físicos.',
    path: '/evaluaciones',
    icon: ClipboardList,
    entity: 'HealthHistory',
  },
  {
    number: '03',
    title: 'Genera tu Plan',
    description: 'La IA crea un plan personalizado de actividad física.',
    path: '/plan',
    icon: Dumbbell,
    entity: 'FitnessPlan',
  },
  {
    number: '04',
    title: 'Seguimiento',
    description: 'Historial de evaluaciones y evolución.',
    path: '/historial',
    icon: BarChart3,
    entity: null,
  },
];

export default function Home() {
  const [showContact, setShowContact] = useState(false);
  const { data: profiles } = useQuery({ queryKey: ['profiles'], queryFn: () => entities.UserProfile.list() });
  const { data: healthRecords } = useQuery({ queryKey: ['health'], queryFn: () => entities.HealthHistory.list() });
  const { data: plans } = useQuery({ queryKey: ['plans'], queryFn: () => entities.FitnessPlan.list() });

  const hasProfile = profiles && profiles.length > 0;
  const hasHealth = healthRecords && healthRecords.length > 0;
  const hasPlan = plans && plans.length > 0;

  const completionMap = {
    UserProfile: hasProfile,
    HealthHistory: hasHealth,
    FitnessPlan: hasPlan,
  };

  return (
    <div className="space-y-10">
      {showContact && <ContactSpecialistModal onClose={() => setShowContact(false)} />}
      {/* Header */}
      <div>
        <p className="text-sm font-medium text-primary uppercase tracking-widest mb-2">RECKON AI</p>
        <h1 className="text-3xl font-bold text-foreground leading-tight">
          Tu plan de actividad física<br />personalizado por IA
        </h1>
        <p className="mt-3 text-muted-foreground max-w-lg">
          Completa tus evaluaciones de salud y condición física. La inteligencia artificial RECKON generará un plan
          profesional adaptado a tus necesidades, objetivos y condición actual.
        </p>
      </div>

      {/* Progress banner */}
      {(hasProfile || hasHealth || hasPlan) && (
        <div className="bg-accent/40 border border-accent rounded-xl p-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-accent-foreground flex-shrink-0" />
          <p className="text-sm text-accent-foreground">
            {hasPlan
              ? 'Tienes un plan activo. Puedes ver tu historial o regenerar el plan con nuevas evaluaciones.'
              : hasHealth
              ? 'Evaluaciones completadas. Ya podés generar tu plan de actividad física.'
              : 'Perfil creado. Continúa con las evaluaciones de salud y condición física.'}
          </p>
          {hasPlan && (
            <Link to="/plan" className="ml-auto text-xs font-medium text-primary hover:underline whitespace-nowrap">
              Ver plan →
            </Link>
          )}
        </div>
      )}

      {/* Steps */}
      <div className="grid gap-4 sm:grid-cols-2">
        {steps.map(({ number, title, description, path, icon: Icon, entity }) => {
          const done = entity ? completionMap[entity] : false;
          return (
            <Link
              key={number}
              to={path}
              className="step-card group flex items-start gap-4 hover:border-primary/40"
            >
              <div className={cn(
                'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-colors',
                done ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
              )}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-muted-foreground">{number}</span>
                  {done && <CheckCircle2 className="w-3.5 h-3.5 text-primary" />}
                </div>
                <h3 className="font-semibold text-foreground mt-0.5">{title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{description}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
            </Link>
          );
        })}
      </div>

      {/* Specialist CTA */}
      <div className="border border-primary/20 rounded-xl p-5 bg-primary/5 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <HeadphonesIcon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-foreground text-sm">¿Tenés dudas?</p>
            <p className="text-xs text-muted-foreground">Hablá directamente con un especialista de CultivaFitness.</p>
          </div>
        </div>
        <button
          onClick={() => setShowContact(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors whitespace-nowrap"
        >
          <HeadphonesIcon className="w-4 h-4" />
          Hablar con Especialista
        </button>
      </div>

      {/* Info block */}
      <div className="border border-border rounded-xl p-6 bg-card">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-foreground text-sm">Aviso importante</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Esta aplicación utiliza IA para generar recomendaciones de actividad física. 
              No reemplaza el diagnóstico ni el tratamiento médico profesional. 
              Consultá siempre a tu médico antes de iniciar cualquier programa de ejercicios.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
