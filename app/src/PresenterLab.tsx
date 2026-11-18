import { useState } from 'react';

// Internal Presenter lab (D-043). Not part of the participant journey.
// The browser sends only an allow-listed prompt ID; the server holds the
// prompt text. Results live only in this component's memory.

interface PromptInfo {
  id: string;
  title: string;
}
interface Listing {
  mode: 'fixture' | 'foundry';
  label: string;
  prompts: PromptInfo[];
}
interface Result {
  promptId: string;
  output: string;
  mode: string;
  label: string;
}

export function PresenterLab() {
  const [state, setState] = useState<'idle' | 'loading' | 'off' | 'ready'>('idle');
  const [listing, setListing] = useState<Listing | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  const open = async () => {
    setState('loading');
    try {
      const res = await fetch('/api/ai-demo/prompts');
      if (!res.ok) throw new Error();
      setListing(await res.json());
      setState('ready');
    } catch {
      setState('off');
    }
  };

  const run = async (id: string) => {
    setBusy(id);
    setError(null);
    try {
      const res = await fetch('/api/ai-demo', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ promptId: id }),
      });
      if (!res.ok) throw new Error(res.status === 429 ? 'Too many requests — try again in a minute.' : 'The AI demo is unavailable right now.');
      setResult(await res.json());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  if (state === 'idle')
    return (
      <button className="link-btn" onClick={open}>
        Open Presenter lab (internal)
      </button>
    );
  if (state === 'loading') return <p className="muted small">Checking the AI demo…</p>;
  if (state === 'off') return <p className="muted small">Presenter lab is switched off on this server.</p>;

  return (
    <div className="lab">
      <div className="lab-head">
        <span className="badge badge-demo">{listing!.label}</span>
        <span className="muted small">{listing!.mode === 'fixture' ? 'Offline fixture mode' : 'Live model · store: false'}</span>
      </div>
      <p className="muted small">Fixed synthetic prompts only: copy-editing of placeholder text. Nothing you type is sent.</p>
      <div className="stack">
        {listing!.prompts.map((p) => (
          <button key={p.id} className="prompt-chip" disabled={!!busy} onClick={() => run(p.id)}>
            {busy === p.id ? 'Running…' : p.title}
          </button>
        ))}
      </div>
      {error && <p className="small" style={{ color: 'var(--danger)' }}>{error}</p>}
      {result && (
        <article className="answer-card">
          <span className="badge badge-demo">{result.label}</span>
          <p className="answer-short">{result.output}</p>
          <span className="source-title">
            Prompt: {result.promptId} · mode: {result.mode}
          </span>
        </article>
      )}
    </div>
  );
}
