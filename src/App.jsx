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
import History from './pages/History';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

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
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/perfil" element={<Profile />} />
        <Route path="/evaluaciones" element={<Evaluations />} />
        <Route path="/plan" element={<Plan />} />
        <Route path="/historial" element={<History />} />
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