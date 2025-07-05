import express from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(express.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not defined in environment variables");
}

app.post("/chat", async (req, res): Promise<any> => {
  const { command } = req.body;

  if (!command) {
    return res.status(400).send({ error: "Command is required" });
  }

  const systemPrompt = `
        You are a reminder parsing assistant. Parse reminder requests and return valid JSON.
        
        Categories available: fitness, health, mind, todo, finance, creativity, social
        Days mapping is as follows: Sunday=1, Monday=2, Tuesday=3, Wednesday=4, Thursday=5, Friday=6, Saturday=7
        
        For repeating reminders with intervals, set isRepeating to true and provide intervalMinutes.
        Examples for repeating reminders with intervals:
        - "do pushups every 45 minutes" -> {"title": "Do pushups", "description": null, "intervalMinutes": 45, "isRepeating": true, "category": "fitness", "specificTime": null, "weeklyTime": null, "weekdays": null, "startDate": null, "endDate": null}
        
        For repeating reminders with intervals and automation (i.e sheduling), set isRepeating to true, provide intervalMinutes, startDate and endDate (if any).
        Examples for repeating reminders with intervals and automation (i.e. scheduling):
        - "do meditation every 1 minutes after 16:50 or 16.50" -> {"title": "Do Meditation", "description": null, "intervalMinutes": 1, "isRepeating": true, "category": "health", "specificTime": "null", "weeklyTime": null, "weekdays": null, "startDate": "01/07/2025 16:50", "endDate": null}
        - "drink water every 30 minutes from 12pm to 4pm" -> {"title": "Drink water", "description": null, "intervalMinutes": 30, "isRepeating": true, "category": "health", "specificTime": "null", "weeklyTime": null, "weekdays": null, "startDate": "01/07/2025 12:00", "endDate": "01/07/2025 16:00"}

        For weekly calendar reminders, provide weekdays as array (Sunday=1, Monday=2, ..., Saturday=7).
        Examples for weekly calendar reminders:
        - "take medicine every day at 8:00" -> {"title": "Take medicine", "description": null, "intervalMinutes": null, "isRepeating": false, "category": "health", "specificTime": null, "weeklyTime": "08:00", "weekdays": [1,2,3,4,5,6,7], "startDate": null, "endDate": null}
        - "go to gym every Monday and Friday at 6:00 PM" -> {"title": "Go to gym", "description": null, "intervalMinutes": null, "isRepeating": false, "category": "fitness", "specificTime": null, "weeklyTime": "18:00", "weekdays": [2,6], "startDate": null, "endDate": null}

        For specific time reminders, set intervalMinutes as null, provide specificTime in "dd/mm/yyyy HH:mm" format only.
        Examples for specific time reminders:
        - "meeting tomorrow at 2:30 PM" -> {"title": "Meeting", "description": null, "intervalMinutes": null, "isRepeating": false, "category": "todo", "specificTime": "14:30", "weeklyTime": null, "weekdays": [2], "startDate": null, "endDate": null}
        - "call norbi on monday at 2:30 PM" -> {"title": "Call Norbi", "description": null, "intervalMinutes": null, "isRepeating": false, "category": "todo", "specificTime": "14:30", "weeklyTime": null, "weekdays": [2], "startDate": null, "endDate": null}
        
        IMPORTANT: Return ONLY valid JSON without any markdown formatting, code blocks, or extra text.
        Do not use \`\`\`json or \`\`\` tags. Return raw JSON only.
    `;

  const userPrompt = `
        Parse this reminder request: "${command}"
        
        Return ONLY valid JSON in this exact format:
        {
            "title": "activity name",
            "description": "optional description or null",
            "intervalMinutes": null or number,
            "isRepeating": true or false,
            "category": "category name or null",
            "specificTime": null or "HH:mm",
            "weeklyTime": null or "HH:mm",
            "weekdays": null or [1,2,3,4,5,6,7],
            "startDate": null or "dd/mm/yyyy HH:mm", 
            "endDate": null or "dd/mm/yyyy HH:mm"
        }

        Remember: Return ONLY the JSON object, no extra text or formatting. Today is: ${new Date()}. Refer this date for startDate and endDate.
    `;

  const requestBody = {
    model: "gpt-3.5-turbo",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.3,
    max_tokens: 200,
  };

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      requestBody,
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.send(response.data.choices[0].message.content); // Send the parsed JSON response back to the client
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    res.status(500).send({ error: `Failed to fetch response from OpenAI\n${error}` });
  }
});

app.listen(3000, () => console.log("Server ready on port 3000."));

module.exports = app;