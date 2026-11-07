"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import {
  Glasses,
  Home,
  ReceiptText,
  ChartNoAxesCombined,
  Settings as SettingsIcon,
  Plus,
  Eye,
  EyeOff,
  ArrowUpRight,
  CalendarDays,
  CalendarRange,
  Search,
  Download,
  SlidersHorizontal,
  Pencil,
  Trash2,
  LockKeyhole,
  LogIn,
  CheckCircle2,
  ArrowRight,
  Wallet,
  ShoppingBag,
  X,
  ChevronRight,
} from "lucide-react";
import { todayIn, usd, shortDate, csvCell } from "../lib/domain.mjs";
import {
  Button,
  Field,
  Modal,
  Empty,
  ErrorBox,
  Spinner,
  SectionHeading,
} from "./ui";
import SalesTable from "./SalesTable";
import SaleForm from "./SaleForm";
import Periods from "./Periods";
import Settings from "./Settings";
const Statistics = dynamic(() => import("./Statistics"), {
  loading: () => (
    <div className="loading-inline">
      <Spinner /> Preparando estadísticas…
    </div>
  ),
});
const AUTH_KEY = "ashley.auth.v1";
const NAV = [
  { id: "home", label: "Inicio", Icon: Home },
  { id: "sales", label: "Ventas", Icon: ReceiptText },
  { id: "stats", label: "Estadísticas", Icon: ChartNoAxesCombined },
  { id: "settings", label: "Ajustes", Icon: SettingsIcon },
];
function Login({ onLogin }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await onLogin(Object.fromEntries(new FormData(e.currentTarget)));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="login-screen">
      <div className="login-brand">
        <Glasses size={44} strokeWidth={1.5} />
        <span>Óptica Newton</span>
      </div>
      <section className="glass login-card">
        <div className="login-symbol">
          <Glasses size={44} strokeWidth={1.4} />
        </div>
        <h1>
          Tu esfuerzo.
          <br />
          <span>Siempre a la vista.</span>
        </h1>
        <p>Tus ventas, tus comisiones y un nuevo comienzo cada quincena.</p>
        <form className="form-stack" onSubmit={submit}>
          <Field label="Usuario">
            <input
              name="username"
              autoComplete="username"
              autoCapitalize="none"
              required
              placeholder="Tu usuario"
            />
          </Field>
          <Field label="Contraseña">
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="Tu contraseña"
            />
          </Field>
          <ErrorBox message={error} />
          <Button type="submit" busy={busy}>
            Entrar a mi espacio
            <ArrowRight size={18} />
          </Button>
        </form>
        <p className="login-note">
          <LockKeyhole size={13} /> Tu sesión se recordará en este dispositivo.
        </p>
      </section>
      <p className="footer-note">Un espacio para lo que sumas, Ashley.</p>
    </main>
  );
}
function DeleteForm({ sale, onDelete, onCancel }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <form
      className="form-stack"
      onSubmit={async (e) => {
        e.preventDefault();
        const password = new FormData(e.currentTarget).get("password");
        setBusy(true);
        try {
          await onDelete(sale.id, password);
        } catch (err) {
          setError(err.message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="danger-note">
        <Trash2 size={24} />
        <p>
          Vas a eliminar la factura <b>{sale.invoice}</b>. Esta acción no se
          puede deshacer.
        </p>
      </div>
      <Field label="Contraseña de edición">
        <input
          name="password"
          required
          type="password"
          autoFocus
          autoComplete="off"
          placeholder="Confirma que eres tú"
        />
      </Field>
      <ErrorBox message={error} />
      <div className="form-actions">
        <Button variant="secondary" type="button" onClick={onCancel}>
          Cancelar
        </Button>
        <Button variant="danger" type="submit" busy={busy}>
          Eliminar venta
        </Button>
      </div>
    </form>
  );
}
export default function AshleyApp() {
  const [token, setToken] = useState(null);
  const [data, setData] = useState(null);
  const [boot, setBoot] = useState(true);
  const [page, setPage] = useState("home");
  const [selected, setSelected] = useState("");
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [clock, setClock] = useState(() => new Date());
  const close = useCallback(() => setModal(null), []);
  const api = useCallback(
    async (path, method = "GET", body, authToken = token) => {
      let response;
      try {
        response = await fetch("/api/" + path, {
          method,
          headers: {
            ...(authToken ? { Authorization: "Bearer " + authToken } : {}),
            ...(body ? { "Content-Type": "application/json" } : {}),
          },
          body: body ? JSON.stringify(body) : undefined,
          cache: "no-store",
        });
      } catch {
        throw new Error(
          "No se pudo conectar. Revisa tu conexión e intenta otra vez.",
        );
      }
      const json = await response.json();
      if (!response.ok) {
        if (response.status === 401 && path !== "auth/login") {
          localStorage.removeItem(AUTH_KEY);
          setToken(null);
          setData(null);
        }
        const err = new Error(
          json.error || "No se pudo completar la operación.",
        );
        err.status = response.status;
        throw err;
      }
      return json;
    },
    [token],
  );
  useEffect(() => {
    const saved = localStorage.getItem(AUTH_KEY);
    if (!saved) {
      setBoot(false);
      return;
    }
    setToken(saved);
    api("state", "GET", undefined, saved)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setBoot(false));
  }, [api]);
  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 4000);
    return () => clearTimeout(timer);
  }, [toast]);
  const today = todayIn(data?.settings.timezone || "America/Caracas", clock);
  const periods = data?.periods || [];
  const sales = data?.sales || [];
  const current =
    periods.find((p) => p.start <= today && p.end >= today && !p.closed) ||
    periods[0];
  const active = periods.find((p) => p.id === selected) || current;
  const periodSales = useMemo(
    () => sales.filter((s) => s.periodId === active?.id),
    [sales, active?.id],
  );
  const daily = sales.filter((s) => s.date === today);
  const periodTotal = periodSales.reduce((a, s) => a + s.commission, 0);
  const dayTotal = daily.reduce((a, s) => a + s.commission, 0);
  const filtered = periodSales.filter(
    (s) =>
      (!from || s.date >= from) &&
      (!to || s.date <= to) &&
      (!search ||
        `${s.invoice} ${s.customer} ${s.description}`
          .toLowerCase()
          .includes(search.toLowerCase())),
  );
  async function refresh() {
    const next = await api("state");
    setData(next);
    return next;
  }
  async function updateSettings(values) {
    await api("settings", "PATCH", values);
    await refresh();
    if (values.newPassword || values.newEditPassword)
      setToast("Contraseña actualizada");
  }
  async function saveSale(values, id) {
    await api("sales" + (id ? "/" + id : ""), id ? "PATCH" : "POST", values);
    await refresh();
    setModal(null);
    setToast(id ? "Cambios guardados" : "Venta registrada. ¡Una más que suma!");
  }
  async function savePeriod(values, id) {
    const saved = await api(
      "periods" + (id ? "/" + id : ""),
      id ? "PATCH" : "POST",
      values,
    );
    await refresh();
    setSelected(saved.id);
    setToast("Quincena guardada");
  }
  async function removeSale(id, password) {
    await api("sales/" + id, "DELETE", { password });
    await refresh();
    setModal(null);
    setToast("Venta eliminada");
  }
  async function logout() {
    try {
      await api("auth/logout", "POST", {});
      localStorage.removeItem(AUTH_KEY);
      setToken(null);
      setData(null);
      setModal(null);
      setPage("home");
      setSelected("");
    } catch (err) {
      setError(err.message);
    }
  }
  function exportSales(list) {
    if (!list.length) {
      setToast("Todavía no hay ventas para exportar");
      return;
    }
    const rows = [
      [
        "Factura",
        "Comisión USD",
        "Cliente",
        "Descripción",
        "Total USD",
        "Método de pago",
        "Fecha",
        "Quincena",
      ],
      ...list.map((s) => [
        s.invoice,
        (s.commission / 100).toFixed(2),
        s.customer,
        s.description,
        s.total === null ? "" : (s.total / 100).toFixed(2),
        s.payment,
        s.date,
        periods.find((p) => p.id === s.periodId)?.name || "",
      ]),
    ];
    const blob = new Blob(
      ["\uFEFF" + rows.map((r) => r.map(csvCell).join(",")).join("\r\n")],
      { type: "text/csv;charset=utf-8;" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ventas-ashley-${today}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const periodPicker = (
    <select
      aria-label="Seleccionar quincena"
      value={active?.id || ""}
      onChange={(e) => {
        setSelected(e.target.value);
        setFrom("");
        setTo("");
      }}
      className="period-select"
    >
      {!periods.length ? (
        <option value="">Sin quincenas</option>
      ) : (
        periods.map((p) => (
          <option value={p.id} key={p.id}>
            {p.name} · {shortDate(p.start)} – {shortDate(p.end)}
            {p.closed ? " · Cerrada" : ""}
          </option>
        ))
      )}
    </select>
  );
  if (boot)
    return (
      <main className="boot">
        <Glasses size={48} />
        <Spinner />
        <p>Preparando tu espacio…</p>
      </main>
    );
  if (!token || !data)
    return (
      <>
        <Login
          onLogin={async (values) => {
            const result = await api("auth/login", "POST", values);
            localStorage.setItem(AUTH_KEY, result.token);
            setToken(result.token);
            const next = await api("state", "GET", undefined, result.token);
            setData(next);
            setError("");
          }}
        />
        {error ? (
          <div className="connection-error">
            <ErrorBox message={error} />
            {token ? (
              <Button
                onClick={async () => {
                  try {
                    await refresh();
                    setError("");
                  } catch (err) {
                    setError(err.message);
                  }
                }}
              >
                Reintentar conexión
              </Button>
            ) : null}
          </div>
        ) : null}
      </>
    );
  return (
    <div className="app-shell">
      <header className="app-header">
        <a
          href="#"
          className="brand"
          onClick={(e) => {
            e.preventDefault();
            setPage("home");
          }}
        >
          <Glasses size={33} strokeWidth={1.6} />
          <span>Óptica Newton</span>
        </a>
        <button
          className="avatar"
          onClick={() => setPage("settings")}
          aria-label="Abrir ajustes de Ashley"
        >
          A
        </button>
      </header>
      <main className="main-content">
        <div className="page-heading">
          <div>
            <h1>
              {page === "home"
                ? "Hola, Ashley"
                : page === "sales"
                  ? "Tus ventas"
                  : page === "stats"
                    ? "Estadísticas"
                    : "Ajustes"}
            </h1>
            <p>
              {page === "home"
                ? new Intl.DateTimeFormat("es", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    timeZone: data.settings.timezone,
                  }).format(clock)
                : page === "sales"
                  ? "Cada venta, en su lugar."
                  : page === "stats"
                    ? "Una mirada a lo que estás logrando."
                    : "Tu espacio, a tu manera."}
            </p>
          </div>
          {page === "home" ? (
            <span className="today-chip">
              <CalendarDays size={16} />
              {shortDate(today)}
            </span>
          ) : null}
          {page === "sales" ? (
            <Button
              onClick={() =>
                setModal({ type: periods.length ? "sale" : "periods" })
              }
            >
              <Plus size={18} />
              <span>Agregar venta</span>
            </Button>
          ) : null}
        </div>
        <ErrorBox message={error} />
        {page === "home" ? (
          <>
            <div className="dashboard-grid">
              <div className="dashboard-main">
                <section className="glass commission-card">
                  <div className="commission-top">
                    <span>
                      {active &&
                      active.start <= today &&
                      active.end >= today &&
                      !active.closed
                        ? "Tu comisión esta quincena"
                        : "Comisión de la quincena seleccionada"}
                    </span>
                    <button
                      className="eye-button"
                      aria-label={
                        data.settings.hideTotal
                          ? "Mostrar comisión de quincena"
                          : "Ocultar comisión de quincena"
                      }
                      onClick={() =>
                        updateSettings({
                          hideTotal: !data.settings.hideTotal,
                        }).catch((err) => setError(err.message))
                      }
                    >
                      {data.settings.hideTotal ? (
                        <EyeOff size={20} />
                      ) : (
                        <Eye size={20} />
                      )}
                    </button>
                  </div>
                  <strong
                    className={`commission-number ${data.settings.hideTotal ? "masked" : ""}`}
                  >
                    {data.settings.hideTotal ? "****" : usd(periodTotal)}
                  </strong>
                  <div className="commission-bottom">
                    {periodPicker}
                    {active ? (
                      <span className="period-status">
                        <i className={active.closed ? "closed" : ""} />
                        {active.closed
                          ? "Cerrada"
                          : today >= active.start && today <= active.end
                            ? "En curso"
                            : "Programada"}
                      </span>
                    ) : null}
                  </div>
                </section>
                <Button
                  className="add-sale"
                  onClick={() =>
                    setModal({ type: periods.length ? "sale" : "periods" })
                  }
                >
                  <Plus size={23} />
                  Agregar venta
                </Button>
                <div className="daily-grid">
                  <section className="glass metric-card">
                    <div className="metric-icon">
                      <ShoppingBag size={19} />
                    </div>
                    <span>Ventas de hoy</span>
                    <strong>{daily.length.toString().padStart(2, "0")}</strong>
                  </section>
                  <section className="glass metric-card">
                    <div className="metric-icon">
                      <Wallet size={19} />
                    </div>
                    <span>Comisión de hoy</span>
                    <strong>{usd(dayTotal)}</strong>
                  </section>
                </div>
              </div>
              <div className="dashboard-side">
                <SectionHeading title="Tu quincena">
                  <button
                    className="text-button"
                    onClick={() => setModal({ type: "periods" })}
                  >
                    Gestionar
                    <ChevronRight size={15} />
                  </button>
                </SectionHeading>
                <section className="glass period-overview">
                  <div className="calendar-mark">
                    <CalendarRange size={28} strokeWidth={1.4} />
                  </div>
                  {active ? (
                    <>
                      <h3>{active.name}</h3>
                      <p>
                        {shortDate(active.start)} – {shortDate(active.end)}
                      </p>
                      <div className="period-progress">
                        <span
                          style={{
                            width: `${Math.min(100, Math.max(0, (((+new Date(today) - +new Date(active.start)) / 86400000 + 1) / ((+new Date(active.end) - +new Date(active.start)) / 86400000 + 1)) * 100))}%`,
                          }}
                        />
                      </div>
                      <small>
                        {periodSales.length}{" "}
                        {periodSales.length === 1
                          ? "venta registrada"
                          : "ventas registradas"}
                      </small>
                      <button
                        className="text-button"
                        onClick={() => setPage("sales")}
                      >
                        Ver ventas de la quincena
                        <ArrowRight size={16} />
                      </button>
                    </>
                  ) : (
                    <>
                      <h3>Un nuevo comienzo</h3>
                      <p>
                        Elige las fechas de tu primera quincena y empieza a
                        registrar tus ventas.
                      </p>
                      <Button
                        variant="secondary"
                        onClick={() => setModal({ type: "periods" })}
                      >
                        Crear mi quincena
                        <Plus size={17} />
                      </Button>
                    </>
                  )}
                </section>
              </div>
            </div>
            <section className="today-section">
              <SectionHeading title="Ventas de hoy">
                {daily.length ? (
                  <button
                    className="text-button"
                    onClick={() => {
                      setSelected(
                        periods.find((p) => p.start <= today && p.end >= today)
                          ?.id || "",
                      );
                      setPage("sales");
                      setFrom(today);
                      setTo(today);
                    }}
                  >
                    Ver todas
                    <ArrowRight size={15} />
                  </button>
                ) : (
                  <span className="muted small-text">Tu resumen del día</span>
                )}
              </SectionHeading>
              <SalesTable
                sales={daily.slice(0, 5)}
                compact
                onSelect={(sale) => setModal({ type: "detail", sale })}
              />
            </section>
          </>
        ) : null}
        {page === "sales" ? (
          <>
            <div className="glass filter-panel">
              <div className="filter-top">
                {periodPicker}
                <button
                  className="text-button"
                  onClick={() => setModal({ type: "periods" })}
                >
                  <CalendarRange size={17} />
                  Quincenas
                </button>
              </div>
              <div className="filter-fields">
                <label className="search-field">
                  <Search size={18} />
                  <input
                    aria-label="Buscar factura o cliente"
                    placeholder="Buscar factura o cliente…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </label>
                <div className="date-filters">
                  <Field label="Desde">
                    <input
                      type="date"
                      value={from}
                      onChange={(e) => setFrom(e.target.value)}
                    />
                  </Field>
                  <Field label="Hasta">
                    <input
                      type="date"
                      value={to}
                      onChange={(e) => setTo(e.target.value)}
                    />
                  </Field>
                </div>
              </div>
            </div>
            <div className="list-summary">
              <span>
                {filtered.length} {filtered.length === 1 ? "venta" : "ventas"}{" "}
                <span className="summary-divider">·</span> Comisión{" "}
                <b>
                  {data.settings.hideTotal
                    ? "****"
                    : usd(filtered.reduce((a, s) => a + s.commission, 0))}
                </b>
              </span>
              <button
                className="text-button"
                disabled={!filtered.length}
                onClick={() => exportSales(filtered)}
              >
                <Download size={16} />
                Exportar
              </button>
            </div>
            <SalesTable
              sales={filtered}
              onSelect={(sale) => setModal({ type: "detail", sale })}
              emptyTitle={
                search || from || to
                  ? "No encontramos ventas"
                  : "Tu registro empieza aquí"
              }
              emptyDescription={
                search || from || to
                  ? "Prueba otras fechas o una búsqueda diferente."
                  : "Agrega tu primera venta y la verás en esta quincena."
              }
            />
          </>
        ) : null}
        {page === "stats" ? (
          <>
            <div className="stats-filter">{periodPicker}</div>
            <Statistics sales={periodSales} hidden={data.settings.hideTotal} />
          </>
        ) : null}
        {page === "settings" ? (
          <Settings
            settings={data.settings}
            onUpdate={updateSettings}
            onPeriods={() => setModal({ type: "periods" })}
            onLogout={() => setModal({ type: "logout" })}
            onExport={() => exportSales(sales)}
            salesCount={sales.length}
          />
        ) : null}
      </main>
      <nav className="bottom-nav" aria-label="Navegación principal">
        {NAV.map(({ id, label, Icon }) => (
          <button
            key={id}
            className={page === id ? "active" : ""}
            aria-current={page === id ? "page" : undefined}
            onClick={() => {
              setPage(id);
              setError("");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            <Icon size={22} strokeWidth={page === id ? 2 : 1.7} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
      {modal ? (
        <Modal
          title={
            modal.type === "sale"
              ? modal.sale
                ? "Editar venta"
                : "Nueva venta"
              : modal.type === "periods"
                ? "Tus quincenas"
                : modal.type === "delete"
                  ? "Eliminar venta"
                  : modal.type === "logout"
                    ? "Cerrar sesión"
                    : "Detalle de la venta"
          }
          onClose={close}
        >
          {modal.type === "sale" ? (
            <SaleForm
              sale={modal.sale}
              today={today}
              onSave={saveSale}
              onCancel={close}
            />
          ) : null}
          {modal.type === "periods" ? (
            <Periods periods={periods} today={today} onSave={savePeriod} />
          ) : null}
          {modal.type === "delete" ? (
            <DeleteForm
              sale={modal.sale}
              onDelete={removeSale}
              onCancel={close}
            />
          ) : null}
          {modal.type === "logout" ? (
            <div className="form-stack">
              <p className="muted">
                La próxima vez tendrás que escribir tu usuario y contraseña en
                este dispositivo.
              </p>
              <div className="form-actions">
                <Button variant="secondary" onClick={close}>
                  Quedarme
                </Button>
                <Button onClick={logout}>Cerrar sesión</Button>
              </div>
            </div>
          ) : null}
          {modal.type === "detail" ? (
            <div className="sale-detail">
              <div className="detail-hero">
                <span className="receipt-icon">
                  <ReceiptText size={27} />
                </span>
                <span>Factura {modal.sale.invoice}</span>
                <strong>{usd(modal.sale.commission)}</strong>
                <small>Comisión de esta venta</small>
              </div>
              <dl>
                {[
                  ["Fecha", shortDate(modal.sale.date)],
                  ["Cliente", modal.sale.customer || "Sin especificar"],
                  ["Descripción", modal.sale.description || "Sin especificar"],
                  [
                    "Total de la venta",
                    modal.sale.total !== null
                      ? usd(modal.sale.total)
                      : "Sin especificar",
                  ],
                  ["Método de pago", modal.sale.payment || "Sin especificar"],
                  [
                    "Quincena",
                    periods.find((p) => p.id === modal.sale.periodId)?.name,
                  ],
                ].map(([key, value]) => (
                  <div key={key}>
                    <dt>{key}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
              <div className="form-actions">
                <Button
                  variant="danger-soft"
                  onClick={() => setModal({ type: "delete", sale: modal.sale })}
                >
                  <Trash2 size={17} />
                  Eliminar
                </Button>
                <Button
                  onClick={() => setModal({ type: "sale", sale: modal.sale })}
                >
                  <Pencil size={17} />
                  Editar venta
                </Button>
              </div>
            </div>
          ) : null}
        </Modal>
      ) : null}
      {toast ? (
        <div className="toast" role="status">
          <CheckCircle2 size={18} />
          {toast}
          <button onClick={() => setToast("")} aria-label="Cerrar aviso">
            <X size={15} />
          </button>
        </div>
      ) : null}
    </div>
  );
}
