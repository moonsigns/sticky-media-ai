import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import "./Login.css";

import Alert from "../../components/Alert/Alert";
import { sendAccessCode, checkAccess } from "../../api/loginApi";
import { saveSession, getSession } from "../../utils/authSession";

export default function Login({ onLogin }) {
  const { t } = useTranslation();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [showRememberModal, setShowRememberModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  const codeRef = useRef(null);
  const loginPayloadRef = useRef(null);

  /* -------------------- AUTO LOGIN -------------------- */
  useEffect(() => {
    const session = getSession();
    if (session) {
      onLogin(session);
    }
  }, [onLogin]);

  const maskedEmail = email.replace(/(.{2}).+(@.+)/, "$1***$2");

  /* -------------------- SEND CODE -------------------- */
  async function handleContinue() {
    if (!email || loading) return;

    try {
      setLoading(true);
      setAlert(null);

      await sendAccessCode(email);

      setShowCodeModal(true);
      setTimeout(() => codeRef.current?.focus(), 300);
    } catch (err) {
      setAlert({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  }

  /* -------------------- VERIFY CODE -------------------- */
  async function handleCodeChange(e) {
    const value = e.target.value.trim().slice(0, 6);
    setCode(value);

    if (value.length !== 6) return;

    try {
      setLoading(true);
      setAlert(null);

      const data = await checkAccess(email, value);

      loginPayloadRef.current = {
        userId: data.user.id,
        email: data.user.email,
        status: data.user.status
      };

      setShowCodeModal(false);
      setShowRememberModal(true);
    } catch (err) {
      setAlert({ type: "error", message: err.message });
      setCode("");
      codeRef.current?.focus();
    } finally {
      setLoading(false);
    }
  }

  /* -------------------- REMEMBER CHOICE -------------------- */
  function handleRemember(remember) {
    const payload = loginPayloadRef.current;

    if (!payload) return;

    if (remember) {
      saveSession(payload);
    }

    onLogin(payload);
  }

  return (
    <div className="login-wrapper">
      {alert && <Alert type={alert.type} message={alert.message} />}

      <div className="login-card">
        <div style={{ display: 'flex', flexDirection: 'row' }}>
          <div className="assistant-logo">H</div>
          <h1 style={{marginLeft:'12px', marginTop:'5px'}}>{t("login.title")}</h1>
        </div>

        <input
          type="email"
          placeholder={t("login.emailPlaceholder")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />

        <button onClick={handleContinue} disabled={loading}>
          {loading ? t("login.loading") : t("login.continue")}
        </button>
      </div>

      {/* CODE MODAL */}
      {showCodeModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <button
              className="modal-close"
              onClick={() => setShowCodeModal(false)}
            >
              ×
            </button>

            <p>{t("login.codeMessage", { email: maskedEmail })}</p>

            <input
              ref={codeRef}
              value={code}
              onChange={handleCodeChange}
              placeholder={t("login.codePlaceholder")}
              disabled={loading}
            />
          </div>
        </div>
      )}

      {/* REMEMBER MODAL */}
      {showRememberModal && (
        <div className="modal-backdrop">
          <div className="modal-card apple-modal">
            <h3 className="modal-title">Stay logged in?</h3>

            <p className="modal-text">
              Would you like to stay logged in on this device for the next
              <strong> 15 days</strong>?
            </p>

            <div className="stay-logged-actions">
              <button
                className="apple-btn secondary"
                onClick={() => handleRemember(false)}
              >
                No
              </button>

              <button
                className="apple-btn primary"
                onClick={() => handleRemember(true)}
              >
                Yes
              </button>
            </div>
          </div>
        </div>

      )}
    </div>
  );
}
