let currentContext = {
  topic: null,
  keywords: [],
  lastInteraction: null
};

export function updateContext(userInput) {
  currentContext.lastInteraction = new Date();

  if (userInput.toLowerCase().includes("olho")) {
    currentContext.topic = "animação visual e emoções";
    currentContext.keywords = ["olhos", "emoção", "UI"];
  }
}

export function getContext() {
  return currentContext;
}
