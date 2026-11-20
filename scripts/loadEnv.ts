import { config } from "dotenv";
import path from "node:path";

// Same precedence as Next.js: .env.local overrides .env
config({ path: path.resolve(process.cwd(), ".env.local"), quiet: true });
config({ path: path.resolve(process.cwd(), ".env"), quiet: true });
