import { useState, useEffect, useRef } from "react";
import { ArrowLeft, ArrowRight, Plus, Minimize2 } from "react-feather";
import Alert from "../../../../components/Alert/Alert";
import useBackConfirm from "../../../../hooks/useBackConfirm";
import "./PicturesSetup.css";

export default function PicturesSetup({ images, onNext, onBack }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [areas, setAreas] = useState({});
  const [removalAreas, setRemovalAreas] = useState({});
  const [resizing, setResizing] = useState(null);
  const [rotating, setRotating] = useState(null);
  const [stageSizes, setStageSizes] = useState({});
  const [selectedShape, setSelectedShape] = useState(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);

  const copiedShapeRef = useRef(null);

  const stageImageRef = useRef(null);
  const backConfirm = useBackConfirm(onBack);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, []);

  useEffect(() => {
    if (activeIndex >= images.length) {
      setActiveIndex(0);
    }
  }, [images, activeIndex]);

  /* ===== MEASURE STAGE IMAGE (SAFE) ===== */
  useEffect(() => {
    const el = stageImageRef.current;
    if (!el) return;

    setStageSizes((prev) => {
      const prevSize = prev[activeIndex];
      const nextSize = {
        width: el.offsetWidth,
        height: el.offsetHeight
      };

      // 🔒 evita loop infinito
      if (
        prevSize &&
        prevSize.width === nextSize.width &&
        prevSize.height === nextSize.height
      ) {
        return prev;
      }

      return {
        ...prev,
        [activeIndex]: nextSize
      };
    });
  }, [activeIndex, images]);


  /* ===== KEYBOARD SHORTCUTS ===== */
  useEffect(() => {
    function handleKeyDown(e) {
      if (!selectedShape || selectedShape.type === "removal") return;

      const { imageIndex, shapeId } = selectedShape;
      const shape = areas[imageIndex]?.find(s => s.id === shapeId);
      if (!shape) return;

      // DELETE
      // DELETE (FIXED — uses shapeId, not index)
      if (e.key === "Delete") {
        e.preventDefault();

        setAreas((prev) => {
          const copy = { ...prev };

          copy[imageIndex] = (copy[imageIndex] || []).filter(
            (s) => s.id !== shapeId
          );

          return copy;
        });

        setSelectedShape(null);
      }


      // COPY
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c") {
        e.preventDefault();
        copiedShapeRef.current = { ...shape };
      }

      // PASTE
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "v") {
        e.preventDefault();
        if (!copiedShapeRef.current) return;

        const pasted = {
          ...copiedShapeRef.current,
          id: crypto.randomUUID(),
          x: copiedShapeRef.current.x + 20,
          y: copiedShapeRef.current.y + 20,
          previewYOffset: copiedShapeRef.current.previewYOffset ?? 6.5
        };

        setAreas((prev) => ({
          ...prev,
          [imageIndex]: [...(prev[imageIndex] || []), pasted]
        }));
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedShape, areas]);


  /* ===== ADD SHAPES ===== */
  function addShape(type) {
    const current = areas[activeIndex] || [];

    if (current.length >= 4) {
      setShowLimitModal(true);
      return;
    }

    setAreas((prev) => ({
      ...prev,
      [activeIndex]: [
        ...current,
        {
          id: crypto.randomUUID(),
          type,
          x: 400,
          y: 120,
          w: 105,
          h: 100,
          rotation: 0,
          previewYOffset: 6.5
        }
      ]
    }));
  }

  function addRemovalShape() {
    const current = removalAreas[activeIndex] || [];

    if (current.length >= 4) {
      setShowLimitModal(true);
      return;
    }

    setRemovalAreas((prev) => ({
      ...prev,
      [activeIndex]: [
        ...current,
        {
          id: crypto.randomUUID(),
          type: "removal",
          x: 200,
          y: 120,
          w: 95,
          h: 80,
          rotation: 0,
          previewYOffset: 6.5
        }
      ]
    }));
  }

  /* ===== DRAG ===== */
  function startDrag(e, shapeId) {
    if (resizing || rotating) return;

    let lastX = e.clientX;
    let lastY = e.clientY;

    function move(ev) {
      const dx = ev.clientX - lastX;
      const dy = ev.clientY - lastY;

      lastX = ev.clientX;
      lastY = ev.clientY;

      setAreas(prev => {
        const list = prev[activeIndex] || [];
        const idx = list.findIndex(s => s.id === shapeId);
        if (idx === -1) return prev;

        const updated = [...list];
        updated[idx] = {
          ...updated[idx],
          x: updated[idx].x + dx,
          y: updated[idx].y + dy
        };

        return { ...prev, [activeIndex]: updated };
      });
    }

    function up() {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    }

    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  }

  function startDragRemoval(e, shapeId) {
    if (resizing || rotating) return;

    let lastX = e.clientX;
    let lastY = e.clientY;

    function move(ev) {
      const dx = ev.clientX - lastX;
      const dy = ev.clientY - lastY;

      lastX = ev.clientX;
      lastY = ev.clientY;

      setRemovalAreas(prev => {
        const list = prev[activeIndex] || [];
        const idx = list.findIndex(s => s.id === shapeId);
        if (idx === -1) return prev;

        const updated = [...list];
        updated[idx] = {
          ...updated[idx],
          x: updated[idx].x + dx,
          y: updated[idx].y + dy
        };

        return { ...prev, [activeIndex]: updated };
      });
    }

    function up() {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    }

    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  }



  /* ===== RESIZE ===== */
  function startResize(e, i) {
    e.stopPropagation();
    setResizing(i);

    const startX = e.clientX;
    const startY = e.clientY;
    const shape = areas[activeIndex][i];

    function move(ev) {
      setAreas((prev) => {
        const copy = { ...prev };
        copy[activeIndex] = [...copy[activeIndex]];
        const MIN_SIZE = 15;

        copy[activeIndex][i] = {
          ...shape,
          w: Math.max(MIN_SIZE, shape.w + (ev.clientX - startX)),
          h: Math.max(MIN_SIZE, shape.h + (ev.clientY - startY))
        };
        return copy;
      });
    }

    function up() {
      setResizing(null);
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    }

    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  }

  function startResizeRemoval(e, i) {
    e.stopPropagation();
    setResizing(i);

    const startX = e.clientX;
    const startY = e.clientY;
    const shape = removalAreas[activeIndex][i];

    function move(ev) {
      setRemovalAreas((prev) => {
        const copy = { ...prev };
        copy[activeIndex] = [...copy[activeIndex]];
        const MIN_SIZE = 15;

        copy[activeIndex][i] = {
          ...shape,
          w: Math.max(MIN_SIZE, shape.w + (ev.clientX - startX)),
          h: Math.max(MIN_SIZE, shape.h + (ev.clientY - startY))
        };
        return copy;
      });
    }

    function up() {
      setResizing(null);
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    }

    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  }


  /* ===== ROTATE (SMOOTH) ===== */
  function startRotate(e, i) {
    e.stopPropagation();
    setRotating(i);

    const startX = e.clientX;
    const shape = areas[activeIndex][i];
    const startRotation = shape.rotation || 0;

    const SENSITIVITY = 0.2; // 👈 quanto menor, mais suave (0.15–0.3 ideal)

    function move(ev) {
      const deltaX = ev.clientX - startX;
      const newRotation = startRotation + deltaX * SENSITIVITY;

      setAreas((prev) => {
        const copy = { ...prev };
        copy[activeIndex] = [...copy[activeIndex]];
        copy[activeIndex][i] = {
          ...copy[activeIndex][i],
          rotation: newRotation
        };
        return copy;
      });
    }

    function up() {
      setRotating(null);
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    }

    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  }

  function startRotateRemoval(e, i) {
    e.stopPropagation();
    setRotating(i);

    const startX = e.clientX;
    const shape = removalAreas[activeIndex][i];
    const startRotation = shape.rotation || 0;
    const SENSITIVITY = 0.2;

    function move(ev) {
      const deltaX = ev.clientX - startX;
      const newRotation = startRotation + deltaX * SENSITIVITY;

      setRemovalAreas((prev) => {
        const copy = { ...prev };
        copy[activeIndex] = [...copy[activeIndex]];
        copy[activeIndex][i] = {
          ...copy[activeIndex][i],
          rotation: newRotation
        };
        return copy;
      });
    }

    function up() {
      setRotating(null);
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    }

    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  }


  /* ===== REMOVE ===== */
  function removeShape(i) {
    setAreas((prev) => {
      const copy = { ...prev };
      copy[activeIndex] = [...copy[activeIndex]];
      copy[activeIndex].splice(i, 1);
      return copy;
    });
  }



  /* ===== EXPORT ALL IMAGES & SIGNS (FINAL / STABLE) ===== */
  function exportAllImages(callback, signsInput = []) {
    const allSigns = [];
    const allRemovals = {}; // ✅ new
    let processedImages = 0;

    images.forEach((imgObj, imageIndex) => {
      const img = new Image();
      img.src = imgObj.preview;

      img.onload = async () => {
        const stageSize = stageSizes[imageIndex];
        if (!stageSize) {
          processedImages++;
          return;
        }

        const scaleX = img.width / stageSize.width;
        const scaleY = img.height / stageSize.height;

        /* ===== BASE CANVASES ===== */
        const compositeCanvas = document.createElement("canvas");
        const maskCanvas = document.createElement("canvas");
        const preparedCanvas = document.createElement("canvas");

        [compositeCanvas, maskCanvas, preparedCanvas].forEach(c => {
          c.width = img.width;
          c.height = img.height;
        });

        const compositeCtx = compositeCanvas.getContext("2d");
        const maskCtx = maskCanvas.getContext("2d");
        const preparedCtx = preparedCanvas.getContext("2d");

        // base image
        compositeCtx.drawImage(img, 0, 0);
        preparedCtx.drawImage(img, 0, 0);

        // full black mask
        maskCtx.fillStyle = "#000";
        maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);

        const logoPromises = [];
        const shapes = areas[imageIndex] || [];

        /* ===== DRAW ALL SHAPES ===== */
        shapes.forEach((s, shapeIndex) => {
          // const cx = (s.x + s.w / 2) * scaleX;
          // const cy = (s.y + s.h / 2) * scaleY;
          const yOffset = (s.previewYOffset || 0) * scaleY;

          const cx = (s.x + s.w / 2) * scaleX;
          const cy = (s.y + s.h / 2) * scaleY - yOffset;
          const rw = s.w * scaleX;
          const rh = s.h * scaleY;

          /* --- COMPOSITE --- */
          compositeCtx.save();
          compositeCtx.translate(cx, cy);
          compositeCtx.rotate((s.rotation * Math.PI) / 180);
          compositeCtx.fillStyle = "rgba(220,0,0,0.25)";
          compositeCtx.strokeStyle = "#d00";
          compositeCtx.lineWidth = 2;
          compositeCtx.fillRect(-rw / 2, -rh / 2, rw, rh);
          compositeCtx.strokeRect(-rw / 2, -rh / 2, rw, rh);
          compositeCtx.restore();

          /* --- MASK --- */
          maskCtx.save();
          maskCtx.translate(cx, cy);
          maskCtx.rotate((s.rotation * Math.PI) / 180);
          maskCtx.fillStyle = "#fff";

          if (s.type === "circle") {
            maskCtx.beginPath();
            maskCtx.arc(0, 0, Math.min(rw, rh) / 2, 0, Math.PI * 2);
            maskCtx.closePath();
            maskCtx.fill();
          } else {
            maskCtx.fillRect(-rw / 2, -rh / 2, rw, rh);
          }

          maskCtx.restore();


          /* --- LOGO → PREPARED --- */
          const signWithLogo = signsInput.find(
            sign =>
              sign.imageIndex === imageIndex &&
              sign.shapeId === s.id &&
              sign.logo?.base64
          );

          if (signWithLogo?.logo?.base64) {
            logoPromises.push(
              new Promise(resolve => {
                const logoImg = new Image();
                logoImg.src = signWithLogo.logo.base64;
                logoImg.onload = () => {
                  preparedCtx.save();
                  preparedCtx.translate(cx, cy);
                  preparedCtx.rotate((s.rotation * Math.PI) / 180);
                  const pad = 12 * scaleX;
                  preparedCtx.drawImage(
                    logoImg,
                    -rw / 2 + pad,
                    -rh / 2 + pad,
                    rw - pad * 2,
                    rh - pad * 2
                  );
                  preparedCtx.restore();
                  resolve();
                };
              })
            );
          }

        });

        await Promise.all(logoPromises);

        /* ===== DRAW REMOVAL AREAS → PREPARED (INDEPENDENT) ===== */
        (removalAreas?.[imageIndex] || []).forEach((r) => {
          const cx = (r.x + r.w / 2) * scaleX;
          const cy = (r.y + r.h / 2) * scaleY;
          const rw = r.w * scaleX;
          const rh = r.h * scaleY;

          preparedCtx.save();
          preparedCtx.translate(cx, cy);
          preparedCtx.rotate((r.rotation * Math.PI) / 180);

          preparedCtx.fillStyle = "rgba(255,255,255,0.85)";
          preparedCtx.fillRect(-rw / 2, -rh / 2, rw, rh);

          preparedCtx.strokeStyle = "#b00000";
          preparedCtx.setLineDash([8, 6]);
          preparedCtx.lineWidth = 3;
          preparedCtx.strokeRect(-rw / 2, -rh / 2, rw, rh);

          preparedCtx.setLineDash([]);
          preparedCtx.fillStyle = "#b00000";
          preparedCtx.font = `${18 * scaleX}px sans-serif`;
          preparedCtx.textAlign = "center";
          preparedCtx.textBaseline = "middle";
          preparedCtx.fillText("Removal area", 0, 0);

          preparedCtx.restore();
        });

        const finalMask = maskCanvas.toDataURL("image/png");
        const finalPrepared = preparedCanvas.toDataURL("image/jpeg", 0.6);
        const finalComposite = compositeCanvas.toDataURL("image/jpeg", 0.6);

        /* ===== CREATE INDIVIDUAL SIGNS ===== */
        shapes.forEach((s, shapeIndex) => {
          const existing = signsInput.find(
            sign =>
              sign.imageIndex === imageIndex &&
              sign.shapeId === s.id
          );

          const singleCanvas = document.createElement("canvas");
          singleCanvas.width = img.width;
          singleCanvas.height = img.height;
          const ctx = singleCanvas.getContext("2d");

          ctx.drawImage(img, 0, 0);

          ctx.save();
          const yOffset = (s.previewYOffset || 0) * scaleY;

          ctx.translate(
            (s.x + s.w / 2) * scaleX,
            (s.y + s.h / 2) * scaleY - yOffset
          );
          ctx.rotate((s.rotation * Math.PI) / 180);
          ctx.fillStyle = "rgba(220,0,0,0.25)";
          ctx.strokeStyle = "#d00";
          ctx.lineWidth = 2;
          ctx.fillRect(
            (-s.w / 2) * scaleX,
            (-s.h / 2) * scaleY,
            s.w * scaleX,
            s.h * scaleY
          );
          ctx.strokeRect(
            (-s.w / 2) * scaleX,
            (-s.h / 2) * scaleY,
            s.w * scaleX,
            s.h * scaleY
          );
          ctx.restore();

          allSigns.push({
            id: existing?.id || s.id,
            imageIndex,
            shapeIndex,        // ✅ CRÍTICO
            shapeId: s.id,     // ✅ ESTÁVEL
            label: existing?.label || `Sign ${shapeIndex + 1}`,

            preview: singleCanvas.toDataURL("image/jpeg", 0.6),
            compositePreview: finalComposite,

            baseImage: imgObj.preview,
            shapeImageWidth: img.width,
            shapeImageHeight: img.height,

            maskImage: finalMask,
            preparedPreview: finalPrepared,

            shape: {
              ...s,
              type: s.type,
              x: s.x * scaleX,
              y: s.y * scaleY,
              w: s.w * scaleX,
              h: s.h * scaleY,
              rotation: s.rotation || 0,
              previewYOffset: 6.5
            },

            signType: existing?.signType ?? null,
            logo: existing?.logo ?? null,
            illuminated: existing?.illuminated ?? true,
            width: existing?.width ?? "",
            height: existing?.height ?? "",
            estimateWithAI: existing?.estimateWithAI ?? true,
            addition: existing?.addition ?? null,
            aiMode: existing?.aiMode ?? false
          });
        });


        // ✅ SCALE REMOVAL AREAS TO IMAGE PX (same idea as shapes)
        const scaledRemovals = (removalAreas[imageIndex] || []).map((r) => ({
          ...r,
          x: r.x * scaleX,
          y: r.y * scaleY,
          w: r.w * scaleX,
          h: r.h * scaleY,
          rotation: r.rotation || 0
        }));

        allRemovals[imageIndex] = scaledRemovals;

        processedImages++;
        if (processedImages === images.length) {
          callback(allSigns, allRemovals);
        }
      };
    });
  }


  function handleNext() {
    exportAllImages(onNext);
  }

  return (
    <div className="pictures-setup">
      <div className="actions">
        <button className="secondary" onClick={backConfirm.askBack}>
          <ArrowLeft size={12} /> Back
        </button>
        <button className="primary" onClick={handleNext}>
          Next <ArrowRight size={12} />
        </button>
      </div>

      <div className="studio-header">
        <h2>Place the signs</h2>
        <p>Indicate where each sign will be installed.</p>
      </div>

      <div className="thumbs">
        {images.map((img, index) => (
          <img
            key={index}
            src={img.preview}
            className={index === activeIndex ? "active" : ""}
            onClick={() => setActiveIndex(index)}
            alt=""
          />
        ))}
      </div>

      {/* <div className="studio-tools">
        <button onClick={() => addShape("square")}>◼ Square | Rectangle</button>
        <button onClick={() => addShape("circle")}>● Circle | Oval</button>
      </div> */}

      <div
        className="stage"
        onMouseDown={() => setSelectedShape(null)}
      >
        <div className="add-sign-wrapper">
          <button
            className="add-sign-btn"
            onClick={() => setShowAddMenu(v => !v)}
          >
            {!showAddMenu ?
              <>
                <Plus size={16} /> Add Sign
              </> :
              <>
                <Minimize2 size={16} /> Cancel
              </>
            }
          </button>

          {showAddMenu && (
            <div className="add-sign-dropdown">
              <button
                onClick={() => {
                  addShape("square");
                  setShowAddMenu(false);
                }}
              >
                ◼ Square
              </button>

              <button
                onClick={() => {
                  addShape("circle");
                  setShowAddMenu(false);
                }}
              >
                ● Circle
              </button>
            </div>
          )}
        </div>


        <button
          className="add-sign-btn removal"
          onClick={() => addRemovalShape()}
        >
          <Plus size={16} /> Removal area
        </button>

        <div className="stage-image-wrapper">
          {images[activeIndex] && (
            <img
              ref={stageImageRef}
              src={images[activeIndex].preview}
              alt=""
              className="stage-image"
              draggable={false}
            />
          )}
          <div className="stage-overlay" />
        </div>

        {(areas[activeIndex] || []).map((s, i) => (
          <div key={s.id}
            className={`area-shape ${s.type}`}
            style={{
              left: s.x,
              top: s.y,
              width: s.w,
              height: s.h,
              transform: `rotate(${s.rotation}deg)`,
              outline:
                selectedShape &&
                  selectedShape.imageIndex === activeIndex &&
                  selectedShape.shapeId === s.id
                  ? "2px solid #1e6bff"
                  : "none"
            }}

            onMouseDown={(e) => {
              e.stopPropagation();
              setSelectedShape({ imageIndex: activeIndex, shapeId: s.id, type: "area" });
              startDrag(e, s.id);
            }}

          >
            <div className="shape-label">{i + 1}</div>
            <button
              className="remove-shape"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={() => removeShape(i)}
            >
              ×
            </button>

            <div
              className="resize-handle"
              onMouseDown={(e) => startResize(e, i)}
            />
            <div
              className="rotate-handle"
              onMouseDown={(e) => startRotate(e, i)}
            />
          </div>
        ))}

        {(removalAreas[activeIndex] || []).map((s, i) => (
          <div
            key={s.id}
            className="area-shape removal"
            style={{
              left: s.x,
              top: s.y,
              width: s.w,
              height: s.h,
              transform: `rotate(${s.rotation}deg)`
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              setSelectedShape({ imageIndex: activeIndex, shapeId: s.id, type: "removal" });
              startDragRemoval(e, s.id);
            }}
          >
            <div className="removal-label">
              Removal area
            </div>

            <button
              className="remove-shape"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={() => {
                setRemovalAreas((prev) => {
                  const copy = { ...prev };
                  copy[activeIndex] = copy[activeIndex].filter(
                    (_, idx) => idx !== i
                  );
                  return copy;
                });
              }}
            >
              ×
            </button>

            <div
              className="resize-handle"
              onMouseDown={(e) => startResizeRemoval(e, i)}
            />
            <div
              className="rotate-handle"
              onMouseDown={(e) => startRotateRemoval(e, i)}
            />
          </div>
        ))}

      </div>

      <div className="actions">
        <button className="secondary" onClick={backConfirm.askBack}>
          <ArrowLeft size={12} /> Back
        </button>
        <button className="primary" onClick={handleNext}>
          Next <ArrowRight size={12} />
        </button>
      </div>

      <Alert
        open={backConfirm.open}
        title="Go back?"
        message="Are you sure you want to go back? Some actions may not have been saved."
        onClose={backConfirm.cancel}
        onConfirm={backConfirm.confirm}
      />

      {showLimitModal && (
        <div className="modal-overlay" onClick={() => setShowLimitModal(false)}>
          <div className="modal-card apple" onClick={(e) => e.stopPropagation()}>
            <h3>Limit reached</h3>
            <p>Maximum of 4 shapes and 4 removal areas per image.</p>

            <button
              className="primary"
              onClick={() => setShowLimitModal(false)}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
