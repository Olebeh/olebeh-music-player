import Discord from 'discord.js';
import { Lyrics } from './modules/Lyrics';
import { TypedEmitter } from 'tiny-typed-emitter';
import { CreateQueueOptions } from './declarations';
import { PlayerEvents, SearchOptions, SearchResult, PlayerOptions } from './declarations';
import { Queue } from './modules/Queue';
import { VoiceUtils } from './utils/VoiceUtils';
export declare class Player extends TypedEmitter<PlayerEvents> {
    queues: Queue[];
    geniusAPIToken?: string;
    readonly voiceUtils: VoiceUtils;
    readonly client: Discord.Client<true>;
    private _spotifyToken;
    private _idleCooldowns;
    private _emptyCooldowns;
    constructor(client: Discord.Client<true>, options?: PlayerOptions);
    _playerHandler(): void;
    /**
     * Creates a new queue in the specified guild or, if it already exists, gets existed one
     * @param guild Guild or some information about it that could be use for resolvation
     * @param options Some options for creating a queue
     * @returns Created or found queue
     */
    createQueue(guild: Discord.GuildResolvable, options?: CreateQueueOptions): Queue<true>;
    /**
     * Tries to find an existing queue
     * @param guild Guild or some information about it that could be use for resolvation
     * @returns Specified guild's queue or undefined if not found
     */
    getQueue(guild: Discord.GuildResolvable): Queue<boolean> | undefined;
    /**
     * Deletes and destroyes specified queue
     * @param guild Guild or some information about it that could be use for resolvation
     * @returns Deleted queue or undefined if queue didn't exist
     */
    deleteQueue(guild: Discord.GuildResolvable): Queue<boolean> | undefined;
    /**
     * Finds lyrics for specified track
     * @param trackName The name of the track lyrics should be found for
     * @returns Class that contains lyrics and some other info about it, or undefined if no lyrics found
     */
    lyrics(trackName: string): Promise<Lyrics | undefined>;
    /**
     * Begins the search of the tracks by the query. For more convenient use, you can use this method with file links or direct links to file, like cdn.discordapp.com, so you don't have to implement for each search methods separately. Searching by text cannot find playlists
     * @param query A link or search query. If search query provided, will try to find it on YouTube. Else if link, if the link is supported, will get a track or tracks directly from the link
     * @param options Some options for search. It's recommneded to set requestedBy for more detailed information about track
     * @returns An object that contains info about playlist (if present) and tracks (also, if any)
     */
    search(query: string, options?: SearchOptions): Promise<SearchResult>;
}
