import { PlaylistOptions } from '../declarations'
import { Player } from '../Player'
import { Track } from './Track'

export class Playlist {
    title: string
    thumbnail: string
    source: `youtube` | `spotify` | `soundcloud`
    length: number
    tracks: Track[]
    url: string

    constructor(player: Player, options: PlaylistOptions) {
        this.title = options.title
        this.thumbnail = options.thumbnail
        this.source = options.source
        this.length = options.length
        this.tracks = options.tracks
        this.url = options.url
    }
}