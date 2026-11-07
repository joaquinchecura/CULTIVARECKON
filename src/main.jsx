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
    colorTextSecondary: "hsl(210 15% 40%)",
    colorInputBackground: "hsl(100 7% 96%)",
    colorInputText: "hsl(210 15% 10%)",
    colorDanger: "hsl(0 84% 60%)",
    borderRadius: "0.25rem",              // El radius de RECKON (bordes rectos)
    fontFamily: "'Inter', sans-serif",
  },
  elements: {
    rootBox: 'w-full',
    // Forzamos la tarjeta a ser blanca y sin bordes redondeados
    card: 'bg-white shadow-none border-none p-6',
    cardBox: 'w-full shadow-none',
    
    // Textos con Space Grotesk (tu fuente display)
    headerTitle: "text-2xl font-bold text-[hsl(210_15%_10%)] font-['Space_Grotesk']",
    headerSubtitle: "text-sm text-[hsl(210_15%_40%)]",
    
    // Inputs con borde fino, sin sombras, estilo planilla
    formFieldLabel: "text-sm font-medium text-[hsl(210_15%_10%)]",
    formFieldInput: "rounded-sm border border-[hsl(210_15%_90%)] bg-[hsl(100_7%_96%)] focus:border-[hsl(152_39%_30%)] focus:ring-0 h-11 px-3 text-[hsl(210_15%_10%)]",
    
    // Botón verde sólido
    formButtonPrimary: "bg-[hsl(152_39%_30%)] text-white hover:bg-[hsl(152_39%_25%)] h-11 rounded-sm font-semibold transition-all",
    
    // Social buttons
    socialButtonsBlockButton: "rounded-sm border border-[hsl(210_15%_90%)] hover:bg-[hsl(100_7%_96%)] h-11",
    socialButtonsBlockButtonText: "font-medium text-sm text-[hsl(210_15%_10%)]",
    
    // Divisor con mono font (estilo código)
    dividerText: "text-xs text-[hsl(210_15%_40%)] font-['IBM_Plex_Mono']",
    footerActionText: "text-sm text-[hsl(210_15%_40%)]",
    footerActionLink: "text-sm font-semibold text-[hsl(152_39%_30%)] hover:text-[hsl(152_39%_25%)]",
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