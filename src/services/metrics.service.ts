import { prisma } from '../prisma';
import * as profileService from './profile.service';

export type BmiStatus = 'info' | 'success' | 'warning' | 'error';
export type GoalRelationStatus = 'below' | 'on_target' | 'above';

const MS_PER_MINUTE = 60_000;
const MS_PER_DAY = 86_400_000;

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

export interface DailyCaloriesItem {
  date: string; // YYYY-MM-DD no fuso do usuário
  calories: number;
}

export interface GoalRelation {
  percent: number;
  difference: number;
  status: GoalRelationStatus;
  label: string;
}

export interface WeeklyCaloriesMetrics {
  days: DailyCaloriesItem[];
  totalCalories: number;
  daysWithMeals: number;
  averageCalories: number | null;
  goal: number | null;
  goalRelation: GoalRelation | null;
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

function classifyGoalRelation(average: number, goal: number): GoalRelation {
  const percent = (average / goal) * 100;
  const difference = average - goal;

  if (percent < 90) {
    return { percent, difference, status: 'below', label: 'Abaixo da meta' };
  }
  if (percent <= 110) {
    return { percent, difference, status: 'on_target', label: 'Dentro da meta' };
  }
  return { percent, difference, status: 'above', label: 'Acima da meta' };
}

async function calculateWeeklyCalories(
  userId: number,
  tzOffsetMinutes: number,
  goal: number | null,
): Promise<WeeklyCaloriesMetrics> {
  const offsetMs = tzOffsetMinutes * MS_PER_MINUTE;
  const localNow = new Date(Date.now() - offsetMs);

  // Meia-noite de "hoje" no relógio local do usuário
  const todayLocalMidnightMs = Date.UTC(
    localNow.getUTCFullYear(),
    localNow.getUTCMonth(),
    localNow.getUTCDate(),
  );

  // Janela exata de 7 dias: hoje + 6 dias anteriores (não 8!)
  const startLocalMs = todayLocalMidnightMs - 6 * MS_PER_DAY;
  const endLocalMs = todayLocalMidnightMs + MS_PER_DAY - 1;

  const startUtc = new Date(startLocalMs + offsetMs);
  const endUtc = new Date(endLocalMs + offsetMs);

  const dayMap = new Map<string, number>();
  for (let i = 6; i >= 0; i--) {
    const key = new Date(todayLocalMidnightMs - i * MS_PER_DAY)
      .toISOString()
      .slice(0, 10);
    dayMap.set(key, 0);
  }

  const meals = await prisma.meal.findMany({
    where: {
      userId,
      eatTime: {
        gte: startUtc,
        lte: endUtc,
      },
    },
    include: {
      foods: true,
    },
  });

  const daysWithMealsSet = new Set<string>();
  let totalCalories = 0;

  for (const meal of meals) {
    const dayKey = new Date(meal.eatTime.getTime() - offsetMs)
      .toISOString()
      .slice(0, 10);

    if (!dayMap.has(dayKey)) continue;

    const mealCalories = meal.foods.reduce(
      (sum, item) => sum + item.calories,
      0,
    );

    dayMap.set(dayKey, (dayMap.get(dayKey) ?? 0) + mealCalories);
    daysWithMealsSet.add(dayKey);
    totalCalories += mealCalories;
  }

  const days: DailyCaloriesItem[] = Array.from(dayMap, ([date, calories]) => ({
    date,
    calories,
  }));

  const daysWithMeals = daysWithMealsSet.size;
  const averageCalories =
    daysWithMeals > 0 ? totalCalories / daysWithMeals : null;

  const goalRelation =
    averageCalories !== null && goal !== null
      ? classifyGoalRelation(averageCalories, goal)
      : null;

  return {
    days,
    totalCalories,
    daysWithMeals,
    averageCalories,
    goal,
    goalRelation,
  };
}

export async function getMetrics(userId: number, tzOffsetMinutes = 0) {
  const profile = await profileService.getProfile(userId);
  const weeklyCalories = await calculateWeeklyCalories(
    userId,
    tzOffsetMinutes,
    profile?.targetDietDaily ?? null,
  );

  return {
    bmi: profile ? calculateBmi(profile.height, profile.weight) : null,
    weeklyCalories,
  };
}