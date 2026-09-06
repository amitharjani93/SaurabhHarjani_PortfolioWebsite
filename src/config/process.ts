/**
 * The engagement sequence shown on the home page and the profile page.
 * Wording is deliberately free of outcome promises.
 */

export interface ProcessStep {
  numeral: string;
  title: string;
  body: string;
}

export const processSteps: ProcessStep[] = [
  {
    numeral: '01',
    title: 'Understand',
    body: 'The first conversation is about the facts — what happened, in what order, and what exists in writing. Nothing is advised on until the sequence is clear.',
  },
  {
    numeral: '02',
    title: 'Assess',
    body: 'Documents are read against the position you want to reach. That produces an honest view of the strengths, the gaps and what it would take to close them.',
  },
  {
    numeral: '03',
    title: 'Advise',
    body: 'You are given the realistic options with their cost, time and consequence set out — including the option of doing nothing, where that is the better course.',
  },
  {
    numeral: '04',
    title: 'Act',
    body: 'Once you decide, the work is carried out and you are kept informed as it moves. No step is taken on your behalf without your instruction.',
  },
];
