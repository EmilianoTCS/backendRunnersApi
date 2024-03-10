import express from "express";
import { config } from "dotenv";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import raceRoutes from "./routes/race.routes";
import discountRoutes from "./routes/discounts.routes";
import saleRoutes from "./routes/sale.routes";
import feeRoutes from "./routes/fee.routes";
import bodyParser from "body-parser";
import mpRoutes from "./routes/mp.routes";
import { createRoles } from "./libs/initialSetup";
import teamRoutes from "./routes/team.routes";
import teamMembersRoutes from "./routes/teamMembers.routes";
import statsRoutes from "./routes/stats.routes";
import cors from "cors";


const app = express();
createRoles();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.set("port", process.env.PORT || 3000);

app.use(cors());

app.get("/", (req, res) => {
  res.json({ message: "APP PRODUCTIVA" });
});
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/races", raceRoutes);
app.use("/api/discounts", discountRoutes);
app.use("/api/sales", saleRoutes);
app.use("/api/fees", feeRoutes);
app.use("/api/payment", mpRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/teamMembers", teamMembersRoutes);
app.use("/api/stats", statsRoutes);

export default app;
