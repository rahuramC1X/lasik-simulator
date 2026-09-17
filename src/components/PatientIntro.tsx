import type { Patient } from '../game/Patient';
import { formatDioptres } from '../game/Patient';
import { CorneaLayers } from './diagrams/CorneaLayers';
import { RayDiagram } from './diagrams/RayDiagram';

interface PatientIntroProps {
  patient: Patient;
  onContinue: () => void;
  onBack: () => void;
}

/** "Plan the Treatment" — the case briefing, and what LASIK actually does to the cornea. */
export function PatientIntro({ patient, onContinue, onBack }: PatientIntroProps) {
  return (
    <div className="screen intro-screen">
      <div className="intro-card">
        <p className="eyebrow">PLAN THE TREATMENT</p>
        <h1 className="intro-name">
          Patient #{patient.id}
          <span className="intro-first-name">{patient.name}</span>
        </h1>

        <div className="intro-params">
          <div className="param">
            <span className="param-label">Myopia</span>
            <span className="param-value">{formatDioptres(patient.myopia)}</span>
          </div>
          <div className="param">
            <span className="param-label">Astigmatism</span>
            <span className="param-value">{formatDioptres(patient.astigmatism)}</span>
          </div>
        </div>

        <p className="intro-note">“{patient.note}”</p>

        <div className="intro-diagram-row">
          <RayDiagram power={75} target={50} caption="Example — uncorrected myopic focus, before treatment" />
        </div>

        <div className="intro-brief">
          <h3>Concept unlocked · Inside the Cornea</h3>
          <CorneaLayers />
          <p className="intro-brief-fact">
            LASIK lifts a thin flap from the cornea's outer layers, reshapes the thicker{' '}
            <strong>stroma</strong> underneath with a laser, then lays the flap back down — no
            stitches needed. It never touches {patient.name}'s natural lens.
          </p>
        </div>

        <div className="intro-buttons">
          <button type="button" className="primary-button" onClick={onContinue}>
            CONTINUE
          </button>
          <button type="button" className="ghost-button" onClick={onBack}>
            EXIT
          </button>
        </div>

        <p className="disclaimer">
          Fictional game parameters. These values are not a medical prescription and say nothing about
          any real person.
        </p>
      </div>
    </div>
  );
}
