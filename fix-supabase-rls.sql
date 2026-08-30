-- =========================================================================
-- THE SCENERY VINTAGE FARM - MULTI-DEVICE ONLINE SYNC FIX
-- Run this SQL in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/hrglhnddjbxxmlhbeysm/sql
-- =========================================================================

-- 1. Enable RLS and create permissive policies for both anon and authenticated users
ALTER TABLE IF EXISTS public.invoice_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.invoice_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.closed_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.close_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.close_round_edits ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 2. Drop old restrictive policies
DROP POLICY IF EXISTS invoice_history_authenticated_all ON public.invoice_history;
DROP POLICY IF EXISTS invoice_drafts_authenticated_all ON public.invoice_drafts;
DROP POLICY IF EXISTS closed_bookings_authenticated_all ON public.closed_bookings;
DROP POLICY IF EXISTS close_rounds_authenticated_all ON public.close_rounds;
DROP POLICY IF EXISTS close_round_edits_authenticated_all ON public.close_round_edits;
DROP POLICY IF EXISTS audit_logs_authenticated_all ON public.audit_logs;

DROP POLICY IF EXISTS "scenery_invoice_history_policy" ON public.invoice_history;
DROP POLICY IF EXISTS "scenery_invoice_drafts_policy" ON public.invoice_drafts;
DROP POLICY IF EXISTS "scenery_closed_bookings_policy" ON public.closed_bookings;
DROP POLICY IF EXISTS "scenery_close_rounds_policy" ON public.close_rounds;
DROP POLICY IF EXISTS "scenery_close_round_edits_policy" ON public.close_round_edits;
DROP POLICY IF EXISTS "scenery_audit_logs_policy" ON public.audit_logs;

-- 3. Create open policies allowing all devices using anonKey or auth token to Read & Write
CREATE POLICY "scenery_invoice_history_policy" ON public.invoice_history
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "scenery_invoice_drafts_policy" ON public.invoice_drafts
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "scenery_closed_bookings_policy" ON public.closed_bookings
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "scenery_close_rounds_policy" ON public.close_rounds
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "scenery_close_round_edits_policy" ON public.close_round_edits
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "scenery_audit_logs_policy" ON public.audit_logs
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- 4. Ensure foreign key column constraints do not block anon inserts
ALTER TABLE IF EXISTS public.invoice_history ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE IF EXISTS public.invoice_drafts ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE IF EXISTS public.closed_bookings ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE IF EXISTS public.close_rounds ALTER COLUMN submitted_by DROP NOT NULL;
ALTER TABLE IF EXISTS public.close_round_edits ALTER COLUMN updated_by DROP NOT NULL;
ALTER TABLE IF EXISTS public.audit_logs ALTER COLUMN actor_id DROP NOT NULL;

-- 5. Enable Realtime Publications for instant synchronization across all screens
ALTER TABLE IF EXISTS public.invoice_history REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS public.closed_bookings REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS public.close_rounds REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS public.close_round_edits REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS public.audit_logs REPLICA IDENTITY FULL;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='invoice_history') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.invoice_history;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='closed_bookings') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.closed_bookings;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='close_rounds') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.close_rounds;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='close_round_edits') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.close_round_edits;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='audit_logs') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_logs;
  END IF;
END $$;
