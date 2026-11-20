export interface MealTotalsDTO {
  grams: number;
  calories: number;
  carbs: number;
  proteins: number;
  fats: number;
}

export interface MealSummaryDTO {
  id: number;
  name: string | null;
  type: string;
  createdAt: Date;
  eatTime: Date;
  totals: MealTotalsDTO;
  items: unknown[];
}