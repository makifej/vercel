import express from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(express.json());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is not defined in environment variables");
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
          - specificTime shall always be according to Current Date.
            - i.e. 10 minutes should be parsed as current date + 10 minutes
            - i.e. 2 pm should be parsed as current date at 14:00
          - Time Parsing Note for Hungarian
            - Times like "délután 2 óra", "14 óra", "14h" all mean 2 PM and should be parsed as 14:00 in 24-hour format.
            - And times like "hajnali 2 óra", "2 óra", "2h" all mean 2 AM and should be parsed as 02:00 in 24-hour format.


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
            - weekdays: array of numbers (1 = Sunday, 2 = Monday etc for English and 1 = Vasárnap, 2 = Hétfő etc for Hungarian)
            - all remaining fields: null
          - Examples:
            - "take medicine every day at 8:00"
            - "go to gym every Monday and Friday at 6:00 PM"

        - Monthly Reminders (Same month, specific days and time)
          - Use when reminder repeats on specific days in a month
          - Set:
            - isRepeating: false
            - monthlyDates: array of dates in format dd/mm/yyyy HH:mm (e.g. ["01/01/2023 10:00", "15/01/2023 10:00"])
            - all remaining fields: null
          - Examples:
            - "pay rent on 1 and 15 july at 10:00"
            - "appointment with doctor on 5 July at 3:00 PM and 20 July at 11:00 AM"

        IMPORTANT:
          - Return ONLY valid JSON without any markdown formatting, code blocks, or extra text.
          - When parsing day names (e.g. Monday / Hétfő), resolve them to the next correct calendar date using the following rule:
            - Compare the target weekday to the current date’s weekday.
            - If the day is **later in the week**, move forward to that day this week.
            - If the day is **today but the time has already passed**, or if the day is **earlier in the week**, move to that day **next week**.
            - Always ensure the final resolved date’s weekday **matches the name provided** (e.g. "Friday" must resolve to a date where weekday = 6).
          - Do not use \`\`\`json or \`\`\` tags. Return raw JSON only.
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
            "endDate": null or "dd/mm/yyyy HH:mm",
            "monthlyDates": null or ["dd/mm/yyyy HH:mm", "dd/mm/yyyy HH:mm"]
        }

        Remember: Return ONLY the JSON object, no extra text or formatting.
    `;

  const requestBody = {
    contents: [
      { role: "user", parts: [{ text: systemPrompt }] },
      { role: "model", parts: [{ text: "Okay, I understand. I will parse your reminder requests and return only valid JSON according to your specified format and rules." }] },
      { role: "user", parts: [{ text: userPrompt }] },
    ],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: "application/json",
    },
  };

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      requestBody,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    res.send(response.data.candidates[0].content.parts[0].text); 
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    res.status(500).send({ error: `Failed to fetch response from OpenAI\n${error}` });
  }
});

app.listen(3000, () => console.log("Server ready on port 3000."));

module.exports = app;