
import React, { useState, useRef } from 'react';
import { PlusIcon, MicrophoneIcon, StopIcon } from './Icons';
import { GoogleGenAI } from "@google/genai";

interface TaskFormProps {
  onAddTask: (text: string, dueDate?: string) => void;
}

const TaskForm: React.FC<TaskFormProps> = ({ onAddTask }) => {
  const [text, setText] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onAddTask(text.trim(), dueDate);
      setText('');
      setDueDate('');
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        transcribeAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone. Please check your permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeAudio = async (blob: Blob) => {
    setIsTranscribing(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];
        
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: {
            parts: [
              { inlineData: { data: base64Audio, mimeType: 'audio/webm' } },
              { text: "Transcribe this audio into a clear and concise to-do list task. Only return the transcribed text, nothing else." }
            ]
          }
        });

        const transcript = response.text || "";
        if (transcript.trim()) {
          setText(transcript.trim());
        }
        setIsTranscribing(false);
      };
    } catch (err) {
      console.error("Transcription error:", err);
      setIsTranscribing(false);
      alert("Failed to transcribe audio. Please try again.");
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-3 mb-8">
      <div className="flex-grow relative">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={isTranscribing ? "Transcribing your voice..." : "Add a new task..."}
          aria-label="Add a new task"
          disabled={isTranscribing}
          className={`w-full bg-white/5 border border-white/10 backdrop-blur-sm rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 min-w-0 ${isTranscribing ? 'animate-pulse opacity-70' : ''}`}
        />
        {isTranscribing && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>
      <div className="flex items-center gap-3">
        <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            aria-label="Due date"
            className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-lg px-4 py-3 text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 w-full sm:w-auto"
            style={{ colorScheme: 'dark' }}
        />
        <div className="flex items-center gap-2">
          <button
              type="button"
              onClick={toggleRecording}
              aria-label={isRecording ? "Stop recording" : "Record voice task"}
              className={`p-3 rounded-lg transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center relative ${isRecording ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'bg-white/10 text-gray-400 hover:text-white hover:bg-white/20'}`}
              disabled={isTranscribing}
          >
              {isRecording ? <StopIcon className="h-6 w-6" /> : <MicrophoneIcon className="h-6 w-6" />}
              {isRecording && (
                <span className="absolute inset-0 rounded-lg animate-ping bg-red-500 opacity-20 pointer-events-none"></span>
              )}
          </button>
          <button
              type="submit"
              aria-label="Add task"
              className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-blue-500 transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100"
              disabled={!text.trim() || isTranscribing}
          >
              <PlusIcon className="h-6 w-6" />
          </button>
        </div>
      </div>
    </form>
  );
};

export default TaskForm;
