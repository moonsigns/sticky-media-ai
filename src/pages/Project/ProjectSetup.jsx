import { useEffect, useState } from "react";
import PicturesUpload from "./sections/PicturesUpload/PicturesUpload";
import PicturesSetup from "./sections/PicturesSetup/PicturesSetup";
import SignType from "./sections/SignType/SignType";
import ProjectDetails from "./sections/ProjectDetails/ProjectDetails";
import ProjectReview from "./sections/ProjectReview/ProjectReview";
import "./ProjectSetup.css";

const STEPS = {
    UPLOAD: "pictures-upload",
    SETUP: "pictures-setup",
    SIGN: "sign-type",
    DETAILS: "details",
    REVIEW: "review"
};

export default function ProjectSetup({ onGenerate }) {
    const [step, setStep] = useState(STEPS.UPLOAD);
    const [images, setImages] = useState([]);
    const [signs, setSigns] = useState([]);

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
                        onBack={() => updateStep(STEPS.UPLOAD)}
                        onNext={(generatedSigns) => {
                            setSigns(generatedSigns);
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
                            updateStep(STEPS.DETAILS);
                        }}
                    />
                );

            case STEPS.DETAILS:
                return (
                    <ProjectDetails
                        onBack={() => updateStep(STEPS.SIGN)}
                        onNext={() => updateStep(STEPS.REVIEW)}
                    />
                );

            case STEPS.REVIEW:
                return (
                    <ProjectReview
                        onBack={() => updateStep(STEPS.DETAILS)}
                        onGenerate={onGenerate}
                    />
                );

            default:
                return null;
        }
    }

    return <div className="project-setup">{renderStep()}</div>;
}
