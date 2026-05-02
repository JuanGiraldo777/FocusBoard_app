import { useState, useEffect, useRef } from 'react';

interface TaskDeclarationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: (task: string) => void;
  recentTasks: string[];
}

export function TaskDeclarationModal({ isOpen, onClose, onStart, recentTasks }: TaskDeclarationModalProps) {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus al abrir
  useEffect(() => {
    if (isOpen) {
      setInputValue('');
      setError('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isValid = inputValue.trim().length >= 3;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      setError('Mínimo 3 caracteres');
      return;
    }
    onStart(inputValue.trim());
  };

  const selectSuggestion = (task: string) => {
    setInputValue(task);
    setError('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          ¿Qué vas a hacer?
        </h2>
        <p className="text-gray-600 mb-6">
          Declara tu tarea antes de iniciar el temporizador.
        </p>

        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setError('');
            }}
            placeholder="Ej: Estudiar matemáticas"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-2"
            aria-label="Declaración de tarea"
          />
          {error && (
            <p className="text-red-500 text-sm mb-2" role="alert">
              {error}
            </p>
          )}

          {/* Sugerencias */}
          {recentTasks.length > 0 && (
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-2">Tareas recientes:</p>
              <div className="flex flex-wrap gap-2">
                {recentTasks.map((task, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => selectSuggestion(task)}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition"
                  >
                    {task}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!isValid}
              className={`px-4 py-2 rounded-lg text-white transition ${
                isValid
                  ? 'bg-indigo-600 hover:bg-indigo-700'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              Iniciar Timer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
