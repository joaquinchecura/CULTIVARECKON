import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PARQForm from '@/components/evaluations/PARQForm';
import MeasurementsForm from '@/components/evaluations/MeasurementsForm';
import FitnessTestsForm from '@/components/evaluations/FitnessTestsForm';
import { ClipboardList, Ruler, Dumbbell } from 'lucide-react';

export default function Evaluations() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-primary uppercase tracking-widest mb-1">Paso 02</p>
        <h1 className="text-2xl font-bold text-foreground">Evaluaciones</h1>
        <p className="text-muted-foreground mt-1">Historial de salud, composición corporal, nutrición y tests de condición física.</p>
      </div>

      <Tabs defaultValue="salud" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 bg-secondary">
          <TabsTrigger value="salud" className="flex items-center gap-2 text-xs sm:text-sm">
            <ClipboardList className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Salud & Mente</span>
            <span className="sm:hidden">Salud</span>
          </TabsTrigger>
          <TabsTrigger value="cuerpo" className="flex items-center gap-2 text-xs sm:text-sm">
            <Ruler className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cuerpo & Dieta</span>
            <span className="sm:hidden">Cuerpo</span>
          </TabsTrigger>
          <TabsTrigger value="rendimiento" className="flex items-center gap-2 text-xs sm:text-sm">
            <Dumbbell className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Rendimiento</span>
            <span className="sm:hidden">Tests</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="salud" forceMount className="data-[state=inactive]:hidden">
          <PARQForm />
        </TabsContent>
        <TabsContent value="cuerpo" forceMount className="data-[state=inactive]:hidden">
          <MeasurementsForm />
        </TabsContent>
        <TabsContent value="rendimiento" forceMount className="data-[state=inactive]:hidden">
          <FitnessTestsForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}