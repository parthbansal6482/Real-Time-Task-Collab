import { Router } from 'express';
import * as activityController from '../controllers/activity.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireBoardAccess } from '../middlewares/boardAccess.middleware';
import { validateParams } from '../middlewares/validation.middleware';
import { boardIdParamSchema } from '../utils/validators';

const router = Router();

router.use(authenticate);

router.get(
    '/boards/:boardId/activities',
    validateParams(boardIdParamSchema),
    requireBoardAccess(),
    activityController.getActivities
);

export default router;
