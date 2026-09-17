import { CharacterAvatar } from './characters/Avatars';
import { LabBackdrop } from './LabBackdrop';

interface MainMenuProps {
  onPlay: () => void;
  onOpenCabinet: () => void;
  onOpenPrototypes: () => void;
}

export function MainMenu({ onPlay, onOpenCabinet, onOpenPrototypes }: MainMenuProps) {
  return (
    <div className="screen menu-screen">
      <LabBackdrop />
      <div className="menu-inner">
        <p className="eyebrow">A COMIC VISION ADVENTURE</p>
        <h1 className="menu-title menu-title-comic">
          EYE<span className="menu-title-accent">HEROES</span>
        </h1>
        <p className="menu-tagline">
          Your favorite heroes can't see straight. Help them — one mission at a time.
        </p>

        <div className="menu-heroes">
          <span className="menu-hero"><CharacterAvatar id="ora" /></span>
          <span className="menu-hero"><CharacterAvatar id="dexter" /></span>
          <span className="menu-hero"><CharacterAvatar id="luna" /></span>
          <span className="menu-hero"><CharacterAvatar id="comet" /></span>
        </div>

        <div className="menu-buttons">
          <button type="button" className="primary-button large" onClick={onPlay}>
            PLAY
          </button>
          <button type="button" className="ghost-button" onClick={onOpenCabinet}>
            KNOWLEDGE CABINET
          </button>
          <button type="button" className="ghost-button" onClick={onOpenPrototypes}>
            🧪 MECHANIC PROTOTYPES
          </button>
        </div>

        <ul className="menu-hints">
          <li>Tap to identify eye anatomy</li>
          <li>Drag to understand focus &amp; astigmatism</li>
          <li>Move &amp; click to perform the laser treatment</li>
        </ul>

        <p className="disclaimer">
          This is a fictional game experience inspired by LASIK, with an original cast of
          characters. It is not medical or surgical training, and it does not reproduce a real
          surgical procedure.
        </p>
      </div>
    </div>
  );
}
