// src/components/evaluations/TestCard.jsx
import { useState } from 'react';
import { ChevronDown, ChevronUp, AlertTriangle, Image as ImageIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SKIP_REASONS } from '@/config/tests.config';
import StopwatchField from './StopwatchField';

const MODE_LABELS = {
  self: { label: 'Autoevaluable', className: 'mode-badge self' },
  helper: { label: 'Con ayuda', className: 'mode-badge helper' },
  professional: { label: 'Con profesional', className: 'mode-badge professional' },
};

/**
 * Renderiza un test completo: imagen, descripción, pasos ("Cómo hacerlo"),
 * badge de modo, inputs, cronómetro (si aplica) y el flujo de "no pude
 * hacerlo". Usa .measure-card (borde-calibre cian) en vez de una card
 * redondeada genérica — es la pieza central del motivo visual de Reckon.
 *
 * Props: test, values, onChange(key,val), onSkip(key,reason|null),
 * parqPositive, score ({label, className} opcional).
 */
export default function TestCard({ test, values, onChange, onSkip, parqPositive, score }) {
  const [open, setOpen] = useState(false);
  const [imgOk, setImgOk] = useState(true);

  const skipKey = `${test.id}_skip_reason`;
  const isSkipped = Boolean(values[skipKey]);
  const blocked = parqPositive && test.highIntensity;
  const modeInfo = MODE_LABELS[test.mode] || MODE_LABELS.self;

  return (
    <div className="measure-card space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-display font-semibold text-foreground text-[15px]">{test.title}</h3>
            {score && <span className={`badge-pill ${score.className}`}>{score.label}</span>}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">{test.purpose}</p>
        </div>
        <span className={modeInfo.className}>{modeInfo.label}</span>
      </div>

      {test.image && imgOk ? (
        <img
          src={`/${test.image}`}
          alt={test.title}
          className="w-full max-h-48 object-cover rounded-sm bg-secondary"
          onError={() => setImgOk(false)}
        />
      ) : (
        <div className="w-full h-20 rounded-sm bg-secondary flex items-center justify-center text-muted-foreground">
          <ImageIcon className="w-4 h-4 mr-2" />
          <span className="text-xs">Imagen de referencia próximamente</span>
        </div>
      )}

      {blocked && (
        <div className="reckon-alert">
          <div className="title flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> Bloqueado por PAR-Q positivo</div>
          <div className="body">
            Este test exige esfuerzo alto. Se recomienda no hacerlo hasta tener el OK de un médico — el profesional
            puede habilitarlo manualmente si corresponde.
          </div>
        </div>
      )}

      {test.contraindication && !blocked && (
        <p className="text-xs text-alert bg-alert-soft rounded-sm px-3 py-2">{test.contraindication}</p>
      )}

      <div>
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-1.5 text-sm text-measure hover:underline"
        >
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          Cómo hacerlo
        </button>
        {open && (
          <div className="mt-2 space-y-3 text-sm">
            {test.equipment && (
              <p className="text-muted-foreground"><strong className="text-foreground">Necesitás:</strong> {test.equipment}</p>
            )}
            <ol className="list-decimal list-inside space-y-1 text-foreground">
              {test.steps.map((s, i) => <li key={i}>{s}</li>)}
            </ol>
            {test.commonMistakes?.length > 0 && (
              <div className="text-xs text-muted-foreground">
                <strong>Errores comunes:</strong> {test.commonMistakes.join(' · ')}
              </div>
            )}
          </div>
        )}
      </div>

      {!isSkipped && (
        <div className="grid sm:grid-cols-2 gap-4 pt-1">
          {test.inputs.map(input => (
            <div key={input.key}>
              <Label className="flex items-center gap-1 text-sm">
                {input.label} {input.unit && <span className="measure-unit">({input.unit})</span>}
              </Label>
              {input.type === 'select' ? (
                <Select value={values[input.key] || ''} onValueChange={val => onChange(input.key, val)} disabled={blocked}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    {input.options.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : test.hasTimer && input.type === 'number' && input.unit === 'seg' ? (
                <StopwatchField
                  value={values[input.key] || ''}
                  onChange={val => onChange(input.key, val)}
                  targetSec={test.timerTargetSec}
                  disabled={blocked}
                />
              ) : (
                <Input
                  type={input.type === 'number' ? 'number' : 'text'}
                  step={input.step}
                  min={input.min}
                  max={input.max}
                  value={values[input.key] || ''}
                  onChange={e => onChange(input.key, e.target.value)}
                  placeholder={input.placeholder}
                  disabled={blocked}
                  className="mt-1 font-mono"
                />
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-border">
        {!isSkipped ? (
          <button type="button" onClick={() => onSkip(skipKey, SKIP_REASONS[0])} className="text-xs text-muted-foreground hover:text-foreground underline">
            No pude hacer este test
          </button>
        ) : (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground">No realizado:</span>
            <Select value={values[skipKey]} onValueChange={val => onSkip(skipKey, val)}>
              <SelectTrigger className="h-7 text-xs w-48"><SelectValue /></SelectTrigger>
              <SelectContent>{SKIP_REASONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
            </Select>
            <button type="button" onClick={() => onSkip(skipKey, null)} className="text-xs text-measure hover:underline">
              En realidad sí lo hice
            </button>
          </div>
        )}
      </div>
    </div>
  );
}