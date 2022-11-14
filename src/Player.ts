import playdl from 'play-dl'
import Discord from 'discord.js'
import getAudioDuration from 'get-audio-duration'
import { Lyrics } from './modules/Lyrics'
import { Client } from 'genius-lyrics'
import { fetch } from 'undici'
import { TypedEmitter } from 'tiny-typed-emitter'
import { CreateQueueOptions, PlaylistOptions } from './declarations'
import { PlayerEvents, SearchOptions, SearchResult, PlayerOptions } from './declarations'
import { YouTubeVideo, YouTubePlayList, SpotifyTrack, SpotifyPlaylist, SpotifyAlbum } from 'play-dl'
import { Queue } from './modules/Queue'
import { Track } from './modules/Track'
import { VoiceUtils } from './utils/VoiceUtils'
import { ErrorStatusCode, PlayerError } from './utils/PlayerError'
import { Util } from './utils/Utils'
import { Playlist } from './modules/Playlist'

export class Player extends TypedEmitter<PlayerEvents> {
    queues: Queue[] = []
    geniusAPIToken?: string
    readonly voiceUtils = new VoiceUtils()
    readonly client: Discord.Client<true>
    private _spotifyToken = false
    private _idleCooldowns: { [guildId: string]: NodeJS.Timer } = {}
    private _emptyCooldowns: { [guildId: string]: NodeJS.Timer } = {}

    constructor(client: Discord.Client<true>, options?: PlayerOptions) {
        super()

        this.geniusAPIToken = options?.geniusAPIToken
        this.client = client

        if (options?.authorization) playdl.setToken(options?.authorization)
        if (options?.authorization?.spotify) this._spotifyToken = true
        this._playerHandler()
    }

    _playerHandler() {
        const tracks: { [guildId: string]: Track[] } = {}

        this.on(`trackAdd`, async (queue, track) => {
            if (!tracks[queue.id]) tracks[queue.id] = []

            tracks[queue.id].push(track)
        })

        this.on(`tracksAdd`, async (queue, _tracks) => {
            if (!tracks[queue.id]) tracks[queue.id] = []

            _tracks.forEach(track => tracks[queue.id].push(track))
        })

        this.on(`trackEnd`, async (queue, track) => {
            if (!tracks[queue.id]) tracks[queue.id] = []

            tracks[queue.id].pop()
        })

        this.on(`queueEnd`, async queue => {
            if (queue.options.alwaysOn) return

            const max = queue.options.leaveOnIdleTimeout
            let cooldown = this._idleCooldowns[queue.id]
            let time = 0

            if (!cooldown) cooldown = setInterval(() => {
                if (tracks[queue.id].length) {
                    time = 0
                    return clearInterval(cooldown)
                }
                if (time > (max ?? 30000)) {
                    clearInterval(cooldown)
                    time = 0
                    if (!queue.destroyed) return queue.destroy(true)
                    return
                }
                time += 1000
            }, 1000)
        })

        this.client.on(`voiceStateUpdate`, async (oldState, newState) => {
            if (oldState.channel?.id && !newState.channel?.id && oldState.member?.id === this.client.user.id) {
                const queue = this.getQueue(newState.guild.id)

                if (!queue) return

                if (!queue.destroyed) queue.destroy(true)

                this.emit(`botDisconnect`, queue)
            }
            
            if (newState.channelId) {
                const queue = this.getQueue(newState.guild.id)

                if (!queue || !queue.connection) return
                if (!queue.connection.channel) return
                if (newState.channelId !== queue.connection.channel.id) return

                const cooldown = this._emptyCooldowns[newState.guild.id]

                if (cooldown) {
                    clearInterval(cooldown)
                }
            }

            const emptyCheck = () => {
                if (!oldState.guild.members.me?.voice.channelId) return

                let members = oldState.channel?.members.filter(m => !m.user.bot).size

                if (members) return

                const queue = this.getQueue(oldState.guild.id)

                if (!queue || queue.options.alwaysOn) return

                const max = queue.options.leaveOnEmptyTimeout
                let cooldown = this._emptyCooldowns[oldState.guild.id]
                let time = 0

                time = 0

                cooldown = setInterval(() => {
                    members = oldState.channel?.members.filter(m => !m.user.bot).size
                    if (members) {
                        clearInterval(cooldown)
                        time = 0
                        return
                    }

                    if (time >= (max ?? 30000)) {
                        clearInterval(cooldown)
                        time = 0
                        this.emit(`channelEmpty`, queue)
                        if (!queue.destroyed) return queue.destroy(true)
                        return
                    }
                    time += 1000
                }, 1000)
            }

            if (!newState.channelId) {
                emptyCheck()
            }

            else if (newState.channel && oldState.channel && newState.channel.id !== oldState.channel.id) {
                emptyCheck()
            }
        })
    }

    /**
     * Creates a new queue in the specified guild or, if it already exists, gets existed one
     * @param guild Guild or it's id
     * @param options Some options for creating a queue
     * @returns Created or found queue
     */
    createQueue(guild: Discord.GuildResolvable, options?: CreateQueueOptions) {
        const _guild = this.client.guilds.resolve(guild)
        if (!_guild) throw new PlayerError(`Unknown guild`, ErrorStatusCode.UnknownGuild)

        const existingQueue = this.queues.find(queue => queue.id === _guild.id)
        if (existingQueue && existingQueue.exists()) return existingQueue
        else if (existingQueue && !existingQueue.exists()) this.deleteQueue(_guild)

        const queue = new Queue<true>(_guild, this, options = {
            leaveOnEmptyTimeout: 30000,
            leaveOnIdleTimeout: 30000,
            alwaysOn: false,
            maxVolume: 200,
            ...options
        })
        this.queues.push(queue)
        return queue
    }

    /**
     * Tries to find an existing queue
     * @param guild Guild or some information about it that could be use for resolvation 
     * @returns Specified guild's queue or undefined if not found
     */
    getQueue(guild: Discord.GuildResolvable) {
        const _guild = this.client.guilds.resolve(guild)
        if (!_guild) return

        return this.queues.find(queue => queue.id === _guild.id)
    }

    /**
     * Deletes and destroyes specified queue
     * @param guild Guild or some information about it that could be use for resolvation
     * @returns Deleted queue or undefined if queue didn't exist
     */
    deleteQueue(guild: Discord.GuildResolvable) {
        const _guild = this.client.guilds.resolve(guild)
        if (!_guild) return

        const queue = this.queues.find(queue => queue.id === _guild.id)
        if (!queue) return

        queue.destroy()
        this.queues.splice(this.queues.indexOf(queue), 1)
        return queue
    }

    /**
     * Finds lyrics for specified track
     * @param trackName The name of the track lyrics should be found for
     * @returns Class that contains lyrics and some other info about it, or undefined if no lyrics found
     */
    async lyrics(trackName: string) {
        if (!this.geniusAPIToken) throw new PlayerError(`Genius API Token is not provided`, ErrorStatusCode.InvalidArgType)

        const genius = new Client()
        const songs = await genius.songs.search(trackName)
        const song = songs[0]
        const lyrics = await song.lyrics().catch(() => {})

        if (!lyrics) return

        return new Lyrics(lyrics, song.artist.name, song.title)
    }

    /**
     * Begins the search of the tracks by the query. For more convenient use, you can use this method with file links or direct links to file, like cdn.discordapp.com, so you don't have to implement for each search methods separately. Searching by text cannot find playlists
     * @param query A link or search query. If search query provided, will try to find it on YouTube. Else if link, if the link is supported, will get a track or tracks directly from the link
     * @param options Some options for search. It's recommneded to set requestedBy for more detailed information about track
     * @returns An object that contains info about playlist (if present) and tracks (also, if any)
     */
    async search(query: string, options?: SearchOptions) {
        let limit = options?.limit, requestedBy = options?.requestedBy

        if (!limit) {
            limit = 10
        } else {
            if (limit < 1) limit = 1
            else if (limit > 50) limit = 50
        }

        let validation = await playdl.validate(query)

        let source = validation ? validation.split('_')[0] : undefined
        let type = validation ? validation.split('_')[1] : undefined

        const YouTubeSearchResult = async (videos?: YouTubeVideo[], playList?: YouTubePlayList) => {
            const ytToTrack = (video: YouTubeVideo) => {
                video.liveAt
                return new Track(this, {
                    title: video.title ?? `Unnamed track`,
                    description: video.description ?? `No description provided`,
                    requestedBy,
                    source: `youtube`,
                    duration: video.live ? '∞' : video.durationRaw,
                    durationMs: (video.live ? Infinity : video.durationInSec) * 1000,
                    thumbnail: video.thumbnails[0].url,
                    url: video.url,
                    likes: video.likes,
                    live: video.live,
                    liveAt: video.liveAt ? new Date(video.liveAt) : undefined,
                    author: video.channel?.name ?? requestedBy?.guild.name ?? `Unknown author`,
                    playlist
                })
            }

            let playlist: Playlist | null = null
            let tracks: Track[] = []

            if (playList) {
                playlist = new Playlist(this, {
                    title: playList.title ?? `Unnamed playlist`,
                    thumbnail: playList.thumbnail?.url ?? ``,
                    source: `youtube`,
                    tracks,
                    url: playList.url ?? `https://www.youtube.com/watch?v=dQw4w9WgXcQ`,
                    length: playList.total_videos
                })

                const videos = await playList.all_videos()

                videos.forEach(video => {
                    const track = ytToTrack(video)

                    tracks.push(track)
                })

                playlist.tracks = tracks
            } else if (videos) {
                videos.slice(0, limit).forEach(video => {
                    tracks.push(ytToTrack(video))
                })
            }

            return {
                playlist,
                tracks
            } as SearchResult
        }

        const SpotifySearchResult = async (track?: SpotifyTrack, playList?: SpotifyPlaylist | SpotifyAlbum) => {
            const spToTrack = (track: SpotifyTrack) => {
                return new Track(this, {
                    title: track.name,
                    description: `No description provided`,
                    requestedBy,
                    source: `spotify`,
                    duration: Util.buildTimeCode(Util.parseMS(track.durationInMs)),
                    durationMs: track.durationInMs,
                    thumbnail: track.thumbnail?.url ?? ``,
                    url: track.url,
                    likes: 0,
                    live: false,
                    author: track.artists[0].name,
                    playlist
                })
            }  

            let playlist: PlaylistOptions | null = null
            let tracks: Track[] = []

            if (playList) {
                if (playList.total_tracks > 100) playList = await playList.fetch()

                playlist = new Playlist(this, {
                    title: playList.name,
                    thumbnail: playList.thumbnail.url,
                    source: `spotify`,
                    tracks: [],
                    url: playList.url,
                    length: playList.total_tracks
                })

                const spTracks = await playList.all_tracks()

                spTracks.forEach(spTrack => {
                    const track = spToTrack(spTrack)

                    tracks.push(track)
                })

                playlist.tracks = tracks
            } else if (track) {
                tracks.push(spToTrack(track))
            }

            return {
                playlist,
                tracks
            } as SearchResult
        }

        if (source === `yt`) {
            if (type === `video`) {
                const tracks = await playdl.video_info(query)

                return await YouTubeSearchResult([tracks.video_details])
            } else if (type === `playlist`) {
                const playlist = await playdl.playlist_info(query)

                return await YouTubeSearchResult(undefined, playlist)
            }
        } else if (source === `sp`) {
            if (playdl.is_expired() && this._spotifyToken) {
                await playdl.refreshToken()
            }

            if (type === `track`) {
                const tracks = await playdl.spotify(query) as SpotifyTrack

                return await SpotifySearchResult(tracks)
            } else if (type === `playlist` || type === `album`) {
                const playlist = await playdl.spotify(query) as SpotifyPlaylist

                return await SpotifySearchResult(undefined, playlist)
            }
        } else if (query.match(/(?:https?):\/\/(\w+:?\w*)?(\S+)(:\d+)?(\/|\/([\w#!:.?+=&%!\-\/]))?/)) {
            const trackInfo = await fetch(query)
            const duration = await getAudioDuration(query).catch(() => {})

            if (!duration) return {
                playlist: null,
                tracks: []
            } as SearchResult
            const track = new Track(this, {
                title: trackInfo.headers.get('content-disposition')?.split('=')[1].split('.')[0] ?? `Unnamed track`,
                description: `No description provided`,
                requestedBy,
                source: 'arbitrary',
                duration: Util.buildTimeCode(Util.parseMS(duration * 1000)),
                durationMs: duration * 1000,
                thumbnail: requestedBy?.guild.iconURL({ size: 1024 }) ?? `https://media.discordapp.net/attachments/742730474077683773/1019795318486859876/apple-music-2020-09-25.png`,
                url: query,
                likes: 0,
                live: false,
                author: requestedBy?.guild.name ?? `Unknown author`,
                playlist: null
            })

            return {
                playlist: null,
                tracks: [track]
            } as SearchResult
        }

        const videos = await playdl.search(query, { source: { youtube: 'video' }, limit })

        return await YouTubeSearchResult(videos)
    }
}