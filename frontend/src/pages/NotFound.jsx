import React from 'react';
import { Link } from 'react-router-dom';
import { Ghost, Home } from 'lucide-react';
import { motion } from 'framer-motion';
import Button from '../components/Button';

const NotFound = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <motion.div 
        animate={{ y: [0, -15, 0] }} 
        transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
        className="text-slate-200 mb-6 drop-shadow-xl"
      >
        <Ghost size={140} strokeWidth={1} />
      </motion.div>
      <h1 className="text-[6rem] md:text-[8rem] leading-none font-black text-slate-900 tracking-tighter font-display drop-shadow-2xl">
        404
      </h1>
      <h2 className="text-2xl mt-4 font-black text-slate-700 tracking-tight uppercase">Dimension Not Found</h2>
      <p className="text-slate-500 mt-4 max-w-sm mx-auto font-medium leading-relaxed">
        The route you are navigating to doesn't exist within the active system architecture.
      </p>
      
      <Link to="/" className="mt-12">
        <Button className="h-16 px-10 text-lg rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform" leftIcon={<Home size={22} />}>
          Return to Hub
        </Button>
      </Link>
    </div>
  );
};

export default NotFound;
