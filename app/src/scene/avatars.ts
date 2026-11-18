import type { Avatar } from '../state';

// Original block-style starters with a range of skin tones (storyboard §5).
// No nationality-coded costumes.
export const AVATAR_STARTERS: Avatar[] = [
  { id: 'a1', skin: '#e9bf98', shirt: '#2f8f83', accent: '#3a2a20' },
  { id: 'a2', skin: '#c98d62', shirt: '#c26b3c', accent: '#1f1a17' },
  { id: 'a3', skin: '#9a6440', shirt: '#4a6fb3', accent: '#141110' },
  { id: 'a4', skin: '#6a422b', shirt: '#7a5aa6', accent: '#0f0c0b' },
];

export const SHIRT_COLOURS = ['#2f8f83', '#c26b3c', '#4a6fb3', '#7a5aa6', '#b8434f', '#5d8a3a', '#d7a531', '#e6e1d6'];

export const DEFAULT_AVATAR = AVATAR_STARTERS[0];
