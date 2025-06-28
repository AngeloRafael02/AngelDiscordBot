import { Client, Collection } from "discord.js";

export interface ClientWithCommands extends Client {
  commands: Collection<string, any>
}

export interface Command {
    data: {
        name: string;
        description:string;
        // Add other properties of command.data here if they exist, e.g., description, options
    };
    execute: (...args: any[]) => Promise<void> | void; // Adjust based on your execute function's signature
}