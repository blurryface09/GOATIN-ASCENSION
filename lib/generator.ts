export type AscensionIdentity = {
  clan: string;
  aura: string;
  weapon: string;
  role: string;
  rank: string;
  corruption: string;
  lore: string;
  crest: string;
};

const clans = ["Crimson Peak", "Ash Horn Clan", "Hollow Monks", "Black Summit", "Sun Eaters"];
const weapons = ["Katana of Echoes", "Bloodfang Blade", "Silent Tanto", "Mountain Spear", "Relic Bow", "Ash Cleaver"];
const auras = ["Crimson Flame", "Shadow Purple", "Frost Smoke", "Golden Spirit", "Void Ash", "Blood Mist"];
const roles = ["Ronin", "Beast Hunter", "Relic Keeper", "Mountain Guardian", "Corrupted Climber", "Order Disciple"];
const ranks = ["First Climber", "Mountain Survivor", "Peak Seeker", "Order Disciple", "Ascended One"];
const corruptions = ["Stable", "Touched", "Corrupted", "Hollowed", "Ascended"];

const loreLines = [
  "Walked into the mountain alone. Returned with red eyes.",
  "Once a guardian of Black Summit. Corrupted after surviving the Seventh Climb.",
  "Carries a cursed relic forged beneath Crimson Peak.",
  "Heard the summit whisper and answered without fear.",
  "Bound to the old snow by an oath no living monk remembers.",
  "Marked by ash, crowned by silence, and followed by a blade that never cools.",
  "Climbed past the lantern gates and brought back a name from the dark.",
  "Keeps watch where the wind turns crimson before dawn."
];

const crests = ["山", "炎", "月", "牙", "灰"];

const pick = <T,>(items: T[]) => items[Math.floor(Math.random() * items.length)];

export function generateIdentity(): AscensionIdentity {
  const clan = pick(clans);

  return {
    clan,
    aura: pick(auras),
    weapon: pick(weapons),
    role: pick(roles),
    rank: pick(ranks),
    corruption: pick(corruptions),
    lore: pick(loreLines),
    crest: crests[clans.indexOf(clan)] ?? "峰"
  };
}

export const statLabels: Array<[keyof AscensionIdentity, string]> = [
  ["clan", "Clan"],
  ["aura", "Aura"],
  ["weapon", "Weapon"],
  ["role", "Role"],
  ["rank", "Mountain Rank"],
  ["corruption", "Corruption"]
];
