let intervalId: number | null = null;
let timeLeft: number = 0;
let isPaused: boolean = false;

self.onmessage = (event: MessageEvent) => {
  const message = event.data;

  switch (message.type) {
    case 'start':
      if (intervalId) clearInterval(intervalId);
      timeLeft = message.duration;
      isPaused = false;
      
      self.postMessage({ type: 'tick', timeLeft });
      
      intervalId = self.setInterval(() => {
        if (!isPaused && timeLeft > 0) {
          timeLeft--;
          self.postMessage({ type: 'tick', timeLeft });
        }
        
        if (timeLeft <= 0) {
          self.postMessage({ type: 'completed' });
          if (intervalId) clearInterval(intervalId);
          intervalId = null;
        }
      }, 1000) as unknown as number;
      break;
      
    case 'pause':
      isPaused = true;
      break;
      
    case 'resume':
      isPaused = false;
      break;
      
    case 'reset':
      if (intervalId) clearInterval(intervalId);
      intervalId = null;
      timeLeft = message.duration;
      isPaused = false;
      self.postMessage({ type: 'tick', timeLeft });
      break;
      
    case 'terminate':
      if (intervalId) clearInterval(intervalId);
      self.close();
      break;
  }
};
