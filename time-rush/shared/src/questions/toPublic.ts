import type { PublicQuestion, Question } from '../types/game';

/** Strips the correct answer and explanation before a question is sent to clients. */
export function toPublicQuestion(question: Question): PublicQuestion {
  const { id, topic, question: text, answers, difficulty } = question;
  return difficulty ? { id, topic, question: text, answers, difficulty } : { id, topic, question: text, answers };
}
