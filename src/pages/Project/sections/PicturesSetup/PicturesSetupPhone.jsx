import { useState, useEffect, useRef } from "react";
import { ArrowLeft, ArrowRight, Plus, Minimize2 } from "react-feather";
import Alert from "../../../../components/Alert/Alert";
import useBackConfirm from "../../../../hooks/useBackConfirm";
import "./PicturesSetup.css"; // reuse same CSS (fastest path)

export default function PicturesSetupPhone({ images, signs = [], onNext, onBack }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [areas, setAreas] = useState({});
  const [removalAreas, setRemovalAreas] = useState({});
  const [stageSizes, setStageSizes] = useState({});
  const [selectedShape, setSelectedShape] = useState(null);
  const [showAddMenu, setShowAddMenu] = useState(false);

  const stageImageRef = useRef(null);
  const backConfirm = useBackConfirm(onBack);

  // --- pointer gesture state (mobile) ---
  const gestureRef = useRef({
    imageIndex: null,
    listType: null, // "areas" | "removalAreas"
    shapeId: null,

    pointers: new Map(), // pointerId -> {x,y}

    startMid: { x: 0, y: 0 },
    startDist: 0,
    startAngle: 0,

    startShape: null // {x,y,w,h,rotation}
  });

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, []);

  useEffect(() => {
    if (activeIndex >= images.length) setActiveIndex(0);
  }, [images, activeIndex]);

  /* ===== MEASURE STAGE IMAGE ===== */
  useEffect(() => {
    const el = stageImageRef.current;
    if (!el) return;

    function update() {
      setStageSizes((prev) => {
        const prevSize = prev[activeIndex];
        const nextSize = { width: el.offsetWidth, height: el.offsetHeight };

        if (prevSize && prevSize.width === nextSize.width && prevSize.height === nextSize.height) {
          return prev;
        }
        return { ...prev, [activeIndex]: nextSize };
      });
    }

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [activeIndex, images]);

  /* ===== ADD SHAPES ===== */
  function addShape(type) {
    setAreas((prev) => ({
      ...prev,
      [activeIndex]: [
        ...(prev[activeIndex] || []),
        {
          id: crypto.randomUUID(),
          type,
          x: 80,
          y: 120,
          w: 140,
          h: 110,
          rotation: 0,
          previewYOffset: 15.5
        }
      ]
    }));
  }

  function addRemovalShape() {
    setRemovalAreas((prev) => ({
      ...prev,
      [activeIndex]: [
        ...(prev[activeIndex] || []),
        {
          id: crypto.randomUUID(),
          type: "removal",
          x: 80,
          y: 120,
          w: 140,
          h: 110,
          rotation: 0,
          previewYOffset: 15.5
        }
      ]
    }));
  }

  /* ===== REMOVE ===== */
  function removeAreaShape(shapeId) {
    setAreas((prev) => {
      const copy = { ...prev };
      copy[activeIndex] = (copy[activeIndex] || []).filter((s) => s.id !== shapeId);
      return copy;
    });
    setSelectedShape(null);
  }

  function removeRemovalShape(shapeId) {
    setRemovalAreas((prev) => {
      const copy = { ...prev };
      copy[activeIndex] = (copy[activeIndex] || []).filter((s) => s.id !== shapeId);
      return copy;
    });
    setSelectedShape(null);
  }

  /* =========================================================
     MOBILE GESTURES (Pointer Events)
     - 1 finger: drag
     - 2 fingers: pinch scale + rotate + move
  ========================================================= */

  function getList(listType, imageIndex) {
    return listType === "areas"
      ? (areas[imageIndex] || [])
      : (removalAreas[imageIndex] || []);
  }

  function setList(listType, imageIndex, nextList) {
    if (listType === "areas") {
      setAreas((prev) => ({ ...prev, [imageIndex]: nextList }));
    } else {
      setRemovalAreas((prev) => ({ ...prev, [imageIndex]: nextList }));
    }
  }

  function updateShapeById(listType, imageIndex, shapeId, updater) {
    const list = getList(listType, imageIndex);
    const idx = list.findIndex((s) => s.id === shapeId);
    if (idx === -1) return;

    const updated = [...list];
    updated[idx] = updater(updated[idx]);
    setList(listType, imageIndex, updated);
  }

  function distance(a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function angle(a, b) {
    return Math.atan2(b.y - a.y, b.x - a.x);
  }

  function midPoint(a, b) {
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  }

  function onShapePointerDown(e, listType, shapeId) {
    e.preventDefault();
    e.stopPropagation();

    const g = gestureRef.current;
    g.imageIndex = activeIndex;
    g.listType = listType;
    g.shapeId = shapeId;

    // select
    setSelectedShape({ imageIndex: activeIndex, shapeId, type: listType === "areas" ? "area" : "removal" });

    // capture pointer
    e.currentTarget.setPointerCapture(e.pointerId);

    // store pointer
    g.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // snapshot shape
    const list = getList(listType, activeIndex);
    const shape = list.find((s) => s.id === shapeId);
    if (!shape) return;

    g.startShape = { ...shape };

    const pts = Array.from(g.pointers.values());
    if (pts.length === 2) {
      const [p1, p2] = pts;
      g.startMid = midPoint(p1, p2);
      g.startDist = distance(p1, p2);
      g.startAngle = angle(p1, p2);
    }
  }

  function onShapePointerMove(e) {
    const g = gestureRef.current;
    if (!g.shapeId || g.imageIndex !== activeIndex) return;
    if (!g.pointers.has(e.pointerId)) return;

    g.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    const pts = Array.from(g.pointers.values());
    const MIN_SIZE = 18;

    // One pointer → drag
    if (pts.length === 1) {
      const cur = pts[0];
      const start = g.startShape;
      if (!start) return;

      // We don’t have the "start pointer" stored separately per pointer,
      // so we compute delta from last move by storing last pointer in gestureRef.
      // Easiest: store last pointer per pointerId in the map and apply incremental delta:
      // We'll do incremental by reading previous position via a second map:
    }

    // Two pointers → scale + rotate + move
    if (pts.length >= 2) {
      const [p1, p2] = pts;
      const curMid = midPoint(p1, p2);
      const curDist = distance(p1, p2);
      const curAng = angle(p1, p2);

      const start = g.startShape;
      if (!start) return;

      const moveDx = curMid.x - g.startMid.x;
      const moveDy = curMid.y - g.startMid.y;

      const scale = g.startDist ? (curDist / g.startDist) : 1;
      const rotDeltaDeg = ((curAng - g.startAngle) * 180) / Math.PI;

      updateShapeById(g.listType, g.imageIndex, g.shapeId, (s) => {
        const nextW = Math.max(MIN_SIZE, start.w * scale);
        const nextH = Math.max(MIN_SIZE, start.h * scale);

        return {
          ...s,
          x: start.x + moveDx,
          y: start.y + moveDy,
          w: nextW,
          h: nextH,
          rotation: (start.rotation || 0) + rotDeltaDeg
        };
      });
    }
  }

  // incremental drag support (single finger)
  const lastSingleMoveRef = useRef(new Map()); // pointerId -> {x,y}

  function onShapePointerMoveWithDrag(e) {
    const g = gestureRef.current;
    if (!g.shapeId || g.imageIndex !== activeIndex) return;
    if (!g.pointers.has(e.pointerId)) return;

    const prev = lastSingleMoveRef.current.get(e.pointerId);
    const next = { x: e.clientX, y: e.clientY };

    g.pointers.set(e.pointerId, next);

    const pts = Array.from(g.pointers.values());

    // One pointer → drag incremental
    if (pts.length === 1) {
      if (!prev) {
        lastSingleMoveRef.current.set(e.pointerId, next);
        return;
      }

      const dx = next.x - prev.x;
      const dy = next.y - prev.y;

      updateShapeById(g.listType, g.imageIndex, g.shapeId, (s) => ({
        ...s,
        x: s.x + dx,
        y: s.y + dy
      }));

      lastSingleMoveRef.current.set(e.pointerId, next);
      return;
    }

    // Two pointers → reset "single drag"
    lastSingleMoveRef.current.delete(e.pointerId);

    // Two pointers gesture
    onShapePointerMove(e);
  }

  function onShapePointerUp(e) {
    const g = gestureRef.current;
    g.pointers.delete(e.pointerId);
    lastSingleMoveRef.current.delete(e.pointerId);

    const pts = Array.from(g.pointers.values());

    // If still two pointers after lifting, refresh gesture base
    if (pts.length === 2 && g.startShape) {
      const [p1, p2] = pts;
      g.startMid = midPoint(p1, p2);
      g.startDist = distance(p1, p2);
      g.startAngle = angle(p1, p2);

      // also refresh base shape snapshot to avoid jump
      const list = getList(g.listType, activeIndex);
      const shape = list.find((s) => s.id === g.shapeId);
      if (shape) g.startShape = { ...shape };
    }

    // If no pointers left, clear gesture
    if (pts.length === 0) {
      g.imageIndex = null;
      g.listType = null;
      g.shapeId = null;
      g.startShape = null;
    }
  }

  /* ===== EXPORT ALL IMAGES & SIGNS (same as your code, kept) ===== */
  function exportAllImages(callback, signsInput = []) {
    const allSigns = [];
    const allRemovals = {};
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

        const compositeCanvas = document.createElement("canvas");
        const maskCanvas = document.createElement("canvas");
        const preparedCanvas = document.createElement("canvas");

        [compositeCanvas, maskCanvas, preparedCanvas].forEach((c) => {
          c.width = img.width;
          c.height = img.height;
        });

        const compositeCtx = compositeCanvas.getContext("2d");
        const maskCtx = maskCanvas.getContext("2d");
        const preparedCtx = preparedCanvas.getContext("2d");

        compositeCtx.drawImage(img, 0, 0);
        preparedCtx.drawImage(img, 0, 0);

        maskCtx.fillStyle = "#000";
        maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);

        const logoPromises = [];
        const shapes = areas[imageIndex] || [];

        shapes.forEach((s, shapeIndex) => {
          const yOffset = (s.previewYOffset || 0) * scaleY;

          const cx = (s.x + s.w / 2) * scaleX;
          const cy = (s.y + s.h / 2) * scaleY - yOffset;
          const rw = s.w * scaleX;
          const rh = s.h * scaleY;

          compositeCtx.save();
          compositeCtx.translate(cx, cy);
          compositeCtx.rotate((s.rotation * Math.PI) / 180);
          compositeCtx.fillStyle = "rgba(220,0,0,0.25)";
          compositeCtx.strokeStyle = "#d00";
          compositeCtx.lineWidth = 2;
          compositeCtx.fillRect(-rw / 2, -rh / 2, rw, rh);
          compositeCtx.strokeRect(-rw / 2, -rh / 2, rw, rh);
          compositeCtx.restore();

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

          const signWithLogo = signsInput.find(
            (sign) =>
              sign.imageIndex === imageIndex &&
              sign.shapeId === s.id &&
              sign.logo?.base64
          );

          if (signWithLogo?.logo?.base64) {
            logoPromises.push(
              new Promise((resolve) => {
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

        // removal areas drawn into prepared image
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
        const finalPrepared = preparedCanvas.toDataURL("image/png");
        const finalComposite = compositeCanvas.toDataURL("image/png");

        // create individual signs
        shapes.forEach((s, shapeIndex) => {
          const existing = signsInput.find(
            (sign) => sign.imageIndex === imageIndex && sign.shapeId === s.id
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
          ctx.fillRect((-s.w / 2) * scaleX, (-s.h / 2) * scaleY, s.w * scaleX, s.h * scaleY);
          ctx.strokeRect((-s.w / 2) * scaleX, (-s.h / 2) * scaleY, s.w * scaleX, s.h * scaleY);
          ctx.restore();

          allSigns.push({
            id: existing?.id || s.id,
            imageIndex,
            shapeIndex,
            shapeId: s.id,
            label: existing?.label || `Sign ${shapeIndex + 1}`,

            preview: singleCanvas.toDataURL("image/png"),
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
              previewYOffset: 15.5
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
    // ✅ IMPORTANT: pass signs so preparedPreview includes logos (same as desktop intent)
    exportAllImages(onNext, signs);
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
        <p>Touch: 1 finger move • 2 fingers scale/rotate</p>
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

      <div className="stage" onPointerDown={() => setSelectedShape(null)}>
        <div className="add-sign-wrapper">
          <button className="add-sign-btn" onClick={() => setShowAddMenu((v) => !v)}>
            {!showAddMenu ? (
              <>
                <Plus size={16} /> Add Sign
              </>
            ) : (
              <>
                <Minimize2 size={16} /> Cancel
              </>
            )}
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

        <button className="add-sign-btn removal" onClick={addRemovalShape}>
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

        {/* AREA SHAPES */}
        {(areas[activeIndex] || []).map((s, i) => (
          <div
            key={s.id}
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
                  : "none",
              touchAction: "none" // ✅ critical for pinch/rotate
            }}
            onPointerDown={(e) => onShapePointerDown(e, "areas", s.id)}
            onPointerMove={onShapePointerMoveWithDrag}
            onPointerUp={onShapePointerUp}
            onPointerCancel={onShapePointerUp}
          >
            <div className="shape-label">{i + 1}</div>

            <button
              className="remove-shape"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => removeAreaShape(s.id)}
            >
              ×
            </button>
          </div>
        ))}

        {/* REMOVAL SHAPES */}
        {(removalAreas[activeIndex] || []).map((s, i) => (
          <div
            key={s.id}
            className="area-shape removal"
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
                  : "none",
              touchAction: "none"
            }}
            onPointerDown={(e) => onShapePointerDown(e, "removalAreas", s.id)}
            onPointerMove={onShapePointerMoveWithDrag}
            onPointerUp={onShapePointerUp}
            onPointerCancel={onShapePointerUp}
          >
            <div className="removal-label">Removal area</div>

            <button
              className="remove-shape"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => removeRemovalShape(s.id)}
            >
              ×
            </button>
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
    </div>
  );
}
