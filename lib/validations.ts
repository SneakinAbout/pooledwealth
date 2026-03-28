import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address').max(254),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address').max(254),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  confirmPassword: z.string(),
  termsAccepted: z.literal(true, { errorMap: () => ({ message: 'You must accept the terms and conditions' }) }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

// Base object — use this when you need .partial() (e.g. PATCH/PUT updates)
export const investmentSchemaBase = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().min(20, 'Description must be at least 20 characters').max(5000),
  category: z.enum(['Pokemon TCG', 'Sports Cards', 'Sneakers', 'Comics', 'Watches', 'Memorabilia']),
  status: z.enum(['DRAFT', 'ACTIVE', 'CLOSED', 'ARCHIVED']).optional(),
  totalUnits: z.number().int().positive('Total units must be positive'),
  pricePerUnit: z.number().positive('Price per unit must be positive'),
  minimumUnits: z.number().int().positive('Minimum units must be positive'),
  minimumRaise: z.number().int().min(0, 'Minimum raise cannot be negative').default(0),
  targetReturn: z.number().min(0).max(100, 'Target return must be between 0 and 100'),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid start date'),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid end date'),
  imageUrl: z.string().url('Invalid URL').max(2000).optional().or(z.literal('')),
  // Asset identification fields for supplement documents
  edition: z.string().max(200).optional().or(z.literal('')),
  grade: z.string().max(200).optional().or(z.literal('')),
  gradingCompany: z.string().max(200).optional().or(z.literal('')),
  certNumber: z.string().max(200).optional().or(z.literal('')),
  acquisitionPrice: z.number().positive('Acquisition price must be positive').optional(),
  acquisitionDate: z.string().refine((val) => !val || !isNaN(Date.parse(val)), 'Invalid acquisition date').optional().or(z.literal('')),
});

// Full schema with cross-field date validation — use for creates
export const investmentSchema = investmentSchemaBase.refine(
  (data) => !data.startDate || !data.endDate || new Date(data.endDate) > new Date(data.startDate),
  { message: 'End date must be after start date', path: ['endDate'] }
);

export const purchaseSchema = z.object({
  investmentId: z.string().cuid('Invalid investment ID'),
  units: z.number().int().positive('Units must be a positive integer'),
  paymentIntentId: z.string().optional(),
});

export const feeSettingsSchema = z.object({
  managementFeePercent: z
    .number()
    .min(0, 'Management fee must be at least 0%')
    .max(20, 'Management fee cannot exceed 20%'),
  profitSharePercent: z
    .number()
    .min(0, 'Profit share must be at least 0%')
    .max(50, 'Profit share cannot exceed 50%'),
});

export const distributionSchema = z.object({
  investmentId: z.string().cuid('Invalid investment ID'),
  totalAmount: z.number().positive('Amount must be positive'),
  notes: z.string().max(2000).optional(),
});

export const bankSettingsSchema = z.object({
  bankName: z.string().min(1, 'Required').max(100),
  bankAccountName: z.string().min(1, 'Required').max(100),
  bankBSB: z.string().min(1, 'Required').max(10),
  bankAccountNumber: z.string().min(1, 'Required').max(30),
  bankSwift: z.string().min(1, 'Required').max(11),
});

export const platformSettingsSchema = z.object({
  platformName: z.string().min(1, 'Required').max(100),
  supportEmail: z.string().email('Invalid email').max(254),
  minDepositAmount: z.number().int().min(1).max(10000),
  maxDepositAmount: z.number().int().min(100).max(10000000),
});

export const updateUserRoleSchema = z.object({
  role: z.enum(['ADMIN', 'MANAGER', 'INVESTOR']),
  kycApproved: z.boolean().optional(),
  feeDiscountPercent: z.number().min(0).max(100).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type InvestmentInput = z.infer<typeof investmentSchemaBase>;
export type PurchaseInput = z.infer<typeof purchaseSchema>;
export type FeeSettingsInput = z.infer<typeof feeSettingsSchema>;
export type DistributionInput = z.infer<typeof distributionSchema>;
export type BankSettingsInput = z.infer<typeof bankSettingsSchema>;
export type PlatformSettingsInput = z.infer<typeof platformSettingsSchema>;
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
