import * as request from "request-promise";

interface IXIVApiResponse {
  Pagination: {
    Page: number;
    PageNext: null | string;
    PagePrev: null | string;
    PageTotal: number;
    Results: number;
    ResultsPerPage: number;
    ResultsTotal: number;
  };
  Results: [
    {
      Avatar: string;
      FeastMatches: number;
      ID: number;
      Name: string;
      Rank: number;
      RankIcon: string;
      Server: string;
    }
  ];
}

const characterCache: { [key: string]: { uri: string, invalidAt: number } } = {};

export async function getThumbnailUrl(server: string, name: string) {
  if (characterCache[name + server] != null && characterCache[name + server].invalidAt > new Date().getTime()) {
    return characterCache[name + server].uri;
  }

  const requestUri = `https://xivapi.com/character/search?name=${encodeURIComponent(name)}&server=${encodeURIComponent(server)}`;
  console.debug(`Fetching thumbnail from ${requestUri}`);

  const response = await request.get(requestUri, { json: true }) as IXIVApiResponse;
  if (response.Pagination.ResultsTotal !== 1) {
    throw new Error(`Indeterminite Character: ${response.Pagination.ResultsTotal}`);
  }

  // I want to cache the thumbnail uri for 5 minutes
  characterCache[name + server] = {
    invalidAt: new Date().getTime() + (5 * 60 * 1000),
    uri: response.Results[0].Avatar,
  };
  return response.Results[0].Avatar;
}
