import { createApp } from "./app.js";
import { config } from "./config.js";

const app = await createApp();

app.listen(config.port, config.host, () => {
  console.log(`contentAuto API listening on http://${config.host}:${config.port}`);
  console.log(`AI mode: ${process.env.OPENAI_API_KEY ? "live (OpenAI)" : "mock"}`);
  console.log(`Samples: ${config.samplesDir}`);
  console.log(`Data: ${config.dataDir}`);
});
