import Discord from 'discord.js';
import { Player } from '../Player';
import { CreateQueueOptions, PlayerProgressBarOptions, PlayerTimestamp } from '../declarations/QueueDeclarations';
import { Track } from './Track';
import { StreamDispatcher } from '../utils/StreamDispatcher';
declare type If<T, A, B = undefined> = T extends true ? A : T extends false ? B : A | B;
export declare enum QueueRepeatMode {
    Off = 0,
    Track = 1,
    Queue = 2
}
export declare class Queue<State extends boolean = boolean> {
    #private;
    channel?: Discord.GuildTextBasedChannel;
    options: Omit<CreateQueueOptions, `channel` | `initialVolume`>;
    tracks: Track[];
    previousTracks: Track[];
    repeatMode: QueueRepeatMode;
    paused: boolean;
    volume: number;
    maxVolume: number;
    connection?: StreamDispatcher;
    readonly guild: Discord.Guild;
    readonly id: string;
    readonly player: Player;
    private state?;
    private _streamTime;
    private _queued;
    private _current?;
    constructor(guild: Discord.Guild, player: Player, options: CreateQueueOptions);
    addTracks(tracks: Track | Track[], emit?: boolean): If<State, Track[], undefined>;
    back(): Promise<void>;
    clear(): void;
    clearCurrent(): If<State, Track[], undefined>;
    clearPrevious(): If<State, Track[], undefined>;
    connect(channel: Discord.GuildChannelResolvable): Promise<StreamDispatcher>;
    createProgressBar(options?: PlayerProgressBarOptions): string | If<State, string, undefined>;
    destroy(leave?: boolean): this is Queue<false>;
    disconnect(): void;
    exists(): this is Queue<true>;
    getPlayerTimestamp(): If<State, PlayerTimestamp, undefined>;
    getTrackPosition(track: Track | number | string): If<State, number, undefined>;
    /**
     * Вставляє трек або треки посеред черги
     * @param tracks Трек або треки, які потрібно додати в чергу
     * @param index Найнижчий індекс - 0, який вставить треки в самий початок черги
     * @param emit Чи хочете ви викликати функцію, яка виконується при додаванні треку
     * @returns Змінений масив треків
     */
    insert(tracks: Track | Track[], index: number, emit?: boolean): If<State, Track[], undefined>;
    jump(track: Track | number | string): void;
    loop(mode: QueueRepeatMode): If<State, QueueRepeatMode, undefined>;
    remove(track: Track | number | string): If<State, Track, undefined>;
    seek(position: number): Promise<If<State, boolean, undefined>>;
    setBitrate(bitrate: number | `auto`): void;
    /**
     * ГЛОБАЛЬНО глушить бота
     * @param deafened Вимкнути звук - true, вимкнути - false
     */
    setDeaf(deafened: boolean): Promise<If<State, boolean, undefined>>;
    setPaused(paused: boolean): boolean | If<State, boolean, undefined>;
    setVolume(volume: number): If<State, boolean, undefined>;
    play(trackToPlay?: Track, options?: {
        force?: boolean;
        seek?: number;
    }): Promise<void>;
    shuffle(): If<State, Track[], undefined>;
    skip(): If<State, boolean, undefined>;
    stop(): void;
    /**
     * @example
     * [
     *     "Never Gonna Give You Up | Olebeh | 3:32",
     *     "Ever Gonna Take Him Down | Ybymy | 9:11",
     *     "Somewhen Gonna Throw Her Left | Coomyc | 2:28"
     * ]
     */
    toString(includeAuthor?: boolean): If<State, string[], undefined>;
    get current(): If<State, Track | undefined, undefined>;
    get destroyed(): boolean;
    get streamTime(): If<State, number, undefined>;
    get totalTime(): number | If<State, number, undefined>;
}
export {};
