import { useState, useEffect } from "react";
import { ArrowLeft, ArrowRight } from "react-feather";
import Alert from "../../../../components/Alert/Alert";
import useBackConfirm from "../../../../hooks/useBackConfirm";
import "./PicturesSetup.css";

export default function PicturesSetup({ images, onNext, onBack }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [areas, setAreas] = useState({});
  const [resizing, setResizing] = useState(null);
  const [rotating, setRotating] = useState(null);

  const backConfirm = useBackConfirm(onBack);

  useEffect(() => {
    if (activeIndex >= images.length) {
      setActiveIndex(0);
    }
  }, [images, activeIndex]);

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

    const stageImageEl = document.querySelector(".stage-image");
    if (!stageImageEl) return;

    images.forEach((imgObj, imageIndex) => {
      const img = new Image();
      img.src = imgObj.preview;

      img.onload = () => {
        const scaleX = img.width / stageImageEl.offsetWidth;
        const scaleY = img.height / stageImageEl.offsetHeight;

        /* ADD THIS LINE */
        const yOffsetFix = 5 * scaleY;

        (areas[imageIndex] || []).forEach((s, shapeIndex) => {
          // Canvas isolado por SIGN
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");

          // Base image
          ctx.drawImage(img, 0, 0);

          // Shape
          ctx.save();
          ctx.translate(
            (s.x + s.w / 2) * scaleX,
            (s.y + s.h / 2) * scaleY + yOffsetFix
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

          // Final SIGN object
          allSigns.push({
            id: `img-${imageIndex}-shape-${shapeIndex}`,
            imageIndex,
            shapeIndex,
            label: `Sign ${shapeIndex + 1}`,
            preview: canvas.toDataURL("image/png"),
            shape: {
              ...s,
              x: s.x * scaleX,
              y: s.y * scaleY,
              w: s.w * scaleX,
              h: s.h * scaleY
            },
            signType: null,
            logo: null
          });
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
        <button className="secondary" onClick={backConfirm.askBack}><ArrowLeft size={12} />Back</button>
        <button className="primary" onClick={handleNext}>Next <ArrowRight size={12} /></button>
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

      <hr></hr>

      <p style={{ color: '#a8a8a8ff', marginBottom: '20px', fontSize: '13px' }}>Add signs location to the picture:</p>

      <div className="studio-tools">
        <button onClick={() => addShape("square")}>◼ Square | Rectangle</button>
        <button onClick={() => addShape("circle")}>● Circle | Oval</button>
      </div>

      <div className="stage">
        <div className="stage-image-wrapper">
          {images[activeIndex] && (
            <img
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
              transform: `rotate(${s.rotation}deg)`
            }}
            onMouseDown={(e) => startDrag(e, i)}
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
        <button className="secondary" onClick={backConfirm.askBack}><ArrowLeft size={12} />Back</button>
        <button className="primary" onClick={handleNext}>Next <ArrowRight size={12} /></button>
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
