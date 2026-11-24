import "./env"; // must come first: the database module reads DATABASE_URL when it is imported
import { createApp } from "./app";

const port = Number(process.env.PORT ?? 4000);

createApp().listen(port, () => {
  console.log(`Salon API listening on port ${port}`);
});
