import { useState, useEffect } from 'react';
import { C3 } from '../../design';

export default function SessionDuration({ startedAt }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = new Date(startedAt).getTime();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;

  return (
    <span style={{ fontSize: 12, color: C3.muted }}>
      Session: {mins}:{secs.toString().padStart(2, '0')}
    </span>
  );
}
