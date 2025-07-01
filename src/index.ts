import { readdirSync } from 'fs';
import { pathToFileURL } from 'url';
import { join } from 'path';
import dotenv from 'dotenv';
import { REST, Routes, Client, GatewayIntentBits,Partials, Collection, PresenceUpdateStatus, Events, Interaction, CacheType, ActivityType } from 'discord.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { ClientWithCommands, Command } from './interfaces'

const __filename:string = fileURLToPath(import.meta.url);
const __dirname:string = dirname(__filename);
dotenv.config();

const deployCommands = async ():Promise<void> => {
    try {
        const commands:Object[]=[]
        const commandsPath:string = join(__dirname, 'commands');
        const commandFiles:string[] = (readdirSync(commandsPath)).filter((file: string) =>{
            return file.endsWith('.js') || file.endsWith('.ts') // Consider .ts if you're compiling directly from TS
        });

        for (const file of commandFiles){
            const filePath = join(commandsPath, file);
            try {
                //console.log(filePath)
                const module =  await import(pathToFileURL(filePath).toString());
                const command = module.default;
                if ('data' in command && 'execute' in command) {
                    commands.push(command.data.toJSON());
                    //console.log(command.data);
                } else {
                    console.error(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
                }
            } catch (importError) {
                console.error(`[ERROR] Could not load command file ${filePath}:`, importError);
            }
        }
        //console.log('Commands: '+JSON.stringify(commands))
        const rest = new REST().setToken(process.env.DISCORD_BOT_TOKEN!);
        console.log(`Started refreshing application slash commands globally.`);
        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID!, process.env.GUILD_ID ?? ''),
            { body: commands },             
        );

        console.log('Successfully reloaded all commands!');
    } catch (error) {
        console.error('Error deploying commands:', error)
    }
}


const client =  new Client({
    intents:[
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ],
    partials:[
        Partials.Channel,
        Partials.Message,
        Partials.User,
        Partials.GuildMember
    ]
}) as ClientWithCommands ;

client.commands = new Collection<string, Command>();

const commandsPath = join(__dirname, 'commands');
const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = join(commandsPath, file);
    const module =  await import(pathToFileURL(filePath).toString());
    const command = module.default;
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
    } else {
        console.log(`The Command ${filePath} is missing a required "data" or "execute" property.`)
    }
}

client.once(Events.ClientReady, async ()=>{
    console.log(`Ready, Logged in as ${client.user?.tag}`);
    await deployCommands();
    console.log(`Commands Deployed Globally`);
    const statusType = process.env.BOT_STATUS || 'online';
    const activityType = process.env.ACTIVITY_TYPE || 'PLAYING';
    const activityName = process.env.ACTIVITY_NAME || 'discord';

    client.user?.setPresence({
        status:PresenceUpdateStatus.Online, //Make it more dynamic in the future via StatusMap
        activities:[{
            name:'discord',
            type:ActivityType.Playing
        }]
    });
    console.log(`Bot Status Set To ${statusType}`);
    console.log(`Activity Set To ${activityType} ${activityName}`);
});

client.on(Events.InteractionCreate, async (interaction:Interaction<CacheType>)=>{
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command){ 
        console.error(`No Command matching '${interaction.commandName}' was found.`);
        return;
    }
    
    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        if(interaction.replied || interaction.deferred){
            await interaction.followUp({
                content:`There was an Error while executing this command`,
                ephemeral:true
            });
        } else {
            await interaction.reply({
                content:`There was an Error while executing this command`,
                ephemeral:true
            });
        }
    }
});

client.login(process.env.DISCORD_BOT_TOKEN);
