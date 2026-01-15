import { useEffect, useMemo, useState } from "react";
import ProjectReviewApi from "../../../../api/ProjectReviewApi";
import "./AiProjectProcessing.css";

const STEPS = [
  { key: "init", label: "Creating project" },
  { key: "pre", label: "Generating setup PDF" },
  { key: "text", label: "Generating AI description" },
  { key: "images", label: "Generating AI renders" },
  { key: "final", label: "Finalizing project & email" }
];

export default function AiProjectProcessing({ payload }) {
  const [activeKey, setActiveKey] = useState("init");
  const [error, setError] = useState("");
  const [runKey, setRunKey] = useState(0);

  const [ctx, setCtx] = useState({
    projectId: null,
    prePdfUrl: null,
    postPdfUrl: null,
    aiTextHtml: null,
    aiImages: null,
    project: null
  });

  const activeLabel = useMemo(
    () => STEPS.find(s => s.key === activeKey)?.label || "Processing…",
    [activeKey]
  );


  useEffect(() => {
    if (!payload) return;

    let cancelled = false;

    async function run() {
      try {
        setError("");

        let aiTextResult = null;
        let aiImagesResult = null;

        /* ---------- INIT ---------- */
        setActiveKey("init");
        const init = await ProjectReviewApi.initProject(payload);
        if (cancelled) return;

        const projectId = init?.projectId;
        if (!projectId) throw new Error("Init failed");

        setCtx(p => ({ ...p, projectId }));

        /* ---------- PRE PDF ---------- */
        try {
          setActiveKey("pre");
          const pre = await ProjectReviewApi.generatePrePdf({
            projectId,
            payload
          });
          if (cancelled) return;

          setCtx(p => ({
            ...p,
            prePdfUrl: pre?.prePdfUrl || p.prePdfUrl
          }));
        } catch (err) {
          console.warn("Pre-PDF failed, continuing without it", err);

          setCtx(p => ({
            ...p,
            prePdfUrl: null
          }));
        }


        /* ---------- AI TEXT ---------- */
        setActiveKey("text");
        const text = await ProjectReviewApi.generateAiText({
          projectId,
          payload
        });
        if (cancelled) return;

        aiTextResult = {
          html: text?.aiTextHtml || text?.aiText?.html || null
        };

        setCtx(p => ({
          ...p,
          aiTextHtml: aiTextResult.html
        }));

        /* ---------- AI IMAGES ---------- */
        setActiveKey("images");
        const imgs = await ProjectReviewApi.generateAiImages({
          projectId,
          payload
        });
        if (cancelled) return;

        aiImagesResult = imgs?.aiImages || [];

        setCtx(p => ({
          ...p,
          aiImages: aiImagesResult
        }));

        /* ---------- FINAL ---------- */
        setActiveKey("final");
        const final = await ProjectReviewApi.finalizeProject({
          projectId,
          payload,
          aiImages: aiImagesResult,
          aiText: aiTextResult
        });
        if (cancelled) return;

        setCtx(p => ({
          ...p,
          project: final || null,
          postPdfUrl: final?.postPdfUrl || p.postPdfUrl
        }));
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || "Process failed");
        }
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [payload, runKey]);

  function handleResend() {
    setError("");
    setCtx({
      projectId: null,
      prePdfUrl: null,
      postPdfUrl: null,
      aiTextHtml: null,
      aiImages: null,
      project: null
    });
    setActiveKey("init");
    setRunKey(k => k + 1);
  }

  const done = !error && activeKey === "final" && !!ctx.postPdfUrl;
  const canResend = !!error;

  return (
    <div className="ai-processing">
      <div className="ai-card">
        {canResend && (<button
          onClick={handleResend}
          disabled={!canResend}
          style={{
            marginBottom: 20,
            backgroundColor: canResend ? "#f2d4bb" : "#eee",
            borderRadius: "10px",
            borderWidth: "0.1px",
            cursor: canResend ? "pointer" : "not-allowed",
            opacity: canResend ? 1 : 0.6
          }}
        >
          Resend Project
        </button>)}

        <div className="ai-top">
          <div className={`ai-loader ${done ? "done" : ""}`} />
          <div className="ai-title">
            <h2>
              {error ? "Something went wrong" : done ? "Completed" : activeLabel}
            </h2>
            <p className="ai-sub">
              {error
                ? "Please try again. If this persists, contact support."
                : done
                  ? "Your project was generated successfully."
                  : "This can take a few minutes depending on image generation."}
            </p>
          </div>
        </div>

        <div className="ai-steps">
          {STEPS.map((s, i) => {
            const current = STEPS.findIndex(x => x.key === activeKey);
            const isActive = s.key === activeKey && !done && !error;
            const isDone = !error && i < current;

            return (
              <div
                key={s.key}
                className={`ai-step ${isActive ? "active" : ""} ${isDone ? "done" : ""
                  }`}
              >
                <span className="dot" />
                <span className="label">{s.label}</span>
              </div>
            );
          })}
        </div>

        {error && (
          <div className="ai-error">
            <strong>Error:</strong> {error}
          </div>
        )}

        {!!ctx.projectId && (
          <div className="ai-meta">
            <div className="ai-meta-row">
              <span className="k">Project ID</span>
              <span className="v">{ctx.projectId}</span>
            </div>
          </div>
        )}

        {(ctx.prePdfUrl || ctx.postPdfUrl) && (
          <div className="ai-links">
            {ctx.postPdfUrl && (
              <a
                className="ai-link"
                href={ctx.postPdfUrl}
                target="_blank"
                rel="noreferrer"
              >
                📄 Proposal
              </a>
            )}
            {ctx.prePdfUrl && (
              <a
                className="ai-link ghost"
                href={ctx.prePdfUrl}
                target="_blank"
                rel="noreferrer"
              >
                📋 Scope of Work (SOW)
              </a>
            )}
          </div>
        )}

        {!!ctx.aiTextHtml && (
          <div className="ai-preview">
            <div className="ai-preview-title">
              AI description (preview)
            </div>
            <div
              className="ai-preview-box"
              dangerouslySetInnerHTML={{ __html: ctx.aiTextHtml }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
