import { Request, Response } from 'express';
import * as foodService from '../services/food.service';
import { parsePositiveId } from '../utils/parseId';

export async function listFoods(req: Request, res: Response) {
  const search = String(req.query.search ?? '');
  const foods = await foodService.listFoods(req.userId!, search);
  return res.json(foods);
}

export async function createFood(req: Request, res: Response) {
  const food = await foodService.createFood(req.userId!, req.body);
  return res.status(201).json(food);
}

export async function deleteFood(req: Request, res: Response) {
  const foodId = parsePositiveId(req.params.id, 'ID do alimento');
  await foodService.deleteFood(req.userId!, foodId);
  return res.sendStatus(204);
}