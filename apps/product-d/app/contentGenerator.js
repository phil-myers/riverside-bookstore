import { fetchBookMetadata } from "../lib/fetchBookMetadata";

export async function generateContent(book) {
  if (!book || !book.book_title) {
    throw new Error('book_title is required');
  }

  const book_title = book.book_title;
  const author_name = book.author_name || '';
  const isbn = book.ISBN || '';
  const event_title = book.event_title || '';
  const event_datetime = (book['Author Events'] || '').trim();
  const event_description = book.event_description || '';

  const eventDataIncomplete =
    Boolean(event_title) && (!event_datetime || !event_description);
  const includeEvent = Boolean(event_title) && !eventDataIncomplete;

  const eventLine = includeEvent
    ? ` Join us: ${event_title} on ${event_datetime}!`
    : '';

  console.log('eventDataIncomplete:', eventDataIncomplete);

  const bookMetadata = isbn ? await fetchBookMetadata(isbn) : null;

  return {
    instagramCaption: `📚 Now featuring "${book_title}" by ${author_name}!${eventLine} #NewArrival #Bookstore`,
    newsletterBlurb: `New Arrival: "${book_title}" by ${author_name}${includeEvent ? `\n\nEvent: ${event_title} — ${event_datetime}\n${event_description}` : ''}`,
    staffPickCard: {
      title: `Staff Pick: "${book_title}"`,
      note: `We love this pick by ${author_name}.`,
      badge: 'Generated'
    },
    bookMetadata,
    eventDataIncomplete
  };
}
