import React, { useState, useEffect, useRef } from 'react';
import { Task } from '../types';
import { DocumentTextIcon, XMarkIcon } from './Icons';

interface NotesModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (taskId: string, notes: string) => void;
    task: Task | null;
}

const NotesModal: React.FC<NotesModalProps> = ({ isOpen, onClose, onSave, task }) => {
    const [notes, setNotes] = useState('');
    const modalRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (task) {
            setNotes(task.notes || '');
        }
    }, [task]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            // Focus textarea when modal opens
            setTimeout(() => textareaRef.current?.focus(), 100);
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);


    if (!isOpen || !task) return null;

    const handleSave = () => {
        onSave(task.id, notes);
    };

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex justify-center items-center z-50"
            aria-labelledby="notes-modal-title"
            role="dialog"
            aria-modal="true"
            onClick={onClose}
        >
            <div
                ref={modalRef}
                className="bg-gray-900 border border-white/10 rounded-lg shadow-xl p-6 m-4 max-w-lg w-full transform transition-all duration-300"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4">
                    <h2 id="notes-modal-title" className="text-xl font-bold text-white flex items-center gap-2 truncate">
                        <DocumentTextIcon className="h-6 w-6 text-blue-400" />
                        <span className="truncate" title={task.text}>Notes for: {task.text}</span>
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-white flex-shrink-0">
                        <XMarkIcon className="h-6 w-6" />
                        <span className="sr-only">Close modal</span>
                    </button>
                </div>

                <textarea
                    ref={textareaRef}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add your notes here..."
                    className="w-full h-48 bg-white/5 border border-white/10 rounded-lg p-3 text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                    aria-label={`Notes for task: ${task.text}`}
                ></textarea>

                <div className="flex justify-end gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-md bg-gray-700 text-white hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-gray-500 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500 transition-colors"
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotesModal;