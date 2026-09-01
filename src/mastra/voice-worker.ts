import "dotenv/config";

import { fileURLToPath } from "node:url";
import { createLiveKitWorker, runLiveKitWorker } from "@mastra/livekit/worker";
import { mastra } from "./index";

export default createLiveKitWorker({
  mastra,
  agent: "weatherAgent",
  stt: "deepgram/nova-3",
  tts: "cartesia/sonic-3",
  turnDetection: "multilingual",
  greeting: "Hi! How can I help you today?",
});

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runLiveKitWorker({ entry: import.meta.url, agentName: "mastra-voice" });
}
// import { fileURLToPath } from "node:url";
// import { createLiveKitWorker, runLiveKitWorker } from "@mastra/livekit/worker";
// import * as openai from "@livekit/agents-plugin-openai";
// import { mastra } from "./index";
// import { weatherAgent } from "./agents/weather-agent";

// export default createLiveKitWorker({
//   mastra,
//   agent: "weatherAgent",
//   //   stt: "deepgram/nova-3",
//   //   tts: "cartesia/sonic-3",
//   stt: new openai.STT({
//     apiKey: "not-needed",
//     baseURL: "http://localhost:9000/v1",

//     //baseURL: "http://whisper-stt:9000/v1", // http://localhost:9000/v1 outside docker
//     model: "whisper-1", // whisper-server ignores the exact name, any string works
//     language: "en",
//     detectLanguage: false,
//     useRealtime: false,
//   }),
//   tts: new openai.TTS({
//     apiKey: "not-needed",
//     baseURL: "http://localhost:8880/v1",

//     //  baseURL: "http://kokoro-tts:8880/v1", // http://localhost:8880/v1 outside docker
//     model: "kokoro",
//     voice: "af_bella" as openai.TTSVoices,
//     // see GET /v1/audio/voices for the full list
//     // response_format defaults to mp3; kokoro also supports wav/opus/flac
//   }),

//   turnDetection: "multilingual",
//   greeting: "Hi! My Name is Javis, How can I help you today?",
// });

// if (process.argv[1] === fileURLToPath(import.meta.url)) {
//   runLiveKitWorker({ entry: import.meta.url, agentName: "mastra-voice" });
// }

// // whisper-0c63ec712139455b27de4107e79687b9f53994aa23c1f161
