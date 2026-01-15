import { useEffect, useState } from "react";
import PicturesUpload from "./sections/PicturesUpload/PicturesUpload";
import PicturesSetup from "./sections/PicturesSetup/PicturesSetup";
import SignType from "./sections/SignType/SignType";
import ProjectReview from "./sections/ProjectReview/ProjectReview";
import AiProjectProcessing from "./sections/AiProjectProcessing/AiProjectProcessing";

import "./ProjectSetup.css";

const STEPS = {
    UPLOAD: "pictures-upload",
    SETUP: "pictures-setup",
    SIGN: "sign-type",
    REVIEW: "review",
    PROCESSING: "processing"
};

export default function ProjectSetup({ onGenerate }) {
    const [step, setStep] = useState(STEPS.UPLOAD);
    const [images, setImages] = useState([]);
    const [signs, setSigns] = useState([]);
    const [removalAreas, setRemovalAreas] = useState({});

    const [processingPayload, setProcessingPayload] = useState(null);

    useEffect(() => {
        function syncFromHash() {
            const hash = window.location.hash.replace("#/project/", "");
            if (Object.values(STEPS).includes(hash)) {
                setStep(hash);
            } else {
                updateStep(STEPS.UPLOAD);
            }
        }

        syncFromHash();
        window.addEventListener("hashchange", syncFromHash);

        return () => {
            window.removeEventListener("hashchange", syncFromHash);
        };
    }, []);


    function updateStep(nextStep) {
        window.location.hash = `/project/${nextStep}`;
        setStep(nextStep);
    }

    function renderStep() {
        switch (step) {
            case STEPS.UPLOAD:
                return <PicturesUpload
                    images={images}
                    setImages={setImages}
                    onNext={() => updateStep(STEPS.SETUP)}
                />;

            case STEPS.SETUP:
                return (
                    <PicturesSetup
                        images={images}
                        signs={signs}   // ✅ PASS SIGNS
                        onBack={() => updateStep(STEPS.UPLOAD)}
                        onNext={(generatedSigns, generatedRemovals) => {
                            setSigns(generatedSigns);
                            setRemovalAreas(generatedRemovals || {});
                            updateStep(STEPS.SIGN);
                        }}
                    />
                );

            case STEPS.SIGN:
                return (
                    <SignType
                        signs={signs}
                        onBack={() => updateStep(STEPS.SETUP)}
                        onNext={(updatedSigns) => {
                            setSigns(updatedSigns);
                            updateStep(STEPS.REVIEW);
                        }}
                    />
                );

            case STEPS.REVIEW:
                return (
                    <ProjectReview
                        signs={signs}
                        removalAreas={removalAreas}
                        onBack={() => updateStep(STEPS.SIGN)}
                        onGenerate={(payload) => {
                            setProcessingPayload(payload);
                            updateStep(STEPS.PROCESSING);
                        }}
                    />
                );

            case STEPS.PROCESSING:
                return (
                    <AiProjectProcessing payload={processingPayload} />
                );

            default:
                return null;
        }
    }

    return <div className="project-setup">{renderStep()}</div>;
}
