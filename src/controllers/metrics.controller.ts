import { Request, Response } from 'express';
import * as metricsService from '../services/metrics.service';

export async function getMetrics(req: Request, res: Response) {
  const metrics = await metricsService.getMetrics(req.userId!);
  return res.json(metrics);
}