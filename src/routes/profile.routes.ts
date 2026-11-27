import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import { asyncHandler } from '../middlewares/error.middleware';
import { createProfile, getProfile, updateProfile } from '../controllers/profile.controller';

export const profileRoutes = Router();

profileRoutes.get('/', requireAuth, asyncHandler(getProfile));
profileRoutes.post('/', requireAuth, asyncHandler(createProfile));
profileRoutes.put('/', requireAuth, asyncHandler(updateProfile));