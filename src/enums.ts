import { PresenceUpdateStatus,ActivityType } from "discord.js"

export const statusMap = Object.freeze({
    'online':PresenceUpdateStatus.Online,
    'offline':PresenceUpdateStatus.Offline,
    'invisible':PresenceUpdateStatus.Invisible,
    'idle':PresenceUpdateStatus.Idle,
    'doNotDisturb':PresenceUpdateStatus.DoNotDisturb
});

export const ActivityTypeMap=Object.freeze({
    'PLAYING':ActivityType.Playing,
    'WATCHING':ActivityType.Watching,
    'LISTENING':ActivityType.Listening,
    'STREAMING':ActivityType.Streaming,
    'COMPETING':ActivityType.Competing
});