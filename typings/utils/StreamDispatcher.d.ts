/// <reference types="node" />
import { AudioPlayer, AudioPlayerError, AudioPlayerStatus, AudioResource, StreamType, VoiceConnection } from '@discordjs/voice';
import { StageChannel, VoiceBasedChannel, VoiceChannel } from 'discord.js';
import { Duplex, Readable } from 'stream';
import { TypedEmitter as EventEmitter } from 'tiny-typed-emitter';
import { Track } from '../modules/Track';
export interface VoiceEvents {
    error: (error: AudioPlayerError) => any;
    debug: (message: string) => any;
    start: (resource: AudioResource<Track>) => any;
    finish: (resource: AudioResource<Track>) => any;
}
export declare class StreamDispatcher extends EventEmitter<VoiceEvents> {
    readonly connectionTimeout: number;
    readonly voiceConnection: VoiceConnection;
    readonly audioPlayer: AudioPlayer;
    channel: VoiceBasedChannel;
    audioResource?: AudioResource<Track>;
    paused: boolean;
    private readyLock;
    /**
     * Creates new connection object
     * @param {VoiceConnection} connection The connection
     * @param {VoiceChannel|StageChannel} channel The connected channel
     * @private
     */
    constructor(connection: VoiceConnection, channel: VoiceChannel | StageChannel, connectionTimeout?: number);
    /**
     * Creates stream
     * @param {Readable|Duplex|string} src The stream source
     * @param {object} [ops] Options
     * @returns {AudioResource}
     */
    createStream(src: Readable | Duplex | string, ops?: {
        type?: StreamType;
        data?: any;
        disableVolume?: boolean;
    }): AudioResource;
    /**
     * The player status
     * @type {AudioPlayerStatus}
     */
    get status(): AudioPlayerStatus;
    /**
     * Disconnects from voice
     * @returns {void}
     */
    disconnect(): void;
    /**
     * Stops the player
     * @returns {void}
     */
    end(): void;
    /**
     * Pauses the stream playback
     * @param {boolean} [interpolateSilence=false] If true, the player will play 5 packets of silence after pausing to prevent audio glitches.
     * @returns {boolean}
     */
    pause(interpolateSilence?: boolean): boolean;
    /**
     * Resumes the stream playback
     * @returns {boolean}
     */
    resume(): boolean;
    /**
     * Play stream
     * @param {AudioResource<Track>} [resource=this.audioResource] The audio resource to play
     * @returns {Promise<StreamDispatcher>}
     */
    playStream(resource?: AudioResource<Track>, volume?: number): Promise<StreamDispatcher | undefined>;
    /**
     * Sets playback volume
     * @param {number} value The volume amount
     * @returns {boolean}
     */
    setVolume(value: number): boolean;
    /**
     * The current volume
     * @type {number}
     */
    get volume(): number;
    /**
     * The playback time
     * @type {number}
     */
    get streamTime(): number;
}
