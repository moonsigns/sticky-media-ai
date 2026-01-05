export default function SignType({ onNext, onBack }) {
  return (
    <div className="step">
      <h2>Select Sign Type</h2>
      <p>Choose the sign type for each placement.</p>

      <div className="actions">
        <button onClick={onBack}>Back</button>
        <button onClick={onNext}>Next</button>
      </div>
    </div>
  );
}
