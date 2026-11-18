import { useState } from 'react';
import { useJourney, Screen, Button, Choice, Toggle, DemoBadge } from '../ui';
import { EMIRATES, PILOT_SUMMARY, RATING_QUESTIONS } from '../content';
import type { AgeBand, Avatar, Language, LifeStage, Rating, Ratings } from '../state';
import { AvatarPreview } from '../scene/AvatarPreview';
import { AVATAR_STARTERS, SHIRT_COLOURS } from '../scene/avatars';
import { getAuthProvider } from '../auth/provider';

// 1. Welcome and purpose
export function Welcome() {
  const { dispatch } = useJourney();
  return (
    <Screen
      footer={
        <>
          <Button onClick={() => dispatch({ type: 'go', step: 'signin' })}>Continue</Button>
          <p className="muted small center">An account is required to take part in the pilot.</p>
        </>
      }
    >
      <div className="hero">
        <div className="hero-art" aria-hidden="true">
          <AvatarPreview avatar={AVATAR_STARTERS[0]} size={120} glow />
        </div>
        <h1 className="hero-title">HAYAT QUEST</h1>
        <p className="hero-tag">Discover your health. Understand your body. Take control.</p>
      </div>
      <p className="lead">Learn about male fertility assessment and prepare questions for a clinician, at your own pace.</p>
      <div className="card card-soft">
        <p className="small">
          This is an educational experience. It does not diagnose, and it is not a substitute for clinical care.
        </p>
      </div>
      <details className="details">
        <summary>How this works</summary>
        <ol className="plain-list numbered">
          <li>Sign in and choose what you're comfortable sharing.</li>
          <li>Explore a calm, guided scene and pick what you'd like to learn.</li>
          <li>Prepare questions for a clinician and explore sample care options.</li>
        </ol>
      </details>
      <details className="details">
        <summary>Pilot privacy notice (summary)</summary>
        <p className="muted small">Draft — not the final participant notice.</p>
        <ul className="plain-list">
          {PILOT_SUMMARY.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </details>
    </Screen>
  );
}

// 2. Sign-in after summary notice (mock — D-042)
export function SignIn() {
  const { dispatch } = useJourney();
  const auth = getAuthProvider();
  return (
    <Screen
      eyebrow="Step 1 of 4 · Account"
      title="Sign in to continue"
      footer={
        <>
          <Button onClick={() => auth.signIn().then(() => dispatch({ type: 'go', step: 'consent' }))}>
            {auth.isReal ? 'Sign in' : 'Continue with demo account'}
          </Button>
          <Button variant="ghost" onClick={() => dispatch({ type: 'go', step: 'welcome' })}>
            Back
          </Button>
        </>
      }
    >
      {auth.isReal ? <span className="badge badge-reviewed">{auth.label}</span> : <DemoBadge>{auth.label}</DemoBadge>}
      <p>
        In the pilot, sign-in happens on a secure page run by the identity provider. HAYAT QUEST never sees or stores your password.
      </p>
      <div className="mock-idp" aria-hidden="true">
        <div className="mock-idp-head">Identity provider (placeholder)</div>
        <div className="mock-field">Email</div>
        <div className="mock-field">Password</div>
        <div className="mock-idp-links">
          <span>Create account</span>
          <span>Forgot password?</span>
        </div>
      </div>
      <p className="muted small">
        Signing in creates an account <strong>before</strong> you give full consent. If you decline on the next screen, the new account is deleted
        straight away.
      </p>
    </Screen>
  );
}

// 3. Full pilot notice and consent
export function Consent() {
  const { dispatch } = useJourney();
  const [read, setRead] = useState(false);
  return (
    <Screen
      eyebrow="Step 2 of 4 · Consent"
      title="Before we begin"
      footer={
        <>
          <Button disabled={!read} onClick={() => dispatch({ type: 'go', step: 'profile' })}>
            I agree to take part
          </Button>
          <Button variant="secondary" onClick={() => dispatch({ type: 'go', step: 'declined' })}>
            Decline
          </Button>
        </>
      }
    >
      <DemoBadge>Draft notice — pending privacy and ethics review</DemoBadge>
      <div className="notice">
        <h3>What this pilot is</h3>
        <p>A limited usability pilot of a fertility-education prototype. It tests whether the experience is clear and easy to use. It is not a clinical study.</p>
        <h3>What you'll do</h3>
        <p>Follow a guided journey, read short explanations, use sample questions, and look at fictional care listings. Ratings before and after are optional.</p>
        <h3>Your information</h3>
        <p>
          We'd ask for an age band and preferred language; emirate is optional. Chat history is off by default. Ratings are linked to a random pilot
          ID, not your account, and are deleted after analysis.
        </p>
        <h3>Risks and limits</h3>
        <p>Fertility topics can feel personal. The prototype is not medical care and may be wrong. Please don't enter personal health details.</p>
        <h3>Your choice</h3>
        <p>Taking part is voluntary. You can withdraw and delete your account at any time.</p>
        <p className="muted small">Sponsor, contacts, data locations and retention periods will be added after technical and privacy review.</p>
      </div>
      <label className="check">
        <input type="checkbox" checked={read} onChange={(e) => setRead(e.target.checked)} />
        <span>I have read and understood the pilot notice.</span>
      </label>
    </Screen>
  );
}

export function Declined() {
  const { dispatch } = useJourney();
  return (
    <Screen title="Thanks for considering it" footer={<Button onClick={() => dispatch({ type: 'reset' })}>Back to start</Button>}>
      <DemoBadge>Demo — no account existed</DemoBadge>
      <p>You've declined, so we haven't collected any profile or pilot information.</p>
      <p>In the pilot, deletion of the account you just created would start immediately.</p>
    </Screen>
  );
}

const AGE_BANDS: AgeBand[] = ['25-29', '30-34', '35-39', '40-45'];

// 4. Basic profile and optional data choices
export function Profile() {
  const { state, dispatch } = useJourney();
  const { profile, optIns } = state;
  const setProfile = (p: Partial<typeof profile>) => dispatch({ type: 'patch', patch: { profile: { ...profile, ...p } } });
  const setOpt = (o: Partial<typeof optIns>) => dispatch({ type: 'patch', patch: { optIns: { ...optIns, ...o } } });
  const ready = !!profile.ageBand && !!profile.language;

  return (
    <Screen
      eyebrow="Step 3 of 4 · Profile"
      title="A little about you"
      footer={
        <>
          <Button disabled={!ready} onClick={() => dispatch({ type: 'go', step: 'avatar' })}>
            Continue
          </Button>
          {!ready && <p className="muted small center">Choose an age band and language to continue.</p>}
        </>
      }
    >
      <fieldset className="field">
        <legend>
          Age band <span className="req">required</span>
        </legend>
        <p className="field-hint">Used only to tailor general explanations. Never used for diagnosis or risk scoring.</p>
        <div className="chips">
          {AGE_BANDS.map((b) => (
            <Choice key={b} selected={profile.ageBand === b} onClick={() => setProfile({ ageBand: b })}>
              {b.replace('-', '–')}
            </Choice>
          ))}
        </div>
      </fieldset>

      <fieldset className="field">
        <legend>
          Preferred language <span className="req">required</span>
        </legend>
        <p className="field-hint">This first version is in English. Your choice helps us plan Arabic support.</p>
        <div className="chips">
          {(
            [
              ['en', 'English'],
              ['ar', 'العربية · Arabic'],
            ] as [Language, string][]
          ).map(([v, l]) => (
            <Choice key={v} selected={profile.language === v} onClick={() => setProfile({ language: v })}>
              {l}
            </Choice>
          ))}
        </div>
      </fieldset>

      <fieldset className="field">
        <legend>
          Emirate <span className="opt">optional</span>
        </legend>
        <p className="field-hint">Only used to filter sample care examples later.</p>
        <select className="select" value={profile.emirate ?? ''} onChange={(e) => setProfile({ emirate: e.target.value || undefined })}>
          <option value="">Prefer not to say</option>
          {EMIRATES.map((e) => (
            <option key={e}>{e}</option>
          ))}
        </select>
      </fieldset>

      <fieldset className="field">
        <legend>Optional data choices</legend>
        <p className="field-hint">All off by default. You can change them later.</p>
        <Toggle
          label="Save conversation history"
          hint="Keep your questions and answers in your account."
          checked={optIns.saveHistory}
          onChange={(v) => setOpt({ saveHistory: v, personalizeFromHistory: v ? optIns.personalizeFromHistory : false })}
        />
        <Toggle
          label="Personalise from saved history"
          hint={optIns.saveHistory ? 'Use saved history to tailor future answers.' : 'Needs saved history to be on first.'}
          checked={optIns.personalizeFromHistory}
          disabled={!optIns.saveHistory}
          onChange={(v) => setOpt({ personalizeFromHistory: v })}
        />
        <Toggle
          label="Remember my starting point"
          hint="Keep your 'planning ahead / currently trying' answer with your profile."
          checked={optIns.retainLifeStage}
          onChange={(v) => setOpt({ retainLifeStage: v })}
        />
        <p className="muted small">In this demo these switches show the design only; nothing is stored either way.</p>
      </fieldset>
    </Screen>
  );
}

// 5. Choose an avatar
export function AvatarPicker() {
  const { state, dispatch } = useJourney();
  const [sel, setSel] = useState<Avatar>(state.avatar ?? AVATAR_STARTERS[0]);
  const next = (avatar: Avatar | null) => dispatch({ type: 'patch', patch: { avatar, step: 'stage' } });

  return (
    <Screen
      eyebrow="Step 4 of 4 · Avatar"
      title="Choose your explorer"
      footer={
        <>
          <Button onClick={() => next(sel)}>Use this explorer</Button>
          <Button variant="ghost" onClick={() => next(null)}>
            Skip — use a default
          </Button>
        </>
      }
    >
      <div className="avatar-stage">
        <AvatarPreview avatar={sel} size={150} glow />
      </div>
      <p className="field-hint center">Your explorer is just for fun. It has no effect on the information you see.</p>
      <div className="avatar-grid" role="radiogroup" aria-label="Starter explorers">
        {AVATAR_STARTERS.map((a, i) => (
          <button
            key={a.id}
            role="radio"
            aria-checked={sel.id === a.id}
            aria-label={`Explorer ${i + 1}`}
            className={`avatar-tile ${sel.id === a.id ? 'is-selected' : ''}`}
            onClick={() => setSel({ ...a, shirt: sel.id === a.id ? sel.shirt : a.shirt })}
          >
            <AvatarPreview avatar={sel.id === a.id ? sel : a} size={64} />
          </button>
        ))}
      </div>
      <fieldset className="field">
        <legend>
          Outfit colour <span className="opt">optional</span>
        </legend>
        <div className="swatches">
          {SHIRT_COLOURS.map((c) => (
            <button
              key={c}
              className={`swatch ${sel.shirt === c ? 'is-selected' : ''}`}
              style={{ background: c }}
              aria-label={`Outfit colour ${c}`}
              aria-pressed={sel.shirt === c}
              onClick={() => setSel({ ...sel, shirt: c })}
            />
          ))}
        </div>
      </fieldset>
    </Screen>
  );
}

// 6. Choose a starting point
export function StartingPoint() {
  const { state, dispatch } = useJourney();
  const set = (lifeStage: LifeStage | null) => dispatch({ type: 'patch', patch: { lifeStage, step: 'baseline' } });
  const options: [LifeStage, string, string][] = [
    ['planning', 'Planning ahead', 'Thinking about the future'],
    ['trying', 'Currently trying to conceive', 'Already on the journey'],
    ['basics', 'Prefer not to say', 'Just show me the basics'],
  ];
  return (
    <Screen eyebrow="Your journey" title="Where are you starting from?" footer={<Button variant="ghost" onClick={() => set(null)}>Skip</Button>}>
      <p className="field-hint">
        This only changes the wording and suggested questions you see. It is not a risk check.
        {state.optIns.retainLifeStage ? ' You chose to remember it with your profile.' : ' It is forgotten when this session ends.'}
      </p>
      <div className="stack">
        {options.map(([v, label, hint]) => (
          <Choice key={v} selected={state.lifeStage === v} onClick={() => set(v)} hint={hint}>
            {label}
          </Choice>
        ))}
      </div>
    </Screen>
  );
}

export function RatingBlock({ ratings, onChange }: { ratings: Ratings; onChange: (r: Ratings) => void }) {
  return (
    <div className="stack">
      {RATING_QUESTIONS.map((q) => (
        <fieldset key={q.key} className="field rating">
          <legend>{q.text}</legend>
          <div className="scale" role="radiogroup">
            {([1, 2, 3, 4, 5] as Rating[]).map((n) => (
              <button
                key={String(n)}
                role="radio"
                aria-checked={ratings[q.key] === n}
                className={`scale-btn ${ratings[q.key] === n ? 'is-selected' : ''}`}
                onClick={() => onChange({ ...ratings, [q.key]: n })}
              >
                {n}
              </button>
            ))}
          </div>
          <div className="scale-ends">
            <span>Not at all</span>
            <span>Very</span>
          </div>
          <button
            className={`link-btn ${ratings[q.key] === 'na' ? 'is-selected' : ''}`}
            aria-pressed={ratings[q.key] === 'na'}
            onClick={() => onChange({ ...ratings, [q.key]: 'na' })}
          >
            Prefer not to answer
          </button>
        </fieldset>
      ))}
    </div>
  );
}

// 7. Baseline check-in
export function Baseline() {
  const { state, dispatch } = useJourney();
  return (
    <Screen
      eyebrow="Quick check-in · optional"
      title="How do you feel right now?"
      footer={
        <>
          <Button onClick={() => dispatch({ type: 'go', step: 'scene' })}>Enter the journey</Button>
          <Button variant="ghost" onClick={() => dispatch({ type: 'patch', patch: { baseline: {}, step: 'scene' } })}>
            Skip check-in
          </Button>
        </>
      }
    >
      <p className="field-hint">
        These are reflections, not a test. They're linked only to a random pilot ID (<code>{state.pilotId}</code>), never to your account.
      </p>
      <RatingBlock ratings={state.baseline} onChange={(baseline) => dispatch({ type: 'patch', patch: { baseline } })} />
    </Screen>
  );
}
