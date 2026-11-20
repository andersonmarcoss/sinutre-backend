import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import { asyncHandler } from '../middlewares/error.middleware';
import {
  redirectToGithub,
  githubCallback,
  me,
} from '../controllers/auth.controller';

export const authRoutes = Router();

authRoutes.get('/github', redirectToGithub);
authRoutes.get('/github/callback', asyncHandler(githubCallback));
authRoutes.get('/me', requireAuth, asyncHandler(me));