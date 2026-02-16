import { Router } from 'express';
import * as taskController from '../controllers/task.controller';
import * as commentController from '../controllers/comment.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireBoardAccess } from '../middlewares/boardAccess.middleware';
import { validateBody, validateParams } from '../middlewares/validation.middleware';
import {
    createTaskSchema,
    updateTaskSchema,
    moveTaskSchema,
    assignTaskSchema,
    createCommentSchema,
    listIdParamSchema,
    taskIdParamSchema,
} from '../utils/validators';

const router = Router();

router.use(authenticate);

// List-scoped task routes
router.get(
    '/lists/:listId/tasks',
    validateParams(listIdParamSchema),
    requireBoardAccess(),
    taskController.getTasksByList
);

router.post(
    '/lists/:listId/tasks',
    validateParams(listIdParamSchema),
    requireBoardAccess(),
    validateBody(createTaskSchema),
    taskController.createTask
);

// Task-specific routes
router.get(
    '/tasks/:taskId',
    validateParams(taskIdParamSchema),
    requireBoardAccess(),
    taskController.getTask
);

router.put(
    '/tasks/:taskId',
    validateParams(taskIdParamSchema),
    requireBoardAccess(),
    validateBody(updateTaskSchema),
    taskController.updateTask
);

router.delete(
    '/tasks/:taskId',
    validateParams(taskIdParamSchema),
    requireBoardAccess(),
    taskController.deleteTask
);

router.put(
    '/tasks/:taskId/move',
    validateParams(taskIdParamSchema),
    requireBoardAccess(),
    validateBody(moveTaskSchema),
    taskController.moveTask
);

router.post(
    '/tasks/:taskId/assign',
    validateParams(taskIdParamSchema),
    requireBoardAccess(),
    validateBody(assignTaskSchema),
    taskController.assignUser
);

router.delete(
    '/tasks/:taskId/assign/:userId',
    validateParams(taskIdParamSchema),
    requireBoardAccess(),
    taskController.unassignUser
);

// Comment routes
router.get(
    '/tasks/:taskId/comments',
    validateParams(taskIdParamSchema),
    requireBoardAccess(),
    commentController.getComments
);

router.post(
    '/tasks/:taskId/comments',
    validateParams(taskIdParamSchema),
    requireBoardAccess(),
    validateBody(createCommentSchema),
    commentController.createComment
);

export default router;
