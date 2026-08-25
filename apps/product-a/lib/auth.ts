import { getSupabaseClient } from "./supabase";

type AuthResult = { error: string | null };

export const AUTH_CHANGED_EVENT = "product-a:auth-changed";

// signUp/signIn resolve their session before ensureCustomerRow's insert finishes, so
// Supabase's own onAuthStateChange fires too early for listeners that also need the
// customers row to exist (e.g. AuthNav). Fire this once the row is actually ready.
function notifyAuthChanged(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
  }
}

async function ensureCustomerRow(): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return;
  }

  // create_customer_row is idempotent (returns the existing row's id if one already exists) and
  // derives auth_user_id from auth.uid() server-side — a direct client-side insert would let any
  // signed-up user set reward_points (or any other column) to an arbitrary value themselves.
  const { error } = await supabase.rpc("create_customer_row");
  if (error) {
    throw error;
  }
}

export async function signUp(email: string, password: string): Promise<AuthResult> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { error: "Supabase isn't configured yet." };
  }

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    return { error: error.message };
  }
  if (data.user) {
    await ensureCustomerRow();
    notifyAuthChanged();
  }
  return { error: null };
}

export async function signIn(email: string, password: string): Promise<AuthResult> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { error: "Supabase isn't configured yet." };
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { error: error.message };
  }
  if (data.user) {
    await ensureCustomerRow();
    notifyAuthChanged();
  }
  return { error: null };
}

export async function signOut(): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return;
  }
  await supabase.auth.signOut();
  notifyAuthChanged();
}

export type CurrentCustomer = {
  customerId: string;
  email: string | null;
  signupDate: string | null;
  rewardPoints: number;
};

export async function getCurrentCustomer(): Promise<CurrentCustomer | null> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return null;
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const authUser = sessionData.session?.user;
  if (!authUser) {
    return null;
  }

  const { data } = await supabase
    .from("customers")
    .select("customer_id, signup_date, reward_points")
    .eq("auth_user_id", authUser.id)
    .maybeSingle();

  if (!data) {
    return null;
  }

  return {
    customerId: data.customer_id,
    email: authUser.email ?? null,
    signupDate: data.signup_date,
    rewardPoints: data.reward_points,
  };
}

export async function getCurrentCustomerId(): Promise<string | null> {
  const customer = await getCurrentCustomer();
  return customer?.customerId ?? null;
}
