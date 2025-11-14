// src/routes/userRoutes.ts
import { Router } from "express";
import { create, list, atualizarPerfil, getUsuarioLogado } from "../controllers/userController";
import { authMiddleware } from "../middleware/auth";      // ✅ use o comutável BASIC/JWT
import { requireRole } from "../middleware/roleMiddleware";

const router = Router();

router.post("/create", create);

// Qualquer autenticado pode atualizar o próprio perfil
router.put("/perfil", authMiddleware(), requireRole("ADMIN", "USER"), atualizarPerfil);

// Se quiser realmente **apenas ADMIN**, mantenha só ADMIN (o comentário dizia isso)
router.get("/list", authMiddleware(), requireRole("ADMIN"), list);

// Retorna o usuário logado
router.get("/getUsuarioLogado", authMiddleware(), getUsuarioLogado);

export default router;
