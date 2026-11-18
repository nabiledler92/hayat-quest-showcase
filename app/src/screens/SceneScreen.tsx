import { useEffect, useRef, useState } from 'react';
import { useJourney, Button, Sheet, ContentLabel } from '../ui';
import { IsoScene } from '../scene/IsoScene';
import { Joystick } from '../scene/Joystick';
import { HOTSPOTS, type Hotspot } from '../scene/iso';
import { DEFAULT_AVATAR } from '../scene/avatars';
import { MILESTONES } from '../content';

// 8. Journey scene and first mission (D-030 – D-034)
export function SceneScreen() {
  const { state, dispatch } = useJourney();
  const pos = useRef({ ...state.avatarPos });
  const input = useRef({ x: 0, y: 0 });
  const [near, setNear] = useState<Hotspot['id'] | null>(null);
  const [journalOpen, setJournalOpen] = useState(false);

  useEffect(() => {
    dispatch({ type: 'milestone', id: 'first-steps', points: MILESTONES['first-steps'].points });
  }, [dispatch]);

  const recommended: Hotspot['id'] = !state.missionDone ? 'assessment' : !state.careVisited ? 'care' : 'journal';

  const open = (id: Hotspot['id']) => {
    const keepPos = { avatarPos: { ...pos.current } };
    if (id === 'assessment') dispatch({ type: 'patch', patch: { ...keepPos, step: 'topics' } });
    else if (id === 'care') dispatch({ type: 'patch', patch: { ...keepPos, step: 'care' } });
    else {
      dispatch({ type: 'patch', patch: keepPos });
      setJournalOpen(true);
    }
  };

  const nearSpot = HOTSPOTS.find((h) => h.id === near);
  const doneCount = Number(state.missionDone) + Number(state.careVisited);

  return (
    <section className="screen scene-screen">
      <div className="scene-head">
        <div>
          <p className="eyebrow">The Cavern of First Steps</p>
          <p className="scene-progress">
            {doneCount}/2 places explored{state.showRewards && ` · ${state.milestones.length} milestone${state.milestones.length === 1 ? '' : 's'}`}
          </p>
        </div>
        {state.missionDone && state.careVisited && (
          <Button onClick={() => dispatch({ type: 'go', step: 'endcheck' })}>Finish journey</Button>
        )}
      </div>

      <div className="scene-wrap">
        <IsoScene
          avatar={state.avatar ?? DEFAULT_AVATAR}
          pos={pos}
          input={input}
          recommended={recommended}
          onNearChange={setNear}
          onHotspotClick={open}
        />
        <div className="scene-controls">
          <Joystick vec={input} />
          <div className="activate-slot">
            {nearSpot ? (
              <button className="activate" style={{ borderColor: nearSpot.color }} onClick={() => open(nearSpot.id)}>
                <span className="activate-key">Activate</span>
                <span className="activate-label">{nearSpot.label}</span>
              </button>
            ) : (
              <p className="scene-hint">Walk to a glowing point, or tap it directly.</p>
            )}
          </div>
        </div>

        {!state.tutorialSeen && (
          <div className="tutorial" role="dialog" aria-label="How to move">
            <h2>Find your way</h2>
            <ul className="plain-list">
              <li>Drag the joystick (or use arrow keys) to move.</li>
              <li>Walk close to a glowing point, then press Activate.</li>
              <li>Prefer not to move? Use the list below to go anywhere directly.</li>
            </ul>
            <Button onClick={() => dispatch({ type: 'patch', patch: { tutorialSeen: true } })}>Got it</Button>
          </div>
        )}
      </div>

      <nav className="place-list" aria-label="Go directly to a place">
        <p className="eyebrow">Go directly</p>
        {HOTSPOTS.map((h) => {
          const done = (h.id === 'assessment' && state.missionDone) || (h.id === 'care' && state.careVisited);
          return (
            <button key={h.id} className={`place ${h.id === recommended ? 'is-next' : ''}`} onClick={() => open(h.id)}>
              <span className="place-dot" style={{ background: h.color }} aria-hidden="true" />
              <span className="place-label">{h.label}</span>
              <span className="place-state">{done ? '✓ Explored' : h.id === recommended ? 'Suggested next' : ''}</span>
            </button>
          );
        })}
      </nav>

      {journalOpen && (
        <Sheet title="Insight journal" onClose={() => setJournalOpen(false)}>
          {state.journal.length === 0 ? (
            <p className="muted">
              Your journal is empty. You can choose to save a clinician question here after the first mission — nothing is saved unless you ask.
            </p>
          ) : (
            <>
              <p className="muted small">Saved in this tab only for the demo. It clears when you exit or reload.</p>
              <ul className="journal-list">
                {state.journal.map((j, i) => (
                  <li key={i}>
                    <span>{j}</span>
                    <button
                      className="link-btn"
                      onClick={() => dispatch({ type: 'patch', patch: { journal: state.journal.filter((_, k) => k !== i) } })}
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
          {state.missionDone && (
            <div className="card card-soft">
              <p className="eyebrow">Learning insight</p>
              <ContentLabel status="placeholder" />
              <p className="small">Assessment explorer — you looked at what an assessment may involve and prepared a question.</p>
            </div>
          )}
        </Sheet>
      )}
    </section>
  );
}
