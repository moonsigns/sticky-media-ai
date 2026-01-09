import { useState, useEffect, useRef } from "react";
import { ArrowLeft, ArrowRight } from "react-feather";
import Alert from "../../../../components/Alert/Alert";
import useBackConfirm from "../../../../hooks/useBackConfirm";
import "./PicturesSetup.css";

export default function PicturesSetup({ images, onNext, onBack }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [areas, setAreas] = useState({});
  const [resizing, setResizing] = useState(null);
  const [rotating, setRotating] = useState(null);
  const [stageSizes, setStageSizes] = useState({});
  const [selectedShape, setSelectedShape] = useState(null);

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
      if (!selectedShape) return;

      const { imageIndex, shapeIndex } = selectedShape;
      const shape = areas[imageIndex]?.[shapeIndex];
      if (!shape) return;

      // DELETE
      if (e.key === "Delete") {
        e.preventDefault();
        setAreas((prev) => {
          const copy = { ...prev };
          copy[imageIndex] = [...copy[imageIndex]];
          copy[imageIndex].splice(shapeIndex, 1);
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
          x: copiedShapeRef.current.x + 20,
          y: copiedShapeRef.current.y + 20
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
    setAreas((prev) => ({
      ...prev,
      [activeIndex]: [
        ...(prev[activeIndex] || []),
        {
          type,
          x: 180,
          y: 120,
          w: 180,
          h: 180,
          rotation: 0
        }
      ]
    }));
  }

  /* ===== DRAG ===== */
  function startDrag(e, i) {
    if (resizing !== null || rotating !== null) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const shape = areas[activeIndex][i];

    function move(ev) {
      setAreas((prev) => {
        const copy = { ...prev };
        copy[activeIndex] = [...copy[activeIndex]];
        copy[activeIndex][i] = {
          ...shape,
          x: shape.x + (ev.clientX - startX),
          y: shape.y + (ev.clientY - startY)
        };
        return copy;
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
        copy[activeIndex][i] = {
          ...shape,
          w: Math.max(40, shape.w + (ev.clientX - startX)),
          h: Math.max(40, shape.h + (ev.clientY - startY))
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

  /* ===== ROTATE ===== */
  function startRotate(e, i) {
    e.stopPropagation();
    setRotating(i);

    const shape = areas[activeIndex][i];
    const cx = shape.x + shape.w / 2;
    const cy = shape.y + shape.h / 2;

    function move(ev) {
      const angle =
        Math.atan2(ev.clientY - cy, ev.clientX - cx) * (180 / Math.PI);

      setAreas((prev) => {
        const copy = { ...prev };
        copy[activeIndex] = [...copy[activeIndex]];
        copy[activeIndex][i] = { ...shape, rotation: angle };
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

  /* ===== EXPORT ALL IMAGES & SIGNS ===== */
  function exportAllImages(callback) {
    const allSigns = [];
    let processed = 0;

    images.forEach((imgObj, imageIndex) => {
      const img = new Image();
      img.src = imgObj.preview;

      img.onload = () => {
        const stageSize = stageSizes[imageIndex];
        if (!stageSize) {
          processed++;
          return;
        }

        const scaleX = img.width / stageSize.width;
        const scaleY = img.height / stageSize.height;

        // ===== COMPOSITE CANVAS (BASE + ALL SHAPES) =====
        const compositeCanvas = document.createElement("canvas");
        compositeCanvas.width = img.width;
        compositeCanvas.height = img.height;
        const compositeCtx = compositeCanvas.getContext("2d");

        // base image
        compositeCtx.drawImage(img, 0, 0);

        (areas[imageIndex] || []).forEach((s, shapeIndex) => {
          /* ===== INDIVIDUAL SIGN CANVAS ===== */
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");

          ctx.drawImage(img, 0, 0);

          ctx.save();
          ctx.translate(
            (s.x + s.w / 2) * scaleX,
            (s.y + s.h / 2) * scaleY
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

          /* ===== DRAW SHAPE ON COMPOSITE ===== */
          compositeCtx.save();
          compositeCtx.translate(
            (s.x + s.w / 2) * scaleX,
            (s.y + s.h / 2) * scaleY
          );
          compositeCtx.rotate((s.rotation * Math.PI) / 180);

          compositeCtx.fillStyle = "rgba(220,0,0,0.25)";
          compositeCtx.strokeStyle = "#d00";
          compositeCtx.lineWidth = 2;

          compositeCtx.fillRect(
            (-s.w / 2) * scaleX,
            (-s.h / 2) * scaleY,
            s.w * scaleX,
            s.h * scaleY
          );
          compositeCtx.strokeRect(
            (-s.w / 2) * scaleX,
            (-s.h / 2) * scaleY,
            s.w * scaleX,
            s.h * scaleY
          );

          compositeCtx.restore();

          /* ===== DRAW INDEX BADGE (COMPOSITE ONLY) ===== */
          compositeCtx.save();

          const badgeX = (s.x + s.w / 2) * scaleX;
          const badgeY = (s.y - 14) * scaleY;

          compositeCtx.fillStyle = "#1e6bff";
          compositeCtx.beginPath();
          compositeCtx.arc(badgeX, badgeY, 14, 0, Math.PI * 2);
          compositeCtx.fill();

          compositeCtx.fillStyle = "#fff";
          compositeCtx.font = "bold 14px system-ui";
          compositeCtx.textAlign = "center";
          compositeCtx.textBaseline = "middle";
          compositeCtx.fillText(
            String(shapeIndex + 1),
            badgeX,
            badgeY
          );

          compositeCtx.restore();

          /* ===== PUSH SIGN OBJECT ===== */
          allSigns.push({
            id: `img-${imageIndex}-shape-${shapeIndex}`,
            imageIndex,
            shapeIndex,
            label: `Sign ${shapeIndex + 1}`,

            // base image (clean, original)
            previewBase: imgObj.preview,

            // individual preview (for SignType)
            preview: canvas.toDataURL("image/png"),

            shape: {
              ...s,
              x: s.x * scaleX,
              y: s.y * scaleY,
              w: s.w * scaleX,
              h: s.h * scaleY,
              rotation: s.rotation || 0
            },

            signType: null,
            logo: null
          });
        });

        /* ===== ATTACH COMPOSITE PREVIEW TO SIGNS ===== */
        const compositePreview = compositeCanvas.toDataURL("image/png");

        allSigns
          .filter((s) => s.imageIndex === imageIndex)
          .forEach((s) => {
            s.compositePreview = compositePreview;
          });

        processed++;
        if (processed === images.length) {
          callback(allSigns);
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

      <div className="studio-tools">
        <button onClick={() => addShape("square")}>◼ Square | Rectangle</button>
        <button onClick={() => addShape("circle")}>● Circle | Oval</button>
      </div>

      <div
        className="stage"
        onMouseDown={() => setSelectedShape(null)}
      >
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
            key={i}
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
                  selectedShape.shapeIndex === i
                  ? "2px solid #1e6bff"
                  : "none"
            }}

            onMouseDown={(e) => {
              e.stopPropagation();
              setSelectedShape({ imageIndex: activeIndex, shapeIndex: i });
              startDrag(e, i);
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
