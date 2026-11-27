import { Request, Response } from 'express';
import * as profileService from '../services/profile.service';
import { validateProfile } from '../validation/profile.validation';

export async function getProfile(req: Request, res: Response) {
  const profile = await profileService.getProfile(req.userId!);
  return res.json(profile);
}

export async function createProfile(req: Request, res: Response) {
  const data = validateProfile(req.body);
  const profile = await profileService.createProfile(req.userId!, data);
  return res.status(201).json(profile);
}