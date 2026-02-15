import { Router } from 'express';
import authRoutes from './auth.routes';
import boardRoutes from './board.routes';
import listRoutes from './list.routes';
import taskRoutes from './task.routes';
import activityRoutes from './activity.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/boards', boardRoutes);
router.use('/', listRoutes);    // /boards/:boardId/lists  &  /lists/:listId
router.use('/', taskRoutes);    // /lists/:listId/tasks  &  /tasks/:taskId
router.use('/', activityRoutes); // /boards/:boardId/activities

export default router;
