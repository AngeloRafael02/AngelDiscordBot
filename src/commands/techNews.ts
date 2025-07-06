import { EmbedBuilder,SlashCommandBuilder, TextChannel, ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../interfaces';
import dotenv from 'dotenv';
dotenv.config();

interface Meta {
  found: number;
  returned: number;
  limit: number;
  page: number;
}

// Define the structure for a single 'data' item (e.g., an article or news item)
interface Article {
  uuid: string;
  title: string;
  description: string;
  keywords: string;
  snippet: string;
  url: string;
  image_url: string;
  language: string;
  published_at: string; // Consider using Date type if parsing is done after receiving
  source: string;
  categories: string[];
  relevance_score: number | null; // Can be null based on the example
  locale: string;
}

interface NewsApiResponse {
  meta: Meta;
  data: Article[];
}

const newsCommand:Command = {
    data:new SlashCommandBuilder()
        .setName('news')
        .setDescription('Fetches the latest top 10 technology news headlines.'),
    execute: async (interaction: ChatInputCommandInteraction) => {
        await interaction.deferReply(); // Acknowledge the command immediately

        const newsChannelName:string = process.env.NEWS_CHANNEL_NAME || 'news'; // Default news channel
        const apiKey:string | undefined = process.env.NEWS_API_KEY;

        if (!apiKey) {
            await interaction.editReply('The bot is not configured with a NewsAPI key. Please contact an administrator.');
            return;
        }

        // Check if the command is being used in the designated #news channel
        const targetChannel = interaction.channel as TextChannel;
        if (targetChannel && targetChannel.name !== newsChannelName.toLowerCase()) {
            await interaction.reply({
                content: `Please use the \`/news\` command in the <#${targetChannel.guild.channels.cache.find(c => c.name === newsChannelName)?.id || 'the designated news channel'}> channel.`,
                ephemeral: true // Only the user who ran the command sees this message
            });
            return;
        }

        const result = await fetchTechnologyNewsEmbeds(apiKey, 3);

        if (typeof result === 'string') {
            await interaction.editReply(result); // It's an error message
        } else {
            // Send each embed. If you want them all in one message, Discord allows up to 10 embeds per message.
            // Our fetchTechnologyNewsEmbeds returns an array of one embed with multiple fields.
            await interaction.editReply({ embeds: result });
        }
    }
}

/**
 * Fetches technology news from NewsAPI.org and returns an array of Discord Embeds.
 * @param apiKey Your NewsAPI.org API key.
 * @param count The number of articles to fetch (max 3 for a single embed).
 * @returns An array of EmbedBuilder objects or a string error message.
 */
async function fetchTechnologyNewsEmbeds(apiKey: string, count: number = 3): Promise<EmbedBuilder[] | string> {
    try {
        const newsUrl = `https://api.thenewsapi.com/v1/news/top?categories=tech&api_token=${apiKey}&locale=us&limit=${count}`;//`https://newsapi.org/v2/top-headlines?category=technology&language=en&pageSize=${count}&apiKey=${apiKey}`;
        const response:Response = await fetch(newsUrl);
        const res: NewsApiResponse = await response.json();

        if (res.meta.returned === 0) {
            return "No technology news found at the moment. Please try again later.";
        }

        const newsEmbeds: EmbedBuilder[] = [];

        // NewsAPI.org's free tier sometimes has rate limits, or might not return images/descriptions
        // We will create one embed, with multiple fields for each article.
        // Discord embeds have a limit of 25 fields. 10 articles means 10 fields.
        const mainEmbed = new EmbedBuilder()
            .setColor(0x0099ff) // Blue color
            .setTitle('📰 Top 3 Technology News Headlines 📰')
            .setTimestamp()
            .setFooter({ text: 'Powered by NewsAPI.org' });

        res.data.forEach((article, index) => {
            let description = article.description || 'No description available.';
            // Truncate description if too long for embed field value
            if (description.length > 1024) { // Discord embed field value limited
                description = description.substring(0, 1021) + '...';
            }

            mainEmbed.addFields({
                name: `${index + 1}. ${article.title}`,
                value: `[${description}](${article.url})\n**Source:** ${article.source}`,
                inline: false // Each news article should be on its own line
            });
        });

        newsEmbeds.push(mainEmbed);
        return newsEmbeds;

    } catch (error) {
        console.error('Error in fetchTechnologyNewsEmbeds:', error);
        return 'An error occurred while fetching the technology news. Please try again later.';
    }
}

export default newsCommand;