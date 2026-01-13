// src/api/ProjectReviewApi.jsx

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

/* ---------------- EMAIL ---------------- */

export function isValidEmail(email) {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export async function sendVerificationCode(email) {
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

export async function confirmVerificationCode(email, code) {
  const res = await fetch(
    `${API_BASE_URL}check-login-access`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, accessCode: code })
    }
  );

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.error || "Invalid or expired code");
  }

  return data.user; // { id, email, status }
}


export async function checkProjectAccess(email, accessCode) {
  const res = await fetch(
    `${API_BASE_URL}check-ai-project-access`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, accessCode })
    }
  );

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error("Access expired");
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
      email: contact.email,
      verified
    },
    images: (images || []).map(img => ({
      imageIndex: img.imageIndex,
      baseImage: img.baseImage ?? null,
      maskImage: img.maskImage ?? null,
      preparedPreview: img.preparedPreview ?? null,
      compositePreview: img.compositePreview ?? null
    })),
    installation: {
      required: installationRequired,
      address: installationRequired ? address : ""
    },
    signs: (signs || []).map((s) => ({
      id: s.id,
      imageIndex: s.imageIndex,
      shapeIndex: s.shapeIndex,
      label: s.label,
      signType: s.signType || null,
      illuminated: s.illuminated ?? true,
      width: s.width ?? "",
      height: s.height ?? "",
      estimateWithAI: s.estimateWithAI ?? true,
      addition: s.addition ?? null,
      aiMode: s.aiMode ?? false,
      logo: s.logo?.base64 ?? null,
      preview: s.preview ?? "",
      shape: s.shape ?? null,
      instructions: s.instructions ?? ""
    }))
  };
}

/* ---------------- SUBMIT ---------------- */

export async function submitProject(payload) {
  // Endpoint final será o responsável por CONSUMIR o código
  const res = await fetch(
    `${API_BASE_URL}submit-project`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }
  );

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.error || "Failed to submit project");
  }

  return data;
}

/* ---------------- GENERATE PDF TEST ---------------- */

export async function generateTestPdf(payload) {
  const res = await fetch(
    `${API_BASE_URL}test-generate-ai-pdf`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }
  );

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.error || "Failed to generate PDF");
  }

  return data; // { projectId }
}


/* ---------------- PROCESS AI PROJECT (ORCHESTRATOR) ---------------- */

export async function processAiProject(payload) {
  const res = await fetch(
    `${API_BASE_URL}process-ai-project-with-orchestrator`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }
  );

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.error || "Failed to process AI project");
  }

  return data;
}



/* ---------------- EXPORTS ---------------- */

const ProjectReviewApi = {
  isValidEmail,
  sendVerificationCode,
  confirmVerificationCode,
  buildProjectPayload,
  submitProject,
  generateTestPdf,
  processAiProject
};

export default ProjectReviewApi;