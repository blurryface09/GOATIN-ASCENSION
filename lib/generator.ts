export type NftTrait = {
  trait_type: string;
  value: string | number;
};

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

export type OrderStatKey = Exclude<keyof AscensionIdentity, "lore" | "crest">;

const clans = ["Crimson Peak", "Ash Horn Clan", "Hollow Monks", "Black Summit", "Sun Eaters"];
const weapons = ["Katana of Echoes", "Bloodfang Blade", "Silent Tanto", "Mountain Spear", "Relic Bow", "Ash Cleaver"];
const auras = ["Crimson Flame", "Shadow Purple", "Frost Smoke", "Golden Spirit", "Void Ash", "Blood Mist"];
const roles = ["Ronin", "Beast Hunter", "Relic Keeper", "Mountain Guardian", "Corrupted Climber", "Order Disciple"];
const ranks = ["First Climber", "Mountain Survivor", "Peak Seeker", "Order Disciple", "Ascended One"];
const corruptions = ["Stable", "Touched", "Corrupted", "Hollowed", "Ascended"];
const crests = ["山", "炎", "月", "牙", "灰"];

const loreOpeners = [
  "Walked into the mountain alone",
  "Chosen beneath the red gate",
  "Vanished beyond the lantern ridge",
  "Kept watch where the old snow burns",
  "Returned from the silent side of the summit",
  "Carved an oath into the frozen shrine",
  "Heard the Order whisper through ash",
  "Crossed the First Climb without a shadow",
  "Found a relic where the wind turns black",
  "Stood before the peak and did not kneel",
  "Woke beneath a sky without stars",
  "Guarded the last fire above the pass"
];

const loreTurns = [
  "returned with red eyes",
  "was marked by a blade no monk will name",
  "now carries a curse from {clan}",
  "answers only to the smoke around {weapon}",
  "was crowned in {aura}",
  "left a broken mask at {clan}",
  "became the {role} the lower path still fears",
  "bound the mountain oath to {weapon}",
  "survived the climb that hollowed the others",
  "wears silence like a second hide",
  "keeps a relic warm beneath the snow",
  "learned why the summit never sleeps"
];

const loreClosers = [
  "The Order remembers.",
  "No bell was rung.",
  "The peak accepted the name.",
  "Only ash followed.",
  "The old monks looked away.",
  "The climb is not finished.",
  "No witness spoke twice.",
  "The crest still burns.",
  "The mountain marked the debt.",
  "A red lantern remains."
];

const keywordMap = {
  crimson: ["red", "crimson", "blood", "scarlet", "ruby", "fire", "flame", "demon"],
  black: ["black", "dark", "shadow", "void", "night", "obsidian", "onyx"],
  gold: ["gold", "golden", "legendary", "rare", "crown", "halo", "sun", "spirit"],
  ash: ["ash", "smoke", "horn", "bone", "gray", "grey"],
  frost: ["snow", "ice", "frost", "white", "silver"],
  weapon: ["katana", "sword", "blade", "tanto", "spear", "bow", "cleaver", "axe"],
  horn: ["horn", "hat", "crown", "helmet", "head"],
  monk: ["robe", "monk", "scroll", "mask", "relic"]
};

export const statLabels: Array<[OrderStatKey, string]> = [
  ["clan", "Faction"],
  ["aura", "Aura"],
  ["weapon", "Weapon"],
  ["role", "Role"],
  ["rank", "Mountain Rank"],
  ["corruption", "Corruption"]
];

export function generateIdentity(tokenId = "0", traits: NftTrait[] = []): AscensionIdentity {
  const traitText = normalizeTraits(traits);
  const seed = hashString(`${tokenId}|${traitText}`);

  const clan = weightedPick(
    [
      ["Crimson Peak", 10 + scoreKeywords(traitText, keywordMap.crimson) * 8],
      ["Ash Horn Clan", 10 + scoreKeywords(traitText, keywordMap.ash) * 6 + scoreKeywords(traitText, keywordMap.horn) * 4],
      ["Hollow Monks", 10 + scoreKeywords(traitText, keywordMap.monk) * 7],
      ["Black Summit", 10 + scoreKeywords(traitText, keywordMap.black) * 8],
      ["Sun Eaters", 10 + scoreKeywords(traitText, keywordMap.gold) * 5]
    ],
    seed
  );

  const aura = weightedPick(
    [
      ["Crimson Flame", 10 + scoreKeywords(traitText, keywordMap.crimson) * 7],
      ["Shadow Purple", 10 + scoreKeywords(traitText, keywordMap.black) * 4],
      ["Frost Smoke", 10 + scoreKeywords(traitText, keywordMap.frost) * 7 + scoreKeywords(traitText, keywordMap.ash) * 2],
      ["Golden Spirit", 10 + scoreKeywords(traitText, keywordMap.gold) * 9],
      ["Void Ash", 10 + scoreKeywords(traitText, keywordMap.black) * 6 + scoreKeywords(traitText, keywordMap.ash) * 3],
      ["Blood Mist", 10 + scoreKeywords(traitText, keywordMap.crimson) * 5 + scoreKeywords(traitText, keywordMap.ash) * 2]
    ],
    seed >>> 3
  );

  const weapon = pickWeapon(traitText, seed >>> 6);
  const role = weightedPick(
    [
      ["Ronin", 10 + hasAny(traitText, ["samurai", "ronin", "blade"]) * 8],
      ["Beast Hunter", 10 + hasAny(traitText, ["beast", "horn", "fang", "animal"]) * 8],
      ["Relic Keeper", 10 + scoreKeywords(traitText, keywordMap.monk) * 6],
      ["Mountain Guardian", 10 + scoreKeywords(traitText, keywordMap.horn) * 5],
      ["Corrupted Climber", 10 + scoreKeywords(traitText, keywordMap.black) * 5 + scoreKeywords(traitText, keywordMap.crimson) * 2],
      ["Order Disciple", 10 + scoreKeywords(traitText, keywordMap.gold) * 4]
    ],
    seed >>> 9
  );

  const rank = weightedPick(
    [
      ["First Climber", 12],
      ["Mountain Survivor", 12 + scoreKeywords(traitText, keywordMap.frost) * 3],
      ["Peak Seeker", 12 + scoreKeywords(traitText, keywordMap.weapon) * 2],
      ["Order Disciple", 12 + scoreKeywords(traitText, keywordMap.horn) * 3],
      ["Ascended One", 8 + scoreKeywords(traitText, keywordMap.gold) * 7 + scoreKeywords(traitText, keywordMap.black) * 2]
    ],
    seed >>> 12
  );

  const corruption = weightedPick(
    [
      ["Stable", 12 + scoreKeywords(traitText, keywordMap.gold) * 3],
      ["Touched", 14],
      ["Corrupted", 10 + scoreKeywords(traitText, keywordMap.crimson) * 4],
      ["Hollowed", 8 + scoreKeywords(traitText, keywordMap.black) * 6],
      ["Ascended", 7 + scoreKeywords(traitText, keywordMap.gold) * 5]
    ],
    seed >>> 15
  );

  return {
    clan,
    aura,
    weapon,
    role,
    rank,
    corruption,
    lore: buildLore(seed, { clan, aura, weapon, role }),
    crest: crests[clans.indexOf(clan)] ?? "峰"
  };
}

function pickWeapon(traitText: string, seed: number) {
  const explicit = [
    ["Katana of Echoes", ["katana", "sword", "samurai"]],
    ["Bloodfang Blade", ["fang", "blood", "blade"]],
    ["Silent Tanto", ["tanto", "dagger", "stealth", "mask"]],
    ["Mountain Spear", ["spear", "staff", "pole"]],
    ["Relic Bow", ["bow", "arrow", "archer"]],
    ["Ash Cleaver", ["cleaver", "axe", "ash"]]
  ] as const;

  const weighted = weapons.map((weapon) => {
    const match = explicit.find(([name]) => name === weapon);
    return [weapon, 10 + (match ? hasAny(traitText, match[1]) * 10 : 0)] as [string, number];
  });

  return weightedPick(weighted, seed);
}

function buildLore(seed: number, identity: Pick<AscensionIdentity, "clan" | "aura" | "weapon" | "role">) {
  const opener = loreOpeners[seed % loreOpeners.length];
  const turn = fillLore(loreTurns[(seed >>> 5) % loreTurns.length], identity);
  const closer = loreClosers[(seed >>> 11) % loreClosers.length];

  return `${opener}. ${capitalize(turn)}. ${closer}`;
}

function fillLore(template: string, identity: Pick<AscensionIdentity, "clan" | "aura" | "weapon" | "role">) {
  return template
    .replace("{clan}", identity.clan)
    .replace("{aura}", identity.aura)
    .replace("{weapon}", identity.weapon)
    .replace("{role}", identity.role);
}

function weightedPick<T extends string>(items: Array<[T, number]>, seed: number): T {
  const total = items.reduce((sum, [, weight]) => sum + weight, 0);
  let cursor = seed % total;

  for (const [item, weight] of items) {
    if (cursor < weight) return item;
    cursor -= weight;
  }

  return items[0][0];
}

function normalizeTraits(traits: NftTrait[]) {
  return traits.map((trait) => `${trait.trait_type}:${trait.value}`.toLowerCase()).join("|");
}

function scoreKeywords(text: string, keywords: readonly string[]) {
  return keywords.reduce((score, keyword) => score + (text.includes(keyword) ? 1 : 0), 0);
}

function hasAny(text: string, keywords: readonly string[]) {
  return scoreKeywords(text, keywords) > 0 ? 1 : 0;
}

function hashString(input: string) {
  let hash = 2166136261;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function capitalize(value: string) {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}
