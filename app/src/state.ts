// Journey state. In-memory only (D-008, D-042): nothing here is written to
// browser storage or sent over the network. Reloading the page clears it.

export type Step =
  | 'welcome'
  | 'signin'
  | 'consent'
  | 'declined'
  | 'profile'
  | 'avatar'
  | 'stage'
  | 'baseline'
  | 'scene'
  | 'topics'
  | 'prompts'
  | 'answer'
  | 'reflection'
  | 'keep'
  | 'care'
  | 'endcheck'
  | 'summary';

export type AgeBand = '25-29' | '30-34' | '35-39' | '40-45';
export type Language = 'en' | 'ar';
export type LifeStage = 'planning' | 'trying' | 'basics';
export type Rating = 1 | 2 | 3 | 4 | 5 | 'na';
export type RatingKey = 'confidence' | 'nextStep' | 'readiness';
export type Ratings = Partial<Record<RatingKey, Rating>>;

export interface Avatar {
  id: string;
  skin: string;
  shirt: string;
  accent: string;
}

export interface State {
  step: Step;
  profile: { ageBand?: AgeBand; language?: Language; emirate?: string };
  optIns: { saveHistory: boolean; personalizeFromHistory: boolean; retainLifeStage: boolean };
  avatar: Avatar | null;
  lifeStage: LifeStage | null;
  pilotId: string; // random, never linked to an account (D-039)
  baseline: Ratings;
  end: Ratings;
  topicId: string | null;
  promptId: string | null;
  freeText: string | null;
  reflection: string;
  journal: string[]; // only filled after explicit opt-in (D-026)
  milestones: string[];
  points: number;
  showRewards: boolean;
  tutorialSeen: boolean;
  missionDone: boolean;
  careVisited: boolean;
  avatarPos: { x: number; y: number };
}

export const START_POS = { x: 5, y: 9 };

function randomPilotId(): string {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  return 'P-' + Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

export function initialState(): State {
  return {
    step: 'welcome',
    profile: {},
    optIns: { saveHistory: false, personalizeFromHistory: false, retainLifeStage: false },
    avatar: null,
    lifeStage: null,
    pilotId: randomPilotId(),
    baseline: {},
    end: {},
    topicId: null,
    promptId: null,
    freeText: null,
    reflection: '',
    journal: [],
    milestones: [],
    points: 0,
    showRewards: true,
    tutorialSeen: false,
    missionDone: false,
    careVisited: false,
    avatarPos: { ...START_POS },
  };
}

export type Action =
  | { type: 'go'; step: Step }
  | { type: 'patch'; patch: Partial<State> }
  | { type: 'milestone'; id: string; points: number }
  | { type: 'reset' };

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'go':
      return { ...state, step: action.step };
    case 'patch':
      return { ...state, ...action.patch };
    case 'milestone':
      if (state.milestones.includes(action.id)) return state;
      return { ...state, milestones: [...state.milestones, action.id], points: state.points + action.points };
    case 'reset':
      return initialState();
  }
}
