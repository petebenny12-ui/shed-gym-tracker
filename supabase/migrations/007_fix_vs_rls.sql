-- Fix: RLS policy "vs_own" blocks invite acceptance because invitee_id is NULL
-- on pending invites, so the accepting user can't UPDATE the row.
--
-- Solution: Add a dedicated policy that lets any authenticated user claim a
-- pending invite by setting themselves as invitee and marking it accepted.

-- Allow any authenticated user to UPDATE a pending invite (to accept it)
-- USING: row must be pending (visible to the updater)
-- WITH CHECK: after update, invitee_id must be the current user and status must be 'accepted'
CREATE POLICY "vs_accept_invite" ON vs_partnerships
  FOR UPDATE
  USING (status = 'pending')
  WITH CHECK (invitee_id = auth.uid() AND status = 'accepted');
