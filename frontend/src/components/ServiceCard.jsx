import React, { memo } from 'react';
import { Building2, ArrowRight, Clock } from 'lucide-react';
import Card from './Card';
import Badge from './Badge';
import Button from './Button';
import { cn } from '../utils/cn';

const ServiceCard = ({ service, onBook }) => {
  return (
    <Card 
      hoverable 
      className="group flex flex-col h-full border-slate-100 shadow-premium p-6"
    >
      <div className="mb-6 flex items-start justify-between">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-all group-hover:bg-primary group-hover:text-white group-hover:scale-110 duration-300">
          <Building2 size={28} />
        </div>
        <Badge variant="success" className="bg-success/10 text-success border-success/20">
          <Clock size={12} className="mr-1 inline" />
          {service.avgTime || '15'}m
        </Badge>
      </div>
      
      <div className="grow space-y-2">
        <h3 className="text-xl font-bold text-slate-900 group-hover:text-primary transition-colors">
          {service.name}
        </h3>
        <p className="text-sm font-medium text-slate-500">
          {service.branchId?.name || 'Main Department'}
        </p>
        {service.price > 0 && (
          <p className="text-sm font-black text-primary">₹{service.price} <span className="text-xs font-medium text-slate-400">consultation fee</span></p>
        )}
        {(!service.price || service.price === 0) && (
          <p className="text-sm font-black text-success">Free</p>
        )}
      </div>
      
      <div className="mt-8 pt-6 border-t border-slate-50">
        {/* Token Booking Action */}
        <Button 
          variant={service.isActive !== false ? 'primary' : 'secondary'}
          className={cn(
            "w-full rounded-2xl md:h-12 py-3 text-sm font-bold shadow-lg transition-transform",
            service.isActive !== false ? 'shadow-primary/25 hover:scale-[1.02]' : 'opacity-50'
          )}
          onClick={() => service.isActive !== false && onBook(service)}
          disabled={service.isActive === false}
        >
          {service.isActive !== false
            ? service.price > 0 ? `Pay ₹${service.price} & Book` : 'Book Free Token'
            : 'Unavailable'}
        </Button>
      </div>
    </Card>
  );
};

export default memo(ServiceCard);
