import { useEffect, useState } from 'react';
import { AstigmatismChallenge } from './components/AstigmatismChallenge';
import { MissionIntro } from './components/comic/MissionIntro';
import { EyeIdentify } from './components/EyeIdentify';
import { FocusChallenge } from './components/FocusChallenge';
import { GameCanvas } from './components/GameCanvas';
import { HUD } from './components/HUD';
import { KnowledgeCabinet } from './components/KnowledgeCabinet';
import { LevelSelect } from './components/LevelSelect';
import { MainMenu } from './components/MainMenu';
import { PatientIntro } from './components/PatientIntro';
import { DecodeReportPrototype } from './components/prototypes/DecodeReportPrototype';
import { FocusHuntPrototype } from './components/prototypes/FocusHuntPrototype';
import { OpticalPuzzlePrototype } from './components/prototypes/OpticalPuzzlePrototype';
import { PrototypePicker } from './components/prototypes/PrototypePicker';
import type { PrototypeId } from './components/prototypes/PrototypePicker';
import { VisionChasePrototype } from './components/prototypes/VisionChasePrototype';
import { ResultScreen } from './components/ResultScreen';
import { VisionReveal } from './components/VisionReveal';
import { setMuted } from './game/audio';
import { GameEngine } from './game/GameEngine';
import type { HudSnapshot } from './game/GameEngine';
import { getLevel } from './game/levels';
import { getLevelStory } from './game/story';

/**
 * Application composition only: it owns which screen is visible and forwards
 * intent to the engine. All gameplay, level, and scoring logic lives in
 * src/game — this file doesn't know what any individual level contains.
 */
export default function App() {
  // The engine is created once and never replaced; useState's lazy initialiser
  // keeps it stable across renders without touching a ref during render.
  const [engine] = useState(() => new GameEngine());
  const [hud, setHud] = useState<HudSnapshot>(() => engine.getHud());
  const [muted, setMutedState] = useState(false);
  const [cabinetOpen, setCabinetOpen] = useState(false);
  // Set whenever a mission's comic intro is showing — from Level Select or
  // from the "Next Level" button — before the engine actually starts it.
  const [pendingLevelId, setPendingLevelId] = useState<number | null>(null);
  // Experimental core-mechanic comparisons, entirely separate from the
  // engine/curriculum — 'picker' shows the menu, a PrototypeId plays one.
  const [prototypeView, setPrototypeView] = useState<'picker' | PrototypeId | null>(null);

  useEffect(() => engine.subscribe(setHud), [engine]);

  const toggleMute = () => {
    setMutedState((prev) => {
      setMuted(!prev);
      return !prev;
    });
  };

  // The 3D eye is only mounted for the precision mechanic and its bookends —
  // anatomy/focus/orientation teaching uses the 2D diagrams instead.
  const showCanvas =
    (hud.state === 'STAGE' && hud.stageType === 'precision') || hud.state === 'COMPLETE' || hud.state === 'RESULT';

  // The remedial precision drill (id 0) isn't part of the numbered sequence,
  // so it has no "next level" — only the ten curriculum levels chain forward.
  const nextLevelId = hud.level && hud.level.id > 0 ? hud.level.id + 1 : null;
  const nextLevel = nextLevelId ? getLevel(nextLevelId) : undefined;
  const onNextLevel = nextLevel?.playable ? () => setPendingLevelId(nextLevel.id) : null;
  const onStartTraining = hud.state === 'RESULT' && engine.needsPrecisionTraining()
    ? () => engine.startPrecisionTraining()
    : null;

  const pendingLevel = pendingLevelId !== null ? getLevel(pendingLevelId) : undefined;
  const pendingStory = pendingLevelId !== null ? getLevelStory(pendingLevelId) : undefined;
  const showMissionIntro = Boolean(pendingLevel && pendingStory);
  const outroStory = hud.level ? getLevelStory(hud.level.id) : undefined;

  if (prototypeView) {
    const backToPicker = () => setPrototypeView('picker');
    const backToMenu = () => setPrototypeView(null);
    return (
      <main className="app app-prototype">
        <div className="stage">
          {prototypeView === 'picker' && <PrototypePicker onSelect={setPrototypeView} onBack={backToMenu} />}
          {prototypeView === 'focus-hunt' && <FocusHuntPrototype onBack={backToPicker} />}
          {prototypeView === 'vision-chase' && <VisionChasePrototype onBack={backToPicker} />}
          {prototypeView === 'optical-puzzle' && <OpticalPuzzlePrototype onBack={backToPicker} />}
          {prototypeView === 'decode-report' && <DecodeReportPrototype onBack={backToPicker} />}
        </div>
      </main>
    );
  }

  return (
    <main className={`app app-${hud.state.toLowerCase()}`}>
      <div className="stage">
        {showCanvas && <GameCanvas engine={engine} />}

        {showMissionIntro && pendingLevel && pendingStory && (
          <MissionIntro
            levelCode={pendingLevel.code}
            levelName={pendingLevel.name}
            story={pendingStory}
            onStart={() => {
              engine.selectLevel(pendingLevel.id);
              setPendingLevelId(null);
            }}
            onBack={() => setPendingLevelId(null)}
          />
        )}

        {!showMissionIntro && hud.state === 'MENU' && (
          <MainMenu
            onPlay={() => engine.openLevelSelect()}
            onOpenCabinet={() => setCabinetOpen(true)}
            onOpenPrototypes={() => setPrototypeView('picker')}
          />
        )}

        {!showMissionIntro && hud.state === 'LEVEL_SELECT' && (
          <LevelSelect onSelect={(id) => setPendingLevelId(id)} onBack={() => engine.returnToMenu()} />
        )}

        {!showMissionIntro && hud.state === 'STAGE' && hud.stageType === 'identify' && (
          <EyeIdentify
            identify={hud.identify}
            feedback={hud.identifyFeedback}
            onSelect={(id) => engine.tapStructure(id)}
            onContinue={() => engine.advanceStage()}
            onAbort={() => engine.openLevelSelect()}
          />
        )}

        {!showMissionIntro && hud.state === 'STAGE' && hud.stageType === 'focus' && (
          <FocusChallenge
            engine={engine}
            patient={hud.patient}
            focusAccuracy={hud.focusAccuracy}
            onContinue={() => engine.advanceStage()}
            onAbort={() => engine.openLevelSelect()}
          />
        )}

        {!showMissionIntro && hud.state === 'STAGE' && hud.stageType === 'orient' && (
          <AstigmatismChallenge
            engine={engine}
            patient={hud.patient}
            orientAccuracy={hud.orientAccuracy}
            onContinue={() => engine.advanceStage()}
            onAbort={() => engine.openLevelSelect()}
          />
        )}

        {!showMissionIntro && hud.state === 'STAGE' && hud.stageType === 'plan' && (
          <PatientIntro
            patient={hud.patient}
            onContinue={() => engine.advanceStage()}
            onBack={() => engine.openLevelSelect()}
          />
        )}

        {!showMissionIntro && hud.state === 'STAGE' && hud.stageType === 'precision' && (
          <HUD hud={hud} muted={muted} onToggleMute={toggleMute} onAbort={() => engine.openLevelSelect()} />
        )}

        {!showMissionIntro && hud.state === 'COMPLETE' && (
          <VisionReveal patientName={hud.patient.name} onSkip={() => engine.skipReveal()} />
        )}

        {!showMissionIntro && hud.state === 'RESULT' && (
          <ResultScreen
            hud={hud}
            outroStory={outroStory}
            onReplay={() => engine.replayLevel()}
            onNextLevel={onNextLevel}
            onStartTraining={onStartTraining}
            onLevelSelect={() => engine.openLevelSelect()}
            onOpenCabinet={() => setCabinetOpen(true)}
          />
        )}
      </div>

      {cabinetOpen && <KnowledgeCabinet onClose={() => setCabinetOpen(false)} />}
    </main>
  );
}
