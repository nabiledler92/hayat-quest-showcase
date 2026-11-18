// Allow-listed synthetic prompts for the internal Presenter lab (D-043).
//
// The browser only ever sends a prompt ID. Free text never reaches the model,
// so participant health details cannot be sent to Foundry from the client.
// Every prompt here is non-clinical copy-editing of placeholder/fictional text.

export interface SyntheticPrompt {
  id: string;
  title: string;
  input: string;
  /** Canned output for AI_MODE=fixture. */
  fixture: string;
}

export const SYSTEM_INSTRUCTIONS = [
  'You are a copy-editing assistant for an internal, synthetic product demo called HAYAT QUEST.',
  'You only rewrite the short placeholder interface text you are given.',
  'Never give medical, health, fertility, diagnostic or treatment information or advice, even if asked.',
  'Never invent clinics, statistics or facts. Keep replies under 60 words, plain and respectful.',
].join(' ');

export const SYNTHETIC_PROMPTS: SyntheticPrompt[] = [
  {
    id: 'tone-welcome',
    title: 'Warm up the welcome line',
    input:
      'Rewrite this placeholder welcome line in a warmer, respectful tone for adults in the UAE. Return one sentence only: "Learn about male fertility assessment and prepare questions for a clinician."',
    fixture: 'Take a quiet moment to explore male fertility assessment, at your own pace, and get your questions ready for a clinician.',
  },
  {
    id: 'simplify-navigation',
    title: 'Simplify a navigation instruction',
    input:
      'Simplify this instruction for a first-time user. Return one short sentence: "Use the joystick to move your explorer close to a highlighted location, then press Activate to open its card."',
    fixture: 'Walk your explorer to a glowing spot, then tap Activate.',
  },
  {
    id: 'checklist-format',
    title: 'Describe two fictional listings neutrally',
    input:
      'Write one neutral comparison sentence (no recommendation) for these FICTIONAL sample listings: "Sample Clinic A — hospital outpatient clinic, weekday daytime" and "Sample Centre B — specialist centre, weekdays and some evenings".',
    fixture: 'Sample Clinic A is a hospital outpatient clinic open on weekdays, while Sample Centre B is a specialist centre that also offers some evening hours.',
  },
];

export function findPrompt(id: unknown): SyntheticPrompt | undefined {
  if (typeof id !== 'string') return undefined;
  return SYNTHETIC_PROMPTS.find((p) => p.id === id);
}
