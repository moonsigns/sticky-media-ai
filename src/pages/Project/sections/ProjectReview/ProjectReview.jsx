import { useMemo, useState, useEffect } from "react";
import { ArrowLeft, CheckCircle, Mail, MapPin, Shield } from "react-feather";
import Alert from "../../../../components/Alert/Alert";
import useBackConfirm from "../../../../hooks/useBackConfirm";
import ProjectReviewApi from "../../../../api/ProjectReviewApi";
import { saveProjectAuth, getProjectAuth, clearProjectAuth } from "../../../../utils/projectAuthSession";

import "./ProjectReview.css";

export default function ProjectReview({ signs = [], onBack, onGenerate }) {

  /* ---------- GROUPING ---------- */
  const grouped = useMemo(() => {
    const map = new Map();

    (signs || []).forEach((s, idx) => {
      const imageIndex = Number.isFinite(s?.imageIndex) ? s.imageIndex : 0;

      if (!map.has(imageIndex)) {
        map.set(imageIndex, {
          imageIndex,
          signs: []
        });
      }

      map.get(imageIndex).signs.push({ ...s });
    });

    return Array.from(map.values()).sort((a, b) => a.imageIndex - b.imageIndex);
  }, [signs]);

  /* ---------- INSTALLATION ---------- */
  const [installationRequired, setInstallationRequired] = useState(false);
  const [address, setAddress] = useState("");

  /* ---------- STATES ---------- */
  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [verified, setVerified] = useState(false);

  const [isSendingCode, setIsSendingCode] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [code, setCode] = useState("");

  const [projectName, setProjectName] = useState("");

  const backConfirm = useBackConfirm(onBack);

  const emailValid = ProjectReviewApi.isValidEmail(email);
  const addressValid = !installationRequired || address.trim().length >= 8;

  const canOpenVerify = emailValid && !verified && !isSendingCode;
  const canSubmit = verified && signs.length > 0 && addressValid;

  const submitHint = useMemo(() => {
    if (!signs.length) return "No signs found.";
    if (!verified) return "Validate your email to submit.";
    if (!addressValid) return "Enter a valid installation address.";
    return "";
  }, [signs, verified, addressValid]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, []);

  useEffect(() => {
    const session = getProjectAuth();
    if (!session?.email || !session?.accessCode) return;

    ProjectReviewApi.confirmVerificationCode(
      session.email,
      session.accessCode
    )
      .then(() => {
        setEmail(session.email);
        setVerified(true);
      })
      .catch(() => {
        clearProjectAuth();
      });
  }, []);

  /* ---------- ACTIONS ---------- */

  async function handleSendCode() {
    if (!emailValid) {
      setEmailTouched(true);
      return;
    }

    try {
      setIsSendingCode(true);
      await ProjectReviewApi.sendVerificationCode(email);
      setVerifyOpen(true);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSendingCode(false);
    }
  }

  async function handleConfirmCode() {
    try {
      await ProjectReviewApi.confirmVerificationCode(email, code);

      saveProjectAuth({
        email,
        accessCode: code
      });

      setVerified(true);
      setVerifyOpen(false);

    } catch (err) {
      alert(err.message);
      setCode("");
    }
  }

  function sanitizeProjectName(value) {
    if (!value) return "";
    return value
      .trim()
      .replace(/[^a-zA-Z0-9 _-]/g, "") // remove chars inválidos
      .replace(/\s+/g, " ")           // normaliza espaços
      .slice(0, 30);
  }

  const groupedImagesForPayload = useMemo(() => {
    return grouped.map((g) => ({
      imageIndex: g.imageIndex,
      compositePreview: g.signs[0]?.compositePreview || null
    }));
  }, [grouped]);


  async function handleSubmit() {
    if (!canSubmit) return;

    const payload = ProjectReviewApi.buildProjectPayload({
      projectName: sanitizeProjectName(projectName),
      signs,
      images: groupedImagesForPayload,
      contact: { email },
      verified: true,
      installationRequired,
      address
    });

    try {
      const result = await ProjectReviewApi.processAiProject(payload);
      console.log("AI project processed successfully:", result);
      // opcional – limpar sessão depois do fluxo completo
      // clearProjectAuth();
      // opcional – callback se quiser redirecionar
      // onGenerate?.(result);

    } catch (err) {
      console.error("AI project failed:", err);

      const messageError = err?.message || "Request failed";

      alert(messageError); // ou trocar pelo Alert custom depois
    }
  }


  function handleCancelVerify() {
    setVerifyOpen(false);
    setCode("");
  }

  /* ------- helpers ------- */
  function humanSignType(id) {
    const map = {
      channel: "Channel Letters",
      neon: "Flex Neon Sign",
      alumCut: "Aluminum Letters",
      acrylic3D: "Acrylic Letters",
      pvc: "PVC Letters",
      lightbox: "Light Box",
      push: "Push-Through Sign",
      blade: "Blade Sign",
      pylon: "Complete Pylon",
      film: "Print / Dicut Graphics",
      banner: "Printed Banner",
      printMat: "ACM / Aluminum + Graphics",
      acrylicFace: "Acrylic + Graphics",
      other: "Other"
    };
    return map[id] || id;
  }




  // ---------- RENDER ----------
  return (
    <div className="project-review">
      {/* Top actions */}
      <div className="pr-actions">
        <button className="pr-btn pr-secondary" onClick={backConfirm.askBack}>
          <ArrowLeft size={14} /> Back
        </button>

        <button
          className={`pr-btn pr-primary ${canSubmit ? "" : "disabled"}`}
          style={{ fontSize: '18px', fontFamily: 'system-ui' }}
          onClick={handleSubmit}
          disabled={!canSubmit}
          title={submitHint}
        >
          <CheckCircle size={16} />
          Submit project
        </button>
      </div>

      {/* Title */}
      <div className="pr-header">
        <h1>Review your project</h1>
        <p>Please confirm all details before submitting.</p>
      </div>

      {/* ===== TOP EMAIL VALIDATION ===== */}
      <section className="email-validation email-validation--top">
        {!verified ? <h3>⚠️ Validate your email to submit</h3> : <h3>✅ Ready to to Submit.</h3>
        }

        <div className="email-row">
          <input
            type="email"
            placeholder="Your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={verified}
          />

          <button
            className="secondary pr-btn pr-outline"
            disabled={!emailValid || verified || isSendingCode}
            onClick={handleSendCode}
          >
            <Shield size={14} />

            {isSendingCode ? "Sending..." : verified ? "Verified ✓" : "Validate email"}
          </button>
        </div>

        {!verified && (
          <p className="email-hint">
            You must validate your email before submitting the project.
          </p>
        )}
      </section>

      <section className="project-top-row">
        {/* PROJECT NAME */}
        <div className="project-top-col project-name-col">
          <h3>Project name</h3>

          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value.slice(0, 30))}
            placeholder="My signage project"
            maxLength={30}
          />

          <p className="project-name-hint">Max 30 characters.</p>
        </div>

        {/* INSTALLATION */}
        <div className="project-top-col installation-col">
          <h3>Installation required?</h3>

          <div className="pr-toggle">
            <button
              className={`pr-toggle-btn ${installationRequired ? "active" : ""}`}
              onClick={() => setInstallationRequired(true)}
            >
              Yes
            </button>

            <button
              className={`pr-toggle-btn ${!installationRequired ? "active" : ""}`}
              onClick={() => {
                setInstallationRequired(false);
                setAddress("");
              }}
            >
              No
            </button>
          </div>

          {installationRequired && (
            <div className="pr-field">
              <label>
                <MapPin size={14} />
                Installation address
              </label>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street, City, Province, Postal code"
                className={!addressValid ? "invalid" : ""}
              />
              {!addressValid && (
                <div className="pr-help">Please enter a valid address.</div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* <hr></hr> */}

      {/* Empty state */}
      {(!signs || signs.length === 0) && (
        <div className="pr-empty">
          <div className="pr-empty-card">
            <h3>No signs to review</h3>
            <p>
              Go back to the setup steps and add at least one sign area, then select a sign type and logo.
            </p>
            <button className="pr-btn pr-secondary" onClick={backConfirm.askBack}>
              <ArrowLeft size={14} /> Back to setup
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      {(signs || []).length > 0 && (
        <div className="pr-grid">
          {/* LEFT: images + signs */}
          <section className="pr-section">
            <div className="pr-section-title">
              <h2>Project images & signs</h2>
              <span className="pr-pill">{signs.length} signs</span>
            </div>

            <div className="pr-images">
              {grouped.map((imgGroup) => (
                <div key={imgGroup.imageIndex} className="pr-image-card">

                  <div className="pr-image-group">
                    <img
                      src={imgGroup.signs[0]?.compositePreview}
                      alt={`Project preview ${imgGroup.imageIndex + 1}`}
                      className="pr-composite-image"
                    />
                  </div>

                </div>
              ))}
            </div>
          </section>

          {/* RIGHT: details + install + email */}
          <section className="pr-section">
            <div className="pr-section-title">
              <h2>Sign details</h2>
              <span className="pr-note">Read-only summary</span>
            </div>

            <div className="pr-details">
              {(signs || []).map((s, idx) => (
                <div key={s.id || idx} className="pr-detail-card">
                  <div className="pr-detail-row">
                    <div className="pr-detail-title">
                      <h3>{s.label || `Sign ${idx + 1}`}</h3>
                      <span className="pr-muted">
                        Image {Number.isFinite(s.imageIndex) ? s.imageIndex + 1 : 1} • Area{" "}
                        {Number.isFinite(s.shapeIndex) ? s.shapeIndex + 1 : idx + 1}
                      </span>
                    </div>

                    <div className="pr-badges">
                      <span className="pr-chip">
                        {s.signType ? humanSignType(s.signType) : "Type not selected"}
                      </span>
                      <span className={`pr-chip ${s.illuminated ? "blue" : "gray"}`}>
                        {s.illuminated ? "Illuminated" : "Non-illuminated"}
                      </span>
                      {s.addition ? (
                        <span className="pr-chip dashed">+ {s.addition}</span>
                      ) : (
                        <span className="pr-chip ghost">No additions</span>
                      )}
                    </div>
                  </div>

                  <div className="pr-detail-row pr-detail-body">
                    <div className="pr-mini">
                      <div className="pr-mini-label">Dimensions</div>
                      <div className="pr-mini-value">
                        {(s.width && s.height && Number(s.width) > 0 && Number(s.height) > 0) ? (
                          <>
                            {s.width} in × {s.height} in
                          </>
                        ) : (
                          <span className="pr-muted">Estimate with AI</span>
                        )}
                      </div>
                    </div>

                    <div className="pr-mini">
                      <div className="pr-mini-label">Logo / Artwork</div>
                      <div className="pr-mini-value">
                        {s.logo ? (
                          <span className="pr-ok">Uploaded</span>
                        ) : (
                          <span className="pr-warn">Missing</span>
                        )}
                      </div>
                    </div>

                    <div className="pr-mini">
                      <div className="pr-mini-label">AI Mode</div>
                      <div className="pr-mini-value">
                        {s.aiMode ? <span className="pr-warn">Generate with AI</span> : <span className="pr-ok">Manual</span>}
                      </div>
                    </div>
                  </div>

                  {s.logo?.base64 && (
                    <div className="pr-logo-preview">
                      <div className="pr-mini-label">Artwork preview</div>
                      <div className="pr-logo-box">
                        <img src={s.logo.base64} alt="logo preview" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

          </section>
        </div>
      )}

      {/* Footer actions */}
      <div className="pr-actions pr-actions-bottom">
        <button className="pr-btn pr-secondary" onClick={backConfirm.askBack}>
          <ArrowLeft size={14} /> Back
        </button>

        <button
          className={`pr-btn pr-primary ${canSubmit ? "" : "disabled"}`}
          onClick={handleSubmit}
          disabled={!canSubmit}
          title={submitHint}
        >
          <CheckCircle size={16} />
          Submit project
        </button>
      </div>

      {/* Back confirm */}
      <Alert
        open={backConfirm.open}
        title="Go back?"
        message="Are you sure you want to go back? Some actions may not have been saved."
        onClose={backConfirm.cancel}
        onConfirm={backConfirm.confirm}
      />

      {/* Verify modal (simple overlay using Alert too) */}
      <Alert
        open={verifyOpen}
        title="Verify your email"
        message={
          "Enter the 6-digit code we sent to your email. (Placeholder: check console for the code)"
        }
        onClose={handleCancelVerify}
        onConfirm={handleConfirmCode}
      />

      {/* When verifyOpen, show code input overlay */}
      {verifyOpen && (
        <div className="pr-modal-overlay" onMouseDown={handleCancelVerify}>
          <div className="pr-modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="pr-modal-title">Enter verification code</div>
            <div className="pr-modal-sub">
              We sent a 6-digit code to <strong>{email}</strong>.
            </div>

            <input
              className="pr-code"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^\d]/g, "").slice(0, 6))}
              placeholder="123456"
            />

            <div className="pr-modal-actions">
              <button className="pr-btn pr-secondary" onClick={handleCancelVerify}>
                Cancel
              </button>
              <button
                className={`pr-btn pr-primary ${code.trim().length === 6 ? "" : "disabled"}`}
                disabled={code.trim().length !== 6}
                onClick={handleConfirmCode}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

