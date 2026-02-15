import { Router } from 'express';
import * as boardController from '../controllers/board.controller';
import * as searchController from '../controllers/search.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireBoardAccess } from '../middlewares/boardAccess.middleware';
import { validateBody, validateParams } from '../middlewares/validation.middleware';
import {
    createBoardSchema,
    updateBoardSchema,
    boardIdParamSchema,
    addMemberSchema,
    memberParamsSchema,
} from '../utils/validators';

const router = Router();

// All board routes require authentication
router.use(authenticate);

// Board search (must come before :boardId to avoid matching "search" as UUID)
router.get('/search', searchController.searchBoards);

// Board CRUD
router.get('/', boardController.listBoards);
router.post('/', validateBody(createBoardSchema), boardController.createBoard);
router.get(
    '/:boardId',
    validateParams(boardIdParamSchema),
    requireBoardAccess(),
    boardController.getBoard
);
router.put(
    '/:boardId',
    validateParams(boardIdParamSchema),
    requireBoardAccess(),
    validateBody(updateBoardSchema),
    boardController.updateBoard
);
router.delete(
    '/:boardId',
    validateParams(boardIdParamSchema),
    requireBoardAccess(),
    boardController.deleteBoard
);

// Members
router.get(
    '/:boardId/members',
    validateParams(boardIdParamSchema),
    requireBoardAccess(),
    boardController.getMembers
);
router.post(
    '/:boardId/members',
    validateParams(boardIdParamSchema),
    requireBoardAccess(),
    validateBody(addMemberSchema),
    boardController.addMember
);
router.delete(
    '/:boardId/members/:userId',
    validateParams(memberParamsSchema),
    requireBoardAccess(),
    boardController.removeMember
);

// Task search within board
router.get(
    '/:boardId/search',
    validateParams(boardIdParamSchema),
    requireBoardAccess(),
    searchController.searchTasks
);

export default router;
