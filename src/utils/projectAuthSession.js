const KEY = "ai_sign_project_auth";

export function saveProjectAuth({ email, accessCode }) {
  localStorage.setItem(
    KEY,
    JSON.stringify({
      email,
      accessCode,
      savedAt: Date.now()
    })
  );
  localStorage.setItem("localUserEmail", email);
  localStorage.setItem("lastUsedEmail", email);
}

export function getProjectAuth() {
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearProjectAuth() {
  localStorage.removeItem(KEY);
}
