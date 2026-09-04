import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Banknote, Coins, Gift, Loader2, TrendingUp, Wallet } from "lucide-react";
import { fetchEarnings } from "../../../services/riderService";
import { EMPTY_EARNINGS } from "../../../services/riderService";
import EarningsChart from "../../../components/rider/EarningsChart";
import RiderStatCard from "../../../components/rider/RiderStatCard";
import { fmtDate, fmtMoney, timeAgo } from "../../../components/rider/shared";

const Earnings = () => {
  const [data, setData] = useState(EMPTY_EARNINGS);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await fetchEarnings());
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to load earnings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleWithdraw = () => {
    setWithdrawing(true);
    setTimeout(() => {
      setWithdrawing(false);
      toast(data.withdrawable > 0 ? "Withdraw request submitted to admin." : "Nothing to withdraw yet.");
    }, 900);
  };

  const summary = [
    { label: "Today", value: fmtMoney(data.today), icon: TrendingUp, tint: "green" },
    { label: "This Week", value: fmtMoney(data.this_week), icon: TrendingUp, tint: "blue" },
    { label: "This Month", value: fmtMoney(data.this_month), icon: TrendingUp, tint: "amber" },
    { label: "All Time", value: fmtMoney(data.total_earnings), icon: Banknote, tint: "purple" },
  ];

  const breakdown = [
    { label: "Delivery Fees", value: fmtMoney(data.delivery_fees), icon: Coins, chip: "bg-sky-500/10 text-sky-600" },
    { label: "Bonuses", value: fmtMoney(data.bonuses), icon: Gift, chip: "bg-amber-500/10 text-amber-600" },
    { label: "Tips", value: fmtMoney(data.tips), icon: Wallet, chip: "bg-pink-500/10 text-pink-600" },
  ];

  return (
    <div className="mx-auto max-w-[1400px]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-base-content">Earnings</h2>
          <p className="text-sm text-base-content/50">
            {data.total_deliveries} deliveries · avg {fmtMoney(data.avg)} per delivery
          </p>
        </div>
        <button
          onClick={handleWithdraw}
          disabled={withdrawing || data.withdrawable <= 0}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-content transition-colors hover:bg-primary-focus disabled:opacity-60"
        >
          {withdrawing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
          Withdraw {fmtMoney(data.withdrawable)}
        </button>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summary.map((s) => (
          <RiderStatCard key={s.label} {...s} loading={loading} />
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <EarningsChart data={data} loading={loading} />
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
            <h3 className="text-base font-bold text-base-content">Breakdown</h3>
            <div className="mt-4 space-y-3">
              {breakdown.map((b) => (
                <div key={b.label} className="flex items-center justify-between">
                  <span className={`flex items-center gap-2 text-sm font-medium text-base-content/70`}>
                    <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${b.chip}`}>
                      <b.icon className="h-4 w-4" />
                    </span>
                    {b.label}
                  </span>
                  <span className="text-sm font-bold text-base-content">{b.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 p-5 shadow-sm">
            <p className="text-sm font-medium text-orange-700/80">Withdrawable balance</p>
            <p className="mt-1 text-3xl font-extrabold tracking-tight text-orange-600">
              {fmtMoney(data.withdrawable)}
            </p>
            <p className="mt-1 text-xs text-orange-700/70">
              Request withdrawals and an admin will transfer to your account.
            </p>
          </div>
        </div>
      </div>

      {/* Transactions */}
      <div className="mt-6 rounded-2xl border border-base-300 bg-base-100 shadow-sm">
        <div className="border-b border-base-300 px-5 py-4">
          <h3 className="text-base font-bold text-base-content">Transactions</h3>
          <p className="text-xs text-base-content/50">Latest delivery earnings</p>
        </div>
        <div className="divide-y divide-base-200">
          {data.transactions.length === 0 ? (
            <p className="px-5 py-12 text-center text-sm text-base-content/40">
              No transactions yet. Once you deliver orders, your earnings show up here.
            </p>
          ) : (
            data.transactions.map((t) => (
              <div key={t.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                    <TrendingUp className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-base-content">{t.title}</p>
                    <p className="text-xs text-base-content/50">
                      {t.detail} · {timeAgo(t.date)} · {fmtDate(t.date)}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-bold text-emerald-600">+{fmtMoney(t.amount)}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Earnings;