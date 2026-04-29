"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { sendMessageAction, unmatchAction } from "@/lib/actions/messages";
import { useRouter } from "next/navigation";

interface Msg {
  id: string;
  body: string;
  senderId: string;
  createdAt: string;
}

export function ChatThread({
  matchId,
  currentUserId,
  otherFirstName,
  unmatched,
  initialMessages,
}: {
  matchId: string;
  currentUserId: string;
  otherFirstName: string;
  unmatched: boolean;
  initialMessages: Msg[];
}) {
  const [messages, setMessages] = useState<Msg[]>(initialMessages);
  const [body, setBody] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);


  useEffect(() => {
    if (unmatched) return;
    const id = setInterval(() => router.refresh(), 8000);
    return () => clearInterval(id);
  }, [router, unmatched]);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  function send() {
    const trimmed = body.trim();
    if (!trimmed) return;
    const optimistic: Msg = {
      id: `tmp-${Date.now()}`,
      body: trimmed,
      senderId: currentUserId,
      createdAt: new Date().toISOString(),
    };
    setMessages((m) => [...m, optimistic]);
    setBody("");
    start(async () => {
      const r = await sendMessageAction({ matchId, body: trimmed });
      if (!r.ok) {

        setMessages((m) => m.filter((x) => x.id !== optimistic.id));
      }
      router.refresh();
    });
  }

  async function unmatch() {
    if (!confirm(`Unmatch ${otherFirstName}? This can't be undone.`)) return;
    await unmatchAction(matchId);
    router.push("/app/matches");
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 bg-ink-50">
        {messages.length === 0 ? (
          <p className="text-center text-sm text-ink-500 mt-10">
            Say hi to {otherFirstName}.
          </p>
        ) : null}
        {messages.map((m) => {
          const mine = m.senderId === currentUserId;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[78%] rounded-2xl px-4 py-2 text-sm ${
                  mine
                    ? "bg-ink text-white rounded-br-sm"
                    : "bg-white text-ink rounded-bl-sm border border-ink-100"
                }`}
              >
                {m.body}
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {!unmatched ? (
        <form
          className="flex items-center gap-2 border-t border-ink-100 p-3 bg-white"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <button
            type="button"
            onClick={unmatch}
            title="Unmatch"
            className="btn-ghost px-2 text-ink-500"
          >
            Unmatch
          </button>
          <input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={`Message ${otherFirstName}...`}
            maxLength={2000}
            className="input"
          />
          <button disabled={pending || !body.trim()} className="btn-primary">
            Send
          </button>
        </form>
      ) : null}
    </>
  );
}
