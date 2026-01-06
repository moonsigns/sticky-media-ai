import "./PicturesUpload.css";
import { ArrowRight } from "react-feather";

export default function PicturesUpload({ images, setImages, onNext }) {

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
      <div className="actions">
        <button className="secondary">Instructions</button>
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
          <button className="select-btn">Select from your computer</button>
        </div>
      </div>

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

      <div className="actions">
        <button className="secondary">Add more pictures</button>
        <button
          className="primary"
          disabled={images.length === 0}
          onClick={onNext}
        >
          Next <ArrowRight size={12} />
        </button>
      </div>
    </div>
  );
}
