import { Context } from 'hono';
import { supabase } from '../db/supabaseClient.js';

export class NotificationsController {
  static async getUserNotifications(c: Context) {
    try {
      const user = c.get('user');
      const { unread_only, limit = '50', offset = '0' } = c.req.query();

      // Convert string parameters to numbers with validation
      const limitNum = parseInt(limit, 10);
      const offsetNum = parseInt(offset, 10);

      if (isNaN(limitNum) || isNaN(offsetNum)) {
        return c.json({ error: 'Invalid limit or offset parameter' }, 400);
      }

      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.userId)
        .order('sent_at', { ascending: false })
        .range(offsetNum, offsetNum + limitNum - 1);

      if (unread_only === 'true') {
        query = query.eq('read', false);
      }

      const { data: notifications, error } = await query;

      if (error) throw error;

      return c.json({ notifications: notifications || [] });
    } catch (error) {
      console.error('Get notifications error:', error);
      return c.json({ error: 'Failed to fetch notifications' }, 500);
    }
  }

  static async markAsRead(c: Context) {
    try {
      const user = c.get('user');
      const id = c.req.param('id');

      const { data: notification, error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id)
        .eq('user_id', user.userId)
        .select()
        .single();

      if (error) throw error;
      if (!notification) {
        return c.json({ error: 'Notification not found' }, 404);
      }

      return c.json({ notification });
    } catch (error) {
      console.error('Mark as read error:', error);
      return c.json({ error: 'Failed to update notification' }, 400);
    }
  }

  static async markAllAsRead(c: Context) {
    try {
      const user = c.get('user');

      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.userId)
        .eq('read', false);

      if (error) throw error;

      return c.json({ message: 'All notifications marked as read' });
    } catch (error) {
      console.error('Mark all as read error:', error);
      return c.json({ error: 'Failed to update notifications' }, 400);
    }
  }

  static async sendNotification(c: Context) {
    try {
      const user = c.get('user');
      if (user.role !== 'admin') {
        return c.json({ error: 'Admin access required' }, 403);
      }

      const { user_id, type, message } = await c.req.json();

      const { data: notification, error } = await supabase
        .from('notifications')
        .insert({
          user_id,
          type,
          message,
          sent_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      return c.json({ notification }, 201);
    } catch (error) {
      console.error('Send notification error:', error);
      return c.json({ error: 'Failed to send notification' }, 400);
    }
  }
}