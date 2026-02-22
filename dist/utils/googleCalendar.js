import { google } from 'googleapis';
import { env } from '../db/envConfig.js';
const SCOPES = ['https://www.googleapis.com/auth/calendar.events'];
const CALENDAR_ID = env.GOOGLE_CALENDAR_ID;
const auth = new google.auth.JWT({
    email: env.GOOGLE_CLIENT_EMAIL,
    key: env.GOOGLE_PRIVATE_KEY,
    scopes: SCOPES,
});
const calendar = google.calendar({ version: 'v3', auth });
export const createGoogleMeet = async (details) => {
    try {
        const event = {
            summary: details.summary,
            description: details.description,
            start: {
                dateTime: details.startDateTime,
                timeZone: 'Africa/Nairobi',
            },
            end: {
                dateTime: details.endDateTime,
                timeZone: 'Africa/Nairobi',
            },
            conferenceData: {
                createRequest: {
                    requestId: `meet-${Date.now()}`,
                    conferenceSolutionKey: { type: 'hangoutsMeet' },
                },
            },
            attendees: [
                { email: details.userEmail },
                // Admin attendees will be added in the automation service
            ],
        };
        const response = await calendar.events.insert({
            calendarId: CALENDAR_ID,
            requestBody: event,
            conferenceDataVersion: 1,
        });
        const meetLink = response.data.hangoutLink;
        if (!meetLink) {
            throw new Error('Google Meet link was not generated');
        }
        return {
            id: response.data.id,
            link: meetLink,
            data: response.data
        };
    }
    catch (error) {
        console.error('Google Calendar API Error:', error.response?.data || error.message);
        throw new Error(`Failed to create Google Meet: ${error.message}`);
    }
};
//# sourceMappingURL=googleCalendar.js.map