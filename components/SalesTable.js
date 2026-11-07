"use client";
import { ArrowUpRight, ReceiptText, ChevronRight } from "lucide-react";
import { usd, shortDate } from "../lib/domain.mjs";
import { Empty } from "./ui";
export default function SalesTable({
  sales,
  onSelect,
  compact = false,
  emptyTitle,
  emptyDescription,
}) {
  if (!sales.length)
    return (
      <div className="glass table-panel">
        <Empty title={emptyTitle} description={emptyDescription} />
      </div>
    );
  return (
    <div className="glass table-panel">
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Factura</th>
              {!compact ? <th className="desktop-cell">Cliente</th> : null}
              <th>{compact ? "Venta" : "Fecha"}</th>
              <th className="align-right">Comisión</th>
              <th>
                <span className="sr-only">Ver venta</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {sales.map((sale) => (
              <tr key={sale.id}>
                <td>
                  <button
                    className="invoice-button"
                    onClick={() => onSelect(sale)}
                  >
                    <span className="receipt-icon">
                      <ReceiptText size={17} />
                    </span>
                    <span>
                      <b>{sale.invoice}</b>
                      {compact ? (
                        <small>{sale.customer || "Sin cliente"}</small>
                      ) : null}
                    </span>
                  </button>
                </td>
                {!compact ? (
                  <td className="desktop-cell">{sale.customer || "—"}</td>
                ) : null}
                <td className="muted">
                  {compact
                    ? sale.total !== null
                      ? usd(sale.total)
                      : "—"
                    : shortDate(sale.date)}
                </td>
                <td className="align-right commission-text">
                  {usd(sale.commission)}
                </td>
                <td>
                  <button
                    className="icon-button small"
                    aria-label={`Ver factura ${sale.invoice}`}
                    onClick={() => onSelect(sale)}
                  >
                    <ChevronRight size={17} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
