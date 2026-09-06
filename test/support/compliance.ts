/**
 * Advertising-compliance vocabulary.
 *
 * The Bar Council of India restricts advocates from soliciting work or
 * advertising. The design of this site already avoids testimonials, rankings
 * and claims; this list is the automated guard that keeps it that way as copy
 * is edited by people who are not thinking about the rules at the time.
 *
 * ⚖️ This is a developer-side safety net, not legal advice. Final wording is
 *    still the advocate's responsibility.
 */

export interface ProhibitedPattern {
  /** Why the phrase is a problem, shown when a test fails. */
  reason: string;
  pattern: RegExp;
}

export const prohibitedCopy: ProhibitedPattern[] = [
  { reason: 'superlative / comparative claim', pattern: /\bbest (lawyer|advocate|law firm|legal)\b/i },
  { reason: 'ranking claim', pattern: /\b(no\.?|number)\s*1\b(?![\d)])/i },
  { reason: 'ranking claim', pattern: /\b(top|leading|#1|premier|renowned|award[- ]winning)\s+(lawyer|advocate|firm|practice)\b/i },
  // Matched as whole affirmative phrases. A bare /guarantee/ would fire on
  // honest copy such as "a search will not guarantee registration".
  { reason: 'guarantee of outcome', pattern: /\b(we|i|the practice|the firm)\s+guarantee\b/i },
  { reason: 'guarantee of outcome', pattern: /\bguaranteed\s+(results?|outcomes?|success|win|victory|relief|registration|approval)\b/i },
  { reason: 'guarantee of outcome', pattern: /\b(results?|outcomes?|success)\s+(are|is)\s+guaranteed\b/i },
  { reason: 'guarantee of outcome', pattern: /\b(money[- ]back|satisfaction|100%)\s+guarantee\b/i },
  { reason: 'guarantee of outcome', pattern: /\bassured\s+(results?|outcomes?|success)\b/i },
  { reason: 'success-rate claim', pattern: /\b(success|win)\s*rate\b/i },
  { reason: 'success-rate claim', pattern: /\b\d{1,3}\s?%\s*(success|win|favourable|favorable)/i },
  { reason: 'case-count claim', pattern: /\b(thousands?|hundreds?|\d[\d,]*)\s+(of\s+)?cases\s+(won|handled|resolved)\b/i },
  { reason: 'client-count claim', pattern: /\b(\d[\d,]*|thousands?|hundreds?)\+?\s+(happy\s+)?clients\b/i },
  { reason: 'testimonial', pattern: /\b(testimonial|what our clients say|client reviews?)\b/i },
  { reason: 'star rating', pattern: /\b\d(\.\d)?\s*\/\s*5\b|\b\d(\.\d)?\s*star(s)?\b/i },
  { reason: 'urgency / manipulative conversion tactic', pattern: /\b(book now|hurry|limited (slots|time|offer)|slots? (are )?running out|act fast|only \d+ left)\b/i },
  { reason: 'discounting / fee solicitation', pattern: /\b(discount|free consultation|no win,? no fee|lowest (fees|price)|affordable rates)\b/i },
  { reason: 'unsupported experience claim', pattern: /\b\d{1,2}\+?\s*years?\s+of\s+(experience|practice)\b/i },
  { reason: 'solicitation', pattern: /\b(hire (me|us) (now|today)|call now|contact us today for)\b/i },
];

/** Generic AI filler the copy is meant to be free of. */
export const bannedFiller: ProhibitedPattern[] = [
  { reason: 'AI filler phrase', pattern: /in today'?s (ever[- ]changing|fast[- ]paced|complex) (legal )?landscape/i },
  { reason: 'AI filler phrase', pattern: /\bwe pride ourselves on\b/i },
  { reason: 'AI filler phrase', pattern: /\byour trusted (partner|advisor|ally)\b/i },
  { reason: 'AI filler phrase', pattern: /\bnavigating the complexit(y|ies)\b/i },
  { reason: 'AI filler phrase', pattern: /\bcommitted to excellence\b/i },
  { reason: 'AI filler phrase', pattern: /\bone[- ]stop (shop|solution)\b/i },
  { reason: 'AI filler phrase', pattern: /\btailored solutions\b/i },
];

export interface CopyViolation {
  source: string;
  reason: string;
  excerpt: string;
}

/** Returns every prohibited phrase found in `text`, with surrounding context. */
export function findViolations(
  text: string,
  source: string,
  patterns: ProhibitedPattern[] = [...prohibitedCopy, ...bannedFiller],
): CopyViolation[] {
  const violations: CopyViolation[] = [];

  for (const { pattern, reason } of patterns) {
    const match = pattern.exec(text);
    if (!match) continue;
    const start = Math.max(0, match.index - 50);
    violations.push({
      source,
      reason,
      excerpt: `…${text.slice(start, match.index + match[0].length + 50).replace(/\s+/g, ' ')}…`,
    });
  }

  return violations;
}
