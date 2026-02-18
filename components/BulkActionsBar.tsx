import React from 'react';
import { TrashIcon, CheckIcon, StarIcon, XMarkIcon } from './Icons';

interface BulkActionsBarProps {
    selectedCount: number;
    onDelete: () => void;
    onMarkComplete: () => void;
    onMarkImportant: () => void;
    onDeselectAll: () => void;
}

const BulkActionsBar: React.FC<BulkActionsBarProps> = ({ selectedCount, onDelete, onMarkComplete, onMarkImportant, onDeselectAll }) => {
    return (
        <div className="fixed bottom-0 left-0 right-0 z-10 p-4 animate-fade-in-up">
            <div className="container mx-auto max-w-2xl">
                 <div className="bg-gray-800 border border-white/10 rounded-lg shadow-2xl p-3 flex items-center justify-between gap-4 backdrop-blur-sm bg-opacity-80">
                    <div className="flex items-center gap-2">
                         <button
                            onClick={onDeselectAll}
                            className="p-2 text-gray-400 hover:text-white rounded-full transition-colors"
                            aria-label="Deselect all and close"
                        >
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                        <p className="text-gray-300 font-medium">
                            <span className="bg-blue-500 text-white rounded-full px-2.5 py-0.5 mr-2">{selectedCount}</span>
                            selected
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onMarkComplete}
                            className="p-2 text-gray-400 hover:text-green-400 rounded-full transition-colors"
                            aria-label="Mark selected as complete"
                        >
                            <CheckIcon className="h-6 w-6" />
                        </button>
                        <button
                            onClick={onMarkImportant}
                            className="p-2 text-gray-400 hover:text-yellow-400 rounded-full transition-colors"
                            aria-label="Mark selected as important"
                        >
                            <StarIcon className="h-6 w-6" />
                        </button>
                        <button
                            onClick={onDelete}
                            className="p-2 text-gray-400 hover:text-red-500 rounded-full transition-colors"
                            aria-label="Delete selected"
                        >
                            <TrashIcon className="h-6 w-6" />
                        </button>
                    </div>
                 </div>
            </div>
        </div>
    );
};

export default BulkActionsBar;