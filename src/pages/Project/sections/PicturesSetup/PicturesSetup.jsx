import { useState, useRef } from "react";
import "./PicturesSetup.css";

export default function PicturesSetup({ images, onNext, onBack }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [areas, setAreas] = useState({});
  const dragRef = useRef(null);

  function addShape(type) {
    setAreas((prev) => ({
      ...prev,
      [activeIndex]: [
        ...(prev[activeIndex] || []),
        {
          type,
          x: 120,
          y: 80,
          w: type === "circle" || type === "square" ? 120 : 180,
          h: type === "circle" || type === "square" ? 120 : 80,
          rotation: 0
        }
      ]
    }));
  }

  function startDrag(e, shapeIndex) {
    e.stopPropagation();

    const startX = e.clientX;
    const startY = e.clientY;

    const current = areas[activeIndex][shapeIndex];

    function onMouseMove(ev) {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;

      setAreas((prev) => {
        const copy = { ...prev };
        copy[activeIndex] = [...copy[activeIndex]];
        copy[activeIndex][shapeIndex] = {
          ...copy[activeIndex][shapeIndex],
          x: current.x + dx,
          y: current.y + dy
        };
        return copy;
      });
    }

    function onMouseUp() {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    }

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }

  return (
    <div className="pictures-setup">
      <div className="studio-header">
        <h2>Place the signs</h2>
        <p>Indicate where each sign will be installed.</p>
      </div>

      {/* Thumbnails */}
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

      {/* Stage */}
      <div className="stage" ref={dragRef}>
        {images[activeIndex] && (
          <img
            src={images[activeIndex].preview}
            alt=""
            className="stage-image"
          />
        )}

        {(areas[activeIndex] || []).map((shape, i) => (
          <div
            key={i}
            className={`area-shape ${shape.type}`}
            style={{
              left: shape.x,
              top: shape.y,
              width: shape.w,
              height: shape.h,
              transform: `rotate(${shape.rotation}deg)`
            }}
            onMouseDown={(e) => startDrag(e, i)}
          />
        ))}
      </div>

      {/* Tools */}
      <div className="studio-tools">
        <button onClick={() => addShape("rect")}>▭ Rectangle</button>
        <button onClick={() => addShape("square")}>◼ Square</button>
        <button onClick={() => addShape("circle")}>● Circle</button>
        <button onClick={() => addShape("oval")}>⬭ Oval</button>
      </div>

      {/* Actions */}
      <div className="actions">
        <button className="secondary" onClick={onBack}>
          Back
        </button>
        <button className="primary" onClick={onNext}>
          Next
        </button>
      </div>
    </div>
  );
}
