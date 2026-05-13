import { useState } from 'react';

const MALE_REFS = [
  { pct: 3, src: '/images/bodyfat/male3.jpeg', desc: '3% Grasa mínima (ciclistas de élite, culturistas en competencia)' },
  { pct: 6, src: '/images/bodyfat/male6.jpeg', desc: '6% Muy definido (abdominales visibles, vascularización)' },
  { pct: 10, src: '/images/bodyfat/male10.jpeg', desc: '10% Definido (abdominales marcados, poca grasa subcutánea)' },
  { pct: 14, src: '/images/bodyfat/male14.jpeg', desc: '14% Atlético (abdominales levemente visibles, hombros definidos)' },
  { pct: 18, src: '/images/bodyfat/male18.jpeg', desc: '18% Fitness (forma atlética, algo de definición)' },
  { pct: 22, src: '/images/bodyfat/male22.jpeg', desc: '22% Promedio saludable (poco definición, cintura visible)' },
  { pct: 26, src: '/images/bodyfat/male26.jpeg', desc: '26% Sobrepeso leve (grasa abdominal, cintura menos definida)' },
  { pct: 32, src: '/images/bodyfat/male32.jpeg', desc: '32% Sobrepeso (grasa abdominal notable, doble mentón leve)' },
  { pct: 38, src: '/images/bodyfat/male38.jpeg', desc: '38% Obesidad (grasa abundante en abdomen, espalda, cara)' },
];

const FEMALE_REFS = [
  { pct: 12, src: '/images/bodyfat/female12.jpeg', desc: '12% Grasa mínima (atletas de élite, culturistas)' },
  { pct: 16, src: '/images/bodyfat/female16.jpeg', desc: '16% Muy definido (abdominales visibles, muy atlético)' },
  { pct: 20, src: '/images/bodyfat/female20.jpeg', desc: '20% Definido (abdomen plano, definición en brazos/piernas)' },
  { pct: 24, src: '/images/bodyfat/female24.jpeg', desc: '24% Atlético (forma tonificada, cintura definida)' },
  { pct: 28, src: '/images/bodyfat/female28.jpeg', desc: '28% Fitness (curvas suaves, algo de definición)' },
  { pct: 32, src: '/images/bodyfat/female32.jpeg', desc: '32% Promedio saludable (grasa suave, cintura promedio)' },
  { pct: 36, src: '/images/bodyfat/female36.jpeg', desc: '36% Sobrepeso leve (grasa en abdomen, caderas, brazos)' },
  { pct: 42, src: '/images/bodyfat/female42.jpeg', desc: '42% Sobrepeso (grasa abdominal notable, espalda ancha)' },
  { pct: 48, src: '/images/bodyfat/female48.jpeg', desc: '48% Obesidad (grasa abundante en todo el cuerpo)' },
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
            }`}>
            <div className="aspect-[3/4] bg-secondary rounded-md mb-2 overflow-hidden">
              <img
                src={ref.src}
                alt={`${ref.pct}% grasa corporal`}
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = `<span class="text-2xl font-bold text-muted-foreground flex items-center justify-center h-full">${ref.pct}%</span>`;
                }}
              />
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