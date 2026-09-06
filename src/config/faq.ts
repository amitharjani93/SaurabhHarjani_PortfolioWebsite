/**
 * Frequently asked questions.
 *
 * Questions are written about PROCESS, not about the law. Nothing here gives
 * jurisdiction-specific legal advice, quotes a fee, or promises an outcome.
 *
 * `areas` controls where a question appears:
 *   'general'                     → /faq page
 *   an entry from a practice area → that practice area page
 *
 * ⚖️ Review all wording before publication.
 */

export interface FaqItem {
  question: string;
  /** Plain paragraphs. Rendered in order. */
  answer: string[];
  areas: string[];
}

export const faqs: FaqItem[] = [
  {
    question: 'What happens during an initial consultation?',
    answer: [
      'The first conversation is about understanding the matter rather than acting on it. You describe the situation, we go through whatever documents are available, and the questions that follow are usually about dates, correspondence and what has already been said or signed.',
      'By the end of it you should have a clear view of what the issue actually is, what the realistic options are, and whether a legal step is worth taking at all.',
    ],
    areas: ['general'],
  },
  {
    question: 'What should I prepare before getting in touch?',
    answer: [
      'A short written summary of what happened, in the order it happened, is more useful than anything else. Alongside that, gather any agreements, notices, receipts, registration certificates, email or message threads, and anything you have received from the other side.',
      'If a deadline or hearing date has been given to you, mention it at the outset. Do not send documents before they are asked for.',
    ],
    areas: ['general'],
  },
  {
    question: 'Does submitting an inquiry create an advocate-client relationship?',
    answer: [
      'No. An inquiry is a request for a conversation. An advocate-client relationship begins only once the matter has been reviewed for conflicts, accepted, and the terms of engagement have been agreed in writing.',
      'Until that point, please do not send confidential or privileged material.',
    ],
    areas: ['general'],
  },
  {
    question: 'How are consultation arrangements confirmed?',
    answer: [
      'You will receive a reply by your preferred contact method proposing a time. Consultations can be held at the chambers or remotely, depending on the matter and where you are.',
    ],
    areas: ['general'],
  },
  {
    question: 'Can documents be reviewed before a consultation?',
    answer: [
      'Sometimes. Where a document review would make the discussion more productive, you will be told which documents to send and how to send them securely. Please wait for that request rather than attaching material to your first inquiry.',
    ],
    areas: ['general'],
  },
  {
    question: 'Is there a charge for the first consultation?',
    answer: [
      'Fee arrangements depend on the nature and scope of the matter and are discussed and confirmed before any work begins. Nothing is charged without your agreement.',
    ],
    areas: ['general'],
  },
  {
    question: 'What if my matter falls outside these areas of practice?',
    answer: [
      'You will be told so directly. Where the matter sits outside the practice, the inquiry is declined rather than accepted and passed on.',
    ],
    areas: ['general'],
  },

  // ---------------------------------------------------------------- IP / TM
  {
    question: 'Should a trade mark search be done before filing?',
    answer: [
      'A search will not guarantee registration, but it shows what is already on the register and in use, which is often enough to tell you whether a mark is worth investing in. It is far cheaper to discover a conflict before filing than after a brand has been built around it.',
    ],
    areas: ['intellectual-property-trademarks'],
  },
  {
    question: 'My trade mark application has received an examination report. What now?',
    answer: [
      'An examination report sets out the Registry’s objections and gives a period within which to respond. The response addresses each objection with reasons and, where useful, evidence of use or distinctiveness.',
      'The date on the report matters. Bring it as soon as you receive it, because the reply window is fixed.',
    ],
    areas: ['intellectual-property-trademarks'],
  },
  {
    question: 'Someone is using a mark similar to mine. What are my options?',
    answer: [
      'The first step is establishing what rights you hold and since when — registration, use, or both — and gathering evidence of the other party’s use. Depending on what that shows, the options can range from a cease-and-desist notice, to opposition or rectification before the Registry, to proceedings before a court.',
      'Which of these is appropriate depends on the facts, not on a standard sequence.',
    ],
    areas: ['intellectual-property-trademarks'],
  },
  {
    question: 'How long does a trade mark registration take?',
    answer: [
      'Timelines are set by the Trade Marks Registry and vary considerably depending on whether objections are raised and whether the application is opposed. An estimate specific to your application can be given once the mark and class are known.',
    ],
    areas: ['intellectual-property-trademarks'],
  },

  // ---------------------------------------------------------------- Property
  {
    question: 'What does a title review actually involve?',
    answer: [
      'It means tracing how ownership reached the current holder and checking that each link in that chain is documented and consistent. That typically covers the parent documents, the registered instruments, tax and utility records, encumbrance position, approvals where relevant, and any pending litigation that touches the property.',
      'The output is a plain statement of what is clear, what is unclear, and what should be resolved before money changes hands.',
    ],
    areas: ['real-estate-property'],
  },
  {
    question: 'Should an agreement be reviewed before signing?',
    answer: [
      'Yes, and preferably before any advance is paid. Most property disputes trace back to a clause that was accepted without being read against the underlying documents — on possession, payment milestones, default, or what happens if approvals do not come through.',
    ],
    areas: ['real-estate-property'],
  },
  {
    question: 'The builder has not delivered possession on time. What can be done?',
    answer: [
      'The starting point is the agreement itself and the record of what was promised, paid and communicated. What follows depends on those terms and on which forum is appropriate for the claim. The available routes are explained once the documents have been read.',
    ],
    areas: ['real-estate-property'],
  },

  // ---------------------------------------------------------------- Civil
  {
    question: 'Is a legal notice always necessary before filing a case?',
    answer: [
      'Not always, though in some categories of matter it is required and in many others it is sensible. A well-drafted notice sets out the facts and the demand clearly, and it frequently resolves the dispute without proceedings. It also becomes part of the record if proceedings follow.',
    ],
    areas: ['civil-matters'],
  },
  {
    question: 'How long do civil matters take?',
    answer: [
      'It depends on the forum, the nature of the relief sought and the conduct of the other side. No honest estimate can be given without seeing the matter, and any estimate given afterwards is a range rather than a date.',
    ],
    areas: ['civil-matters'],
  },
  {
    question: 'Can a dispute be settled without going to court?',
    answer: [
      'Often, yes. Negotiation, mediation and — where the contract provides for it — arbitration are all worth weighing against litigation. Where settlement is realistic and the terms are sound, it is put forward as an option rather than treated as a fallback.',
    ],
    areas: ['civil-matters'],
  },
];

export function faqsFor(area: string): FaqItem[] {
  return faqs.filter((f) => f.areas.includes(area));
}
