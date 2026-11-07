"use client";
import { useState } from "react";
import { Plus, CalendarRange, Pencil, CheckCircle2 } from "lucide-react";
import { shortDate } from "../lib/domain.mjs";
import { Button, Field, ErrorBox } from "./ui";
export default function Periods({ periods, today, onSave }) {
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data = Object.fromEntries(new FormData(e.currentTarget));
      await onSave({ ...data, closed: data.closed === "on" }, editing?.id);
      setEditing(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="form-stack">
      <p className="muted">
        Tú eliges cuándo empieza y termina cada quincena. Tus ventas anteriores
        siempre se conservan.
      </p>
      {editing ? (
        <form
          onSubmit={submit}
          className="form-stack inner-panel"
          key={editing.id || "new"}
        >
          <Field label="Nombre">
            <input
              name="name"
              required
              maxLength={80}
              defaultValue={editing.name}
              placeholder="Ej. Primera quincena de noviembre"
              autoFocus
            />
          </Field>
          <div className="form-pair">
            <Field label="Inicio">
              <input
                type="date"
                name="start"
                required
                defaultValue={editing.start || today}
              />
            </Field>
            <Field label="Fin">
              <input
                type="date"
                name="end"
                required
                defaultValue={editing.end || ""}
              />
            </Field>
          </div>
          {editing.id ? (
            <label className="check-label">
              <input
                type="checkbox"
                name="closed"
                defaultChecked={editing.closed}
              />{" "}
              Quincena cerrada
            </label>
          ) : null}
          <ErrorBox message={error} />
          <div className="form-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setEditing(null)}
            >
              Cancelar
            </Button>
            <Button type="submit" busy={busy}>
              Guardar quincena
            </Button>
          </div>
        </form>
      ) : (
        <Button onClick={() => setEditing({})}>
          <Plus size={18} />
          Nueva quincena
        </Button>
      )}
      <div className="period-list">
        {periods.map((p) => (
          <div className="period-row" key={p.id}>
            <div className="period-icon">
              {p.closed ? (
                <CheckCircle2 size={20} />
              ) : (
                <CalendarRange size={20} />
              )}
            </div>
            <div>
              <b>{p.name}</b>
              <small>
                {shortDate(p.start)} – {shortDate(p.end)} ·{" "}
                {p.closed
                  ? "Cerrada"
                  : today >= p.start && today <= p.end
                    ? "En curso"
                    : "Programada"}
              </small>
            </div>
            <button
              className="icon-button"
              onClick={() => {
                setError("");
                setEditing(p);
              }}
              aria-label={`Editar ${p.name}`}
            >
              <Pencil size={17} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
