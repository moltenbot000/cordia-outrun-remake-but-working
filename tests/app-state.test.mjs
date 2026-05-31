import assert from "node:assert/strict";
import test from "node:test";

import { createInitialState, getCountdownValue, normalizePlayerName } from "../public/app.js";

test("createInitialState starts on main menu with no racer", () => {
  assert.deepEqual(createInitialState(), {
    screen: "menu",
    playerName: "",
    countdownIndex: 0,
  });
});

test("normalizePlayerName trims and collapses spaces", () => {
  assert.equal(normalizePlayerName("  Fast   Driver  "), "Fast Driver");
});

test("getCountdownValue returns countdown values before GO fallback", () => {
  assert.equal(getCountdownValue(0), "3");
  assert.equal(getCountdownValue(1), "2");
  assert.equal(getCountdownValue(2), "1");
  assert.equal(getCountdownValue(3), "GO");
});
