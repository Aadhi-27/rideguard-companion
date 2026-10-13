CREATE TABLE public.family_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  name text NOT NULL,
  relation text NOT NULL DEFAULT 'Family',
  age int NOT NULL DEFAULT 18,
  licence text NOT NULL DEFAULT 'Not added',
  email text,
  phone text,
  member_user_id uuid,
  photo text,
  face boolean NOT NULL DEFAULT false,
  finger boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.family_members TO authenticated;
GRANT ALL ON public.family_members TO service_role;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner manages family" ON public.family_members FOR ALL TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Member sees own row" ON public.family_members FOR SELECT TO authenticated
  USING (member_user_id = auth.uid());

-- Links a signed-in user to family rows created with their (verified) email
CREATE OR REPLACE FUNCTION public.claim_family_membership()
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.family_members SET member_user_id = auth.uid()
  WHERE member_user_id IS NULL AND auth.uid() IS NOT NULL
    AND lower(email) = lower(auth.jwt() ->> 'email')
    AND coalesce((auth.jwt() ->> 'email_verified')::boolean, true);
$$;
REVOKE ALL ON FUNCTION public.claim_family_membership() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.claim_family_membership() TO authenticated;

CREATE TABLE public.ride_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  member_id uuid NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  requester_id uuid NOT NULL,
  note text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz
);
GRANT SELECT, INSERT, UPDATE ON public.ride_requests TO authenticated;
GRANT ALL ON public.ride_requests TO service_role;
ALTER TABLE public.ride_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner or requester sees" ON public.ride_requests FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR requester_id = auth.uid());
CREATE POLICY "Minor member requests" ON public.ride_requests FOR INSERT TO authenticated
  WITH CHECK (requester_id = auth.uid() AND status = 'pending' AND EXISTS (
    SELECT 1 FROM public.family_members m
    WHERE m.id = member_id AND m.owner_id = ride_requests.owner_id AND m.member_user_id = auth.uid()));
CREATE POLICY "Owner decides" ON public.ride_requests FOR UPDATE TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid() AND status IN ('pending','approved','denied'));

ALTER PUBLICATION supabase_realtime ADD TABLE public.ride_requests;