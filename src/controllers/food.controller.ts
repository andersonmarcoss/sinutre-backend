import { Request, Response } from 'express';
import * as foodService from '../services/food.service';
import { parsePositiveId } from '../utils/parseId';
import { validateFood } from '../validation/food.validation';

export async function listFoods(req: Request, res: Response) {
  const search = String(req.query.search ?? '');
  const foods = await foodService.listFoods(req.userId!, search);
  return res.json(foods);
}

export async function createFood(req: Request, res: Response) {
  const data = validateFood(req.body);
  const food = await foodService.createFood(req.userId!, data);
  return res.status(201).json(food);
}

export async function updateFood(req: Request, res: Response) {
  const foodId = parsePositiveId(req.params.id, 'ID do alimento');
  const data = validateFood(req.body);
  const food = await foodService.updateFood(req.userId!, foodId, data);
  return res.json(food);
}

export async function deleteFood(req: Request, res: Response) {
  const foodId = parsePositiveId(req.params.id, 'ID do alimento');
  await foodService.deleteFood(req.userId!, foodId);
  return res.sendStatus(204);
}