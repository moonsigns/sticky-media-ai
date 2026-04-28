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
  address,
  removalAreas = {}
}) {
  return {
    projectName: projectName || "",

    contact: {
      email: contact?.email || "",
      verified: Boolean(verified)
    },

    /* ===== IMAGES (CLEAN V2) ===== */
    images: (images || []).map(img => ({
      imageIndex: Number(img.imageIndex),
      baseImage:
        typeof img.baseImage === "string" ? img.baseImage : null,
      maskImage:
        typeof img.maskImage === "string" ? img.maskImage : null,
      compositePreview:
        typeof img.compositePreview === "string" ? img.compositePreview : null,
      removalAreas: Array.isArray(img.removalAreas)
        ? img.removalAreas
        : []
    })),

    /* ===== REMOVAL AREAS ===== */
    removalAreas: removalAreas || {},

    installation: {
      required: Boolean(installationRequired),
      address: installationRequired ? address || "" : ""
    },

    /* ===== SIGNS ===== */
    signs: (signs || []).map(s => ({
      id: s.id ?? null,

      imageIndex:
        Number.isFinite(s.imageIndex) ? s.imageIndex : 0,

      shapeIndex:
        Number.isFinite(s.shapeIndex) ? s.shapeIndex : 0,

      label: s.label ?? null,
      signType: s.signType ?? null,

      // illuminated: Boolean(s.illuminated),
      illuminated:
        s.illuminated === "backLit"
          ? "backLit"
          : Boolean(s.illuminated),

      width:
        s.width && Number(s.width) > 0
          ? Number(s.width)
          : null,

      height:
        s.height && Number(s.height) > 0
          ? Number(s.height)
          : null,

      estimateWithAI: Boolean(s.estimateWithAI),
      addition: s.addition ?? null,
      aiMode: Boolean(s.aiMode),

      /* logo now clean base64 only */
      logo:
        typeof s.logo?.base64 === "string"
          ? s.logo.base64
          : null,

      /* shape clean */
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

export async function delayForAiCreation({ projectId, expectedImages }) {
  const res = await fetch(`${API_BASE_URL}delay-for-ai-creation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projectId, expectedImages })
  });

  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error);
  return data;
}
export async function waitForAiImages({
  projectId,
  expectedImages,
  maxRetries = 24
}) {
  let attempt = 0;
  let result = null;

  while (attempt < maxRetries) {
    attempt++;

    console.log(`[AI WAIT] Attempt ${attempt}/${maxRetries}`);

    result = await delayForAiCreation({
      projectId,
      expectedImages
    });

    // ✅ aceita READY ou COMPLETED
    if (result?.ready || result?.completed) {
      console.log("[AI WAIT] Images ready");
      return result;
    }

    console.log(
      `[AI WAIT] Not ready (${result?.aiImagesCount || 0}/${expectedImages}), retrying...`
    );
  }

  console.warn("[AI WAIT] Max retries reached, continuing anyway");
  return result;
}


export async function finalizeProject({ projectId, payload }) {
  const res = await fetch(`${API_BASE_URL}process-ai-finalize-project`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projectId, payload })
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
  delayForAiCreation,
  waitForAiImages,
  finalizeProject
};
