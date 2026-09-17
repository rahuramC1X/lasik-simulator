import { useState } from 'react';
import {
  BADGE,
  DECODE_TOLERANCE,
  DELTA_K,
  QUIZ,
  SYNTHETIC_REPORT,
  reportLine,
  steepMeridian,
} from '../../game/report';
import type { ReportLineId } from '../../game/report';
import { computeFocusAccuracy, computeOrientAccuracy } from '../../game/scoring';
import { AstigmatismDiagram } from '../diagrams/AstigmatismDiagram';
import { CornealTopography } from '../diagrams/CornealTopography';
import { RayDiagram } from '../diagrams/RayDiagram';

/**
 * PROTOTYPE — "Decode Your Eye". The ten-minute vertical slice for the
 * report-reading direction: instead of explaining a prescription, hand the
 * player one and make each line a control they have to work out by eye.
 *
 * The loop per line is SEE → MANIPULATE → LOCK → UNDERSTAND. Critically,
 * none of the three controls shows its own number while you're dragging —
 * the diagram is the only feedback — so locking in is a discovery ("the
 * value I found is the value printed on the report"), not a matching
 * exercise. Three questions then check that the lines can actually be told
 * apart, which is the thing a real patient can't do.
 *
 * Standalone, like the other prototypes: no GameEngine, no curriculum, no
 * progress. The case is synthetic and nothing here is medical advice.
 */

const SPH = reportLine('sph');
const CYL = reportLine('cyl');
const AXIS = reportLine('axis');
const MEAN_K = (SYNTHETIC_REPORT.cornea[0].power + SYNTHETIC_REPORT.cornea[1].power) / 2;
const STEEP = steepMeridian(AXIS.value);

/** Maps a dioptre mismatch onto RayDiagram's 0-100 power scale. */
const POWER_PER_DIOPTRE = 8;

type Phase = 'decode' | 'quiz' | 'badge';

interface Answer {
  chosen: string;
  correct: boolean;
}

export function DecodeReportPrototype({ onBack }: { onBack: () => void }) {
  const [phase, setPhase] = useState<Phase>('decode');
  const [open, setOpen] = useState<ReportLineId>('sph');
  const [scores, setScores] = useState<Partial<Record<ReportLineId, number>>>({});
  const [message, setMessage] = useState<string | null>(null);

  const [sphere, setSphere] = useState(0);
  const [cylinder, setCylinder] = useState(0);
  const [axis, setAxis] = useState(90);

  const [quizIndex, setQuizIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);

  const errors: Record<ReportLineId, number> = {
    sph: Math.abs(sphere - SPH.value),
    cyl: Math.abs(cylinder - CYL.value),
    axis: Math.min(Math.abs(axis - AXIS.value) % 180, 180 - (Math.abs(axis - AXIS.value) % 180)),
  };
  const inRange = (id: ReportLineId) => errors[id] <= DECODE_TOLERANCE[id];
  const decodedCount = Object.keys(scores).length;
  const allDecoded = decodedCount === 3;

  const lockIn = (id: ReportLineId, missText: string) => {
    if (scores[id] !== undefined) return;
    if (!inRange(id)) {
      setMessage(missText);
      return;
    }
    const accuracy =
      id === 'axis'
        ? computeOrientAccuracy(axis, AXIS.value, DECODE_TOLERANCE.axis)
        : computeFocusAccuracy(id === 'sph' ? sphere : cylinder, reportLine(id).value, DECODE_TOLERANCE[id]);
    setScores((prev) => ({ ...prev, [id]: accuracy }));
    setMessage(null);
  };

  const answer = (optionId: string) => {
    const question = QUIZ[quizIndex];
    if (answers[quizIndex]) return;
    setAnswers((prev) => {
      const next = [...prev];
      next[quizIndex] = { chosen: optionId, correct: optionId === question.answerId };
      return next;
    });
  };

  const nextQuestion = () => {
    if (quizIndex + 1 >= QUIZ.length) setPhase('badge');
    else setQuizIndex((i) => i + 1);
  };

  const restart = () => {
    setPhase('decode');
    setOpen('sph');
    setScores({});
    setMessage(null);
    setSphere(0);
    setCylinder(0);
    setAxis(90);
    setQuizIndex(0);
    setAnswers([]);
  };

  const readAccuracy = allDecoded
    ? Math.round((scores.sph! + scores.cyl! + scores.axis!) / 3)
    : 0;
  const correctCount = answers.filter((a) => a?.correct).length;

  return (
    <div className="screen proto-screen">
      <div className="proto-card proto-card-wide decode-card">
        <div className="proto-header">
          <div>
            <p className="eyebrow">DECODE YOUR EYE · VERTICAL SLICE</p>
            <h1 className="proto-title">
              {phase === 'decode' && 'This report looks like alien language.'}
              {phase === 'quiz' && 'So — which line was which?'}
              {phase === 'badge' && 'You can read it now.'}
            </h1>
          </div>
          <button type="button" className="icon-button" onClick={onBack}>
            BACK
          </button>
        </div>

        <div className="decode-body">
          <ReportCard
            openLine={phase === 'decode' ? open : null}
            scores={scores}
            onOpen={(id) => {
              setOpen(id);
              setMessage(null);
            }}
          />

          <div className="decode-main">
            {phase === 'decode' && (
            <>
              {open === 'sph' && (
                <Panel line={SPH} score={scores.sph}>
                  <RayDiagram
                    power={50 + (SPH.value - sphere) * POWER_PER_DIOPTRE}
                    target={50}
                    tolerance={DECODE_TOLERANCE.sph * POWER_PER_DIOPTRE}
                    caption="Light entering a myopic eye — it converges before it reaches the retina."
                  />
                  <BlindSlider
                    label="CORRECTION"
                    min={0}
                    max={6.5}
                    step={0.05}
                    value={sphere}
                    lo="none"
                    hi="strong"
                    ready={inRange('sph')}
                    disabled={scores.sph !== undefined}
                    onChange={setSphere}
                  />
                </Panel>
              )}

              {open === 'cyl' && (
                <Panel line={CYL} score={scores.cyl}>
                  <CornealTopography
                    deltaK={CYL.value - cylinder}
                    steepMeridian={STEEP}
                    meanK={MEAN_K}
                    showReadout={scores.cyl !== undefined}
                    caption="The same cornea seen face-on. Warm is steeper, cool is flatter."
                  />
                  <BlindSlider
                    label="EVEN OUT"
                    min={0}
                    max={5}
                    step={0.05}
                    value={cylinder}
                    lo="untouched"
                    hi="over-flattened"
                    ready={inRange('cyl')}
                    disabled={scores.cyl !== undefined}
                    onChange={setCylinder}
                  />
                </Panel>
              )}

              {open === 'axis' && (
                <Panel line={AXIS} score={scores.axis}>
                  <AstigmatismDiagram
                    axis={axis}
                    target={AXIS.value}
                    caption="Astigmatism smears a point along a line. Only one orientation rounds it off."
                  />
                  <BlindSlider
                    label="ROTATE"
                    min={0}
                    max={180}
                    step={1}
                    value={axis}
                    lo="0°"
                    hi="180°"
                    ready={inRange('axis')}
                    disabled={scores.axis !== undefined}
                    onChange={setAxis}
                  />
                </Panel>
              )}

              {message && <p className="proto-feedback decode-miss">{message}</p>}

              <div className="decode-actions">
                {scores[open] === undefined ? (
                  <button
                    type="button"
                    className={`primary-button${inRange(open) ? ' decode-ready' : ''}`}
                    onClick={() =>
                      lockIn(
                        open,
                        open === 'sph'
                          ? "Not there yet — the light still isn't landing on the retina."
                          : open === 'cyl'
                            ? 'Still uneven — one meridian is hotter than the other.'
                            : 'Still stretched — the blur has to round off into a point.',
                      )
                    }
                  >
                    LOCK IT IN
                  </button>
                ) : allDecoded ? (
                  <button type="button" className="primary-button" onClick={() => setPhase('quiz')}>
                    ALL THREE DECODED — CONTINUE
                  </button>
                ) : (
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => {
                      const next = (['sph', 'cyl', 'axis'] as const).find((id) => scores[id] === undefined);
                      if (next) setOpen(next);
                      setMessage(null);
                    }}
                  >
                    NEXT LINE
                  </button>
                )}
              </div>

              <p className="proto-score">{decodedCount} of 3 lines decoded</p>
            </>
          )}

          {phase === 'quiz' && (
            <Quiz
              index={quizIndex}
              answer={answers[quizIndex]}
              onAnswer={answer}
              onNext={nextQuestion}
            />
          )}

          {phase === 'badge' && (
            <div className="decode-badge">
              <span className="decode-badge-icon">{BADGE.icon}</span>
              <h2 className="decode-badge-title">{BADGE.title}</h2>
              <p className="decode-badge-blurb">{BADGE.blurb}</p>

              <div className="decode-badge-scores">
                <div>
                  <span className="param-label">Read accuracy</span>
                  <span className="param-value">{readAccuracy}%</span>
                </div>
                <div>
                  <span className="param-label">Questions</span>
                  <span className="param-value">
                    {correctCount}/{QUIZ.length}
                  </span>
                </div>
              </div>

              <ul className="decode-recap">
                {SYNTHETIC_REPORT.lines.map((line) => (
                  <li key={line.id}>
                    <code>
                      {line.code} {line.display}
                    </code>
                    <span>{line.takeaway}</span>
                  </li>
                ))}
              </ul>

              <p className="decode-next">
                Still unread on this report: <code>K1 / K2</code>, and everything a real one would also
                carry — pachymetry, tomography, higher-order aberrations. That's the rest of the game.
              </p>

              <div className="intro-buttons">
                <button type="button" className="primary-button" onClick={restart}>
                  PLAY AGAIN
                </button>
                <button type="button" className="ghost-button" onClick={onBack}>
                  BACK
                </button>
              </div>
            </div>
          )}
          </div>
        </div>

        <p className="disclaimer">
          Synthetic case, built for teaching. It is not a prescription, it says nothing about any real
          person's eyes, and it cannot tell anyone whether a procedure is right for them.
        </p>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- the report */

interface ReportCardProps {
  openLine: ReportLineId | null;
  scores: Partial<Record<ReportLineId, number>>;
  onOpen: (id: ReportLineId) => void;
}

/** The printed report itself — three tappable lines plus the corneal readings. */
function ReportCard({ openLine, scores, onOpen }: ReportCardProps) {
  return (
    <div className="report-card">
      <div className="report-head">
        <span>CASE {SYNTHETIC_REPORT.caseId}</span>
        <span>{SYNTHETIC_REPORT.eye}</span>
      </div>

      {SYNTHETIC_REPORT.lines.map((line) => {
        const decoded = scores[line.id] !== undefined;
        return (
          <button
            key={line.id}
            type="button"
            className={`report-row${openLine === line.id ? ' report-row-open' : ''}${decoded ? ' report-row-done' : ''}`}
            onClick={() => onOpen(line.id)}
            disabled={openLine === null}
          >
            <span className="report-code">{line.code}</span>
            <span className="report-value">{line.display}</span>
            <span className="report-meaning">{decoded ? line.name : line.summary}</span>
            <span className="report-tick">{decoded ? '✓' : '›'}</span>
          </button>
        );
      })}

      <div className="report-cornea">
        {SYNTHETIC_REPORT.cornea.map((k) => (
          <span key={k.code}>
            {k.code} {k.power.toFixed(2)} D @ {k.meridian}°
          </span>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- one line */

interface PanelProps {
  line: ReturnType<typeof reportLine>;
  score: number | undefined;
  children: React.ReactNode;
}

function Panel({ line, score, children }: PanelProps) {
  const decoded = score !== undefined;
  return (
    <div className="decode-panel">
      <p className="decode-task">{decoded ? `${line.code} — ${line.name}` : line.task}</p>
      {children}
      {decoded && (
        <div className="decode-reveal">
          <p className="decode-reveal-value">
            You landed on <strong>{line.display}</strong> — {Math.round(score)}% on the number your
            report already printed.
          </p>
          <p className="intro-brief-fact">{line.takeaway}</p>
          {line.id === 'axis' && (
            <p className="decode-footnote">
              One catch worth knowing: in this notation the axis names the <em>flatter</em> meridian,
              so the cornea's steep one sits 90° away — at {STEEP}°. That's why the map's warm bowtie
              runs across {STEEP}° while the report says {AXIS.display}.
            </p>
          )}
          {line.id === 'cyl' && (
            <p className="decode-footnote">
              The two corneal readings on the report differ by {DELTA_K.toFixed(2)} D — the same
              amount. That's not a coincidence: the cornea is where most of this eye's astigmatism
              lives.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------- the blind control */

interface BlindSliderProps {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  lo: string;
  hi: string;
  ready: boolean;
  disabled: boolean;
  onChange: (value: number) => void;
}

/**
 * A slider with no numeric readout, on purpose: the diagram above it is the
 * only feedback, so the player finds the value by watching the eye rather
 * than by matching a printed number. `ready` lights the track once they're
 * inside the tolerance band — discoverable, but it still has to be found.
 */
function BlindSlider({ label, min, max, step, value, lo, hi, ready, disabled, onChange }: BlindSliderProps) {
  return (
    <div className={`decode-control${ready ? ' decode-control-ready' : ''}`}>
      <span className="decode-control-label">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="focus-slider"
        aria-label={label}
      />
      <div className="focus-slider-labels">
        <span>{lo}</span>
        <span>{hi}</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------- quiz */

interface QuizProps {
  index: number;
  answer: Answer | undefined;
  onAnswer: (optionId: string) => void;
  onNext: () => void;
}

function Quiz({ index, answer, onAnswer, onNext }: QuizProps) {
  const question = QUIZ[index];
  return (
    <div className="decode-quiz">
      <p className="proto-score">
        QUESTION {index + 1} OF {QUIZ.length}
      </p>
      <p className="decode-question">{question.prompt}</p>

      <div className="decode-options">
        {question.options.map((option) => {
          const chosen = answer?.chosen === option.id;
          const isAnswer = option.id === question.answerId;
          const state = !answer ? '' : isAnswer ? ' decode-option-right' : chosen ? ' decode-option-wrong' : '';
          return (
            <button
              key={option.id}
              type="button"
              className={`decode-option${state}`}
              disabled={Boolean(answer)}
              onClick={() => onAnswer(option.id)}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {answer && (
        <div className="decode-reveal">
          <p className="proto-feedback">{answer.correct ? 'RIGHT' : 'NOT QUITE'}</p>
          <p className="intro-brief-fact">{question.explain}</p>
          <div className="intro-buttons">
            <button type="button" className="primary-button" onClick={onNext}>
              {index + 1 >= QUIZ.length ? 'FINISH' : 'NEXT QUESTION'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
