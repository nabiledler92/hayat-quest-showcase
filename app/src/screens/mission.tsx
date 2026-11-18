import { useState } from 'react';
import { useJourney, Screen, Button, Choice, ContentLabel, DemoBadge } from '../ui';
import {
  ANSWERS,
  FREE_TEXT_BOUNDARY,
  MILESTONES,
  REFLECTION_SUGGESTIONS,
  RATING_QUESTIONS,
  TAKEAWAY,
  TOPICS,
  EMIRATES,
  VERIFY_CHECKLIST,
  careExamplesFor,
  type ScriptedAnswer,
} from '../content';
import { RatingBlock } from './onboarding';
import type { Rating } from '../state';

const backToScene = { type: 'go', step: 'scene' } as const;

// 9. Topic selection
export function Topics() {
  const { dispatch } = useJourney();
  return (
    <Screen
      eyebrow="Mission 1 · Understand an assessment"
      title="What would you like to explore?"
      footer={
        <Button variant="ghost" onClick={() => dispatch(backToScene)}>
          Back to the cavern
        </Button>
      }
    >
      <div className="stack">
        {TOPICS.map((t) => (
          <Choice key={t.id} selected={false} hint={t.blurb} onClick={() => dispatch({ type: 'patch', patch: { topicId: t.id, step: 'prompts' } })}>
            {t.title}
          </Choice>
        ))}
      </div>
      <p className="muted small">"Male fertility assessment" is a working term, pending clinician review.</p>
    </Screen>
  );
}

// 10. Suggested prompts or free text
export function Prompts() {
  const { state, dispatch } = useJourney();
  const topic = TOPICS.find((t) => t.id === state.topicId) ?? TOPICS[0];
  const [text, setText] = useState('');
  const stageNote =
    state.lifeStage === 'trying'
      ? 'Suggestions for people who are already trying.'
      : state.lifeStage === 'planning'
        ? 'Suggestions for people planning ahead.'
        : 'Suggestions to get you started.';

  return (
    <Screen
      eyebrow={topic.title}
      title="Ask the guide"
      footer={
        <Button variant="ghost" onClick={() => dispatch({ type: 'go', step: 'topics' })}>
          Choose a different topic
        </Button>
      }
    >
      <p className="field-hint">{stageNote}</p>
      <div className="stack">
        {topic.prompts.map((p) => (
          <button
            key={p.id}
            className="prompt-chip"
            onClick={() => dispatch({ type: 'patch', patch: { promptId: p.id, freeText: null, step: 'answer' } })}
          >
            {p.text}
          </button>
        ))}
      </div>
      <ContentLabel status="placeholder" />

      <form
        className="ask-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (!text.trim()) return;
          dispatch({ type: 'patch', patch: { promptId: null, freeText: text.trim(), step: 'answer' } });
        }}
      >
        <label htmlFor="ask" className="sr-only">
          Type your own question
        </label>
        <input id="ask" className="input" placeholder="Or type your own question…" value={text} onChange={(e) => setText(e.target.value)} maxLength={200} />
        <Button type="submit" variant="secondary" disabled={!text.trim()}>
          Ask
        </Button>
      </form>
      <p className="muted small">Please don't include personal health details. In this demo, your question isn't sent anywhere.</p>
    </Screen>
  );
}

// 11. Answer card
export function Answer() {
  const { state, dispatch } = useJourney();
  const [more, setMore] = useState(false);
  const [sourceOpen, setSourceOpen] = useState(false);
  const answer: ScriptedAnswer = state.freeText ? FREE_TEXT_BOUNDARY : (ANSWERS[state.promptId ?? ''] ?? FREE_TEXT_BOUNDARY);
  const question = state.freeText ?? TOPICS.flatMap((t) => t.prompts).find((p) => p.id === state.promptId)?.text;

  return (
    <Screen
      eyebrow="Guide"
      footer={
        <>
          <Button onClick={() => dispatch({ type: 'go', step: 'reflection' })}>{answer.nextStep}</Button>
          <Button variant="ghost" onClick={() => dispatch({ type: 'go', step: 'prompts' })}>
            Ask a follow-up
          </Button>
        </>
      }
    >
      {question && <div className="bubble bubble-user">{question}</div>}
      <article className="answer-card">
        <p className="answer-short">{answer.short}</p>
        {more && <p className="answer-more">{answer.more}</p>}
        <button className="link-btn" onClick={() => setMore(!more)} aria-expanded={more}>
          {more ? 'Show less' : 'Read more'}
        </button>
        <button className="source-row" onClick={() => setSourceOpen(!sourceOpen)} aria-expanded={sourceOpen}>
          <ContentLabel status={answer.status} />
          <span className="source-title">{answer.sourceTitle}</span>
        </button>
        {sourceOpen && (
          <div className="source-detail small">
            <p>
              <strong>Status:</strong> Not yet reviewed. In the pilot, every answer will come only from a clinician-reviewed source, showing its title,
              owner, reviewer and review date.
            </p>
            <p>
              <strong>Boundaries:</strong> no diagnosis, treatment or test-result interpretation.
            </p>
          </div>
        )}
      </article>
    </Screen>
  );
}

// 12. Reflection and takeaway
export function Reflection() {
  const { state, dispatch } = useJourney();
  const [text, setText] = useState(state.reflection);
  const finish = (reflection: string) => {
    dispatch({ type: 'patch', patch: { reflection, missionDone: true, step: reflection ? 'keep' : 'scene' } });
    dispatch({ type: 'milestone', id: 'mission-1', points: MILESTONES['mission-1'].points });
  };
  return (
    <Screen
      eyebrow="Mission 1 · Reflection (optional)"
      title="What would you like to ask a clinician?"
      footer={
        <>
          <Button disabled={!text.trim()} onClick={() => finish(text.trim())}>
            Continue
          </Button>
          <Button variant="ghost" onClick={() => finish('')}>
            Skip reflection
          </Button>
        </>
      }
    >
      <p className="field-hint">Pick a suggestion or write your own. This isn't a quiz and nothing is scored.</p>
      <div className="stack">
        {REFLECTION_SUGGESTIONS.map((s) => (
          <Choice key={s} selected={text === s} onClick={() => setText(s)}>
            {s}
          </Choice>
        ))}
      </div>
      <label htmlFor="refl" className="sr-only">
        Your question
      </label>
      <textarea id="refl" className="input textarea" rows={3} maxLength={240} placeholder="Write your own question…" value={text} onChange={(e) => setText(e.target.value)} />
      <div className="card card-takeaway">
        <p className="eyebrow">Takeaway</p>
        <ContentLabel status={TAKEAWAY.status} />
        <p>{TAKEAWAY.text}</p>
      </div>
    </Screen>
  );
}

// 13. Keep or take clinician questions
export function KeepQuestions() {
  const { state, dispatch } = useJourney();
  const [copied, setCopied] = useState(false);
  const saved = state.journal.includes(state.reflection);
  const fileText = `My questions for a clinician\n\n- ${state.reflection}\n\nPrepared with HAYAT QUEST (prototype demo). Educational only — not medical advice.\n`;

  return (
    <Screen
      eyebrow="Your question"
      title="Keep it, take it, or leave it"
      footer={<Button onClick={() => dispatch(backToScene)}>{saved ? 'Back to the cavern' : 'Continue without saving'}</Button>}
    >
      <blockquote className="quote">{state.reflection}</blockquote>
      <div className="stack">
        <button
          className={`action-row ${saved ? 'is-done' : ''}`}
          disabled={saved}
          onClick={() => dispatch({ type: 'patch', patch: { journal: [...state.journal, state.reflection] } })}
        >
          <span className="action-title">{saved ? '✓ Saved to your insight journal' : 'Save to my insight journal'}</span>
          <span className="action-hint">Only if you choose. Separate from chat history and personalisation.</span>
        </button>
        <button
          className="action-row"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(fileText);
              setCopied(true);
            } catch {
              setCopied(false);
            }
          }}
        >
          <span className="action-title">{copied ? '✓ Copied' : 'Copy'}</span>
          <span className="action-hint">Copies to your clipboard. Nothing is sent to a server.</span>
        </button>
        <button
          className="action-row"
          onClick={() => {
            const url = URL.createObjectURL(new Blob([fileText], { type: 'text/plain' }));
            const a = document.createElement('a');
            a.href = url;
            a.download = 'clinician-questions.txt';
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          <span className="action-title">Download</span>
          <span className="action-hint">Saves a small text file to your device.</span>
        </button>
      </div>
    </Screen>
  );
}

// 14. Emirate and sample care options (D-021, D-022)
export function Care() {
  const { state, dispatch } = useJourney();
  const [emirate, setEmirate] = useState(state.profile.emirate ?? '');
  const [compare, setCompare] = useState<string[]>([]);
  const examples = emirate ? careExamplesFor(emirate) : [];
  const finish = () => {
    dispatch({ type: 'patch', patch: { careVisited: true, step: 'scene' } });
    dispatch({ type: 'milestone', id: 'care-navigator', points: MILESTONES['care-navigator'].points });
  };
  const toggle = (id: string) => setCompare((c) => (c.includes(id) ? c.filter((x) => x !== id) : c.length < 2 ? [...c, id] : [c[1], id]));
  const compared = examples.filter((e) => compare.includes(e.id));

  return (
    <Screen
      eyebrow="Find qualified care"
      title="Explore sample care options"
      footer={<Button onClick={finish}>Done — back to the cavern</Button>}
    >
      <DemoBadge>Demo examples — not real clinics</DemoBadge>
      <label className="field">
        <span className="legend">Emirate</span>
        <select className="select" value={emirate} onChange={(e) => (setEmirate(e.target.value), setCompare([]))}>
          <option value="">No location — show checklist only</option>
          {EMIRATES.map((e) => (
            <option key={e}>{e}</option>
          ))}
        </select>
      </label>

      {examples.length > 0 && (
        <>
          <p className="field-hint">Choose two to compare side by side.</p>
          <div className="stack">
            {examples.map((c) => (
              <article key={c.id} className={`care-card ${compare.includes(c.id) ? 'is-selected' : ''}`}>
                <div className="care-head">
                  <h3>{c.name}</h3>
                  <span className="badge badge-demo">Fictional</span>
                </div>
                <dl className="care-facts">
                  <dt>Setting</dt>
                  <dd>{c.setting}</dd>
                  <dt>Languages</dt>
                  <dd>{c.languages}</dd>
                  <dt>Hours</dt>
                  <dd>{c.hours}</dd>
                </dl>
                <button className="link-btn" aria-pressed={compare.includes(c.id)} onClick={() => toggle(c.id)}>
                  {compare.includes(c.id) ? '✓ Comparing' : 'Compare'}
                </button>
              </article>
            ))}
          </div>
          {compared.length === 2 && (
            <table className="compare">
              <thead>
                <tr>
                  <th />
                  {compared.map((c) => (
                    <th key={c.id}>{c.name.split(' · ')[0]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(['setting', 'languages', 'hours', 'partnerFriendly'] as const).map((k) => (
                  <tr key={k}>
                    <th>{{ setting: 'Setting', languages: 'Languages', hours: 'Hours', partnerFriendly: 'Partner' }[k]}</th>
                    {compared.map((c) => (
                      <td key={c.id}>{c[k]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      <div className="card card-soft">
        <p className="eyebrow">What to verify with a real provider</p>
        <ContentLabel status={VERIFY_CHECKLIST.status} />
        <ul className="checklist">
          {VERIFY_CHECKLIST.items.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
      </div>
      <p className="muted small">HAYAT QUEST doesn't book appointments or endorse providers.</p>
    </Screen>
  );
}

// 15. End-of-journey reflection
export function EndCheck() {
  const { state, dispatch } = useJourney();
  const finish = () => {
    dispatch({ type: 'go', step: 'summary' });
    dispatch({ type: 'milestone', id: 'journey-complete', points: MILESTONES['journey-complete'].points });
  };
  return (
    <Screen
      eyebrow="Closing check-in · optional"
      title="How do you feel now?"
      footer={
        <>
          <Button onClick={finish}>See my journey</Button>
          <Button variant="ghost" onClick={() => (dispatch({ type: 'patch', patch: { end: {} } }), finish())}>
            Skip check-in
          </Button>
        </>
      }
    >
      <p className="field-hint">The same three questions as at the start. Linked only to your random pilot ID.</p>
      <RatingBlock ratings={state.end} onChange={(end) => dispatch({ type: 'patch', patch: { end } })} />
    </Screen>
  );
}

export function Summary() {
  const { state, dispatch } = useJourney();
  const fmt = (r?: Rating) => (r === undefined ? '—' : r === 'na' ? 'n/a' : String(r));
  const anyRatings = Object.keys(state.baseline).length + Object.keys(state.end).length > 0;
  return (
    <Screen
      title="Journey complete"
      footer={
        <>
          <Button onClick={() => dispatch(backToScene)}>Back to the cavern</Button>
          <Button variant="ghost" onClick={() => dispatch({ type: 'reset' })}>
            Exit and clear session
          </Button>
        </>
      }
    >
      <p className="lead">You explored what an assessment may involve, prepared a question, and looked at how to choose care.</p>
      <ul className="done-list">
        <li>✓ Understood the journey ahead</li>
        <li>✓ {state.reflection ? 'Prepared a clinician question' : 'Considered what to ask a clinician'}</li>
        <li>✓ Explored sample care options</li>
      </ul>
      {state.showRewards && (
        <div className="badges" aria-label="Milestones">
          {state.milestones.map((m) => (
            <span key={m} className="badge-chip">
              ✦ {MILESTONES[m].label}
            </span>
          ))}
        </div>
      )}
      {anyRatings && (
        <div className="card card-soft">
          <p className="eyebrow">Your check-ins · pilot ID {state.pilotId}</p>
          <table className="compare">
            <thead>
              <tr>
                <th />
                <th>Before</th>
                <th>After</th>
              </tr>
            </thead>
            <tbody>
              {RATING_QUESTIONS.map((q) => (
                <tr key={q.key}>
                  <th>{{ confidence: 'Confidence', nextStep: 'Next step clear', readiness: 'Readiness' }[q.key]}</th>
                  <td>{fmt(state.baseline[q.key])}</td>
                  <td>{fmt(state.end[q.key])}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="muted small">Prototype signals only — not evidence of clinical impact.</p>
        </div>
      )}
      <p className="muted small">There's no pressure to book or test. Come back to your journal any time in this session.</p>
    </Screen>
  );
}
