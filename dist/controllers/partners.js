import { supabase } from '../db/supabaseClient.js';
import { partnerSchema } from '../utils/validation.js';
import { optimizeMedia } from '../utils/media.js';
export class PartnersController {
    // Public: Get all active partners
    static async getActivePartners(c) {
        try {
            const { data: partners, error } = await supabase
                .from('partners')
                .select(`
          *,
          logo:media_library(*)
        `)
                .eq('is_active', true)
                .order('name', { ascending: true });
            if (error)
                throw error;
            // Optimize logos
            const partnersWithOptimizedLogos = partners?.map((partner) => {
                const logoData = partner.logo;
                const logo = (Array.isArray(logoData) ? logoData[0] : logoData);
                return {
                    ...partner,
                    logo: optimizeMedia(logo, {
                        width: 300,
                        height: 300,
                        crop: 'fit',
                        quality: 80,
                    })
                };
            });
            return c.json({ partners: partnersWithOptimizedLogos || [] });
        }
        catch (error) {
            console.error('Get active partners error:', error);
            return c.json({ error: 'Failed to fetch partners' }, 500);
        }
    }
    // Public: Get featured active partners
    static async getFeaturedPartners(c) {
        try {
            const { data: partners, error } = await supabase
                .from('partners')
                .select(`
          *,
          logo:media_library(*)
        `)
                .eq('is_active', true)
                .eq('is_featured', true)
                .order('name', { ascending: true });
            if (error)
                throw error;
            // Optimize logos
            const partnersWithOptimizedLogos = partners?.map((partner) => {
                const logoData = partner.logo;
                const logo = (Array.isArray(logoData) ? logoData[0] : logoData);
                return {
                    ...partner,
                    logo: optimizeMedia(logo, {
                        width: 400,
                        height: 400,
                        crop: 'fit',
                        quality: 85,
                    })
                };
            });
            return c.json({ partners: partnersWithOptimizedLogos || [] });
        }
        catch (error) {
            console.error('Get featured partners error:', error);
            return c.json({ error: 'Failed to fetch featured partners' }, 500);
        }
    }
    // Admin: Get all partners
    static async getAllPartners(c) {
        try {
            const user = c.get('user');
            if (user.role !== 'admin') {
                return c.json({ error: 'Admin access required' }, 403);
            }
            const { data: partners, error } = await supabase
                .from('partners')
                .select(`
          *,
          logo:media_library(*)
        `)
                .order('created_at', { ascending: false });
            if (error)
                throw error;
            return c.json({ partners });
        }
        catch (error) {
            console.error('Admin get partners error:', error);
            return c.json({ error: 'Failed to fetch partners' }, 500);
        }
    }
    static async createPartner(c) {
        try {
            const user = c.get('user');
            if (user.role !== 'admin') {
                return c.json({ error: 'Admin access required' }, 403);
            }
            const body = await c.req.json();
            const validated = partnerSchema.parse(body);
            const { data: partner, error } = await supabase
                .from('partners')
                .insert(validated)
                .select()
                .single();
            if (error)
                throw error;
            return c.json({ partner }, 201);
        }
        catch (error) {
            console.error('Create partner error:', error);
            return c.json({ error: 'Failed to create partner' }, 400);
        }
    }
    static async updatePartner(c) {
        try {
            const user = c.get('user');
            if (user.role !== 'admin') {
                return c.json({ error: 'Admin access required' }, 403);
            }
            const id = c.req.param('id');
            const body = await c.req.json();
            const validated = partnerSchema.partial().parse(body);
            const { data: partner, error } = await supabase
                .from('partners')
                .update(validated)
                .eq('id', id)
                .select()
                .single();
            if (error)
                throw error;
            if (!partner) {
                return c.json({ error: 'Partner not found' }, 404);
            }
            return c.json({ partner });
        }
        catch (error) {
            console.error('Update partner error:', error);
            return c.json({ error: 'Failed to update partner' }, 400);
        }
    }
    static async deletePartner(c) {
        try {
            const user = c.get('user');
            if (user.role !== 'admin') {
                return c.json({ error: 'Admin access required' }, 403);
            }
            const id = c.req.param('id');
            const { error } = await supabase
                .from('partners')
                .delete()
                .eq('id', id);
            if (error)
                throw error;
            return c.json({ message: 'Partner deleted successfully' });
        }
        catch (error) {
            console.error('Delete partner error:', error);
            return c.json({ error: 'Failed to delete partner' }, 500);
        }
    }
}
//# sourceMappingURL=partners.js.map