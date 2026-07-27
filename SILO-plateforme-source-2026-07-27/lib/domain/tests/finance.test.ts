import assert from "node:assert/strict";
import test from "node:test";
import {
  advisorCapacityState,
  computeOperationalAllocation,
  computeSplit,
  frpOutcome,
  meetsQuoteFloor,
} from "../src/finance.ts";

test("applique la repartition 70/20/10 sur 800 EUR HT", () => {
  assert.deepEqual(computeSplit(800), {
    ht: 800,
    tva: 160,
    ttc: 960,
    partAgence: 560,
    partSilo: 160,
    partFrp: 80,
  });
});

test("reproduit l'exemple PSP du business plan", () => {
  const allocation = computeOperationalAllocation(800);

  assert.equal(allocation.fraisPspTotal, 16);
  assert.equal(allocation.fraisPspAgence, 12.44);
  assert.equal(allocation.fraisPspSilo, 3.56);
  assert.equal(allocation.partSiloApresPsp, 156.44);
});

test("calcule la prime conseiller a 1,6 % du GMV eligible", () => {
  const allocation = computeOperationalAllocation(800, {
    advisorCommissionEligible: true,
  });

  assert.equal(allocation.primeConseiller, 12.8);
  assert.equal(allocation.reserveIncidents, 4);
  assert.equal(allocation.contributionSiloApresVariables, 139.64);
});

test("conserve exactement le HT apres ventilation avec des centimes", () => {
  const split = computeSplit(800.01);
  assert.equal(
    Math.round((split.partAgence + split.partSilo + split.partFrp) * 100),
    80_001,
  );
});

test("applique les planchers de devis", () => {
  assert.equal(meetsQuoteFloor(799.99, "ponctuel"), false);
  assert.equal(meetsQuoteFloor(800, "ponctuel"), true);
  assert.equal(meetsQuoteFloor(599.99, "abonnement"), false);
  assert.equal(meetsQuoteFloor(600, "abonnement"), true);
});

test("refuse les montants non valides", () => {
  assert.throws(() => computeSplit(Number.NaN), RangeError);
  assert.throws(() => computeSplit(-1), RangeError);
});

test("n'automatise aucune decision FRP tant que la politique est en conflit", () => {
  assert.equal(frpOutcome(0), "decision_manuelle_requise");
  assert.equal(frpOutcome(24), "decision_manuelle_requise");
  assert.throws(() => frpOutcome(-1), RangeError);
});

test("applique l'alerte conseiller a 72 et la capacite maximale a 80", () => {
  assert.deepEqual(advisorCapacityState(71), {
    activeProjects: 71,
    warning: false,
    full: false,
    limit: 80,
    warningThreshold: 72,
  });
  assert.equal(advisorCapacityState(72).warning, true);
  assert.equal(advisorCapacityState(79).full, false);
  assert.equal(advisorCapacityState(80).full, true);
});
