import { Router } from 'express';
import { register } from '../controllers/authController';
import { login } from '../controllers/loginController';

const router = Router();

router.post('/login', login);
router.post('/register', register);


export default router;