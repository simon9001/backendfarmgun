export interface MeetingDetails {
    summary: string;
    description: string;
    startDateTime: string;
    endDateTime: string;
    userEmail: string;
}
export declare const createGoogleMeet: (details: MeetingDetails) => Promise<{
    id: string | null | undefined;
    link: string;
    data: import("googleapis").calendar_v3.Schema$Event;
}>;
//# sourceMappingURL=googleCalendar.d.ts.map