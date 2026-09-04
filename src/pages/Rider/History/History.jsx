import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { fetchRiderHistory } from "../../../services/riderService";
import DeliveryHistoryTable from "../../../components/rider/DeliveryHistoryTable";
import RiderStatCard from "../../../components/rider/RiderStatCard";
import { History as HistoryIcon, Bike, CheckCircle2 } from "lucide-react";

const History = () => {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, pages: 1, limit: 8 });
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (overrides = {}) => {
    const params = { ...filters, ...overrides };
    setLoading(true);
    try {
      const data = await fetchRiderHistory(params);
      setRows(data.history || []);
      setMeta({ total: data.total, page: data.page, pages: data.pages, limit: data.limit });
      setFilters(params);
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to load history.");
      setRows([]);
      setMeta({ total: 0, page: 1, pages: 1, limit: 8 });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load({ page: 1 });
  }, []);

  const change = (patch) => load({ ...filters, ...patch, page: 1 });

  return (
    <div className="mx-auto max-w-[1200px]">
      <h2 className="text-lg font-bold tracking-tight text-base-content">Delivery History</h2>
      <p className="text-sm text-base-content/50">Completed and cancelled deliveries</p>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <RiderStatCard label="Total Deliveries" value={meta.total} icon={HistoryIcon} tint="purple" />
        <RiderStatCard
          label="On this page"
          value={rows.length}
          icon={Bike}
          tint="blue"
          sub={`of ${meta.total}`}
        />
        <RiderStatCard
          label="Pages"
          value={meta.pages}
          icon={CheckCircle2}
          tint="green"
        />
      </div>

      <div className="mt-6">
        <DeliveryHistoryTable
          rows={rows}
          total={meta.total}
          page={meta.page}
          pages={meta.pages}
          limit={meta.limit}
          loading={loading}
          onPageChange={(p) => load({ ...filters, page: p })}
          onSearch={(s) => change({ search: s })}
          onStatus={(s) => change({ status: s })}
          onDate={(d) => change({ date: d })}
        />
      </div>
    </div>
  );
};

export default History;