import { C, CARD_DEPTH } from '../../config/constants';

export default function VolumeComparison({ myTotal, theirTotal, myName, theirName }) {
  return (
    <div className="mt-4 p-4 rounded-lg text-center" style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: CARD_DEPTH }}>
      <div className="text-xs uppercase tracking-wider mb-2" style={{ color: C.muted }}>Total Volume (All Time)</div>
      <div className="flex justify-around">
        <div>
          <div className="text-xl font-bold" style={{ color: C.user }}>{Math.round(myTotal).toLocaleString()}kg</div>
          <div className="text-xs" style={{ color: C.user }}>{myName}</div>
        </div>
        <div>
          <div className="text-xl font-bold" style={{ color: C.vs }}>{Math.round(theirTotal).toLocaleString()}kg</div>
          <div className="text-xs" style={{ color: C.vs }}>{theirName}</div>
        </div>
      </div>
    </div>
  );
}
