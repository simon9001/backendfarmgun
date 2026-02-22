import { google } from 'googleapis';
import { env } from '../db/envConfig.js';

const SCOPES = ['https://www.googleapis.com/auth/calendar.events'];

export interface MeetingDetails {
    summary: string;
    description: string;
    startDateTime: string;
    endDateTime: string;
}

/**
 * Creates a Google Calendar event with a Google Meet link.
 *
 * Group calendars (@group.calendar.google.com) do NOT support
 * the `hangoutsMeet` conference type. To get a Meet link we need
 * to create the event on a real user's calendar via domain-wide
 * delegation (impersonation).
 *
 * Setup required in Google Workspace Admin Console:
 *   1. Enable domain-wide delegation for your service account.
 *   2. Authorize scope: https://www.googleapis.com/auth/calendar.events
 *   3. Set GOOGLE_ADMIN_EMAIL in .env to the Workspace user to impersonate.
 */
export const createGoogleMeet = async (details: MeetingDetails) => {
    try {
        // Impersonate the admin user so we can create events on their
        // primary calendar (which supports Google Meet).
        const adminEmail = env.GOOGLE_ADMIN_EMAIL;

        const jwtOptions: any = {
            email: env.GOOGLE_CLIENT_EMAIL,
            key: env.GOOGLE_PRIVATE_KEY,
            scopes: SCOPES,
        };
        if (adminEmail) {
            jwtOptions.subject = adminEmail; // impersonate admin user
        }

        const auth = new google.auth.JWT(jwtOptions);

        const calendar = google.calendar({ version: 'v3', auth });

        // If we have an admin email, use their primary calendar (supports Meet).
        // Otherwise fall back to the group calendar (no Meet link).
        const calendarId = adminEmail ? 'primary' : env.GOOGLE_CALENDAR_ID;
        const includeConference = !!adminEmail;

        const event: any = {
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
            // No attendees — we send the Meet link via our own email instead
        };

        if (includeConference) {
            event.conferenceData = {
                createRequest: {
                    requestId: `meet-${Date.now()}`,
                    conferenceSolutionKey: { type: 'hangoutsMeet' },
                },
            };
        }

        const response = await calendar.events.insert({
            calendarId,
            requestBody: event,
            conferenceDataVersion: includeConference ? 1 : 0,
        });

        const meetLink = response.data.hangoutLink;
        if (!meetLink) {
            console.warn('⚠️ Calendar event created but no Meet link generated. Is GOOGLE_ADMIN_EMAIL set?');
        }

        return {
            id: response.data.id,
            link: meetLink || '',
            data: response.data
        };
    } catch (error: any) {
        console.error('Google Calendar API Error:', error.response?.data || error.message);
        throw new Error(`Failed to create Google Meet: ${error.message}`);
    }
};
