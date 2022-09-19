import Discord from 'discord.js';
import { Player } from '../Player';
import { TrackOptions, PlaylistOptions } from '../declarations/QueueDeclarations';
export declare class Track {
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
    id: string;
    readonly player: Player;
    constructor(player: Player, options: TrackOptions);
    /**
     * @example
     * "Never Gonna Give You Up | Olebeh | 3:32"
     */
    toString(includeAuthor?: boolean): string;
}
