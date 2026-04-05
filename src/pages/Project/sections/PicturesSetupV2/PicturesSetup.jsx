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
          previewYOffset: copiedShapeRef.current.previewYOffset ?? 1.5
        };

        setAreas((prev) => ({
          ...prev,
          [imageIndex]: [...(prev[imageIndex] || []), pasted]
        }));
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedShape]);


  // ONLY showing the important fixed parts

  /* ===== ADD SHAPES ===== */
  function addShape(type) {
    const size = 105;

    setAreas((prev) => ({
      ...prev,
      [activeIndex]: [
        ...(prev[activeIndex] || []),
        {
          id: crypto.randomUUID(),
          type,
          x: 400,
          y: 120,
          w: size,
          h: type === "circle" ? size : 100,
          rotation: 0,
          previewYOffset: 1.5
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
          x: 200,
          y: 120,
          w: 95,
          h: 80,
          rotation: 0
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

  function exportAllImages(callback, signsInput = []) {
    const allSigns = [];
    const allRemovals = {};
    let processedImages = 0;

    images.forEach((imgObj, imageIndex) => {
      const img = new Image();
      img.src = imgObj.preview;

      img.onload = () => {
        const stageSize = stageSizes[imageIndex];
        if (!stageSize) {
          processedImages++;
          return;
        }

        const scaleX = img.width / stageSize.width;
        const scaleY = img.height / stageSize.height;

        /* ===== CANVASES ===== */
        const compositeCanvas = document.createElement("canvas");
        const maskCanvas = document.createElement("canvas");

        [compositeCanvas, maskCanvas].forEach(c => {
          c.width = img.width;
          c.height = img.height;
        });

        const compositeCtx = compositeCanvas.getContext("2d");
        const maskCtx = maskCanvas.getContext("2d");

        /* ===== BASE IMAGE ===== */
        compositeCtx.drawImage(img, 0, 0);

        const baseOnly = compositeCanvas.toDataURL("image/png");

        /* ===== FULL BLACK MASK ===== */
        maskCtx.fillStyle = "#000";
        maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);

        const shapes = areas[imageIndex] || [];

        /* ===== DRAW SHAPES ===== */
        shapes.forEach((s) => {
          const cx = (s.x + s.w / 2) * scaleX;
          const cy = (s.y + s.h / 2) * scaleY;
          const rw = s.w * scaleX;
          const rh = s.h * scaleY;

          compositeCtx.save();
          compositeCtx.translate(cx, cy);
          compositeCtx.rotate((s.rotation * Math.PI) / 180);
          compositeCtx.fillRect(-rw / 2, -rh / 2, rw, rh);
          compositeCtx.restore();

          maskCtx.save();
          maskCtx.translate(cx, cy);
          maskCtx.rotate((s.rotation * Math.PI) / 180);
          maskCtx.fillStyle = "#fff";

          if (s.type === "circle") {
            maskCtx.beginPath();
            maskCtx.arc(0, 0, Math.min(rw, rh) / 2, 0, Math.PI * 2);
            maskCtx.fill();
          } else {
            maskCtx.fillRect(-rw / 2, -rh / 2, rw, rh);
          }

          maskCtx.restore();
        });

        /* ===== REMOVAL AREAS → ALSO WHITE IN MASK ===== */
        (removalAreas?.[imageIndex] || []).forEach((r) => {
          const cx = (r.x + r.w / 2) * scaleX;
          const cy = (r.y + r.h / 2) * scaleY;
          const rw = r.w * scaleX;
          const rh = r.h * scaleY;

          maskCtx.save();
          maskCtx.translate(cx, cy);
          maskCtx.rotate((r.rotation * Math.PI) / 180);
          maskCtx.fillStyle = "#fff";
          maskCtx.fillRect(-rw / 2, -rh / 2, rw, rh);
          maskCtx.restore();
        });

        const finalMask = maskCanvas.toDataURL("image/png");
        const finalComposite = compositeCanvas.toDataURL("image/png");

        /* ===== CREATE INDIVIDUAL SIGNS ===== */
        shapes.forEach((s, shapeIndex) => {
          const existing = signsInput.find(
            sign =>
              sign.imageIndex === imageIndex &&
              sign.shapeId === s.id
          );

          allSigns.push({
            id: existing?.id || s.id,
            imageIndex,
            shapeIndex,
            shapeId: s.id,
            label: existing?.label || `Sign ${shapeIndex + 1}`,

            baseImage: baseOnly,
            compositePreview: finalComposite,
            maskImage: finalMask,

            shapeImageWidth: img.width,
            shapeImageHeight: img.height,

            stageWidth: stageSize.width,
            stageHeight: stageSize.height,

            shape: {
              ...s,
              type: s.type,
              x: s.x,
              y: s.y,
              w: s.w,
              h: s.h,
              rotation: s.rotation || 0
            },

            signType: existing?.signType ?? null,
            logo: existing?.logo ?? null,
            illuminated: existing?.illuminated ?? true,
            width: existing?.width ?? "",
            height: existing?.height ?? "",
            estimateWithAI: existing?.estimateWithAI ?? true,
            addition: existing?.addition ?? null,
            aiMode: existing?.aiMode ?? false,
            instructions: existing?.instructions ?? ""
          });
        });

        /* ===== SCALE REMOVAL AREAS ===== */
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
    exportAllImages((signs, removals) => {
      onNext(signs, removals);
    });
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
          <div
            key={s.id}
            className={`area-shape ${s.type}`}
            style={{
              left: s.x,
              top: s.y,
              width: s.w,
              height: s.h,
              transform: `rotate(${s.rotation}deg)`,
              borderRadius: s.type === "circle" ? "50%" : "0",
              outline:
                selectedShape &&
                  selectedShape.imageIndex === activeIndex &&
                  selectedShape.shapeId === s.id
                  ? "2px solid #1e6bff"
                  : "none"
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              setSelectedShape({
                imageIndex: activeIndex,
                shapeId: s.id,
                type: "area"
              });
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
    </div>
  );
}
