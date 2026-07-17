"use client";

import { useState, useRef, useEffect } from "react";

interface Internals {
  lead_score: number;
  intent: string;
  vehicle_interest: string | null;
  budget_signal: string | null;
  crm_log: string;
  escalate: boolean;
  escalate_reason: string | null;
  rules_applied: string[];
}

interface Message {
  role: "user" | "assistant";
  content: string;
  internals?: Internals;
}

const INTENT_COLOR: Record<string, string> = {
  browsing: "text-gray-400",
  interested: "text-blue-400",
  qualified: "text-yellow-400",
  ready_to_buy: "text-green-400",
};

const STARTER_MESSAGES = [
  "Hi, I'm looking for a Honda Vezel",
  "How much is a 2019 Toyota Harrier?",
  "Still available?",
  "What cars do you have?",
];

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [latestInternals, setLatestInternals] = useState<Internals | null>(null);
  const [crmLog, setCrmLog] = useState<string[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await res.json();
      const assistantMsg: Message = {
        role: "assistant",
        content: data.reply,
        internals: data.internals,
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setLatestInternals(data.internals);
      if (data.internals?.crm_log) {
        setCrmLog((prev) => [
          `[${new Date().toLocaleTimeString()}] ${data.internals.crm_log}`,
          ...prev,
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const scoreColor = (score: number) => {
    if (score >= 70) return "text-green-400";
    if (score >= 40) return "text-yellow-400";
    return "text-gray-400";
  };

  const scoreBarColor = (score: number) => {
    if (score >= 70) return "bg-green-500";
    if (score >= 40) return "bg-yellow-500";
    return "bg-gray-500";
  };

  return (
    <div className="min-h-screen bg-[#0F1117] text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#6C63FF] flex items-center justify-center text-sm font-bold">S</div>
          <div>
            <div className="font-semibold text-sm">Schejoule</div>
            <div className="text-xs text-gray-500">AI Agent Demo — Forward Deployed</div>
          </div>
        </div>
        <div className="text-xs text-gray-600 hidden md:block">
          This demo shows an AI sales agent qualifying leads in real time
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden" style={{ height: "calc(100vh - 113px)" }}>
        {/* Chat panel */}
        <div className="flex flex-col flex-1 border-r border-white/10 min-w-0">
          <div className="px-4 py-2 border-b border-white/5 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-gray-500 uppercase tracking-widest">Customer Chat</span>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
                <div>
                  <div className="text-2xl font-bold mb-2">AI Sales Agent</div>
                  <div className="text-gray-500 text-sm max-w-xs">
                    Send a message as a customer. Watch the agent qualify the lead in real time on the right.
                  </div>
                </div>
                <div className="flex flex-col gap-2 w-full max-w-xs">
                  {STARTER_MESSAGES.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="text-left text-sm px-4 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-gray-300"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                {m.role === "assistant" && (
                  <div className="w-7 h-7 rounded-full bg-[#6C63FF] flex items-center justify-center text-xs font-bold mr-2 mt-1 flex-shrink-0">
                    A
                  </div>
                )}
                <div
                  className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed ${
                    m.role === "user"
                      ? "bg-[#6C63FF] text-white rounded-tr-sm"
                      : "bg-[#1A1D2E] text-gray-100 rounded-tl-sm border border-white/5"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="w-7 h-7 rounded-full bg-[#6C63FF] flex items-center justify-center text-xs font-bold mr-2 flex-shrink-0">
                  A
                </div>
                <div className="bg-[#1A1D2E] border border-white/5 px-4 py-3 rounded-2xl rounded-tl-sm">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="px-4 py-4 border-t border-white/10">
            <div className="flex gap-3">
              <input
                className="flex-1 bg-[#1A1D2E] border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#6C63FF] transition-colors placeholder-gray-600"
                placeholder="Type as a customer..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send(input)}
                disabled={loading}
              />
              <button
                onClick={() => send(input)}
                disabled={loading || !input.trim()}
                className="px-5 py-3 rounded-xl bg-[#6C63FF] text-sm font-medium hover:bg-[#5a52e0] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Send
              </button>
            </div>
          </div>
        </div>

        {/* Internals panel */}
        <div className="w-[380px] flex-shrink-0 flex flex-col bg-[#0D0F1A] overflow-y-auto">
          <div className="px-4 py-2 border-b border-white/5 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#6C63FF]" />
            <span className="text-xs text-gray-500 uppercase tracking-widest">Agent Internals</span>
          </div>

          {!latestInternals ? (
            <div className="flex-1 flex items-center justify-center text-gray-600 text-sm text-center px-8">
              Send a message to see the agent&apos;s internal state update in real time
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {/* Lead score */}
              <div className="bg-[#1A1D2E] rounded-xl p-4 border border-white/5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-gray-500 uppercase tracking-widest">Lead Score</span>
                  <span className={`text-2xl font-bold ${scoreColor(latestInternals.lead_score)}`}>
                    {latestInternals.lead_score}
                  </span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-700 ${scoreBarColor(latestInternals.lead_score)}`}
                    style={{ width: `${latestInternals.lead_score}%` }}
                  />
                </div>
              </div>

              {/* Signals */}
              <div className="bg-[#1A1D2E] rounded-xl p-4 border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Intent</span>
                  <span className={`text-xs font-semibold uppercase tracking-wide ${INTENT_COLOR[latestInternals.intent] ?? "text-gray-400"}`}>
                    {latestInternals.intent.replace("_", " ")}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Vehicle Interest</span>
                  <span className="text-xs text-white">{latestInternals.vehicle_interest ?? "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Budget Signal</span>
                  <span className="text-xs text-white">{latestInternals.budget_signal ?? "—"}</span>
                </div>
              </div>

              {/* Escalation */}
              {latestInternals.escalate && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                  <div className="text-xs font-semibold text-yellow-400 uppercase tracking-wide mb-1">
                    Escalate to Human
                  </div>
                  <div className="text-xs text-yellow-300">{latestInternals.escalate_reason}</div>
                </div>
              )}

              {/* Rules applied */}
              {latestInternals.rules_applied?.length > 0 && (
                <div className="bg-[#1A1D2E] rounded-xl p-4 border border-white/5">
                  <div className="text-xs text-gray-500 uppercase tracking-widest mb-3">Rules Applied</div>
                  <div className="space-y-1">
                    {latestInternals.rules_applied.map((r, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-gray-400">
                        <span className="text-[#6C63FF] mt-0.5">✓</span>
                        <span>{r}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CRM log */}
              <div className="bg-[#1A1D2E] rounded-xl p-4 border border-white/5">
                <div className="text-xs text-gray-500 uppercase tracking-widest mb-3">CRM Log</div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {crmLog.map((entry, i) => (
                    <div key={i} className="text-xs text-gray-400 font-mono leading-relaxed">
                      {entry}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/5 px-6 py-3 flex items-center justify-between">
        <span className="text-xs text-gray-700">Schejoule — Forward Deployed AI Engineering</span>
        <span className="text-xs text-gray-700">schejoule.com</span>
      </footer>
    </div>
  );
}
