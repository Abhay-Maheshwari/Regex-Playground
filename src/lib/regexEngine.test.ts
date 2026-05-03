import { describe, it, expect } from 'vitest';
import { executeRegex, executeReplace } from './regexEngine';

describe('executeRegex', () => {
  it('1. Basic match', () => {
    const result = executeRegex('hello', '', 'hello world');
    expect(result.error).toBeNull();
    expect(result.matches).toHaveLength(1);
    expect(result.matches[0].value).toBe('hello');
    expect(result.matches[0].index).toBe(0);
    expect(result.matches[0].length).toBe(5);
  });

  it('2. No match', () => {
    const result = executeRegex('xyz', '', 'hello world');
    expect(result.error).toBeNull();
    expect(result.matches).toHaveLength(0);
  });

  it('3. Global flag', () => {
    const result = executeRegex('\\d+', 'g', 'abc 123 def 456');
    expect(result.error).toBeNull();
    expect(result.matches).toHaveLength(2);
    expect(result.matches[0].value).toBe('123');
    expect(result.matches[1].value).toBe('456');
  });

  it('4. Case-insensitive', () => {
    const result = executeRegex('hello', 'gi', 'Hello HELLO hello');
    expect(result.error).toBeNull();
    expect(result.matches).toHaveLength(3);
    expect(result.matches.map(m => m.value)).toEqual(['Hello', 'HELLO', 'hello']);
  });

  it('5. Named groups', () => {
    const result = executeRegex('(?<year>\\d{4})-(?<month>\\d{2})', '', '2026-05');
    expect(result.error).toBeNull();
    expect(result.matches).toHaveLength(1);
    expect(result.matches[0].groups).toEqual({ year: '2026', month: '05' });
  });

  it('6. Invalid pattern', () => {
    const result = executeRegex('(unclosed', '', 'test');
    expect(result.error).not.toBeNull();
    expect(result.matches).toHaveLength(0);
  });

  it('7. Empty string input', () => {
    const result = executeRegex('.*', '', '');
    expect(result.error).toBeNull();
    expect(result.matches).toHaveLength(1);
    expect(result.matches[0].value).toBe('');
  });

  it('8. Multiline flag', () => {
    const result = executeRegex('^line', 'gm', 'line1\nline2\nline3');
    expect(result.error).toBeNull();
    expect(result.matches).toHaveLength(3);
  });

  it('9. Zero-length match guard', () => {
    const result = executeRegex('(?:)', 'g', 'abc');
    expect(result.error).toBeNull();
    expect(result.matches.length).toBeGreaterThan(0);
  });

  describe('executeReplace', () => {
    it('10. Basic replace', () => {
      const result = executeReplace('world', '', 'hello world', 'there');
      expect(result.error).toBeNull();
      expect(result.result).toBe('hello there');
    });

    it('11. Global replace', () => {
      const result = executeReplace('a', 'g', 'banana', 'o');
      expect(result.error).toBeNull();
      expect(result.result).toBe('bonono');
    });
  });
});
