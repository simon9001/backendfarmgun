import { z } from 'zod';
export declare const registerSchema: z.ZodObject<{
    name: z.ZodString;
    phone: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    password: z.ZodString;
    role: z.ZodDefault<z.ZodEnum<{
        admin: "admin";
        client: "client";
    }>>;
}, z.core.$strip>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    password: z.ZodString;
}, z.core.$strip>;
export declare const serviceSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    duration_mins: z.ZodNumber;
    price: z.ZodNumber;
    featured_media_id: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodOptional<z.ZodString>>;
    crops: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export declare const bookingSchema: z.ZodObject<{
    service_id: z.ZodString;
    date: z.ZodString;
    start_time: z.ZodString;
    user_notes: z.ZodOptional<z.ZodString>;
    payment_phone: z.ZodString;
}, z.core.$strip>;
export declare const cropSchema: z.ZodObject<{
    name: z.ZodString;
    scientific_name: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodString>;
    growing_season: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    featured_media_id: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodOptional<z.ZodString>>;
    media_ids: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export declare const projectSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    featured_media_id: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodOptional<z.ZodString>>;
    start_date: z.ZodOptional<z.ZodString>;
    end_date: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodString>;
    media_ids: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export declare const testimonialSchema: z.ZodObject<{
    user_name: z.ZodString;
    comment: z.ZodString;
    rating: z.ZodOptional<z.ZodNumber>;
    project_id: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodOptional<z.ZodString>>;
    user_media_id: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodOptional<z.ZodString>>;
}, z.core.$strip>;
export declare const tipSchema: z.ZodObject<{
    title: z.ZodString;
    slug: z.ZodString;
    content: z.ZodString;
    excerpt: z.ZodOptional<z.ZodString>;
    featured_media_id: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodOptional<z.ZodString>>;
    status: z.ZodDefault<z.ZodEnum<{
        draft: "draft";
        published: "published";
        archived: "archived";
    }>>;
    published_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strip>;
export declare const mediaSchema: z.ZodObject<{
    public_id: z.ZodString;
    url: z.ZodString;
    type: z.ZodEnum<{
        image: "image";
        video: "video";
        document: "document";
    }>;
    category: z.ZodOptional<z.ZodEnum<{
        homepage: "homepage";
        project: "project";
        crop: "crop";
        testimonial: "testimonial";
        profile: "profile";
        service: "service";
        gallery: "gallery";
        receipt: "receipt";
        tip: "tip";
    }>>;
    alt_text: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    file_size: z.ZodOptional<z.ZodNumber>;
    mime_type: z.ZodOptional<z.ZodString>;
    width: z.ZodOptional<z.ZodNumber>;
    height: z.ZodOptional<z.ZodNumber>;
    duration: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export declare const availabilitySchema: z.ZodObject<{
    date: z.ZodString;
    start_time: z.ZodString;
    end_time: z.ZodString;
    is_available: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strip>;
//# sourceMappingURL=validation.d.ts.map