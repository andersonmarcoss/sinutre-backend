import { prisma } from '../prisma';
import { SaveProfileDTO } from '../dto/profileDTO';
import { HttpError } from '../middlewares/error.middleware';

export async function getProfile(userId: number) {
  const [healthData, weightLog] = await Promise.all([
    prisma.healthData.findFirst({
      where: { userId, isActive: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.weightLog.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  if (!healthData || !weightLog) {
    return null;
  }

  return {
    targetDietDaily: healthData.targetDietDaily,
    levelActivity: healthData.levelActivity,
    height: weightLog.height,
    weight: weightLog.weight,
  };
}

export async function createProfile(userId: number, data: SaveProfileDTO) {
  const existing = await prisma.healthData.findFirst({
    where: { userId, isActive: true },
  });

  if (existing) {
    throw new HttpError(409, 'Perfil já cadastrado.');
  }

  return prisma.$transaction(async (tx) => {
    const healthData = await tx.healthData.create({
      data: {
        targetDietDaily: data.targetDietDaily,
        levelActivity: data.levelActivity,
        isActive: true,
        userId,
      },
    });

    const weightLog = await tx.weightLog.create({
      data: {
        height: data.height,
        weight: data.weight,
        userId,
      },
    });

    return {
      targetDietDaily: healthData.targetDietDaily,
      levelActivity: healthData.levelActivity,
      height: weightLog.height,
      weight: weightLog.weight,
    };
  });
}