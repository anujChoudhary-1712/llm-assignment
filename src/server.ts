import dotenv from "dotenv";
import { app } from "./app"; // Importing app.ts

dotenv.config();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});
