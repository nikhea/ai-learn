import { IMastraLogger } from "@mastra/core/logger";
import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { UserRequestContext } from "../utils/slack.utils";
// import { createLogger } from "@mastra/core/logger";

// const logger = createLogger({ name: "weather-tool" });

interface GeocodingResponse {
  results: {
    latitude: number;
    longitude: number;
    name: string;
  }[];
}
interface WeatherResponse {
  current: {
    time: string;
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
    wind_gusts_10m: number;
    weather_code: number;
  };
}

export const weatherTool = createTool({
  id: "get-weather",
  description: "Get current weather for a location",
  inputSchema: z.object({
    location: z.string().describe("City name"),
    // _background: z.boolean().optional(),
    // suspendedToolRunId: z.string().optional(),
    // resumeData: z.any().optional(),
  }),
  outputSchema: z.object({
    temperature: z.number(),
    feelsLike: z.number(),
    humidity: z.number(),
    windSpeed: z.number(),
    windGust: z.number(),
    conditions: z.string(),
    location: z.string(),
  }),

  // requireApproval: true,
  execute: async (inputData, context) => {
    const mastra = context.mastra;

    const slack_userId = context?.requestContext?.get(
      "slack_userId",
    ) as UserRequestContext["slack_userId"];
    const slack_userName = context?.requestContext?.get(
      "slack_userName",
    ) as UserRequestContext["slack_userName"];
    const tenantId = context?.requestContext?.get(
      "tenantId",
    ) as UserRequestContext["tenantId"];

    console.log("[myTool]", { slack_userId, slack_userName, tenantId });
    if (!mastra) throw new Error("context mastra not available");
    const logger = mastra.getLogger();
    if (!logger) throw new Error("Logger not available");

    logger.info("Fetching weather", { location: inputData.location });
    return await getWeather(inputData.location, logger);
  },
});

const getWeather = async (location: string, logger: IMastraLogger) => {
  if (!location) {
    logger.error("Location not provided");
    throw new Error("Location not provided");
  }
  const geocodingUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1`;
  logger.info("Geocoding URL", { geocodingUrl });
  console.log("Geocoding URL", geocodingUrl);
  const geocodingResponse = await fetch(geocodingUrl);
  logger.info("Geocoding Response", { geocodingResponse });
  const geocodingData = (await geocodingResponse.json()) as GeocodingResponse;
  logger.info("Geocoding Data", { geocodingData });

  if (!geocodingData.results?.[0]) {
    logger.error(`Location '${location}' not found`);
    throw new Error(`Location '${location}' not found`);
  }

  const { latitude, longitude, name } = geocodingData.results[0];
  logger.info("Geocoding Results", { latitude, longitude, name });

  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,wind_gusts_10m,weather_code`;
  logger.info("Weather URL", { weatherUrl });
  const response = await fetch(weatherUrl);
  logger.info("Weather Response", { response });
  const data = (await response.json()) as WeatherResponse;
  logger.info("Weather Data", { data });
  return {
    temperature: data.current.temperature_2m,
    feelsLike: data.current.apparent_temperature,
    humidity: data.current.relative_humidity_2m,
    windSpeed: data.current.wind_speed_10m,
    windGust: data.current.wind_gusts_10m,
    conditions: getWeatherCondition(data.current.weather_code),
    location: name,
  };
};

function getWeatherCondition(code: number): string {
  const conditions: Record<number, string> = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Foggy",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    56: "Light freezing drizzle",
    57: "Dense freezing drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    66: "Light freezing rain",
    67: "Heavy freezing rain",
    71: "Slight snow fall",
    73: "Moderate snow fall",
    75: "Heavy snow fall",
    77: "Snow grains",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    85: "Slight snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail",
  };
  return conditions[code] || "Unknown";
}
