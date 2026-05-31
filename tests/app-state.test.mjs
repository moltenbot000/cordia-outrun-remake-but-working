import assert from "node:assert/strict";
import test from "node:test";

import { createInitialRaceState, stepRace } from "../public/app.js";

const idleInput = {
  left: false,
  right: false,
  accelerate: false,
  brake: false,
};

test("createInitialRaceState starts race with traffic and clean car", () => {
  const state = createInitialRaceState();

  assert.equal(state.speed, 0);
  assert.equal(state.damage, 0);
  assert.equal(state.position, 0);
  assert.equal(state.opponents.length, 3);
});

test("stepRace accelerates and advances distance", () => {
  const state = createInitialRaceState();
  const next = stepRace(state, { ...idleInput, accelerate: true }, 1);

  assert.ok(next.speed > state.speed);
  assert.ok(next.distance > state.distance);
  assert.ok(next.score > state.score);
});

test("stepRace steers within lane bounds", () => {
  const state = { ...createInitialRaceState(), speed: 200, position: 0.98 };
  const next = stepRace(state, { ...idleInput, right: true }, 1);

  assert.equal(next.position, 1);
});

test("stepRace applies damage on opponent collision", () => {
  const state = {
    ...createInitialRaceState(),
    speed: 100,
    opponents: [{ id: 1, lane: 0, y: 0.82, color: "#ff3b3b", passed: false }],
  };
  const next = stepRace(state, { ...idleInput, accelerate: true }, 0.016);

  assert.equal(next.damage, 18);
  assert.ok(next.collisionCooldown > 0);
});
