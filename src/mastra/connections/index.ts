import { LibSQLStore, LibSQLVector } from "@mastra/libsql";
import { PinoLogger } from "@mastra/loggers";
import { RedisServerCache } from "@mastra/redis";
import { RedisStreamsPubSub } from "@mastra/redis-streams";
import Redis from "ioredis";
import { DuckDBStore } from "@mastra/duckdb";
import { ObservabilityStorageClickhouseVNext } from "@mastra/clickhouse";

const logger = new PinoLogger({
  name: "Mastra",
  level: "info",
});

const redisCache = new RedisServerCache({
  client: new Redis("redis://localhost:6379"),
});

const redisPubSub = new RedisStreamsPubSub({
  url: "redis://localhost:6379",
});

const storeLibSQLStore = new LibSQLStore({
  id: "mastra-storage",
  url: "file:./mastra.db",
});

const libsqlVector = new LibSQLVector({
  id: "libsql-vector",
  url: "file:./vector.db",
});

const duckDbStore = await new DuckDBStore().getStore("observability");
if (!duckDbStore) {
  throw new Error("Failed to initialize DuckDBStore for observability");
}

const clickhouseExporter = new ObservabilityStorageClickhouseVNext({
  url: process.env.CLICKHOUSE_URL!,
  username: process.env.CLICKHOUSE_USERNAME!,
  password: process.env.CLICKHOUSE_PASSWORD!,
});

if (!clickhouseExporter) {
  throw new Error("Failed to initialize clickhouseExporter for observability");
}

export {
  storeLibSQLStore,
  libsqlVector,
  clickhouseExporter,
  duckDbStore,
  redisPubSub,
  redisCache,
  logger,
};

//  new LibSQLStore({
//       id: "mastra-storage",
//       url: "file:./mastra.db",
//     }),
