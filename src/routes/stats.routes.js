import { Router } from "express";
import { documentCount, HistoricStats } from "../controllers/stats.controllers";
import { verifyToken } from "../middlewares/verifyToken";

const router = Router();

router.get("/getStats", [verifyToken], documentCount);
router.get("/getHistoricStats", [verifyToken], HistoricStats);
export default router;
