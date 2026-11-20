import { prisma } from '../prisma';
import { CreateFoodDTO } from '../dto/foodDTO';

export async function listFoods(userId: number, search: string) {
  return prisma.food.findMany({
    where: {
      userId,
      name: {
        contains: search,
      },
    },
    take: 10,
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