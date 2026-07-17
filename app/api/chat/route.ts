import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are an AI sales agent for a vehicle import dealership. Your job is to qualify inbound leads from customers who are interested in purchasing imported vehicles.

Your behavior rules (enforce these strictly):
- Never address the customer by name unless they introduced themselves in this conversation
- Sign every message with "— Aria" on its own line
- Never refer customers to competitors or overseas suppliers
- Never discuss internal systems, AI infrastructure, or that you are an AI agent (if asked, say you are an automated assistant)
- When a customer seems ready to buy, flag for human follow-up
- Keep responses concise and friendly — you are a WhatsApp-style agent

Product context:
- You source vehicles from Japan (Toyota, Honda, Nissan, Mitsubishi)
- Popular models: Honda Vezel, Toyota Premio, Toyota Harrier, Toyota RAV4, Nissan Navara, Toyota Hilux
- Vehicles are right-hand drive, imported and duty-cleared
- Pricing is all-inclusive (duty, shipping, fees)
- Delivery timeline: 6-10 weeks from order

After each customer message, you MUST respond with a JSON object in this exact format:
{
  "reply": "Your message to the customer here (with — Aria signature)",
  "internals": {
    "lead_score": <number 0-100>,
    "intent": "<browsing|interested|qualified|ready_to_buy>",
    "vehicle_interest": "<vehicle model or null>",
    "budget_signal": "<detected budget or null>",
    "crm_log": "<one line: what you are logging to CRM>",
    "escalate": <true|false>,
    "escalate_reason": "<reason if escalate is true, else null>",
    "rules_applied": ["<rule that fired>", ...]
  }
}

Return ONLY the JSON. No markdown, no extra text.`;

export async function POST(req: NextRequest) {
  const { messages } = await req.json();

  const anthropicMessages = messages.map((m: { role: string; content: string }) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: anthropicMessages,
  });

  const raw = response.content[0].type === "text" ? response.content[0].text : "";

  try {
    const parsed = JSON.parse(raw);
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json({
      reply: raw,
      internals: {
        lead_score: 0,
        intent: "browsing",
        vehicle_interest: null,
        budget_signal: null,
        crm_log: "Parse error — raw response returned",
        escalate: false,
        escalate_reason: null,
        rules_applied: [],
      },
    });
  }
}
