import { useState, useEffect } from 'react';
import { entities } from '@/api/entities';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, Upload, Info } from 'lucide-react';

const today = new Date().toISOString().split('T')[0];

const Field = ({ label, value, onChange, placeholder, unit, hint }) => (
  <div>
    <Label className="flex items-center gap-1">{label} {unit && <span className="text-xs text-muted-foreground">({unit})</span>}</Label>
    {hint && <p className="text-xs text-muted-foreground mb-1">{hint}</p>}
    <Input type="number" step="0.1" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="mt-1" />
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
    waist_cm: '', hip_cm: '', neck_cm: '', arm_cm: '', thigh_cm: '',
    femur_cm: '', tibia_cm: '', humerus_cm: '',
    body_fat_pct: '', muscle_mass_kg: '', visceral_fat: '', bone_mass_kg: '', metabolic_age: '',
    somatotype_endomorphy: '', somatotype_mesomorphy: '', somatotype_ectomorphy: '',
    notes: '',
  });

  const [photoFiles, setPhotoFiles] = useState({ front: null, back: null, side: null, face: null });
  const [uploading, setUploading] = useState(false);

  // Computed fields
  const imc = form.weight_kg && form.height_cm ? (Number(form.weight_kg) / Math.pow(Number(form.height_cm) / 100, 2)).toFixed(1) : '';
  const whr = form.waist_cm && form.hip_cm ? (Number(form.waist_cm) / Number(form.hip_cm)).toFixed(2) : '';

  const saveMutation = useMutation({
    mutationFn: (data) => entities.PhysicalAssessment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
      toast({ title: 'Mediciones guardadas.' });
    },
  });

  const uploadPhoto = async (file) => {
    const { file_url } = await entities.integrations.Core.UploadFile({ file });
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

    saveMutation.mutate({
      user_profile_id: profileId,
      ...Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v === '' ? undefined : isNaN(v) ? v : Number(v)])),
      imc: imc ? Number(imc) : undefined,
      waist_hip_ratio: whr ? Number(whr) : undefined,
      chronological_age: chronAge,
      ...photoUrls,
    });
  };

  const set = (key) => (val) => setForm(f => ({ ...f, [key]: val }));

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Date */}
      <div className="step-card">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label>Fecha de evaluación</Label>
            <Input type="date" value={form.assessment_date} onChange={e => setForm(f => ({ ...f, assessment_date: e.target.value }))} className="mt-1" />
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

      {/* Basic */}
      <div className="step-card space-y-4">
        <h2 className="font-semibold text-foreground">Medidas Básicas</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Field label="Peso" unit="kg" value={form.weight_kg} onChange={set('weight_kg')} placeholder="75" />
          <Field label="Altura" unit="cm" value={form.height_cm} onChange={set('height_cm')} placeholder="175" />
        </div>
      </div>

      {/* Circumferences */}
      <div className="step-card space-y-4">
        <h2 className="font-semibold text-foreground">Circunferencias (cm)</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Field label="Cintura" value={form.waist_cm} onChange={set('waist_cm')} placeholder="80" />
          <Field label="Cadera" value={form.hip_cm} onChange={set('hip_cm')} placeholder="95" />
          <Field label="Cuello" value={form.neck_cm} onChange={set('neck_cm')} placeholder="38" />
          <Field label="Brazo" value={form.arm_cm} onChange={set('arm_cm')} placeholder="30" />
          <Field label="Muslo" value={form.thigh_cm} onChange={set('thigh_cm')} placeholder="55" />
        </div>
      </div>

      {/* Bone lengths */}
      <div className="step-card space-y-4">
        <h2 className="font-semibold text-foreground">Longitudes Óseas (cm)</h2>
        <p className="text-sm text-muted-foreground">Medición de los huesos principales de las extremidades para somatocarta y análisis estructural.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Field label="Fémur" value={form.femur_cm} onChange={set('femur_cm')} placeholder="42" hint="Trocánter mayor a rodilla" />
          <Field label="Tibia" value={form.tibia_cm} onChange={set('tibia_cm')} placeholder="36" hint="Rodilla a maléolo" />
          <Field label="Húmero" value={form.humerus_cm} onChange={set('humerus_cm')} placeholder="32" hint="Hombro a codo" />
        </div>
      </div>

      {/* BIA */}
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

      {/* Somatotype */}
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

      {/* Photos */}
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

      <Button type="submit" disabled={saveMutation.isPending || uploading}>
        <Save className="w-4 h-4 mr-2" />
        {uploading ? 'Subiendo fotos...' : saveMutation.isPending ? 'Guardando...' : 'Guardar Mediciones'}
      </Button>
    </form>
  );
}
