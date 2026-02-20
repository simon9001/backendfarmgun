import type { Context } from 'hono';
import bcrypt from 'bcryptjs';
import jwtModule from 'jsonwebtoken';
const jwt = jwtModule;
import { supabase } from '../db/supabaseClient.js';
import { registerSchema, loginSchema } from '../utils/validation.js';
import { AuthTokenPayload } from '../types/index.js';
import { sendEmail } from '../utils/resend.js';
import crypto from 'crypto';


const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const SALT_ROUNDS = 10;

export class AuthController {
  static async register(c: Context) {
    try {
      const body = await c.req.json();
      const validated = registerSchema.parse(body);

      // Check if user exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .or(`email.eq.${validated.email},phone.eq.${validated.phone}`)
        .single();

      if (existingUser) {
        return c.json({ error: 'User already exists' }, 409);
      }

      // Hash password
      const passwordHash = await bcrypt.hash(validated.password, SALT_ROUNDS);

      // Create user
      const { data: user, error } = await supabase
        .from('users')
        .insert({
          name: validated.name,
          phone: validated.phone,
          email: validated.email,
          password_hash: passwordHash,
          role: validated.role,
        })
        .select()
        .single();

      if (error) throw error;

      // Generate token
      const tokenPayload: AuthTokenPayload = {
        userId: user.id,
        role: user.role,
        email: user.email,
        phone: user.phone, // Add phone if needed
      };

      const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

      return c.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
        token,
      });
    } catch (error) {
      console.error('Registration error:', error);
      return c.json({ error: 'Registration failed' }, 400);
    }
  }

  static async login(c: Context) {
    try {
      const body = await c.req.json();
      const validated = loginSchema.parse(body);

      // Find user by email or phone
      const query = supabase
        .from('users')
        .select('*');

      if (validated.email) {
        query.eq('email', validated.email);
      } else if (validated.phone) {
        query.eq('phone', validated.phone);
      }

      const { data: user, error } = await query.single();

      if (error || !user) {
        return c.json({ error: 'Invalid credentials' }, 401);
      }

      // Verify password
      if (!user.password_hash || !await bcrypt.compare(validated.password, user.password_hash)) {
        return c.json({ error: 'Invalid credentials' }, 401);
      }

      // Generate token
      const tokenPayload: AuthTokenPayload = {
        userId: user.id,
        role: user.role,
        email: user.email,
      };

      const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

      return c.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
        token,
      });
    } catch (error) {
      console.error('Login error:', error);
      return c.json({ error: 'Login failed' }, 400);
    }
  }

  static async getProfile(c: Context) {
    try {
      const user = c.get('user') as AuthTokenPayload;

      const { data: userData, error } = await supabase
        .from('users')
        .select(`
          *,
          profile_media:media_library(*)
        `)
        .eq('id', user.userId)
        .single();

      if (error || !userData) {
        return c.json({ error: 'User not found' }, 404);
      }

      // Remove sensitive data
      const { password_hash, ...safeUser } = userData;

      return c.json({ user: safeUser });
    } catch (error) {
      console.error('Get profile error:', error);
      return c.json({ error: 'Failed to get profile' }, 400);
    }
  }

  static async forgotPassword(c: Context) {
    try {
      const { email } = await c.req.json();
      if (!email) return c.json({ error: 'Email is required' }, 400);

      const { data: user, error } = await supabase
        .from('users')
        .select('id, name')
        .eq('email', email)
        .single();

      if (error || !user) {
        // Return success even if user not found for security
        return c.json({ message: 'If an account exists with this email, you will receive a reset link.' });
      }

      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetExpires = new Date(Date.now() + 4 * 60 * 1000); // 4 minutes

      await supabase
        .from('users')
        .update({
          reset_token: resetToken,
          reset_token_expires: resetExpires.toISOString()
        })
        .eq('id', user.id);

      const resetUrl = `${process.env.CORS_ORIGIN}/reset-password?token=${resetToken}`;

      await sendEmail(
        email,
        'Password Reset Request - Farm with Irene',
        `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto;">
          <h2 style="color: #15803d;">Password Reset Request</h2>
          <p>Hi ${user.name},</p>
          <p>We received a request to reset your password. Click the button below to set a new password:</p>
          <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #16a34a; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Reset Password</a>
          <p style="margin-top: 24px; color: #666; font-size: 0.9em;">If you did not request this, please ignore this email. The link will expire in 4 minutes for security.</p>
        </div>
        `
      );


      return c.json({ message: 'If an account exists with this email, you will receive a reset link.' });
    } catch (error) {
      console.error('Forgot password error:', error);
      return c.json({ error: 'Something went wrong' }, 500);
    }
  }

  static async resetPassword(c: Context) {
    try {
      const { token, password } = await c.req.json();
      if (!token || !password) return c.json({ error: 'Token and new password are required' }, 400);

      const { data: user, error } = await supabase
        .from('users')
        .select('id, reset_token_expires')
        .eq('reset_token', token)
        .single();

      if (error || !user) {
        return c.json({ error: 'Invalid or expired reset token' }, 400);
      }

      if (new Date(user.reset_token_expires) < new Date()) {
        return c.json({ error: 'Reset token has expired' }, 400);
      }

      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

      await supabase
        .from('users')
        .update({
          password_hash: passwordHash,
          reset_token: null,
          reset_token_expires: null
        })
        .eq('id', user.id);

      return c.json({ message: 'Password has been reset successfully. You can now log in.' });
    } catch (error) {
      console.error('Reset password error:', error);
      return c.json({ error: 'Something went wrong' }, 500);
    }
  }
}
