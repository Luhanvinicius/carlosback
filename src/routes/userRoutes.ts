import { Router } from 'express';
import { create, list, atualizarPerfil, getUsuarioLogado } from '../controllers/userController';
import { authenticateToken } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleMiddleware';


const router = Router();

router.post('/create', create);
router.put('/perfil', authenticateToken, requireRole('ADMIN','USER'), atualizarPerfil);
router.get(
  '/list',
  authenticateToken,
  requireRole('ADMIN','USER'), // ← apenas administradores podem listar usuários
  list
); 

router.get(
  '/getUsuarioLogado',
  authenticateToken,
  getUsuarioLogado
); 





export default router;