import { useState, useEffect } from 'react';
import { supabase, withTimeout } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { C3, FONTS } from '../../design';

export default function WizardSuccess({ onClose, editDayOnly, routineSnapshot }) {
  const { user } = useAuth();
  const [partner, setPartner] = useState(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (editDayOnly || !user) return;
    // Check for active VS partner
    withTimeout(
      supabase
        .from('vs_partnerships')
        .select('inviter_id, invitee_id, profiles!vs_partnerships_inviter_id_fkey(display_name), invitee:profiles!vs_partnerships_invitee_id_fkey(display_name)')
        .eq('status', 'accepted')
        .or(`inviter_id.eq.${user.id},invitee_id.eq.${user.id}`)
        .limit(1),
      'wizard:fetchPartner'
    ).then(({ data }) => {
      if (data?.length > 0) {
        const p = data[0];
        const partnerId = p.inviter_id === user.id ? p.invitee_id : p.inviter_id;
        // Simple name fetch
        withTimeout(
          supabase.from('profiles').select('display_name').eq('id', partnerId).single(),
          'wizard:partnerName'
        ).then(({ data: profile }) => {
          setPartner({ id: partnerId, name: profile?.display_name || 'Partner' });
        });
      }
    });
  }, [user, editDayOnly]);

  const handleSendToPartner = async () => {
    if (!partner || !routineSnapshot) return;
    setSending(true);

    const { error } = await withTimeout(
      supabase.from('routine_invites').insert({
        from_user_id: user.id,
        to_user_id: partner.id,
        routine_snapshot: routineSnapshot,
      }),
      'wizard:sendInvite'
    );

    setSending(false);
    if (!error) setSent(true);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: C3.bg }}>
      <div className="text-center">
        <div className="text-6xl mb-4" style={{ color: C3.pr }}>&#10003;</div>
        <h2 className="text-white text-xl font-bold uppercase tracking-wider mb-2"
          style={{ fontFamily: FONTS.sans }}>
          {editDayOnly ? 'Day Updated' : 'Routine Saved'}
        </h2>
        <p className="text-gray-400 text-sm mb-6">
          {editDayOnly
            ? 'Your training day has been updated.'
            : 'Your new routine is ready. Past workout history is preserved.'}
        </p>

        {partner && !editDayOnly && !sent && (
          <button
            onClick={handleSendToPartner}
            disabled={sending}
            className="w-full py-3 mb-3 font-bold text-sm uppercase rounded-lg transition-all"
            style={{ background: C3.raise2, color: C3.amber, border: `1px solid ${C3.line2}` }}
          >
            {sending ? 'SENDING...' : `SEND TO ${partner.name.toUpperCase()}`}
          </button>
        )}

        {sent && (
          <div className="text-green-400 text-sm mb-3 font-bold">
            Routine sent to {partner.name}!
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full py-3 font-bold text-lg uppercase rounded-lg"
          style={{ background: C3.amber, color: C3.bg, letterSpacing: 1.2 }}
        >
          DONE
        </button>
      </div>
    </div>
  );
}
