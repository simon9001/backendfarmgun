import { Hono } from 'hono';
import RateLimit from 'hono-rate-limit';
import { supabase } from '../db/supabaseClient.js';
// import { CloudinaryService } from '../utils/cloudinary.js';
import { optimizeMedia, FeaturedMedia } from '../utils/media.js';
import { AdminController } from '../controllers/admin.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

export const publicRoutes = new Hono();




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
      tagline,
      description,
      what_get,
      pricing_options,
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
    const featuredMediaData = service.featured_media as any;
    const featuredMedia = (Array.isArray(featuredMediaData) ? featuredMediaData[0] : featuredMediaData) as FeaturedMedia | null;

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
  const featuredMediaData = service.featured_media as any;
  const featuredMedia = (Array.isArray(featuredMediaData) ? featuredMediaData[0] : featuredMediaData) as FeaturedMedia | null;

  service.featured_media = optimizeMedia(featuredMedia, {
    width: 800,
    height: 600,
    crop: 'fill',
    quality: 85,
  }) as any;

  // Optimize crop images
  if (service.service_crops) {
    service.service_crops = service.service_crops.map((crop: any) => {
      const cropFeaturedMediaData = crop.featured_media as any;
      const cropFeaturedMedia = (Array.isArray(cropFeaturedMediaData) ? cropFeaturedMediaData[0] : cropFeaturedMediaData) as FeaturedMedia | null;

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
    const featuredMediaData = crop.featured_media as any;
    const featuredMedia = (Array.isArray(featuredMediaData) ? featuredMediaData[0] : featuredMediaData) as FeaturedMedia | null;

    const optimizedCrop: any = {
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
      optimizedCrop.crop_media = optimizedCrop.crop_media.map((item: any) => {
        const itemMedia = (Array.isArray(item.media) ? item.media[0] : item.media) as FeaturedMedia | null;
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
  const featuredMediaData = crop.featured_media as any;
  const featuredMedia = (Array.isArray(featuredMediaData) ? featuredMediaData[0] : featuredMediaData) as FeaturedMedia | null;

  crop.featured_media = optimizeMedia(featuredMedia, {
    width: 800,
    height: 500,
    crop: 'fill',
    quality: 85,
  }) as any;

  // Optimize gallery images
  if (crop.crop_media) {
    crop.crop_media = crop.crop_media.map((item: any) => {
      const itemMedia = (Array.isArray(item.media) ? item.media[0] : item.media) as FeaturedMedia | null;
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
    crop.service_crops = crop.service_crops.map((service: any) => {
      const serviceFeaturedMediaData = service.featured_media as any;
      const serviceFeaturedMedia = (Array.isArray(serviceFeaturedMediaData) ? serviceFeaturedMediaData[0] : serviceFeaturedMediaData) as FeaturedMedia | null;

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
      project_media:project_media(
        id,
        display_order,
        media:media_library(*)
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
    const featuredMediaData = project.featured_media as any;
    const featuredMedia = (Array.isArray(featuredMediaData) ? featuredMediaData[0] : featuredMediaData) as FeaturedMedia | null;

    const optimizedProject: any = {
      ...project,
      featured_media: optimizeMedia(featuredMedia, {
        width: 800,
        height: 450,
        crop: 'fill',
        quality: 85,
      })
    };

    // Optimize gallery images
    if (optimizedProject.project_media) {
      optimizedProject.project_media = optimizedProject.project_media.map((item: any) => {
        const itemMedia = (Array.isArray(item.media) ? item.media[0] : item.media) as FeaturedMedia | null;
        return {
          ...item,
          media: optimizeMedia(itemMedia, {
            width: 800,
            height: 450,
            crop: 'fill',
            quality: 80,
          })
        };
      });
    }

    return optimizedProject;
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
  const featuredMediaData = project.featured_media as any;
  const featuredMedia = (Array.isArray(featuredMediaData) ? featuredMediaData[0] : featuredMediaData) as FeaturedMedia | null;

  project.featured_media = optimizeMedia(featuredMedia, {
    width: 1200,
    height: 675,
    crop: 'fill',
    quality: 90,
  }) as any;

  // Optimize project media gallery images
  if (project.project_media) {
    project.project_media = project.project_media.map((item: any) => {
      const itemMedia = (Array.isArray(item.media) ? item.media[0] : item.media) as FeaturedMedia | null;
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
    project.testimonials = project.testimonials.map((testimonial: any) => {
      const userMediaData = testimonial.user_media as any;
      const userMedia = (Array.isArray(userMediaData) ? userMediaData[0] : userMediaData) as FeaturedMedia | null;

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
    const userMediaData = testimonial.user_media as any;
    const userMedia = (Array.isArray(userMediaData) ? userMediaData[0] : userMediaData) as FeaturedMedia | null;

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

publicRoutes.post('/testimonials', authMiddleware, AdminController.createTestimonial);

// Tips/Blog Posts - Public
publicRoutes.get('/tips', async (c) => {
  const {
    featured,
    limit = '10',
    offset = '0',
    search
  } = c.req.query();

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
    const featuredMediaData = tip.featured_media as any;
    const featuredMedia = (Array.isArray(featuredMediaData) ? featuredMediaData[0] : featuredMediaData) as FeaturedMedia | null;

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
  const featuredMedia = (Array.isArray(tip.featured_media) ? tip.featured_media[0] : tip.featured_media) as FeaturedMedia | null;
  tip.featured_media = optimizeMedia(featuredMedia, {
    width: 1200,
    height: 630,
    crop: 'fill',
    quality: 90,
  }) as any;

  // Optimize tip media gallery images
  if (tip.tip_media) {
    tip.tip_media = tip.tip_media.map((item: any) => {
      const itemMedia = (Array.isArray(item.media) ? item.media[0] : item.media) as FeaturedMedia | null;
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
    const profileMedia = (Array.isArray(tip.author.profile_media) ? tip.author.profile_media[0] : tip.author.profile_media) as FeaturedMedia | null;
    tip.author.profile_media = optimizeMedia(profileMedia, {
      width: 100,
      height: 100,
      crop: 'fill',
      quality: 80,
    }) as any;
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
    const featuredMediaData = tip.featured_media as any;
    const featuredMedia = (Array.isArray(featuredMediaData) ? featuredMediaData[0] : featuredMediaData) as FeaturedMedia | null;

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

// Blogs - Public
publicRoutes.get('/blogs', async (c) => {
  const { category, featured, limit = '24', offset = '0' } = c.req.query();

  const limitNum = parseInt(limit, 10);
  const offsetNum = parseInt(offset, 10);

  let query = supabase
    .from('blogs')
    .select(`
    *,
    featured_media:media_library(*),
    author:users(name)
  `, { count: 'exact' })
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .range(offsetNum, offsetNum + limitNum - 1);

  if (category) {
    query = query.eq('category', category);
  }

  if (featured === 'true') {
    query = query.limit(3);
  }

  const { data: blogs, error, count } = await query;

  if (error) {
    console.error('Blogs fetch error:', error);
    return c.json({ error: 'Failed to fetch blogs' }, 500);
  }

  const blogsWithOptimizedUrls = blogs?.map(blog => {
    return {
      ...blog,
      featured_media: optimizeMedia(blog.featured_media as any, {
        width: 800,
        height: 600,
        quality: 80,
      })
    };
  });

  return c.json({
    blogs: blogsWithOptimizedUrls || [],
    meta: { count: count || 0, limit: limitNum, offset: offsetNum }
  });
});

publicRoutes.get('/blogs/:slug', async (c) => {
  const slug = c.req.param('slug');

  const { data: blog, error } = await supabase
    .from('blogs')
    .select(`
    *,
    featured_media:media_library(*),
    author:users(name, role, profile_media:media_library(*)),
    blog_media:blog_media(
      media:media_library(*)
    )
  `)
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (error || !blog) {
    return c.json({ error: 'Blog not found' }, 404);
  }

  return c.json({
    blog: {
      ...blog,
      featured_media: optimizeMedia(blog.featured_media as any, { quality: 90 })
    }
  });
});

publicRoutes.get('/blogs/:slug/related', async (c) => {
  const slug = c.req.param('slug');

  const { data: currentBlog } = await supabase
    .from('blogs')
    .select('id, category')
    .eq('slug', slug)
    .single();

  if (!currentBlog) return c.json({ related_blogs: [] });

  const { data: blogs, error } = await supabase
    .from('blogs')
    .select(`
    *,
    featured_media:media_library(*),
    author:users(name)
  `)
    .eq('status', 'published')
    .eq('category', currentBlog.category)
    .neq('id', currentBlog.id)
    .limit(3);

  if (error) {
    return c.json({ error: 'Failed to fetch related blogs' }, 500);
  }

  const blogsWithOptimizedUrls = blogs?.map(blog => ({
    ...blog,
    featured_media: optimizeMedia(blog.featured_media as any, {
      width: 400,
      height: 300,
      quality: 70
    })
  }));

  return c.json({ related_blogs: blogsWithOptimizedUrls || [] });
});

// Landing Page Data - Combined endpoint for homepage
publicRoutes.get('/landing-data', async (c) => {
  try {
    // Fetch all data in parallel for landing page
    const [
      servicesResponse,
      cropsResponse,
      projectsResponse,
      testimonialsResponse,
      tipsResponse
    ] = await Promise.all([
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
    if (servicesResponse.error) throw servicesResponse.error;
    if (cropsResponse.error) throw cropsResponse.error;
    if (projectsResponse.error) throw projectsResponse.error;
    if (testimonialsResponse.error) throw testimonialsResponse.error;
    if (tipsResponse.error) throw tipsResponse.error;

    // Process and add optimized URLs
    const landingData = {
      services: servicesResponse.data?.map(service => {
        const featuredMediaData = service.featured_media as any;
        const featuredMedia = (Array.isArray(featuredMediaData) ? featuredMediaData[0] : featuredMediaData) as FeaturedMedia | null;
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
        const featuredMediaData = crop.featured_media as any;
        const featuredMedia = (Array.isArray(featuredMediaData) ? featuredMediaData[0] : featuredMediaData) as FeaturedMedia | null;
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
        const featuredMediaData = project.featured_media as any;
        const featuredMedia = (Array.isArray(featuredMediaData) ? featuredMediaData[0] : featuredMediaData) as FeaturedMedia | null;
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
        const userMediaData = testimonial.user_media as any;
        const userMedia = (Array.isArray(userMediaData) ? userMediaData[0] : userMediaData) as FeaturedMedia | null;
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
        const featuredMediaData = tip.featured_media as any;
        const featuredMedia = (Array.isArray(featuredMediaData) ? featuredMediaData[0] : featuredMediaData) as FeaturedMedia | null;
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
  } catch (error) {
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
  const results: any = {
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
          const featuredMediaData = service.featured_media as any;
          const featuredMedia = (Array.isArray(featuredMediaData) ? featuredMediaData[0] : featuredMediaData) as FeaturedMedia | null;
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
          const featuredMediaData = crop.featured_media as any;
          const featuredMedia = (Array.isArray(featuredMediaData) ? featuredMediaData[0] : featuredMediaData) as FeaturedMedia | null;
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
          const featuredMediaData = project.featured_media as any;
          const featuredMedia = (Array.isArray(featuredMediaData) ? featuredMediaData[0] : featuredMediaData) as FeaturedMedia | null;
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
          const featuredMediaData = tip.featured_media as any;
          const featuredMedia = (Array.isArray(featuredMediaData) ? featuredMediaData[0] : featuredMediaData) as FeaturedMedia | null;
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
    const totalResults =
      results.services.length +
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
  } catch (error) {
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

    if (servicesError) throw servicesError;

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

    if (tipError && tipError.code !== 'PGRST116') throw tipError;

    // Add optimized URLs
    const heroData = {
      featured_services: featuredServices?.map(service => {
        const featuredMediaData = service.featured_media as any;
        const featuredMedia = (Array.isArray(featuredMediaData) ? featuredMediaData[0] : featuredMediaData) as FeaturedMedia | null;
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
        const featuredMediaData = latestTip.featured_media as any;
        const featuredMedia = (Array.isArray(featuredMediaData) ? featuredMediaData[0] : featuredMediaData) as FeaturedMedia | null;
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
  } catch (error) {
    console.error('Hero data fetch error:', error);
    return c.json({ error: 'Failed to fetch hero content' }, 500);
  }
});

// Get stats for homepage
publicRoutes.get('/stats', async (c) => {
  try {
    const [
      servicesCount,
      projectsCount,
      testimonialsCount,
      tipsCount,
      bookingsCount,
      partnersCount
    ] = await Promise.all([
      supabase.from('services').select('*', { count: 'exact', head: true }),
      supabase.from('projects').select('*', { count: 'exact', head: true }),
      supabase.from('testimonials').select('*', { count: 'exact', head: true }),
      supabase.from('tips').select('*', { count: 'exact', head: true }).eq('status', 'published'),
      supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
      supabase.from('partners').select('*', { count: 'exact', head: true }).eq('is_active', true)
    ]);

    return c.json({
      stats: {
        services: servicesCount.count || 0,
        projects: projectsCount.count || 0,
        testimonials: testimonialsCount.count || 0,
        tips: tipsCount.count || 0,
        consultations_completed: bookingsCount.count || 0,
        partners: partnersCount.count || 0,
      }
    });

  } catch (error) {
    console.error('Stats fetch error:', error);
    return c.json({ error: 'Failed to fetch statistics' }, 500);
  }
});

// Crop Prices - Public, open to all origins, rate limited against DDoS
const cropPricesLimiter = RateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  message: JSON.stringify({ error: 'Too many requests, please slow down.' }),
  statusCode: 429,
});

publicRoutes.get('/crop-prices', cropPricesLimiter, async (c) => {
  c.header('Access-Control-Allow-Origin', '*');
  c.header('Access-Control-Allow-Methods', 'GET');

  const { date, limit = '50', offset = '0', format } = c.req.query();

  const limitNum  = parseInt(limit,  10);
  const offsetNum = parseInt(offset, 10);

  if (isNaN(limitNum) || limitNum < 1 || limitNum > 200 || isNaN(offsetNum) || offsetNum < 0) {
    return c.json({ error: 'Invalid pagination parameters' }, 400);
  }

  const priceDate = date && /^\d{4}-\d{2}-\d{2}$/.test(date)
    ? date
    : new Date().toISOString().split('T')[0];

  const COLS = `id, crop_name, price_per_unit, unit, market, price_date, price_change, commentary, outlook, created_at`;

  const { data: prices, error } = await supabase
    .from('crop_prices')
    .select(COLS)
    .eq('price_date', priceDate)
    .order('crop_name', { ascending: true })
    .range(offsetNum, offsetNum + limitNum - 1);

  if (error) {
    console.error('Crop prices fetch error:', error);
    return c.json({ error: 'Failed to fetch crop prices' }, 500);
  }

  let finalPrices  = prices || [];
  let finalDate    = priceDate;
  let isLatest     = false;

  if (finalPrices.length === 0 && !date) {
    const { data: latestPrices, error: latestError } = await supabase
      .from('crop_prices')
      .select(COLS)
      .order('price_date', { ascending: false })
      .order('crop_name',  { ascending: true })
      .limit(limitNum);

    if (latestError) return c.json({ error: 'Failed to fetch crop prices' }, 500);
    finalPrices = latestPrices || [];
    finalDate   = finalPrices[0]?.price_date ?? null;
    isLatest    = true;
  }

  // ── Content negotiation ──────────────────────────────────────────────────
  const wantsHtml = format !== 'json' &&
    (c.req.header('Accept') ?? '').includes('text/html');

  if (!wantsHtml) {
    return c.json({
      prices: finalPrices,
      price_date: finalDate,
      meta: { count: finalPrices.length, is_latest_available: isLatest }
    });
  }

  // ── Build HTML ───────────────────────────────────────────────────────────
  const esc = (s: unknown) =>
    String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

  const commentary = finalPrices.find((p: any) => p.commentary)?.commentary ?? '';
  const outlook    = finalPrices.find((p: any) => p.outlook)?.outlook       ?? '';
  const sorted     = [...finalPrices].sort((a: any, b: any) => b.price_per_unit - a.price_per_unit);
  const highest    = sorted[0]       as any;
  const lowest     = sorted[sorted.length - 1] as any;
  const withChange = finalPrices.filter((p: any) => p.price_change !== null && p.price_change !== undefined) as any[];
  const bigMover   = withChange.length
    ? withChange.reduce((a: any, b: any) => Math.abs(a.price_change) > Math.abs(b.price_change) ? a : b)
    : null;

  const displayDate = finalDate
    ? new Date(finalDate + 'T12:00:00').toLocaleDateString('en-KE', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      })
    : '—';

  const jsonUrl = c.req.url.includes('?') ? c.req.url + '&format=json' : c.req.url + '?format=json';

  const changePill = (p: any) => {
    if (p.price_change === null || p.price_change === undefined) return '';
    const v = Number(p.price_change);
    const label = (v > 0 ? '+' : '') + v.toFixed(1) + '%';
    const icon  = v > 0 ? '▲' : v < 0 ? '▼' : '●';
    const cls   = v > 0 ? 'up' : v < 0 ? 'down' : 'flat';
    return `<span class="badge ${cls}">${icon} ${esc(label)}</span>`;
  };

  const priceCards = finalPrices.map((p: any) => `
    <div class="card">
      <div class="card-top">
        <span class="crop-name">${esc(p.crop_name)}</span>
        ${changePill(p)}
      </div>
      <div class="price">KES ${Number(p.price_per_unit).toLocaleString()}<span class="unit"> / ${esc(p.unit)}</span></div>
      <div class="market">📍 ${esc(p.market)}</div>
    </div>`).join('');

  const statCards = highest && lowest ? `
    <div class="stat-grid">
      <div class="stat"><div class="stat-label">Highest Price</div>
        <div class="stat-crop">${esc(highest.crop_name)}</div>
        <div class="stat-value green">KES ${Number(highest.price_per_unit).toLocaleString()} / ${esc(highest.unit)}</div>
      </div>
      <div class="stat"><div class="stat-label">Lowest Price</div>
        <div class="stat-crop">${esc(lowest.crop_name)}</div>
        <div class="stat-value blue">KES ${Number(lowest.price_per_unit).toLocaleString()} / ${esc(lowest.unit)}</div>
      </div>
      ${bigMover ? `<div class="stat"><div class="stat-label">Biggest Mover</div>
        <div class="stat-crop">${esc(bigMover.crop_name)}</div>
        <div class="stat-value ${bigMover.price_change > 0 ? 'green' : 'red'}">${bigMover.price_change > 0 ? '+' : ''}${Number(bigMover.price_change).toFixed(1)}% today</div>
      </div>` : ''}
    </div>` : '';

  const commentaryBlock = commentary ? `
    <div class="insight-box green-box">
      <div class="insight-label">💬 What Caused These Prices</div>
      <p>${esc(commentary)}</p>
    </div>` : '';

  const outlookBlock = outlook ? `
    <div class="insight-box teal-box">
      <div class="insight-label">🔭 What to Expect Next</div>
      <p>${esc(outlook)}</p>
    </div>` : '';

  const noDataMsg = finalPrices.length === 0
    ? `<div class="no-data">No prices have been posted yet. Check back soon.</div>`
    : '';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Farm with Irene — Market Prices</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #07100a;
      color: #d1fae5;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      min-height: 100vh;
      padding-bottom: 3rem;
    }
    a { color: #4ade80; }

    /* ── Top bar ── */
    .topbar {
      background: linear-gradient(135deg, #052e16 0%, #0a1f0f 100%);
      border-bottom: 1px solid rgba(74,222,128,.12);
      padding: 1.25rem 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .logo { font-size: 1.1rem; font-weight: 800; color: #4ade80; letter-spacing: -.02em; }
    .logo span { color: #86efac; font-weight: 400; }
    .live-badge {
      display: inline-flex; align-items: center; gap: .45rem;
      background: rgba(74,222,128,.1); border: 1px solid rgba(74,222,128,.25);
      color: #4ade80; font-size: .7rem; font-weight: 700;
      padding: .3rem .75rem; border-radius: 9999px; letter-spacing: .08em;
    }
    .live-dot {
      width: 7px; height: 7px; border-radius: 50%; background: #4ade80;
      animation: ping 1.4s ease-in-out infinite;
    }
    @keyframes ping { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.5)} }
    .json-btn {
      background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.12);
      color: #94a3b8; font-size: .72rem; font-weight: 600;
      padding: .35rem .85rem; border-radius: .5rem; cursor: pointer;
      text-decoration: none; transition: all .2s;
    }
    .json-btn:hover { background: rgba(255,255,255,.1); color: #e2e8f0; }

    /* ── Hero date strip ── */
    .date-strip {
      text-align: center; padding: 2.5rem 1rem 1.5rem;
    }
    .date-strip .eyebrow {
      font-size: .7rem; font-weight: 700; letter-spacing: .12em;
      color: rgba(74,222,128,.6); text-transform: uppercase; margin-bottom: .5rem;
    }
    .date-strip h1 {
      font-size: clamp(1.4rem, 4vw, 2.2rem); font-weight: 900;
      color: #f0fdf4; letter-spacing: -.03em;
    }
    .date-strip .sub {
      margin-top: .35rem; font-size: .82rem; color: rgba(209,250,229,.4);
    }

    /* ── Container ── */
    .wrap { max-width: 960px; margin: 0 auto; padding: 0 1rem; }

    /* ── Stat grid ── */
    .stat-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: .75rem; margin-bottom: 2rem;
    }
    .stat {
      background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.07);
      border-radius: 1rem; padding: 1rem 1.25rem;
    }
    .stat-label { font-size: .65rem; font-weight: 700; letter-spacing: .1em;
      color: rgba(209,250,229,.4); text-transform: uppercase; margin-bottom: .4rem; }
    .stat-crop  { font-size: 1.05rem; font-weight: 800; color: #f0fdf4; margin-bottom: .2rem; }
    .stat-value { font-size: .85rem; font-weight: 700; }
    .green { color: #4ade80; }
    .blue  { color: #60a5fa; }
    .red   { color: #f87171; }

    /* ── Price cards ── */
    .card-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
      gap: .75rem; margin-bottom: 2rem;
    }
    .card {
      background: rgba(255,255,255,.035); border: 1px solid rgba(255,255,255,.07);
      border-radius: 1rem; padding: 1rem 1.1rem;
      transition: background .2s, border-color .2s, transform .15s;
    }
    .card:hover { background: rgba(74,222,128,.06); border-color: rgba(74,222,128,.2); transform: translateY(-2px); }
    .card-top { display: flex; align-items: flex-start; justify-content: space-between; gap: .5rem; margin-bottom: .6rem; }
    .crop-name { font-size: .9rem; font-weight: 700; color: #f0fdf4; line-height: 1.3; }
    .price { font-size: 1.35rem; font-weight: 900; color: #4ade80; margin-bottom: .45rem; }
    .unit  { font-size: .8rem; font-weight: 400; color: rgba(209,250,229,.4); }
    .market { font-size: .7rem; color: rgba(209,250,229,.35); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    /* ── Change badges ── */
    .badge {
      display: inline-flex; align-items: center; gap: .2rem;
      font-size: .68rem; font-weight: 800; padding: .22rem .55rem;
      border-radius: 9999px; white-space: nowrap; border: 1px solid transparent;
      flex-shrink: 0;
    }
    .badge.up   { background: rgba(74,222,128,.15); color: #4ade80; border-color: rgba(74,222,128,.25); }
    .badge.down { background: rgba(248,113,113,.15); color: #f87171; border-color: rgba(248,113,113,.25); }
    .badge.flat { background: rgba(255,255,255,.08);  color: #94a3b8; border-color: rgba(255,255,255,.1); }

    /* ── Insight boxes ── */
    .insights { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px,1fr)); gap: .75rem; margin-bottom: 2rem; }
    .insight-box { border-radius: 1rem; padding: 1.25rem 1.4rem; border: 1px solid; }
    .green-box { background: rgba(74,222,128,.05); border-color: rgba(74,222,128,.15); }
    .teal-box  { background: rgba(52,211,153,.05);  border-color: rgba(52,211,153,.15); }
    .insight-label {
      font-size: .68rem; font-weight: 800; letter-spacing: .1em;
      text-transform: uppercase; margin-bottom: .65rem;
    }
    .green-box .insight-label { color: #4ade80; }
    .teal-box  .insight-label { color: #34d399; }
    .insight-box p { font-size: .82rem; line-height: 1.7; color: rgba(209,250,229,.65); }

    /* ── No data ── */
    .no-data {
      text-align: center; padding: 4rem 1rem;
      color: rgba(209,250,229,.3); font-size: .9rem;
    }

    /* ── Footer ── */
    .footer {
      margin-top: 3rem; padding: 1.25rem 1rem;
      border-top: 1px solid rgba(255,255,255,.06);
      text-align: center;
      font-size: .72rem; color: rgba(209,250,229,.25);
    }
    .footer a { color: rgba(74,222,128,.5); }

    /* ── Divider ── */
    .section-label {
      font-size: .65rem; font-weight: 800; letter-spacing: .12em;
      color: rgba(209,250,229,.3); text-transform: uppercase;
      margin-bottom: .85rem;
    }
    .divider { height: 1px; background: rgba(255,255,255,.06); margin: 1.75rem 0; }
  </style>
</head>
<body>

  <!-- Top bar -->
  <div class="topbar">
    <div class="logo">Farm with Irene <span>· Market Prices</span></div>
    <div style="display:flex;align-items:center;gap:.75rem;flex-wrap:wrap;">
      <span class="live-badge"><span class="live-dot"></span> Live Data</span>
      <a class="json-btn" href="${esc(jsonUrl)}">{} View as JSON</a>
    </div>
  </div>

  <!-- Date hero -->
  <div class="date-strip">
    <div class="eyebrow">Daily Crop Market Prices</div>
    <h1>${esc(displayDate)}</h1>
    <div class="sub">${finalPrices.length} crops · ${isLatest ? 'Latest available data' : 'Today\'s prices'}</div>
  </div>

  <div class="wrap">

    ${noDataMsg}

    ${finalPrices.length > 0 ? `
      <!-- Summary stats -->
      ${statCards}

      <!-- Price cards -->
      <div class="section-label">All Crops</div>
      <div class="card-grid">${priceCards}</div>

      ${commentary || outlook ? `<div class="divider"></div>
      <div class="insights">${commentaryBlock}${outlookBlock}</div>` : ''}
    ` : ''}

  </div>

  <div class="footer">
    Data provided by Farm with Irene &nbsp;·&nbsp;
    <a href="${esc(jsonUrl)}">JSON endpoint</a> &nbsp;·&nbsp;
    Updated daily by the admin
  </div>

</body>
</html>`;

  return c.html(html);
});