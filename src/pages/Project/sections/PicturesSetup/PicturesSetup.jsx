export default function PicturesSetup({ onNext, onBack }) {
    return (
        <div className="step">
            <h2>Setup Pictures</h2>
            <p>Place shapes where the signs should be installed.</p>

            <div className="actions">
                <button onClick={onBack}>Back</button>
                <button onClick={onNext}>Next</button>
            </div>
        </div>
    );
}
