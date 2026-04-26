import { useState } from "react";
import { ArrowRight, Image, Move, Layers, CheckCircle, X } from "react-feather";
import howItWorksImg from "../../../../assets/how-it-works-steps-v3.png";
import InstructionsImg from "../../../../assets/how-it-works-steps-v3.png";
import "./PicturesUpload.css";

export default function PicturesUpload({ images, setImages, onNext }) {
  const [showInstructions, setShowInstructions] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [showLimitModal, setShowLimitModal] = useState(false);

  function handleFiles(selectedFiles) {
    setImages((prev) => {
      const remainingSlots = 1 - prev.length;

      if (selectedFiles.length > remainingSlots) {
        // setModalMessage("Only 2 images are allowed in this version.");
        setModalMessage("Only 1 image is allowed in this beta version.");
        setShowLimitModal(true);
      }

      if (remainingSlots <= 0) return prev;

      const newFiles = Array.from(selectedFiles)
        .filter(file => {
          const valid = ["image/png", "image/jpeg"].includes(file.type);
          if (!valid) {
            setModalMessage("Only PNG and JPG images are allowed.");
            setShowLimitModal(true);
            return false;
          }
          if (file.size > 4 * 1024 * 1024) {
            setModalMessage("Image is too large (maximum size is 4MB). Try uploading a screenshot instead.");
            setShowLimitModal(true);
            return false;
          }
          return valid;
        })
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

  function resizeImage(file, maxWidth = 700, quality = 0.6) {
    return new Promise((resolve) => {
      const img = new window.Image(); // ✅ IMPORTANT FIX
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


  return (
    <div className="pictures-upload">
      {/* TOP ACTIONS */}

      <div className="steps-hero">
        <img
          src={howItWorksImg}
          alt="..."
        />
      </div>

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
          // onClick={onNext}
          onClick={async () => {
            const resized = await Promise.all(
              images.map(async (img) => {
                const resizedFile = await resizeImage(img.file);
                return {
                  ...img,
                  file: resizedFile,
                  preview: URL.createObjectURL(resizedFile)
                };
              })
            );

            setImages(resized);
            onNext();
          }}
        >
          Next <ArrowRight size={12} />
        </button>
      </div>

      <h2>Upload Pictures</h2>
      <p className="subtitle">
        Upload a photo of <strong>where the signs will be installed</strong>.
      </p>

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

      {/* UPLOAD AREA */}
      <div
        className="upload-box"
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <input
          type="file"
          // multiple
          // accept="image/*"
          accept="image/png, image/jpeg"
          onChange={(e) => handleFiles(e.target.files)}
        />

        <div className="upload-content">
          <span className="upload-icon">＋</span>
          <p>Drag & drop your image here</p>
          <p style={{ fontSize: "13px", marginTop: "-5px", color: "#999", }}>Picture of the signs location</p>
          <span className="or">or</span>
          <button className="select-btn">Select from your device</button>
        </div>
      </div>



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
            <div className="steps-hero-modal">
              <img
                src={InstructionsImg}
                alt="..."
              />
            </div>

          </div>
        </div>
      )}

      {showLimitModal && (
        <div className="modal-overlay" onClick={() => setShowLimitModal(false)}>
          <div className="modal-card apple" onClick={(e) => e.stopPropagation()}>
            <h3>Alert</h3>
            <p>{modalMessage}</p>

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
