import { EmbedBuilder, ColorResolvable, ChatInputCommandInteraction, TextChannel, SlashCommandBuilder } from 'discord.js'; // Import EmbedBuilder
import { Command } from '../interfaces';
import dotenv from 'dotenv';
dotenv.config();

interface WeatherData {
    location: {
        name: string;
        region: string;
        country: string;
    };
    current: {
        temp_c: number;
        temp_f: number;
        is_day: number;
        condition: {
            text: string;
            icon: string;
        };
        humidity: number;
        wind_kph: number;
        pressure_mb: number;
    };
}

// TO BE TESTED
const WeatherCommand:Command = {
    data:new SlashCommandBuilder()
        .setName('weather')
        .setDescription('Gets the current weather for a specified city or the default city.')
        .addStringOption(option =>
            option.setName('city')
                .setDescription('The city to get weather for (e.g., "Lipa", "Tokyo", "New York")')
                .setRequired(false)
        ),
    execute: async (interaction:ChatInputCommandInteraction) => {
        await interaction.deferReply(); // Acknowledge the command immediately as API calls can take time

        const cityOption:string | null = interaction.options.getString('city');
        const defaultCity:string = 'Lipa';

        const city:string = cityOption || defaultCity;
        const apiKey: string | undefined = process.env.WEATHER_API_KEY;
        const weatherChannelName:string  = process.env.WEATHER_CHANNEL_NAME || 'weather';

        if (!apiKey) {
            await interaction.editReply('The bot is not configured with a WeatherAPI key. Please contact an administrator.');
            return;
        }

         // Check if the command is being used in the designated #Weather channel
        const targetChannel = interaction.channel as TextChannel;
        if (targetChannel && targetChannel.name !== weatherChannelName.toLowerCase()) {
            await interaction.reply({
                content: `Please use the \`/weather\` command in the <#${targetChannel.guild.channels.cache.find(c => c.name === weatherChannelName)?.id || 'the designated weather channel'}> channel.`,
                ephemeral: true
            });
            return;
        }

        const result = await fetchWeatherEmbed(city, apiKey);

        if (typeof result === 'string') {
            await interaction.editReply(result); // It's an error message
        } else {
            await interaction.editReply({ embeds: [result] }); // It's the Embed
        }
    }
};


/**
 * Fetches weather data from WeatherAPI.com and returns a Discord Embed.
 * @param city The city to get weather for.
 * @param apiKey Your WeatherAPI.com API key.
 * @returns A Discord EmbedBuilder or null if an error occurs.
 */
async function fetchWeatherEmbed(city: string, apiKey: string): Promise<EmbedBuilder | string> {
    try {
        const weatherUrl = `http://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${encodeURIComponent(city)}&aqi=no`;
        const response = await fetch(weatherUrl);
        const weatherData: WeatherData = await response.json();

        if (response.status !== 200) {
            // Handle API errors from WeatherAPI.com
            const errorMessage = weatherData.current ? weatherData.current.condition.text : `Error: ${response.status} - 'Unknown error`;
            return `Failed to get weather data for "${city}": ${errorMessage}`;
        }

        const location = weatherData.location.name;
        const tempC = weatherData.current.temp_c;
        const condition = weatherData.current.condition.text;
        const icon = weatherData.current.condition.icon;
        const humidity = weatherData.current.humidity;
        const windKPH = weatherData.current.wind_kph;
        const isDay = weatherData.current.is_day;

        const embedColor: ColorResolvable = isDay ? '#FFD700' : '#4682B4'; // Gold for day, SteelBlue for night

        const weatherEmbed = new EmbedBuilder()
            .setColor(embedColor)
            .setTitle(`Current Weather in ${location}`)
            .setDescription(`**${condition}**`)
            .setThumbnail(`https:${icon}`) // WeatherAPI often gives relative URLs for icons
            .addFields(
                { name: 'Temperature', value: `${tempC}°C`, inline: true },
                { name: 'Humidity', value: `${humidity}%`, inline: true },
                { name: 'Wind', value: `${windKPH} kph`, inline: true }
            )
            .setTimestamp()
            .setFooter({ text: 'Powered by WeatherAPI.com' });

        return weatherEmbed;

    } catch (error) {
        console.error('Error in fetchWeatherEmbed:', error);
        return 'An error occurred while fetching the weather data. Please try again later.';
    }
}

export default WeatherCommand;
