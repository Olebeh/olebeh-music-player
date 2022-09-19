import Discord from 'discord.js';
import { Track } from '../modules/Track';
export interface PlayerTimestamp {
    current: string;
    end: string;
    progress: number;
}
export interface PlayerProgressBarOptions {
    timecodes?: boolean;
    length?: number;
    line?: string;
    indicator?: string;
    queue?: boolean;
}
export interface TimeData {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
}
export interface CreateQueueOptions {
    channel?: Discord.GuildTextBasedChannel;
    leaveOnEmptyTimeout?: number;
    leaveOnIdleTimeout?: number;
    maxVolume?: number;
}
export interface PlaylistOptions {
    title: string;
    thumbnail: string;
    source: `youtube` | `spotify` | `soundcloud`;
    length: number;
    tracks: Track[];
    url: string;
}
export interface TrackOptions {
    title: string;
    description: string;
    requestedBy?: Discord.GuildMember;
    source: `youtube` | `spotify` | `soundcloud` | `arbitrary`;
    duration: string;
    durationMs: number;
    thumbnail: string;
    url: string;
    likes: number;
    author: string;
    playlist: PlaylistOptions | null;
}
