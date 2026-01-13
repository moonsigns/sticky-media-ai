import { useState } from "react";
import { ArrowRight, Image, Move, Layers, CheckCircle, X } from "react-feather";
import "./PicturesUpload.css";

export default function PicturesUpload({ images, setImages, onNext }) {
  const [showInstructions, setShowInstructions] = useState(false);

  function handleFiles(selectedFiles) {
    setImages((prev) => {
      const remainingSlots = 4 - prev.length;
      if (remainingSlots <= 0) return prev;

      const newFiles = Array.from(selectedFiles)
        .slice(0, remainingSlots)
        .map((file) => ({
          file,
          preview: URL.createObjectURL(file)
        }));

      return [...prev, ...newFiles];
    });
  }

  function removeFile(index) {
    setImages((prev) => {
      const copy = [...prev];
      URL.revokeObjectURL(copy[index].preview);
      copy.splice(index, 1);
      return copy;
    });
  }

  function onDrop(e) {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  }

  return (
    <div className="pictures-upload">
      {/* TOP ACTIONS */}
      <div className="actions">
        <button
          className="secondary"
          onClick={() => setShowInstructions(true)}
        >
          Instructions
        </button>

        <button
          className="primary"
          disabled={images.length === 0}
          onClick={onNext}
        >
          Next <ArrowRight size={12} />
        </button>
      </div>

      <h2>Upload Pictures</h2>
      <p className="subtitle">
        Upload photos of where the signs will be installed.
      </p>

      {/* UPLOAD AREA */}
      <div
        className="upload-box"
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => handleFiles(e.target.files)}
        />

        <div className="upload-content">
          <span className="upload-icon">＋</span>
          <p>Drag & drop your images here</p>
          <span className="or">or</span>
          <button className="select-btn">Select from your device</button>
        </div>
      </div>

      {/* PREVIEWS */}
      {images.length > 0 && (
        <div className="preview-grid">
          {images.map((img, index) => (
            <div key={index} className="preview-item">
              <img src={img.preview} alt="preview" />
              <button
                className="remove-btn"
                onClick={() => removeFile(index)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* INSTRUCTIONS MODAL */}
      {showInstructions && (
        <div
          className="modal-overlay"
          onClick={() => setShowInstructions(false)}
        >
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close"
              onClick={() => setShowInstructions(false)}
            >
              <X size={16} />
            </button>

            <h1>How it works</h1>

            <div className="modal-steps">
              <div className="modal-step">
                <Image size={22} />
                <div>
                  <strong>1. Upload photos</strong>
                  <p>Use clear photos showing the full building or wall.</p>
                </div>
              </div>

              <div className="modal-step">
                <Move size={22} />
                <div>
                  <strong>2. Place sign areas</strong>
                  <p>Mark exactly where each sign will be installed.</p>
                </div>
              </div>

              <div className="modal-step">
                <Layers size={22} />
                <div>
                  <strong>3. Choose sign types</strong>
                  <p>Select materials, lighting, and upload logos.</p>
                </div>
              </div>

              <div className="modal-step">
                <CheckCircle size={22} />
                <div>
                  <strong>4. Review & submit</strong>
                  <p>We generate visuals, pricing, and a proposal PDF.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
