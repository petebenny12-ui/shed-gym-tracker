import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { C, CARD_DEPTH } from '../../config/constants';

export default function PRFeed({ partnerId, partnerName }) {
  const { user } = useAuth();
  const [prs, setPrs] = useState([]);

  useEffect(() => {
    if (!partnerId || !user) return;

    // Fetch PRs from both users, merge and sort by date
    Promise.all([
      supabase
        .from('personal_records')
        .select('user_id, weight_kg, reps, achieved_at, exercises ( name )')
        .eq('user_id', user.id)
        .order('achieved_at', { ascending: false })
        .limit(8),
      supabase
        .from('personal_records')
        .select('user_id, weight_kg, reps, achieved_at, exercises ( name )')
        .eq('user_id', partnerId)
        .order('achieved_at', { ascending: false })
        .limit(8),
    ]).then(([mine, theirs]) => {
      const all = [...(mine.data || []), ...(theirs.data || [])]
        .sort((a, b) => new Date(b.achieved_at) - new Date(a.achieved_at))
        .slice(0, 8);
      setPrs(all);
    });
  }, [partnerId, user]);

  if (prs.length === 0) return null;

  return (
    <div className="mt-4 p-3 rounded-lg" style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: CARD_DEPTH }}>
      <div className="text-xs uppercase tracking-wider mb-2" style={{ color: C.muted }}>
        Recent PRs
      </div>
      <div className="space-y-2">
        {prs.map((pr, i) => {
          const isMe = pr.user_id === user?.id;
          const dotColor = isMe ? C.user : C.vs;
          const valueColor = isMe ? C.user : C.vs;
          return (
            <div key={i} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: dotColor }} />
              <span className="text-xs font-bold flex-1" style={{ color: C.text }}>{pr.exercises?.name}</span>
              <span className="text-xs font-bold" style={{ color: valueColor }}>
                {pr.weight_kg}kg &times; {pr.reps}
              </span>
              <span className="text-xs" style={{ color: C.dim }}>
                {new Date(pr.achieved_at).toLocaleDateString()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
