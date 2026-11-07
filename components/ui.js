"use client";
import { useEffect, useRef, useId } from "react";
import { X, LoaderCircle, Inbox, ChevronRight } from "lucide-react";
export function Spinner() {
  return <LoaderCircle className="spin" size={19} aria-label="Cargando" />;
}
export function Button({
  children,
  busy,
  variant = "",
  className = "",
  ...props
}) {
  return (
    <button
      className={`button ${variant} ${className}`}
      disabled={busy || props.disabled}
      {...props}
    >
      {busy ? <Spinner /> : null}
      {children}
    </button>
  );
}
export function Field({ label, optional, children, hint, ...props }) {
  const id = useId();
  return (
    <label className={`field ${props.className || ""}`}>
      <span>
        {label}
        {optional ? <small> (opcional)</small> : null}
      </span>
      {children || <input {...props} id={id} />}
      {hint ? <small className="hint">{hint}</small> : null}
    </label>
  );
}
export function Modal({ title, children, onClose }) {
  const ref = useRef(null);
  const id = useId();
  useEffect(() => {
    const dialog = ref.current;
    dialog.showModal();
    const onCancel = (e) => {
      e.preventDefault();
      onClose();
    };
    dialog.addEventListener("cancel", onCancel);
    document.body.style.overflow = "hidden";
    return () => {
      dialog.removeEventListener("cancel", onCancel);
      document.body.style.overflow = "";
    };
  }, [onClose]);
  return (
    <dialog
      ref={ref}
      className="modal"
      aria-labelledby={id}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="modal-head">
        <h2 id={id}>{title}</h2>
        <button
          aria-label="Cerrar ventana"
          className="icon-button"
          onClick={onClose}
        >
          <X size={22} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function Empty({
  title = "Tu próxima venta empieza aquí",
  description = "Registra una venta y empieza a sumar.",
  action,
}) {
  return (
    <div className="empty">
      <div className="empty-icon">
        <Inbox size={25} strokeWidth={1.5} />
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
export function ErrorBox({ message }) {
  return message ? (
    <p className="error-box" role="alert">
      {message}
    </p>
  ) : null;
}
export function SectionHeading({ title, children }) {
  return (
    <div className="section-heading">
      <h2>{title}</h2>
      {children}
    </div>
  );
}
