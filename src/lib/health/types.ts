// Shared row types for the health dashboard (mirror the Supabase health_* tables).

export type WeightRow = {
  id: string;
  measured_on: string;
  measured_at: string | null;
  weight_lbs: number;
  body_fat_pct: number | null;
  bmi: number | null;
  fat_free_lbs: number | null;
  subcutaneous_fat_pct: number | null;
  visceral_fat: number | null;
  body_water_pct: number | null;
  skeletal_muscle_pct: number | null;
  muscle_mass_lbs: number | null;
  bone_mass_lbs: number | null;
  protein_pct: number | null;
  bmr_kcal: number | null;
  metabolic_age: number | null;
  note: string | null;
};

export type StepRow = {
  id: string;
  measured_on: string;
  steps: number;
  distance_km: number | null;
  source: string | null;
  note?: string | null;
};

export type WorkoutRow = {
  id: string;
  workout_type: string | null;
  started_at: string | null;
  ended_at: string | null;
  duration_min: number | null;
  active_kcal: number | null;
  distance_km: number | null;
  avg_hr: number | null;
  max_hr: number | null;
  steps: number | null;
};

export type SleepRow = {
  id: string;
  measured_on: string;
  total_hours: number;
  deep_hours: number | null;
  rem_hours: number | null;
  light_hours?: number | null;
  awake_hours?: number | null;
  resting_hr: number | null;
  hrv_ms: number | null;
  sleep_score: number | null;
  note: string | null;
};

export type BloodRow = {
  id: string;
  drawn_on: string;
  marker: string;
  value: number;
  unit: string | null;
  ref_low: number | null;
  ref_high: number | null;
  lab?: string | null;
  note?: string | null;
};

export type StrengthRow = {
  id: string;
  performed_on: string;
  exercise: string;
  muscle_group: string | null;
  sets: number;
  reps: number | null;
  weight_lbs: number | null;
  rir: number | null;
  duration_min: number | null;
  note: string | null;
};

export type NutritionRow = {
  id: string;
  eaten_on: string;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  fiber_g: number | null;
  meals: number | null;
  restaurant: boolean | null;
  hunger: number | null;
  fullness: number | null;
  planned: boolean | null;
  note: string | null;
};

export type VitalsRow = {
  id: string;
  measured_on: string;
  resting_hr: number | null;
  hrv_ms: number | null;
  cardio_recovery: number | null;
  walking_hr_avg: number | null;
  source?: string | null;
};

export type ExperimentRow = {
  id: string;
  name: string;
  hypothesis: string | null;
  metric: string | null;
  started_on: string;
  ended_on: string | null;
  status: string;
  result: string | null;
  note: string | null;
};

export const MUSCLE_GROUPS = [
  "Chest",
  "Back",
  "Shoulders",
  "Legs",
  "Arms",
  "Core",
  "Full Body",
] as const;
export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];
