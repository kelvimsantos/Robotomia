// core/emotionMap.js
export const EMOTION_MAP = {
  JOY: {
    happiness: +5,
    energy: +3,
    stress: -3,
    face: "happy"
  },
  CURIOSITY: {
    happiness: +2,
    energy: +2,
    stress: -1,
    face: "curious"
  },
  ANGER: {
    happiness: -4,
    energy: +2,
    stress: +6,
    face: "angry"
  },
  SADNESS: {
    happiness: -6,
    energy: -4,
    stress: +3,
    face: "sad"
  },
  SHAME: {
    happiness: -3,
    energy: -2,
    stress: +4,
    face: "shy"
  },
  NEUTRAL: {
    happiness: 0,
    energy: 0,
    stress: 0,
    face: "neutral"
  }
};
