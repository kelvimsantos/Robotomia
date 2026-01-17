// server/memory/shortTerm.js

const SHORT_TERM_LIMIT_MINUTES = 60;
let shortTermMemory = [];

export function addShortTermMemory(entry) {
  shortTermMemory.push({
    ...entry,
    timestamp: new Date()
  });

  cleanup();
}

export function getShortTermMemory() {
  cleanup();
  return shortTermMemory;
}

export function clearShortTermMemory() {
  shortTermMemory = [];
}

function cleanup() {
  const now = Date.now();
  shortTermMemory = shortTermMemory.filter(item => {
    const diffMinutes =
      (now - new Date(item.timestamp).getTime()) / 60000;
    return diffMinutes <= SHORT_TERM_LIMIT_MINUTES;
  });
}