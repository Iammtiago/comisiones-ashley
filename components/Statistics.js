"use client";
import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { usd, shortDate } from "../lib/domain.mjs";
import { Empty } from "./ui";
export default function Statistics({ sales, hidden }) {
  const days = useMemo(() => {
    const grouped = new Map();
    for (const s of sales) {
      const d = grouped.get(s.date) || {
        date: s.date,
        commission: 0,
        count: 0,
      };
      d.commission += s.commission / 100;
      d.count++;
      grouped.set(s.date, d);
    }
    return [...grouped.values()].sort((a, b) => a.date.localeCompare(b.date));
  }, [sales]);
  const total = sales.reduce((a, s) => a + s.commission, 0);
  const methods = [
    "Efectivo",
    "Transferencia",
    "Cachea",
    "Sin especificar",
  ].map((name) => ({
    name,
    count: sales.filter((s) => (s.payment || "Sin especificar") === name)
      .length,
  }));
  if (!sales.length)
    return (
      <div className="glass">
        <Empty
          title="Tus números, con claridad"
          description="Cuando registres ventas en esta quincena, aquí verás cómo van tus comisiones."
        />
      </div>
    );
  return (
    <>
      <div className="stat-summary">
        <div>
          <span>Comisión de la quincena</span>
          <strong>{hidden ? "****" : usd(total)}</strong>
        </div>
        <div>
          <span>Ventas registradas</span>
          <strong>{sales.length}</strong>
        </div>
      </div>
      <div className="chart-grid">
        <section className="glass chart-panel">
          <h2>Comisión por día</h2>
          <p>Lo que sumaste cada día · USD</p>
          <div className="chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={days}
                margin={{ top: 15, right: 10, bottom: 5, left: -18 }}
              >
                <defs>
                  <linearGradient
                    id="commissionFill"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#169ce9" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#169ce9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#cfdfeb" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={shortDate}
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  minTickGap={30}
                />
                <YAxis tickLine={false} axisLine={false} fontSize={11} />
                <Tooltip
                  labelFormatter={shortDate}
                  formatter={(v) => [
                    usd(Math.round(Number(v) * 100)),
                    "Comisión del día",
                  ]}
                  contentStyle={{
                    borderRadius: 14,
                    border: "1px solid #d5e7f3",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="commission"
                  stroke="#118de2"
                  strokeWidth={2.5}
                  fill="url(#commissionFill)"
                  dot={{ r: 3, fill: "#fff", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="glass chart-panel">
          <h2>Ventas por día</h2>
          <p>Tu actividad a lo largo de la quincena</p>
          <div className="chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={days}
                margin={{ top: 15, right: 10, bottom: 5, left: -18 }}
              >
                <CartesianGrid stroke="#cfdfeb" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={shortDate}
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  minTickGap={30}
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                />
                <Tooltip
                  labelFormatter={shortDate}
                  formatter={(v) => [v, "Ventas"]}
                  contentStyle={{
                    borderRadius: 14,
                    border: "1px solid #d5e7f3",
                  }}
                />
                <Bar
                  dataKey="count"
                  fill="#65bdf4"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={45}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
      <section className="glass payment-panel">
        <h2>Métodos de pago</h2>
        {methods
          .filter((m) => m.count)
          .map((m) => (
            <div className="payment-row" key={m.name}>
              <span>{m.name}</span>
              <div className="payment-track">
                <i style={{ width: `${(m.count / sales.length) * 100}%` }} />
              </div>
              <b>{m.count}</b>
            </div>
          ))}
      </section>
    </>
  );
}
