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
        <p className="text-muted-foreground mt-1">Historial de salud, mediciones corporales y tests de condición física.</p>
      </div>

      <Tabs defaultValue="parq" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 bg-secondary">
          <TabsTrigger value="parq" className="flex items-center gap-2 text-xs sm:text-sm">
            <ClipboardList className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Historial</span>
            <span className="sm:hidden">Salud</span>
          </TabsTrigger>
          <TabsTrigger value="mediciones" className="flex items-center gap-2 text-xs sm:text-sm">
            <Ruler className="w-3.5 h-3.5" />
            Mediciones
          </TabsTrigger>
          <TabsTrigger value="tests" className="flex items-center gap-2 text-xs sm:text-sm">
            <Dumbbell className="w-3.5 h-3.5" />
            Tests
          </TabsTrigger>
        </TabsList>

        <TabsContent value="parq"><PARQForm /></TabsContent>
        <TabsContent value="mediciones"><MeasurementsForm /></TabsContent>
        <TabsContent value="tests"><FitnessTestsForm /></TabsContent>
      </Tabs>
    </div>
  );
}
