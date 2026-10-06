// src/components/evaluations/StopwatchField.jsx
import { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { Input } from '@/components/ui/input';

/**
 * Campo numérico con un cronómetro inline al lado. Pensado para tests como
 * plank, wall sit, equilibrio unipodal o el test de la silla (con
 * targetSec, vibra/avisa al llegar al objetivo).
 *
 * El cronómetro es un ayudante: el valor final SIEMPRE queda en un <input>
 * numérico editable, así que si alguien cronometra con el celular de otra
 * forma, puede tipear el número directo sin usar el botón.
 */
export default function StopwatchField({ value, onChange, targetSec, disabled }) {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef(null);
  const notifiedRef = useRef(false);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setElapsed(e => {
          const next = e + 1;
          if (targetSec && next >= targetSec && !notifiedRef.current) {
            notifiedRef.current = true;
            if (navigator.vibrate) navigator.vibrate(300);
          }
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, targetSec]);

  const toggle = () => setRunning(r => !r);

  const stopAndSave = () => {
    setRunning(false);
    onChange(String(elapsed));
  };

  const reset = () => {
    setRunning(false);
    setElapsed(0);
    notifiedRef.current = false;
  };

  return (
    <div className="mt-1 space-y-2">
      <div className="flex items-center gap-2">
        <Input
          type="number"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="0"
          disabled={disabled}
          className="flex-1"
        />
        <span className="text-xs text-muted-foreground whitespace-nowrap">seg</span>
      </div>
      {!disabled && (
        <div className="flex items-center gap-2">
          <span className="text-sm font-mono text-foreground tabular-nums w-10">{elapsed}s</span>
          <button
            type="button"
            onClick={toggle}
            className="p-1.5 rounded-md bg-secondary hover:bg-secondary/80 transition-colors"
            aria-label={running ? 'Pausar' : 'Iniciar'}
          >
            {running ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={reset}
            className="p-1.5 rounded-md bg-secondary hover:bg-secondary/80 transition-colors"
            aria-label="Reiniciar"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          {elapsed > 0 && (
            <button
              type="button"
              onClick={stopAndSave}
              className="text-xs text-primary hover:underline ml-1"
            >
              Usar este tiempo
            </button>
          )}
        </div>
      )}
    </div>
  );
}