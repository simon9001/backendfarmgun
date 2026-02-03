export type UserRole = 'admin' | 'client';
export type BookingStatus = 'pending' | 'paid' | 'confirmed' | 'completed' | 'cancelled';
export type PaymentStatus = 'pending' | 'success' | 'failed';
export type NotificationType = 'booking_confirmation' | 'reminder' | 'payment_receipt';
export type MediaType = 'image' | 'video' | 'document';
export type MediaCategory = 'homepage' | 'project' | 'crop' | 'testimonial' | 'profile' | 'service' | 'gallery' | 'receipt' | 'tip';
export type TipStatus = 'draft' | 'published' | 'archived';
export interface User {
    id: string;
    name: string;
    phone?: string;
    email?: string;
    password_hash?: string;
    role: UserRole;
    profile_media_id?: string;
    created_at: Date;
    updated_at: Date;
}
export interface Service {
    id: string;
    name: string;
    description?: string;
    duration_mins: number;
    price: number;
    featured_media_id?: string;
    created_at: Date;
    updated_at: Date;
}
export interface Crop {
    id: string;
    name: string;
    description?: string;
    featured_media_id?: string;
    created_at: Date;
    updated_at: Date;
}
export interface Project {
    id: string;
    name: string;
    description?: string;
    featured_media_id?: string;
    start_date?: Date;
    end_date?: Date;
    created_at: Date;
    updated_at: Date;
}
export interface Booking {
    id: string;
    user_id: string;
    admin_id?: string;
    service_id: string;
    date: Date;
    start_time: string;
    end_time: string;
    status: BookingStatus;
    meeting_link?: string;
    created_at: Date;
    updated_at: Date;
}
export interface Payment {
    id: string;
    booking_id: string;
    amount: number;
    status: PaymentStatus;
    transaction_id?: string;
    receipt_media_id?: string;
    paid_at?: Date;
}
export interface Media {
    id: string;
    public_id: string;
    url: string;
    type: MediaType;
    category?: MediaCategory;
    alt_text?: string;
    description?: string;
    file_size?: number;
    mime_type?: string;
    width?: number;
    height?: number;
    duration?: number;
    uploaded_by?: string;
    created_at: Date;
    updated_at: Date;
}
export interface Notification {
    id: string;
    user_id: string;
    type: NotificationType;
    message: string;
    sent_at?: Date;
    read: boolean;
}
export interface Tip {
    id: string;
    title: string;
    slug: string;
    content: string;
    excerpt?: string;
    featured_media_id?: string;
    author_id?: string;
    status: TipStatus;
    published_at?: Date;
    created_at: Date;
    updated_at: Date;
}
export interface Testimonial {
    id: string;
    user_name: string;
    comment: string;
    rating?: number;
    project_id?: string;
    user_media_id?: string;
    created_at: Date;
}
export interface AuthTokenPayload {
    userId: string;
    role: UserRole;
    email?: string;
    phone?: string;
}
export interface CloudinaryUploadResult {
    public_id: string;
    url: string;
    secure_url: string;
    format: string;
    resource_type: string;
    bytes: number;
    width?: number;
    height?: number;
    duration?: number;
    created_at?: string;
    tags?: string[];
    folder?: string;
}
export interface MediaUploadResponse {
    media: Media;
    cloudinary_info?: CloudinaryUploadResult;
}
export interface MediaWithCloudinaryInfo extends Media {
    cloudinary_info?: CloudinaryUploadResult;
}
//# sourceMappingURL=index.d.ts.map