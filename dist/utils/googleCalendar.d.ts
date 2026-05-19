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
export declare const createGoogleMeet: (details: MeetingDetails) => Promise<{
    id: string | null | undefined;
    link: string;
    data: import("googleapis").calendar_v3.Schema$Event;
}>;
//# sourceMappingURL=googleCalendar.d.ts.map