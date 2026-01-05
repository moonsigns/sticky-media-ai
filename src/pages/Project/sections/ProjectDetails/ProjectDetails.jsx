export default function ProjectDetails({ onNext, onBack }) {
  return (
    <div className="step">
      <h2>Project Details</h2>
      <p>Upload logos and set dimensions.</p>

      <div className="actions">
        <button onClick={onBack}>Back</button>
        <button onClick={onNext}>Next</button>
      </div>
    </div>
  );
}
