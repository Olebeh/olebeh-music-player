import Discord from 'discord.js';
import { Lyrics } from './modules/Lyrics';
import { TypedEmitter } from 'tiny-typed-emitter';
import { CreateQueueOptions } from './declarations/QueueDeclarations';
import { PlayerEvents, SearchOptions, SearchResult, PlayerOptions } from './declarations/PlayerDeclarations';
import { Queue } from './modules/Queue';
import { VoiceUtils } from './utils/VoiceUtils';
export declare class Player extends TypedEmitter<PlayerEvents> {
    queues: Queue[];
    geniusAPIToken?: string;
    readonly voiceUtils: VoiceUtils;
    readonly client: Discord.Client<true>;
    private _idleCooldowns;
    private _emptyCooldowns;
    constructor(client: Discord.Client<true>, options?: PlayerOptions);
    _playerHandler(): void;
    createQueue(guild: Discord.GuildResolvable, options: CreateQueueOptions): Queue<boolean>;
    getQueue(guildId: string): Queue<boolean> | undefined;
    deleteQueue(guildId: string): Queue<boolean> | undefined;
    lyrics(trackName: string): Promise<Lyrics | undefined>;
    search(query: string, options?: SearchOptions): Promise<SearchResult>;
}
