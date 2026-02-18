import React, { useState } from 'react';
import { Task } from '../types';
import TaskItem from './TaskItem';

interface TaskListProps {
    tasks: Task[];
    selectedTasks: Set<string>;
    isSelectionMode: boolean;
    onToggleComplete: (id: string) => void;
    onToggleImportant: (id:string) => void;
    onDeleteTask: (id: string) => void;
    onSelectTask: (id: string) => void;
    onLongPressTask: (id: string) => void;
    onOpenNotesModal: (task: Task) => void;
    onReorder: (draggedId: string, droppedOnId: string) => void;
}

const TaskList: React.FC<TaskListProps> = ({ tasks, selectedTasks, isSelectionMode, onToggleComplete, onToggleImportant, onDeleteTask, onSelectTask, onLongPressTask, onOpenNotesModal, onReorder }) => {
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [justDroppedId, setJustDroppedId] = useState<string | null>(null);
    const [removingId, setRemovingId] = useState<string | null>(null);

    if (tasks.length === 0) {
        return <p className="text-center text-gray-500 py-8 animate-pulse">No tasks yet. Add one to get started!</p>;
    }

    const handleDragStart = (e: React.DragEvent, id: string) => {
        e.dataTransfer.setData('taskId', id);
        setDraggingId(id);
    };

    const handleDrop = (e: React.DragEvent, targetId: string) => {
        const draggedId = e.dataTransfer.getData('taskId');
        if (draggedId && draggedId !== targetId) {
            onReorder(draggedId, targetId);
            setJustDroppedId(draggedId);
            setTimeout(() => {
                setJustDroppedId(null);
            }, 300);
        }
        setDraggingId(null);
    };
    
    const handleDragEnd = () => {
        setDraggingId(null);
    };

    const handleAnimatedDelete = (id: string) => {
        // Trigger exit animation first
        setRemovingId(id);
        // Wait for animation to finish before calling parent delete logic
        setTimeout(() => {
            onDeleteTask(id);
            setRemovingId(null);
        }, 300);
    };

    return (
        <ul className="space-y-3">
            {tasks.map(task => (
                <TaskItem
                    key={task.id}
                    task={task}
                    isSelected={selectedTasks.has(task.id)}
                    isSelectionMode={isSelectionMode}
                    isDragging={draggingId === task.id}
                    isJustDropped={justDroppedId === task.id}
                    isRemoving={removingId === task.id}
                    onToggleComplete={onToggleComplete}
                    onToggleImportant={onToggleImportant}
                    onDeleteTask={handleAnimatedDelete}
                    onSelectTask={onSelectTask}
                    onLongPressTask={onLongPressTask}
                    onOpenNotesModal={onOpenNotesModal}
                    onDragStart={handleDragStart}
                    onDrop={handleDrop}
                    onDragEnd={handleDragEnd}
                />
            ))}
        </ul>
    );
};

export default TaskList;