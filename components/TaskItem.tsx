import React, { useState, useEffect, useRef } from 'react';
import { Task } from '../types';
import { TrashIcon, StarIcon, DocumentTextIcon, Bars2Icon } from './Icons';

interface TaskItemProps {
    task: Task;
    isSelected: boolean;
    isSelectionMode: boolean;
    isDragging: boolean;
    isRemoving: boolean;
    isJustDropped: boolean;
    onToggleComplete: (id: string) => void;
    onToggleImportant: (id: string) => void;
    onDeleteTask: (id: string) => void;
    onSelectTask: (id: string) => void;
    onLongPressTask: (id: string) => void;
    onOpenNotesModal: (task: Task) => void;
    onDragStart: (e: React.DragEvent, id: string) => void;
    onDrop: (e: React.DragEvent, id: string) => void;
    onDragEnd: () => void;
}

const ConfettiBurst: React.FC = () => {
    const confettiColors = ['#60a5fa', '#facc15', '#ffffff', '#3b82f6'];
    const particles = Array.from({ length: 15 });

    return (
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            {particles.map((_, index) => {
                const style = {
                    '--angle': `${Math.random() * 360}deg`,
                    '--distance': `${Math.random() * 25 + 40}px`,
                    '--duration': `${Math.random() * 0.4 + 0.6}s`,
                    '--delay': `${Math.random() * 0.1}s`,
                    backgroundColor: confettiColors[index % confettiColors.length],
                };
                return <div key={index} className="confetti-piece" style={style as React.CSSProperties} />;
            })}
        </div>
    );
};


const TaskItem: React.FC<TaskItemProps> = ({ task, isSelected, isSelectionMode, isDragging, isRemoving, isJustDropped, onToggleComplete, onToggleImportant, onDeleteTask, onSelectTask, onLongPressTask, onOpenNotesModal, onDragStart, onDrop, onDragEnd }) => {
    const [showConfetti, setShowConfetti] = useState(false);
    const [isCompleting, setIsCompleting] = useState(false);
    const [justMarkedImportant, setJustMarkedImportant] = useState(false);
    const prevCompletedRef = useRef<boolean | undefined>(undefined);
    const longPressTimer = useRef<number | null>(null);

    useEffect(() => {
        if (prevCompletedRef.current === false && task.completed === true) {
            setShowConfetti(true);
            setIsCompleting(true);
            const confettiTimer = setTimeout(() => setShowConfetti(false), 1000);
            const animationTimer = setTimeout(() => setIsCompleting(false), 400); 
            return () => {
                clearTimeout(confettiTimer);
                clearTimeout(animationTimer);
            };
        }
        prevCompletedRef.current = task.completed;
    }, [task.completed]);

    const handleToggleImportant = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!task.isImportant) {
            setJustMarkedImportant(true);
            setTimeout(() => setJustMarkedImportant(false), 400);
        }
        onToggleImportant(task.id);
    };

    const handlePressStart = () => {
        if (isSelectionMode) return;
        longPressTimer.current = window.setTimeout(() => {
            onLongPressTask(task.id);
        }, 500);
    };

    const handlePressEnd = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    };

    const handleClick = () => {
        if (isSelectionMode) {
            onSelectTask(task.id);
        }
    };

    const getDueDateLabel = (dueDateStr: string) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const [year, month, day] = dueDateStr.split('-').map(Number);
        const dueDate = new Date(year, month - 1, day);
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        if (dueDate.getTime() === today.getTime()) return "Today";
        if (dueDate.getTime() === tomorrow.getTime()) return "Tomorrow";
        if (dueDate < today) return "Overdue";
        return dueDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    };

    const isOverdue = (dueDateStr: string | undefined): boolean => {
        if (!dueDateStr) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const [year, month, day] = dueDateStr.split('-').map(Number);
        const dueDate = new Date(year, month - 1, day);
        return dueDate < today;
    };


    const dueDateLabel = task.dueDate ? getDueDateLabel(task.dueDate) : null;
    const isTaskOverdue = isOverdue(task.dueDate);

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer.types.includes('taskid')) {
             e.currentTarget.setAttribute('data-dragging-over', 'true');
        }
    };
    const handleDragLeave = (e: React.DragEvent) => {
        e.currentTarget.removeAttribute('data-dragging-over');
    };
    const handleLocalDrop = (e: React.DragEvent) => {
        e.currentTarget.removeAttribute('data-dragging-over');
        onDrop(e, task.id);
    }

    return (
        <li
            className={`task-item flex items-center p-4 rounded-lg transition-all duration-300 transform 
                ${isSelected ? 'bg-blue-900/50' : 'bg-white/5 hover:bg-white/10 hover:scale-[1.01] hover:shadow-lg hover:shadow-blue-500/20'} 
                ${isSelectionMode ? 'cursor-pointer' : 'cursor-default'} 
                ${isDragging ? 'opacity-50' : 'opacity-100'} 
                ${isJustDropped ? 'dropped' : ''}
                ${isRemoving ? 'removing' : ''}`}
            onMouseDown={handlePressStart}
            onMouseUp={handlePressEnd}
            onMouseLeave={handlePressEnd}
            onTouchStart={handlePressStart}
            onTouchEnd={handlePressEnd}
            onClick={handleClick}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleLocalDrop}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragEnd={onDragEnd}
        >
            {!isSelectionMode && (
                <div
                    className="flex-shrink-0 cursor-grab text-gray-500 hover:text-white mr-3 touch-none"
                    draggable
                    onDragStart={e => onDragStart(e, task.id)}
                    onMouseDown={e => e.stopPropagation()}
                    onTouchStart={e => e.stopPropagation()}
                    aria-hidden="true"
                >
                    <Bars2Icon className="h-5 w-5" />
                </div>
            )}
            <div className={`transition-all duration-300 flex-shrink-0 overflow-hidden ${isSelectionMode ? 'w-5 mr-3' : 'w-0 mr-0'}`}>
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => { /* Click handled by li */ }}
                    className="form-checkbox h-5 w-5 rounded bg-white/10 border-white/20 text-blue-500 focus:ring-blue-500 focus:ring-offset-black"
                    aria-label={`Select task: ${task.text}`}
                    tabIndex={isSelectionMode ? 0 : -1}
                />
            </div>

            <div className="relative flex-shrink-0">
                 <button
                    onClick={(e) => { e.stopPropagation(); onToggleComplete(task.id); }}
                    className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all duration-300
                        ${task.completed ? 'border-green-500 bg-green-500 check-active' : 'border-gray-500 hover:border-green-400'}`}
                    aria-label={task.completed ? 'Mark task as incomplete' : 'Mark task as complete'}
                >
                    <svg
                        className={`w-4 h-4 text-black transition-all duration-300 ease-in-out transform ${task.completed ? 'scale-100 opacity-100 rotate-0' : 'scale-50 opacity-0 -rotate-90'}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                </button>
                {showConfetti && <ConfettiBurst />}
            </div>
            
            <span className={`relative flex-grow mx-3 transition-colors duration-500 ease-in-out ${task.completed ? 'text-gray-500' : 'text-gray-200'}`}>
                {task.text}
                 <span 
                    className={`absolute top-1/2 left-0 h-[2px] bg-gray-500/60 transition-all duration-500 ease-in-out pointer-events-none`} 
                    style={{ width: task.completed ? '100%' : '0%' }}
                    aria-hidden="true" 
                />
            </span>

            {dueDateLabel && (
                <span className={`text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0 transition-all duration-300 ${isTaskOverdue && !task.completed ? 'bg-red-500/20 text-red-400' : 'bg-gray-700 text-gray-300'} ${task.completed ? 'opacity-50 grayscale' : ''}`}>
                    {dueDateLabel}
                </span>
            )}

            <div className="flex items-center gap-1 ml-auto flex-shrink-0">
                <button
                    onClick={(e) => { e.stopPropagation(); onOpenNotesModal(task); }}
                    className={`p-1.5 rounded-full transition-colors duration-300 ${task.notes ? 'text-blue-400 hover:text-blue-300' : 'text-gray-600 hover:text-blue-400'}`}
                    aria-label={task.notes ? 'Edit notes' : 'Add notes'}
                >
                    <DocumentTextIcon className="h-5 w-5" />
                </button>
                <button
                    onClick={handleToggleImportant}
                    className={`p-1.5 rounded-full transition-colors duration-300 group ${justMarkedImportant ? 'star-important' : ''}`}
                    aria-label={task.isImportant ? 'Unmark as important' : 'Mark as important'}
                >
                    <StarIcon className={`h-5 w-5 transition-all duration-200 ${
                        task.isImportant 
                        ? 'fill-yellow-400 stroke-yellow-400' 
                        : 'fill-none stroke-gray-600 group-hover:stroke-yellow-400'
                    }`} />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onDeleteTask(task.id); }}
                    className="p-1.5 text-gray-600 hover:text-red-500 rounded-full transition-colors duration-300"
                    aria-label="Delete task"
                >
                    <TrashIcon className="h-5 w-5" />
                </button>
            </div>
        </li>
    );
};

export default TaskItem;