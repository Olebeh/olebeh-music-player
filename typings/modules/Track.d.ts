import Discord from 'discord.js';
import { Player } from '../Player';
import { TrackOptions, PlaylistOptions } from '../declarations';
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
    live: boolean;
    /**
     * The Date when live started, if the track is live stream
     */
    liveAt?: Date;
    /**
     * If this track was requested from a playlist, it will appear here
     */
    playlist: PlaylistOptions | null;
    id: string;
    readonly player: Player;
    constructor(player: Player, options: TrackOptions);
    /**
     * Stringifies track, which can be used to display it for users in convenient format. An example is presented below
     * @returns Stringified track
     * @example
     * "Never Gonna Give You Up | Rick Astley | Olebeh | 3:32" // With author
     * "Ever Gonna Take Him Down | Ybymy | 9:11" // Without author
     */
    toString(includeAuthor?: boolean): string;
}
