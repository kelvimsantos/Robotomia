import test from "node:test";
import assert from "node:assert/strict";
import {
  addInteraction,
  clearWorkingMemory,
  getRecentInteractions
} from "../server/memory/unifiedMemory.js";

test("working memory stores interactions and returns the requested recent count", () => {
  clearWorkingMemory();
  addInteraction("Oi", "Olá!", "JOY");
  addInteraction("Como vai?", "Bem!", "NEUTRAL");

  const recent = getRecentInteractions(1);
  assert.equal(recent.length, 1);
  assert.equal(recent[0].user, "Como vai?");
  assert.equal(recent[0].bot, "Bem!");
  assert.ok(recent[0].timestamp instanceof Date);
  assert.equal(typeof recent[0].moodSnapshot.happiness, "number");
});

test("working memory retains only the configured maximum of 20 interactions", () => {
  clearWorkingMemory();
  for (let index = 0; index < 25; index += 1) {
    addInteraction(`user-${index}`, `bot-${index}`, "NEUTRAL");
  }

  const allRecent = getRecentInteractions(25);
  assert.equal(allRecent.length, 20);
  assert.equal(allRecent[0].user, "user-5");
  assert.equal(allRecent.at(-1).user, "user-24");
  clearWorkingMemory();
});
