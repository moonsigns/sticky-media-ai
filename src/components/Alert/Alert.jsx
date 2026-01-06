import "./Alert.css";

export default function Alert({
  open,
  type = "info",
  title,
  message,
  onClose,
  onConfirm,
  confirmText = "Confirm",
  cancelText = "Cancel"
}) {
  if (!open) return null;

  const isConfirm = !!onConfirm;

  return (
    <div className="alert-overlay">
      <div className={`alert-box alert-${type}`}>
        {title && <h4 className="alert-title">{title}</h4>}
        {message && <p className="alert-message">{message}</p>}

        <div className="alert-actions">
          <button className="alert-cancel" onClick={onClose}>
            {cancelText}
          </button>

          {isConfirm && (
            <button className="alert-confirm" onClick={onConfirm}>
              {confirmText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
