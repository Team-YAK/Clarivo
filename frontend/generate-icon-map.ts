import { icons } from "@phosphor-icons/core";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

type IconEntry = {
  name: string;
  tags: string[];
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUTPUT_PATH = path.resolve(__dirname, "../shared/icon-dictionary.json");

const STOP_TAGS = new Set([
  "new",
  "*new*",
  "icon",
  "icons",
  "symbol",
  "ui",
  "app",
]);

const normalize = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[*]/g, "")
    .replace(/[_-]/g, " ")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const clipTag = (tag: string): string => {
  const trimmed = normalize(tag);
  if (!trimmed) return "";
  const words = trimmed.split(" ").filter(Boolean);
  return words.slice(0, 2).join(" ");
};

const tokenize = (value: string): string[] => normalize(value).split(" ").filter(Boolean);

const isRedundant = (tag: string, nameTokens: Set<string>): boolean => {
  const tagTokens = tokenize(tag);
  if (tagTokens.length === 0) return true;
  if (tagTokens.every((token) => nameTokens.has(token))) return true;
  const compact = tagTokens.join("");
  const nameCompact = Array.from(nameTokens).join("");
  return compact.length > 0 && (nameCompact.includes(compact) || compact.includes(nameCompact));
};

const pickDescription = (icon: IconEntry): string => {
  const nameTokens = new Set(tokenize(icon.name));
  const candidates: string[] = [];

  for (const rawTag of icon.tags) {
    const tag = clipTag(rawTag);
    if (!tag || STOP_TAGS.has(tag)) continue;
    if (isRedundant(tag, nameTokens)) continue;
    if (!candidates.includes(tag)) candidates.push(tag);
    if (candidates.length >= 2) break;
  }

  if (candidates.length === 0) {
    const fallback = tokenize(icon.name).slice(0, 2).join(" ");
    return fallback || "icon";
  }

  return candidates.slice(0, 2).join(", ");
};

const dictionary = Object.fromEntries(
  (icons as IconEntry[]).map((icon) => [icon.name, pickDescription(icon)])
);

fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
fs.writeFileSync(OUTPUT_PATH, JSON.stringify(dictionary, null, 2) + "\n", "utf-8");

console.log(`Generated ${Object.keys(dictionary).length} icon descriptions at ${OUTPUT_PATH}`);
