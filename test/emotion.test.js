import test from "node:test";
import assert from "node:assert/strict";
import {
  applyAIDelta,
  applyEmotion,
  applyEmotionImpact,
  getEmotionState,
  restoreEmotion
} from "../server/core/emotion.js";

const fixedNow = 1_700_000_000_000;

function resetEmotion(snapshot = {}) {
  restoreEmotion({
    happiness: 50,
    stress: 50,
    energy: 50,
    emotion: "NEUTRAL",
    lastUpdated: fixedNow,
    ...snapshot
  });
}

test("emotion: clamps AI-provided deltas and keeps state within 0..100", () => {
  const originalNow = Date.now;
  Date.now = () => fixedNow;
  try {
    resetEmotion();
    applyAIDelta({ happiness: 10_000, stress: -10_000, energy: 10_000 });

    const state = getEmotionState();
    assert.equal(state.happiness, 80);
    assert.equal(state.stress, 20);
    assert.equal(state.energy, 80);
    for (const axis of [state.happiness, state.stress, state.energy]) {
      assert.ok(axis >= 0 && axis <= 100);
    }
  } finally {
    Date.now = originalNow;
  }
});

test("emotion: applies deterministic impact for a known AI emotion", () => {
  const originalNow = Date.now;
  Date.now = () => fixedNow;
  try {
    resetEmotion();
    const result = applyEmotion("JOY");

    assert.equal(result.delta.happiness, 15);
    assert.equal(result.after.happiness, 65);
    assert.equal(result.after.stress, 40);
    assert.equal(result.after.energy, 58);
    assert.equal(result.after.emotion, "JOY");
  } finally {
    Date.now = originalNow;
  }
});

test("emotion: neutral text uses the normal-interaction calibration", () => {
  const originalNow = Date.now;
  Date.now = () => fixedNow;
  try {
    resetEmotion();
    const result = applyEmotionImpact("Vamos conversar sobre isso.");

    assert.deepEqual(result.delta, { happiness: 1.5, stress: 0, energy: -1 });
    assert.equal(result.after.happiness, 51.5);
    assert.equal(result.after.stress, 50);
    assert.equal(result.after.energy, 49);
  } finally {
    Date.now = originalNow;
  }
});

test("emotion: restore clamps out-of-range persisted state", () => {
  resetEmotion({ happiness: 130, stress: -10, energy: 60 });
  const state = getEmotionState();
  assert.equal(state.happiness, 100);
  assert.equal(state.stress, 0);
  assert.equal(state.energy, 60);
});
