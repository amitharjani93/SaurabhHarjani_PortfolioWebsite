/**
 * ============================================================================
 *  CONSULTATION SERVICE
 * ============================================================================
 *
 *  A transport-agnostic boundary between the consultation form UI and however
 *  inquiries actually get delivered. The form never knows which transport is
 *  in use; it only renders the returned `SubmissionResult`.
 *
 *  Transports, in order of preference:
 *
 *    1. ENDPOINT — an HTTPS endpoint that accepts a JSON POST. Configure with
 *       the PUBLIC_CONSULTATION_ENDPOINT environment variable (see .env.example).
 *       This is where a future backend, serverless function, CRM webhook or
 *       form service is connected. Nothing else has to change.
 *
 *    2. EMAIL — the static-hosting fallback. GitHub Pages cannot receive a
 *       POST, so the inquiry is composed into a pre-filled email that the
 *       visitor sends from their own mail client. The UI states plainly that
 *       the message has not been sent yet.
 *
 *    3. UNAVAILABLE — no endpoint and no email address configured. The form
 *       explains that online submission is not available and points to the
 *       other contact routes. It never pretends to have submitted anything.
 *
 *  ▸ There is no code path that reports success without a 2xx response from a
 *    configured endpoint. This is deliberate.
 * ============================================================================
 */

export interface ConsultationInquiry {
  fullName: string;
  email: string;
  phone: string;
  preferredContact: string;
  practiceArea: string;
  preferredTime: string;
  message: string;
  consent: boolean;
  /** Anti-spam honeypot. Populated only by bots; a filled value is discarded. */
  company?: string;
}

export interface ConsultationTransport {
  /** POST endpoint, or an empty string when none is configured. */
  endpoint: string;
  /** Destination mailbox for the fallback, or null. */
  email: string | null;
  /** Subject prefix for the fallback email. */
  subjectPrefix: string;
}

export type DeliveryMode = 'endpoint' | 'email' | 'unavailable';

export type SubmissionResult =
  | { status: 'submitted'; message: string }
  | { status: 'handoff'; message: string; mailtoUrl: string }
  | { status: 'unavailable'; message: string }
  | { status: 'error'; message: string };

export function getDeliveryMode(transport: ConsultationTransport): DeliveryMode {
  if (transport.endpoint) return 'endpoint';
  if (transport.email) return 'email';
  return 'unavailable';
}

/** Field-level validation. Returns a map of field name → error message. */
export function validateInquiry(data: ConsultationInquiry): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!data.fullName.trim()) {
    errors.fullName = 'Please enter your name so the reply can be addressed to you.';
  }

  const email = data.email.trim();
  if (!email) {
    errors.email = 'Please enter an email address.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    errors.email = 'That email address does not look complete. Please check it.';
  }

  const phone = data.phone.trim();
  if (phone && !/^[+()\d\s-]{6,20}$/.test(phone)) {
    errors.phone = 'Please enter a phone number using digits, spaces, + or -.';
  }
  if (data.preferredContact === 'Phone' && !phone) {
    errors.phone = 'A phone number is needed if you would prefer to be called.';
  }

  if (!data.practiceArea) {
    errors.practiceArea = 'Please choose the area your matter relates to.';
  }

  const message = data.message.trim();
  if (message.length < 20) {
    errors.message = 'Please describe the matter in a sentence or two — at least 20 characters.';
  } else if (message.length > 3000) {
    errors.message = 'Please keep the description under 3,000 characters.';
  }

  if (!data.consent) {
    errors.consent = 'Please confirm you have read the note above before sending.';
  }

  return errors;
}

/** Plain-text rendering of an inquiry, used for the email fallback. */
export function formatInquiryAsText(data: ConsultationInquiry): string {
  const lines = [
    `Name: ${data.fullName}`,
    `Email: ${data.email}`,
    data.phone ? `Phone: ${data.phone}` : null,
    `Preferred contact: ${data.preferredContact}`,
    `Practice area: ${data.practiceArea}`,
    data.preferredTime ? `Preferred time: ${data.preferredTime}` : null,
    '',
    'Description of the matter:',
    data.message,
    '',
    '— Sent from the consultation form.',
  ];
  return lines.filter((l) => l !== null).join('\n');
}

export function buildMailtoUrl(data: ConsultationInquiry, transport: ConsultationTransport): string {
  const subject = `${transport.subjectPrefix}${data.practiceArea} — ${data.fullName}`;
  const params = new URLSearchParams({
    subject,
    body: formatInquiryAsText(data),
  });
  // URLSearchParams encodes spaces as '+', which mail clients do not decode.
  return `mailto:${transport.email}?${params.toString().replace(/\+/g, '%20')}`;
}

/**
 * Deliver an inquiry. Resolves with a result the UI can render directly.
 * Replacing the static build with a server later means setting `endpoint`
 * — this signature and the form above it stay the same.
 */
export async function submitConsultation(
  data: ConsultationInquiry,
  transport: ConsultationTransport,
): Promise<SubmissionResult> {
  // Silently accept and discard bot submissions.
  if (data.company) {
    return { status: 'submitted', message: 'Thank you. Your inquiry has been received.' };
  }

  const mode = getDeliveryMode(transport);

  if (mode === 'endpoint') {
    try {
      const response = await fetch(transport.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          fullName: data.fullName,
          email: data.email,
          phone: data.phone,
          preferredContact: data.preferredContact,
          practiceArea: data.practiceArea,
          preferredTime: data.preferredTime,
          message: data.message,
          submittedAt: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        return {
          status: 'error',
          message:
            'The inquiry could not be sent just now. Please try again in a few minutes, or use the contact details listed on this page.',
        };
      }

      return {
        status: 'submitted',
        message: 'Your inquiry has been received. A reply will follow by your preferred contact method.',
      };
    } catch {
      return {
        status: 'error',
        message:
          'The inquiry could not be sent — this is usually a network problem. Please try again, or use the contact details listed on this page.',
      };
    }
  }

  if (mode === 'email') {
    return {
      status: 'handoff',
      message:
        'Your details have been placed into an email, which will open in your mail application. Nothing has been sent yet — please review it and press send.',
      mailtoUrl: buildMailtoUrl(data, transport),
    };
  }

  return {
    status: 'unavailable',
    message:
      'Online submission is not available on this site yet. Please use the contact details listed on this page to get in touch.',
  };
}
