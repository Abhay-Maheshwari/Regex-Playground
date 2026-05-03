export interface MatchResult {
  index: number;
  length: number;
  value: string;
  captures: string[];
  groups: Record<string, string> | null;
}

export interface MatchResponse {
  matches: MatchResult[];
  error: string | null;
}

export interface ReplaceResponse {
  result: string;
  error: string | null;
}

export function executeReplace(pattern: string, flags: string, testString: string, replaceString: string): ReplaceResponse {
  if (!pattern) return { result: testString, error: null };
  try {
    const regex = new RegExp(pattern, flags);
    return { result: testString.replace(regex, replaceString), error: null };
  } catch (e: any) {
    return { result: testString, error: e.message || 'Invalid regular expression' };
  }
}

export function executeRegex(pattern: string, flags: string, testString: string): MatchResponse {
  if (!pattern) {
    return { matches: [], error: null };
  }

  let regex: RegExp;
  try {
    regex = new RegExp(pattern, flags);
  } catch (e: any) {
    return { matches: [], error: e.message || 'Invalid regular expression' };
  }

  const matches: MatchResult[] = [];
  const isGlobal = regex.global;

  if (isGlobal) {
    // Prevent infinite loop for zero-length matches (e.g., /(?:)/g)
    let match: RegExpExecArray | null;
    let lastIndex = -1;

    while ((match = regex.exec(testString)) !== null) {
      if (regex.lastIndex === lastIndex) {
        // Zero-length match, manually advance lastIndex to avoid infinite loop
        regex.lastIndex++;
      }
      lastIndex = regex.lastIndex;

      matches.push({
        index: match.index,
        length: match[0].length,
        value: match[0],
        captures: match.slice(1),
        groups: match.groups ? { ...match.groups } : null,
      });

      // If we've reached the end and regex.lastIndex hasn't moved, break
      if (match[0].length === 0 && match.index === testString.length) {
        break;
      }
    }
  } else {
    const match = regex.exec(testString);
    if (match) {
      matches.push({
        index: match.index,
        length: match[0].length,
        value: match[0],
        captures: match.slice(1),
        groups: match.groups ? { ...match.groups } : null,
      });
    }
  }

  return { matches, error: null };
}
