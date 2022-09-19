import Discord from 'discord.js'
import { Player } from '../Player'
import { TrackOptions, PlaylistOptions } from '../declarations'

export class Track {
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
    playlist: PlaylistOptions | null
    id: string
    readonly player: Player

    constructor(player: Player, options: TrackOptions) {
        this.title = options.title
        this.description = options.description
        this.requestedBy = options.requestedBy
        this.source = options.source
        this.duration = options.duration
        this.durationMs = options.durationMs
        this.thumbnail = options.thumbnail
        this.url = options.url
        this.likes = options.likes
        this.playlist = options.playlist
        this.id = options.id ?? new Date().getTime().toString()
        this.author = options.author
        this.player = player
    }

    /**
     * Stringifies track, which can be used to display it for users in convenient format. An example is presented below
     * @returns Stringified track
     * @example
     * "Never Gonna Give You Up | Rick Astley | Olebeh | 3:32" // With author
     * "Ever Gonna Take Him Down | Ybymy | 9:11" // Without author
     */
    toString(includeAuthor?: boolean) {
        const { title, url, author, requestedBy, duration } = this

        return `[${title}](${url}) ${includeAuthor ? `| ${author} ` : ``}| ${requestedBy ?? this.player.client.user} | \`${duration}\``
    }
}