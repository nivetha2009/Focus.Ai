const J='Return ONLY valid JSON. No markdown fences, no commentary.';
export const CHAT_SYSTEM=(lvl)=>`You are Focus, a friendly study assistant for university students${lvl?` (level: ${lvl})`:''}. Explain clearly with examples, use short sections, and be honest when unsure. If study material is provided, base answers on it and say when something is not in it.`;
export const TOOLS={
 summarizer:o=>`Summarize the material with headings and bullet points, ending with 5 key takeaways. ${o.instructions}`,
 mcq:o=>`Create ${o.count} ${o.difficulty} multiple-choice questions with 4 options each. ${J} Format: [{"q":"","options":["","","",""],"answer":0,"explanation":""}] where answer is the 0-based index. ${o.instructions}`,
 flashcards:o=>`Create ${o.count} ${o.difficulty} flashcards. ${J} Format: [{"front":"","back":""}]. ${o.instructions}`,
 paper:o=>`Create a question paper with sections (short, 5-mark, 10-mark; ~${o.count} questions total, ${o.difficulty} difficulty), marks per question, then a brief answer key. ${o.instructions}`,
 notes:o=>`Write well-structured study notes with headings, definitions, bullet points and examples. ${o.instructions}`,
 beginner:o=>`Explain this like I'm a complete beginner: plain words, analogies, step by step. ${o.instructions}`,
 important:o=>`List the ${o.count} most likely exam questions (${o.difficulty}) grouped by 2, 5 and 10 marks, each with a short model answer. ${o.instructions}`,
 planner:o=>`Build a day-by-day revision plan for this material, prioritising hard/important topics, with review sessions and breaks. ${o.instructions}`
};
export const JSON_TOOLS=['mcq','flashcards'];
