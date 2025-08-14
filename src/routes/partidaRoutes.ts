import { Router } from 'express';
import { criarPartida, listarPartidas, atualizarPlacar, gerarCardPartida } from '../controllers/partidaController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.post('/criarPartida', authenticateToken, criarPartida);
router.get('/listarPartidas', authenticateToken, listarPartidas);
router.put('/atualizarPlacar/:id/placar', atualizarPlacar);
router.get('/cardPromocional/:id/card', gerarCardPartida);

export default router;