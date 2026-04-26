import { useState, useEffect, useRef } from "react";
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
  // {
  //   id: "other",
  //   label: "Other",
  //   items: [{ id: "other", label: "Other type" }]
  // }
];

const INSTRUCTION_SNIPPETS = {
  signType: {
    channel:
      'Channel letters are individual 3D dimensional letters, typically face-lit with internal LED illumination. Each letter is fabricated separately and mounted directly to the wall (or onto a backing system if specified as "Additional" on this text). The letter returns (sides) are 3.5in and can be finished in black, white, or matched to the logo color.',

    neon:
      'Custom flex neon sign, color as per logo, with uniform LED illumination and clear acrylic backing.',

    alumCut:
      'Flat cut 3D aluminum letters. Non-illuminated, flush mounted or with 1/2in spacers.',

    acrylic3D:
      '3D acrylic letters, dimensional and premium finish. Usually painted as per logo color. Flush mount or with 1/2in spacers.',

    pvc:
      'PVC cut 3D letters. Flat, non-illuminated sign, flush mounted or with 1/2in spacers.',

    lightbox:
      'Illuminated light box with flat translucent acrylic face (with graphics) and internal LED modules. Cabinet is 6in thick.',

    push:
      'Push-through sign with 3in thich aluminum cabinet. Only the 3D acrylic elements (graphics) are face-lit. No wall light propagation.',

    blade:
      'A blade sign is a rigid sign mounted perpendicular to a wall, projecting outward so it is visible from both directions along a sidewalk. It is double-sided, supported by brackets or a frame, and used for high visibility to pedestrian traffic.',

    pylon:
      'A pylon sign is a freestanding ground-mounted sign supported by one or more vertical poles or a solid base. It is designed for long-distance visibility, typically installed near roads or entrances, and can be illuminated or non-illuminated.',

    film:
      'Flat, non-illuminated vinyl / printed graphics. Not a 3D sign. Usually installed onto windows or walls.',

    banner:
      'Printed banner. Flat, non-illuminated signage solution.',

    printMat:
      'Printed graphics mounted on ACM / aluminum panel. Flat, non-illuminated.',

    acrylicFace:
      'Printed graphics applied to acrylic face. Flat, non-illuminated. It can be used to replace Pylon of light box faces.',

    other:
      'Custom sign solution. Details to be defined.'
  },

  addition: {
    "Backer Panel":
      'Additional: Sign elements mounted onto a solid 2-inch-thick backer panel. The backer panel is always larger than the mounted elements, creating a unified background and improved wall protection. Typically painted to match the wall color, while remaining visible.',

    "Carrier Box":
      'Additional: Sign elements mounted onto a 2-inch-thick carrier box. Carrier boxes are typically shorter in height than the mounted elements, allowing letters or shapes to extend beyond the box for a dimensional look. Typically painted to match the wall color, while remaining visible.',

    "Rails":
      'Additional: 1.5-inch × 1.5-inch aluminum rails installed behind the sign for spaced mounting. Rails are painted to match the wall color but remain visible. This is not a backer panel and visually resembles a structural frame. Typically painted to match the wall color, while remaining visible.'
  }
  ,

  nonIlluminated:
    'NON-ILLUMINATED SIGN.',

  illuminated:
    "ILLUMINATED SIGN."
};


export default function SignType({ signs = [], onNext, onBack }) {
  const imageRefs = useRef({});
  const [, forceRender] = useState(0);
  const [modalMessage, setModalMessage] = useState("");
  const [data, setData] = useState(
    signs.map((s) => ({
      ...s,
      shapeType: s.shape?.type || "square",
      illuminated: s.illuminated ?? true,
      width: s.width || "",
      height: s.height || "",
      estimateWithAI: true,
      aiMode: false,
      openCategory: null,
      openDetails: false,
      addition: s.addition || null,
      instructions: s.instructions || INSTRUCTION_SNIPPETS.illuminated
    }))
  );


  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, []);

  useEffect(() => {
    const observers = [];

    Object.values(imageRefs.current).forEach((img) => {
      if (!img) return;

      const observer = new ResizeObserver(() => {
        forceRender(v => v + 1);
      });

      observer.observe(img);
      observers.push(observer);
    });

    return () => {
      observers.forEach(o => o.disconnect());
    };
  }, [data]);

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

  function appendInstruction(index, text) {
    if (!text) return;

    setData((prev) =>
      prev.map((s, i) => {
        if (i !== index) return s;

        const current = s.instructions || "";

        // evita duplicar
        if (current.includes(text)) return s;

        return {
          ...s,
          instructions: current
            ? `${current.trim()}\n\n${text}`
            : text
        };
      })
    );
  }

  function removeInstruction(index, text) {
    if (!text) return;

    setData((prev) =>
      prev.map((s, i) => {
        if (i !== index) return s;

        const current = s.instructions || "";
        if (!current.includes(text)) return s;

        const cleaned = current
          .replace(text, "")
          .replace(/\n{3,}/g, "\n\n")
          .trim();

        return {
          ...s,
          instructions: cleaned
        };
      })
    );
  }


  async function compressImage(file, maxWidth = 500, quality = 0.6) {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);

      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);

        const canvas = document.createElement("canvas");
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
          (blob) => {
            resolve(
              new File([blob], file.name, {
                type: "image/jpeg",
                lastModified: Date.now()
              })
            );
          },
          "image/jpeg",
          quality
        );
      };
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
              <div className="image-wrapper">
                <img
                  ref={(el) => (imageRefs.current[index] = el)}
                  src={sign.baseImage}
                  alt=""
                  onLoad={() => forceRender(v => v + 1)}
                />

                {/* {imageRefs.current[index] && sign.shape && (() => {
                  const imageWidth = imageRefs.current[index].offsetWidth;
                  const imageHeight = imageRefs.current[index].offsetHeight;

                  const previewShape = {
                    x: sign.shape.x / sign.stageWidth,
                    y: sign.shape.y / sign.stageHeight,
                    w: sign.shape.w / sign.stageWidth,
                    h: sign.shape.h / sign.stageHeight,
                    type: sign.shape.type,
                    rotation: sign.shape.rotation || 0
                  };

                  const isCircle = previewShape.type === "circle";

                  return (
                    <div
                      className={`shape-overlay ${isCircle ? "circle" : "square"}`}
                      style={{
                        left: `${Math.round(previewShape.x * imageWidth)}px`,
                        top: `${Math.round(previewShape.y * imageHeight)}px`,
                        width: `${Math.round(previewShape.w * imageWidth)}px`,
                        height: `${Math.round(previewShape.h * imageHeight)}px`,
                        transform: `rotate(${previewShape.rotation}deg)`,
                        transformOrigin: "center center"
                      }}
                    />
                  );
                })()} */}

                {/* {imageRefs.current[index] && sign.shape && (() => {

                  const imageWidth = imageRefs.current[index].offsetWidth;
                  const imageHeight = imageRefs.current[index].offsetHeight;

                  const scaleX = imageWidth / sign.shapeImageWidth;
                  const scaleY = imageHeight / sign.shapeImageHeight;

                  const isCircle = sign.shape.type === "circle";

                  const shrink = 0.7;

                  const width = sign.shape.w * scaleX * shrink;
                  const height = sign.shape.h * scaleY * shrink;

                  // X
                  const centerX = sign.shapeImageWidth / 2;
                  const distanceFromCenter =
                    Math.abs(sign.shape.x - centerX) / centerX;

                  const offsetX =
                    (100 * scaleX) +
                    (distanceFromCenter * 20);

                  // Y
                  const progress =
                    Math.max(
                      0,
                      (sign.shape.y / sign.shapeImageHeight) - 0.5
                    ) / 0.5;
                  const offsetY =
                    (25 * scaleY) +
                    (progress * 50);

                  const left =
                    sign.shape.x * scaleX -
                    offsetX +
                    ((sign.shape.w * scaleX) - width) / 2;

                  const top =
                    sign.shape.y * scaleY -
                    offsetY +
                    ((sign.shape.h * scaleY) - height) / 2;


                  return (
                    <div
                      className={`shape-overlay ${isCircle ? "circle" : "square"}`}
                      style={{
                        left: `${Math.round(left)}px`,
                        top: `${Math.round(top)}px`,
                        width: `${Math.round(width)}px`,
                        height: `${Math.round(height)}px`,
                        transform: `rotate(${sign.shape.rotation}deg)`,
                        transformOrigin: "center center"
                      }}
                    />
                  );
                })()} */}

                {imageRefs.current[index] && sign.shape && (() => {

                  const imageWidth = imageRefs.current[index].offsetWidth;
                  const imageHeight = imageRefs.current[index].offsetHeight;

                  const scaleX = imageWidth / sign.stageWidth;
                  const scaleY = imageHeight / sign.stageHeight;

                  const isCircle = sign.shape.type === "circle";

                  const shrink = 1;

                  const width = sign.shape.w * scaleX * shrink;
                  const height = sign.shape.h * scaleY * shrink;

                  // X
                  const centerX = sign.stageWidth / 2;
                  const distanceFromCenter =
                    Math.abs(sign.shape.x - centerX) / centerX;

                  const offsetX =
                    (1 * scaleX) +
                    (distanceFromCenter * 1 * scaleX);

                  // Y
                  const progress =
                    Math.max(
                      0,
                      (sign.shape.y / sign.stageHeight) - 0.5
                    ) / 0.5;

                  const offsetY =
                    (1 * scaleY) +
                    (progress * 1 * scaleY);

                  const left =
                    sign.shape.x * scaleX -
                    offsetX +
                    ((sign.shape.w * scaleX) - width) / 2;

                  const top =
                    sign.shape.y * scaleY -
                    offsetY +
                    ((sign.shape.h * scaleY) - height) / 2;

                  return (
                    <div
                      className={`shape-overlay ${isCircle ? "circle" : "square"}`}
                      style={{
                        left: `${Math.round(left)}px`,
                        top: `${Math.round(top)}px`,
                        width: `${Math.round(width)}px`,
                        height: `${Math.round(height)}px`,
                        transform: `rotate(${sign.shape.rotation}deg)`,
                        transformOrigin: "center center"
                      }}
                    />
                  );
                })()}

              </div>
            </div>


            {/* Config */}
            <div className="sign-config">
              <div className="sign-header-row">
                <h4>Sign #{index + 1}</h4>
                <button
                  className={`ai-btn ${sign.aiMode ? "active" : ""}`}
                  onClick={() => updateSign(index, { aiMode: !sign.aiMode })}
                >
                  ✨ Create sign with AI
                </button>
              </div>

              {!sign.aiMode &&
                <div className="dimensions" style={{ marginTop: '-10px', fontSize: '12px' }}>
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
                    <strong><ArrowRight size={12} style={{ marginBottom: "-1px" }} /></strong> Dimensions by AI
                  </button>
                </div>
              }

              <hr
                style={{
                  border: "none",
                  height: "2.5px",
                  background: "linear-gradient(to right, #e5e7eb98, #d8d8d8, #e5e7eb98)",
                  margin: "0px 0",
                  borderRadius: "2px"
                }}
              />

              <p style={{ color: '#a8a8a8ff', marginTop: '10px', fontSize: '12px' }}>Select the type of sign:</p>

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
                          onClick={() => {
                            const prevType = sign.signType;

                            updateSign(index, {
                              signType: item.id,
                              illuminated: cat.id === "printed" ? false : true
                            });

                            removeInstruction(index, INSTRUCTION_SNIPPETS.nonIlluminated);
                            removeInstruction(index, INSTRUCTION_SNIPPETS.illuminated);

                            if (cat.id === "printed") {
                              appendInstruction(index, INSTRUCTION_SNIPPETS.nonIlluminated);
                            } else {
                              appendInstruction(index, INSTRUCTION_SNIPPETS.illuminated);
                            }

                            if (prevType && prevType !== item.id) {
                              removeInstruction(
                                index,
                                INSTRUCTION_SNIPPETS.signType[prevType]
                              );
                            }

                            appendInstruction(
                              index,
                              INSTRUCTION_SNIPPETS.signType[item.id]
                            );
                          }}

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
                    onClick={() => {
                      updateSign(index, { illuminated: true });

                      removeInstruction(index, INSTRUCTION_SNIPPETS.nonIlluminated);
                      appendInstruction(index, INSTRUCTION_SNIPPETS.illuminated);
                    }}
                  >
                    Illuminated
                  </button>
                  <button
                    className={`illum-btn ${!sign.illuminated ? "active" : ""}`}
                    onClick={() => {
                      updateSign(index, { illuminated: false });

                      removeInstruction(index, INSTRUCTION_SNIPPETS.illuminated);
                      appendInstruction(index, INSTRUCTION_SNIPPETS.nonIlluminated);
                    }}
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


                    <div className="additions">
                      <span>Add components (optional)</span>
                      <div className="additions-options">
                        {["Backer Panel", "Carrier Box", "Rails"].map((opt) => (
                          <button
                            key={opt}
                            className={`addition-btn ${sign.addition === opt ? "active" : ""}`}
                            onClick={() => {
                              const next = sign.addition === opt ? null : opt;

                              // remove previous
                              if (sign.addition) {
                                removeInstruction(
                                  index,
                                  INSTRUCTION_SNIPPETS.addition[sign.addition]
                                );
                              }

                              updateSign(index, { addition: next });

                              // add new
                              if (next) {
                                appendInstruction(
                                  index,
                                  INSTRUCTION_SNIPPETS.addition[next]
                                );
                              }

                            }}
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
                  accept="image/png, image/jpeg"
                  disabled={sign.aiMode}
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;

                    if (!["image/png", "image/jpeg"].includes(file.type)) {
                      setModalMessage("Only PNG and JPG logo files are allowed.");
                      return;
                    }

                    if (file.size > 2 * 1024 * 1024) {
                      setModalMessage("Logo file is too large (maximum size is 2MB). Try uploading a screenshot instead.");
                      return;
                    }

                    const compressed = await compressImage(file);
                    const base64 = await fileToBase64(compressed);

                    updateSign(index, {
                      logo: {
                        name: file.name,
                        type: "image/jpeg",
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

      <Alert
        open={!!modalMessage}
        title="Logo upload"
        message={modalMessage}
        onClose={() => setModalMessage("")}
        onConfirm={() => setModalMessage("")}
      />

    </div>
  );
}
