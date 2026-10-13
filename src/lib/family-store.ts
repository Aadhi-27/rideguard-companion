import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type StoredMember = {
  id: string;
  name: string;
  relation: string;
  age: number;
  licence: string;
  face: boolean;
  finger: boolean;
  minor: boolean;
  photo?: string | null;
  email?: string | null;
  phone?: string | null;
  owner_id: string;
  member_user_id?: string | null;
};

type Row = Omit<StoredMember, "minor">;
const toMember = (r: Row): StoredMember => ({ ...r, minor: r.age < 18 });

/** All family rows the signed-in user can see (their own family + their own member row). */
export async function fetchFamily(): Promise<StoredMember[]> {
  const { data, error } = await supabase.from("family_members").select("*").order("created_at");
  if (error) throw error;
  return (data as Row[]).map(toMember);
}

/** Back-compat name used by face checks. */
export const readFamily = fetchFamily;

export function useFamily() {
  const { user, loading } = useAuth();
  const [family, setFamily] = useState<StoredMember[]>([]);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!user) { setFamily([]); return; }
    try {
      await supabase.rpc("claim_family_membership");
      setFamily(await fetchFamily());
    } catch { setError("Couldn't load your family. Check your connection."); }
  }, [user]);

  useEffect(() => { void reload(); }, [reload]);

  const add = async (m: { name: string; relation: string; age: number; email?: string; phone?: string }) => {
    if (!user) return;
    const { error } = await supabase.from("family_members").insert({ ...m, owner_id: user.id, email: m.email || null, phone: m.phone || null });
    if (error) setError("Couldn't save the member."); else await reload();
  };
  const update = async (id: string, patch: Partial<Pick<StoredMember, "face" | "finger" | "photo" | "licence">>) => {
    const { error } = await supabase.from("family_members").update(patch).eq("id", id);
    if (error) setError("Couldn't save the change."); else await reload();
  };
  const remove = async (id: string) => {
    const { error } = await supabase.from("family_members").delete().eq("id", id);
    if (error) setError("Couldn't remove the member."); else await reload();
  };

  return { user, loading, family, error, add, update, remove, reload };
}
