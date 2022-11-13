import Discord from 'discord.js';
import { Player } from '../Player';
import { CreateQueueOptions, PlayerProgressBarOptions, PlayerTimestamp, QueueRepeatMode } from '../declarations';
import { Track } from './Track';
import { StreamDispatcher } from '../utils/StreamDispatcher';
declare type If<T, A, B = undefined> = T extends true ? A : T extends false ? B : A | B;
/**
 * Queue is an object that is used to manipulate with guild tracks and is unique for each guild
 */
export declare class Queue<State extends boolean = boolean> {
    #private;
    /**
     * Voice channel bot is currently in (if there's one)
     */
    channel?: Discord.GuildTextBasedChannel;
    /**
     * Queue options like leaveOnEmptyTimeout and leaveOnIdleTimeout
     */
    options: Required<Omit<CreateQueueOptions, `maxVolume` | `channel`>>;
    /**
     * An array of all tracks in the queue
     */
    tracks: Track[];
    /**
     * An array of all previous tracks in the queue
     */
    previousTracks: Track[];
    /**
     * Current queue repeat mode
     */
    repeatMode: QueueRepeatMode;
    /**
     * Current queue player state (paused or not)
     */
    paused: boolean;
    /**
     * Current queue volume
     */
    volume: number;
    /**
     * Max queue volume possible to set
     */
    maxVolume: number;
    /**
     * Queue connection
     */
    connection?: StreamDispatcher;
    /**
     * The guild queue was created in
     */
    readonly guild: Discord.Guild;
    /**
     * Queue id is basically queue's guild id
     */
    readonly id: string;
    /**
     * Main player
     */
    readonly player: Player;
    /**
     * Type of the state of the queue. Not used, but required
     */
    private state?;
    private _streamTime;
    /**
     * Tracks are being added here while processing to play
     */
    private _queued;
    private _current?;
    /**
     * @warning Don't use constructor to create new Queue instance, use Player#createQueue() instead which is much more saver and will prevent duplicated Queues
     */
    constructor(guild: Discord.Guild, player: Player, options: Required<Omit<CreateQueueOptions, 'channel'>> & {
        channel?: Discord.GuildTextBasedChannel;
    });
    /**
     * Adds specified track or tracks to the end of the queue
     * @param tracks Track or tracks that should be added
     * @param emit Either emit "addTrack(s)" event on insert or not
     * @returns Array of all tracks in the queue
     */
    addTracks(tracks: Track | Track[], emit?: boolean): If<State, Track[], undefined>;
    /**
     * Returns to the previous played track and, if found, plays it skipping the current one
     * @returns
     */
    back(): Promise<void>;
    /**
     * Clears both previous and next tracks in the queue
     * @returns
     */
    clear(): void;
    /**
     * Clears next tracks in the queue
     * @returns
     */
    clearCurrent(): If<State, Track[], undefined>;
    /**
     * Clears previous tracks in the queue
     * @returns
     */
    clearPrevious(): If<State, Track[], undefined>;
    /**
     * Connects to the specified channel
     * @param channel The channel that bot should connect to
     * @returns Bot's current connection
     */
    connect(channel: Discord.GuildChannelResolvable): Promise<StreamDispatcher>;
    /**
     * Creates the visual progress bar that can be used to display the progress of the current track
     * @param options Some options for creating progress bar to your taste
     * @returns If current track, something like this: 0:00 ┃ 🔘-------------- ┃ 03:32 (end time), otherwise undefined
     */
    createProgressBar(options?: PlayerProgressBarOptions): string | If<State, string, undefined>;
    /**
     * Destroyes this queue. That means that everything will be cleared, connection closed and you wouldn't be able to interact with queue anymore
     * @param leave Either leave the voice channel (if one) after destroying or not
     * @returns Representation of this queue as destroyed
     */
    destroy(leave?: boolean): this is Queue<false>;
    /**
     * Disconnects from the voice channel (if one)
     * @returns
     */
    disconnect(): void;
    /**
     * Checks if queue is destroyed
     * @returns Representation of current queue as definately existing
     */
    exists(): this is Queue<true>;
    /**
     * Gets current track's timestamp and returns in convenient format
     * @returns A timestamp from which you can extract current progress in ms, track's end timecode and current progress
     */
    getPlayerTimestamp(): If<State, PlayerTimestamp, undefined>;
    /**
     * Returns the index of the specified track in array. The lowest index is 0
     * @param track Can be either Track or string. If string specified, first finds track by it's id, and returns it's index
     * @returns Index of specified track
     */
    getTrackPosition(track: Track | string): If<State, number, undefined>;
    /**
     * Inserts a track in the middle of the queue
     * @param tracks Track or tracks that should be inserted
     * @param index Where should track or tracks be inserted. The lowest index is 0, specifying which will insert tracks at the very beginning of the queue
     * @param emit Either emit "addTrack(s)" event on insert or not
     * @returns Array of all tracks in the queue
     */
    insert(tracks: Track | Track[], index: number, emit?: boolean): If<State, Track[], undefined>;
    /**
     * Jumps to the specified track from the queue. That means that current track is skipped, and provided track starts playing
     * @param track Can be one of following: Track, number or string. If string specified, finds track by it's id. If number, finds track by it's index in the tracks array
     * @returns {void}
     */
    jump(track: Track | number | string): void;
    /**
     * Turns on or off the repeat mode.
     * @param mode Track mode (1) - repeats current track over again. Queue mode (2) - repeats current queue over again. Off (3) - turns repeat mode off
     * @returns
     */
    loop(mode: QueueRepeatMode): If<State, QueueRepeatMode, undefined>;
    /**
     * Removes specified track from the queue
     * @param track
     * @returns
     */
    remove(track: Track | number | string): If<State, Track, undefined>;
    /**
     * Seeks current track to specified time
     * @param position Position (in ms) that track should be seeked to
     * @returns True if seek was successful, otherwise false
     */
    seek(position: number): Promise<If<State, boolean, undefined>>;
    /**
     * Sets the quality of current track. Lower quality - faster loading and less lag, but bad audio
     * @param bitrate The targeted bitrate. Use "default" for default bitrate
     * @returns
     */
    setBitrate(bitrate: number | `default`): void;
    /**
     * Sets bot SERVER deafen
     * @param deafened Either deafen or undeafen
     */
    setDeaf(deafened: boolean): Promise<If<State, boolean, undefined>>;
    /**
     * Pauses or unpauses current track
     * @param paused Either pause or unpause
     * @returns True if action was successful, otherwise false
     */
    setPaused(paused: boolean): boolean | If<State, boolean, undefined>;
    /**
     * Sets the volume of queue
     * @param volume The targeted volume. Minimum is 1, and maximum is queue's max volume (200 by default)
     * @returns True if change of volume was successful, otherwise false
     */
    setVolume(volume: number): If<State, boolean, undefined>;
    /**
     * Starts the playback of the track
     * @param trackToPlay If specified, this track will start playing. Else the first track from the queue will start playing
     * @param options Force - if true, the playback of the track will forcefully start, even if there's a track currently playing. Else won't play; seek - seeks track to specified time (in ms)
     * @returns
     */
    play(trackToPlay?: Track, options?: {
        force?: boolean;
        seek?: number;
    }): Promise<void>;
    /**
     * Randomizes all tracks in the queue
     * @returns
     */
    shuffle(): If<State, Track[], undefined>;
    /**
     * Skips current track and, if there's at least one more track in the queue, starts playing it
     * @returns
     */
    skip(): If<State, boolean, undefined>;
    /**
     * Equals to queue.destroy(false)
     * @returns
     */
    stop(): void;
    /**
     * Creates an array of queue, which can be used to display it for users in convenient format. An example is presented below
     * @param includeAuthor If true, track author name will be displayed after track name
     * @returns An array of stringified tracks
     * @example
     * [
     *     "Never Gonna Give You Up | Rick Astley | Olebeh | 3:32", // With author
     *     "Ever Gonna Take Him Down | Ybymy | 9:11", // Without author
     *     "Somewhen Gonna Throw Her Left | Coomyc | 2:28"
     * ]
     */
    toString(includeAuthor?: boolean): If<State, string[], undefined>;
    /**
     * Gets current track
     * @returns If there's current track, return it. Otherwise undefined
     */
    get current(): If<State, Track | undefined, undefined>;
    /**
     * Checks if queue is destroyed
     * @returns True if queue is destroyed, otherwise false
     */
    get destroyed(): boolean;
    /**
     * Gets the progress of current track in ms
     * @returns Stream time of current track if there's one, otherwise 0
     */
    get streamTime(): If<State, number, undefined>;
    /**
     * Gets the total time off all tracks in the queue
     * @returns Total time (0 if no tracks)
     */
    get totalTime(): number | If<State, number, undefined>;
}
export {};
