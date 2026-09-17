interface VisionRevealProps {
  patientName: string;
  onSkip: () => void;
}

/**
 * The payoff moment between a precision stage and the result screen: a
 * simulated eye-chart snaps from blurry to sharp. Purely a game flourish —
 * it is not a depiction of any real person's outcome.
 */
export function VisionReveal({ patientName, onSkip }: VisionRevealProps) {
  return (
    <div className="screen reveal-screen" onClick={onSkip}>
      <p className="reveal-caption reveal-before">BEFORE</p>

      <div className="reveal-chart reveal-chart-blurry">
        <span className="chart-line chart-line-1">E</span>
        <span className="chart-line chart-line-2">F P</span>
        <span className="chart-line chart-line-3">T O Z</span>
        <span className="chart-line chart-line-4">L P E D</span>
      </div>

      <p className="reveal-flash">TREATMENT COMPLETE</p>

      <div className="reveal-chart reveal-chart-clear">
        <span className="chart-line chart-line-1">E</span>
        <span className="chart-line chart-line-2">F P</span>
        <span className="chart-line chart-line-3">T O Z</span>
        <span className="chart-line chart-line-4">L P E D</span>
      </div>

      <p className="reveal-caption reveal-after">
        CLEAR VISION
        <span className="reveal-sub">{patientName} · virtual result</span>
      </p>

      <p className="reveal-skip">click to skip</p>
    </div>
  );
}
