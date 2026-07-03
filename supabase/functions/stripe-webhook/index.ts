// Supabase Edge Function (Deno) — Stripe webhook. THE source of truth for a
// user's tier: it verifies Stripe's signature and writes `subscriptions`. The
// client can never set its own tier (Phase 1 RLS blocks writes).
//
// Secrets: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_TIER1, STRIPE_PRICE_TIER2, STRIPE_PRICE_TIER3.
// IMPORTANT: deploy WITHOUT JWT verification (Stripe doesn't send a Supabase JWT):
//   supabase functions deploy stripe-webhook --no-verify-jwt

import Stripe from "npm:stripe@^17";
import { createClient } from "npm:@supabase/supabase-js@^2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  httpClient: Stripe.createFetchHttpClient(),
});
const cryptoProvider = Stripe.createSubtleCryptoProvider();
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;
const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

// Map a Stripe price back to a tier level (the reverse of create-checkout).
function tierForPrice(priceId?: string): number {
  if (priceId && priceId === Deno.env.get("STRIPE_PRICE_TIER1")) return 1;
  if (priceId && priceId === Deno.env.get("STRIPE_PRICE_TIER2")) return 2;
  if (priceId && priceId === Deno.env.get("STRIPE_PRICE_TIER3")) return 3;
  return 0;
}

// deno-lint-ignore no-explicit-any
async function resolveUserId(sub: any): Promise<string | null> {
  if (sub.metadata?.user_id) return sub.metadata.user_id as string;
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
  if (!customerId) return null;
  const { data } = await admin
    .from("subscriptions")
    .select("user_id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  if (data?.user_id) return data.user_id as string;
  try {
    const customer = await stripe.customers.retrieve(customerId);
    // deno-lint-ignore no-explicit-any
    return ((customer as any)?.metadata?.user_id as string) ?? null;
  } catch {
    return null;
  }
}

// Enforce "one free trial per physical card": when a trial starts, look up the
// card's fingerprint (stable across accounts/emails) and record it. If the same
// card already trialed under a DIFFERENT user, end the trial now so it converts to
// an immediate charge instead of a second free week. Fails open on any error — a
// legitimate customer is never blocked because a lookup failed.
// deno-lint-ignore no-explicit-any
async function enforceTrialCard(sub: any, userId: string) {
  try {
    let pmId: string | null =
      typeof sub.default_payment_method === "string"
        ? sub.default_payment_method
        : sub.default_payment_method?.id ?? null;
    if (!pmId) {
      const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
      if (customerId) {
        const cust = await stripe.customers.retrieve(customerId);
        // deno-lint-ignore no-explicit-any
        pmId = (cust as any)?.invoice_settings?.default_payment_method ?? null;
      }
    }
    if (!pmId) return; // no card visible yet — allow the trial
    const pm = await stripe.paymentMethods.retrieve(pmId);
    const fp = pm.card?.fingerprint ?? null;
    if (!fp) return;

    // Claim the fingerprint for this user. A unique-violation = it was used before.
    const { error: insErr } = await admin
      .from("trial_cards")
      .insert({ fingerprint: fp, user_id: userId });
    if (!insErr) return; // first use of this card — allow the trial

    const { data: owner } = await admin
      .from("trial_cards")
      .select("user_id")
      .eq("fingerprint", fp)
      .maybeSingle();
    if (owner?.user_id && owner.user_id !== userId) {
      // Same card, different account → trial farming. End the trial immediately.
      await stripe.subscriptions.update(sub.id, { trial_end: "now" });
    }
  } catch {
    /* fail open — never block a real customer on an error here */
  }
}

// deno-lint-ignore no-explicit-any
async function syncSubscription(sub: any) {
  const userId = await resolveUserId(sub);
  if (!userId) return;
  const status = sub.status as string;
  const active = status === "active" || status === "trialing";
  const priceId = sub.items?.data?.[0]?.price?.id as string | undefined;
  const tier = active ? tierForPrice(priceId) : 0;
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
  const periodEnd = sub.current_period_end
    ? new Date(sub.current_period_end * 1000).toISOString()
    : null;

  // deno-lint-ignore no-explicit-any
  const upsertData: Record<string, any> = {
    user_id: userId,
    tier,
    status,
    stripe_customer_id: customerId,
    stripe_subscription_id: sub.id,
    current_period_end: periodEnd,
    updated_at: new Date().toISOString(),
  };
  // Mark that this user has started a trial (never reset once true), so
  // create-checkout won't grant them another one later.
  if (status === "trialing") upsertData.has_trialed = true;

  await admin.from("subscriptions").upsert(upsertData, { onConflict: "user_id" });

  // Enforce one free trial per physical card (across accounts / emails).
  if (status === "trialing") await enforceTrialCard(sub, userId);
}

Deno.serve(async (req) => {
  const sig = req.headers.get("stripe-signature");
  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig!, webhookSecret, undefined, cryptoProvider);
  } catch (e) {
    return new Response(`Webhook Error: ${e instanceof Error ? e.message : String(e)}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        // deno-lint-ignore no-explicit-any
        const session = event.data.object as any;
        if (session.mode === "subscription" && session.subscription) {
          const sub = await stripe.subscriptions.retrieve(session.subscription as string);
          // Make sure the user_id is present even if subscription_data metadata was dropped.
          if (!sub.metadata?.user_id && session.client_reference_id) {
            sub.metadata = { ...(sub.metadata ?? {}), user_id: session.client_reference_id };
          }
          await syncSubscription(sub);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await syncSubscription(event.data.object);
        break;
    }
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (e) {
    return new Response(`Handler Error: ${e instanceof Error ? e.message : String(e)}`, { status: 500 });
  }
});
