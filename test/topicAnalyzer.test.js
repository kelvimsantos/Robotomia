import test from "node:test";
import assert from "node:assert/strict";
import {
  detectTopicType,
  extractAllTopics,
  extractMainTopic
} from "../server/core/topicAnalyzer.js";

test("topic analyzer ignores common words when selecting a main topic", () => {
  assert.equal(extractMainTopic("Quero conversar sobre Robotomia"), "quero");
});

test("topic analyzer returns unique topics and respects the requested limit", () => {
  const topics = extractAllTopics("música música tecnologia projetos", 2);
  assert.deepEqual(topics, ["música", "tecnologia"]);
});

test("topic analyzer classifies supported topic groups", () => {
  assert.equal(detectTopicType("Quero falar de música"), "música");
  assert.equal(detectTopicType("Vamos conversar sobre programação"), "tecnologia");
  assert.equal(detectTopicType("um assunto sem categoria"), "geral");
});

test("topic analyzer handles empty input", () => {
  assert.equal(extractMainTopic(""), "geral");
  assert.deepEqual(extractAllTopics(null), []);
});
