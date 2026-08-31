import { blasterTraits } from "./synergies.js";

export const SYNERGY_CATALOG = Object.freeze([
  { id: "forkedGuidance", name: "FORKED GUIDANCE", requires: "Fork + Seek" },
  {
    id: "criticalConduction",
    name: "CRITICAL CONDUCTION",
    requires: "Crit + Arc",
  },
  { id: "massDriver", name: "MASS DRIVER", requires: "Payload + Velocity" },
  { id: "phaseDischarge", name: "PHASE DISCHARGE", requires: "Pierce + Nova" },
  { id: "prismaticPhase", name: "PRISMATIC PHASE", requires: "Pierce + Prism" },
  {
    id: "seekingStorm",
    name: "SEEKING STORM",
    requires: "Fork + Seek + Arc",
    apex: true,
  },
  {
    id: "criticalMass",
    name: "CRITICAL MASS",
    requires: "Payload + Crit + Nova",
    apex: true,
  },
  {
    id: "railPrism",
    name: "RAIL PRISM",
    requires: "Velocity + Pierce + Prism",
    apex: true,
  },
  {
    id: "recursiveViolence",
    name: "RECURSIVE VIOLENCE",
    requires: "Fork + Pierce + Seek + Arc",
    apex: true,
  },
  {
    id: "eventHorizon",
    name: "EVENT HORIZON",
    requires: "Payload + Nova + Anchor + Pierce",
    apex: true,
  },
  {
    id: "thunderChoir",
    name: "THUNDER CHOIR",
    requires: "Arc + Ember + Wisp",
    apex: true,
  },
  {
    id: "prismaticRazor",
    name: "PRISMATIC RAZOR",
    requires: "Razor + Prism + Velocity",
    apex: true,
  },
  {
    id: "guardianSwarm",
    name: "GUARDIAN SWARM",
    requires: "Aegis + Gundrone + Fork",
    apex: true,
  },
  {
    id: "singularityCourt",
    name: "SINGULARITY COURT",
    requires: "Wisp + Anchor + Nova + Payload",
    apex: true,
  },
]);

export function activeSynergies(player) {
  const traits = blasterTraits(player);
  return SYNERGY_CATALOG.filter((synergy) => traits[synergy.id]);
}
