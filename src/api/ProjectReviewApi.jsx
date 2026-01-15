// src/api/ProjectReviewApi.jsx

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

/* ---------------- EMAIL ---------------- */

export function isValidEmail(email) {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export async function sendVerificationCode(email) {
  const res = await fetch(`${API_BASE_URL}send-access-code`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email })
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || "Failed to send verification code");
  }
  return true;
}

export async function confirmVerificationCode(email, code) {
  const res = await fetch(`${API_BASE_URL}check-login-access`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, accessCode: code })
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || "Invalid or expired code");
  }
  return data.user;
}
/* ---------------- PAYLOAD ---------------- */

export function buildProjectPayload({
  projectName,
  signs,
  images,
  contact,
  verified,
  installationRequired,
  address
}) {
  return {
    projectName,
    contact: {
      email: contact?.email || "",
      verified: Boolean(verified)
    },
    images: (images || []).map(img => ({
      imageIndex: Number(img.imageIndex),
      baseImage: typeof img.baseImage === "string" ? img.baseImage : null,
      maskImage: typeof img.maskImage === "string" ? img.maskImage : null,
      preparedPreview:
        typeof img.preparedPreview === "string" ? img.preparedPreview : null,
      compositePreview:
        typeof img.compositePreview === "string" ? img.compositePreview : null
    })),
    installation: {
      required: Boolean(installationRequired),
      address: installationRequired ? address || "" : ""
    },
    signs: (signs || []).map(s => ({
      id: s.id ?? null,
      imageIndex: Number.isFinite(s.imageIndex) ? s.imageIndex : 0,
      shapeIndex: Number.isFinite(s.shapeIndex) ? s.shapeIndex : 0,
      label: s.label ?? null,
      signType: s.signType ?? null,
      illuminated: Boolean(s.illuminated),
      width: s.width ?? null,
      height: s.height ?? null,
      estimateWithAI: Boolean(s.estimateWithAI),
      addition: s.addition ?? null,
      aiMode: Boolean(s.aiMode),
      logo: typeof s.logo?.base64 === "string" ? s.logo.base64 : null,
      preview: typeof s.preview === "string" ? s.preview : null,
      shape: s.shape
        ? {
          x: Number(s.shape.x),
          y: Number(s.shape.y),
          w: Number(s.shape.w),
          h: Number(s.shape.h),
          rotation: Number(s.shape.rotation ?? 0)
        }
        : null,
      instructions: s.instructions ?? ""
    }))
  };
}

/* ---------------- ORCHESTRATION STEPS ---------------- */

export async function initProject(payload) {
  const res = await fetch(`${API_BASE_URL}process-ai-init-project`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error);
  return data;
}

export async function generatePrePdf({ projectId, payload }) {
  const res = await fetch(`${API_BASE_URL}process-ai-generate-pre-pdf`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projectId, payload })
  });

  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error);
  return data;
}

export async function generateAiText({ projectId, payload }) {
  const res = await fetch(`${API_BASE_URL}process-ai-generate-text`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projectId, payload })
  });

  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error);
  return data;
}

export async function generateAiImages({ projectId, payload }) {
  const res = await fetch(`${API_BASE_URL}process-ai-generate-images`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projectId, payload })
  });

  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error);
  return data;
}

export async function finalizeProject({ projectId, payload, aiImages, aiText }) {
  const res = await fetch(`${API_BASE_URL}process-ai-finalize-project`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projectId, payload, aiImages, aiText })
  });

  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error);
  return data;
}

/* ---------------- EXPORT ---------------- */

export default {
  isValidEmail,
  sendVerificationCode,
  confirmVerificationCode,
  buildProjectPayload,
  initProject,
  generatePrePdf,
  generateAiText,
  generateAiImages,
  finalizeProject
};
