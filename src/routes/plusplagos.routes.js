import { Router } from "express";
import { verifyToken } from "../middlewares/verifyToken";
import {
  payProduct,
  SuccessfullPayment,
} from "../controllers/pluspagos.controllers";
const router = Router();

router.post("/encryptData", [verifyToken], payProduct);
router.post("/successfullPayment", [verifyToken], SuccessfullPayment);

export default router;
