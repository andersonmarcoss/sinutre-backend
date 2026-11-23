import { prisma } from '../prisma';
import { CreateMealDTO } from '../dto/mealDTO';
import { MealSummaryDTO } from '../dto/mealSummaryDTO';
import { HttpError } from '../middlewares/error.middleware';
import { MEAL_CHOICES, MealChoice } from '../constants/enums';

export async function listMeals(userId: number): Promise<MealSummaryDTO[]> {
  const meals = await prisma.meal.findMany({
    where: { userId },
    include: {
      foods: {
        include: {
          food: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return meals.map((meal) => {
    const totals = meal.foods.reduce(
      (acc, item) => {
        acc.grams += item.foodG;
        acc.calories += item.calories;
        acc.carbs += item.carbs;
        acc.proteins += item.protein;
        acc.fats += item.fat;
        return acc;
      },
      { grams: 0, calories: 0, carbs: 0, proteins: 0, fats: 0 },
    );

    return {
      id: meal.id,
      name: meal.description,
      type: meal.type,
      createdAt: meal.createdAt,
      eatTime: meal.eatTime,
      totals,
      items: meal.foods,
    };
  });
}

export async function createMeal(userId: number, data: CreateMealDTO) {
  const { type, eatTime, description, items } = data;

  if (!MEAL_CHOICES.includes(type as MealChoice)) {
    throw new HttpError(400, 'Categoria de refeição inválida.');
  }

  const parsedEatTime = new Date(eatTime);
  if (!eatTime || Number.isNaN(parsedEatTime.getTime())) {
    throw new HttpError(400, 'Data e horário da refeição são obrigatórios.');
  }

  if (!Array.isArray(items) || items.length === 0) {
    throw new HttpError(400, 'Adicione pelo menos um alimento à refeição.');
  }

  const gramsByFoodId = new Map<number, number>();
  for (const item of items) {
    if (!Number.isInteger(item.foodId) || item.foodId <= 0) {
      throw new HttpError(400, 'Alimento inválido na lista de itens.');
    }
    if (typeof item.grams !== 'number' || !Number.isFinite(item.grams) || item.grams <= 0) {
      throw new HttpError(400, 'A quantidade em gramas deve ser maior que zero.');
    }
    gramsByFoodId.set(
      item.foodId,
      (gramsByFoodId.get(item.foodId) ?? 0) + item.grams,
    );
  }

  const uniqueItems = Array.from(gramsByFoodId, ([foodId, grams]) => ({
    foodId,
    grams,
  }));

  return prisma.$transaction(async (tx) => {
    const foods = await tx.food.findMany({
      where: {
        id: { in: uniqueItems.map((i) => i.foodId) },
        userId,
      },
    });

    if (foods.length !== uniqueItems.length) {
      throw new HttpError(404, 'Alimento não encontrado.');
    }

    const meal = await tx.meal.create({
      data: {
        type,
        eatTime: parsedEatTime,
        description: description?.trim() || null,
        userId,
      },
    });

    await tx.mealFood.createMany({
      data: uniqueItems.map((item) => {
        const food = foods.find((f) => f.id === item.foodId)!;
        return {
          mealId: meal.id,
          foodId: food.id,
          foodG: item.grams,
          calories: (food.caloriesPer100g * item.grams) / 100,
          carbs: (food.carbsPer100g * item.grams) / 100,
          protein: (food.proteinPer100g * item.grams) / 100,
          fat: (food.fatPer100g * item.grams) / 100,
        };
      }),
    });

    return meal;
  });
}