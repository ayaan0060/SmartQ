import React from 'react';
import { motion } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';

export default function PageLayout({ children, className = '', withSidebar = true }) {
  if (!withSidebar) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`container mx-auto px-4 md:px-8 max-w-7xl pt-8 ${className}`}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="ml-64 flex-1 flex flex-col min-h-screen">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={`flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full ${className}`}
        >
          {children}
        </motion.div>
        <Footer className="ml-0" />
      </main>
    </div>
  );
}
