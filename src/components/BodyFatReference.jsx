import { useState } from 'react';

const MALE_REFS = [
  { pct: 3, desc: 'Essential fat (ciclistas de élite, culturistas en competencia)' },
  { pct: 6, desc: 'Muy definido (abdominales visibles, vascularización)' },
  { pct: 10, desc: 'Definido (abdominales marcados, poca grasa subcutánea)' },
  { pct: 14, desc: 'Atlético (abdominales levemente visibles, hombros definidos)' },
  { pct: 18, desc: 'Fitness (forma atlética, algo de definición)' },
  { pct: 22, desc: 'Promedio saludable (poco definición, cintura visible)' },
  { pct: 26, desc: 'Sobrepeso leve (grasa abdominal, cintura menos definida)' },
  { pct: 32, desc: 'Sobrepeso (grasa abdominal notable, doble mentón leve)' },
  { pct: 38, desc: 'Obesidad (grasa abundante en abdomen, espalda, cara)' },
];

const FEMALE_REFS = [
  { pct: 12, desc: 'Essential fat (atletas de élite, culturistas)' },
  { pct: 16, desc: 'Muy definido (abdominales visibles, muy atlético)' },
  { pct: 20, desc: 'Definido (abdomen plano, definición en brazos/piernas)' },
  { pct: 24, desc: 'Atlético (forma tonificada, cintura definida)' },
  { pct: 28, desc: 'Fitness (curvas suaves, algo de definición)' },
  { pct: 32, desc: 'Promedio saludable (grasa suave, cintura promedio)' },
  { pct: 36, desc: 'Sobrepeso leve (grasa en abdomen, caderas, brazos)' },
  { pct: 42, desc: 'Sobrepeso (grasa abdominal notable, espalda ancha)' },
  { pct: 48, desc: 'Obesidad (grasa abundante en todo el cuerpo)' },
];

export default function BodyFatReference({ gender, onSelect }) {
  const [selected, setSelected] = useState(null);
  const refs = gender === 'Femenino' ? FEMALE_REFS : MALE_REFS;

  const handleSelect = (pct) => {
    setSelected(pct);
    onSelect(pct);
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Seleccioná la imagen que más se parece a tu físico actual:</p>
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {refs.map((ref) => (
          <button
            key={ref.pct}
            type="button"
            onClick={() => handleSelect(ref.pct)}
            className={`p-2 rounded-lg border text-center transition-all ${
              selected === ref.pct
                ? 'border-primary bg-primary/10 ring-2 ring-primary'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <div className="aspect-[3/4] bg-secondary rounded-md mb-2 flex items-center justify-center">
              <span className="text-2xl font-bold text-muted-foreground">{ref.pct}%</span>
            </div>
            <p className="text-xs text-muted-foreground leading-tight">{ref.desc}</p>
          </button>
        ))}
      </div>
      {selected && (
        <p className="text-sm font-medium text-primary">
          Seleccionado: {selected}% grasa corporal estimado
        </p>
      )}
    </div>
  );
}