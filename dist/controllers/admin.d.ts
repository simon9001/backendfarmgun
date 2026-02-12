import { Context } from 'hono';
export declare class AdminController {
    static getDashboardStats(c: Context): Promise<(Response & import("hono").TypedResponse<{
        error: string;
    }, 403, "json">) | (Response & import("hono").TypedResponse<{
        stats: {
            overview: {
                total_bookings: number;
                completed_bookings: number;
                pending_bookings: number;
                total_revenue: number;
                total_users: number;
                total_payments: number;
                conversion_rate: string;
            };
            recent_bookings: any[];
            upcoming_bookings: any[];
            trend: {
                label: string;
                bookings: number;
                completed: number;
                completion_rate: string;
            }[];
            period: string;
        };
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 500, "json">)>;
    private static processTrendData;
    static createService(c: Context): Promise<(Response & import("hono").TypedResponse<{
        error: string;
    }, 403, "json">) | (Response & import("hono").TypedResponse<{
        service: any;
    }, 201, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 400, "json">)>;
    static updateService(c: Context): Promise<(Response & import("hono").TypedResponse<{
        error: string;
    }, 403, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 404, "json">) | (Response & import("hono").TypedResponse<{
        service: any;
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 400, "json">)>;
    static deleteService(c: Context): Promise<(Response & import("hono").TypedResponse<{
        error: string;
    }, 403, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
        active_bookings: number;
    }, 400, "json">) | (Response & import("hono").TypedResponse<{
        message: string;
        deleted_id: string;
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 500, "json">)>;
    static linkCropToService(c: Context): Promise<(Response & import("hono").TypedResponse<{
        error: string;
    }, 403, "json">) | (Response & import("hono").TypedResponse<{
        message: string;
        link: any;
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 400, "json">)>;
    static unlinkCropFromService(c: Context): Promise<(Response & import("hono").TypedResponse<{
        error: string;
    }, 403, "json">) | (Response & import("hono").TypedResponse<{
        message: string;
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 400, "json">)>;
    static createCrop(c: Context): Promise<(Response & import("hono").TypedResponse<{
        error: string;
    }, 403, "json">) | (Response & import("hono").TypedResponse<{
        crop: any;
    }, 201, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 400, "json">)>;
    static updateCrop(c: Context): Promise<(Response & import("hono").TypedResponse<{
        error: string;
    }, 403, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 404, "json">) | (Response & import("hono").TypedResponse<{
        crop: any;
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 400, "json">)>;
    static deleteCrop(c: Context): Promise<(Response & import("hono").TypedResponse<{
        error: string;
    }, 403, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
        linked_services: number;
    }, 400, "json">) | (Response & import("hono").TypedResponse<{
        message: string;
        deleted_id: string;
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 500, "json">)>;
    static createProject(c: Context): Promise<(Response & import("hono").TypedResponse<{
        error: string;
    }, 403, "json">) | (Response & import("hono").TypedResponse<{
        project: any;
    }, 201, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 400, "json">)>;
    static updateProject(c: Context): Promise<(Response & import("hono").TypedResponse<{
        error: string;
    }, 403, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 404, "json">) | (Response & import("hono").TypedResponse<{
        project: any;
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 400, "json">)>;
    static deleteProject(c: Context): Promise<(Response & import("hono").TypedResponse<{
        error: string;
    }, 403, "json">) | (Response & import("hono").TypedResponse<{
        message: string;
        deleted_id: string;
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 500, "json">)>;
    static addProjectMedia(c: Context): Promise<(Response & import("hono").TypedResponse<{
        error: string;
    }, 403, "json">) | (Response & import("hono").TypedResponse<{
        project_media: any;
    }, 201, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 400, "json">)>;
    static removeProjectMedia(c: Context): Promise<(Response & import("hono").TypedResponse<{
        error: string;
    }, 403, "json">) | (Response & import("hono").TypedResponse<{
        message: string;
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 400, "json">)>;
    static createTestimonial(c: Context): Promise<(Response & import("hono").TypedResponse<{
        testimonial: any;
    }, 201, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 400, "json">)>;
    static updateTestimonial(c: Context): Promise<(Response & import("hono").TypedResponse<{
        error: string;
    }, 404, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 403, "json">) | (Response & import("hono").TypedResponse<{
        testimonial: any;
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 400, "json">)>;
    static deleteTestimonial(c: Context): Promise<(Response & import("hono").TypedResponse<{
        error: string;
    }, 403, "json">) | (Response & import("hono").TypedResponse<{
        message: string;
        deleted_id: string;
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 500, "json">)>;
    static approveTestimonial(c: Context): Promise<(Response & import("hono").TypedResponse<{
        error: string;
    }, 403, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 404, "json">) | (Response & import("hono").TypedResponse<{
        message: string;
        testimonial: any;
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 400, "json">)>;
    static createTip(c: Context): Promise<(Response & import("hono").TypedResponse<{
        error: string;
    }, 403, "json">) | (Response & import("hono").TypedResponse<{
        tip: any;
    }, 201, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 400, "json">)>;
    static updateTip(c: Context): Promise<(Response & import("hono").TypedResponse<{
        error: string;
    }, 403, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 404, "json">) | (Response & import("hono").TypedResponse<{
        tip: any;
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 400, "json">)>;
    static deleteTip(c: Context): Promise<(Response & import("hono").TypedResponse<{
        error: string;
    }, 403, "json">) | (Response & import("hono").TypedResponse<{
        message: string;
        deleted_id: string;
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 500, "json">)>;
    static addTipMedia(c: Context): Promise<(Response & import("hono").TypedResponse<{
        error: string;
    }, 403, "json">) | (Response & import("hono").TypedResponse<{
        tip_media: any;
    }, 201, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 400, "json">)>;
    static getAllBookings(c: Context): Promise<(Response & import("hono").TypedResponse<{
        error: string;
    }, 403, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 400, "json">) | (Response & import("hono").TypedResponse<{
        bookings: any[];
        meta: {
            total: number;
            limit: number;
            offset: number;
        };
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 500, "json">)>;
    static updateBooking(c: Context): Promise<(Response & import("hono").TypedResponse<{
        error: string;
    }, 403, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 404, "json">) | (Response & import("hono").TypedResponse<{
        booking: any;
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 400, "json">)>;
    static cancelBookingAdmin(c: Context): Promise<(Response & import("hono").TypedResponse<{
        error: string;
    }, 403, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 404, "json">) | (Response & import("hono").TypedResponse<{
        message: string;
        booking: any;
        refund_initiated: boolean;
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 400, "json">)>;
    static getAllUsers(c: Context): Promise<(Response & import("hono").TypedResponse<{
        error: string;
    }, 403, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 400, "json">) | (Response & import("hono").TypedResponse<{
        users: {
            id: any;
            name: any;
            email: any;
            phone: any;
            role: any;
            profile_media: any[];
            created_at: any;
            updated_at: any;
        }[];
        meta: {
            total: number;
            limit: number;
            offset: number;
        };
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 500, "json">)>;
    static getUserDetails(c: Context): Promise<(Response & import("hono").TypedResponse<{
        error: string;
    }, 403, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 404, "json">) | (Response & import("hono").TypedResponse<{
        user: any;
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 500, "json">)>;
    static updateUserRole(c: Context): Promise<(Response & import("hono").TypedResponse<{
        error: string;
    }, 403, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 400, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 404, "json">) | (Response & import("hono").TypedResponse<{
        message: string;
        user: any;
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">)>;
    static deleteUser(c: Context): Promise<(Response & import("hono").TypedResponse<{
        error: string;
    }, 403, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 400, "json">) | (Response & import("hono").TypedResponse<{
        message: string;
        deleted_id: string;
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 500, "json">)>;
    static setAvailability(c: Context): Promise<(Response & import("hono").TypedResponse<{
        error: string;
    }, 403, "json">) | (Response & import("hono").TypedResponse<{
        message: string;
        availability: {
            created_at: string;
            date: string;
            start_time: string;
            end_time: string;
            is_available: boolean;
            admin_id: string;
        };
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 400, "json">)>;
    static getAvailability(c: Context): Promise<(Response & import("hono").TypedResponse<{
        error: string;
    }, 403, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 400, "json">) | (Response & import("hono").TypedResponse<{
        date: string;
        slots: {
            time: string;
            available: boolean;
            booked_by: string | null;
        }[];
        total_slots: number;
        available_slots: number;
        booked_slots: number;
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 500, "json">)>;
    static getSystemSettings(c: Context): Promise<(Response & import("hono").TypedResponse<{
        error: string;
    }, 403, "json">) | (Response & import("hono").TypedResponse<{
        settings: {
            platform: {
                name: string;
                currency: string;
                timezone: string;
                booking_window_days: number;
                cancellation_hours: number;
                max_bookings_per_day: number;
            };
            payments: {
                mpesa_enabled: boolean;
                stripe_enabled: boolean;
                payment_required_for_booking: boolean;
            };
            notifications: {
                email_notifications: boolean;
                sms_notifications: boolean;
                whatsapp_notifications: boolean;
                reminder_hours: number[];
            };
            integrations: {
                google_calendar: boolean;
                zoom_integration: boolean;
            };
        };
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 500, "json">)>;
    static updateSystemSettings(c: Context): Promise<(Response & import("hono").TypedResponse<{
        error: string;
    }, 403, "json">) | (Response & import("hono").TypedResponse<{
        message: string;
        updates: any;
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 400, "json">)>;
    static exportData(c: Context): Promise<(Response & import("hono").TypedResponse<{
        error: string;
    }, 403, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 400, "json">) | (Response & import("hono").TypedResponse<{
        exported: true;
        type: "users" | "bookings" | "payments";
        count: number;
        date_range: {
            start_date: string | undefined;
            end_date: string | undefined;
        };
        data: import("hono/utils/types").JSONValue[];
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 500, "json">)>;
    private static deleteMediaInternal;
    private static uploadFileInternal;
}
//# sourceMappingURL=admin.d.ts.map