import { useState, useEffect } from 'react';
import { supabase, withTimeout } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useRoutine } from '../../hooks/useRoutine';

export default function RoutineInviteBanner() {
  const { user } = useAuth();
  const { refetch } = useRoutine();
  const [invite, setInvite] = useState(null);
  const [fromName, setFromName] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    if (!user) return;
    withTimeout(
      supabase
        .from('routine_invites')
        .select('*')
        .eq('to_user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1),
      'fetchRoutineInvite'
    ).then(({ data }) => {
      if (data?.length > 0) {
        setInvite(data[0]);
        // Fetch sender name
        withTimeout(
          supabase.from('profiles').select('display_name').eq('id', data[0].from_user_id).single(),
          'fetchInviteSender'
        ).then(({ data: profile }) => {
          setFromName(profile?.display_name || 'Your partner');
        });
      }
    });
  }, [user]);

  if (!invite) return null;

  const snapshot = invite.routine_snapshot;

  const handleAccept = async () => {
    setAccepting(true);
    try {
      // Delete existing routines
      await withTimeout(
        supabase.from('routines').delete().eq('user_id', user.id),
        'inviteAccept:deleteRoutines'
      );

      // Get exercise name -> ID map
      const { data: exercises } = await supabase.from('exercises').select('id, name');
      const exMap = {};
      for (const ex of exercises) exMap[ex.name] = ex.id;

      // Insert new routines from snapshot
      for (const day of snapshot) {
        const { data: routine, error: rErr } = await withTimeout(
          supabase.from('routines').insert({
            user_id: user.id,
            day_number: day.dayNumber,
            title: day.title,
          }).select().single(),
          'inviteAccept:insertRoutine'
        );
        if (rErr) throw rErr;

        const rows = day.pairings.map((p, i) => ({
          routine_id: routine.id,
          label: p.label,
          exercise1_id: p.ex1.id,
          exercise2_id: p.ex2?.id || null,
          sort_order: i,
        }));

        if (rows.length > 0) {
          const { error: sErr } = await withTimeout(
            supabase.from('routine_supersets').insert(rows),
            'inviteAccept:insertSupersets'
          );
          if (sErr) throw sErr;
        }
      }

      // Mark invite as accepted
      await withTimeout(
        supabase.from('routine_invites').update({ status: 'accepted' }).eq('id', invite.id),
        'inviteAccept:markAccepted'
      );

      await refetch();
      setInvite(null);
    } catch (err) {
      console.error('[RoutineInvite] Accept failed:', err);
      alert('Failed to accept routine. Please try again.');
    }
    setAccepting(false);
  };

  const handleDismiss = async () => {
    await withTimeout(
      supabase.from('routine_invites').update({ status: 'dismissed' }).eq('id', invite.id),
      'inviteDismiss'
    );
    setInvite(null);
  };

  return (
    <div className="mx-3 mt-2 p-3 rounded-lg" style={{ background: '#1a1a2e', border: '1px solid #d97706' }}>
      <div className="text-amber-600 text-xs font-bold uppercase tracking-wider mb-1">
        New Routine from {fromName}
      </div>
      <div className="text-gray-400 text-sm mb-2">
        {fromName} sent you their new routine — {snapshot?.length || 0} days.
      </div>

      {!showPreview ? (
        <div className="flex gap-2">
          <button
            onClick={() => setShowPreview(true)}
            className="flex-1 py-2 rounded text-xs font-bold uppercase"
            style={{ background: '#d97706', color: '#0a0a0f' }}
          >
            Preview & Accept
          </button>
          <button
            onClick={handleDismiss}
            className="px-3 py-2 rounded text-xs font-bold uppercase"
            style={{ background: '#2a2a3e', color: '#888' }}
          >
            Dismiss
          </button>
        </div>
      ) : (
        <div>
          {/* Preview */}
          <div className="space-y-2 mb-3 max-h-60 overflow-y-auto">
            {snapshot?.map((day, d) => (
              <div key={d}>
                <div className="text-amber-600 text-xs font-bold">
                  Day {day.dayNumber} — {day.title}
                </div>
                {day.pairings?.map(p => (
                  <div key={p.label} className="text-gray-300 text-xs pl-2">
                    {p.label}: {p.ex1?.name}{p.ex2 ? ` + ${p.ex2.name}` : ''}
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleAccept}
              disabled={accepting}
              className="flex-1 py-2 rounded text-xs font-bold uppercase"
              style={{ background: '#22c55e', color: '#0a0a0f' }}
            >
              {accepting ? 'APPLYING...' : 'ACCEPT & REPLACE'}
            </button>
            <button
              onClick={handleDismiss}
              className="px-3 py-2 rounded text-xs font-bold uppercase"
              style={{ background: '#2a2a3e', color: '#888' }}
            >
              Dismiss
            </button>
          </div>
          <div className="text-red-400 text-xs mt-1">
            This will replace your current routine. Workout history is not affected.
          </div>
        </div>
      )}
    </div>
  );
}
