import { Request, Response } from 'express';
import { HttpError } from '../middlewares/error.middleware';
import * as metricsService from '../services/metrics.service';

export async function getMetrics(req: Request, res: Response) {
  const rawTz = req.query.tzOffset;
  const tzOffset = rawTz !== undefined ? Number(rawTz) : 0;

  if (!Number.isFinite(tzOffset) || tzOffset < -840 || tzOffset > 840) {
    throw new HttpError(400, 'Fuso horário inválido.');
  }

  const metrics = await metricsService.getMetrics(req.userId!, tzOffset);
  return res.json(metrics);
}