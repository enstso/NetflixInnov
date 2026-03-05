interface SyncStatusProps {
  visible: boolean;
}

export function SyncStatus({ visible }: SyncStatusProps) {
  if (!visible) {
    return null;
  }

  return <div className="sync-overlay">Synchronisation...</div>;
}
