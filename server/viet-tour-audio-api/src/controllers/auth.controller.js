import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { login, registerVendor } from '../services/auth.service.js';

const registerSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(8),
  fullName: z.string().min(2).max(100),
  email: z.string().email().optional(),
  phoneNumber: z.string().min(8).max(20).optional(),
  shopName: z.string().min(2).max(120),
  address: z.string().optional(),
  latitude: z.coerce.number(),
  longitude: z.coerce.number()
});

const loginSchema = z.object({
  username: z.string(),
  password: z.string()
});

export async function register(req, res) {
  const payload = registerSchema.parse(req.body);
  const user = await registerVendor(payload);
  return res.status(201).json({ user });
}

export async function loginVendor(req, res) {
  const payload = loginSchema.parse(req.body);
  const data = await login(payload);
  return res.json(data);
}

export async function loginAdmin(req, res) {
  const payload = loginSchema.parse(req.body);
  const data = await login({ ...payload, adminOnly: true });
  return res.json(data);
}

export async function me(req, res) {
  return res.json({ user: req.user });
}

export async function logout(req, res) {
  return res.json({ success: true });
}
