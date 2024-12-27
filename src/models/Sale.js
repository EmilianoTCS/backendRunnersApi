import { Schema, model } from "mongoose";

const SaleSchemas = new Schema({
  name: { type: String, required: true },
  race: [{ ref: "Race", type: Schema.Types.ObjectId, required: true }],
  user: [{ ref: "User", type: Schema.Types.ObjectId, required: true }],
  price: { type: Number, required: true },
  saleDate: { type: Date, required: true },
  feesAmount: { type: Number, min: 1, max: 3, required: true, default: 1 },
  discountCode: { type: String, default: "" },
});

export default model("Sale", SaleSchemas);
