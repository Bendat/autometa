import http from "node:http";

import { createApp } from "./app.js";

const port = Number(process.env.PORT ?? 4000);
const host = process.env.HOST ?? "0.0.0.0";

const app = createApp();

http.createServer(app).listen(port, host, () => {
  console.log(`Brew Buddy API listening on http://${host}:${port}`);
});
