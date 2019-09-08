import * as request from "request-promise";
import { SERVER_MAP } from "./servers";

interface IFFLogsZone {
  id: number;
  name: string;
  frozen: boolean;
  encounters: [IFFLogsIdName];
  brackets: {
    min: number;
    max: number;
    bucket: number;
    type: string
  };
}

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

export default class FFLogs {
  private readonly BASE_URI = "https://www.fflogs.com:443/v1";
  private key: string;
  constructor(key: string) {
    this.key = key;
  }

  public async getParses(server: string, name: string) {
    const builtUri = `${this.BASE_URI}/parses/character/${encodeURIComponent(name.trim())}/${encodeURIComponent(server.trim())}/${SERVER_MAP[server.toLowerCase()]}?api_key=${this.key}`;
    console.debug(`Fetching information from: ${builtUri}`);
    const response = (await request.get(builtUri)) as IFFLogsParse[];
    console.log(response);
  }

  public async getRankings(server: string, name: string) {
    const builtUri = `${this.BASE_URI}/rankings/character/${encodeURIComponent(name.trim())}/${encodeURIComponent(server.trim())}/${SERVER_MAP[server.toLowerCase()]}?metric=rdps&api_key=${this.key}`;
    console.debug(`Fetching information from: ${builtUri}`);
    let response = (await request.get(builtUri, { json: true }));
    if (typeof response.hidden === "boolean") {
      return [];
    }
    response = (response as IFFLogsCharacterRanking[]);
    console.log(response.length);
    response = response.filter((r) => r.difficulty === 101);
    const res: { [code: number]: IFFLogsCharacterRanking; } = {};
    for (const ranking of response) {
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
}
