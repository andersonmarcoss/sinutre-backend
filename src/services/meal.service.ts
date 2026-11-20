import { prisma } from '../prisma';
import { CreateMealDTO } from '../dto/mealDTO';
import { MealSummaryDTO } from '../dto/mealSummaryDTO';
import { HttpError } from '../middlewares/error.middleware';

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
        const factor = item.foodG / 100;
        acc.grams += item.foodG;
        acc.calories += item.food.caloriesPer100g * factor;
        acc.carbs += item.food.carbsPer100g * factor;
        acc.proteins += item.food.proteinPer100g * factor;
        acc.fats += item.food.fatPer100g * factor;
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

  return prisma.$transaction(async (tx) => {
    const foods = await tx.food.findMany({
      where: {
        id: { in: items.map((i) => i.foodId) },
        userId,
      },
    });

    if (foods.length !== items.length) {
      throw new HttpError(404, 'Alimento não encontrado.');
    }

    const meal = await tx.meal.create({
      data: {
        type,
        eatTime: new Date(eatTime),
        description,
        userId,
      },
    });

    await tx.mealFood.createMany({
      data: items.map((item) => {
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