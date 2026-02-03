import bcrypt from 'bcryptjs';
import jwtModule from 'jsonwebtoken';
const jwt = jwtModule;
import { supabase } from '../db/supabaseClient.js';
import { registerSchema, loginSchema } from '../utils/validation.js';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const SALT_ROUNDS = 10;
export class AuthController {
    static async register(c) {
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
            if (error)
                throw error;
            // Generate token
            const tokenPayload = {
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
        }
        catch (error) {
            console.error('Registration error:', error);
            return c.json({ error: 'Registration failed' }, 400);
        }
    }
    static async login(c) {
        try {
            const body = await c.req.json();
            const validated = loginSchema.parse(body);
            // Find user by email or phone
            const query = supabase
                .from('users')
                .select('*');
            if (validated.email) {
                query.eq('email', validated.email);
            }
            else if (validated.phone) {
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
            const tokenPayload = {
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
        }
        catch (error) {
            console.error('Login error:', error);
            return c.json({ error: 'Login failed' }, 400);
        }
    }
    static async getProfile(c) {
        try {
            const user = c.get('user');
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
        }
        catch (error) {
            console.error('Get profile error:', error);
            return c.json({ error: 'Failed to get profile' }, 400);
        }
    }
}
//# sourceMappingURL=auth.js.map