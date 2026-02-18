
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
  const transcriptionTimeoutRef = useRef<number | null>(null);

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
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Audio recording is not supported in this browser environment. Ensure you are using HTTPS.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Determine the most robust MIME type supported by the browser
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') 
        ? 'audio/webm' 
        : 'audio/mp4';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
        // Minimum size check to avoid processing accidental tiny clicks
        if (audioBlob.size > 1000) { 
            transcribeAudio(audioBlob);
        } else {
            setIsTranscribing(false);
        }
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone access error:", err);
      alert("Microphone access failed. Please ensure you have granted permissions.");
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
    
    // Set a safety timeout (15 seconds) to reset the UI if the API hangs
    transcriptionTimeoutRef.current = window.setTimeout(() => {
      if (isTranscribing) {
        setIsTranscribing(false);
        alert("Transcription is taking longer than expected. Please check your connection and try again.");
      }
    }, 15000);

    try {
      const base64Audio = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.onerror = () => reject(new Error("Audio encoding failed"));
        reader.readAsDataURL(blob);
      });

      if (!process.env.API_KEY) {
        throw new Error("API Key is missing. Please check your environment variables.");
      }

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Normalize MIME type to simple base formats expected by the API
      const normalizedMimeType = blob.type.split(';')[0] || 'audio/webm';

      // Using the Native Audio model for best performance and latency
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        contents: {
          parts: [
            { 
              inlineData: { 
                data: base64Audio, 
                mimeType: normalizedMimeType 
              } 
            },
            { text: "Transcribe this audio clip into a short, clear to-do list task. Output ONLY the text of the task." }
          ]
        },
        config: {
          maxOutputTokens: 60,
          temperature: 0, // Zero temperature for the most accurate transcription
        }
      });

      // Clear timeout as response received
      if (transcriptionTimeoutRef.current) {
        window.clearTimeout(transcriptionTimeoutRef.current);
      }

      const transcript = response.text;
      if (transcript && transcript.trim()) {
        const cleanedText = transcript.trim()
          .replace(/^["']|["']$/g, '')
          .replace(/^(Task|Task:)\s*/i, '');
        setText(cleanedText);
      }
    } catch (err: any) {
      console.error("Transcription error:", err);
      alert(err.message || "Failed to connect to the AI service. Please try again.");
    } finally {
      setIsTranscribing(false);
      if (transcriptionTimeoutRef.current) {
        window.clearTimeout(transcriptionTimeoutRef.current);
      }
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
          placeholder={isTranscribing ? "Analyzing audio..." : isRecording ? "Recording... (tap to stop)" : "Add a new task..."}
          aria-label="Add a new task"
          disabled={isTranscribing}
          className={`w-full bg-white/5 border border-white/10 backdrop-blur-sm rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 min-w-0 ${isTranscribing ? 'animate-pulse opacity-70' : ''}`}
        />
        {isTranscribing && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
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
