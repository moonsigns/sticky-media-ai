import { useState, useEffect } from "react";
import { ArrowLeft, ArrowRight } from "react-feather";
import Alert from "../../../../components/Alert/Alert";
import useBackConfirm from "../../../../hooks/useBackConfirm";
import "./SignType.css";

/* ===== SIGN CATEGORIES ===== */
const SIGN_CATEGORIES = [
  {
    id: "3d",
    label: "3D Signs | Letters",
    items: [
      { id: "channel", label: "Channel Letters" },
      { id: "neon", label: "Flex Neon Sign" },
      { id: "alumCut", label: "Aluminum Letters" },
      { id: "acrylic3D", label: "Acrylic Letters" },
      { id: "pvc", label: "PVC Letters" }
    ]
  },
  {
    id: "cabinet",
    label: "Cabinet Signs",
    items: [
      { id: "lightbox", label: "Light Box" },
      { id: "push", label: "Push-Through Sign" },
      { id: "blade", label: "Blade Sign" },
      { id: "pylon", label: "Complete Pylon" }
    ]
  },
  {
    id: "printed",
    label: "Printed / Graphics",
    items: [
      { id: "film", label: "Print | Dicut Graphics" },
      { id: "banner", label: "Printed Banner" },
      { id: "printMat", label: "ACM | Aluminum + Graphics" },
      { id: "acrylicFace", label: "Acrylic + Graphics" }
    ]
  },
  {
    id: "other",
    label: "Other",
    items: [{ id: "other", label: "Other type" }]
  }
];

export default function SignType({ signs = [], onNext, onBack }) {
  const [data, setData] = useState(
    signs.map((s) => ({
      ...s,
      illuminated: s.illuminated ?? true,
      width: s.width || "",
      height: s.height || "",
      estimateWithAI: true,
      aiMode: false,
      openCategory: null,
      openDetails: false,
      addition: s.addition || null,
      instructions: s.instructions || ""
    }))
  );

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, []);

  const backConfirm = useBackConfirm(onBack);

  function updateSign(index, changes) {
    setData((prev) =>
      prev.map((s, i) => (i === index ? { ...s, ...changes } : s))
    );
  }

  function setDimension(index, field, value) {
    const numeric = Number(value);
    const valid = numeric > 0;

    updateSign(index, {
      [field]: value,
      estimateWithAI: !(valid && Number(data[index].width) > 0 && Number(data[index].height) > 0)
    });
  }

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  return (
    <div className="sign-type">
      <div className="actions">
        <button className="secondary" onClick={backConfirm.askBack}><ArrowLeft size={12} /> Back</button>
        <button className="primary" onClick={() => onNext(data)}>Next <ArrowRight size={12} /></button>
      </div>
      <div className="header">
        <h2>Select sign types & upload logos</h2>
        <p>Configure each sign individually.</p>
      </div>

      <div className="sign-cards">
        {data.map((sign, index) => (
          <div key={index} className={`sign-card ${sign.aiMode ? "ai-active" : ""}`}>
            {/* Preview */}
            <div className="sign-preview">
              <img
                src={sign.preview}
                alt=""
              />
            </div>

            {/* Config */}
            <div className="sign-config">
              <div className="sign-header-row">
                <h4>Sign #{index + 1}</h4>
                <button
                  className={`ai-btn ${sign.aiMode ? "active" : ""}`}
                  onClick={() => updateSign(index, { aiMode: !sign.aiMode })}
                >
                  ✨ Generate with AI
                </button>
              </div>
              <p style={{ color: '#a8a8a8ff', marginTop: '-30px', fontSize: '12px' }}>Select the type of sign</p>

              {!sign.aiMode &&
                SIGN_CATEGORIES.map((cat) => (
                  <div key={cat.id} className="category">
                    <button
                      className={`category-btn ${sign.openCategory === cat.id ? "open" : ""}`}
                      onClick={() =>
                        updateSign(index, {
                          openCategory: sign.openCategory === cat.id ? null : cat.id
                        })
                      }
                    >
                      {cat.label}
                      <span>{sign.openCategory === cat.id ? "▲" : "▼"}</span>
                    </button>

                    <div className={`category-panel ${sign.openCategory === cat.id ? "open" : ""}`}>
                      {cat.items.map((item) => (
                        <button
                          key={item.id}
                          className={`type-btn ${sign.signType === item.id ? "active" : ""}`}
                          onClick={() => updateSign(index, { signType: item.id })}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

              {!sign.aiMode && (
                <div className="illumination">
                  <button
                    className={`illum-btn ${sign.illuminated ? "active" : ""}`}
                    onClick={() => updateSign(index, { illuminated: true })}
                  >
                    Illuminated
                  </button>
                  <button
                    className={`illum-btn ${!sign.illuminated ? "active" : ""}`}
                    onClick={() => updateSign(index, { illuminated: false })}
                  >
                    Non-illuminated
                  </button>
                </div>
              )}

              {!sign.aiMode && (
                <div className="details-toggle">
                  <button onClick={() => updateSign(index, { openDetails: !sign.openDetails })}>
                    Dimensions & additional setup (optional)
                    <span>{sign.openDetails ? "▲" : "▼"}</span>
                  </button>

                  <div className={`details-panel ${sign.openDetails ? "open" : ""}`}>
                    <div className="dimensions">
                      <input
                        type="number"
                        placeholder="Width (in)"
                        value={sign.width}
                        onChange={(e) => setDimension(index, "width", e.target.value)}
                      />
                      <input
                        type="number"
                        placeholder="Height (in)"
                        value={sign.height}
                        onChange={(e) => setDimension(index, "height", e.target.value)}
                      />
                      <button
                        className={`ai-dim-btn ${sign.estimateWithAI ? "active" : ""}`}
                        onClick={() => updateSign(index, { estimateWithAI: true })}
                      >
                        Estimate with AI
                      </button>
                    </div>

                    <div className="additions">
                      <span>Add components (optional)</span>
                      <div className="additions-options">
                        {["Backer Panel", "Carrier Box", "Rails"].map((opt) => (
                          <button
                            key={opt}
                            className={`addition-btn ${sign.addition === opt ? "active" : ""}`}
                            onClick={() =>
                              updateSign(index, {
                                addition: sign.addition === opt ? null : opt
                              })
                            }
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="logo-and-instructions">
              {/* Logo */}
              <div className={`logo-dropzone ${sign.aiMode ? "disabled" : ""}`}>
                <input
                  type="file"
                  accept="image/*"
                  disabled={sign.aiMode}
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;

                    const base64 = await fileToBase64(file);

                    updateSign(index, {
                      logo: {
                        name: file.name,
                        type: file.type,
                        base64
                      }
                    });
                  }}
                />

                {sign.logo?.base64 ? (
                  <img src={sign.logo.base64} alt="" />
                ) : (
                  <span>Drop or select logo / artwork</span>
                )}
              </div>

              {/* Sign Instructions */}
              <div className="sign-instructions">
                <label>Sign Instructions (optional)</label>
                <textarea
                  placeholder="Instructions for this sign (materials, mounting, colors, fabrication notes, etc.)"
                  value={sign.instructions || ""}
                  onChange={(e) =>
                    updateSign(index, { instructions: e.target.value })
                  }
                />
              </div>
            </div>


          </div>
        ))}
      </div>

      <div className="actions">
        <button className="secondary" onClick={backConfirm.askBack}><ArrowLeft size={12} />Back</button>
        <button className="primary" onClick={() => onNext(data)}>Next <ArrowRight size={12} /></button>
      </div>

      <Alert
        open={backConfirm.open}
        title="Go back?"
        message="Are you sure you want to go back? Some actions may not have been saved."
        onClose={backConfirm.cancel}
        onConfirm={backConfirm.confirm}
      />

    </div>
  );
}
