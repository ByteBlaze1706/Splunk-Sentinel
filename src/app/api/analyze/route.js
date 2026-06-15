import { OpenAI } from "openai";
import { analyzeLogsMock } from "@/utils/presets";

export async function POST(req) {
  try {
    const { logs, apiKey: clientApiKey, model = "gpt-4o-mini" } = await req.json();

    if (!logs || typeof logs !== "string" || logs.trim() === "") {
      return Response.json({ error: "No log data provided" }, { status: 400 });
    }

    // Determine API Key source: Client Override -> Env Variable
    const apiKey = clientApiKey || process.env.OPENAI_API_KEY;

    if (!apiKey) {
      // Local Heuristics / Mock Fallback Mode
      const mockAnalysis = analyzeLogsMock(logs);
      return Response.json({
        ...mockAnalysis,
        mocked: true,
        modelUsed: "Splunk Sentinel Local Heuristics (v4.0)"
      });
    }

    // Initialize OpenAI SDK
    const openai = new OpenAI({ apiKey });

    const systemPrompt = `You are a Senior Security Operations Center (SOC) analyst and cybersecurity incident response expert. 
Your task is to analyze the provided raw system, network, database, or application logs and return a structured, comprehensive incident report in JSON format.

The JSON object must contain exactly the following keys:
- "severity": Must be one of: "low", "medium", "high", "critical".
- "threatType": A short name identifying the primary threat vector/category (e.g. "SQL Injection", "SSH Brute Force", "Impossible Travel", "Malware Execution").
- "rootCause": A detailed paragraph explaining what happened, how the attacker gained access, what vulnerabilities were exploited, and what actions were performed. Include technical details.
- "summary": A concise, one-sentence executive summary of the incident.
- "keyArtifacts": An object containing:
  - "sourceIps": Array of source/attacking IP addresses or C2 servers.
  - "targetSystems": Array of affected hostnames, servers, or endpoints.
  - "affectedUsers": Array of compromised or targeted usernames/accounts.
  - "signatures": Array of key log signatures or commands indicating malicious behavior.
- "recommendedActions": Array of step-by-step remediation tasks (actions) to isolate, contain, and mitigate the threat.
- "timeline": Array of objects, each with:
  - "time": Time of the event (HH:MM:SS or full timestamp if available).
  - "event": Short event name.
  - "details": Detailed explanation of what occurred at this timestamp.

Do not include any markdown styling, code block wrappers (like \`\`\`json), or non-JSON text. Only return a valid, parseable JSON object.`;

    const response = await openai.chat.completions.create({
      model: model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Analyze the following logs:\n\n${logs}` }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    const parsedData = JSON.parse(content);

    return Response.json({
      ...parsedData,
      mocked: false,
      modelUsed: model
    });
  } catch (error) {
    console.error("Analysis API Error:", error);
    return Response.json({ 
      error: "AI analysis failed. Please verify your API key or log format.", 
      details: error.message 
    }, { status: 500 });
  }
}
