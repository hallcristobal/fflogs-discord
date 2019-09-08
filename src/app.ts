import * as Discord from 'discord.js';
import FFLogs from './fflogs';
import { SERVER_MAP } from './servers';
import { getThumbnailUrl } from "./xivapi";

interface IConfig {
  TOKEN: string;
  FFLOGS_KEY: string;
};

const config: IConfig = require("./../config.js");
const client = new Discord.Client();

const EMOTE_MAP = {
  "Astrologian": "<:Astrologian:619932348816949269>",
  "Dark Knight": "<:DarkKnight:619932348741582869>",
  "Ninja": "<:Ninja:619932348758228993>",
  "Scholar": "<:Scholar:619932349005561893>",
  "Bard": "<:Bard:619932348968075264>",
  "Dragoon": "<:Dragoon:619932349102030858>",
  "Paladin": "<:Paladin:619932349022470164>",
  "Summoner": "<:Summoner:619932349005561857>",
  "Black Mage": "<:BlackMage:619932349009887232>",
  "Machinist": "<:Machinist:619932348821143554>",
  "Red Mage": "<:RedMage:619932348993110018>",
  "Warrior": "<:Warrior:619932349081190411>",
  "Dancer": "<:Dancer:619932348833595410>",
  "Monk": "<:Monk:619932349081059378>",
  "Samurai": "<:Samurai:619932348980396044>",
  "White Mage": "<:WhiteMage:619932349064282112>",
};

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', async msg => {
  if (msg.content.toLowerCase().startsWith("?tierlogs")) {
    msg.channel.send(await sendLogs(msg.content.split(" ").slice(1)));
  } else if (msg.content.toLowerCase() === "test") {
    msg.channel.send(await sendLogs(["Diabolos", "Rova", "Asundera"]));
  }
});

async function sendLogs(args: string[]): Promise<Discord.RichEmbed | string> {
  console.log(args);
  if (args.length !== 3) {
    return "Character must be specified using the format: ?tierlogs <World> <Forename> <Surname>";
  }

  const { Name, Server } = { Name: args[1] + " " + args[2], Server: args[0] };

  let thumbnailUrl = "";
  try {
    thumbnailUrl = await getThumbnailUrl(Server, Name);
  } catch (e) {
    console.debug(e);
    return "Could not find Character";
  }
  const rankings = await new FFLogs(config.FFLOGS_KEY).getRankings(Server, Name);
  if (rankings.length === 0) {
    return `No logs found for ${Name} of ${Server}`;
  }

  const embed = new Discord.RichEmbed();
  embed
    .setColor('#0099ff')
    .setAuthor(`${Name} of ${Server}`, "https://dmszsuqyoe6y6.cloudfront.net/img/ff/favicon.png", `https://www.fflogs.com/character/${SERVER_MAP[Server.toLowerCase()]}/${Server}/${encodeURIComponent(Name)}`)
    .setThumbnail(thumbnailUrl);

  let parsesText = "";
  for (const parse of rankings) {
    const logLink = `https://www.fflogs.com/reports/${parse.reportID}#fight=${parse.fightID}&type=damage-done`;
    parsesText += `${EMOTE_MAP[parse.spec]} ${parse.encounterName} [${(parse.total).toLocaleString()} DPS](${logLink}) ${parse.percentile}% • ${millisToMinutesAndSeconds(parse.duration)}\n`;
  }
  embed.addField("Eden's Gate (Savage)", parsesText);
  return embed;
}

function millisToMinutesAndSeconds(millis: number) {
  var minutes = Math.floor(millis / 60000);
  var seconds = ((millis % 60000) / 1000);
  return minutes + ":" + (seconds < 10 ? '0' : '') + seconds.toFixed(0);
}

client.login(config.TOKEN);
