import React from 'react';
import { ArrowUturnLeftIcon, XMarkIcon } from './Icons';

interface UndoToastProps {
    isOpen: boolean;
    message: string;
    onUndo: () => void;
    onClose: () => void; // This will finalize the deletion
}

const UndoToast: React.FC<UndoToastProps> = ({ isOpen, message, onUndo, onClose }) => {
    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed bottom-0 left-0 right-0 z-20 p-4 flex justify-center">
            <div
                className="toast-container container mx-auto max-w-md bg-gray-800 border border-white/10 rounded-lg shadow-2xl p-3 flex items-center justify-between gap-4 backdrop-blur-sm bg-opacity-80"
                role="alert"
                aria-live="assertive"
            >
                <p className="text-gray-300">{message}</p>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onUndo}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-semibold text-blue-300 hover:bg-blue-500/20 transition-colors"
                    >
                        <ArrowUturnLeftIcon className="h-4 w-4" />
                        Undo
                    </button>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-white rounded-full transition-colors"
                        aria-label="Dismiss and confirm deletion"
                    >
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UndoToast;
