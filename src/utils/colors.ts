type InkColor =
  | "black"
  | "red"
  | "green"
  | "yellow"
  | "blue"
  | "magenta"
  | "cyan"
  | "white"
  | "gray"
  | "grey"
  | "blackBright"
  | "redBright"
  | "greenBright"
  | "yellowBright"
  | "blueBright"
  | "magentaBright"
  | "cyanBright"
  | "whiteBright";

const IRR_COLORS: Readonly<Record<string, InkColor>> = {
  RIPE: "blue",
  RADB: "green",
  ARIN: "magenta",
  LACNIC: "yellow",
  APNIC: "cyan",
  AFRINIC: "red",
  RPKI: "white",
  ALTDB: "gray",
  BELL: "blueBright",
  LEVEL3: "greenBright",
  NTTCOM: "magentaBright",
  TC: "yellowBright",
} as const;

const DYNAMIC_COLORS: readonly InkColor[] = [
  "redBright",
  "cyanBright",
  "whiteBright",
  "blackBright",
] as const;

const dynamicColorCache = new Map<string, InkColor>();
let dynamicColorIndex = 0;

export function getIRRColor(irrDatabase: string): InkColor {
  const majorColor = IRR_COLORS[irrDatabase];
  if (majorColor) {
    return majorColor;
  }

  const cachedColor = dynamicColorCache.get(irrDatabase);
  if (cachedColor) {
    return cachedColor;
  }

  const color = DYNAMIC_COLORS[dynamicColorIndex % DYNAMIC_COLORS.length]!;
  dynamicColorCache.set(irrDatabase, color);
  dynamicColorIndex++;

  return color;
}

export function getRPKIStatusColor(status: string): InkColor {
  switch (status.toUpperCase()) {
    case "VALID":
      return "green";
    case "INVALID":
      return "red";
    case "NOT_FOUND":
    default:
      return "yellow";
  }
}

export function getIRRColorWithRPKI(
  irrDatabase: string,
  rpkiStatus: string,
): InkColor {
  if (rpkiStatus.toUpperCase() === "INVALID") {
    return "red";
  }

  return getIRRColor(irrDatabase);
}
