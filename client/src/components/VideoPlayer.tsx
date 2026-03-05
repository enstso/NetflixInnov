import { useEffect, useMemo, useRef, useState } from "react";
import type { PlaybackState, Role } from "../types/events";

const VIDEO_SRC = "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4";

interface SyncState {
  playbackState: PlaybackState;
  serverNow: number;
}

interface VideoPlayerProps {
  role: Role;
  syncState: SyncState;
  onHostPlay: (position: number) => void;
  onHostPause: (position: number) => void;
  onHostSeek: (position: number, autoplayAfterSeek?: boolean) => void;
  onGuestControlAttempt: () => void;
}

function formatTime(value: number): string {
  const total = Math.max(0, Math.floor(value));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function VideoPlayer({
  role,
  syncState,
  onHostPlay,
  onHostPause,
  onHostSeek,
  onGuestControlAttempt
}: VideoPlayerProps) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [duration, setDuration] = useState(0);
  const [timelineValue, setTimelineValue] = useState(0);
  const [volume, setVolume] = useState(1);
  const [showAutoplayPrompt, setShowAutoplayPrompt] = useState(false);
  const [dragValue, setDragValue] = useState<number | null>(null);

  const canControl = role === "host";

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    video.volume = volume;
  }, [volume]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    const { playbackState, serverNow } = syncState;
    const driftOffset = Math.max(0, (serverNow - playbackState.updatedAt) / 1000);
    const targetPosition =
      playbackState.status === "playing"
        ? playbackState.position + driftOffset
        : playbackState.position;

    if (Math.abs(video.currentTime - targetPosition) >= 0.3) {
      video.currentTime = targetPosition;
      setTimelineValue(targetPosition);
    }

    if (playbackState.status === "playing") {
      void video.play().then(() => setShowAutoplayPrompt(false)).catch(() => {
        setShowAutoplayPrompt(true);
      });
      return;
    }

    video.pause();
  }, [syncState]);

  const displayedTimelineValue = dragValue ?? timelineValue;

  const timeDisplay = useMemo(
    () => `${formatTime(displayedTimelineValue)} / ${formatTime(duration)}`,
    [displayedTimelineValue, duration]
  );

  const handleTogglePlayback = () => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    if (!canControl) {
      onGuestControlAttempt();
      return;
    }

    if (video.paused) {
      void video.play();
      onHostPlay(video.currentTime);
      return;
    }

    video.pause();
    onHostPause(video.currentTime);
  };

  const commitSeek = () => {
    if (!canControl) {
      onGuestControlAttempt();
      return;
    }

    if (dragValue === null) {
      return;
    }

    onHostSeek(dragValue, syncState.playbackState.status === "playing");
    setDragValue(null);
  };

  const toggleFullscreen = () => {
    if (!canControl) {
      onGuestControlAttempt();
      return;
    }

    if (!document.fullscreenElement) {
      void stageRef.current?.requestFullscreen();
      return;
    }

    void document.exitFullscreen();
  };

  return (
    <div className="video-frame" ref={stageRef}>
      <video
        ref={videoRef}
        src={VIDEO_SRC}
        preload="metadata"
        onLoadedMetadata={(event) => {
          setDuration(event.currentTarget.duration);
        }}
        onTimeUpdate={(event) => {
          setTimelineValue(event.currentTarget.currentTime);
        }}
      />

      <div className="player-overlay">
        <button
          className={`center-control ${!canControl ? "is-disabled" : ""}`}
          onClick={handleTogglePlayback}
          type="button"
        >
          {syncState.playbackState.status === "playing" ? "Pause" : "Play"}
        </button>

        {showAutoplayPrompt && (
          <button
            className="autoplay-prompt"
            type="button"
            onClick={() => {
              const video = videoRef.current;
              if (!video) {
                return;
              }

              void video.play().then(() => setShowAutoplayPrompt(false));
            }}
          >
            Clique pour démarrer (sync)
          </button>
        )}

        <div className="bottom-controls">
          <input
            className={`timeline ${!canControl ? "is-disabled" : ""}`}
            type="range"
            min={0}
            max={Math.max(duration, 1)}
            step={0.1}
            value={Math.min(displayedTimelineValue, Math.max(duration, 1))}
            onChange={(event) => {
              const nextValue = Number(event.target.value);
              if (!canControl) {
                onGuestControlAttempt();
                return;
              }

              setDragValue(nextValue);
              const video = videoRef.current;
              if (video) {
                video.currentTime = nextValue;
              }
            }}
            onMouseUp={commitSeek}
            onTouchEnd={commitSeek}
            onKeyUp={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                commitSeek();
              }
            }}
          />

          <div className="controls-footer">
            <span className="timecode">{timeDisplay}</span>

            <div className="control-cluster">
              <button
                className={`icon-button ${!canControl ? "is-disabled" : ""}`}
                onClick={() => {
                  if (!canControl) {
                    onGuestControlAttempt();
                    return;
                  }

                  setVolume((current) => (current > 0 ? 0 : 1));
                }}
                type="button"
              >
                {volume > 0 ? "Vol" : "Mute"}
              </button>

              <button
                className={`icon-button ${!canControl ? "is-disabled" : ""}`}
                onClick={toggleFullscreen}
                type="button"
              >
                Full
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
