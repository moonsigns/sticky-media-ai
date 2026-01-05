import { useState } from "react";
import { clearSession, getSession } from "./utils/authSession";
import Login from "./pages/Login/Login";
import Assistant from "./pages/Assistant/Assistant";
import ProjectSetup from "./pages/Project/ProjectSetup";
import Header from "./static/Header";
import "./i18n";

export const PAGES = {
  PROJECT: "project",
  LOGIN: "login",
  ASSISTANT: "assistant"
};

export default function App() {
  const [user, setUser] = useState(getSession());
  const [page, setPage] = useState(PAGES.PROJECT);

  function handleLogin(userData) {
    setUser(userData);
    setPage(PAGES.PROJECT); // continua no projeto
  }

  function handleLogout() {
    clearSession();
    setUser(null);
    setPage(PAGES.PROJECT);
  }

  function requireAuth() {
    if (!user) {
      setPage(PAGES.LOGIN);
    }
  }

  function renderPage() {
    switch (page) {
      case PAGES.ASSISTANT:
        return <Assistant user={user} onLogout={handleLogout} />;

      case PAGES.LOGIN:
        return <Login onLogin={handleLogin} />;

      case PAGES.PROJECT:
      default:
        return <ProjectSetup onGenerate={requireAuth} />;
    }
  }

  return (
    <div className="app-container">
      <Header
        onLogout={handleLogout}
        onAssistance={() => setPage(PAGES.ASSISTANT)}
      />
      {renderPage()}
    </div>
  );
}
