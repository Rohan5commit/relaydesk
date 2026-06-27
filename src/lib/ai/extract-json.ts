/**
 * Robustly extract JSON from LLM responses.
 *
 * LLMs often wrap JSON in markdown fences (```json ... ```) or prepend/append
 * commentary. This function handles all common patterns:
 *   1. Strip markdown code fences, parse the whole string
 *   2. Greedy regex for the outermost { ... } or [ ... ]
 *   3. Find the first { and match to the last } (handles nested objects/arrays)
 */
export function extractJson<T>(content: string): T {
  if (!content || !content.trim()) {
    throw new Error("Empty content");
  }

  // 1. Strip markdown code fences
  const fenceMatch = content.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  const stripped = fenceMatch ? fenceMatch[1].trim() : content.trim();

  // 2. Try parsing the whole stripped content
  try {
    return JSON.parse(stripped) as T;
  } catch {
    // continue
  }

  // 3. Find outermost { ... } or [ ... ]
  //    Walk from first { to last } (greedy) so nested arrays survive
  const curlyStart = stripped.indexOf("{");
  const curlyEnd = stripped.lastIndexOf("}");
  if (curlyStart !== -1 && curlyEnd > curlyStart) {
    try {
      return JSON.parse(stripped.substring(curlyStart, curlyEnd + 1)) as T;
    } catch {
      // continue
    }
  }

  const bracketStart = stripped.indexOf("[");
  const bracketEnd = stripped.lastIndexOf("]");
  if (bracketStart !== -1 && bracketEnd > bracketStart) {
    try {
      return JSON.parse(stripped.substring(bracketStart, bracketEnd + 1)) as T;
    } catch {
      // continue
    }
  }

  throw new Error(
    `No valid JSON found in response (length=${content.length}): ${content.substring(0, 300)}`
  );
}
