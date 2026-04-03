import React from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import Button from './Button';
import Card from './Card';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full p-8 md:p-12 text-center shadow-premium flex flex-col items-center">
            <div className="h-20 w-20 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-6 border-4 border-red-100/50 shadow-inner">
              <AlertTriangle size={40} />
            </div>
            <h1 className="text-3xl font-black text-slate-900 mb-3 font-display tracking-tight">System Error</h1>
            <p className="text-slate-500 mb-4 font-medium">An unexpected crash occurred in the UI.</p>
            {this.state.error && (
              <pre className="text-xs text-red-400 bg-red-50 rounded-xl p-3 mb-6 text-left w-full overflow-auto max-h-32">
                {this.state.error.message}
              </pre>
            )}
            <Button 
              onClick={() => {
                localStorage.clear();
                sessionStorage.clear();
                window.location.href = '/login';
              }} 
              className="w-full h-14 rounded-2xl shadow-xl hover:scale-[1.02] transition-transform" 
              leftIcon={<RefreshCcw size={20} />}
            >
              Clear & Restart
            </Button>
          </Card>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
