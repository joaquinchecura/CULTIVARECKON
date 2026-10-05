// src/lib/completeness.js
// Calcula qué tan completa está la info del cliente, sin "penalizar" al principiante.
// Se usa en: Home (progreso), Evaluations (badges por sección), Plan (resumen del PDF).

// Cada test/campo tiene un "peso" según qué tan accesible es para alguien sin
// equipamiento ni ayuda profesional. Esto permite mostrar "Básico" como un logro
// real, no como "te faltó la mitad".
const WEIGHTS = {
    essential: 3,   // lo mínimo para que la IA arme algo seguro (PAR-Q, objetivo, datos básicos)
    accessible: 2,  // cualquiera puede hacerlo solo, sin equipamiento (push-ups, plank, sentadilla)
    pro: 1,         // requiere cinta métrica, caliper, pulsómetro, o ayuda profesional
  };
  
  export function fieldsScore(values, weight = 'accessible') {
    const filled = values.filter(v => v !== '' && v !== null && v !== undefined).length;
    return { filled, total: values.length, weight };
  }
  
  export function sectionCompleteness(scores) {
    // scores: array de {filled, total, weight}
    let earned = 0, possible = 0;
    scores.forEach(({ filled, total, weight }) => {
      const w = WEIGHTS[weight] || 1;
      earned += filled * w;
      possible += total * w;
    });
    const pct = possible ? Math.round((earned / possible) * 100) : 0;
    return { pct, level: levelFromPct(pct) };
  }
  
  function levelFromPct(pct) {
    if (pct >= 80) return { label: 'Avanzado', color: 'text-green-600 bg-green-50 border-green-200' };
    if (pct >= 45) return { label: 'Intermedio', color: 'text-blue-600 bg-blue-50 border-blue-200' };
    if (pct > 0) return { label: 'Básico', color: 'text-amber-600 bg-amber-50 border-amber-200' };
    return { label: 'Sin empezar', color: 'text-muted-foreground bg-secondary border-border' };
  }
  
  // Mensaje contextual: nunca "te falta", siempre en términos de qué suma.
  export function completenessMessage(level) {
    switch (level) {
      case 'Avanzado':
        return 'Tenés una ficha muy completa. El plan podrá ser muy preciso.';
      case 'Intermedio':
        return 'Buena base. El profesional puede armar un plan sólido con esto.';
      case 'Básico':
        return 'Con esto ya alcanza para un plan inicial seguro. Podés sumar más datos si tenés los elementos.';
      default:
        return 'Empezá por lo que puedas — no hace falta tener todo.';
    }
  }