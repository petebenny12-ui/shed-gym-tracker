import { useState, useEffect, useCallback, useRef } from 'react';

export function useTimer() {
  const [timerCount, setTimerCount] = useState(0);
  const [timerDuration, setTimerDuration] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [alarmOn, setAlarmOn] = useState(true);
  const audioCtxRef = useRef(null);
  const alarmRef = useRef(true);

  useEffect(() => { alarmRef.current = alarmOn; }, [alarmOn]);

  const getAudioCtx = () => {
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  const playAlarm = useCallback(() => {
    if (!alarmRef.current) return;
    try {
      const ctx = getAudioCtx();
      [0, 0.25, 0.5].forEach((delay) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 880;
        osc.type = 'square';
        gain.gain.setValueAtTime(0.4, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delay + 0.2);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + 0.2);
      });
    } catch (e) { console.log('Audio not supported'); }
  }, []);

  useEffect(() => {
    let interval;
    if (timerRunning && timerCount > 0) {
      interval = setInterval(() => {
        setTimerCount((c) => {
          if (c <= 1) { setTimerRunning(false); playAlarm(); return 0; }
          return c - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning, timerCount, playAlarm]);

  const startTimer = (seconds) => {
    getAudioCtx();
    setTimerCount(seconds);
    setTimerDuration(seconds);
    setTimerRunning(true);
  };

  const toggleAlarm = () => setAlarmOn(!alarmOn);

  return { timerCount, timerDuration, timerRunning, alarmOn, startTimer, toggleAlarm };
}
