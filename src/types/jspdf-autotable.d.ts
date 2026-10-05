// src/types/jspdf-autotable.d.ts
// jspdf-autotable adjunta `lastAutoTable` a la instancia de jsPDF en tiempo de
// ejecución, pero no viene declarado en sus tipos. Este archivo se lo dice a TS.
import 'jspdf';

declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable: {
      finalY: number;
    };
  }
}