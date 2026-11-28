import * as profileService from './profile.service';

export type BmiStatus = 'info' | 'success' | 'warning' | 'error';

const BMI_CATEGORIES: readonly {
  max: number;
  label: string;
  status: BmiStatus;
}[] = [
  { max: 18.5, label: 'Abaixo do peso', status: 'info' },
  { max: 25, label: 'Peso normal', status: 'success' },
  { max: 30, label: 'Sobrepeso', status: 'warning' },
  { max: 35, label: 'Obesidade grau I', status: 'error' },
  { max: 40, label: 'Obesidade grau II', status: 'error' },
  { max: Infinity, label: 'Obesidade grau III', status: 'error' },
];

export interface BmiMetrics {
  value: number;
  category: string;
  status: BmiStatus;
  height: number;
  weight: number;
}

function calculateBmi(heightCm: number, weightKg: number): BmiMetrics {
  const heightM = heightCm / 100;
  const value = weightKg / (heightM * heightM);
  const matched = BMI_CATEGORIES.find((item) => value < item.max)!;

  return {
    value,
    category: matched.label,
    status: matched.status,
    height: heightCm,
    weight: weightKg,
  };
}

export async function getMetrics(userId: number) {
  const profile = await profileService.getProfile(userId);

  return {
    bmi: profile ? calculateBmi(profile.height, profile.weight) : null,
  };
}