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
          - Set title for all reminders in English or Hungarian based on the command
          - Set description in English or Hungarian based on the command or null for all reminders
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
            - type: "Once"
            - specificTime: exact datetime in dd/mm/yyyy HH:mm (if no day specified then use current day)
            - isRepeating: false
            - all remaining fields: null
          - Examples:
            - "meeting tomorrow at 2:30 PM"
            - "call Norbi on Monday at 2:30 PM"
        
        - Repeating Reminders (Every X Minutes/Hours/Days etc)
          - Use when the reminder repeats every few minutes/hours/days etc
          - Set:
            - type: "Repeat"
            - repeatFrequency: "Daily"
            - repeatDailyFrequency: "Interval"
            - isRepeating: true
            - intervalMinutes: the interval in minutes/hours etc
            - all remaining fields: null
          - Example:
            - "do pushups every 45 minutes"
            - "drink water every 2 hours"

        - Repeating with Time Range
          - Use when reminder repeats every few minutes/hours/days etc within a time range or has a start time or ending time
          - Set:
            - type: "Repeat"
            - repeatFrequency: "Daily"
            - repeatDailyFrequency: "Interval"
            - isRepeating: true
            - intervalMinutes: how often
            - startDate: when to start (format: dd/mm/yyyy HH:mm)
            - endDate: when to stop (format: dd/mm/yyyy HH:mm) (or null)
            - all remaining fields: null
          - Examples:
            - "start jumping every 30 minutes from 12pm to 4pm"
            - "do meditation every 1 minute after 16:50"
          
        - Repeating Reminders (Same day, specific times)
          - Use when the reminder repeats on the same day but different times
          - Set:
            - type: "Repeat"
            - repeatFrequency: "Daily"
            - repeatDailyFrequency: "Specific Times"
            - isRepeating: true
            - dailySpecificTimes: array of times in format dd/mm/yyyy HH:mm (e.g. ["01/01/2023 10:00", "01/01/2023 11:00", "01/01/2023 12:00"])
            - all remaining fields: null
          - Example:
            - "do pushups on Monday at 6:00 AM and 6:00 PM"
            - "go far walk on Wednesday at 10:00 AM and 3:00 PM"

        - Repeating Reminders (Every X day, specific time)
          - Use when the reminder repeats on specific time after every x day
          - Set:
            - type: "Repeat"
            - repeatFrequency: "Daily"
            - repeatDailyFrequency: "Every X Days"
            - isRepeating: true
            - repeatAfterDays: number of days to repeat after (or 1)
            - specificTime: exact time in format dd/mm/yyyy HH:mm (e.g. "01/01/2023 10:00")
            - all remaining fields: null
          - Example:
            - "do pushups every 2 days at 10:00 AM"
            - "do jogging every 3 days at 6:00 PM"
          
        - Weekly Reminders (Same time, specific days, no or x week)
          - Use when reminder repeats every x week on specific days but same time
          - Set:
            - type: "Repeat"
            - repeatFrequency: "Weekly"
            - repeatWeeklyFrequency: "Simple Schedule"
            - isRepeating: false
            - weeklyTime: time (format HH:mm)
            - weekdays: array of numbers (1 = Sunday, 2 = Monday etc for English and 1 = Vasárnap, 2 = Hétfő etc for Hungarian)
            - repeatAfterWeeks: number of weeks to repeat after (or 1)
            - all remaining fields: null
          - Examples:
            - "take medicine every day at 8:00"
            - "go to gym every Monday and Friday at 6:00 PM"
            - "every 2 weeks go to market on Wednesday and Saturday at 10:00 AM"
          
        - Weekly Reminders (specific days + times, x week)
          - Use when reminder repeats every x week on specific days and times
          - Set:
            - type: "Repeat"
            - repeatFrequency: "Weekly"
            - repeatWeeklyFrequency: "Advanced Schedule"
            - isRepeating: false
            - weeklySpecificTimes: array of times in format dd/mm/yyyy HH:mm (e.g. ["01/01/2023 10:00", "01/01/2023 11:00", "15/01/2023 12:00"])
            - repeatAfterWeeks: number of weeks to repeat after (or 1)
            - all remaining fields: null
          - Examples:
            - "go to market every Monday at 4:00 PM and Friday at 6:00 PM"
            - "every 2 weeks walk dog on Wednesday 9:00 AM and Saturday at 10:00 AM"

        - Monthly Reminders (Same month, specific days and time)
          - Use when reminder repeats on specific days in a month
          - Set:
            - type: "Repeat"
            - repeatFrequency: "Monthly"
            - isRepeating: false
            - monthlyDates: array of dates in format dd/mm/yyyy HH:mm (e.g. ["01/01/2023 10:00", "15/01/2023 10:00"])
            - all remaining fields: null
          - Examples:
            - "pay rent on 1 and 15 july at 10:00"
            - "appointment with doctor on 5 July at 3:00 PM and 20 July at 11:00 AM"

        - Pomodoro Reminders (Focus, Break, Pomodoro)
          - Use when the reminder follows the Pomodoro technique (i.e., alternating focus and break periods).
          - Set:
            - type: "Pomodoro"
            - isRepeating: false
            - pomodoroFocus: focus duration in minutes (e.g. 25)
            - pomodoroBreak: break duration in minutes (e.g. 5)
            - pomodoroCycles: total number of cycles (e.g. 4)
            - all remaining fields: null
          - Examples:
            - "Start a Pomodoro session with 25 minutes focus and 5 minutes break for 4 cycles"
            - "Kezdj egy Pomodoro munkamenetet 20 perc fókusz és 10 perc szünet, 3 ciklussal"

        IMPORTANT:
          - Return ONLY valid JSON without any markdown formatting, code blocks, or extra text.
          - When parsing day names (e.g. Monday / Hétfő), resolve them to the next correct calendar date using the following rule:
            - Compare the target weekday to the current date’s weekday.
            - If the day is **later in the week**, move forward to that day this week.
            - If the day is **today but the time has already passed**, or if the day is **earlier in the week**, move to that day **next week**.
            - Always ensure the final resolved date’s weekday **matches the name provided** (e.g. "Friday" must resolve to a date where weekday = 6).
          - Do not use \`\`\`json or \`\`\` tags. Return single raw JSON only.
    `;

  const userPrompt = `
        Parse this reminder request: "${command}"
        
        Return ONLY valid JSON in this exact format:
        {
            "title": "activity name",
            "description": "optional description or null",
            "type": "Once" or "Repeat", "Pomodoro",
            "repeatFrequency": "Daily" or "Weekly" or "Monthly",
            "repeatDailyFrequency": "Interval" or "Specific Times" or "Every X Days",
            "repeatWeeklyFrequency": "Simple Schedule" or "Advanced Schedule",
            "intervalMinutes": null or number,
            "dailySpecificTimes": null or ["dd/mm/yyyy HH:mm", "dd/mm/yyyy HH:mm"],
            "isRepeating": true or false,
            "category": "category name or null",
            "specificTime": null or "dd/mm/yyyy HH:mm",
            "weeklyTime": null or "HH:mm",
            "weekdays": null or [1,2,3,4,5,6,7],
            "weeklySpecificTimes": null or ["dd/mm/yyyy HH:mm", "dd/mm/yyyy HH:mm"],
            "repeatAfterWeeks": null or number,
            "repeatAfterDays": null or number,
            "startDate": null or "dd/mm/yyyy HH:mm", 
            "endDate": null or "dd/mm/yyyy HH:mm",
            "monthlyDates": null or ["dd/mm/yyyy HH:mm", "dd/mm/yyyy HH:mm"]
            "pomodoroFocus": null or number,
            "pomodoroBreak": null or number,
            "pomodoroCycles": null or number,
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

app.post("/timeline", async (req, res): Promise<any> => {
  const { command } = req.body;

  if (!command) {
    return res.status(400).send({ error: "Command is required" });
  }

  const systemPrompt = `
        You are a task timeline parsing assistant for English and Hungarian. Your goal is to parse user commands and return a valid JSON array of task objects.

        - Task Parsing Rules:
          - For each task identified in the command, create a separate JSON object within the array.
          - Set 'title' for each task in English or Hungarian based on the command.
          - Set 'description' in English or Hungarian based on the command, or null if no specific description is provided.
          - Set 'category' from one of these: fitness, health, mind, todo, finance, creativity, social. Choose the most relevant category.
          - 'startTime' and 'endTime' shall always be in 'dd/mm/yyyy HH:mm' format.
            - If only a time is specified (e.g., "10 AM"), assume it's for the current date.
            - If a duration is given (e.g., "2-hour workout"), calculate 'endTime' based on 'startTime' and the duration.
            - If no duration is specified for a task, infer a default duration of 30 minutes.
            - Times like "10 minutes" should be parsed as current date + 10 minutes for startTime, and an appropriate endTime.
            - Times like "2 pm" should be parsed as current date at 14:00.

          - Time Parsing Note for Hungarian:
            - Times like "délután 2 óra", "14 óra", "14h" all mean 2 PM and should be parsed as 14:00 in 24-hour format.
            - And times like "hajnali 2 óra", "2 óra", "2h" all mean 2 AM and should be parsed as 02:00 in 24-hour format.

        IMPORTANT:
          - Return ONLY valid JSON without any markdown formatting, code blocks, or extra text.
          - When parsing day names (e.g. Monday / Hétfő), resolve them to the next correct calendar date using the following rule:
            - Compare the target weekday to the current date's weekday.
            - If the day is **later in the week**, move forward to that day this week.
            - If the day is **today but the time has already passed**, or if the day is **earlier in the week**, move to that day **next week**.
            - Always ensure the final resolved date's weekday **matches the name provided** (e.g. "Friday" must resolve to a date where weekday = 6).
          - Do not use \`\`\`json or \`\`\` tags. Return single raw JSON only.
    `;

  const userPrompt = `
        Parse this task timeline request: "${command}"
        
        Return ONLY valid JSON in this exact format (an array of task objects):
        [
            {
                "title": "activity name",
                "description": "optional description or null",
                "category": "category name",
                "startTime": "dd/mm/yyyy HH:mm",
                "endTime": "dd/mm/yyyy HH:mm"
            },
            {
                "title": "another activity name",
                "description": "optional description or null",
                "category": "category name",
                "startTime": "dd/mm/yyyy HH:mm",
                "endTime": "dd/mm/yyyy HH:mm"
            }
            // ... more task objects if applicable
        ]

        Remember: Return ONLY the JSON array, no extra text or formatting.
    `;

  const requestBody = {
    contents: [
      { role: "user", parts: [{ text: systemPrompt }] },
      { role: "model", parts: [{ text: "Okay, I understand. I will parse your task timeline requests and return only valid JSON according to your specified format and rules, as an array of task objects." }] },
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
    console.error("Error calling Gemini API:", error);
    res.status(500).send({ error: `Failed to fetch response from Gemini\n${error}` });
  }
});

app.listen(3000, () => console.log("Server ready on port 3000."));

module.exports = app;