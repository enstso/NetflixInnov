import type { ChatMessage } from "../types/events";
import { ChatCard } from "./ChatCard";
import { ParticipantsCard } from "./ParticipantsCard";
import { RecommendationsCard } from "./RecommendationsCard";

interface SidePanelProps {
  guestConnected: boolean;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onReaction: (emoji: string) => void;
}

export function SidePanel({ guestConnected, messages, onSendMessage, onReaction }: SidePanelProps) {
  return (
    <aside className="side-panel">
      <ParticipantsCard isGuestConnected={guestConnected} />
      <RecommendationsCard />
      <ChatCard messages={messages} onSend={onSendMessage} onReaction={onReaction} />
    </aside>
  );
}
