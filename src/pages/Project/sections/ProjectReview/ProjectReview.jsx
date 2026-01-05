export default function ProjectReview({ onGenerate, onBack }) {
  return (
    <div className="step">
      <h2>Review & Submit</h2>
      <p>Review all information before generating with AI.</p>

      <div className="actions">
        <button onClick={onBack}>Back</button>
        <button onClick={onGenerate}>Generate with AI</button>
      </div>
    </div>
  );
}
