import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildMailtoUrl,
  formatInquiryAsText,
  getDeliveryMode,
  submitConsultation,
  validateInquiry,
  type ConsultationInquiry,
  type ConsultationTransport,
} from '../../src/services/consultation';

/**
 * The consultation service carries the site's only real integrity risk: a bug
 * here could tell a prospective client that their inquiry was sent when it was
 * not. The "never reports success without delivery" cases below are the reason
 * this suite exists.
 */

function inquiry(overrides: Partial<ConsultationInquiry> = {}): ConsultationInquiry {
  return {
    fullName: 'A. Client',
    email: 'client@example.com',
    phone: '',
    preferredContact: 'Email',
    practiceArea: 'Civil Matters & Dispute Resolution',
    preferredTime: 'No preference',
    message: 'A contract was breached last month and I need to know where I stand.',
    consent: true,
    ...overrides,
  };
}

const endpointTransport: ConsultationTransport = {
  endpoint: 'https://api.example.com/inquiries',
  email: 'advocate@example.com',
  subjectPrefix: 'Consultation inquiry — ',
};

const emailTransport: ConsultationTransport = {
  endpoint: '',
  email: 'advocate@example.com',
  subjectPrefix: 'Consultation inquiry — ',
};

const noTransport: ConsultationTransport = {
  endpoint: '',
  email: null,
  subjectPrefix: 'Consultation inquiry — ',
};

/**
 * An unqualified claim that the inquiry reached the advocate. Written as a
 * whole phrase rather than loose keywords, because "nothing has been sent yet"
 * must not trip it. No non-delivering code path may produce this.
 */
const AFFIRMATIVE_DELIVERY =
  /\byour (inquiry|enquiry|message|details) (has|have) been (received|sent|submitted|delivered)\b|\bthank you\b/i;

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

// ---------------------------------------------------------------- validation

describe('validateInquiry()', () => {
  it('accepts a complete inquiry', () => {
    expect(validateInquiry(inquiry())).toEqual({});
  });

  it('requires a name', () => {
    expect(validateInquiry(inquiry({ fullName: '   ' }))).toHaveProperty('fullName');
  });

  it('requires an email address', () => {
    expect(validateInquiry(inquiry({ email: '' }))).toHaveProperty('email');
  });

  it.each(['not-an-email', 'missing@domain', 'a@b.c d', '@example.com'])(
    'rejects the malformed address %s',
    (value) => {
      expect(validateInquiry(inquiry({ email: value }))).toHaveProperty('email');
    },
  );

  it('accepts an unusual but valid address', () => {
    expect(validateInquiry(inquiry({ email: 'first.last+tag@sub.example.co.in' }))).toEqual({});
  });

  it('accepts an empty phone number, because it is optional', () => {
    expect(validateInquiry(inquiry({ phone: '' }))).toEqual({});
  });

  it('rejects a phone number containing letters', () => {
    expect(validateInquiry(inquiry({ phone: 'call me' }))).toHaveProperty('phone');
  });

  it('accepts international phone formatting', () => {
    expect(validateInquiry(inquiry({ phone: '+91 98765 43210' }))).toEqual({});
  });

  it('requires a phone number when the client asks to be called', () => {
    const errors = validateInquiry(inquiry({ preferredContact: 'Phone', phone: '' }));
    expect(errors).toHaveProperty('phone');
  });

  it('requires a practice area', () => {
    expect(validateInquiry(inquiry({ practiceArea: '' }))).toHaveProperty('practiceArea');
  });

  it('requires a description of at least 20 characters', () => {
    expect(validateInquiry(inquiry({ message: 'Too short' }))).toHaveProperty('message');
  });

  it('rejects a description over 3,000 characters', () => {
    expect(validateInquiry(inquiry({ message: 'x'.repeat(3001) }))).toHaveProperty('message');
  });

  it('requires consent', () => {
    expect(validateInquiry(inquiry({ consent: false }))).toHaveProperty('consent');
  });

  it('reports every problem at once rather than one at a time', () => {
    const errors = validateInquiry({
      fullName: '',
      email: '',
      phone: '',
      preferredContact: 'Email',
      practiceArea: '',
      preferredTime: '',
      message: '',
      consent: false,
    });
    expect(Object.keys(errors).sort()).toEqual(['consent', 'email', 'fullName', 'message', 'practiceArea']);
  });

  it('returns a message for every field it flags', () => {
    const errors = validateInquiry(inquiry({ fullName: '', email: 'x', consent: false }));
    for (const message of Object.values(errors)) {
      expect(message.length).toBeGreaterThan(10);
    }
  });
});

// ----------------------------------------------------------- transport choice

describe('getDeliveryMode()', () => {
  it('prefers a configured endpoint', () => {
    expect(getDeliveryMode(endpointTransport)).toBe('endpoint');
  });

  it('falls back to email when there is no endpoint', () => {
    expect(getDeliveryMode(emailTransport)).toBe('email');
  });

  it('reports unavailable when neither is configured', () => {
    expect(getDeliveryMode(noTransport)).toBe('unavailable');
  });
});

// -------------------------------------------------------------- email fallback

describe('formatInquiryAsText()', () => {
  it('includes every supplied field', () => {
    const text = formatInquiryAsText(inquiry({ phone: '+91 98765 43210' }));
    expect(text).toContain('A. Client');
    expect(text).toContain('client@example.com');
    expect(text).toContain('+91 98765 43210');
    expect(text).toContain('Civil Matters & Dispute Resolution');
    expect(text).toContain('A contract was breached');
  });

  it('omits the phone line entirely when no number was given', () => {
    expect(formatInquiryAsText(inquiry({ phone: '' }))).not.toContain('Phone:');
  });

  it('omits the preferred time when none was chosen', () => {
    expect(formatInquiryAsText(inquiry({ preferredTime: '' }))).not.toContain('Preferred time:');
  });
});

describe('buildMailtoUrl()', () => {
  const link = buildMailtoUrl(inquiry(), emailTransport);

  it('addresses the configured mailbox', () => {
    expect(link.startsWith('mailto:advocate@example.com?')).toBe(true);
  });

  it('encodes spaces as %20, which every mail client understands', () => {
    // URLSearchParams emits "+" for spaces; mail clients render that literally.
    const query = link.slice(link.indexOf('?') + 1);
    expect(query).not.toContain('+');
    expect(query).toContain('%20');
  });

  it('carries the practice area and name in the subject', () => {
    const subject = decodeURIComponent(new URL(link).searchParams.get('subject') ?? '');
    expect(subject).toContain('Civil Matters & Dispute Resolution');
    expect(subject).toContain('A. Client');
  });

  it('carries the full inquiry in the body', () => {
    const body = new URL(link).searchParams.get('body') ?? '';
    expect(body).toContain('A contract was breached');
  });
});

// ------------------------------------------------------------------ delivery

describe('submitConsultation()', () => {
  it('reports success only after the endpoint accepts the request', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await submitConsultation(inquiry(), endpointTransport);

    expect(result.status).toBe('submitted');
    expect(fetchMock).toHaveBeenCalledOnce();
    const [calledUrl, init] = fetchMock.mock.calls[0]!;
    expect(calledUrl).toBe(endpointTransport.endpoint);
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toMatchObject({
      fullName: 'A. Client',
      email: 'client@example.com',
      practiceArea: 'Civil Matters & Dispute Resolution',
    });
  });

  it('stamps the submission time so a backend can order inquiries', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 202 }));
    vi.stubGlobal('fetch', fetchMock);

    await submitConsultation(inquiry(), endpointTransport);

    const body = JSON.parse(fetchMock.mock.calls[0]![1].body);
    expect(() => new Date(body.submittedAt).toISOString()).not.toThrow();
  });

  it('never reports success when the endpoint rejects the request', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 500 })));

    const result = await submitConsultation(inquiry(), endpointTransport);

    expect(result.status).toBe('error');
    expect(result.message).not.toMatch(AFFIRMATIVE_DELIVERY);
  });

  it('never reports success when the network fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    const result = await submitConsultation(inquiry(), endpointTransport);

    expect(result.status).toBe('error');
    expect(result.message).not.toMatch(AFFIRMATIVE_DELIVERY);
  });

  it('hands off to the mail client when there is no endpoint, and says so plainly', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const result = await submitConsultation(inquiry(), emailTransport);

    expect(result.status).toBe('handoff');
    expect(fetchMock).not.toHaveBeenCalled();
    if (result.status === 'handoff') {
      expect(result.mailtoUrl.startsWith('mailto:')).toBe(true);
      // The visitor must not be led to believe anything has been sent.
      expect(result.message).toMatch(/nothing has been sent/i);
      expect(result.message).not.toMatch(AFFIRMATIVE_DELIVERY);
    }
  });

  it('says submission is unavailable rather than pretending, when nothing is configured', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const result = await submitConsultation(inquiry(), noTransport);

    expect(result.status).toBe('unavailable');
    expect(result.message).not.toMatch(AFFIRMATIVE_DELIVERY);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('produces an affirmative confirmation only on the delivering path', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 200 })));
    const delivered = await submitConsultation(inquiry(), endpointTransport);
    expect(delivered.message).toMatch(AFFIRMATIVE_DELIVERY);

    for (const transport of [emailTransport, noTransport]) {
      const result = await submitConsultation(inquiry(), transport);
      expect(result.status, transport.endpoint || transport.email || 'none').not.toBe('submitted');
      expect(result.message).not.toMatch(AFFIRMATIVE_DELIVERY);
    }
  });

  it('silently discards a submission that filled the honeypot', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const result = await submitConsultation(inquiry({ company: 'Spam Co' }), endpointTransport);

    expect(result.status).toBe('submitted');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
