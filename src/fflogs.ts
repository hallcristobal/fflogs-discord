import { getLogger } from "log4js";
import * as request from "request-promise";
import { SERVER_MAP } from "./servers";
const logger = getLogger("fflogs");

interface IFFLogsIdName {
  id: number;
  name: string;
}

interface IFFLogsClass {
  id: number;
  name: string;
  specs: [IFFLogsIdName];
}

interface IFFLogsEncounterRankings {
  total: number;
  rankings: [IFFLogsEncounterRanking];
}

interface IFFLogsEncounterRanking {
  name: string;
  total: number;
  class: number;
  spec: number;
  guild: string;
  server: string;
  region: string;
  duration: number;
  startTime: number;
  damageTaken: number;
  deaths: number;
  itemLevel: number;
  patch: number;
  reportID: string;
  fightID: number;
  team: [{
    name: string;
    class: number;
    spec: number
  }];
  size: number;
}

interface IFFLogsCharacterRanking {
  encounterID: number;
  encounterName: string;
  class: string;
  spec: string;
  rank: number;
  outOf: number;
  duration: number;
  startTime: number;
  reportID: string;
  fightID: number;
  difficulty: number;
  characterID: number;
  characterName: string;
  server: string;
  percentile: number;
  ilvlKeyOrPatch: number;
  total: number;
  estimated: boolean;
}

interface IFFLogsParse {
  rank: number;
  outOf: number;
  total: number;
  class: number;
  spec: number;
  guild: string;
  duration: number;
  startTime: number;
  itemLevel: number;
  patch: number;
  reportID: string;
  fightID: number;
  difficulty: number;
  size: number;
  estimated: boolean;
}

interface IFFLogsReportFight {
  id: number;
  start_time: number;
  end_time: number;
  boss: number;
  name: string;
  zoneID: number;
  zoneName: string;
  size: number;
  difficulty: number;
  kill: boolean;
  partial: number;
  standardComposition: boolean;
  bossPercentage: number;
  fightPercentage: number;
  lastPhaseForPercentageDisplay: number;
}

interface IFFLogsReport {
  fights: IFFLogsReportFight[];
}

interface ICondensedZone {
  id: number;
  name: string;
}

interface IFFLogsZone {
  id: number;
  name: string;
  frozen: boolean;
  encounters: IEncounter[];
  brackets: IBrackets;
  partitions?: IPartition[];
}

interface IBrackets {
  min: number;
  max: number;
  bucket: number;
  type: Type;
}

enum Type {
  Patch = "Patch",
}

interface IEncounter {
  id: number;
  name: string;
}

interface IPartition {
  name: Name;
  compact: Compact;
  area?: number;
  default?: boolean;
}

enum Compact {
  Default = "default",
  NStd = "NStd",
  NStd355B = "NStd (3.55b+)",
  NStdEcho = "NStd (Echo)",
  Std = "Std",
  Std355B = "Std (3.55b+)",
  StdEcho = "Std (Echo)",
}

enum Name {
  Default = "default",
  NonStandardComps = "Non-Standard Comps",
  NonStandardComps355B = "Non-Standard Comps (3.55b+)",
  NonStandardCompsEcho = "Non-Standard Comps (Echo)",
  NonStandardCompsPreSavage = "Non-Standard Comps (Pre-Savage)",
  StandardComps = "Standard Comps",
  StandardComps355B = "Standard Comps (3.55b+)",
  StandardCompsEcho = "Standard Comps (Echo)",
  StandardCompsPreSavage = "Standard Comps (Pre-Savage)",
}

export enum FightCategory {
  Savage,
  Normal,
  Extreme,
  Trial,
  Ultimate,
}

export enum Expansion {
  HW,
  SB,
  ShB,
}

export function parseCategory(category: string) {
  if (category === null || typeof category === "undefined") {
    return null;
  }
  switch (category.toLowerCase()) {
    case "savage": return FightCategory.Savage;
    case "normal": return FightCategory.Normal;
    case "extreme": return FightCategory.Extreme;
    case "trial": return FightCategory.Trial;
    case "ultimate": return FightCategory.Ultimate;
    default: return null;
  }
}

export function parseExpansion(expansion: string) {
  if (expansion === null || typeof expansion === "undefined") {
    return null;
  }
  switch (expansion.toLowerCase()) {
    case "hw": return Expansion.HW;
    case "sb": return Expansion.SB;
    case "shb": return Expansion.ShB;
    default: return null;
  }
}

export default class FFLogs {
  private readonly BASE_URI = "https://www.fflogs.com:443/v1";
  private key: string;
  private zones: IFFLogsZone[];
  constructor(key: string) {
    this.key = key;
  }

  public async updateZones() {
    const builtUri = `${this.BASE_URI}/zones?api_key=${this.key}`;
    logger.info("Updating fflogs Zones");
    this.zones = (await request.get(builtUri, { json: true })) as IFFLogsZone[];
    logger.trace(this.zones);
  }

  public async getParses(server: string, name: string) {
    const builtUri = `${this.BASE_URI}/parses/character/${encodeURIComponent(name.trim())}/${encodeURIComponent(server.trim())}/${SERVER_MAP[server.toLowerCase()]}?api_key=${this.key}`;
    logger.trace(`Fetching information from: ${builtUri}`);
    const response = (await request.get(builtUri)) as IFFLogsParse[];
    logger.trace(response);
  }

  public async getRankings(server: string, name: string, category?: FightCategory, expansion?: Expansion) {
    const zones = this.getCategoryZoneId(category, expansion);
    let rankings: IFFLogsCharacterRanking[] = [];
    if (Array.isArray(zones)) {
      for (const zone of zones) {
        const response = await this.fetchRankings(server, name, expansion === Expansion.ShB, zone) as any;
        logger.debug(JSON.stringify(response));
        if (typeof response.hidden === "boolean") {
          return [];
        } else {
          rankings = rankings.concat(response as IFFLogsCharacterRanking[]);
        }
      }
    } else {
      const response = await this.fetchRankings(server, name, expansion === Expansion.ShB,
        (typeof zones === "number") ? zones as number : null) as any;
      if (typeof response.hidden === "boolean") {
        return [];
      } else {
        rankings = rankings.concat(response as IFFLogsCharacterRanking[]);
      }
    }
    logger.debug(rankings.length);
    if (expansion === Expansion.ShB && category === FightCategory.Savage) {
      rankings = rankings.filter((r) => r.difficulty === 101);
    }
    const res: { [code: number]: IFFLogsCharacterRanking; } = {};
    for (const ranking of rankings) {
      if (res[ranking.encounterID] != null) {
        const existing = res[ranking.encounterID];
        if (existing.total > ranking.total) {
          continue;
        }
      }
      res[ranking.encounterID] = ranking;
    }

    return Object.values(res).sort((a, b) => a.encounterID - b.encounterID);
  }

  public getZoneForEncounter(id: number, category: FightCategory): ICondensedZone {
    for (const zone of this.zones) {
      if (zone.encounters.find((v) => v.id === id)) {
        const isShb = zone.brackets.min <= 5.0 && 5.0 <= zone.brackets.max;
        const name = isShb && category === FightCategory.Savage ? zone.name += " (Savage)" : zone.name;
        return { id: zone.id, name };
      }
    }
    return {
      id: -1,
      name: "Unknown Zone",
    };
  }

  private async fetchRankings(server: string, name: string, rdps: boolean, zone?: number): Promise<IFFLogsCharacterRanking[]> {
    let builtUri = `${this.BASE_URI}/rankings/character/${encodeURIComponent(name.trim())}/${encodeURIComponent(server.trim())}/${SERVER_MAP[server.toLowerCase()]}`;
    builtUri += `?api_key=${this.key}`;
    if (rdps) {
      builtUri += "&metric=rdps";
    }
    if (zone !== null) {
      builtUri += `&zone=${zone}`;
    }
    logger.trace(`Fetching Rankings with parameters: ${JSON.stringify({ server, name, zone })}`);
    logger.debug(`Built Uri: ${builtUri}`);
    return (await request.get(builtUri, { json: true }));
  }

  private getCategoryZoneId(category: FightCategory, expansion: Expansion): number[] | number | null {
    if (category === null && expansion !== null) {
      return [7, 10, 13];
    } else if (expansion === Expansion.HW) {
      if (category === FightCategory.Savage) {
        return [7, 10, 13];
      } else if (category === FightCategory.Normal) {
        return [6, 9, 12];
      } else if (category === FightCategory.Extreme) {
        return 4;
      }
    } else if (expansion === Expansion.SB) {
      if (category === FightCategory.Savage) {
        return [17, 21, 25];
      } else if (category === FightCategory.Normal) {
        return [16, 20, 24];
      } else if (category === FightCategory.Extreme) {
        return 15;
      } else if (category === FightCategory.Ultimate) {
        return [19, 23];
      }
    } else if (expansion === Expansion.ShB) {
      if (category === FightCategory.Savage || category === FightCategory.Normal) {
        return 29;
      } else if (category === FightCategory.Extreme) {
        return 28;
      }
    }
    return null;
  }
}
