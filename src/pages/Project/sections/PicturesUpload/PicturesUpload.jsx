export default function PicturesUpload({ onNext }) {
    return (
        <div className="step">
            <h2>Upload Pictures</h2>
            <p>Upload photos of where the signs will be installed.</p>

            <button onClick={onNext}>Next</button>
        </div>
    );
}
