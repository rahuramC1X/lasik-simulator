import { useState } from 'react';
import { ALL_CONCEPTS, getUnlockedConceptIds } from '../game/curriculum';

interface KnowledgeCabinetProps {
  onClose: () => void;
}

/**
 * "My Surgery Lab" — a browsable record of what the player has demonstrated
 * across the first ten levels so far. Pure React over localStorage; no
 * engine state involved. The locked-future-chapters roadmap lives on the
 * Level Select screen now, not here.
 */
export function KnowledgeCabinet({ onClose }: KnowledgeCabinetProps) {
  const unlocked = getUnlockedConceptIds();
  const [openId, setOpenId] = useState<string | null>(null);
  const unlockedCount = ALL_CONCEPTS.filter((c) => unlocked.has(c.id)).length;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="cabinet-card" onClick={(e) => e.stopPropagation()}>
        <div className="cabinet-header">
          <div>
            <p className="eyebrow">MY SURGERY LAB</p>
            <h2 className="cabinet-title">Knowledge Cabinet</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose}>
            CLOSE
          </button>
        </div>

        <p className="cabinet-progress">
          {unlockedCount} / {ALL_CONCEPTS.length} concepts unlocked
        </p>

        <ul className="cabinet-list">
          {ALL_CONCEPTS.map((concept) => {
            const isUnlocked = unlocked.has(concept.id);
            const isOpen = openId === concept.id;
            return (
              <li key={concept.id} className={`cabinet-item${isUnlocked ? ' cabinet-item-unlocked' : ''}`}>
                <button
                  type="button"
                  className="cabinet-item-row"
                  disabled={!isUnlocked}
                  onClick={() => setOpenId(isOpen ? null : concept.id)}
                >
                  <span className="cabinet-item-mark">{isUnlocked ? '✓' : '🔒'}</span>
                  <span className="cabinet-item-title">{concept.title}</span>
                </button>
                {isOpen && isUnlocked && <p className="cabinet-item-fact">{concept.fact}</p>}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
