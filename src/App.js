import { useState, useEffect } from "react";
import { clearSession, getSession } from "./utils/authSession";
import Login from "./pages/Login/Login";
import Assistant from "./pages/Assistant/Assistant";
import ProjectSetup from "./pages/Project/ProjectSetup";
import UserProjects from "./pages/UserProjects/UserProjects";
import Header from "./static/Header";
import "./i18n";

export const PAGES = {
  PROJECT: "project",
  LOGIN: "login",
  ASSISTANT: "assistant",
  USER_PROJECTS: "user-projects"
};

export default function App() {
  const [user, setUser] = useState(getSession());
  const [page, setPage] = useState(PAGES.PROJECT);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pageParam = params.get("page");

    if (pageParam === "user-projects") {
      setPage(PAGES.USER_PROJECTS);

      // remove param (clean URL)
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  function handleLogin(userData) {
    setUser(userData);
    setPage(PAGES.PROJECT); // continua no projeto
  }

  function handleLogout() {
    clearSession();
    setUser(null);
    localStorage.removeItem("userVerified");
    localStorage.removeItem("localUserEmail");
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

      case PAGES.USER_PROJECTS:
        return (
          <UserProjects
            onBack={() => setPage(PAGES.PROJECT)}
            onLogout={handleLogout}
          />
        );

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
        onProjects={() => {
          setPage(PAGES.USER_PROJECTS);
          window.history.pushState({}, "", "?page=user-projects");
        }}
        onBack={page !== PAGES.PROJECT ? () => setPage(PAGES.PROJECT) : null}
      />
      {renderPage()}
    </div>
  );
}
