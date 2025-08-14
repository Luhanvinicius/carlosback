import { Router } from 'express';
import { criarAtleta, listarAtletas, listarAtletasPaginados, atualizarAtleta, alterarFotoAtleta, verificarAtletaUsuario} from '../controllers/atletaController';
import { authenticateToken } from '../middleware/authMiddleware';
import { upload } from '../config/multerConfig';
import { requireRole } from '../middleware/roleMiddleware';
import { autorizaEdicaoAtleta } from '../middleware/autorizaEdicaoAtleta';

console.log('autorizaEdicaoAtleta', typeof autorizaEdicaoAtleta);
const router = Router();

 router.post('/criarAtleta', authenticateToken, upload.single('foto'), criarAtleta);

 router.get(
  '/listarAtletas',
  authenticateToken,
  requireRole('ADMIN','USER'), // ← apenas administradores podem listar usuários
  listarAtletas); 

 router.put('/altera/:id', 
    authenticateToken, 
    autorizaEdicaoAtleta, 
    atualizarAtleta); 

  router.put('/alterafoto/:id/foto',
  authenticateToken,
  autorizaEdicaoAtleta,
  upload.single('foto'),
  alterarFotoAtleta);

   router.get(
  '/listarAtletasPaginados',
  authenticateToken,
  requireRole('ADMIN','USER'), // ← apenas administradores podem listar usuários
  listarAtletasPaginados); 

  router.get('/me/atleta', authenticateToken, verificarAtletaUsuario); // ← nova rota

export default router;
