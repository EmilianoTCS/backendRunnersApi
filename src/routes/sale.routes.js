import { Router } from "express";
import { createSale, getSales, updateSaleAndFees } from "../controllers/sale.controllers";

import { verifyToken } from "../middlewares/verifyToken";

const router = Router();

router.post("/createSale", [verifyToken], createSale);
router.post("/getSale", [verifyToken], getSales);
router.post("/updateSaleAndFees/:saleId", [verifyToken], updateSaleAndFees);

export default router;
