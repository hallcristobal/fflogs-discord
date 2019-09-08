import * as request from 'request-promise';

interface XIVApiResponse {
    Pagination: {
        Page: number;
        PageNext: null | string;
        PagePrev: null | string;
        PageTotal: number;
        Results: number;
        ResultsPerPage: number;
        ResultsTotal: number;
    },
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
    ]
}

const characterCache: { [name_server: string]: { uri: string, invalidAt: number } } = {};

export async function getThumbnailUrl(server: string, name: string) {
    if (characterCache[name + server] != null && characterCache[name + server].invalidAt > new Date().getTime()) {
        return characterCache[name + server].uri;
    }

    const requestUri = `https://xivapi.com/character/search?name=${encodeURIComponent(name)}&server=${encodeURIComponent(server)}`;
    console.log(`Fetching thumbnail from ${requestUri}`);

    const response = <XIVApiResponse>await request.get(requestUri, { json: true });
    if (response.Pagination.ResultsTotal !== 1) {
        throw `Indeterminite Character: ${response.Pagination.ResultsTotal}`;
    }

    // I want to cache the thumbnail uri for 5 minutes
    characterCache[name + server] = { uri: response.Results[0].Avatar, invalidAt: new Date().getTime() + (5 * 60 * 1000) };
    return response.Results[0].Avatar;
}
