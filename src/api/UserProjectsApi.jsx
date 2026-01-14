const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

/* ===============================
   SEND VERIFICATION CODE
================================ */
async function sendVerificationCode(email) {
  const res = await fetch(
    `${API_BASE_URL}send-access-code`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    }
  );

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.error || "Failed to send verification code");
  }

  return true;
}

/* ===============================
   CONFIRM LOGIN ACCESS (IMPORTANT)
================================ */
async function confirmVerificationCode(email, code) {
  const res = await fetch(
    `${API_BASE_URL}check-login-access`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        accessCode: code   // ✅ MUST BE accessCode
      })
    }
  );

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.error || "Invalid or expired code");
  }

  return data.user; // { id, email, status }
}

/* ===============================
   GET USER PROJECTS
================================ */
async function getUserProjects(email, cursor) {
  const res = await fetch(`${API_BASE_URL}get-user-projects`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, cursor })
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.error || "Failed to load projects");
  }

  return data; // { projects, nextCursor, hasMore }
}

export const UserProjectsApi = {
  sendVerificationCode,
  confirmVerificationCode,
  getUserProjects
};
