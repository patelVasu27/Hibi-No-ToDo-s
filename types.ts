// Fix: Define and export the Task interface. The previous content was component logic and belonged in App.tsx.
export interface Task {
  id: string;
  text: string;
  completed: boolean;
  isImportant: boolean;
  dueDate?: string;
  notes?: string;
}