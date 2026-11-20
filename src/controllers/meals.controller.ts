import { Request, Response } from 'express';
import * as mealService from '../services/meal.service';

export async function listMeals(req: Request, res: Response) {
  const meals = await mealService.listMeals(req.userId!);
  return res.json(meals);
}

export async function createMeal(req: Request, res: Response) {
  const meal = await mealService.createMeal(req.userId!, req.body);
  return res.status(201).json(meal);
}