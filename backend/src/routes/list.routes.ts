import { Router } from 'express';
import * as listController from '../controllers/list.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireBoardAccess } from '../middlewares/boardAccess.middleware';
import { validateBody, validateParams } from '../middlewares/validation.middleware';
import {
    createListSchema,
    updateListSchema,
    boardIdParamSchema,
    listIdParamSchema,
} from '../utils/validators';

const router = Router();

router.use(authenticate);

// Board-scoped list routes
router.get(
    '/boards/:boardId/lists',
    validateParams(boardIdParamSchema),
    requireBoardAccess(),
    listController.getListsByBoard
);

router.post(
    '/boards/:boardId/lists',
    validateParams(boardIdParamSchema),
    requireBoardAccess(),
    validateBody(createListSchema),
    listController.createList
);

// List-specific routes
router.put(
    '/lists/:listId',
    validateParams(listIdParamSchema),
    requireBoardAccess(), // infers boardId from listId
    validateBody(updateListSchema),
    listController.updateList
);

router.delete(
    '/lists/:listId',
    validateParams(listIdParamSchema),
    requireBoardAccess(),
    listController.deleteList
);

export default router;
