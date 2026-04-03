import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Lock, Phone, ArrowRight } from 'lucide-react';
import Button from '../../components/Button';
import Input from '../../components/Input';

const loginSchema = z.object({
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const LoginForm = ({ onSubmit, isLoading }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    mode: 'onTouched',
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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

      <Button
        type="submit"
        isLoading={isLoading}
        className="w-full text-base"
        rightIcon={<ArrowRight size={18} />}
      >
        Sign In
      </Button>
    </form>
  );
};

export default LoginForm;
