import { Outlet, Link, useLocation } from 'react-router-dom';
import { Activity, ClipboardList, Dumbbell, User, BarChart3, Menu, X, LogOut, HeadphonesIcon } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { base44 } from '@/api/entities';
import ContactSpecialistModal from './ContactSpecialistModal';

const navItems = [
  { path: '/', label: 'Inicio', icon: Activity },
  { path: '/perfil', label: 'Mi Perfil', icon: User },
  { path: '/evaluaciones', label: 'Evaluaciones', icon: ClipboardList },
  { path: '/plan', label: 'Mi Plan', icon: Dumbbell },
  { path: '/historial', label: 'Historial', icon: BarChart3 },
];

export default function Layout() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const handleLogout = () => base44.auth.logout('/');

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-card border-r border-border fixed inset-y-0 left-0 z-20">
        <div className="px-6 py-8 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Activity className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-semibold text-sm text-foreground">CULTIVAFITNESS RECKON</h1>
              <p className="text-xs text-muted-foreground">Tu plan personalizado</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-6 space-y-1">
          {navItems.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                location.pathname === path
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="px-6 py-4 border-t border-border space-y-3">
          <button
            onClick={() => setShowContact(true)}
            className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors w-full"
          >
            <HeadphonesIcon className="w-4 h-4" />
            Hablar con Especialista
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
          <p className="text-xs text-muted-foreground">RECKON AI © 2026</p>
        </div>
      </aside>

      {/* Mobile topbar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">

          <span className="font-semibold text-sm">CultivaFitness RECKON</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-3 -mr-2 text-muted-foreground hover:text-foreground">
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-20 bg-background/80 backdrop-blur-sm" onClick={() => setMobileOpen(false)}>
          <div className="w-64 bg-card h-full border-r border-border pt-16 flex flex-col" onClick={e => e.stopPropagation()}>
            <nav className="flex-1 px-3 py-6 space-y-1">
              {navItems.map(({ path, label, icon: Icon }) => (
                <Link
                  key={path}
                  to={path}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors',
                    location.pathname === path
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              ))}
            </nav>
            <div className="px-3 py-4 border-t border-border space-y-1">
              <button
                onClick={() => { setShowContact(true); setMobileOpen(false); }}
                className="flex items-center gap-3 px-3 py-3 w-full rounded-lg text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
              >
                <HeadphonesIcon className="w-4 h-4" />
                Hablar con Especialista
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-3 w-full rounded-lg text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 md:ml-64 pt-14 md:pt-0">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Outlet />
        </div>
      </main>

      {/* Mobile floating button */}
      <button
        onClick={() => setShowContact(true)}
        className="md:hidden fixed bottom-6 right-6 z-30 flex items-center gap-2 bg-primary text-primary-foreground px-4 py-3 rounded-full shadow-lg hover:bg-primary/90 transition-colors text-sm font-medium"
      >
        <HeadphonesIcon className="w-4 h-4" />
        Especialista
      </button>

      {showContact && <ContactSpecialistModal onClose={() => setShowContact(false)} />}
    </div>
  );
}
