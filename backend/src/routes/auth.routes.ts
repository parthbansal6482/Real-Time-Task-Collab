import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validation.middleware';
import {
    signupSchema,
    loginSchema,
    updateProfileSchema,
    updatePasswordSchema
} from '../utils/validators';

const router = Router();

router.post('/signup', validateBody(signupSchema), authController.signup);
router.post('/login', validateBody(loginSchema), authController.login);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.getMe);
router.get('/users', authenticate, authController.getUsers);
router.put('/profile', authenticate, validateBody(updateProfileSchema), authController.updateProfile);
router.put('/password', authenticate, validateBody(updatePasswordSchema), authController.updatePassword);

export default router;
