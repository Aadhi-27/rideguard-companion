CREATE TABLE public.rider_locations (
  user_id uuid PRIMARY KEY,
  display_name text NOT NULL DEFAULT 'Rider',
  vehicle text NOT NULL DEFAULT '',
  has_rideguard boolean NOT NULL DEFAULT false,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  sharing boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rider_locations TO authenticated;
GRANT ALL ON public.rider_locations TO service_role;
ALTER TABLE public.rider_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "See own or sharing riders" ON public.rider_locations FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR (sharing AND updated_at > now() - interval '15 minutes'));
CREATE POLICY "Insert own" ON public.rider_locations FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Update own" ON public.rider_locations FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Delete own" ON public.rider_locations FOR DELETE TO authenticated USING (user_id = auth.uid());
ALTER PUBLICATION supabase_realtime ADD TABLE public.rider_locations;