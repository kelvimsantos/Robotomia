let workingMemory = [];

export function addTrace(user, bot) {
  workingMemory.push({
    time: new Date(),
    user,
    bot
  });

  // mantém só últimas 20
  if (workingMemory.length > 20) {
    workingMemory.shift();
  }
}

export function getWorkingMemory() {
  return workingMemory;
}

export function clearWorkingMemory() {
  workingMemory = [];
}
