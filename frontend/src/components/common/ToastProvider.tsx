
import React, { createContext, useCallback, useContext, useState } from 'react';

type ToastSeverity = 'info' | 'success' | 'warning' | 'error';

interface ToastContextType {
    showToast: (message: string, severity?: ToastSeverity) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
    children: React.ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
    const [open, setOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [severity, setSeverity] = useState<ToastSeverity>('info');

    const showToast = useCallback((msg: string, sev: ToastSeverity = 'info') => {
        setMessage(msg);
        setSeverity(sev);
        setOpen(true);
        // Auto-hide after 6 seconds
        setTimeout(() => setOpen(false), 6000);
    }, []);

    const handleClose = () => {
        setOpen(false);
    };

    const severityStyles = {
        info: 'bg-blue-50 border-blue-200 text-blue-900',
        success: 'bg-green-50 border-green-200 text-green-900',
        warning: 'bg-amber-50 border-amber-200 text-amber-900',
        error: 'bg-red-50 border-red-200 text-red-900',
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {open && (
                <div className="fixed bottom-4 right-4 z-50">
                    <div className={`flex items-center gap-3 rounded-lg border p-4 shadow-lg ${severityStyles[severity]} min-w-[300px]`}>
                        <p className="text-sm flex-1">{message}</p>
                        <button
                            onClick={handleClose}
                            className="text-current opacity-70 hover:opacity-100"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (context === undefined) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};
