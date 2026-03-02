/**
 * Full-Screen Connection Graph Modal
 * Displays relationship graph in full-screen mode with 4px margins
 */

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { ReactFlowProvider } from 'reactflow';
import InteractiveGraph from './InteractiveGraph';

interface ConnectionGraphModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialEntityId: string;
    initialEntityName: string;
}

export default function ConnectionGraphModal({
    isOpen,
    onClose,
    initialEntityId,
    initialEntityName
}: ConnectionGraphModalProps) {
    // Handle ESC key to close modal
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            // Prevent body scroll when modal is open
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return createPortal(
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal Container */}
            <div className="fixed top-1 left-1 right-1 bottom-1 z-[9999] bg-[#0F1419] rounded-xl shadow-2xl overflow-hidden border border-white/10">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-2 rounded-full bg-[#1A1F2E] hover:bg-white/10 transition-colors shadow-lg border border-white/10"
                    aria-label="Close graph"
                >
                    <X className="w-6 h-6 text-gray-400 hover:text-white" />
                </button>

                {/* Graph Content */}
                <div className="w-full h-full">
                    <ReactFlowProvider>
                        <InteractiveGraph
                            initialEntityId={initialEntityId}
                            initialEntityName={initialEntityName}
                        />
                    </ReactFlowProvider>
                </div>
            </div>
        </>,
        document.body
    );
}
