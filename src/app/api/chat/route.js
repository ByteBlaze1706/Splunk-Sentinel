import { OpenAI } from "openai";
import { getMockChatResponse } from "@/utils/presets";

export async function POST(req) {
  try {
    const { logs, messages, apiKey: clientApiKey, model = "gpt-4o-mini" } = await req.json();

    if (!logs) {
      return Response.json({ error: "No log context provided" }, { status: 400 });
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: "No messages history provided" }, { status: 400 });
    }

    const apiKey = clientApiKey || process.env.OPENAI_API_KEY;
    const userMessage = messages[messages.length - 1].content;

    if (!apiKey) {
      // Mock Response Mode
      const mockReply = getMockChatResponse(logs, userMessage);
      return Response.json({
        role: "assistant",
        content: mockReply,
        mocked: true
      });
    }

    // Initialize OpenAI
    const openai = new OpenAI({ apiKey });

    const systemPrompt = `You are Sentinel, an expert AI incident response assistant integrated into the Splunk Sentinel Cybersecurity platform.
You are assisting a SOC (Security Operations Center) analyst in investigating a security incident based on the following raw event logs:

--- START LOG DATA ---
${logs}
--- END LOG DATA ---

Guidance:
1. Provide professional, highly technical, and concise security responses.
2. Directly reference specific details from the logs such as IP addresses, ports, usernames, systems, commands, and timestamps.
3. Suggest investigative queries, commands (e.g. bash, PowerShell, Splunk SPL), or remediation steps.
4. Keep the tone calm, objective, and action-oriented.`;

    const chatMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map(m => ({ role: m.role, content: m.content }))
    ];

    const response = await openai.chat.completions.create({
      model: model,
      messages: chatMessages,
      temperature: 0.2
    });

    const reply = response.choices[0].message.content;

    return Response.json({
      role: "assistant",
      content: reply,
      mocked: false
    });
  } catch (error) {
    console.error("Chat API Error:", error);
    return Response.json({ 
      error: "Sentinel failed to respond. Please check your API configuration.",
      details: error.message
    }, { status: 500 });
  }
}
