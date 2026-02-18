import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Task } from './types';
import Header from './components/Header';
import TaskForm from './components/TaskForm';
import TaskList from './components/TaskList';
import SortControl from './components/SortControl';
import BulkActionsBar from './components/BulkActionsBar';
import ConfirmDeleteModal from './components/ConfirmDeleteModal';
import NotesModal from './components/NotesModal';
import RecycleBinModal from './components/RecycleBinModal';
import UndoToast from './components/UndoToast';
import { RecycleIcon } from './components/Icons';

// Fix: Add a simple unique ID generator to avoid external dependencies
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

interface DeletedTask extends Task {
    deletedAt: number;
}

function App() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [deletedTasks, setDeletedTasks] = useState<DeletedTask[]>([]);
    const [sortOrder, setSortOrder] = useState('default');

    // Selection state
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());

    // Modal states
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState<string[] | null>(null);

    const [isNotesModalOpen, setNotesModalOpen] = useState(false);
    const [taskForNotes, setTaskForNotes] = useState<Task | null>(null);
    
    const [isRecycleBinOpen, setRecycleBinOpen] = useState(false);
    
    // Undo state
    const [tasksToUndo, setTasksToUndo] = useState<Task[] | null>(null);
    const undoTimerRef = useRef<number | null>(null);

    // Load tasks from localStorage on initial render
    useEffect(() => {
        try {
            const storedTasks = localStorage.getItem('tasks');
            if (storedTasks) {
                setTasks(JSON.parse(storedTasks));
            }
            const storedDeletedTasks = localStorage.getItem('deletedTasks');
            if (storedDeletedTasks) {
                // Filter out tasks older than 30 days
                const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
                const recentDeletedTasks = JSON.parse(storedDeletedTasks).filter(
                    (task: DeletedTask) => task.deletedAt > thirtyDaysAgo
                );
                setDeletedTasks(recentDeletedTasks);
            }
        } catch (error) {
            console.error("Failed to load tasks from localStorage", error);
        }
    }, []);

    // Save tasks to localStorage whenever they change
    useEffect(() => {
        try {
            localStorage.setItem('tasks', JSON.stringify(tasks));
        } catch (error) {
            console.error("Failed to save tasks to localStorage", error);
        }
    }, [tasks]);

    useEffect(() => {
        try {
            localStorage.setItem('deletedTasks', JSON.stringify(deletedTasks));
        } catch (error) {
            console.error("Failed to save deleted tasks to localStorage", error);
        }
    }, [deletedTasks]);
    

    const sortedTasks = useMemo(() => {
        const tasksCopy = [...tasks];
        switch (sortOrder) {
            case 'manual':
                return tasksCopy;
            case 'importance':
                return tasksCopy.sort((a, b) => (b.isImportant ? 1 : 0) - (a.isImportant ? 1 : 0));
            case 'dueDate':
                return tasksCopy.sort((a, b) => {
                    if (!a.dueDate) return 1;
                    if (!b.dueDate) return -1;
                    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
                });
            case 'creation':
                // Create a reversed copy without mutating the original for manual sort
                return [...tasks].reverse();
            case 'default':
            default:
                 // Smart sort: important & not completed first, then by due date, then incomplete, then completed
                return tasksCopy.sort((a, b) => {
                    if (a.completed !== b.completed) return a.completed ? 1 : -1;
                    if (a.isImportant !== b.isImportant) return b.isImportant ? 1 : -1;
                    if (a.dueDate && b.dueDate) return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
                    if (a.dueDate) return -1;
                    if (b.dueDate) return 1;
                    return 0;
                });
        }
    }, [tasks, sortOrder]);


    const handleAddTask = (text: string, dueDate?: string) => {
        const newTask: Task = {
            id: uuidv4(),
            text,
            completed: false,
            isImportant: false,
            dueDate: dueDate || undefined,
            notes: ''
        };
        setTasks(prevTasks => [...prevTasks, newTask]);
    };
    
    const handleToggleComplete = (id: string) => {
        setTasks(tasks.map(task => task.id === id ? { ...task, completed: !task.completed } : task));
    };

    const handleToggleImportant = (id: string) => {
        setTasks(tasks.map(task => task.id === id ? { ...task, isImportant: !task.isImportant } : task));
    };
    
    const handleDeleteTask = (id: string) => {
       setTaskToDelete([id]);
       setDeleteModalOpen(true);
    };

    const finalizeDeletion = () => {
        if (undoTimerRef.current) {
            clearTimeout(undoTimerRef.current);
            undoTimerRef.current = null;
        }

        if (tasksToUndo) {
            const newDeletedTasks: DeletedTask[] = tasksToUndo.map(task => ({
                ...task,
                deletedAt: Date.now()
            }));
            setDeletedTasks(prev => [...prev, ...newDeletedTasks]);
            setTasksToUndo(null);
        }
    };

    const confirmDelete = () => {
        if (taskToDelete) {
             // If another delete action happens, finalize the previous one first.
            if (undoTimerRef.current) {
                finalizeDeletion();
            }

            const tasksToKeep = tasks.filter(task => !taskToDelete.includes(task.id));
            const tasksToDeleteNow = tasks.filter(task => taskToDelete.includes(task.id));
            
            setTasks(tasksToKeep);
            setTasksToUndo(tasksToDeleteNow);

            // Set a timer to move them to the recycle bin after 10s
            undoTimerRef.current = window.setTimeout(finalizeDeletion, 10000);
        }
        
        if (isSelectionMode) {
            handleDeselectAll();
        }

        setDeleteModalOpen(false);
        setTaskToDelete(null);
    };

    const handleUndoDelete = () => {
        if (undoTimerRef.current) {
            clearTimeout(undoTimerRef.current);
            undoTimerRef.current = null;
        }

        if (tasksToUndo) {
            setTasks(prevTasks => [...prevTasks, ...tasksToUndo]);
            setTasksToUndo(null);
        }
    };


    const handleLongPressTask = (id: string) => {
        setIsSelectionMode(true);
        setSelectedTasks(new Set([id]));
    };
    
    const handleSelectTask = (id: string) => {
        if (!isSelectionMode) return;
        const newSelection = new Set(selectedTasks);
        if (newSelection.has(id)) {
            newSelection.delete(id);
        } else {
            newSelection.add(id);
        }
        
        if (newSelection.size === 0) {
            setIsSelectionMode(false);
        }
        setSelectedTasks(newSelection);
    };

    const handleDeselectAll = () => {
        setSelectedTasks(new Set());
        setIsSelectionMode(false);
    };
    
    const handleBulkDelete = () => {
        setTaskToDelete(Array.from(selectedTasks));
        setDeleteModalOpen(true);
    };

    const handleBulkMarkComplete = () => {
        setTasks(tasks.map(task => selectedTasks.has(task.id) ? { ...task, completed: true } : task));
        handleDeselectAll();
    };

    const handleBulkMarkImportant = () => {
        setTasks(tasks.map(task => selectedTasks.has(task.id) ? { ...task, isImportant: true } : task));
        handleDeselectAll();
    };

    const handleOpenNotesModal = (task: Task) => {
        setTaskForNotes(task);
        setNotesModalOpen(true);
    };

    const handleSaveNotes = (taskId: string, notes: string) => {
        setTasks(tasks.map(task => task.id === taskId ? { ...task, notes: notes } : task));
        setNotesModalOpen(false);
        setTaskForNotes(null);
    };
    
    const handleRestoreTask = (id: string) => {
        const taskToRestore = deletedTasks.find(task => task.id === id);
        if (taskToRestore) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { deletedAt, ...originalTask } = taskToRestore;
            setTasks(prev => [...prev, originalTask]);
            setDeletedTasks(prev => prev.filter(task => task.id !== id));
        }
    };
    
    const handlePermanentlyDelete = (id: string) => {
        setDeletedTasks(prev => prev.filter(task => task.id !== id));
    };

    const handleEmptyBin = () => {
        setDeletedTasks([]);
    };

    const handleReorder = (draggedId: string, droppedOnId: string) => {
        const draggedIndex = tasks.findIndex(t => t.id === draggedId);
        const droppedOnIndex = tasks.findIndex(t => t.id === droppedOnId);
        if (draggedIndex === -1 || droppedOnIndex === -1 || draggedIndex === droppedOnIndex) return;

        const items = [...tasks];
        const [reorderedItem] = items.splice(draggedIndex, 1);
        items.splice(droppedOnIndex, 0, reorderedItem);

        setTasks(items);
        if (sortOrder !== 'manual') {
            setSortOrder('manual');
        }
    };


    return (
        <div className="min-h-screen text-white font-sans p-4 sm:p-6 lg:p-8">
            <div className="container mx-auto max-w-2xl bg-slate-950/40 backdrop-blur-3xl rounded-3xl p-6 sm:p-8 border border-white/5 shadow-2xl">
                <Header />
                <main className="mt-8">
                    <TaskForm onAddTask={handleAddTask} />
                    <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                        <SortControl sortOrder={sortOrder} onSortChange={setSortOrder} />
                         <button 
                            onClick={() => setRecycleBinOpen(true)}
                            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors group"
                         >
                            <RecycleIcon className="h-5 w-5 group-hover:rotate-12 transition-transform" />
                            <span>Recycle Bin ({deletedTasks.length})</span>
                        </button>
                    </div>
                    <TaskList
                        tasks={sortedTasks}
                        selectedTasks={selectedTasks}
                        isSelectionMode={isSelectionMode}
                        onToggleComplete={handleToggleComplete}
                        onToggleImportant={handleToggleImportant}
                        onDeleteTask={handleDeleteTask}
                        onSelectTask={handleSelectTask}
                        onLongPressTask={handleLongPressTask}
                        onOpenNotesModal={handleOpenNotesModal}
                        onReorder={handleReorder}
                    />
                </main>
            </div>

            {isSelectionMode && selectedTasks.size > 0 && (
                <BulkActionsBar
                    selectedCount={selectedTasks.size}
                    onDelete={handleBulkDelete}
                    onMarkComplete={handleBulkMarkComplete}
                    onMarkImportant={handleBulkMarkImportant}
                    onDeselectAll={handleDeselectAll}
                />
            )}
            
            <ConfirmDeleteModal
                isOpen={isDeleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                itemCount={taskToDelete?.length || 0}
            />

            <NotesModal
                isOpen={isNotesModalOpen}
                onClose={() => setNotesModalOpen(false)}
                onSave={handleSaveNotes}
                task={taskForNotes}
            />

            <RecycleBinModal
                isOpen={isRecycleBinOpen}
                onClose={() => setRecycleBinOpen(false)}
                deletedTasks={deletedTasks}
                onRestore={handleRestoreTask}
                onPermanentlyDelete={handlePermanentlyDelete}
                onEmptyBin={handleEmptyBin}
            />

            <UndoToast
                isOpen={!!tasksToUndo}
                onUndo={handleUndoDelete}
                onClose={finalizeDeletion}
                message={`Deleted ${tasksToUndo?.length || 0} task(s).`}
            />
        </div>
    );
}

export default App;