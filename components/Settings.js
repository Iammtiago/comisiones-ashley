"use client";
import { useState } from "react";
import {
  CalendarRange,
  ChevronRight,
  Download,
  EyeOff,
  Globe,
  KeyRound,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { Button, Field, ErrorBox } from "./ui";
export default function Settings({
  settings,
  onUpdate,
  onPeriods,
  onLogout,
  onExport,
  salesCount,
}) {
  const [mode, setMode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const values = Object.fromEntries(new FormData(e.currentTarget));
    if (values.newPassword !== values.repeat) {
      setError("Las contraseñas nuevas no coinciden.");
      setBusy(false);
      return;
    }
    try {
      await onUpdate({
        currentPassword: values.currentPassword,
        [mode === "access" ? "newPassword" : "newEditPassword"]:
          values.newPassword,
      });
      setMode("");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  async function change(values) {
    setError("");
    try {
      await onUpdate(values);
    } catch (err) {
      setError(err.message);
    }
  }
  return (
    <div className="settings-stack">
      <section className="glass profile-panel">
        <div className="avatar large">A</div>
        <div>
          <h2>Ashley</h2>
          <p>Óptica Newton</p>
          <span className="account-note">Tu espacio de comisiones</span>
        </div>
      </section>
      <section className="glass settings-panel">
        <h2>Tu registro</h2>
        <button className="setting-row" onClick={onPeriods}>
          <CalendarRange size={21} />
          <span>
            <b>Gestionar quincenas</b>
            <small>Elige las fechas y conserva tu historial</small>
          </span>
          <ChevronRight size={18} />
        </button>
        <div className="setting-row">
          <EyeOff size={21} />
          <span>
            <b>Ocultar comisión de la quincena</b>
            <small>La comisión del día siempre será visible</small>
          </span>
          <button
            className={`switch ${settings.hideTotal ? "checked" : ""}`}
            role="switch"
            aria-checked={settings.hideTotal}
            aria-label="Ocultar comisión de la quincena"
            onClick={() => change({ hideTotal: !settings.hideTotal })}
          >
            <i />
          </button>
        </div>
        <div className="setting-row">
          <Globe size={21} />
          <label className="timezone-field">
            <b>Zona horaria</b>
            <select
              value={settings.timezone}
              onChange={(e) => change({ timezone: e.target.value })}
            >
              <option value="America/Caracas">Venezuela · Caracas</option>
              <option value="America/Bogota">Colombia · Bogotá</option>
              <option value="America/Lima">Perú · Lima</option>
              <option value="America/Santo_Domingo">
                República Dominicana
              </option>
              <option value="America/New_York">
                Estados Unidos · Nueva York
              </option>
              <option value="Europe/Madrid">España · Madrid</option>
              <option value="UTC">UTC</option>
            </select>
          </label>
        </div>
        <div className="setting-row">
          <span className="currency-icon">$</span>
          <span>
            <b>Moneda</b>
            <small>Dólares estadounidenses (USD)</small>
          </span>
        </div>
        <button
          className="setting-row"
          onClick={onExport}
          disabled={!salesCount}
        >
          <Download size={21} />
          <span>
            <b>Exportar todas las ventas</b>
            <small>Descarga tu registro como archivo CSV</small>
          </span>
          <ChevronRight size={18} />
        </button>
      </section>
      <section className="glass settings-panel">
        <h2>Seguridad</h2>
        <button
          className="setting-row"
          onClick={() => {
            setMode(mode === "access" ? "" : "access");
            setError("");
          }}
        >
          <KeyRound size={21} />
          <span>
            <b>Contraseña de acceso</b>
            <small>Cambia la contraseña para entrar</small>
          </span>
          <ChevronRight size={18} />
        </button>
        <button
          className="setting-row"
          onClick={() => {
            setMode(mode === "edit" ? "" : "edit");
            setError("");
          }}
        >
          <ShieldCheck size={21} />
          <span>
            <b>Contraseña de edición</b>
            <small>Protege los cambios y eliminaciones</small>
          </span>
          <ChevronRight size={18} />
        </button>
        {mode ? (
          <form className="form-stack password-form" onSubmit={submit}>
            <h3>
              {mode === "access"
                ? "Cambiar contraseña de acceso"
                : "Cambiar contraseña de edición"}
            </h3>
            <Field label="Contraseña actual de acceso">
              <input
                name="currentPassword"
                type="password"
                required
                autoComplete="current-password"
              />
            </Field>
            <Field label="Nueva contraseña">
              <input
                name="newPassword"
                type="password"
                minLength={4}
                maxLength={128}
                required
                autoComplete="new-password"
              />
            </Field>
            <Field label="Repite la nueva contraseña">
              <input
                name="repeat"
                type="password"
                minLength={4}
                maxLength={128}
                required
                autoComplete="new-password"
              />
            </Field>
            <Button type="submit" busy={busy}>
              Actualizar contraseña
            </Button>
          </form>
        ) : null}
        <button className="setting-row logout-row" onClick={onLogout}>
          <LogOut size={21} />
          <span>
            <b>Cerrar sesión</b>
            <small>Se olvidará tu acceso en este dispositivo</small>
          </span>
          <ChevronRight size={18} />
        </button>
      </section>
      <ErrorBox message={error} />
      <p className="footer-note">
        Hecho para Ashley · Ventas guardadas en una base de datos
        <br />
        Óptica Newton · USD
      </p>
    </div>
  );
}
