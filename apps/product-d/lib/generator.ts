export interface GenerateContentInput {
  title: string;
  author: string;
  genre: string;
  event_title?: string;
  event_date?: string;
}

export interface GeneratedContent {
  instagramCaption: string;
  newsletterBlurb: string;
  staffPickCard: {
    title: string;
    note: string;
    badge: string;
  };
  eventDataIncomplete: boolean;
}

export function generateContent(input: GenerateContentInput): GeneratedContent {
  if (!input || !input.title) {
    throw new Error('title is required');
  }

  const title = input.title;
  const author = input.author || '';
  const event_title = input.event_title || '';
  const event_date = (input.event_date || '').trim();

  const eventDataIncomplete = Boolean(event_title) && !event_date;
  const includeEvent = Boolean(event_title) && !eventDataIncomplete;

  const eventLine = includeEvent
    ? ` Join us: ${event_title} on ${event_date}!`
    : '';

  return {
    instagramCaption: `📚 Now featuring "${title}" by ${author}!${eventLine} #NewArrival #Bookstore`,
    newsletterBlurb: `New Arrival: "${title}" by ${author}${includeEvent ? `\n\nEvent: ${event_title} — ${event_date}` : ''}`,
    staffPickCard: {
      title: `Staff Pick: "${title}"`,
      note: `We love this pick by ${author}.`,
      badge: 'Generated'
    },
    eventDataIncomplete
  };
}
