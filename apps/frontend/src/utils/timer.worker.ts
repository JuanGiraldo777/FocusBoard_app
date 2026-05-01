import type { WorkerMessage, WorkerResponse } from '../types/timer';

let intervalId: number | null = null;
let timeLeft = 0;
let isRunning = false;

const sendMessage = (message: WorkerResponse) => {
  self.postMessage(message);
};

self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const message = event.data;

  switch (message.type) {
    case 'start':
      if (intervalId) clearInterval(intervalId);
      timeLeft = message.duration;
      isRunning = true;

      intervalId = setInterval(() => {
        if (timeLeft > 0) {
          timeLeft--;
          sendMessage({ type: 'tick', timeLeft });

          if (timeLeft === 0) {
            isRunning = false;
            if (intervalId) clearInterval(intervalId);
            intervalId = null;
            sendMessage({ type: 'completed' });
          }
        }
      }, 1000);
      break;

    case 'pause':
      isRunning = false;
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      break;

    case 'resume':
      if (!isRunning && timeLeft > 0) {
        isRunning = true;
        intervalId = setInterval(() => {
          if (timeLeft > 0) {
            timeLeft--;
            sendMessage({ type: 'tick', timeLeft });

            if (timeLeft === 0) {
              isRunning = false;
              if (intervalId) clearInterval(intervalId);
              intervalId = null;
              sendMessage({ type: 'completed' });
            }
          }
        }, 1000);
      }
      break;

    case 'reset':
      isRunning = false;
      timeLeft = message.duration;
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      break;

    case 'terminate':
      isRunning = false;
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      self.close();
      break;
  }
};
