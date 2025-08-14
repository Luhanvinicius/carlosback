import { Router } from "express";
import { gerarCardPartida } from "../controllers/cardController";

const router = Router();
router.get("/partida/:id", gerarCardPartida);

export default router;