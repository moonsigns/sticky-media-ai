import { useMemo, useState, useEffect } from "react";
import { ArrowLeft, CheckCircle, MapPin, Shield } from "react-feather";
import Alert from "../../../../components/Alert/Alert";
import useBackConfirm from "../../../../hooks/useBackConfirm";
import ProjectReviewApi from "../../../../api/ProjectReviewApi";
import { saveProjectAuth, getProjectAuth, clearProjectAuth } from "../../../../utils/projectAuthSession";

import "./ProjectReview.css";

export default function ProjectReview({ signs = [], removalAreas = {}, onBack, onGenerate }) {

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
  const [email, setEmail] = useState(
    localStorage.getItem("localUserEmail") ||
    localStorage.getItem("lastUsedEmail") ||
    ""
  );

  // const [emailTouched, setEmailTouched] = useState(false);
  const [verified, setVerified] = useState(false);

  const [isSendingCode, setIsSendingCode] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [code, setCode] = useState("");

  const [projectName, setProjectName] = useState("");

  const [imgDims, setImgDims] = useState({});

  const backConfirm = useBackConfirm(onBack);

  const emailValid = ProjectReviewApi.isValidEmail(email);
  const addressValid = !installationRequired || address.trim().length >= 8;

  // const canOpenVerify = emailValid && !verified && !isSendingCode;
  const projectNameValid = projectName.trim().length > 0;

  const canSubmit =
    verified &&
    signs.length > 0 &&
    addressValid &&
    projectNameValid;

  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [submitProgress, setSubmitProgress] = useState(0);
  const [submitDone, setSubmitDone] = useState(false);

  const [activeSubmitStep, setActiveSubmitStep] = useState(0);

  const [submitStepIndex, setSubmitStepIndex] = useState(0);

  const SUBMIT_STEPS = [
    { icon: "📄", text: "Generating Scope of Work" },
    { icon: "📐", text: "Generating estimated costs, dimensions and details" },
    { icon: "🧠", text: "Generating render / visual with AI" },
    { icon: "📦", text: "Generating Project" },
    { icon: "✉️", text: "Sending email with project details" }
  ];

  const submitHint = useMemo(() => {
    if (!signs.length) return "No signs found.";
    if (!verified) return "Validate your email to submit.";
    if (!projectNameValid) return "Project name is required.";
    if (!addressValid) return "Enter a valid installation address.";
    return "";
  }, [signs, verified, addressValid, projectNameValid]);

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

  useEffect(() => {
    if (!submitModalOpen || submitDone) return;

    const interval = setInterval(() => {
      setActiveSubmitStep((s) => (s + 1) % SUBMIT_STEPS.length);
    }, 2500);

    return () => clearInterval(interval);
  }, [submitModalOpen, submitDone]);

  useEffect(() => {
    if (!submitModalOpen || submitDone) return;

    const stepInterval = setInterval(() => {
      setSubmitStepIndex((prev) => (prev + 1) % SUBMIT_STEPS.length);
    }, 3500); // ⬅️ velocidade do carrossel (ajuste aqui)

    return () => clearInterval(stepInterval);
  }, [submitModalOpen, submitDone]);


  /* ===== BUILD IMAGE WITH LOGOS ===== */
  function buildPreparedImage(imgGroup) {
    return new Promise((resolve) => {
      const base = imgGroup.signs[0]?.baseImage;
      if (!base) return resolve(null);

      const img = new Image();
      img.src = base;

      img.onload = async () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");

        // base
        ctx.drawImage(img, 0, 0);

        /* ===== REMOVAL AREAS ===== */
        const imageIndex = imgGroup.imageIndex;
        const removals = removalAreas?.[imageIndex] || [];

        removals.forEach((r) => {
          const { x, y, w, h, rotation = 0 } = r;

          ctx.save();
          ctx.translate(x + w / 2, y + h / 2);
          ctx.rotate((rotation * Math.PI) / 180);

          // background
          ctx.fillStyle = "rgba(209, 10, 10, 0.76)";
          ctx.fillRect(-w / 2, -h / 2, w, h);

          // dashed border
          ctx.strokeStyle = "#b000005d";
          ctx.setLineDash([8, 6]);
          ctx.lineWidth = 3;
          ctx.strokeRect(-w / 2, -h / 2, w, h);
          ctx.setLineDash([]);

          // text
          ctx.fillStyle = "#fff";
          ctx.font = `bold ${Math.max(18, h * 0.18)}px system-ui`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("Sign to be removed", 0, 0);

          ctx.restore();
        });


        const logoPromises = imgGroup.signs.map((s, index) => {
          if (!s.logo?.base64 || !s.shape) return null;

          return new Promise((res) => {
            const logo = new Image();
            logo.src = s.logo.base64;

            logo.onload = () => {
              const { x, y, w, h, rotation = 0 } = s.shape;

              ctx.save();
              ctx.translate(x + w / 2, y + h / 2);
              ctx.rotate((rotation * Math.PI) / 180);

              // ===== LOGO =====
              const paddingRatio = 0.01;
              const maxW = w * (1.3 - paddingRatio * 1);
              const maxH = h * (1.3 - paddingRatio * 1);

              const logoRatio = logo.width / logo.height;
              const boxRatio = maxW / maxH;

              let drawW, drawH;
              if (logoRatio > boxRatio) {
                drawW = maxW;
                drawH = maxW / logoRatio;
              } else {
                drawH = maxH;
                drawW = maxH * logoRatio;
              }

              ctx.drawImage(
                logo,
                -drawW / 2,
                -drawH / 2,
                drawW,
                drawH
              );

              // ===== INDEX BADGE =====
              const badgeRadius = Math.max(14, Math.min(w, h) * 0.12);
              const badgeX = 0;
              const badgeY = -h / 2 - badgeRadius - 8;

              ctx.fillStyle = "#1e6bff";
              ctx.beginPath();
              ctx.arc(badgeX, badgeY, badgeRadius, 0, Math.PI * 2);
              ctx.fill();

              ctx.fillStyle = "#fff";
              ctx.font = `bold ${badgeRadius}px system-ui`;
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillText(String(index + 1), badgeX, badgeY);

              ctx.restore();
              res();
            };
          });
        });

        await Promise.all(logoPromises.filter(Boolean));
        resolve(canvas.toDataURL("image/png"));
      };
    });
  }

  /* ===== INSIDE ProjectReview COMPONENT ===== */

  const [preparedImages, setPreparedImages] = useState({});

  useEffect(() => {
    async function run() {
      const map = {};
      for (const g of grouped) {
        map[g.imageIndex] = await buildPreparedImage(g);
      }
      setPreparedImages(map);
    }
    run();
  }, [grouped]);


  /* ---------- ACTIONS ---------- */

  async function handleSendCode() {
    if (!emailValid) {
      // setEmailTouched(true);
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
    return grouped.map((g) => {
      const first = g.signs[0] || {};
      return {
        imageIndex: g.imageIndex,
        baseImage: first.baseImage || null,
        maskImage: first.maskImage || null,

        preparedPreview: preparedImages[g.imageIndex] || null,

        compositePreview: first.compositePreview || null
      };
    });
  }, [grouped, preparedImages]);

  async function handleSubmit() {
    if (!canSubmit) return;

    const totalSeconds = groupedImagesForPayload.length * 92;
    const start = Date.now();

    setSubmitModalOpen(true);
    setSubmitDone(false);
    setSubmitProgress(0);

    const interval = setInterval(() => {
      const elapsed = (Date.now() - start) / 1000;
      const percent = Math.min(99, Math.round((elapsed / totalSeconds) * 100));
      setSubmitProgress(percent);
    }, 500);

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
      await ProjectReviewApi.processAiProject(payload);

      clearInterval(interval);
      setSubmitProgress(100);
      setSubmitDone(true);

    } catch (err) {
      clearInterval(interval);
      alert(err.message || "Project failed");
      setSubmitModalOpen(false);
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
            onChange={(e) => {
              const clean = e.target.value
                .replace(/[^a-zA-Z0-9 _-]/g, "") // remove chars especiais
                .replace(/\s+/g, " ")           // normaliza espaços
                .slice(0, 30);

              setProjectName(clean);
            }}
            placeholder="My signage project"
            maxLength={30}
          />
          {!projectNameValid && (
            <div className="pr-help">
              Please enter a valid project name.
            </div>
          )}

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

                  {/* IMAGE + OVERLAYS */}
                  <div className="pr-image-wrapper">
                    <img
                      src={preparedImages[imgGroup.imageIndex]}
                      className="pr-composite-image"
                      alt=""
                      onLoad={(e) => {
                        const el = e.currentTarget;
                        setImgDims((prev) => ({
                          ...prev,
                          [imgGroup.imageIndex]: {
                            w: el.clientWidth,
                            h: el.clientHeight,
                            nw: el.naturalWidth,
                            nh: el.naturalHeight
                          }
                        }));
                      }}
                    />


                    {/* REMOVAL OVERLAYS */}
                    {(removalAreas?.[imgGroup.imageIndex] || []).map((r) => {
                      const d = imgDims[imgGroup.imageIndex];
                      const sx = d ? d.w / d.nw : 1;
                      const sy = d ? d.h / d.nh : 1;

                      return (
                        <div
                          key={r.id}
                          className="pr-removal-overlay"
                          style={{
                            left: r.x * sx,
                            top: r.y * sy,
                            width: r.w * sx,
                            height: r.h * sy,
                            transform: `rotate(${r.rotation || 0}deg)`
                          }}
                        >
                          Sign to be removed
                        </div>
                      );
                    })}

                  </div>

                  {/* REMOVAL LIST (KEEP THIS ✅) */}
                  {removalAreas?.[imgGroup.imageIndex]?.length > 0 && (
                    <div className="pr-removal-list">
                      <div className="pr-removal-title">
                        Signs to be removed
                      </div>

                      {removalAreas[imgGroup.imageIndex].map((r, idx) => (
                        <div key={r.id} className="pr-removal-item">
                          Removal area {idx + 1}
                        </div>
                      ))}
                    </div>
                  )}

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
                  {s.instructions && s.instructions.trim().length > 0 && (
                    <div className="pr-instructions" style={{ fontSize: '14px' }}>
                      <div className="pr-mini-label" style={{ fontSize: '11px', marginTop: '10px' }}>Sign instructions:</div>
                      <div className="pr-instructions-box">
                        {s.instructions}
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

      {submitModalOpen && (
        <div className="submit-overlay">
          <div className="submit-modal">

            {!submitDone ? (
              <>
                <div className="submit-loader">
                  <div className="submit-percent">{submitProgress}%</div>
                  <div className="submit-spinner" />
                </div>

                <div className="submit-carousel">
                  <div
                    className="submit-carousel-track"
                    style={{
                      transform: `translateX(-${submitStepIndex * 100}%)`,
                      transition: "transform 0.6s ease"
                    }}
                  >
                    {SUBMIT_STEPS.map((s, i) => (
                      <div key={i} className="submit-step">
                        <span className="submit-icon">{s.icon}</span>
                        <span>{s.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
                <CheckCircle size={72} color="#22c55e" />
                <h2>Project sent successfully</h2>
                <p>
                  Project sent to email:<br />
                  <strong>{email}</strong>
                </p>

                <button
                  className="pr-btn pr-primary"
                  onClick={() => {
                    window.location.href = "/ai-4signs?page=user-projects";
                  }}
                >
                  Done
                </button>
              </>
            )}

          </div>
        </div>
      )}

    </div>
  );
}

