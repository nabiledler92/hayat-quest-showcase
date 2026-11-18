import { useEffect, useReducer, useRef, useState } from 'react';
import { initialState, reducer, type Step } from './state';
import { JourneyContext, Sheet, Button } from './ui';
import { MILESTONES, PILOT_SUMMARY } from './content';
import * as Onboarding from './screens/onboarding';
import * as Mission from './screens/mission';
import { SceneScreen } from './screens/SceneScreen';
import { PresenterLab } from './PresenterLab';

const SCREENS: Record<Step, () => JSX.Element> = {
  welcome: Onboarding.Welcome,
  signin: Onboarding.SignIn,
  consent: Onboarding.Consent,
  declined: Onboarding.Declined,
  profile: Onboarding.Profile,
  avatar: Onboarding.AvatarPicker,
  stage: Onboarding.StartingPoint,
  baseline: Onboarding.Baseline,
  scene: SceneScreen,
  topics: Mission.Topics,
  prompts: Mission.Prompts,
  answer: Mission.Answer,
  reflection: Mission.Reflection,
  keep: Mission.KeepQuestions,
  care: Mission.Care,
  endcheck: Mission.EndCheck,
  summary: Mission.Summary,
};

const PRE_ACCOUNT: Step[] = ['welcome', 'signin', 'consent', 'declined'];

export default function App() {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const [sheet, setSheet] = useState<null | 'privacy' | 'help' | 'exit'>(null);
  const [toast, setToast] = useState<string | null>(null);
  const prevMilestones = useRef(state.milestones.length);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.milestones.length > prevMilestones.current && state.showRewards) {
      const id = state.milestones[state.milestones.length - 1];
      const m = MILESTONES[id];
      setToast(`Milestone: ${m.label} · +${m.points}`);
      const t = setTimeout(() => setToast(null), 2600);
      prevMilestones.current = state.milestones.length;
      return () => clearTimeout(t);
    }
    prevMilestones.current = state.milestones.length;
  }, [state.milestones, state.showRewards]);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 });
  }, [state.step]);

  const Current = SCREENS[state.step];
  const signedIn = !PRE_ACCOUNT.includes(state.step);

  return (
    <JourneyContext.Provider value={{ state, dispatch }}>
      <div className="stage">
        <aside className="stage-note" aria-label="Presenter note">
          <strong>HAYAT QUEST</strong>
          <span>Prototype demo · Slice 1</span>
          <span>Scripted flow · placeholder content · nothing saved or sent</span>
        </aside>
        <div className="phone" aria-label="HAYAT QUEST app">
          <header className="topbar">
            <span className="brand">
              <span className="brand-mark" aria-hidden="true">◆</span> HAYAT QUEST
            </span>
            <span className="topbar-actions">
              {signedIn && state.showRewards && state.points > 0 && (
                <span className="points" aria-label={`${state.points} points`}>
                  ✦ {state.points}
                </span>
              )}
              <button className="icon-btn" onClick={() => setSheet('privacy')} aria-label="Privacy">
                🔒
              </button>
              <button className="icon-btn" onClick={() => setSheet('help')} aria-label="Help and settings">
                ?
              </button>
              <button className="icon-btn" onClick={() => setSheet('exit')} aria-label="Exit">
                ⎋
              </button>
            </span>
          </header>
          <div className="demo-strip">Prototype demo · placeholder content · nothing is saved</div>
          <div className="phone-body" ref={bodyRef}>
            <Current />
          </div>
          {toast && (
            <div className="toast" role="status">
              {toast}
            </div>
          )}

          {sheet === 'privacy' && (
            <Sheet title="Privacy in this demo" onClose={() => setSheet(null)}>
              <ul className="plain-list">
                <li>Everything you choose stays in this browser tab's memory and clears when you reload or exit.</li>
                <li>No account is created, no data is sent to a server, and no AI service is called.</li>
                <li>Conversation history is off by default. Saving it, and using it to personalise answers, would each be separate opt-ins.</li>
                <li>Pilot ratings would be linked only to a random ID: <code>{state.pilotId}</code>.</li>
              </ul>
              <h3>Draft pilot summary</h3>
              <p className="muted small">Draft — not the final participant notice.</p>
              <ul className="plain-list">
                {PILOT_SUMMARY.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </Sheet>
          )}
          {sheet === 'help' && (
            <Sheet title="Help & settings" onClose={() => setSheet(null)}>
              <ul className="plain-list">
                <li>In the scene, drag the joystick or use arrow keys / WASD. Walk to a glowing point and press Activate.</li>
                <li>Prefer not to move? Use the list under the scene to go straight to any place.</li>
                <li>You can go back, skip optional steps, or exit at any time.</li>
              </ul>
              <div className="stack">
                <label className="toggle">
                  <span className="toggle-text">
                    <span className="toggle-label">Show rewards</span>
                    <span className="toggle-hint">Points and milestone pop-ups. They never depend on sharing health information.</span>
                  </span>
                  <input
                    type="checkbox"
                    role="switch"
                    checked={state.showRewards}
                    onChange={(e) => dispatch({ type: 'patch', patch: { showRewards: e.target.checked } })}
                  />
                  <span className="toggle-track" aria-hidden="true" />
                </label>
              </div>
              <div className="lab-section">
                <p className="eyebrow">For presenters</p>
                <PresenterLab />
              </div>
            </Sheet>
          )}
          {sheet === 'exit' && (
            <Sheet title="Exit the journey?" onClose={() => setSheet(null)}>
              <p>Exiting clears everything from this session, including any journal entries. Nothing has been stored anywhere else.</p>
              <div className="row">
                <Button variant="secondary" onClick={() => setSheet(null)}>
                  Stay
                </Button>
                <Button
                  onClick={() => {
                    dispatch({ type: 'reset' });
                    setSheet(null);
                  }}
                >
                  Exit and clear
                </Button>
              </div>
            </Sheet>
          )}
        </div>
      </div>
    </JourneyContext.Provider>
  );
}
