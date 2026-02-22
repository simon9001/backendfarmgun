-- Fix permissions for blogs and tips tables
-- Grant necessary permissions to service_role (used by backend), authenticated (used by frontend admin), and anon (used by public readers)

-- Grant usage on public schema just in case
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Tables to fix
-- blogs, tips, blog_media, tip_media

-- Blogs permissions
GRANT ALL ON TABLE public.blogs TO service_role;
GRANT ALL ON TABLE public.blogs TO postgres;
GRANT SELECT ON TABLE public.blogs TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.blogs TO authenticated;

-- Tips permissions
GRANT ALL ON TABLE public.tips TO service_role;
GRANT ALL ON TABLE public.tips TO postgres;
GRANT SELECT ON TABLE public.tips TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.tips TO authenticated;

-- Blog Media permissions
GRANT ALL ON TABLE public.blog_media TO service_role;
GRANT ALL ON TABLE public.blog_media TO postgres;
GRANT SELECT ON TABLE public.blog_media TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.blog_media TO authenticated;

-- Tip Media permissions
GRANT ALL ON TABLE public.tip_media TO service_role;
GRANT ALL ON TABLE public.tip_media TO postgres;
GRANT SELECT ON TABLE public.tip_media TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.tip_media TO authenticated;

-- Ensure RLS is disabled or correctly configured (enabling it and adding policies is safer, but for now we grant access)
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tip_media ENABLE ROW LEVEL SECURITY;

-- Add policies for public reading
DROP POLICY IF EXISTS "Public can read published blogs" ON public.blogs;
CREATE POLICY "Public can read published blogs" ON public.blogs
FOR SELECT USING (status = 'published');

DROP POLICY IF EXISTS "Admins can do everything on blogs" ON public.blogs;
CREATE POLICY "Admins can do everything on blogs" ON public.blogs
FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Public can read published tips" ON public.tips;
CREATE POLICY "Public can read published tips" ON public.tips
FOR SELECT USING (status = 'published');

DROP POLICY IF EXISTS "Admins can do everything on tips" ON public.tips;
CREATE POLICY "Admins can do everything on tips" ON public.tips
FOR ALL TO authenticated USING (true);

-- Repeat for media extensions if needed
DROP POLICY IF EXISTS "Public can read blog media" ON public.blog_media;
CREATE POLICY "Public can read blog media" ON public.blog_media
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage blog media" ON public.blog_media;
CREATE POLICY "Admins can manage blog media" ON public.blog_media
FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Public can read tip media" ON public.tip_media;
CREATE POLICY "Public can read tip media" ON public.tip_media
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage tip media" ON public.tip_media;
CREATE POLICY "Admins can manage tip media" ON public.tip_media
FOR ALL TO authenticated USING (true);
