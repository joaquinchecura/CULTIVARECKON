import { Toaster } from "@/components/ui/toaster"
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { queryClientInstance, persister } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Layout from './components/Layout';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Evaluations from './pages/Evaluations';
import Plan from './pages/Plan';
import NextEvaluation from './pages/NextEvaluation';
import { SignIn } from '@clerk/clerk-react'; // IMPORTANTE: Agregado para el Login

// ─── Pantalla de Login Custom ───────────────────────────────────────
const SignInPage = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 relative overflow-hidden">
    {/* Fondo con grid milimetrado (estilo planilla de medición) */}
    <div 
      className="absolute inset-0 pointer-events-none opacity-40"
      style={{
        backgroundImage: `
          linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px),
          linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)
        `,
        backgroundSize: '24px 24px'
      }}
    />
    
    {/* Glow de medición (cian) */}
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[hsl(var(--measure))]/5 blur-[100px] rounded-full pointer-events-none" />

    <div className="w-full max-w-sm relative z-10">
      
      {/* Branding con tipografía display y badge de medición */}
      <div className="text-center mb-8 space-y-3">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-sm bg-card border border-border shadow-sm mb-2">
          <img 
            src="/icons/favicon-96x96.png" 
            alt="RECKON" 
            className="w-16 h-16 object-contain" 
          />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight font-['Space_Grotesk']">
            RECKON
          </h1>
          <p className="text-sm text-muted-foreground mt-1 font-['IBM_Plex_Mono'] uppercase tracking-wider">
            Evaluación & Planificacion
          </p>
        </div>
      </div>

      {/* Tarjeta de Clerk */}
      <div className="bg-card rounded-sm border border-border shadow-sm p-2">
        <SignIn 
          routing="hash" 
          appearance={{ 
            elements: { 
              card: 'bg-transparent shadow-none p-4',
              cardBox: 'shadow-none w-full'
            } 
          }} 
        />
      </div>

      <p className="text-center text-xs text-muted-foreground mt-6 font-['IBM_Plex_Mono']">
        © {new Date().getFullYear()} CultivaFitness
      </p>
    </div>
  </div>
)

// ─── App Autenticada ────────────────────────────────────────────────
const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // IMPORTANTE: En lugar de usar navigateToLogin(), mostramos nuestra pantalla custom
      return <SignInPage />;
    }
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/perfil" element={<Profile />} />
        <Route path="/evaluaciones" element={<Evaluations />} />
        <Route path="/plan" element={<Plan />} />
        <Route path="/historial" element={<NextEvaluation />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <PersistQueryClientProvider 
        client={queryClientInstance} 
        persistOptions={{ 
          persister,
          maxAge: 1000 * 60 * 60 * 24 * 7, // 7 días
        }}
        onSuccess={() => console.log('Cache restaurado desde localStorage')}
      >
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </PersistQueryClientProvider>
    </AuthProvider>
  )
}

export default App