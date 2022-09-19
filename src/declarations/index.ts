import Discord from 'discord.js'
import { VoiceConnection } from '@discordjs/voice'
import { Queue } from '../modules/Queue'
import { Track } from '../modules/Track'
import { PlayerError } from '../utils/PlayerError'
import { Playlist } from '../modules/Playlist'

export interface PlayerTimestamp {
    current: string
    end: string
    progress: number
}

export interface PlayerProgressBarOptions {
    timecodes?: boolean,
    length?: number,
    line?: string,
    indicator?: string
    queue?: boolean
}

export interface TimeData {
    days: number
    hours: number
    minutes: number
    seconds: number
}

export interface CreateQueueOptions {
    channel?: Discord.GuildTextBasedChannel
    leaveOnEmptyTimeout?: number,
    leaveOnIdleTimeout?: number,
    maxVolume?: number,
}

export interface PlaylistOptions {
    title: string
    thumbnail: string
    source: `youtube` | `spotify` | `soundcloud`
    length: number
    tracks: Track[]
    url: string
}

export interface TrackOptions {
    title: string
    description: string
    requestedBy?: Discord.GuildMember
    source: `youtube` | `spotify` | `soundcloud` | `arbitrary`
    duration: string
    durationMs: number
    thumbnail: string
    url: string
    likes: number
    author: string
    id?: string
    playlist: Playlist | null
}

export interface PlayerEvents {
    trackStart: (queue: Queue, track: Track) => any
    trackAdd: (queue: Queue, track: Track) => any
    tracksAdd: (queue: Queue, track: Track[]) => any
    trackEnd: (queue: Queue, track: Track) => any
    botDisconnect: (queue: Queue) => any
    queueEnd: (queue: Queue) => any
    channelEmpty: (queue: Queue) => any
    error: (error: PlayerError) => any
    connectionError: (error: Error, connection?: VoiceConnection) => any
}

export interface PlayerOptions {
    authorization: {
        spotify?: {
            client_id: string
            client_secret: string
            refresh_token: string
            market: string
        },
        youtube?: {
            cookie: string
        }
    }
    geniusAPIToken?: string
}

export interface SearchOptions {
    limit?: number
    requestedBy?: Discord.GuildMember
}

export interface SearchResult {
    playlist: Playlist | null
    tracks: Track[]
}

/**
 * Every possible queue repeat mode
 */
export enum QueueRepeatMode {
    Off = 0,
    Track = 1,
    Queue = 2
}