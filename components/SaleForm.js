"use client";
import { useState } from "react";
import { CalendarDays, LockKeyhole, Save } from "lucide-react";
import { Button, Field, ErrorBox } from "./ui";
export default function SaleForm({ sale, today, onSave, onCancel }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [duplicate, setDuplicate] = useState(false);
  const [allowDuplicate, setAllowDuplicate] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const values = Object.fromEntries(new FormData(e.currentTarget));
    try {
      await onSave({ ...values, allowDuplicate }, sale?.id);
    } catch (err) {
      setError(err.message);
      if (err.status === 409) setDuplicate(true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className="form-stack">
      <div className="form-pair">
        <Field label="Número de factura">
          <input
            name="invoice"
            required
            maxLength={80}
            placeholder="Ej. F-001234"
            defaultValue={sale?.invoice}
            autoFocus
          />
        </Field>
        <Field label="Comisión (USD)">
          <input
            name="commission"
            required
            inputMode="decimal"
            placeholder="0,00"
            defaultValue={sale ? (sale.commission / 100).toFixed(2) : ""}
          />
        </Field>
      </div>
      <p className="form-note">
        Solo la factura y la comisión son obligatorias.
      </p>
      <Field label="Nombre del cliente" optional>
        <input
          name="customer"
          maxLength={120}
          placeholder="Ej. Ana Pérez"
          defaultValue={sale?.customer}
        />
      </Field>
      <Field label="Descripción de la venta" optional>
        <textarea
          name="description"
          rows={2}
          maxLength={1000}
          placeholder="Ej. Lentes graduados con antirreflejo"
          defaultValue={sale?.description}
        />
      </Field>
      <Field label="Total de la venta (USD)" optional>
        <input
          name="total"
          inputMode="decimal"
          placeholder="0,00"
          defaultValue={
            sale?.total != null ? (sale.total / 100).toFixed(2) : ""
          }
        />
      </Field>
      <Field label="Método de pago" optional>
        <select name="payment" defaultValue={sale?.payment || ""}>
          <option value="">Sin especificar</option>
          {["Efectivo", "Transferencia", "Cachea"].map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
      </Field>
      <Field label="Fecha de la venta">
        <input
          type="date"
          name="date"
          required
          min="2000-01-01"
          max="2100-12-31"
          defaultValue={sale?.date || today}
        />
      </Field>
      {sale ? (
        <div className="verification-box">
          <LockKeyhole size={19} />
          <Field label="Contraseña de edición">
            <input
              name="password"
              type="password"
              autoComplete="off"
              required
              placeholder="Confirma que eres tú"
            />
          </Field>
        </div>
      ) : null}
      <ErrorBox message={error} />
      {duplicate ? (
        <label className="check-label">
          <input
            type="checkbox"
            checked={allowDuplicate}
            onChange={(e) => setAllowDuplicate(e.target.checked)}
          />{" "}
          Guardar aunque la factura ya exista
        </label>
      ) : null}
      <div className="form-actions">
        <Button variant="secondary" type="button" onClick={onCancel}>
          Cancelar
        </Button>
        <Button busy={busy} type="submit">
          <Save size={18} />
          {sale ? "Guardar cambios" : "Guardar venta"}
        </Button>
      </div>
    </form>
  );
}
