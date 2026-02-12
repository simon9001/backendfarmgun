import { Hono } from 'hono';
import { supabase } from '../db/supabaseClient.js';
import { CloudinaryService } from '../utils/cloudinary.js';
export const publicRoutes = new Hono();
// Media Optimization Helper
const optimizeMedia = (media, options) => {
    if (!media || !media.public_id)
        return media;
    const isCloudinary = media.url?.includes('res.cloudinary.com');
    const isPlaceholder = ['hero-image', 'service-image', 'tip-image', 'crop-image', 'project-image'].includes(media.public_id);
    if (isCloudinary && !isPlaceholder) {
        // Extract version if present in URL
        const versionMatch = media.url?.match(/\/v(\d+)\//);
        const version = versionMatch ? versionMatch[1] : undefined;
        return {
            ...media,
            optimized_url: CloudinaryService.getOptimizedImageUrl(media.public_id, {
                ...options,
                // @ts-ignore - version is supported by cloudinary.url but might not be in our basic wrapper
                version,
            }),
            thumbnail_url: CloudinaryService.getOptimizedImageUrl(media.public_id, {
                width: 200,
                height: 150,
                crop: 'fill',
                quality: 60,
                // @ts-ignore
                version,
            }),
        };
    }
    return media;
};
// Services - Public
publicRoutes.get('/services', async (c) => {
    const { featured, limit = '50', offset = '0' } = c.req.query();
    // Convert string parameters to numbers
    const limitNum = parseInt(limit, 10);
    const offsetNum = parseInt(offset, 10);
    if (isNaN(limitNum) || isNaN(offsetNum)) {
        return c.json({ error: 'Invalid limit or offset parameter' }, 400);
    }
    let query = supabase
        .from('services')
        .select(`
      id,
      name,
      description,
      duration_mins,
      price,
      featured_media:media_library(
        id,
        public_id,
        url,
        type,
        alt_text,
        width,
        height
      ),
      service_crops:crops(
        id,
        name,
        description
      ),
      created_at
    `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offsetNum, offsetNum + limitNum - 1);
    // If featured is requested, you might want to add a featured field to services table
    // For now, we'll just return all services
    if (featured === 'true') {
        query = query.limit(3); // Limit to 3 featured services
    }
    const { data: services, error, count } = await query;
    if (error) {
        console.error('Services fetch error:', error);
        return c.json({ error: 'Failed to fetch services' }, 500);
    }
    // Add optimized URLs for featured media
    const servicesWithOptimizedUrls = services?.map(service => {
        const featuredMediaData = service.featured_media;
        const featuredMedia = (Array.isArray(featuredMediaData) ? featuredMediaData[0] : featuredMediaData);
        return {
            ...service,
            featured_media: optimizeMedia(featuredMedia, {
                width: 600,
                height: 400,
                crop: 'fill',
                quality: 80,
            })
        };
    });
    return c.json({
        services: servicesWithOptimizedUrls || [],
        meta: { count: count || 0, limit: limitNum, offset: offsetNum }
    });
});
publicRoutes.get('/services/:id', async (c) => {
    const id = c.req.param('id');
    const { data: service, error } = await supabase
        .from('services')
        .select(`
      *,
      featured_media:media_library(
        id,
        public_id,
        url,
        type,
        alt_text,
        description,
        width,
        height,
        mime_type
      ),
      service_crops:crops(
        id,
        name,
        description,
        featured_media:media_library(
          id,
          public_id,
          url,
          alt_text,
          type
        )
      )
    `)
        .eq('id', id)
        .single();
    if (error || !service) {
        return c.json({ error: 'Service not found' }, 404);
    }
    // Add optimized URLs
    const featuredMediaData = service.featured_media;
    const featuredMedia = (Array.isArray(featuredMediaData) ? featuredMediaData[0] : featuredMediaData);
    service.featured_media = optimizeMedia(featuredMedia, {
        width: 800,
        height: 600,
        crop: 'fill',
        quality: 85,
    });
    // Optimize crop images
    if (service.service_crops) {
        service.service_crops = service.service_crops.map((crop) => {
            const cropFeaturedMediaData = crop.featured_media;
            const cropFeaturedMedia = (Array.isArray(cropFeaturedMediaData) ? cropFeaturedMediaData[0] : cropFeaturedMediaData);
            return {
                ...crop,
                featured_media: optimizeMedia(cropFeaturedMedia, {
                    width: 400,
                    height: 300,
                    crop: 'fill',
                    quality: 80,
                })
            };
        });
    }
    return c.json({ service });
});
// Crops - Public
publicRoutes.get('/crops', async (c) => {
    const { featured, limit = '50', offset = '0' } = c.req.query();
    // Convert string parameters to numbers
    const limitNum = parseInt(limit, 10);
    const offsetNum = parseInt(offset, 10);
    if (isNaN(limitNum) || isNaN(offsetNum)) {
        return c.json({ error: 'Invalid limit or offset parameter' }, 400);
    }
    let query = supabase
        .from('crops')
        .select(`
      id,
      name,
      description,
      featured_media:media_library(
        id,
        public_id,
        url,
        type,
        alt_text,
        width,
        height
      ),
      crop_media:crop_media(
        id,
        display_order,
        media:media_library(*)
      ),
      service_crops:services(
        id,
        name,
        price,
        duration_mins
      ),
      created_at
    `)
        .order('created_at', { ascending: false })
        .range(offsetNum, offsetNum + limitNum - 1);
    if (featured === 'true') {
        query = query.limit(6); // Featured crops
    }
    const { data: crops, error } = await query;
    if (error) {
        console.error('Crops fetch error:', error);
        return c.json({ error: 'Failed to fetch crops' }, 500);
    }
    // Add optimized URLs
    const cropsWithOptimizedUrls = crops?.map(crop => {
        const featuredMediaData = crop.featured_media;
        const featuredMedia = (Array.isArray(featuredMediaData) ? featuredMediaData[0] : featuredMediaData);
        const optimizedCrop = {
            ...crop,
            featured_media: optimizeMedia(featuredMedia, {
                width: 500,
                height: 350,
                crop: 'fill',
                quality: 80,
            })
        };
        // Optimize gallery images
        if (optimizedCrop.crop_media) {
            optimizedCrop.crop_media = optimizedCrop.crop_media.map((item) => {
                const itemMedia = (Array.isArray(item.media) ? item.media[0] : item.media);
                return {
                    ...item,
                    media: optimizeMedia(itemMedia, {
                        width: 400,
                        height: 300,
                        crop: 'fill',
                        quality: 80,
                    })
                };
            });
        }
        return optimizedCrop;
    });
    return c.json({ crops: cropsWithOptimizedUrls || [] });
});
publicRoutes.get('/crops/:id', async (c) => {
    const id = c.req.param('id');
    const { data: crop, error } = await supabase
        .from('crops')
        .select(`
      *,
      featured_media:media_library(
        id,
        public_id,
        url,
        type,
        alt_text,
        description,
        width,
        height,
        mime_type
      ),
      crop_media:crop_media(
        id,
        display_order,
        media:media_library(*)
      ),
      service_crops:services(
        id,
        name,
        price,
        duration_mins,
        featured_media:media_library(
          id,
          public_id,
          url,
          alt_text
        )
      )
    `)
        .eq('id', id)
        .single();
    if (error || !crop) {
        return c.json({ error: 'Crop not found' }, 404);
    }
    // Add optimized URL for featured media
    const featuredMediaData = crop.featured_media;
    const featuredMedia = (Array.isArray(featuredMediaData) ? featuredMediaData[0] : featuredMediaData);
    crop.featured_media = optimizeMedia(featuredMedia, {
        width: 800,
        height: 500,
        crop: 'fill',
        quality: 85,
    });
    // Optimize gallery images
    if (crop.crop_media) {
        crop.crop_media = crop.crop_media.map((item) => {
            const itemMedia = (Array.isArray(item.media) ? item.media[0] : item.media);
            return {
                ...item,
                media: optimizeMedia(itemMedia, {
                    width: 800,
                    height: 600,
                    crop: 'fill',
                    quality: 80,
                })
            };
        });
    }
    // Optimize service images
    if (crop.service_crops) {
        crop.service_crops = crop.service_crops.map((service) => {
            const serviceFeaturedMediaData = service.featured_media;
            const serviceFeaturedMedia = (Array.isArray(serviceFeaturedMediaData) ? serviceFeaturedMediaData[0] : serviceFeaturedMediaData);
            return {
                ...service,
                featured_media: optimizeMedia(serviceFeaturedMedia, {
                    width: 400,
                    height: 300,
                    crop: 'fill',
                    quality: 80,
                })
            };
        });
    }
    return c.json({ crop });
});
// Projects - Public
publicRoutes.get('/projects', async (c) => {
    const { featured, limit = '20', offset = '0' } = c.req.query();
    // Convert string parameters to numbers
    const limitNum = parseInt(limit, 10);
    const offsetNum = parseInt(offset, 10);
    if (isNaN(limitNum) || isNaN(offsetNum)) {
        return c.json({ error: 'Invalid limit or offset parameter' }, 400);
    }
    let query = supabase
        .from('projects')
        .select(`
      id,
      name,
      description,
      start_date,
      end_date,
      featured_media:media_library(
        id,
        public_id,
        url,
        type,
        alt_text,
        width,
        height
      ),
      created_at
    `)
        .order('created_at', { ascending: false })
        .range(offsetNum, offsetNum + limitNum - 1);
    if (featured === 'true') {
        query = query.limit(3); // Featured projects
    }
    const { data: projects, error } = await query;
    if (error) {
        console.error('Projects fetch error:', error);
        return c.json({ error: 'Failed to fetch projects' }, 500);
    }
    // Add optimized URLs
    const projectsWithOptimizedUrls = projects?.map(project => {
        const featuredMediaData = project.featured_media;
        const featuredMedia = (Array.isArray(featuredMediaData) ? featuredMediaData[0] : featuredMediaData);
        return {
            ...project,
            featured_media: optimizeMedia(featuredMedia, {
                width: 800,
                height: 450,
                crop: 'fill',
                quality: 85,
            })
        };
    });
    return c.json({ projects: projectsWithOptimizedUrls || [] });
});
publicRoutes.get('/projects/:id', async (c) => {
    const id = c.req.param('id');
    const { data: project, error } = await supabase
        .from('projects')
        .select(`
      *,
      featured_media:media_library(
        id,
        public_id,
        url,
        type,
        alt_text,
        description,
        width,
        height,
        mime_type
      ),
      project_media:project_media(
        id,
        caption,
        display_order,
        media:media_library(
          id,
          public_id,
          url,
          type,
          alt_text,
          description,
          width,
          height,
          mime_type
        )
      ),
      testimonials:testimonials(
        id,
        user_name,
        comment,
        rating,
        user_media:media_library(
          id,
          public_id,
          url,
          alt_text
        ),
        created_at
      )
    `)
        .eq('id', id)
        .single();
    if (error || !project) {
        return c.json({ error: 'Project not found' }, 404);
    }
    // Add optimized URL for featured media
    const featuredMediaData = project.featured_media;
    const featuredMedia = (Array.isArray(featuredMediaData) ? featuredMediaData[0] : featuredMediaData);
    project.featured_media = optimizeMedia(featuredMedia, {
        width: 1200,
        height: 675,
        crop: 'fill',
        quality: 90,
    });
    // Optimize project media gallery images
    if (project.project_media) {
        project.project_media = project.project_media.map((item) => {
            const itemMedia = (Array.isArray(item.media) ? item.media[0] : item.media);
            return {
                ...item,
                media: optimizeMedia(itemMedia, {
                    width: 1000,
                    height: 750,
                    crop: 'fill',
                    quality: 85,
                })
            };
        });
    }
    // Optimize testimonial user images
    if (project.testimonials) {
        project.testimonials = project.testimonials.map((testimonial) => {
            const userMediaData = testimonial.user_media;
            const userMedia = (Array.isArray(userMediaData) ? userMediaData[0] : userMediaData);
            return {
                ...testimonial,
                user_media: optimizeMedia(userMedia, {
                    width: 100,
                    height: 100,
                    crop: 'fill',
                    quality: 80,
                })
            };
        });
    }
    return c.json({ project });
});
// Testimonials - Public
publicRoutes.get('/testimonials', async (c) => {
    const { featured, project_id, limit = '20', offset = '0' } = c.req.query();
    // Convert string parameters to numbers
    const limitNum = parseInt(limit, 10);
    const offsetNum = parseInt(offset, 10);
    if (isNaN(limitNum) || isNaN(offsetNum)) {
        return c.json({ error: 'Invalid limit or offset parameter' }, 400);
    }
    let query = supabase
        .from('testimonials')
        .select(`
      id,
      user_name,
      comment,
      rating,
      project:projects(
        id,
        name
      ),
      user_media:media_library(
        id,
        public_id,
        url,
        alt_text
      ),
      created_at
    `)
        .order('created_at', { ascending: false })
        .range(offsetNum, offsetNum + limitNum - 1);
    if (featured === 'true') {
        query = query.limit(6); // Featured testimonials
    }
    if (project_id) {
        query = query.eq('project_id', project_id);
    }
    const { data: testimonials, error } = await query;
    if (error) {
        console.error('Testimonials fetch error:', error);
        return c.json({ error: 'Failed to fetch testimonials' }, 500);
    }
    // Add optimized URLs for user media
    const testimonialsWithOptimizedUrls = testimonials?.map(testimonial => {
        const userMediaData = testimonial.user_media;
        const userMedia = (Array.isArray(userMediaData) ? userMediaData[0] : userMediaData);
        return {
            ...testimonial,
            user_media: optimizeMedia(userMedia, {
                width: 80,
                height: 80,
                crop: 'fill',
                quality: 80,
            })
        };
    });
    return c.json({ testimonials: testimonialsWithOptimizedUrls || [] });
});
// Tips/Blog Posts - Public
publicRoutes.get('/tips', async (c) => {
    const { featured, limit = '10', offset = '0', search } = c.req.query();
    // Convert string parameters to numbers
    const limitNum = parseInt(limit, 10);
    const offsetNum = parseInt(offset, 10);
    if (isNaN(limitNum) || isNaN(offsetNum)) {
        return c.json({ error: 'Invalid limit or offset parameter' }, 400);
    }
    let query = supabase
        .from('tips')
        .select(`
      id,
      title,
      slug,
      excerpt,
      featured_media:media_library(
        id,
        public_id,
        url,
        type,
        alt_text,
        width,
        height
      ),
      author:users(
        name
      ),
      status,
      published_at,
      created_at
    `, { count: 'exact' })
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .range(offsetNum, offsetNum + limitNum - 1);
    if (featured === 'true') {
        query = query.limit(3); // Featured tips
    }
    // Search in title and content
    if (search) {
        query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
    }
    const { data: tips, error, count } = await query;
    if (error) {
        console.error('Tips fetch error:', error);
        return c.json({ error: 'Failed to fetch tips' }, 500);
    }
    // Add optimized URLs
    const tipsWithOptimizedUrls = tips?.map(tip => {
        const featuredMediaData = tip.featured_media;
        const featuredMedia = (Array.isArray(featuredMediaData) ? featuredMediaData[0] : featuredMediaData);
        return {
            ...tip,
            featured_media: optimizeMedia(featuredMedia, {
                width: 800,
                height: 450,
                crop: 'fill',
                quality: 85,
            })
        };
    });
    return c.json({
        tips: tipsWithOptimizedUrls || [],
        meta: { total: count || 0, limit: limitNum, offset: offsetNum }
    });
});
publicRoutes.get('/tips/:slug', async (c) => {
    const slug = c.req.param('slug');
    const { data: tip, error } = await supabase
        .from('tips')
        .select(`
      *,
      featured_media:media_library(
        id,
        public_id,
        url,
        type,
        alt_text,
        description,
        width,
        height,
        mime_type
      ),
      author:users(
        id,
        name,
        profile_media:media_library(
          id,
          public_id,
          url,
          alt_text
        )
      ),
      tip_media:tip_media(
        id,
        caption,
        display_order,
        media:media_library(
          id,
          public_id,
          url,
          type,
          alt_text,
          description,
          width,
          height,
          mime_type
        )
      )
    `)
        .eq('slug', slug)
        .eq('status', 'published')
        .single();
    if (error || !tip) {
        return c.json({ error: 'Tip not found' }, 404);
    }
    // Add optimized URL for featured media
    const featuredMedia = (Array.isArray(tip.featured_media) ? tip.featured_media[0] : tip.featured_media);
    tip.featured_media = optimizeMedia(featuredMedia, {
        width: 1200,
        height: 630,
        crop: 'fill',
        quality: 90,
    });
    // Optimize tip media gallery images
    if (tip.tip_media) {
        tip.tip_media = tip.tip_media.map((item) => {
            const itemMedia = (Array.isArray(item.media) ? item.media[0] : item.media);
            return {
                ...item,
                media: optimizeMedia(itemMedia, {
                    width: 1000,
                    height: 750,
                    crop: 'fill',
                    quality: 85,
                })
            };
        });
    }
    // Optimize author profile image
    if (tip.author?.profile_media) {
        const profileMedia = (Array.isArray(tip.author.profile_media) ? tip.author.profile_media[0] : tip.author.profile_media);
        tip.author.profile_media = optimizeMedia(profileMedia, {
            width: 100,
            height: 100,
            crop: 'fill',
            quality: 80,
        });
    }
    return c.json({ tip });
});
// Get related tips based on content similarity
publicRoutes.get('/tips/:slug/related', async (c) => {
    const slug = c.req.param('slug');
    const limitParam = c.req.query('limit') || '3';
    // Convert limit parameter to number
    const limitNum = parseInt(limitParam, 10);
    if (isNaN(limitNum)) {
        return c.json({ error: 'Invalid limit parameter' }, 400);
    }
    // First get the current tip
    const { data: currentTip, error: tipError } = await supabase
        .from('tips')
        .select('title, content')
        .eq('slug', slug)
        .eq('status', 'published')
        .single();
    if (tipError || !currentTip) {
        return c.json({ error: 'Tip not found' }, 404);
    }
    // Get other published tips
    const { data: tips, error } = await supabase
        .from('tips')
        .select(`
      id,
      title,
      slug,
      excerpt,
      featured_media:media_library(
        id,
        public_id,
        url,
        alt_text
      ),
      published_at
    `)
        .neq('slug', slug)
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(limitNum);
    if (error) {
        return c.json({ error: 'Failed to fetch related tips' }, 500);
    }
    // Add optimized URLs
    const tipsWithOptimizedUrls = tips?.map(tip => {
        const featuredMediaData = tip.featured_media;
        const featuredMedia = (Array.isArray(featuredMediaData) ? featuredMediaData[0] : featuredMediaData);
        return {
            ...tip,
            featured_media: optimizeMedia(featuredMedia, {
                width: 400,
                height: 225,
                crop: 'fill',
                quality: 80,
            })
        };
    });
    return c.json({ related_tips: tipsWithOptimizedUrls || [] });
});
// Landing Page Data - Combined endpoint for homepage
publicRoutes.get('/landing-data', async (c) => {
    try {
        // Fetch all data in parallel for landing page
        const [servicesResponse, cropsResponse, projectsResponse, testimonialsResponse, tipsResponse] = await Promise.all([
            supabase
                .from('services')
                .select(`
          id,
          name,
          description,
          duration_mins,
          price,
          featured_media:media_library(
            id,
            public_id,
            url,
            alt_text
          )
        `)
                .order('created_at', { ascending: false })
                .limit(6),
            supabase
                .from('crops')
                .select(`
          id,
          name,
          description,
          featured_media:media_library(
            id,
            public_id,
            url,
            alt_text
          )
        `)
                .order('created_at', { ascending: false })
                .limit(6),
            supabase
                .from('projects')
                .select(`
          id,
          name,
          description,
          featured_media:media_library(
            id,
            public_id,
            url,
            alt_text
          ),
          start_date
        `)
                .order('start_date', { ascending: false })
                .limit(3),
            supabase
                .from('testimonials')
                .select(`
          id,
          user_name,
          comment,
          rating,
          user_media:media_library(
            id,
            public_id,
            url,
            alt_text
          ),
          created_at
        `)
                .order('created_at', { ascending: false })
                .limit(6),
            supabase
                .from('tips')
                .select(`
          id,
          title,
          slug,
          excerpt,
          featured_media:media_library(
            id,
            public_id,
            url,
            alt_text
          ),
          published_at
        `)
                .eq('status', 'published')
                .order('published_at', { ascending: false })
                .limit(3)
        ]);
        // Check for errors
        if (servicesResponse.error)
            throw servicesResponse.error;
        if (cropsResponse.error)
            throw cropsResponse.error;
        if (projectsResponse.error)
            throw projectsResponse.error;
        if (testimonialsResponse.error)
            throw testimonialsResponse.error;
        if (tipsResponse.error)
            throw tipsResponse.error;
        // Process and add optimized URLs
        const landingData = {
            services: servicesResponse.data?.map(service => {
                const featuredMediaData = service.featured_media;
                const featuredMedia = (Array.isArray(featuredMediaData) ? featuredMediaData[0] : featuredMediaData);
                return {
                    ...service,
                    featured_media: optimizeMedia(featuredMedia, {
                        width: 400,
                        height: 300,
                        crop: 'fill',
                        quality: 80,
                    }),
                };
            }) || [],
            crops: cropsResponse.data?.map(crop => {
                const featuredMediaData = crop.featured_media;
                const featuredMedia = (Array.isArray(featuredMediaData) ? featuredMediaData[0] : featuredMediaData);
                return {
                    ...crop,
                    featured_media: optimizeMedia(featuredMedia, {
                        width: 400,
                        height: 300,
                        crop: 'fill',
                        quality: 80,
                    }),
                };
            }) || [],
            projects: projectsResponse.data?.map(project => {
                const featuredMediaData = project.featured_media;
                const featuredMedia = (Array.isArray(featuredMediaData) ? featuredMediaData[0] : featuredMediaData);
                return {
                    ...project,
                    featured_media: optimizeMedia(featuredMedia, {
                        width: 600,
                        height: 400,
                        crop: 'fill',
                        quality: 85,
                    }),
                };
            }) || [],
            testimonials: testimonialsResponse.data?.map(testimonial => {
                const userMediaData = testimonial.user_media;
                const userMedia = (Array.isArray(userMediaData) ? userMediaData[0] : userMediaData);
                return {
                    ...testimonial,
                    user_media: optimizeMedia(userMedia, {
                        width: 80,
                        height: 80,
                        crop: 'fill',
                        quality: 80,
                    }),
                };
            }) || [],
            tips: tipsResponse.data?.map(tip => {
                const featuredMediaData = tip.featured_media;
                const featuredMedia = (Array.isArray(featuredMediaData) ? featuredMediaData[0] : featuredMediaData);
                return {
                    ...tip,
                    featured_media: optimizeMedia(featuredMedia, {
                        width: 400,
                        height: 225,
                        crop: 'fill',
                        quality: 80,
                    }),
                };
            }) || [],
        };
        return c.json(landingData);
    }
    catch (error) {
        console.error('Landing data fetch error:', error);
        return c.json({ error: 'Failed to fetch landing page data' }, 500);
    }
});
// Search across all content
publicRoutes.get('/search', async (c) => {
    const { q, type, limit = '10', offset = '0' } = c.req.query();
    if (!q) {
        return c.json({ error: 'Search query is required' }, 400);
    }
    // Convert string parameters to numbers
    const limitNum = parseInt(limit, 10);
    const offsetNum = parseInt(offset, 10);
    if (isNaN(limitNum) || isNaN(offsetNum)) {
        return c.json({ error: 'Invalid limit or offset parameter' }, 400);
    }
    const searchQuery = `%${q}%`;
    const results = {
        services: [],
        crops: [],
        projects: [],
        tips: [],
    };
    try {
        // Search services
        if (!type || type === 'services') {
            const { data: services, error: servicesError } = await supabase
                .from('services')
                .select(`
          id,
          name,
          description,
          featured_media:media_library(
            id,
            public_id,
            url,
            alt_text
          )
        `)
                .or(`name.ilike.${searchQuery},description.ilike.${searchQuery}`)
                .range(offsetNum, offsetNum + limitNum - 1);
            if (!servicesError) {
                results.services = services?.map(service => {
                    const featuredMediaData = service.featured_media;
                    const featuredMedia = (Array.isArray(featuredMediaData) ? featuredMediaData[0] : featuredMediaData);
                    return {
                        ...service,
                        type: 'service',
                        featured_media: optimizeMedia(featuredMedia, {
                            width: 200,
                            height: 150,
                            crop: 'fill',
                            quality: 70,
                        }),
                    };
                }) || [];
            }
        }
        // Search crops
        if (!type || type === 'crops') {
            const { data: crops, error: cropsError } = await supabase
                .from('crops')
                .select(`
          id,
          name,
          description,
          featured_media:media_library(
            id,
            public_id,
            url,
            alt_text
          )
        `)
                .or(`name.ilike.${searchQuery},description.ilike.${searchQuery}`)
                .range(offsetNum, offsetNum + limitNum - 1);
            if (!cropsError) {
                results.crops = crops?.map(crop => {
                    const featuredMediaData = crop.featured_media;
                    const featuredMedia = (Array.isArray(featuredMediaData) ? featuredMediaData[0] : featuredMediaData);
                    return {
                        ...crop,
                        type: 'crop',
                        featured_media: optimizeMedia(featuredMedia, {
                            width: 200,
                            height: 150,
                            crop: 'fill',
                            quality: 70,
                        }),
                    };
                }) || [];
            }
        }
        // Search projects
        if (!type || type === 'projects') {
            const { data: projects, error: projectsError } = await supabase
                .from('projects')
                .select(`
          id,
          name,
          description,
          featured_media:media_library(
            id,
            public_id,
            url,
            alt_text
          )
        `)
                .or(`name.ilike.${searchQuery},description.ilike.${searchQuery}`)
                .range(offsetNum, offsetNum + limitNum - 1);
            if (!projectsError) {
                results.projects = projects?.map(project => {
                    const featuredMediaData = project.featured_media;
                    const featuredMedia = (Array.isArray(featuredMediaData) ? featuredMediaData[0] : featuredMediaData);
                    return {
                        ...project,
                        type: 'project',
                        featured_media: optimizeMedia(featuredMedia, {
                            width: 200,
                            height: 150,
                            crop: 'fill',
                            quality: 70,
                        }),
                    };
                }) || [];
            }
        }
        // Search tips
        if (!type || type === 'tips') {
            const { data: tips, error: tipsError } = await supabase
                .from('tips')
                .select(`
          id,
          title,
          slug,
          excerpt,
          featured_media:media_library(
            id,
            public_id,
            url,
            alt_text
          )
        `)
                .eq('status', 'published')
                .or(`title.ilike.${searchQuery},content.ilike.${searchQuery},excerpt.ilike.${searchQuery}`)
                .range(offsetNum, offsetNum + limitNum - 1);
            if (!tipsError) {
                results.tips = tips?.map(tip => {
                    const featuredMediaData = tip.featured_media;
                    const featuredMedia = (Array.isArray(featuredMediaData) ? featuredMediaData[0] : featuredMediaData);
                    return {
                        ...tip,
                        type: 'tip',
                        featured_media: optimizeMedia(featuredMedia, {
                            width: 200,
                            height: 150,
                            crop: 'fill',
                            quality: 70,
                        }),
                    };
                }) || [];
            }
        }
        // Calculate total results
        const totalResults = results.services.length +
            results.crops.length +
            results.projects.length +
            results.tips.length;
        return c.json({
            query: q,
            results,
            meta: {
                total: totalResults,
                services: results.services.length,
                crops: results.crops.length,
                projects: results.projects.length,
                tips: results.tips.length,
                limit: limitNum,
                offset: offsetNum,
            }
        });
    }
    catch (error) {
        console.error('Search error:', error);
        return c.json({ error: 'Search failed' }, 500);
    }
});
// Get homepage hero/featured content
publicRoutes.get('/homepage/hero', async (c) => {
    try {
        // Get featured services (you might want to add a 'featured' field to services)
        const { data: featuredServices, error: servicesError } = await supabase
            .from('services')
            .select(`
        id,
        name,
        description,
        price,
        featured_media:media_library(
          id,
          public_id,
          url,
          alt_text
        )
      `)
            .order('created_at', { ascending: false })
            .limit(3);
        if (servicesError)
            throw servicesError;
        // Get latest tip
        const { data: latestTip, error: tipError } = await supabase
            .from('tips')
            .select(`
        id,
        title,
        slug,
        excerpt,
        featured_media:media_library(
          id,
          public_id,
          url,
          alt_text
        ),
        published_at
      `)
            .eq('status', 'published')
            .order('published_at', { ascending: false })
            .limit(1)
            .single();
        if (tipError && tipError.code !== 'PGRST116')
            throw tipError;
        // Add optimized URLs
        const heroData = {
            featured_services: featuredServices?.map(service => {
                const featuredMediaData = service.featured_media;
                const featuredMedia = (Array.isArray(featuredMediaData) ? featuredMediaData[0] : featuredMediaData);
                return {
                    ...service,
                    featured_media: optimizeMedia(featuredMedia, {
                        width: 600,
                        height: 400,
                        crop: 'fill',
                        quality: 85,
                    }),
                };
            }) || [],
            latest_tip: latestTip ? (() => {
                const featuredMediaData = latestTip.featured_media;
                const featuredMedia = (Array.isArray(featuredMediaData) ? featuredMediaData[0] : featuredMediaData);
                return {
                    ...latestTip,
                    featured_media: optimizeMedia(featuredMedia, {
                        width: 800,
                        height: 450,
                        crop: 'fill',
                        quality: 90,
                    }),
                };
            })() : null,
        };
        return c.json(heroData);
    }
    catch (error) {
        console.error('Hero data fetch error:', error);
        return c.json({ error: 'Failed to fetch hero content' }, 500);
    }
});
// Get stats for homepage
publicRoutes.get('/stats', async (c) => {
    try {
        const [servicesCount, projectsCount, testimonialsCount, tipsCount, bookingsCount] = await Promise.all([
            supabase.from('services').select('*', { count: 'exact', head: true }),
            supabase.from('projects').select('*', { count: 'exact', head: true }),
            supabase.from('testimonials').select('*', { count: 'exact', head: true }),
            supabase.from('tips').select('*', { count: 'exact', head: true }).eq('status', 'published'),
            supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'completed')
        ]);
        return c.json({
            stats: {
                services: servicesCount.count || 0,
                projects: projectsCount.count || 0,
                testimonials: testimonialsCount.count || 0,
                tips: tipsCount.count || 0,
                consultations_completed: bookingsCount.count || 0,
            }
        });
    }
    catch (error) {
        console.error('Stats fetch error:', error);
        return c.json({ error: 'Failed to fetch statistics' }, 500);
    }
});
//# sourceMappingURL=public.js.map