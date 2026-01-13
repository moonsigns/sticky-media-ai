import { LogOut, MessageCircle, ArrowLeft } from "react-feather";
import { useTranslation } from "react-i18next";
import "./Header.css";

export default function Header({
    onLogout,
    onAssistance,
    // onAiKnowledge,
    onBack
}) {
    const { t } = useTranslation();

    return (
        <header className="assistant-header">
            <div className="assistant-container assistant-header-inner">

                {/* Left: Back (optional) + Logo + Title */}
                <div className="assistant-title">

                    {onBack && (
                        <button
                            className="assistant-back"
                            onClick={onBack}
                            aria-label="Back"
                        >
                            <ArrowLeft size={18} />
                        </button>
                    )}

                    <div className="assistant-logo" onClick={onBack}>H</div>
                    <h2>{t("assistant.title")}</h2>
                </div>

                {/* Right: actions */}
                <div className="assistant-actions">

                    {/* {onAssistance && (
                        <button
                            className="assistant-action-btn"
                            onClick={onAssistance}
                            aria-label="Feedback"
                        >
                            <MessageCircle size={18} />
                            <span>Assistant</span>
                        </button>
                    )} */}

                    {/* {onAiKnowledge && (
                        <button
                            className="assistant-action-btn"
                            onClick={onAiKnowledge}
                            aria-label="AI Knowledge"
                        >
                            <BookOpen size={18} />
                            <span>AI Knowledge</span>
                        </button>
                    )} */}

                    <button
                        className="assistant-logout"
                        onClick={onLogout}
                        aria-label="Logout"
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </div>
        </header>
    );
}
