import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function PRFeed({ partnerId, partnerName }) {
  const [prs, setPrs] = useState([]);

  useEffect(() => {
    if (!partnerId) return;
    supabase
      .from('personal_records')
      .select('weight_kg, reps, achieved_at, exercises ( name )')
      .eq('user_id', partnerId)
      .order('achieved_at', { ascending: false })
      .limit(5)
      .then(({ data }) => setPrs(data || []));
  }, [partnerId]);

  if (prs.length === 0) return null;

  return (
    <div className="mt-4 p-3 rounded-lg" style={{ background: '#12121f', border: '1px solid #2a2a3e' }}>
      <div className="text-gray-400 text-xs uppercase tracking-wider mb-2">
        {partnerName}'s Recent PRs
      </div>
      <div className="space-y-2">
        {prs.map((pr, i) => (
          <div key={i} className="flex justify-between items-center">
            <span className="text-white text-xs font-bold">{pr.exercises?.name}</span>
            <span className="text-amber-600 text-xs font-bold">
              {pr.weight_kg}kg &times; {pr.reps}
            </span>
            <span className="text-gray-600 text-xs">
              {new Date(pr.achieved_at).toLocaleDateString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
