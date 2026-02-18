
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
        alert("Audio recording is not supported. Please ensure you are using a modern browser with HTTPS.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
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
      alert("Could not access microphone. Please check browser permissions.");
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
    
    // Safety timeout to reset UI if API hangs
    transcriptionTimeoutRef.current = window.setTimeout(() => {
      if (isTranscribing) {
        setIsTranscribing(false);
        alert("Transcription is taking too long. Please try again.");
      }
    }, 20000);

    try {
      const base64Audio = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          if (result.includes(',')) {
            resolve(result.split(',')[1]);
          } else {
            reject(new Error("Failed to encode audio data correctly."));
          }
        };
        reader.onerror = () => reject(new Error("Audio reader failed"));
        reader.readAsDataURL(blob);
      });

      // Initialize AI instance. Relying on process.env.API_KEY injection.
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Strict MIME type normalization (remove codec info)
      const normalizedMimeType = blob.type.split(';')[0] || 'audio/webm';

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            { 
              inlineData: { 
                data: base64Audio, 
                mimeType: normalizedMimeType 
              } 
            },
            { text: "Listen to this audio and write down the single to-do list task mentioned. Return ONLY the text of the task. Keep it very short." }
          ]
        },
        config: {
          maxOutputTokens: 50,
          temperature: 0,
        }
      });

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
      console.error("Transcription API error:", err);
      alert("AI Service error. Please check your internet connection and try again.");
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
          placeholder={isTranscribing ? "Thinking..." : isRecording ? "Recording..." : "Add a new task..."}
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
