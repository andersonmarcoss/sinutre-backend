import { Request, Response } from 'express';
import { env } from '../config/env';
import { HttpError } from '../middlewares/error.middleware';
import * as authService from '../services/auth.service';

export function redirectToGithub(_req: Request, res: Response) {
  res.redirect(authService.getGithubAuthorizeUrl());
}

export async function githubCallback(req: Request, res: Response) {
  const code = req.query.code as string | undefined;
  if (!code) {
    throw new HttpError(400, 'Parâmetro "code" ausente.');
  }

  const token = await authService.authenticateWithGithubCode(code);
  res.redirect(`${env.frontendUrl}/?token=${token}`);
}

export async function me(req: Request, res: Response) {
  const user = await authService.getUserProfileSummary(req.userId!);
  return res.json(user);
}