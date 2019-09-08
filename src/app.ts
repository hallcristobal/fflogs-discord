import * as Discord from "discord.js";
import { configure, getLogger } from "log4js";
import Config = require("./../config.js");
import FFLogs, { Expansion as FFExpansion, FightCategory, parseCategory, parseExpansion } from "./fflogs";
import { SERVER_MAP } from "./servers";
import { getThumbnailUrl } from "./xivapi";

interface IConfig {
  TOKEN: string;
  FFLOGS_KEY: string;
  LOG_LEVEL: string | null;
}
const config = Config as IConfig;
configure({
  appenders: {
    out: { type: "stdout" },
  },
  categories: {
    default: { appenders: ["out"], level: "all" },
  },
});
const client = new Discord.Client();
const fflogs = new FFLogs(config.FFLOGS_KEY);
const logger = getLogger("app");

fflogs.updateZones();

const EMOTE_MAP = {
  "Astrologian": "<:Astrologian:619932348816949269>",
  "Bard": "<:Bard:619932348968075264>",
  "Black Mage": "<:BlackMage:619932349009887232>",
  "Dancer": "<:Dancer:619932348833595410>",
  "Dark Knight": "<:DarkKnight:619932348741582869>",
  "Dragoon": "<:Dragoon:619932349102030858>",
  "Machinist": "<:Machinist:619932348821143554>",
  "Monk": "<:Monk:619932349081059378>",
  "Ninja": "<:Ninja:619932348758228993>",
  "Paladin": "<:Paladin:619932349022470164>",
  "Red Mage": "<:RedMage:619932348993110018>",
  "Samurai": "<:Samurai:619932348980396044>",
  "Scholar": "<:Scholar:619932349005561893>",
  "Summoner": "<:Summoner:619932349005561857>",
  "Warrior": "<:Warrior:619932349081190411>",
  "White Mage": "<:WhiteMage:619932349064282112>",
};

client.on("ready", () => {
  logger.info(`Logged in as ${client.user.tag}!`);
});

client.on("message", async (msg) => {
  if (msg.content.toLowerCase().startsWith("?tierlogs")) {
    msg.channel.send(await sendLogs(msg.content.split(" ").slice(1)));
  } else if (msg.content.toLowerCase() === "test") {
    // hold
  }
});

async function sendLogs(args: string[]): Promise<Discord.RichEmbed | string> {
  logger.trace(args);
  if (args.length < 3) {
    return "Character must be specified using the format: ?tierlogs World Forename Surname <Expansion> <Category>";
  }

  const { Name, Server, Expansion, Category } = { Name: args[1] + " " + args[2], Server: args[0], Expansion: parseExpansion(args[3]), Category: parseCategory(args[4]) };

  let thumbnailUrl = "";
  try {
    thumbnailUrl = await getThumbnailUrl(Server, Name);
  } catch (e) {
    logger.debug(e);
    return "Could not find Character";
  }
  const rankings = await fflogs.getRankings(Server, Name, Category, Expansion);
  if (rankings.length === 0) {
    return `No logs found for ${Name} of ${Server}`;
  }
  const embed = new Discord.RichEmbed();
  embed
    .setColor("#0099ff")
    .setAuthor(`${Name} of ${Server}`, "https://dmszsuqyoe6y6.cloudfront.net/img/ff/favicon.png",
      `https://www.fflogs.com/character/${SERVER_MAP[Server.toLowerCase()]}/${Server}/${encodeURIComponent(Name)}`)
    .setThumbnail(thumbnailUrl);

  let parsesText = "";
  let currentZone = null;
  for (const parse of rankings) {
    const zone = fflogs.getZoneForEncounter(parse.encounterID, parse.difficulty === 101 ? FightCategory.Savage : null);
    if (currentZone === null) {
      currentZone = zone;
    }
    const logLink = `https://www.fflogs.com/reports/${parse.reportID}#fight=${parse.fightID}&type=damage-done`;
    const text = `${EMOTE_MAP[parse.spec]} ${parse.encounterName} [${(roundedLocalized(parse.total))} DPS](${logLink}) ${parse.percentile}% • ${millisToMinutesAndSeconds(parse.duration)}\n`;
    if (zone.id !== currentZone.id || parsesText.length + text.length > 1024) {
      embed.addField(zone.name, parsesText);
      parsesText = "";
      if (currentZone.id !== zone.id) {
        currentZone = zone;
      }
    }
    parsesText += text;
  }
  embed.addField(currentZone.name, parsesText);
  return embed;
}

function millisToMinutesAndSeconds(millis: number) {
  const minutes = Math.floor(millis / 60000);
  const seconds = ((millis % 60000) / 1000);
  return minutes + ":" + (seconds < 10 ? "0" : "") + seconds.toFixed(0);
}

function roundedLocalized(total: number) {
  return Math.round(total).toLocaleString();
}

client.login(config.TOKEN);
