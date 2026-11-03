import React from 'react'
import './index.css'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { ClerkProvider } from '@clerk/clerk-react'
import { esES } from '@clerk/localizations'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY")
}

const clerkAppearance = {
  layout: {
    socialButtonsVariant: 'blockButton',
    socialButtonsPlacement: 'top',
  },
  variables: {
    colorPrimary: "hsl(152 39% 30%)",     // Tu verde cultivo
    colorBackground: "hsl(0 0% 100%)",    // Blanco papel
    colorText: "hsl(210 15% 10%)",        // Tu tinta
    colorInputBackground: "hsl(100 7% 96%)",
    colorInputText: "hsl(210 15% 10%)",
    borderRadius: "0.25rem",              // El radius de RECKON (bordes rectos)
    fontFamily: "'Inter', sans-serif",
  },
  elements: {
    rootBox: 'w-full',
    card: 'bg-transparent shadow-none border-none p-6',
    cardBox: 'w-full shadow-none',
    
    // Textos con Space Grotesk (tu fuente display)
    headerTitle: "text-2xl font-bold text-foreground font-['Space_Grotesk']",
    headerSubtitle: "text-sm text-muted-foreground",
    
    // Inputs con borde fino, sin sombras, estilo planilla
    formFieldLabel: "text-sm font-medium text-foreground",
    formFieldInput: "rounded-sm border border-border bg-background focus:border-primary focus:ring-0 h-11 px-3 text-foreground",
    
    // Botón verde sólido
    formButtonPrimary: "bg-primary text-primary-foreground hover:bg-primary/90 h-11 rounded-sm font-semibold transition-all",
    
    // Social buttons
    socialButtonsBlockButton: "rounded-sm border border-border hover:bg-muted h-11",
    socialButtonsBlockButtonText: "font-medium text-sm",
    
    // Divisor con mono font (estilo código)
    dividerText: "text-xs text-muted-foreground font-['IBM_Plex_Mono']",
    footerActionText: "text-sm text-muted-foreground",
    footerActionLink: "text-sm font-semibold text-primary hover:text-primary/80",
    footerPages: 'hidden',
  },
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ClerkProvider 
      publishableKey={PUBLISHABLE_KEY} 
      appearance={clerkAppearance}
      localization={esES}
      afterSignOutUrl="/"
    >
      <App />
    </ClerkProvider>
  </React.StrictMode>,
)