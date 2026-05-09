import { X, MessageCircle, Instagram, Mail, HeadphonesIcon } from 'lucide-react';

export default function ContactSpecialistModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-5"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <HeadphonesIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Hablar con un Especialista</h2>
              <p className="text-xs text-muted-foreground">Elegí tu canal preferido</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contact options */}
        <div className="space-y-3">
          <a
            href="https://wa.me/5491123970926"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 p-4 rounded-xl border border-border bg-secondary/50 hover:bg-secondary hover:border-primary/30 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-foreground text-sm">WhatsApp</p>
              <p className="text-xs text-muted-foreground">+54 9 11 2397 0926</p>
            </div>
          </a>

          <a
            href="https://instagram.com/cultivafitness"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 p-4 rounded-xl border border-border bg-secondary/50 hover:bg-secondary hover:border-primary/30 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center flex-shrink-0">
              <Instagram className="w-5 h-5 text-pink-600" />
            </div>
            <div>
              <p className="font-medium text-foreground text-sm">Instagram</p>
              <p className="text-xs text-muted-foreground">@cultivafitness</p>
            </div>
          </a>

          <a
            href="mailto:cultivafitness@gmail.com"
            className="flex items-center gap-4 p-4 rounded-xl border border-border bg-secondary/50 hover:bg-secondary hover:border-primary/30 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground text-sm">Email</p>
              <p className="text-xs text-muted-foreground">cultivafitness@gmail.com</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
