import { prisma } from '../prisma';
import { CreateFoodDTO, UpdateFoodDTO } from '../dto/foodDTO';
import { HttpError } from '../middlewares/error.middleware';

export async function listFoods(userId: number, search: string) {
  const trimmedSearch = search.trim();

  return prisma.food.findMany({
    where: {
      userId,
      ...(trimmedSearch
        ? {
            name: {
              contains: trimmedSearch,
              //mode: 'insensitive' (descomentar quando voltar para o postgresql)
            },
          }
        : {}),
    },
    ...(trimmedSearch ? { take: 10 } : {}),
    orderBy: {
      name: 'asc',
    },
  });
}

export async function createFood(userId: number, data: CreateFoodDTO) {
  return prisma.food.create({
    data: {
      name: data.name,
      caloriesPer100g: data.caloriesPer100g,
      carbsPer100g: data.carbsPer100g,
      proteinPer100g: data.proteinPer100g,
      fatPer100g: data.fatPer100g,
      userId,
    },
  });
}

async function findOwnedFood(userId: number, foodId: number) {
  const food = await prisma.food.findFirst({
    where: {
      id: foodId,
      userId,
    },
  });

  if (!food) {
    throw new HttpError(404, 'Alimento não encontrado.');
  }

  return food;
}

export async function deleteFood(userId: number, foodId: number) {
  const food = await findOwnedFood(userId, foodId);

  const usageCount = await prisma.mealFood.count({
    where: { foodId },
  });

  if (usageCount > 0) {
    throw new HttpError(
      409,
      `Este alimento não pode ser excluído porque é usado em ${usageCount} ${
        usageCount === 1 ? 'refeição' : 'refeições'
      }.`,
    );
  }

  await prisma.food.delete({
    where: { id: foodId },
  });
}

export async function updateFood(
  userId: number,
  foodId: number,
  data: UpdateFoodDTO,
) {
  await findOwnedFood(userId, foodId);

  return prisma.food.update({
    where: { id: foodId },
    data: {
      name: data.name,
      caloriesPer100g: data.caloriesPer100g,
      carbsPer100g: data.carbsPer100g,
      proteinPer100g: data.proteinPer100g,
      fatPer100g: data.fatPer100g,
    },
  });
}