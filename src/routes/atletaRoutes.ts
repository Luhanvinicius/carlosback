// src/routes/atletaRoutes.ts
import { Router } from "express";
import {
  criarAtleta,
  listarAtletas,
  listarAtletasPaginados,
  atualizarAtleta,
  alterarFotoAtleta,
  verificarAtletaUsuario,
} from "../controllers/atletaController";
import { authenticateToken } from "../middleware/authMiddleware";
import { upload } from "../config/multerConfig";
import { requireRole } from "../middleware/roleMiddleware";
import { autorizaEdicaoAtleta } from "../middleware/autorizaEdicaoAtleta";

const router = Router();

/**
 * IMPORTANTE p/ BASIC:
 * - authenticateToken já suporta BASIC/JWT e injeta req.usuario
 * - requireRole/autorizaEdicaoAtleta DEVEM ler req.usuario (sem decodificar JWT)
 */

// ---------- Criar atleta ----------
router.post(
  "/criar",
  authenticateToken,
  upload.single("foto"),
  criarAtleta
);
// alias antigo
router.post(
  "/criarAtleta",
  authenticateToken,
  upload.single("foto"),
  criarAtleta
);

// ---------- Listagens ----------
router.get(
  "/listarAtletas",
  authenticateToken,
  requireRole("ADMIN", "USER"),
  listarAtletas
);

router.get(
  "/listarAtletasPaginados",
  authenticateToken,
  requireRole("ADMIN", "USER"),
  listarAtletasPaginados
);

// ---------- Atualizar atleta ----------
router.put(
  "/altera/:id",
  authenticateToken,
  autorizaEdicaoAtleta,
  atualizarAtleta
);

// ---------- Atualizar foto ----------
router.post(
  "/:id/foto",
  authenticateToken,
  autorizaEdicaoAtleta,
  upload.single("foto"),
  alterarFotoAtleta
);
// alias antigo
router.put(
  "/alterafoto/:id/foto",
  authenticateToken,
  autorizaEdicaoAtleta,
  upload.single("foto"),
  alterarFotoAtleta
);

// ---------- Atleta do usuário logado ----------
router.get("/me/atleta", authenticateToken, verificarAtletaUsuario);

export default router;
