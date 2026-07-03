'use client';

import { useEffect, useState } from "react";
import { useAuth } from "../../components/AuthProvider";
import { useAccessLevel } from "../../components/AccessProvider";
import { useBilling } from "../../components/useBilling";
import { TIERS } from "../../lib/tiers";
import { supabase } from "../../lib/supabase";

const primaryBtn =
  "w-full rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600 disabled:opacity-60";
const disabledBtn = "w-full rounded-lg bg-zinc-100 px-4 py-2.5 text-sm font-semibold text-zinc-400";

export default function SubscriptionPage() {
  const { user, openModal } = useAuth();
  const { level, loading, refresh } = useAccessLevel();
  const { busy, error, startCheckout, openPortal } = useBilling();
  const [notice, setNotice] = useState<"success" | "cancelled" | null>(null);
  const [isComp, setIsComp] = useState(false);
  const [hasTrialed, setHasTrialed] = useState(false);
  const [trialEndsAt, setTrialEndsAt] = useState<number | null>(null);

  // Returning from Stripe Checkout: show the notice once, and drop the ?checkout=
  // param so it can't reappear on a reload or when navigating away and back.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("checkout");
    if (p !== "success" && p !== "cancelled") return;
    setNotice(p);
    window.history.replaceState(null, "", window.location.pathname);
  }, []);

  // After a successful checkout the webhook may lag, so poll the tier until it
  // reflects the paid level (capped at 20s), then hide the "正在更新…" line.
  useEffect(() => {
    if (notice !== "success") return;
    if (level > 0) {
      setNotice(null);
      return;
    }
    const iv = setInterval(refresh, 2000);
    const stop = setTimeout(() => clearInterval(iv), 20000);
    return () => {
      clearInterval(iv);
      clearTimeout(stop);
    };
  }, [notice, level, refresh]);

  // A comp / admin account is a subscriptions row granted a tier by hand (tier > 0)
  // with no Stripe customer behind it. It must not hit Checkout/Portal (Stripe has
  // nothing to manage), so we disable the upgrade / downgrade / cancel buttons.
  useEffect(() => {
    let cancelled = false;
    async function check() {
      if (!supabase || !user) {
        setIsComp(false);
        setHasTrialed(false);
        setTrialEndsAt(null);
        return;
      }
      const { data } = await supabase
        .from("subscriptions")
        .select("tier,stripe_customer_id,has_trialed,status,current_period_end")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      setIsComp((data?.tier ?? 0) > 0 && !data?.stripe_customer_id);
      setHasTrialed(!!data?.has_trialed);
      setTrialEndsAt(
        data?.status === "trialing" && data?.current_period_end
          ? new Date(data.current_period_end).getTime()
          : null,
      );
    }
    check();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  return (
    <div className="w-full">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-amber-900">订阅方案</h2>
        <p className="mt-2 text-zinc-600">选择适合您的方案，解锁更深入的命盘解析。</p>
        {!user && (
          <p className="mt-2 text-sm text-amber-700">
            请先
            <button
              type="button"
              onClick={() => openModal("/subscription")}
              className="font-semibold underline underline-offset-2 hover:text-amber-900"
            >
              登录或注册
            </button>
            以订阅。
          </p>
        )}
      </div>

      {notice === "success" && (
        <p className="mx-auto mb-6 max-w-md rounded-lg bg-green-50 px-4 py-3 text-center text-sm font-medium text-green-700">
          订阅成功，正在确认您的试用资格…
        </p>
      )}
      {notice === "cancelled" && (
        <p className="mx-auto mb-6 max-w-md rounded-lg bg-amber-50 px-4 py-3 text-center text-sm font-medium text-amber-700">
          已取消结账。
        </p>
      )}
      {error && (
        <p className="mx-auto mb-6 max-w-md rounded-lg bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-600">
          {error}
        </p>
      )}
      {user && isComp && (
        <p className="mx-auto mb-6 max-w-md rounded-lg bg-amber-50 px-4 py-3 text-center text-sm font-medium text-amber-800">
          您当前是管理员账户，已解锁全部功能，无需订阅。
        </p>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {TIERS.map((tier) => {
          const isCurrent = !!user && !loading && level === tier.level;
          return (
            <div
              key={tier.level}
              className={`flex flex-col rounded-2xl border bg-white p-6 shadow-sm ring-1 transition ${
                isCurrent
                  ? "border-amber-400 ring-amber-200"
                  : "border-amber-200/70 ring-amber-100/50 hover:shadow-md"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xl font-bold text-amber-900">{tier.name}</h3>
                {isCurrent && (
                  <span className="rounded-full bg-amber-500 px-3 py-1 text-xs font-bold text-white">
                    当前方案
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-zinc-500">{tier.tagline}</p>
              <p className="mt-4 text-2xl font-bold text-amber-900">{tier.price}</p>
              {isCurrent && trialEndsAt && (
                <p className="mt-1 text-xs font-semibold text-amber-600">
                  试用中 · 剩余 {Math.max(0, Math.ceil((trialEndsAt - Date.now()) / 86400000))} 天
                </p>
              )}

              <ul className="mt-5 flex flex-1 flex-col gap-2.5">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-zinc-700">
                    <span className="mt-0.5 font-bold text-amber-500">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6">
                {!user ? (
                  tier.level === 0 ? (
                    <button type="button" disabled className={disabledBtn}>
                      免费方案
                    </button>
                  ) : (
                    <button type="button" onClick={() => openModal("/subscription")} className={primaryBtn}>
                      登录后订阅
                    </button>
                  )
                ) : isComp ? (
                  isCurrent ? (
                    <button
                      type="button"
                      disabled
                      className="w-full rounded-lg bg-amber-100 px-4 py-2.5 text-sm font-semibold text-amber-700"
                    >
                      当前方案
                    </button>
                  ) : (
                    <button type="button" disabled className={disabledBtn}>
                      管理员账户
                    </button>
                  )
                ) : isCurrent ? (
                  <button
                    type="button"
                    disabled
                    className="w-full rounded-lg bg-amber-100 px-4 py-2.5 text-sm font-semibold text-amber-700"
                  >
                    当前方案
                  </button>
                ) : tier.level > level ? (
                  // New subscription goes through Checkout; an existing subscriber
                  // upgrades through the Customer Portal.
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => (level === 0 ? startCheckout(tier.level) : openPortal())}
                    className={primaryBtn}
                  >
                    {busy ? "处理中…" : level === 0 ? (hasTrialed ? "订阅" : "开始 7 天免费试用（符合资格）") : "升级"}
                  </button>
                ) : tier.level === 0 ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={openPortal}
                    className="w-full rounded-lg border border-red-300 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                  >
                    {busy ? "处理中…" : "取消订阅"}
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={openPortal}
                    className="w-full rounded-lg border border-amber-300 px-4 py-2.5 text-sm font-semibold text-amber-700 transition hover:bg-amber-100 disabled:opacity-60"
                  >
                    {busy ? "处理中…" : `降级到${tier.name}`}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-6 text-center text-xs text-zinc-400">
        付款由 Stripe 安全处理。订阅后可随时升级、降级或取消。
      </p>
      {user && !isComp && !hasTrialed && (
        <p className="mt-2 text-center text-xs text-zinc-400">
          新用户享 7 天免费试用，试用期间可随时取消、不收取费用；试用结束后按月自动续费。需绑定有效银行卡。
        </p>
      )}
    </div>
  );
}
