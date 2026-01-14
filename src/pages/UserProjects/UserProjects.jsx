import { useState, useEffect } from "react";
import { UserProjectsApi } from "../../api/UserProjectsApi";
import "./UserProjects.css";

/* SAME email validation logic */
function isValidEmail(email) {
    if (!email) return false;
    const normalized = email.toLowerCase();
    if (!normalized.includes("@") || !normalized.includes(".")) return false;
    if (normalized.includes("test")) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
}

function formatDate(value) {
    if (!value) return null;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleString(); // date + time
}

function stripHtmlToText(html) {
    if (!html) return "";
    return String(html)
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<\/(p|div|br|li|h1|h2|h3|h4|h5|h6)>/gi, "\n")
        .replace(/<li[^>]*>/gi, "• ")
        .replace(/<[^>]+>/g, "")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

export default function UserProjects() {
    const [email, setEmail] = useState(
        localStorage.getItem("localUserEmail") ||
        localStorage.getItem("lastUsedEmail") ||
        ""
    );

    const [projects, setProjects] = useState([]);
    const [expanded, setExpanded] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [emailTouched, setEmailTouched] = useState(false);
    const [verifyOpen, setVerifyOpen] = useState(false);
    const [code, setCode] = useState("");
    const [verified, setVerified] = useState(
        localStorage.getItem("userVerified") === "true"
    );
    const [isSendingCode, setIsSendingCode] = useState(false);

    const emailValid = isValidEmail(email);

    const [cursor, setCursor] = useState(null);
    const [hasMore, setHasMore] = useState(true);

    useEffect(() => {
        if (verified && emailValid) {
            loadProjects(email, false);

        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [verified, email]);

    async function loadProjects(userEmail, loadMore = false) {
        setLoading(true);
        setError(null);

        try {
            const res = await UserProjectsApi.getUserProjects(userEmail, cursor);

            setProjects((prev) =>
                loadMore ? [...prev, ...res.projects] : res.projects
            );

            setCursor(res.nextCursor);
            setHasMore(res.hasMore);

            localStorage.setItem("lastUsedEmail", userEmail);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }


    async function handleSendCode(e) {
        e.preventDefault();
        if (!emailValid) {
            setEmailTouched(true);
            return;
        }

        try {
            setIsSendingCode(true);
            await UserProjectsApi.sendVerificationCode(email);
            setVerifyOpen(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSendingCode(false);
        }
    }

    async function handleConfirmCode() {
        try {
            await UserProjectsApi.confirmVerificationCode(email, code);
            setVerified(true);
            setVerifyOpen(false);

            localStorage.setItem("localUserEmail", email);
            localStorage.setItem("lastUsedEmail", email);
            localStorage.setItem("userVerified", "true");

            await loadProjects(email, false);

        } catch (err) {
            setError(err.message);
        }
    }

    function toggleExpand(projectId) {
        setExpanded((prev) => ({
            ...prev,
            [projectId]: !prev[projectId]
        }));
    }

    return (
        <main className="page user-projects">
            <h1>My Projects</h1>
            <p className="subtitle">View and manage your signage projects.</p>

            {!verified && (
                <form className="email-gate" onSubmit={handleSendCode}>
                    <label>Email address</label>
                    <input
                        type="email"
                        value={email}
                        placeholder="Enter your email"
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <button disabled={!emailValid || isSendingCode}>
                        {isSendingCode ? "Sending…" : "View Projects"}
                    </button>
                    {emailTouched && !emailValid && (
                        <p className="error">Please enter a valid email.</p>
                    )}
                </form>
            )}

            {error && <p className="error">{error}</p>}
            {loading && <p>Loading projects…</p>}

            <div className="projects-grid">
                {projects.map((project) => {
                    const isOpen = expanded[project.projectId];

                    const createdAt = formatDate(project.createdAt);
                    const completedAt = formatDate(project.completedAt);
                    const aiGeneratedAt = formatDate(project.aiText?.generatedAt);

                    const contactEmail =
                        project.contact?.email || project.email || email || "";

                    // If you prefer plain text preview (optional), use this:
                    const plainDesc = stripHtmlToText(project.aiText?.html || "");

                    const proposalUrl = project.pdf?.url || project.pdfUrl || "";
                    const proposalName = project.pdf?.fileName || "proposal.pdf";

                    const sowUrl = project.prePdf?.url || "";
                    const sowName = project.prePdf?.fileName || "setup.pdf";

                    const status = project.status || "unknown";

                    return (
                        <div key={project.projectId} className="project-card">
                            {project.previewImage && (
                                <div className="project-image">
                                    <img
                                        src={project.previewImage}
                                        alt={project.projectName || "Project"}
                                        loading="lazy"
                                    />
                                </div>
                            )}

                            <div className="project-body">
                                <h3>{project.projectName || "Untitled project"}</h3>

                                {/* ✅ Existing meta row (kept) + added more dates */}
                                <div className="project-meta">
                                    <span className={`status ${status}`}>{status}</span>

                                    {/* Keep completedAt visible as you requested */}
                                    {completedAt && <span>{completedAt}</span>}
                                </div>

                                {/* ✅ NEW: More details row (createdAt + contact email) */}
                                <div className="project-kv">
                                    {createdAt && (
                                        <div className="kv">
                                            <span className="k">Created</span>
                                            <span className="v">{createdAt}</span>
                                        </div>
                                    )}

                                    {contactEmail && (
                                        <div className="kv">
                                            <span className="k">Email</span>
                                            <span className="v mono">{contactEmail}</span>
                                        </div>
                                    )}

                                    {aiGeneratedAt && (
                                        <div className="kv">
                                            <span className="k">AI</span>
                                            <span className="v">
                                                {aiGeneratedAt}
                                                {project.aiText?.model ? ` • ${project.aiText.model}` : ""}
                                                {typeof project.aiText?.length === "number"
                                                    ? ` • ${project.aiText.length} chars`
                                                    : ""}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* ✅ Description (HTML) — kept (same behavior) */}
                                {project.aiText?.html && (
                                    <>
                                        <div
                                            className={`project-desc ${isOpen ? "open" : ""}`}
                                            dangerouslySetInnerHTML={{ __html: project.aiText.html }}
                                        />

                                        <button
                                            className="see-more"
                                            onClick={() => toggleExpand(project.projectId)}
                                        >
                                            {isOpen ? "See less" : "See more"}
                                        </button>
                                    </>
                                )}
                                {/* ✅ Existing actions (kept) + added filenames */}
                                <div className="project-actions">
                                    {proposalUrl && (
                                        <a
                                            href={proposalUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            title={proposalName}
                                        >
                                            Proposal
                                            <span className="file-hint">{proposalName}</span>
                                        </a>
                                    )}

                                    {sowUrl && (
                                        <a
                                            href={sowUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            title={sowName}
                                        >
                                            SOW
                                            <span className="file-hint">{sowName}</span>
                                        </a>
                                    )}
                                </div>

                                {/* ✅ Optional: show projectId smaller (helps debug / support) */}
                                {project.projectId && (
                                    <div className="project-id">ID: {project.projectId}</div>
                                )}

                                {/* ✅ Fallback: if html is missing but text exists, show plain text preview */}
                                {!project.aiText?.html && plainDesc && (
                                    <>
                                        <div className={`project-desc ${isOpen ? "open" : ""}`}>
                                            {plainDesc}
                                        </div>
                                        <button
                                            className="see-more"
                                            onClick={() => toggleExpand(project.projectId)}
                                        >
                                            {isOpen ? "See less" : "See more"}
                                        </button>
                                    </>
                                )}
                                
                            </div>
                        </div>
                    );
                })}
            </div>

            {hasMore && !loading && (
                <button
                    className="load-more"
                    onClick={() => loadProjects(email, true)}
                >
                    Load more
                </button>
            )}

            {verifyOpen && (
                <div className="pr-modal-overlay">
                    <div className="pr-modal">
                        <div className="pr-modal-title">Enter verification code</div>

                        <input
                            className="pr-code"
                            inputMode="numeric"
                            maxLength={6}
                            value={code}
                            onChange={(e) =>
                                setCode(e.target.value.replace(/[^\d]/g, "").slice(0, 6))
                            }
                            placeholder="123456"
                        />

                        <div className="pr-modal-actions">
                            <button className="cancel" onClick={() => setVerifyOpen(false)}>
                                Cancel
                            </button>

                            <button
                                className="confirm"
                                disabled={code.length !== 6}
                                onClick={handleConfirmCode}
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
