import { useMemo, useState } from 'react';
import { buildLadder } from '../lib/ladder';
import { C3, FONTS, TABULAR, TYPE } from '../design';
import NumberWheel from '../components/session/NumberWheel';

/**
 * Scratch route — /lab/wheel
 *
 * NumberWheel on its own, against fake ladders, so it can be dragged on a real
 * phone before anything is built on top of it. Not linked from the app; delete
 * this page once the session screen ships.
 */

const label = { ...TYPE.sectionLabel };

function Bench({ title, children, note }) {
  return (
    <section
      style={{
        background: C3.raise,
        borderTop: `${C3.hair}px solid ${C3.line}`,
        borderBottom: `${C3.hair}px solid ${C3.line}`,
        padding: '14px 22px 16px',
        marginBottom: 14,
      }}
    >
      <div style={{ ...label, marginBottom: 10 }}>{title}</div>
      {children}
      {note ? (
        <div style={{ ...TYPE.body, color: C3.muted, marginTop: 10 }}>{note}</div>
      ) : null}
    </section>
  );
}

export default function WheelLab() {
  const barbell = useMemo(() => buildLadder({ increment: 2.5, min: 20, max: 200 }), []);
  const micro = useMemo(() => buildLadder({ increment: 1.25, min: 20, max: 200 }), []);
  const reps = useMemo(() => Array.from({ length: 30 }, (_, i) => i + 1), []);

  const [weight, setWeight] = useState(82.5);
  const [rep, setRep] = useState(8);
  const [fine, setFine] = useState(60);
  const [logged, setLogged] = useState(false);
  const [longPresses, setLongPresses] = useState(0);
  const [lastEvent, setLastEvent] = useState('—');

  const note = (msg) => setLastEvent(msg);

  return (
    <div style={{ minHeight: '100vh', background: C3.bg, paddingBottom: 40 }}>
      <header style={{ padding: '16px 22px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div style={TYPE.screenTitle}>Wheel lab</div>
        <div style={TYPE.meta}>{longPresses} holds</div>
      </header>

      <Bench
        title="Weight · reps"
        note="Flick each wheel. onChange fires on settle only — the readout below should not flicker mid-drag."
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <NumberWheel
            values={barbell}
            value={weight}
            onChange={(v) => { setWeight(v); note(`weight → ${v}`); }}
            onLongPress={() => { setLongPresses((n) => n + 1); note('long press: weight'); }}
            width={104}
            logged={logged}
            unit="kilograms"
            ariaLabel="Set 1 weight, kilograms"
          />
          <NumberWheel
            values={reps}
            value={rep}
            onChange={(v) => { setRep(v); note(`reps → ${v}`); }}
            onLongPress={() => { setLongPresses((n) => n + 1); note('long press: reps'); }}
            width={82}
            logged={logged}
            unit="reps"
            ariaLabel="Set 1 reps"
          />
          <div style={{ ...TYPE.meta, ...TABULAR }}>
            {weight} × {rep}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setLogged((v) => !v)}
          style={{
            marginTop: 12,
            background: 'transparent',
            border: `${C3.hair}px solid ${C3.line2}`,
            borderRadius: C3.radius,
            color: logged ? C3.amber : C3.soft,
            fontFamily: FONTS.sans,
            fontSize: 11,
            letterSpacing: 1.2,
            padding: '10px 14px',
            minHeight: 44,
            width: '100%',
            textTransform: 'uppercase',
          }}
        >
          slot: {logged ? 'logged (amber)' : 'not logged (grey)'}
        </button>
      </Bench>

      <Bench
        title="145 rungs · 1.25kg steps"
        note="Virtualised above 60 values. Fling hard and check nothing blanks or snaps to the wrong rung."
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <NumberWheel
            values={micro}
            value={fine}
            onChange={(v) => { setFine(v); note(`fine → ${v}`); }}
            onLongPress={() => { setLongPresses((n) => n + 1); note('long press: fine'); }}
            width={104}
            logged
            unit="kilograms"
            ariaLabel="Fine weight, kilograms"
          />
          <div style={{ ...TYPE.meta, ...TABULAR }}>{fine} kg</div>
        </div>
      </Bench>

      <Bench title="Disabled" note="No scroll, no haptics, no keypad.">
        <NumberWheel
          values={barbell}
          value={60}
          onChange={() => {}}
          width={104}
          disabled
          unit="kilograms"
          ariaLabel="Disabled weight wheel, kilograms"
        />
      </Bench>

      <div style={{ padding: '0 22px' }}>
        <div style={label}>last event</div>
        <div style={{ ...TYPE.meta, color: C3.soft, marginTop: 6 }}>{lastEvent}</div>
        <div style={{ ...TYPE.body, color: C3.faint, marginTop: 16 }}>
          Hold any wheel for 450ms to fire the keypad hook. Arrow keys move one rung,
          PageUp/PageDown five, Home/End to the ends.
        </div>
      </div>
    </div>
  );
}
