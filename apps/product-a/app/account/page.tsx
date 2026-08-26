"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AUTH_CHANGED_EVENT, getCurrentCustomer, type CurrentCustomer } from "@/lib/auth";

export default function AccountPage() {
  const [customer, setCustomer] = useState<CurrentCustomer | null | "loading">("loading");

  useEffect(() => {
    getCurrentCustomer().then(setCustomer);

    // Logging out/in via the nav while already sitting on /account doesn't remount this page, so
    // without this, the displayed account data (or the login gate) would go stale.
    function handleAuthChanged() {
      getCurrentCustomer().then(setCustomer);
    }
    window.addEventListener(AUTH_CHANGED_EVENT, handleAuthChanged);
    return () => window.removeEventListener(AUTH_CHANGED_EVENT, handleAuthChanged);
  }, []);

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-2xl font-semibold">Your account</h1>

      {customer === "loading" && null}

      {customer === null && (
        <p className="mt-4 text-sm text-stone-500">
          <Link href="/login" className="underline">
            Log in
          </Link>{" "}
          to see your account.
        </p>
      )}

      {customer && customer !== "loading" && (
        <dl className="mt-6 divide-y divide-stone-200">
          <div className="flex justify-between py-3">
            <dt className="text-sm text-stone-500">Customer ID</dt>
            <dd className="font-mono text-sm">{customer.customerId}</dd>
          </div>
          <div className="flex justify-between py-3">
            <dt className="text-sm text-stone-500">Email</dt>
            <dd className="text-sm">{customer.email ?? "—"}</dd>
          </div>
          <div className="flex justify-between py-3">
            <dt className="text-sm text-stone-500">Member since</dt>
            <dd className="text-sm">{customer.signupDate ?? "—"}</dd>
          </div>
          <div className="flex justify-between py-3">
            <dt className="text-sm text-stone-500">Loyalty points</dt>
            <dd className="text-sm">{customer.rewardPoints}</dd>
          </div>
        </dl>
      )}
    </main>
  );
}
