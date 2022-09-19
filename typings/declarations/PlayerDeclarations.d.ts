import Discord from 'discord.js';
import { VoiceConnection } from '@discordjs/voice';
import { Queue } from '../modules/Queue';
import { Track } from '../modules/Track';
import { PlayerError } from '../utils/PlayerError';
import { PlaylistOptions } from './QueueDeclarations';
export interface PlayerEvents {
    trackStart: (queue: Queue, track: Track) => any;
    trackAdd: (queue: Queue, track: Track) => any;
    tracksAdd: (queue: Queue, track: Track[]) => any;
    trackEnd: (queue: Queue, track: Track) => any;
    botDisconnect: (queue: Queue) => any;
    queueEnd: (queue: Queue) => any;
    channelEmpty: (queue: Queue) => any;
    error: (error: PlayerError) => any;
    connectionError: (error: Error, connection?: VoiceConnection) => any;
}
export interface PlayerOptions {
    geniusAPIToken?: string;
}
export interface SearchOptions {
    limit?: number;
    requestedBy?: Discord.GuildMember;
}
export interface SearchResult {
    playlist: PlaylistOptions | null;
    tracks: Track[];
}
