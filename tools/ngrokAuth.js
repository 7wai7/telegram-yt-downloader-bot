import dotenv from "dotenv";
import { execSync } from "node:child_process";

dotenv.config();

execSync(`ngrok config add-authtoken ${process.env.NGROK_TOKEN}`, {
  stdio: "inherit",
});