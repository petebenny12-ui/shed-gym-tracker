-- ONE-TIME CLEANUP: Run this in Supabase SQL Editor
-- Step 1: See all vs_partnerships rows
SELECT id, inviter_id, invitee_id, status, invite_code, created_at
FROM vs_partnerships
ORDER BY created_at;

-- Step 2: Delete duplicate pending invites, keeping only the most recent one per inviter
-- (Run this AFTER reviewing Step 1 output)
DELETE FROM vs_partnerships
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY inviter_id, status ORDER BY created_at DESC) AS rn
    FROM vs_partnerships
    WHERE status = 'pending'
  ) dupes
  WHERE rn > 1
);

-- Step 3: Verify cleanup
SELECT id, inviter_id, invitee_id, status, invite_code, created_at
FROM vs_partnerships
ORDER BY created_at;
