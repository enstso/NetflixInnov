import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "../types/events";

const QUICK_REACTIONS = ["❤️", "😂", "😮"];

interface ChatCardProps {
  messages: ChatMessage[];
  onSend: (text: string) => void;
  onReaction: (emoji: string) => void;
}

export function ChatCard({ messages, onSend, onReaction }: ChatCardProps) {
  const [text, setText] = useState("");
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const list = listRef.current;
    if (!list) {
      return;
    }

    list.scrollTop = list.scrollHeight;
  }, [messages]);

  return (
    <section className="side-card chat-card">
      <div className="side-card-head">
        <h3>Chat</h3>
      </div>

      <div className="chat-messages" ref={listRef}>
        {messages.length === 0 && <p className="empty-state">Envoyez le premier message.</p>}

        {messages.map((message) => (
          <article key={message.id} className={`chat-msg ${message.from}`}>
            <strong>{message.from === "host" ? "Host" : "Guest"}</strong>
            <p>{message.text}</p>
          </article>
        ))}
      </div>

      <div className="reactions-row">
        {QUICK_REACTIONS.map((emoji) => (
          <button
            key={emoji}
            className="reaction-chip"
            onClick={() => onReaction(emoji)}
            type="button"
          >
            {emoji}
          </button>
        ))}
      </div>

      <form
        className="chat-form"
        onSubmit={(event) => {
          event.preventDefault();
          const next = text.trim();
          if (!next) {
            return;
          }

          onSend(next);
          setText("");
        }}
      >
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          className="text-input"
          placeholder="Écrire un message"
          maxLength={400}
        />
        <button className="button button-accent" type="submit">
          Envoyer
        </button>
      </form>
    </section>
  );
}
