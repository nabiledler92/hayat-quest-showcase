// All user-facing journey content for Slice 1.
//
// IMPORTANT: nothing here is clinician-reviewed (docs/03-content-and-clinical.md,
// D-017, D-020). Health-adjacent copy is deliberately non-clinical and every item
// is tagged `status: 'placeholder'` so the UI shows a "pending clinical review"
// label. Replace with approved content (with source IDs) once Q-004/Q-005 close.

export type ContentStatus = 'placeholder' | 'reviewed';

export interface Topic {
  id: string;
  title: string;
  blurb: string;
  prompts: { id: string; text: string }[];
}

export const TOPICS: Topic[] = [
  {
    id: 'basics',
    title: 'Fertility basics',
    blurb: 'A gentle starting point.',
    prompts: [
      { id: 'basics-1', text: 'Where do I even start learning about this?' },
      { id: 'basics-2', text: 'Is it normal to feel unsure about this topic?' },
    ],
  },
  {
    id: 'assessment',
    title: 'What a male fertility assessment may involve',
    blurb: 'Understand the process before you go.',
    prompts: [
      { id: 'assess-1', text: 'What might happen at a first appointment?' },
      { id: 'assess-2', text: 'Should my partner and I go together?' },
    ],
  },
  {
    id: 'prepare',
    title: 'Preparing to speak with a clinician',
    blurb: 'Get your questions ready.',
    prompts: [
      { id: 'prep-1', text: 'What questions could I ask a clinician?' },
      { id: 'prep-2', text: 'How do I bring this up comfortably?' },
    ],
  },
];

export interface ScriptedAnswer {
  status: ContentStatus;
  short: string;
  more: string;
  sourceTitle: string;
  nextStep: string;
}

// One scripted answer pattern per prompt. Non-clinical by design: these describe
// what the reviewed answer will cover, not the medical content itself.
const PLACEHOLDER_SOURCE = 'Source pending — clinician-reviewed library';

export const ANSWERS: Record<string, ScriptedAnswer> = {
  'basics-1': {
    status: 'placeholder',
    short: 'Good question — and you\'re already doing it. A clinician-reviewed overview of the basics will appear here, kept short and plain.',
    more: 'In the reviewed version, this card will give a brief, sourced introduction and link to deeper reading. It will not assess your situation.',
    sourceTitle: PLACEHOLDER_SOURCE,
    nextStep: 'Prepare a question for a clinician',
  },
  'basics-2': {
    status: 'placeholder',
    short: 'Many people find this topic hard to start. You can go at your own pace here — nothing is saved unless you choose.',
    more: 'The reviewed version will include clinician-approved wording about when and how to seek support.',
    sourceTitle: PLACEHOLDER_SOURCE,
    nextStep: 'Prepare a question for a clinician',
  },
  'assess-1': {
    status: 'placeholder',
    short: 'A clinician-reviewed description of what a first appointment may involve will appear here.',
    more: 'This answer is intentionally left as a placeholder. Process details, tests and terminology must be confirmed by a qualified UAE clinician before they are shown.',
    sourceTitle: PLACEHOLDER_SOURCE,
    nextStep: 'Prepare a question for a clinician',
  },
  'assess-2': {
    status: 'placeholder',
    short: 'Clinician-reviewed guidance on involving a partner will appear here.',
    more: 'Wording on how both partners are considered needs clinician review before it can be shown.',
    sourceTitle: PLACEHOLDER_SOURCE,
    nextStep: 'Prepare a question for a clinician',
  },
  'prep-1': {
    status: 'placeholder',
    short: 'Writing questions down before an appointment can make the conversation easier. Reviewed example questions will appear here.',
    more: 'You\'ll be able to save your own question to an insight journal (only if you choose) or copy/download it.',
    sourceTitle: PLACEHOLDER_SOURCE,
    nextStep: 'Prepare a question for a clinician',
  },
  'prep-2': {
    status: 'placeholder',
    short: 'Starting the conversation is often the hardest part. Reviewed conversation openers will appear here.',
    more: 'The reviewed version will offer a few respectful, plain-language ways to begin.',
    sourceTitle: PLACEHOLDER_SOURCE,
    nextStep: 'Prepare a question for a clinician',
  },
};

// Shown when someone types free text: live answers are off until review (D-020).
export const FREE_TEXT_BOUNDARY: ScriptedAnswer = {
  status: 'placeholder',
  short: 'Live answers are switched off in this demo. Once health content has been reviewed by a qualified clinician, the guide will answer questions like yours from that approved material only.',
  more: 'The guide will never diagnose, interpret test results or recommend treatment. If an approved source doesn\'t cover your question, it will say so and point you to qualified care.',
  sourceTitle: 'Demo boundary message',
  nextStep: 'Prepare a question for a clinician',
};

export const REFLECTION_SUGGESTIONS = [
  'What might a first appointment involve for me?',
  'Should my partner come along?',
  'What should I bring or prepare beforehand?',
];

export const TAKEAWAY: { status: ContentStatus; text: string } = {
  status: 'placeholder',
  text: 'Clinician-reviewed takeaway for this mission will appear here.',
};

export const EMIRATES = [
  'Abu Dhabi',
  'Dubai',
  'Sharjah',
  'Ajman',
  'Umm Al Quwain',
  'Ras Al Khaimah',
  'Fujairah',
];

// Fictional care examples (D-021, D-022). Not real clinics. No contact details,
// availability, endorsement, booking or outbound links.
export interface CareExample {
  id: string;
  name: string;
  setting: string;
  languages: string;
  hours: string;
  partnerFriendly: string;
}

export function careExamplesFor(emirate: string): CareExample[] {
  const tag = emirate.split(' ').map((w) => w[0]).join('');
  return [
    {
      id: `${tag}-a`,
      name: `Sample Clinic A · ${emirate}`,
      setting: 'Hospital outpatient clinic (sample)',
      languages: 'English, Arabic (sample)',
      hours: 'Weekday daytime (sample)',
      partnerFriendly: 'Partner may attend (sample)',
    },
    {
      id: `${tag}-b`,
      name: `Sample Centre B · ${emirate}`,
      setting: 'Specialist centre (sample)',
      languages: 'English, Arabic, Hindi (sample)',
      hours: 'Weekday + some evenings (sample)',
      partnerFriendly: 'Ask when booking (sample)',
    },
    {
      id: `${tag}-c`,
      name: `Sample Practice C · ${emirate}`,
      setting: 'Community practice (sample)',
      languages: 'English, Urdu (sample)',
      hours: 'Weekend availability (sample)',
      partnerFriendly: 'Partner may attend (sample)',
    },
  ];
}

// Needs clinician review before pilot (03-content-and-clinical.md, M2).
export const VERIFY_CHECKLIST: { status: ContentStatus; items: string[] } = {
  status: 'placeholder',
  items: [
    'Is the facility licensed by the relevant UAE health authority?',
    'Which languages can the consultation be held in?',
    'What does an initial appointment include, and what will it cost?',
    'Is your insurance accepted?',
    'Can your partner attend with you?',
    'How will your information be kept private?',
  ],
};

export const PILOT_SUMMARY = [
  'HAYAT QUEST is a prototype that helps you learn about male fertility assessment and prepare questions for a clinician.',
  'It is educational. It does not diagnose, treat, or interpret test results, and it is not a substitute for clinical care.',
  'Participation is voluntary. You can stop at any time.',
  'Please don\'t enter personal health details, medical records, test results, or anyone else\'s information.',
];

export const RATING_QUESTIONS: { key: 'confidence' | 'nextStep' | 'readiness'; text: string }[] = [
  { key: 'confidence', text: 'How confident do you feel about understanding what a male fertility assessment may involve?' },
  { key: 'nextStep', text: 'How clear is the next step available to you?' },
  { key: 'readiness', text: 'How ready do you feel to speak with a clinician?' },
];

export const MILESTONES: Record<string, { label: string; points: number }> = {
  'first-steps': { label: 'First steps', points: 10 },
  'mission-1': { label: 'Assessment explorer', points: 30 },
  'care-navigator': { label: 'Care navigator', points: 20 },
  'journey-complete': { label: 'Journey complete', points: 40 },
};
