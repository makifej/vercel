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
        You are a reminder parsing assistant for English and Hungarian. Parse reminder requests and return valid JSON.
        
        - Reminder Parsing Rules (Simple Format)
          - Set title for all reminders
          - Set description or null for all reminders
          - Set categories from one of these:
            - fitness, health, mind, todo, finance, creativity, social
          - Follow below instructions for remaining fields

        - Specific One-Time Reminders
          - Use when it's a single reminder for a specific day and/or time
          - Set:
            - specificTime: exact datetime in dd/mm/yyyy HH:mm (if no day specified then use current day)
            - isRepeating: false
            - all remaining fields: null
          - Examples:
            - "meeting tomorrow at 2:30 PM"
            - "call Norbi on Monday at 2:30 PM"
        
        - Repeating Reminders (Every X Minutes/Hours/Says etc)
          - Use when the reminder repeats every few minutes/hours/days etc
          - Set:
            - isRepeating: true
            - intervalMinutes: the interval in minutes/hours etc
            - all remaining fields: null
          - Example:
            - "do pushups every 45 minutes"
            - "drink water every 2 hours"

        - Repeating with Time Range
          - Use when reminder repeats every few minutes/hours/days etc within a time range or has a start time or ending time
          - Set:
            - isRepeating: true
            - intervalMinutes: how often
            - startDate: when to start (format: dd/mm/yyyy HH:mm)
            - endDate: when to stop (format: dd/mm/yyyy HH:mm) (or null)
            - all remaining fields: null
          - Examples:
            - "start jumping every 30 minutes from 12pm to 4pm"
            - "do meditation every 1 minute after 16:50"
          
        - Weekly Reminders (Same time, specific days)
          - Use when reminder repeats every week on specific days
          - Set:
            - isRepeating: false
            - weeklyTime: time (format HH:mm)
            - weekdays: array of numbers (1 = Sunday, 2 = Monday etc.)
            - all remaining fields: null
          - Examples:
            - "take medicine every day at 8:00"
            - "go to gym every Monday and Friday at 6:00 PM"

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
            "specificTime": null or "dd/mm/yyyy HH:mm",
            "weeklyTime": null or "HH:mm",
            "weekdays": null or [1,2,3,4,5,6,7],
            "startDate": null or "dd/mm/yyyy HH:mm", 
            "endDate": null or "dd/mm/yyyy HH:mm"
        }

        Remember: Return ONLY the JSON object, no extra text or formatting. Today is: ${new Date()}. Refer this date for dates.
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