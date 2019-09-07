import * as Discord from 'discord.js';

interface IConfig {
  TOKEN: string
};

const config: IConfig = require("./../config.js");
const client = new Discord.Client();

const EMOTE_MAP = {
  Astrologian: "<:Astrologian:619932348816949269>",
  DarkKnight: "<:DarkKnight:619932348741582869>",
  Ninja: "<:Ninja:619932348758228993>",
  Scholar: "<:Scholar:619932349005561893>",
  Bard: "<:Bard:619932348968075264>",
  Dragoon: "<:Dragoon:619932349102030858>",
  Paladin: "<:Paladin:619932349022470164>",
  Summoner: "<:Summoner:619932349005561857>",
  BlackMage: "<:BlackMage:619932349009887232>",
  Machinist: "<:Machinist:619932348821143554>",
  RedMage: "<:RedMage:619932348993110018>",
  Warrior: "<:Warrior:619932349081190411>",
  Dancer: "<:Dancer:619932348833595410>",
  Monk: "<:Monk:619932349081059378>",
  Samurai: "<:Samurai:619932348980396044>",
  WhiteMage: "<:WhiteMage:619932349064282112>",
};

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', async msg => {
  if (msg.content.toLowerCase().startsWith("?tierlogs")) {
    msg.channel.send(await sendLogs(msg.content.split(" ").slice(1)));
  }
});

async function sendLogs(args: string[]): Promise<Discord.RichEmbed> {
  let logLink = "https://www.fflogs.com/reports/4zyaXJZWNQfTdFDP#fight=13&type=damage-done";
  const embed = new Discord.RichEmbed()
    .setColor('#0099ff')
    .setTitle("SomeTitle")
    .setDescription('Some description here')
    .setAuthor("Lvion Mercury of Diabolos", "https://dmszsuqyoe6y6.cloudfront.net/img/ff/favicon.png", "https://www.fflogs.com/character/na/diabolos/lvion%20mercury")
    .addField("Eden's Gate (Savage)", `${EMOTE_MAP.Bard} Eden Prime [${(5222).toLocaleString()} DPS](${logLink}) 97% • 8:04 • 8 kills
    ${EMOTE_MAP.Dancer} Eden Prime [5222 DPS](${logLink}) 97% • 8:04 • 8 kills
    ${EMOTE_MAP.Paladin} Eden Prime [5222 DPS](${logLink}) 97% • 8:04 • 8 kills`)
    .setThumbnail("https:\/\/img2.finalfantasyxiv.com\/f\/f38fc10ba6527828d354d73e51d19a63_7b33d33ae3ecb996f778a5f67a6a0af6fc0_96x96.jpg?1567869408")
  return embed;
}

client.login(config.TOKEN);