export const EVENT = {
  appName:
    process.env.NEXT_PUBLIC_APP_NAME || 'Glitch Gemini Hackathon Waiver Packet',
  organizationName: process.env.NEXT_PUBLIC_ORGANIZATION_NAME || 'GLITCH',
  eventName: process.env.NEXT_PUBLIC_EVENT_NAME || 'Glitch Gemini Hackathon',
  dateLabel: process.env.NEXT_PUBLIC_EVENT_DATE_LABEL || 'March 27-28, 2026',
  dateRangeShort:
    process.env.NEXT_PUBLIC_EVENT_DATE_RANGE_SHORT || '3/27/2026 - 3/28/2026',
  location: process.env.NEXT_PUBLIC_EVENT_LOCATION || 'Carnesale Commons',
  campus: process.env.NEXT_PUBLIC_EVENT_CAMPUS || 'Los Angeles',
  contactEmail: process.env.NEXT_PUBLIC_EVENT_CONTACT_EMAIL || '',
  packetVersion: '2026-03-27.v1',
  liabilitySourceLabel: 'UC Form SO17 Rev. 3/17',
};

export function getActivityDescriptionLines() {
  return [
    `Name: ${EVENT.eventName}`,
    `Date: ${EVENT.dateRangeShort}`,
    `Location: ${EVENT.location}`,
  ];
}
