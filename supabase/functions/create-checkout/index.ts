// Supabase Edge Function (Deno) — creates a Stripe Checkout Session for a NEW
// subscription. Existing subscribers change plans via the customer portal.
//
// Secrets (supabase secrets set ...):
//   STRIPE_SECRET_KEY      sk_test_... / sk_live_...
//   STRIPE_PRICE_TIER1     price_...   (Standard, 68 SGD/月)
//   STRIPE_PRICE_TIER2     price_...   (Premium,  94 SGD/月)
//   STRIPE_PRICE_TIER3     price_...   (Ultimate, 133 SGD/月)
// SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY are auto-injected.
//
// Deploy: supabase functions deploy create-checkout

import Stripe from "npm:stripe@^17";
import { createClient } from "npm:@supabase/supabase-js@^2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "content-type": "application/json" },
  });

function priceForTier(tier: number): string | undefined {
  if (tier === 1) return Deno.env.get("STRIPE_PRICE_TIER1");
  if (tier === 2) return Deno.env.get("STRIPE_PRICE_TIER2");
  if (tier === 3) return Deno.env.get("STRIPE_PRICE_TIER3");
  return undefined;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    // Identify the user from their Supabase JWT (sent automatically by the app).
    const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
    const supa = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
    );
    const {
      data: { user },
    } = await supa.auth.getUser(token);
    if (!user) return json({ error: "未授权，请先登录。" }, 401);

    const { tier, successUrl, cancelUrl } = (await req.json()) as {
      tier?: number;
      successUrl?: string;
      cancelUrl?: string;
    };
    const price = priceForTier(Number(tier));
    if (!price) return json({ error: "无效的方案。" }, 400);

    // Find (or create) this user's Stripe customer, stored on their subscriptions row.
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: row } = await admin
      .from("subscriptions")
      .select("tier,stripe_customer_id,has_trialed")
      .eq("user_id", user.id)
      .maybeSingle();

    // Comp / admin account: a hand-granted tier with no Stripe customer. Starting a
    // real subscription would create a Stripe customer and bill a card, so refuse
    // checkout (the UI disables the buttons too).
    if ((row?.tier ?? 0) > 0 && !row?.stripe_customer_id) {
      return json({ error: "管理员账户无需订阅。" }, 403);
    }

    let customerId: string | undefined = row?.stripe_customer_id ?? undefined;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        metadata: { user_id: user.id },
      });
      customerId = customer.id;
      await admin
        .from("subscriptions")
        .upsert({ user_id: user.id, stripe_customer_id: customerId }, { onConflict: "user_id" });
    }

    // First-time subscribers get a 7-day free trial; anyone who has trialed before
    // does not (the webhook sets has_trialed when a trial starts).
    const giveTrial = !row?.has_trialed;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price, quantity: 1 }],
      success_url: successUrl ?? "",
      cancel_url: cancelUrl ?? "",
      client_reference_id: user.id,
      // So the webhook can map the subscription back to this user.
      subscription_data: {
        metadata: { user_id: user.id },
        ...(giveTrial ? { trial_period_days: 7 } : {}),
      },
      // Always collect the card — even during the $0 trial — so a trial can't be
      // farmed with throwaway emails, and it converts automatically on day 7.
      payment_method_collection: "always",
      allow_promotion_codes: true,
    });

    return json({ url: session.url });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
