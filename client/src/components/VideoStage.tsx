import type { PlaybackState, Role } from "../types/events";
import { RoleBadge } from "./RoleBadge";
import { SyncStatus } from "./SyncStatus";
import { VideoPlayer } from "./VideoPlayer";

interface VideoStageProps {
  role: Role;
  syncState: {
    playbackState: PlaybackState;
    serverNow: number;
  };
  syncing: boolean;
  onHostPlay: (position: number) => void;
  onHostPause: (position: number) => void;
  onHostSeek: (position: number, autoplayAfterSeek?: boolean) => void;
  onGuestControlAttempt: () => void;
}

export function VideoStage({
  role,
  syncState,
  syncing,
  onHostPlay,
  onHostPause,
  onHostSeek,
  onGuestControlAttempt
}: VideoStageProps) {
  return (
    <section className="video-stage">
      <VideoPlayer
        role={role}
        syncState={syncState}
        onHostPlay={onHostPlay}
        onHostPause={onHostPause}
        onHostSeek={onHostSeek}
        onGuestControlAttempt={onGuestControlAttempt}
      />
      <RoleBadge role={role} />
      <SyncStatus visible={syncing} />
    </section>
  );
}
