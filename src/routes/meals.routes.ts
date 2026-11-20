import { Router } from 'express';
import { createMeal, listMeals } from '../controllers/meals.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { asyncHandler } from '../middlewares/error.middleware';

export const mealsRoutes = Router();

mealsRoutes.post('/', requireAuth, asyncHandler(createMeal));
mealsRoutes.get('/', requireAuth, asyncHandler(listMeals));