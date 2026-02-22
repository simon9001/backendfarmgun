export declare const sendEmail: (to: string, subject: string, html: string, from?: string) => Promise<{
    success: boolean;
    data: any;
    error?: never;
} | {
    success: boolean;
    error: any;
    data?: never;
}>;
//# sourceMappingURL=resend.d.ts.map