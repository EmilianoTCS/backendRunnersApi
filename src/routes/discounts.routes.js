import { Router } from "express";
import {
  applyDiscountCode,
  generateDiscountCodes,
  getAllDiscountCodes,
  getDiscountCodeDetails,
  createNewDiscountCode,
} from "../controllers/discount.controllers";

import { verifyToken, isAdmin } from "../middlewares/verifyToken";
const router = Router();

router.get("/getAllDiscountCodes", [verifyToken, isAdmin], getAllDiscountCodes);
router.post(
  "/createDiscountCode",
  [verifyToken, isAdmin],
  createNewDiscountCode
);

router.get("/getDiscountCode/:code", getDiscountCodeDetails);

router.post(
  "/createDiscountCodes",
  [verifyToken, isAdmin],
  generateDiscountCodes
);

router.post("/applyDiscountCode/:id", verifyToken, applyDiscountCode);

export default router;
