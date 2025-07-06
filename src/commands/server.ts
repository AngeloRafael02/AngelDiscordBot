import { ChatInputCommandInteraction, Guild, SlashCommandBuilder } from "discord.js";

const ServerCommand = {
	data: new SlashCommandBuilder()
		.setName('server')
		.setDescription('Provides Basic information about the server.'),
	execute: async (interaction:ChatInputCommandInteraction)=> {
        let guild:Guild = interaction.guild!;
		// interaction.guild is the object representing the Guild in which the command was run
		await interaction.reply(`This server is ${guild.name ?? 'Nothing'} and has ${guild.memberCount} members.`);
	},
};

export default ServerCommand;