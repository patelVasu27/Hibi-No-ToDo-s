import React, { useEffect, useRef } from 'react';
import { Task } from '../types';
import { XMarkIcon, RecycleIcon, ArrowUturnLeftIcon, TrashIcon } from './Icons';

interface DeletedTask extends Task {
    deletedAt: number;
}

interface RecycleBinModalProps {
    isOpen: boolean;
    onClose: () => void;
    deletedTasks: DeletedTask[];
    onRestore: (id: string) => void;
    onPermanentlyDelete: (id: string) => void;
    onEmptyBin: () => void;
}

const RecycleBinModal: React.FC<RecycleBinModalProps> = ({ isOpen, onClose, deletedTasks, onRestore, onPermanentlyDelete, onEmptyBin }) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const closeBtnRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            closeBtnRef.current?.focus();
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex justify-center items-center z-50"
            aria-labelledby="recycle-bin-modal-title"
            role="dialog"
            aria-modal="true"
            onClick={onClose}
        >
            <div
                ref={modalRef}
                className="bg-gray-900 border border-white/10 rounded-lg shadow-xl p-6 m-4 max-w-2xl w-full flex flex-col transform transition-all duration-300"
                style={{ height: 'clamp(300px, 80vh, 600px)' }}
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h2 id="recycle-bin-modal-title" className="text-xl font-bold text-white flex items-center gap-2">
                        <RecycleIcon className="h-6 w-6 text-blue-400" />
                        Recycle Bin
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-white">
                        <XMarkIcon className="h-6 w-6" />
                        <span className="sr-only">Close modal</span>
                    </button>
                </div>
                
                {deletedTasks.length > 0 && (
                    <div className="mb-4 flex justify-end flex-shrink-0">
                        <button 
                            onClick={onEmptyBin}
                            className="text-sm text-red-500 hover:text-red-400 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={deletedTasks.length === 0}
                        >
                            Empty Bin
                        </button>
                    </div>
                )}


                <div className="flex-grow overflow-y-auto pr-2 -mr-2">
                    {deletedTasks.length === 0 ? (
                        <p className="text-gray-500 text-center py-10">The recycle bin is empty.</p>
                    ) : (
                        <ul className="space-y-2">
                            {deletedTasks.slice().sort((a, b) => b.deletedAt - a.deletedAt).map(task => (
                                <li key={task.id} className="flex items-center bg-white/5 p-3 rounded-md">
                                    <span className={`flex-grow truncate ${task.completed ? 'text-gray-500 line-through' : 'text-gray-300'}`} title={task.text}>
                                        {task.text}
                                    </span>
                                    <div className="flex items-center gap-2 ml-auto">
                                        <button
                                            onClick={() => onRestore(task.id)}
                                            className="p-1.5 text-gray-400 hover:text-green-400 rounded-full transition-colors"
                                            aria-label="Restore task"
                                        >
                                            <ArrowUturnLeftIcon className="h-5 w-5" />
                                        </button>
                                        <button
                                            onClick={() => onPermanentlyDelete(task.id)}
                                            className="p-1.5 text-gray-400 hover:text-red-500 rounded-full transition-colors"
                                            aria-label="Delete permanently"
                                        >
                                            <TrashIcon className="h-5 w-5" />
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <div className="mt-6 flex justify-end flex-shrink-0">
                    <button
                        ref={closeBtnRef}
                        onClick={onClose}
                        className="px-4 py-2 rounded-md bg-gray-700 text-white hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-gray-500 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RecycleBinModal;
