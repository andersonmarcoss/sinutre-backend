import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import { asyncHandler } from '../middlewares/error.middleware';
import { listFoods, createFood, deleteFood, updateFood } from '../controllers/food.controller';

export const foodRouter = Router();

foodRouter.get('/', requireAuth, asyncHandler(listFoods));
foodRouter.post('/', requireAuth, asyncHandler(createFood));
foodRouter.delete('/:id', requireAuth, asyncHandler(deleteFood));
foodRouter.put('/:id', requireAuth, asyncHandler(updateFood));