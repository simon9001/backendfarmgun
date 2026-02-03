import { Context } from 'hono';
import { supabase } from '../db/supabaseClient.js';
import { serviceSchema, cropSchema } from '../utils/validation.js';

export class ServicesController {
  static async getAllServices(c: Context) {
    try {
      const { data: services, error } = await supabase
        .from('services')
        .select(`
          *,
          featured_media:media_library(*),
          service_crops:crops(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return c.json({ services });
    } catch (error) {
      console.error('Get services error:', error);
      return c.json({ error: 'Failed to fetch services' }, 500);
    }
  }

  static async getServiceById(c: Context) {
    try {
      const id = c.req.param('id');
      
      const { data: service, error } = await supabase
        .from('services')
        .select(`
          *,
          featured_media:media_library(*),
          service_crops:crops(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!service) {
        return c.json({ error: 'Service not found' }, 404);
      }

      return c.json({ service });
    } catch (error) {
      console.error('Get service error:', error);
      return c.json({ error: 'Failed to fetch service' }, 500);
    }
  }

  static async createService(c: Context) {
    try {
      const user = c.get('user');
      if (user.role !== 'admin') {
        return c.json({ error: 'Admin access required' }, 403);
      }

      const body = await c.req.json();
      const validated = serviceSchema.parse(body);

      const { data: service, error } = await supabase
        .from('services')
        .insert(validated)
        .select()
        .single();

      if (error) throw error;

      return c.json({ service }, 201);
    } catch (error) {
      console.error('Create service error:', error);
      return c.json({ error: 'Failed to create service' }, 400);
    }
  }

  static async updateService(c: Context) {
    try {
      const user = c.get('user');
      if (user.role !== 'admin') {
        return c.json({ error: 'Admin access required' }, 403);
      }

      const id = c.req.param('id');
      const body = await c.req.json();
      const validated = serviceSchema.partial().parse(body);

      const { data: service, error } = await supabase
        .from('services')
        .update(validated)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      if (!service) {
        return c.json({ error: 'Service not found' }, 404);
      }

      return c.json({ service });
    } catch (error) {
      console.error('Update service error:', error);
      return c.json({ error: 'Failed to update service' }, 400);
    }
  }

  static async deleteService(c: Context) {
    try {
      const user = c.get('user');
      if (user.role !== 'admin') {
        return c.json({ error: 'Admin access required' }, 403);
      }

      const id = c.req.param('id');
      
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return c.json({ message: 'Service deleted successfully' });
    } catch (error) {
      console.error('Delete service error:', error);
      return c.json({ error: 'Failed to delete service' }, 500);
    }
  }

  static async getAllCrops(c: Context) {
    try {
      const { data: crops, error } = await supabase
        .from('crops')
        .select(`
          *,
          featured_media:media_library(*),
          service_crops:services(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return c.json({ crops });
    } catch (error) {
      console.error('Get crops error:', error);
      return c.json({ error: 'Failed to fetch crops' }, 500);
    }
  }

  static async createCrop(c: Context) {
    try {
      const user = c.get('user');
      if (user.role !== 'admin') {
        return c.json({ error: 'Admin access required' }, 403);
      }

      const body = await c.req.json();
      const validated = cropSchema.parse(body);

      const { data: crop, error } = await supabase
        .from('crops')
        .insert(validated)
        .select()
        .single();

      if (error) throw error;

      return c.json({ crop }, 201);
    } catch (error) {
      console.error('Create crop error:', error);
      return c.json({ error: 'Failed to create crop' }, 400);
    }
  }

  static async linkCropToService(c: Context) {
    try {
      const user = c.get('user');
      if (user.role !== 'admin') {
        return c.json({ error: 'Admin access required' }, 403);
      }

      const { service_id, crop_id } = await c.req.json();

      const { error } = await supabase
        .from('service_crops')
        .insert({ service_id, crop_id });

      if (error) throw error;

      return c.json({ message: 'Crop linked to service successfully' });
    } catch (error) {
      console.error('Link crop error:', error);
      return c.json({ error: 'Failed to link crop' }, 400);
    }
  }
}