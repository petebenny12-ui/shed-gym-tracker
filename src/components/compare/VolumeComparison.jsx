export default function VolumeComparison({ myTotal, theirTotal, myName, theirName }) {
  return (
    <div className="mt-4 p-4 rounded-lg text-center" style={{ background: '#12121f', border: '1px solid #2a2a3e' }}>
      <div className="text-gray-500 text-xs uppercase tracking-wider mb-2">Total Volume (All Time)</div>
      <div className="flex justify-around">
        <div>
          <div className="text-amber-600 text-xl font-bold">{Math.round(myTotal).toLocaleString()}kg</div>
          <div className="text-gray-500 text-xs">{myName}</div>
        </div>
        <div>
          <div className="text-amber-600 text-xl font-bold">{Math.round(theirTotal).toLocaleString()}kg</div>
          <div className="text-gray-500 text-xs">{theirName}</div>
        </div>
      </div>
    </div>
  );
}
