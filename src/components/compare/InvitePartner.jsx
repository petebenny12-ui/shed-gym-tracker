import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

export default function InvitePartner({ onInviteSent }) {
  const { user } = useAuth();
  const [inviteLink, setInviteLink] = useState(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const generateInvite = async () => {
    setLoading(true);

    // Check for existing pending or accepted partnership
    const { data: existing } = await supabase
      .from('vs_partnerships')
      .select('id, status, invite_code')
      .or(`inviter_id.eq.${user.id},invitee_id.eq.${user.id}`)
      .in('status', ['pending', 'accepted']);

    if (existing && existing.length > 0) {
      const accepted = existing.find(p => p.status === 'accepted');
      if (accepted) {
        console.log('[Invite] Already have an accepted partnership');
        setLoading(false);
        return;
      }
      const pending = existing.find(p => p.status === 'pending');
      if (pending) {
        // Reuse existing pending invite
        const link = `${window.location.origin}/invite/${pending.invite_code}`;
        setInviteLink(link);
        setLoading(false);
        return;
      }
    }

    const code = crypto.randomUUID().slice(0, 8);

    const { error } = await supabase.from('vs_partnerships').insert({
      inviter_id: user.id,
      invite_code: code,
      status: 'pending',
    });

    if (error) {
      console.error('Invite error:', error);
      setLoading(false);
      return;
    }

    const link = `${window.location.origin}/invite/${code}`;
    setInviteLink(link);
    setLoading(false);
    onInviteSent?.();
  };

  const copyLink = async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select text
    }
  };

  return (
    <div className="p-4 rounded-lg" style={{ background: '#12121f', border: '1px solid #2a2a3e' }}>
      <div className="text-gray-400 text-xs uppercase tracking-wider mb-3">Invite a Training Partner</div>

      {!inviteLink ? (
        <button
          onClick={generateInvite}
          disabled={loading}
          className="w-full py-3 font-bold text-sm uppercase rounded-lg"
          style={{ background: '#d97706', color: '#0a0a0f', opacity: loading ? 0.7 : 1 }}
        >
          {loading ? 'Generating...' : 'Generate Invite Link'}
        </button>
      ) : (
        <div>
          <div
            className="p-3 rounded mb-3 text-amber-600 text-xs break-all text-center font-mono"
            style={{ background: '#1a1a2e', border: '1px solid #2a2a3e' }}
          >
            {inviteLink}
          </div>
          <button
            onClick={copyLink}
            className="w-full py-2 font-bold text-sm uppercase rounded"
            style={{ background: copied ? '#22c55e' : '#d97706', color: '#0a0a0f' }}
          >
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
          <div className="text-gray-500 text-xs text-center mt-2">
            Send this link to your training partner via text or WhatsApp
          </div>
        </div>
      )}
    </div>
  );
}
