import { LogOut, BookOpen, ArrowLeft } from "react-feather";
import { useTranslation } from "react-i18next";
import "./Header.css";

export default function Header({
    onLogout,
    onProjects,
    onBack
}) {
    const { t } = useTranslation();

    return (
        <header className="assistant-header">
            <div className="assistant-container assistant-header-inner">

                {/* Left */}
                <div className="assistant-title">
                    {onBack && (
                        <button
                            className="assistant-back"
                            onClick={() => {
                                window.location.href = "/ai-4signs";
                            }}
                            aria-label="Back"
                        >
                            <ArrowLeft size={18} />
                        </button>
                    )}

                    <div className="assistant-logo" onClick={() => {
                        window.location.href = "/ai-4signs";
                    }}>H</div>
                    <h2>{t("assistant.title")}</h2>
                </div>

                {/* Right */}
                <div className="assistant-actions">
                    {onProjects && (
                        <button
                            className="assistant-action-btn"
                            onClick={onProjects}
                            aria-label="My Projects"
                        >
                            <BookOpen size={18} />
                            <span>Projects</span>
                        </button>
                    )}

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
