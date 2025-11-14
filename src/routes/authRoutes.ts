// src/routes/authRoutes.ts
import { Router } from 'express';
import { register } from '../controllers/authController';
import { login } from '../controllers/loginController';
import { me } from '../controllers/meController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Públicas
router.post('/login', login);
router.post('/register', register);

// Privada: retorna o usuário da sessão atual (BASIC ou JWT)
router.get('/me', authMiddleware(), me);

export default router;
