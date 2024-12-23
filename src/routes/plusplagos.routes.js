import { Router } from "express";
import { verifyToken } from "../middlewares/verifyToken";
import { payProduct } from "../controllers/pluspagos.controllers";
const router = Router();

router.post("/encryptData", [verifyToken], payProduct);

export default router;
