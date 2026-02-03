import { z } from 'zod';
export const registerSchema = z.object({
    name: z.string().min(2).max(255),
    phone: z.string().optional(),
    email: z.string().email().optional(),
    password: z.string().min(6),
    role: z.enum(['admin', 'client']).default('client'),
});
export const loginSchema = z.object({
    email: z.string().email().optional(),
    phone: z.string().optional(),
    password: z.string().min(6),
}).refine((data) => data.email || data.phone, {
    message: 'Either email or phone must be provided',
});
export const serviceSchema = z.object({
    name: z.string().min(2).max(255),
    description: z.string().optional(),
    duration_mins: z.number().int().positive(),
    price: z.number().positive(),
    featured_media_id: z.string().uuid().optional(),
});
export const bookingSchema = z.object({
    service_id: z.string().uuid(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    start_time: z.string().regex(/^\d{2}:\d{2}$/),
    user_notes: z.string().optional(),
});
export const cropSchema = z.object({
    name: z.string().min(2).max(255),
    description: z.string().optional(),
    featured_media_id: z.string().uuid().optional(),
});
export const projectSchema = z.object({
    name: z.string().min(2).max(255),
    description: z.string().optional(),
    featured_media_id: z.string().uuid().optional(),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});
export const testimonialSchema = z.object({
    user_name: z.string().min(2).max(255),
    comment: z.string().min(10),
    rating: z.number().int().min(1).max(5).optional(),
    project_id: z.string().uuid().optional(),
    user_media_id: z.string().uuid().optional(),
});
export const tipSchema = z.object({
    title: z.string().min(2).max(255),
    slug: z.string().min(2).max(255).regex(/^[a-z0-9-]+$/),
    content: z.string().min(10),
    excerpt: z.string().optional(),
    featured_media_id: z.string().uuid().optional(),
    status: z.enum(['draft', 'published', 'archived']).default('draft'),
});
export const mediaSchema = z.object({
    public_id: z.string().min(1),
    url: z.string().url(),
    type: z.enum(['image', 'video', 'document']),
    category: z.enum(['homepage', 'project', 'crop', 'testimonial', 'profile', 'service', 'gallery', 'receipt', 'tip']).optional(),
    alt_text: z.string().optional(),
    description: z.string().optional(),
    file_size: z.number().int().positive().optional(),
    mime_type: z.string().optional(),
    width: z.number().int().positive().optional(),
    height: z.number().int().positive().optional(),
    duration: z.number().int().positive().optional(),
});
export const availabilitySchema = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    start_time: z.string().regex(/^\d{2}:\d{2}$/),
    end_time: z.string().regex(/^\d{2}:\d{2}$/),
    is_available: z.boolean().default(true),
});
//# sourceMappingURL=validation.js.map