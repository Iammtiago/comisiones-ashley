import test from "node:test";
import assert from "node:assert/strict";
import {
  moneyToCents,
  validDate,
  validateSale,
  validatePeriod,
  todayIn,
  csvCell,
} from "../lib/domain.mjs";
test("money is exact and rejects negatives, precision and overflow", () => {
  assert.equal(moneyToCents("12.34"), 1234);
  assert.equal(moneyToCents("0,10"), 10);
  for (const value of [
    "-1",
    "1.001",
    "Infinity",
    "1e2",
    "",
    "99999999999",
    {},
    null,
  ])
    assert.throws(() => moneyToCents(value));
});
test("calendar dates validated without timezone drift", () => {
  assert.equal(validDate("2026-02-28"), true);
  assert.equal(validDate("2026-02-30"), false);
  assert.equal(validDate("2026-13-01"), false);
  assert.equal(
    todayIn("America/Caracas", new Date("2026-11-07T02:00:00Z")),
    "2026-11-06",
  );
});
test("required invoice and commission; optional total and payment", () => {
  assert.equal(
    validateSale({ invoice: " F-1 ", commission: "0", date: "2026-11-06" })
      .invoice,
    "F-1",
  );
  assert.equal(
    validateSale({ invoice: "F-1", commission: "2", date: "2026-11-06" }).total,
    null,
  );
  assert.throws(() =>
    validateSale({ invoice: " ", commission: "1", date: "2026-11-06" }),
  );
  assert.throws(() =>
    validateSale({ invoice: "F", commission: "1", date: "2026-02-30" }),
  );
  assert.throws(() =>
    validateSale({
      invoice: "F",
      commission: "1",
      date: "2026-11-06",
      payment: "otro",
    }),
  );
});
test("period endpoints inclusive and ordered", () => {
  assert.equal(
    validatePeriod({
      name: "Mi quincena",
      start: "2026-11-01",
      end: "2026-11-15",
    }).end,
    "2026-11-15",
  );
  assert.throws(() =>
    validatePeriod({ name: "Q", start: "2026-11-15", end: "2026-11-01" }),
  );
});
test("csv protects formulas and quotes", () => {
  assert.equal(csvCell("=1+1"), '"\'=1+1"');
  assert.equal(csvCell('Ana "A"'), '"Ana ""A"""');
});
