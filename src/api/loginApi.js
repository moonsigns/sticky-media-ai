const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

export async function sendAccessCode(email) {
  const res = await fetch(`${API_BASE_URL}send-access-code`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email })
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.error || "Failed to send access code");
  }

  return true;
}

export async function checkAccess(email, accessCode) {
  const res = await fetch(`${API_BASE_URL}check-login-access`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, accessCode })
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.error || "Invalid or expired code");
  }

  return data;
}
