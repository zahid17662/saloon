// Local development reads backend/.env.local; on a host the variables come from the environment.
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });
