import { Toaster } from 'react-hot-toast';

export const ToastProvider = () => {
  return (
    <Toaster 
      position="top-right"
      toastOptions={{
        className: 'card text-sm font-medium',
        duration: 4000,
        style: {
          background: '#ffffff',
          color: '#0f172a',
          border: '1px solid #e2e8f0',
        },
      }}
    />
  );
};
