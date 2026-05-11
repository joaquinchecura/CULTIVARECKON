import { useState } from 'react';
import { entities } from '@/api/entities';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, Upload, Apple, Droplets } from 'lucide-react';

const today = new Date().toISOString().split('T')[0];

const Field = ({ label, value, onChange, placeholder, unit, hint, type = 'number' }) => (
  <div>
    <Label className="flex items-center gap-1">{label} {unit && <span className="text-xs text-muted-foreground">({unit})</span>}</Label>
    {hint && <p className="text-xs text-muted-foreground mb-1">{hint}</p>}
    <Input type={type} step={type === 'number' ? '0.1' : undefined} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="mt-1" />
  </div>
);

export default function MeasurementsForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: profiles } = useQuery({ queryKey: ['profiles'], queryFn: () => entities.UserProfile.list() });
  const { data: assessments } = useQuery({ queryKey: ['assessments'], queryFn: () => entities.PhysicalAssessment.list('-assessment_date', 10) });

  const latest = assessments?.[0];
  const profileId = profiles?.[0]?.id;

  const [form, setForm] = useState({
    assessment_date: today, weight_kg: '', height_cm: '',
    waist_cm: '', hip_cm: '', neck_cm: '', arm_cm: '', thigh_cm: '', calf_cm: '',
    femur_cm: '', tibia_cm: '', humerus_cm: '',
    body_fat_pct: '', muscle_mass_kg: '', visceral_fat: '', bone_mass_kg: '', metabolic_age: '',
    somatotype_endomorphy: '', somatotype_mesomorphy: '', somatotype_ectomorphy: '',
    notes: '',
    skinfold_chest_mm: '', skinfold_abdominal_mm: '', skinfold_thigh_mm: '',
    morning_weight_trend: '',
    water_intake_liters: '', protein_intake_g: '', vegetables_per_day: '',
    processed_meals_per_week: '', intermittent_fasting: false, fasting_schedule: '',
  });

  const [photoFiles, setPhotoFiles] = useState({ front: null, back: null, side: null, face: null });
  const [uploading, setUploading] = useState(false);

  const imc = form.weight_kg && form.height_cm ? (Number(form.weight_kg) / Math.pow(Number(form.height_cm) / 100, 2)).toFixed(1) : '';
  const whr = form.waist_cm && form.hip_cm ? (Number(form.waist_cm) / Number(form.hip_cm)).toFixed(2) : '';

  const estimatedFat = (form.skinfold_chest_mm && form.skinfold_abdominal_mm && form.skinfold_thigh_mm && form.weight_kg)
    ? (() => {
        const sum = Number(form.skinfold_chest_mm) + Number(form.skinfold_abdominal_mm) + Number(form.skinfold_thigh_mm);
        const age = profiles?.[0]?.birth_date ? Math.floor((new Date() - new Date(profiles[0].birth_date)) / (1000 * 60 * 60 * 24 * 365.25)) : 30;
        const bodyDensity = 1.10938 - 0.0008267 * sum + 0.0000016 * sum * sum - 0.0002574 * age;
        const fat = (495 / bodyDensity) - 450;
        return fat > 3 && fat < 60 ? fat.toFixed(1) : '';
      })()
    : '';

  const saveMutation = useMutation({
    mutationFn: (data) => entities.PhysicalAssessment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
      toast({ title: 'Mediciones y nutrición guardadas.' });
    },
  });

  const uploadPhoto = async (file) => {
    const file_url = URL.createObjectURL(file);
    return file_url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    const photoUrls = {};
    if (photoFiles.front) photoUrls.photo_front_url = await uploadPhoto(photoFiles.front);
    if (photoFiles.back) photoUrls.photo_back_url = await uploadPhoto(photoFiles.back);
    if (photoFiles.side) photoUrls.photo_side_url = await uploadPhoto(photoFiles.side);
    if (photoFiles.face) photoUrls.photo_face_url = await uploadPhoto(photoFiles.face);
    setUploading(false);

    const profile = profiles?.[0];
    const chronAge = profile?.birth_date
      ? Math.floor((new Date() - new Date(profile.birth_date)) / (1000 * 60 * 60 * 24 * 365.25))
      : undefined;

    const toNum = (v) => v === '' ? undefined : Number(v);

    saveMutation.mutate({
      user_profile_id: profileId,
      assessment_date: form.assessment_date,
      weight_kg: toNum(form.weight_kg), height_cm: toNum(form.height_cm),
      waist_cm: toNum(form.waist_cm), hip_cm: toNum(form.hip_cm),
      neck_cm: toNum(form.neck_cm), arm_cm: toNum(form.arm_cm),
      thigh_cm: toNum(form.thigh_cm), calf_cm: toNum(form.calf_cm),
      femur_cm: toNum(form.femur_cm), tibia_cm: toNum(form.tibia_cm), humerus_cm: toNum(form.humerus_cm),
      body_fat_pct: toNum(form.body_fat_pct), muscle_mass_kg: toNum(form.muscle_mass_kg),
      visceral_fat: toNum(form.visceral_fat), bone_mass_kg: toNum(form.bone_mass_kg),
      metabolic_age: toNum(form.metabolic_age),
      somatotype_endomorphy: toNum(form.somatotype_endomorphy),
      somatotype_mesomorphy: toNum(form.somatotype_mesomorphy),
      somatotype_ectomorphy: toNum(form.somatotype_ectomorphy),
      notes: form.notes,
      skinfold_chest_mm: toNum(form.skinfold_chest_mm),
      skinfold_abdominal_mm: toNum(form.skinfold_abdominal_mm),
      skinfold_thigh_mm: toNum(form.skinfold_thigh_mm),
      morning_weight_trend: form.morning_weight_trend,
      water_intake_liters: toNum(form.water_intake_liters),
      protein_intake_g: toNum(form.protein_intake_g),
      vegetables_per_day: toNum(form.vegetables_per_day),
      processed_meals_per_week: toNum(form.processed_meals_per_week),
      intermittent_fasting: form.intermittent_fasting,
      fasting_schedule: form.fasting_schedule,
      imc: imc ? Number(imc) : undefined,
      waist_hip_ratio: whr ? Number(whr) : undefined,
      chronological_age: chronAge,
      ...photoUrls,
    });
  };

  const set = (key) => (val) => setForm(f => ({ ...f, [key]: val }));
  const setInput = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="step-card">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label>Fecha de evaluación</Label>
            <Input type="date" value={form.assessment_date} onChange={setInput('assessment_date')} className="mt-1" />
          </div>
          <div className="sm:col-span-1 flex items-end gap-4">
            {imc && (
              <div className="px-3 py-2 bg-secondary rounded-lg text-sm">
                <span className="text-muted-foreground">IMC: </span>
                <span className="font-semibold text-foreground">{imc}</span>
              </div>
            )}
            {whr && (
              <div className="px-3 py-2 bg-secondary rounded-lg text-sm">
                <span className="text-muted-foreground">ICC: </span>
                <span className="font-semibold text-foreground">{whr}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="step-card space-y-4">
        <h2 className="font-semibold text-foreground">Medidas Básicas</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Field label="Peso" unit="kg" value={form.weight_kg} onChange={set('weight_kg')} placeholder="75" />
          <Field label="Altura" unit="cm" value={form.height_cm} onChange={set('height_cm')} placeholder="175" />
        </div>
      </div>

      <div className="step-card space-y-4">
        <h2 className="font-semibold text-foreground">Circunferencias (cm)</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Field label="Cintura" value={form.waist_cm} onChange={set('waist_cm')} placeholder="80" />
          <Field label="Cadera" value={form.hip_cm} onChange={set('hip_cm')} placeholder="95" />
          <Field label="Cuello" value={form.neck_cm} onChange={set('neck_cm')} placeholder="38" />
          <Field label="Brazo" value={form.arm_cm} onChange={set('arm_cm')} placeholder="30" />
          <Field label="Muslo" value={form.thigh_cm} onChange={set('thigh_cm')} placeholder="55" />
          <Field label="Pantorrilla" value={form.calf_cm} onChange={set('calf_cm')} placeholder="38" hint="Nuevo: cambios zonales" />
        </div>
      </div>

      <div className="step-card space-y-4">
        <h2 className="font-semibold text-foreground">Longitudes Óseas (cm)</h2>
        <p className="text-sm text-muted-foreground">Medición de los huesos principales de las extremidades para somatocarta y análisis estructural.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Field label="Fémur" value={form.femur_cm} onChange={set('femur_cm')} placeholder="42" hint="Trocánter mayor a rodilla" />
          <Field label="Tibia" value={form.tibia_cm} onChange={set('tibia_cm')} placeholder="36" hint="Rodilla a maléolo" />
          <Field label="Húmero" value={form.humerus_cm} onChange={set('humerus_cm')} placeholder="32" hint="Hombro a codo" />
        </div>
      </div>

      <div className="step-card space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-foreground">Bioimpedancia (BIA)</h2>
          <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">Opcional</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Field label="% Grasa corporal" value={form.body_fat_pct} onChange={set('body_fat_pct')} placeholder="20" />
          <Field label="Masa muscular" unit="kg" value={form.muscle_mass_kg} onChange={set('muscle_mass_kg')} placeholder="55" />
          <Field label="Grasa visceral" value={form.visceral_fat} onChange={set('visceral_fat')} placeholder="8" />
          <Field label="Masa ósea" unit="kg" value={form.bone_mass_kg} onChange={set('bone_mass_kg')} placeholder="3.2" />
          <Field label="Edad metabólica" value={form.metabolic_age} onChange={set('metabolic_age')} placeholder="32" />
        </div>
      </div>

      <div className="step-card space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-foreground">Somatotipo / Somatocarta</h2>
          <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">Opcional</span>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Field label="Endomorfia" value={form.somatotype_endomorphy} onChange={set('somatotype_endomorphy')} placeholder="3.0" />
          <Field label="Mesomorfia" value={form.somatotype_mesomorphy} onChange={set('somatotype_mesomorphy')} placeholder="4.5" />
          <Field label="Ectomorfia" value={form.somatotype_ectomorphy} onChange={set('somatotype_ectomorphy')} placeholder="2.0" />
        </div>
      </div>

      <div className="step-card space-y-4">
        <h2 className="font-semibold text-foreground">Composición Corporal Casera</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Field label="Pliegue pecho" unit="mm" value={form.skinfold_chest_mm} onChange={set('skinfold_chest_mm')} placeholder="12" hint="Si tenés caliper" />
          <Field label="Pliegue abdominal" unit="mm" value={form.skinfold_abdominal_mm} onChange={set('skinfold_abdominal_mm')} placeholder="18" />
          <Field label="Pliegue muslo" unit="mm" value={form.skinfold_thigh_mm} onChange={set('skinfold_thigh_mm')} placeholder="15" />
          <div className="col-span-2 sm:col-span-3">
            {estimatedFat && (
              <div className="p-3 bg-secondary/50 rounded-lg">
                <p className="text-sm text-muted-foreground">% Grasa estimado por pliegues (Jackson-Pollock):</p>
                <p className="text-xl font-bold text-foreground">{estimatedFat}%</p>
              </div>
            )}
          </div>
          <div className="col-span-2 sm:col-span-3">
            <Label>Peso matutino (tendencia semanal)</Label>
            <Input value={form.morning_weight_trend} onChange={setInput('morning_weight_trend')} placeholder="Ej: 75.2 → 74.8 → 74.5 kg (lunes a domingo)" className="mt-1" />
            <p className="text-xs text-muted-foreground mt-1">Registrá tu peso cada mañana al despertar para ver retención de agua vs grasa</p>
          </div>
        </div>
      </div>

      <div className="step-card space-y-4">
        <h2 className="font-semibold text-foreground">Fotos de Evolución</h2>
        <p className="text-sm text-muted-foreground">Las fotos periódicas permiten visualizar cambios en composición corporal.</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {['front', 'back', 'side', 'face'].map(pos => (
            <div key={pos}>
              <Label className="capitalize">{pos === 'front' ? 'Frente' : pos === 'back' ? 'Espalda' : pos === 'side' ? 'Perfil' : 'Cara'}</Label>
              <label className="mt-1 flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors bg-secondary/30">
                {photoFiles[pos] ? (
                  <span className="text-xs text-primary font-medium">{photoFiles[pos].name.slice(0, 12)}...</span>
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <Upload className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Subir foto</span>
                  </div>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={e => setPhotoFiles(p => ({ ...p, [pos]: e.target.files[0] }))} />
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="step-card space-y-4">
        <h2 className="font-semibold text-foreground flex items-center gap-2">
          <Apple className="w-4 h-4 text-primary" />
          Nutrición e Hidratación
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Droplets className="w-4 h-4 text-blue-500" />
            <div className="flex-1">
              <Label>Ingesta de agua (litros/día)</Label>
              <Input type="number" step="0.1" value={form.water_intake_liters} onChange={setInput('water_intake_liters')} placeholder="2.5" className="mt-1" />
              <p className="text-xs text-muted-foreground mt-1">Hidratación</p>
            </div>
          </div>
          <div>
            <Label>Ingesta de proteína estimada (g/día)</Label>
            <Input type="number" value={form.protein_intake_g} onChange={setInput('protein_intake_g')} placeholder="120" className="mt-1" />
            <p className="text-xs text-muted-foreground mt-1">Síntesis muscular</p>
          </div>
          <div>
            <Label>Porciones de verduras por día</Label>
            <Input type="number" value={form.vegetables_per_day} onChange={setInput('vegetables_per_day')} placeholder="3" className="mt-1" />
            <p className="text-xs text-muted-foreground mt-1">Micronutrientes</p>
          </div>
          <div>
            <Label>Comidas procesadas por semana</Label>
            <Input type="number" value={form.processed_meals_per_week} onChange={setInput('processed_meals_per_week')} placeholder="5" className="mt-1" />
            <p className="text-xs text-muted-foreground mt-1">Calidad de la dieta</p>
          </div>
          <div className="sm:col-span-2 flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
            <input type="checkbox" id="intermittent_fasting" checked={form.intermittent_fasting} onChange={e => set('intermittent_fasting')(e.target.checked)} className="mt-1 rounded border-border" />
            <div>
              <label htmlFor="intermittent_fasting" className="text-sm font-medium text-foreground">Practico ayuno intermitente</label>
              <p className="text-xs text-muted-foreground">Timing nutricional</p>
              {form.intermittent_fasting && (
                <Input value={form.fasting_schedule} onChange={setInput('fasting_schedule')} placeholder="Ej: 16:8 (ayuno 16h, ventana 8h)" className="mt-2 max-w-xs" />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="step-card">
        <Label>Notas generales</Label>
        <Input value={form.notes} onChange={setInput('notes')} placeholder="Observaciones adicionales..." className="mt-1" />
      </div>

      <Button type="submit" disabled={saveMutation.isPending || uploading} className="w-full sm:w-auto">
        <Save className="w-4 h-4 mr-2" />
        {uploading ? 'Subiendo fotos...' : saveMutation.isPending ? 'Guardando...' : 'Guardar Mediciones y Nutrición'}
      </Button>
    </form>
  );
}