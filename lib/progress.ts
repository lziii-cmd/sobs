import { questions, sections, type Question } from '../data/questions';

export type AnswerMap = Record<string, { value: string; flagged?: boolean }>;

export const isAnswered = (value: string | undefined): boolean =>
  typeof value === 'string' && value.trim().length > 0;

export type SectionProgress = {
  sectionId: string;
  number: string;
  title: string;
  total: number;
  answered: number;
  priorityTotal: number;
  priorityAnswered: number;
  flagged: number;
};

export function sectionProgress(answers: AnswerMap, sectionId: string): SectionProgress {
  const section = sections.find((s) => s.id === sectionId);
  const list: Question[] = questions.filter((q) => q.sectionId === sectionId);
  const answered = list.filter((q) => isAnswered(answers[q.id]?.value));
  const priority = list.filter((q) => q.priority);

  return {
    sectionId,
    number: section?.number ?? '',
    title: section?.title ?? '',
    total: list.length,
    answered: answered.length,
    priorityTotal: priority.length,
    priorityAnswered: priority.filter((q) => isAnswered(answers[q.id]?.value)).length,
    flagged: list.filter((q) => answers[q.id]?.flagged).length,
  };
}

export function allProgress(answers: AnswerMap): SectionProgress[] {
  return sections.map((s) => sectionProgress(answers, s.id));
}

export type GlobalProgress = {
  total: number;
  answered: number;
  percent: number;
  priorityTotal: number;
  priorityAnswered: number;
  priorityPercent: number;
  flagged: number;
};

export function globalProgress(answers: AnswerMap): GlobalProgress {
  const answered = questions.filter((q) => isAnswered(answers[q.id]?.value)).length;
  const priority = questions.filter((q) => q.priority);
  const priorityAnswered = priority.filter((q) => isAnswered(answers[q.id]?.value)).length;

  return {
    total: questions.length,
    answered,
    percent: questions.length === 0 ? 0 : Math.round((answered / questions.length) * 100),
    priorityTotal: priority.length,
    priorityAnswered,
    priorityPercent: priority.length === 0 ? 0 : Math.round((priorityAnswered / priority.length) * 100),
    flagged: questions.filter((q) => answers[q.id]?.flagged).length,
  };
}
