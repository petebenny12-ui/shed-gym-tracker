import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { C3, FONTS, INNER_HIGHLIGHT } from '../../design';

export default function PRFeed({ partnerId, partnerName }) {
  const { user } = useAuth();
  const [prs, setPrs] = useState([]);

  useEffect(() => {
    if (!partnerId || !user) return;

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
    <div style={{ background: C3.raise2, border: `1px solid ${C3.line2}`, borderRadius: C3.radius, padding: 16, boxShadow: INNER_HIGHLIGHT, marginTop: 14 }}>
      <div
        style={{
          fontFamily: FONTS.sans,
          fontSize: 11,
          fontWeight: 700,
          color: C3.amber,
          letterSpacing: 1.2,
          textTransform: 'uppercase',
          marginBottom: 12,
        }}
      >
        Recent PRs
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        {prs.map((pr, i) => {
          const isMe = pr.user_id === user?.id;
          return (
            <div
              key={i}
              style={{
                display: 'grid',
                gridTemplateColumns: 'auto 1fr auto auto',
                gap: 10,
                alignItems: 'center',
                padding: '6px 0',
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 2,
                  background: isMe ? C3.you : C3.crew,
                }}
              />
              <div style={{ color: C3.text, fontSize: 13 }}>{pr.exercises?.name}</div>
              <div style={{ color: isMe ? C3.you : C3.crew, fontSize: 13, fontWeight: 600 }}>
                {pr.weight_kg}kg × {pr.reps}
              </div>
              <div style={{ color: C3.muted, fontSize: 10 }}>
                {new Date(pr.achieved_at).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
