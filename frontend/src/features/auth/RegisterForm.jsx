import React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { User, Mail, Lock, Phone, ArrowRight, Building2 } from 'lucide-react';
import Button from '../../components/Button';
import Input from '../../components/Input';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['patient', 'hospital-admin']),
  hospitalId: z.string().optional(),
}).refine((data) => {
  if (data.role === 'hospital-admin' && !data.hospitalId) {
    return false;
  }
  return true;
}, {
  message: "Please select a hospital for the admin account",
  path: ["hospitalId"],
});

const RegisterForm = ({ onSubmit, isLoading, hospitals = [] }) => {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    mode: 'onTouched',
    defaultValues: {
      role: 'patient',
    }
  });

  const role = useWatch({ control, name: 'role' });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Full Name"
        placeholder="John Doe"
        {...register('name')}
        error={errors.name?.message}
        leftIcon={<User className="text-slate-400" size={18} />}
        className="pl-12"
      />

      <Input
        label="Phone Number"
        placeholder="1234567890"
        {...register('phone')}
        error={errors.phone?.message}
        leftIcon={<Phone className="text-slate-400" size={18} />}
        className="pl-12"
      />

      <Input
        label="Password"
        type="password"
        placeholder="••••••••"
        {...register('password')}
        error={errors.password?.message}
        leftIcon={<Lock className="text-slate-400" size={18} />}
        className="pl-12"
      />

      <div className="space-y-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">I am a...</label>
        <select 
          {...register('role')}
          className="w-full h-11 px-4 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none"
        >
          <option value="patient">User / Patient</option>
          <option value="hospital-admin">Admin / Staff</option>
        </select>
      </div>

      {role === 'hospital-admin' && (
        <div className="space-y-1.5 animate-in fade-in slide-in-from-top-4">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Select Hospital</label>
          <div className="relative">
             <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <select 
              {...register('hospitalId')}
              className="w-full h-11 pl-12 pr-4 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none"
            >
              <option value="">Choose your hospital...</option>
              {hospitals.map(h => (
                <option key={h._id} value={h._id}>{h.name} - {h.location}</option>
              ))}
            </select>
          </div>
          {errors.hospitalId && (
            <p className="text-xs font-medium text-danger">{errors.hospitalId.message}</p>
          )}
        </div>
      )}

      <Button
        type="submit"
        isLoading={isLoading}
        className="w-full text-base mt-2"
        rightIcon={<ArrowRight size={18} />}
      >
        Create Account
      </Button>
    </form>
  );
};

export default RegisterForm;
