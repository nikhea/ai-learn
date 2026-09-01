import { createStep, createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";

const forecastSchema = z.object({
  date: z.string(),
  maxTemp: z.number(),
  minTemp: z.number(),
  precipitationChance: z.number(),
  condition: z.string(),
  location: z.string(),
});

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
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    71: "Slight snow fall",
    73: "Moderate snow fall",
    75: "Heavy snow fall",
    95: "Thunderstorm",
  };
  return conditions[code] || "Unknown";
}

const fetchWeather = createStep({
  id: "fetch-weather",
  description: "Fetches weather forecast for a given city",
  inputSchema: z.object({
    city: z.string().describe("The city to get the weather for"),
  }),
  outputSchema: forecastSchema,
  execute: async ({ inputData, mastra }) => {
    const logger = mastra.getLogger();

    if (!inputData) {
      logger.error("Input data not found");
      throw new Error("Input data not found");
    }

    const geocodingUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(inputData.city)}&count=1`;
    logger.info("geocoding Url", { geocodingUrl });

    const geocodingResponse = await fetch(geocodingUrl);
    logger.info("geocoding Response", { geocodingResponse });

    const geocodingData = (await geocodingResponse.json()) as {
      results: { latitude: number; longitude: number; name: string }[];
    };

    logger.info("geocoding Data", { geocodingData });

    if (!geocodingData.results?.[0]) {
      logger.error(`Location '${inputData.city}' not found`);
      throw new Error(`Location '${inputData.city}' not found`);
    }

    const { latitude, longitude, name } = geocodingData.results[0];

    logger.info("Geocoding Results", { latitude, longitude, name });

    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=precipitation,weathercode&timezone=auto,&hourly=precipitation_probability,temperature_2m`;
    logger.info("Weather Url", { weatherUrl });

    const response = await fetch(weatherUrl);
    logger.info("Weather Response", { response });

    const data = (await response.json()) as {
      current: {
        time: string;
        precipitation: number;
        weathercode: number;
      };
      hourly: {
        precipitation_probability: number[];
        temperature_2m: number[];
      };
    };
    logger.info("Weather Data", { data });

    const forecast = {
      date: new Date().toISOString(),
      maxTemp: Math.max(...data.hourly.temperature_2m),
      minTemp: Math.min(...data.hourly.temperature_2m),
      condition: getWeatherCondition(data.current.weathercode),
      precipitationChance: data.hourly.precipitation_probability.reduce(
        (acc, curr) => Math.max(acc, curr),
        0,
      ),
      location: name,
    };
    logger.info("Forecast", { forecast });

    return forecast;
  },
});

const planActivities = createStep({
  id: "plan-activities",
  description: "Suggests activities based on weather conditions",
  inputSchema: forecastSchema,
  outputSchema: z.object({
    activities: z.string(),
  }),
  execute: async ({ inputData, mastra }) => {
    const logger = mastra.getLogger();
    const forecast = inputData;

    if (!forecast) {
      logger.error("Forecast data not found");

      throw new Error("Forecast data not found");
    }

    logger.info("Planning activities with forecast", { forecast });

    const agent = mastra?.getAgent("weatherAgent");
    logger.info("Retrieved agent for planning activities", { agent: !!agent });
    if (!agent) {
      logger.error("Weather agent not found");

      throw new Error("Weather agent not found");
    }

    logger.info("Planning activities with forecast", { forecast });

    const prompt = `Based on the following weather forecast for ${forecast.location}, suggest appropriate activities:
      ${JSON.stringify(forecast, null, 2)}
      For each day in the forecast, structure your response exactly as follows:

      📅 [Day, Month Date, Year]
      ═══════════════════════════

      🌡️ WEATHER SUMMARY
      • Conditions: [brief description]
      • Temperature: [X°C/Y°F to A°C/B°F]
      • Precipitation: [X% chance]

      🌅 MORNING ACTIVITIES
      Outdoor:
      • [Activity Name] - [Brief description including specific location/route]
        Best timing: [specific time range]
        Note: [relevant weather consideration]

      🌞 AFTERNOON ACTIVITIES
      Outdoor:
      • [Activity Name] - [Brief description including specific location/route]
        Best timing: [specific time range]
        Note: [relevant weather consideration]

      🏠 INDOOR ALTERNATIVES
      • [Activity Name] - [Brief description including specific venue]
        Ideal for: [weather condition that would trigger this alternative]

      ⚠️ SPECIAL CONSIDERATIONS
      • [Any relevant weather warnings, UV index, wind conditions, etc.]

      Guidelines:
      - Suggest 2-3 time-specific outdoor activities per day
      - Include 1-2 indoor backup options
      - For precipitation >50%, lead with indoor activities
      - All activities must be specific to the location
      - Include specific venues, trails, or locations
      - Consider activity intensity based on temperature
      - Keep descriptions concise but informative

      Maintain this exact formatting for consistency, using the emoji and section headers as shown.`;

    logger.info("Generated Prompt", { prompt });
    const response = await agent.stream(
      [
        {
          role: "user",
          content: prompt,
        },
      ],
      {
        memory: {
          thread: `weather-activities-${forecast.location}-${new Date().toISOString().split("T")[0]}`,
          resource: "weather-agent",
        },
      },
    );
    logger.info("Agent Response", { response });

    let activitiesText = "";

    for await (const chunk of response.textStream) {
      process.stdout.write(chunk);
      activitiesText += chunk;
    }
    logger.info("Activities Text", { activitiesText });

    return {
      activities: activitiesText,
    };
  },
});

const weatherWorkflow = createWorkflow({
  id: "weather-workflow",
  description:
    "Retrieves accurate, up-to-date facts on any weather based on location and plan activies based on the weather",
  inputSchema: z.object({
    city: z.string().describe("The city to get the weather for"),
  }),
  outputSchema: z.object({
    activities: z.string(),
  }),
})
  .then(fetchWeather)
  .then(planActivities);

weatherWorkflow.commit();
export { weatherWorkflow };

// const run = await weatherWorkflow.createRun();

// const output = run.stream({ inputData: { city: "Lagos" } });

// for await (const event of output.fullStream) {
//   console.log("Workflow Event:", event);
//   // handle WorkflowStreamEvent
// }

// const result = output;

// console.log("Final Result:", JSON.stringify(result, null, 2));
