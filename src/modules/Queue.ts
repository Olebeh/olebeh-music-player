import Discord from 'discord.js'
import playdl from 'play-dl'
import { AudioResource, entersState, StreamType, VoiceConnectionStatus } from '@discordjs/voice'
import { Player } from '../Player'
import { CreateQueueOptions, PlayerProgressBarOptions, PlayerTimestamp, QueueRepeatMode } from '../declarations'
import { Track } from './Track'
import { StreamDispatcher } from '../utils/StreamDispatcher'
import { ErrorStatusCode, PlayerError } from '../utils/PlayerError'
import { Util } from '../utils/Utils'

type If<T, A, B = undefined> = T extends true ? A : T extends false ? B : A | B

export class Queue<State extends boolean = boolean> {
    /**
     * Voice channel bot's currently in (if there's one)
     */
    channel?: Discord.GuildTextBasedChannel
    /**
     * Queue options like leaveOnEmptyTimeout and leaveOnIdleTimeout
     */
    options: Omit<CreateQueueOptions, `channel`> = {}
    /**
     * An array of all tracks in the queue
     */
    tracks: Track[] = []
    /**
     * An array of all previous tracks in the queue
     */
    previousTracks: Track[] = []
    /**
     * Current queue repeat mode
     */
    repeatMode: QueueRepeatMode = QueueRepeatMode.Off
    /**
     * Current queue's player state (paused or not)
     */
    paused = false
    /**
     * Current queue's volume
     */
    volume = 100
    /**
     * Max queue's volume possible to set
     */
    maxVolume: number
    /**
     * Queue connection
     */
    connection?: StreamDispatcher
    /**
     * State of queue (destroyed or not)
     */
    #destroyed = false
    /**
     * The guild queue was created in
     */
    readonly guild: Discord.Guild
    /**
     * Queue id is basically queue's guild id
     */
    readonly id: string
    /**
     * Main player
     */
    readonly player: Player
    /**
     * Type of the state of the queue. Not used, but required
     */
    private state?: State
    private _streamTime = 0
    /**
     * Tracks are being added here while processing to play
     */
    private _queued: Track[] = []
    private _current?: Track

    constructor(guild: Discord.Guild, player: Player, options?: CreateQueueOptions) {
        this.guild = guild
        this.id = guild.id
        this.channel = options?.channel
        this.player = player
        this.options.leaveOnEmptyTimeout = options?.leaveOnEmptyTimeout ?? 30000
        this.options.leaveOnIdleTimeout = options?.leaveOnIdleTimeout ?? 30000
        this.maxVolume = options?.maxVolume ?? 200
        this.#destroyed = false
    }

    /**
     * Adds specified track or tracks to the end of the queue
     * @param tracks Track or tracks that should be added
     * @param emit Either emit "addTrack(s)" event on insert or not
     * @returns Array of all tracks in the queue
     */
    addTracks(tracks: Track | Track[], emit?: boolean) {
        if (this.#watchDestroyed) return undefined as If<State, Track[]>
        if (!Array.isArray(tracks)) tracks = [tracks]
        if (!emit && emit !== false) emit = true

        this.tracks = this.tracks.concat(tracks)

        if (tracks.length == 1 && emit) this.player.emit(`trackAdd`, this, tracks[0])
        else if (emit) this.player.emit(`tracksAdd`, this, tracks)

        return this.tracks as If<State, Track[]>
    }

    /**
     * Returns to the previous played track and, if found, plays it skipping the current one
     * @returns
     */
    async back() {
        if (this.#watchDestroyed) return

        const track = this.previousTracks.shift()
        if (!track) throw new PlayerError(`No previous tracks found`, ErrorStatusCode.TrackNotFound)
        if (this.current) this.tracks.unshift(this.current)

        return await this.play(track, { force: true })
    }

    /**
     * Clears both previous and next tracks in the queue
     * @returns
     */
    clear() {
        if (this.#watchDestroyed) return
        this.clearCurrent()
        this.clearPrevious()
    }

    /**
     * Clears next tracks in the queue
     * @returns
     */
    clearCurrent() {
        if (this.#watchDestroyed) return undefined as If<State, Track[]>
        return this.tracks.splice(0, this.tracks.length) as If<State, Track[]>
    }

    /**
     * Clears previous tracks in the queue
     * @returns
     */
    clearPrevious() {
        if (this.#watchDestroyed) return undefined as If<State, Track[]>
        return this.previousTracks.splice(0, this.previousTracks.length) as If<State, Track[]>
    }

    /**
     * Connects to the specified channel
     * @param channel The channel that bot should connect to
     * @returns Bot's current connection
     */
    async connect(channel: Discord.GuildChannelResolvable) {
        if (this.connection && this.connection.channel) return this.connection

        const _channel = this.guild.channels.resolve(channel)
        if (!_channel || !_channel.isVoiceBased()) throw new PlayerError(`Only voice or stage channel can be provided`, ErrorStatusCode.InvalidChannelType)
        const connection = await this.player.voiceUtils.connect(_channel, {
            deaf: false
        })

        this.connection = connection

        if (this.connection.listeners(`start`).length < 1) this.connection.on(`start`, async resource => {
            this._current = resource.metadata
            this.player.emit(`trackStart`, this, resource.metadata)
        })

        if (this.connection.listeners(`finish`).length < 1) this.connection.on(`finish`, async resourse => {
            this._current = undefined
            this._streamTime = 0

            if (!this.connection) return
            if (resourse.metadata) this.previousTracks.unshift(resourse.metadata)

            this.player.emit(`trackEnd`, this, resourse.metadata)

            if (
                !this.connection.channel &&
                this.connection.voiceConnection.state.status !== VoiceConnectionStatus.Destroyed
            ) {
                return await entersState(this.connection.voiceConnection, VoiceConnectionStatus.Destroyed, this.connection.connectionTimeout)
            } else if (this.connection.voiceConnection.state.status === VoiceConnectionStatus.Destroyed) return

            if (!this.tracks.length && this.repeatMode == QueueRepeatMode.Off) {
                this.player.emit(`queueEnd`, this)
            } else {
                if (this.repeatMode == QueueRepeatMode.Track) return this.play(this.previousTracks[0])
                else if (this.repeatMode == QueueRepeatMode.Queue) {
                    this.tracks.push(this.previousTracks[0])
                    const nextTrack = this.tracks.shift()
                    return void this.play(nextTrack)
                } else {
                    return void this.play()
                }
            }
        })

        return this.connection
    }

    /**
     * Creates the visual progress bar that can be used to display the progress of the current track
     * @param options Some options for creating progress bar to your taste
     * @returns If current track, something like this: 0:00 ┃ 🔘-------------- ┃ 03:32 (end time), otherwise undefined
     */
    createProgressBar(options: PlayerProgressBarOptions = { timecodes: true }) {
        if (this.#watchDestroyed) return undefined as If<State, string>
        if (!this.current) return undefined as If<State, string>
        
        const length = !options.length ? 15 : (options.length <= 0 || options.length > 30 ? 15 : options.length)
        const index = Math.round((this.streamTime as number / this.current.durationMs) * length)
        const line = !options.line ? '▬' : options.line
        const indicator = !options.indicator ? '🔘' : options.indicator

        if (index >= 1 && index <= length) {
            const bar = line.repeat(length - 1).split(``)
            bar.splice(index, 0, indicator)
            if (options.timecodes) {
                const timestamp = this.getPlayerTimestamp() as PlayerTimestamp
                return `${timestamp.current} ┃ ${bar.join(``)} ┃ ${timestamp.end}`
            } else {
                return `${bar.join(``)}`
            }
        } else {
            if (options.timecodes) {
                const timestamp = this.getPlayerTimestamp() as PlayerTimestamp
                return `${timestamp.current} ┃ ${indicator}${line.repeat(length - 1)} ┃ ${timestamp.end}`
            } else {
                return `${indicator}${line.repeat(length - 1)}`
            }
        }
    }

    /**
     * Destroyes this queue. That means that everything will be cleared, connection closed and you wouldn't be able to interact with queue anymore
     * @param leave Either leave the voice channel (if one) after destroying or not
     * @returns Representation of this queue as destroyed
     */
    destroy(leave?: boolean): this is Queue<false> {
        if (this.#watchDestroyed) return true
        const queues = this.player.queues

        if (!leave && leave !== false) leave = true
        if (leave) this.disconnect()
        if (this.connection) this.connection.end()

        this.clear()
        this.clearPrevious()

        queues.splice(queues.indexOf(this), 1)

        this.#destroyed = true
        return true
    }

    /**
     * Disconnects from the voice channel (if one)
     * @returns
     */
    disconnect() {
        if (this.#watchDestroyed) return
        if (this.connection!.channel) this.connection!.disconnect()

        this.connection!.channel = undefined!
    }

    /**
     * Checks if queue is destroyed
     * @returns Representation of current queue as definately existing
     */
    exists(): this is Queue<true> {
        return !this.#destroyed
    }

    /**
     * Gets current track's timestamp and returns in convenient format
     * @returns A timestamp from which you can extract current progress in ms, track's end timecode and current progress
     */
    getPlayerTimestamp() {
        if (this.#watchDestroyed) return undefined as If<State, PlayerTimestamp>
        if (!this.current) return undefined as If<State, PlayerTimestamp>

        const currentStreamTime = this.streamTime as number
        const totalTime = this.current.durationMs

        const currentTimecode = Util.buildTimeCode(Util.parseMS(currentStreamTime))
        const endTimecode = Util.buildTimeCode(Util.parseMS(totalTime))

        return {
            current: currentTimecode,
            end: endTimecode,
            progress: Math.round((currentStreamTime / totalTime) * 100)
        } as If<State, PlayerTimestamp>
    }

    /**
     * Returns the index of the specified track in array. The lowest index is 0
     * @param track Can be either Track or string. If string specified, first finds track by it's id, and returns it's index
     * @returns Index of specified track
     */
    getTrackPosition(track: Track | string) {
        if (this.#watchDestroyed) return undefined as If<State, number>
        const _track = this.tracks.find(__track => __track.id === (track instanceof Track ? track.id : track))

        if (!_track) return -1 as If<State, number>
        return this.tracks.indexOf(_track) as If<State, number>
    }

    /**
     * Inserts a track in the middle of the queue
     * @param tracks Track or tracks that should be inserted
     * @param index Where should track or tracks be inserted. The lowest index is 0, specifying which will insert tracks at the very beginning of the queue
     * @param emit Either emit "addTrack(s)" event on insert or not
     * @returns Array of all tracks in the queue
     */
    insert(tracks: Track | Track[], index: number, emit?: boolean) {
        if (this.#watchDestroyed) return undefined as If<State, Track[]>
        if (!Array.isArray(tracks)) tracks = [tracks]
        if (!emit && emit !== false) emit = true

        tracks.forEach(track => this.tracks.splice(index, 0, track))

        if (tracks.length == 1 && emit) this.player.emit(`trackAdd`, this, tracks[0])
        else if (emit) this.player.emit(`tracksAdd`, this, tracks)

        return this.tracks as If<State, Track[]>
    }

    /**
     * Jumps to the specified track from the queue. That means that current track is skipped, and provided track starts playing
     * @param track Can be one of following: Track, number or string. If string specified, finds track by it's id. If number, finds track by it's index in the tracks array
     * @returns {void}
     */
    jump(track: Track | number | string): void {
        if (this.#watchDestroyed) return

        const foundTrack = this.remove(track) as Track | false
        if (!foundTrack) throw new PlayerError(`Track not found!`, ErrorStatusCode.TrackNotFound)

        this.tracks.unshift(foundTrack)

        return void this.skip()
    }

    /**
     * Turns on or off the repeat mode. 
     * @param mode Track mode (1) - repeats current track over again. Queue mode (2) - repeats current queue over again. Off (3) - turns repeat mode off
     * @returns 
     */
    loop(mode: QueueRepeatMode) {
        if (this.#watchDestroyed) return undefined as If<State, QueueRepeatMode>
        this.repeatMode = mode
        return this.repeatMode as If<State, QueueRepeatMode>
    }

    /**
     * Removes specified track from the queue
     * @param track 
     * @returns 
     */
    remove(track: Track | number | string) {
        if (this.#watchDestroyed) return undefined as If<State, Track>
        if (typeof track === `number`) {
            const _track = this.tracks[track]
            if (!_track) return undefined as If<State, Track>
            this.tracks.splice(this.tracks.indexOf(_track, 1))

            return _track as If<State, Track>
        } else {
            const _track = this.tracks.find(__track => __track.id === (track instanceof Track ? track.id : track))
            if (!_track) return undefined as If<State, Track>
            this.tracks.splice(this.tracks.indexOf(_track, 1))

            return _track as If<State, Track>
        }
    }

    /**
     * Seeks current track to specified time
     * @param position Position (in ms) that track should be seeked to
     * @returns True if seek was successful, otherwise false
     */
    async seek(position: number) {
        if (this.#watchDestroyed) return false as If<State, boolean>
        if (!this.current) return false as If<State, boolean>
        if (position < 1) position = 0
        if (position >= this.current.durationMs) return this.skip() as If<State, boolean>

        await this.play(this.current, { force: true, seek: position })
        return true as If<State, boolean>
    }

    /**
     * Sets the quality of current track. Lower quality - faster loading and less lag, but bad audio
     * @param bitrate The targeted bitrate. Use "default" for default bitrate 
     * @returns 
     */
    setBitrate(bitrate: number | `default`) {
        if (this.#watchDestroyed) return
        if (!this.connection?.audioResource?.encoder) return
        if (bitrate === `default`) bitrate = this.connection.channel.bitrate ?? 64000
        this.connection.audioResource.encoder.setBitrate(bitrate)
    }

    /**
     * Sets bot SERVER deafen
     * @param deafened Either deafen or undeafen
     */
    async setDeaf(deafened: boolean) {
        if (this.#watchDestroyed) return false as If<State, boolean>
        if (!this.connection) return false as If<State, boolean>

        await this.connection.channel.guild.members.me?.voice.setDeaf(deafened)

        return true as If<State, boolean>
    }

    /**
     * Pauses or unpauses current track
     * @param paused Either pause or unpause
     * @returns True if action was successful, otherwise false
     */
    setPaused(paused: boolean) {
        if (this.#watchDestroyed) return false as If<State, boolean>
        if (!this.connection) return false as If<State, boolean>

        this.paused = paused

        return paused ? this.connection.pause(true) : this.connection.resume()
    }

    /**
     * Sets the volume of queue
     * @param volume The targeted volume. Minimum is 1, and maximum is queue's max volume (200 by default)
     * @returns True if change of volume was successful, otherwise false
     */
    setVolume(volume: number) {
        if (this.#watchDestroyed) return false as If<State, boolean>
        if (!this.connection) return false as If<State, boolean>
        if (volume > this.maxVolume || volume <= 0) return false as If<State, boolean>

        this.volume = volume

        return this.connection.setVolume(volume) as If<State, boolean>
    }

    /**
     * Starts the playback of the track
     * @param trackToPlay If specified, this track will start playing. Else the first track from the queue will start playing
     * @param options Force - if true, the playback of the track will forcefully start, even if there's a track currently playing. Else won't play. Seeks track to specified time (in ms)
     * @returns 
     */
    async play(trackToPlay?: Track, options?: { force?: boolean, seek?: number }) {
        if (this.#watchDestroyed) return
        if (!this.connection) throw new PlayerError(`No connection to voice channel`, ErrorStatusCode.NoConnection)
        if (this.current && !options?.force) return
        if (this._queued[0] && !options?.force) return
        if (!this.connection.channel || !this.connection.channel.id) return
        if (this.connection.audioPlayer) this.connection.audioPlayer.stop()

        const track = !trackToPlay ? this.tracks.shift() : trackToPlay

        if (!track) return

        this._queued.push(track)

        const { title, author, source, url } = track

        if (source === `youtube`) {
            const yt_stream = await playdl.stream(url)
            const resource = this.connection.createStream(yt_stream.stream, { type: yt_stream.type, data: track }) as AudioResource<Track>

            await this.connection.playStream(resource, this.volume)
        } else if (source === `spotify`) {
            if (playdl.is_expired()) {
                await playdl.refreshToken()
            }

            const sp_stream = await playdl.stream(await playdl.search(`${author} ${title}`, { source: { youtube: `video` } }).then(result => result[0].url))
            const resource = this.connection.createStream(sp_stream.stream, { type: sp_stream.type, data: track }) as AudioResource<Track>

            await this.connection.playStream(resource, this.volume)
        } else if (source === `arbitrary`) {
            const resource = this.connection.createStream(track.url, { type: StreamType.Arbitrary, data: track }) as AudioResource<Track>

            await this.connection.playStream(resource, this.volume)
        }

        if (options?.seek) this._streamTime = options.seek
        this._queued.shift()
    }

    /**
     * Randomizes all tracks in the queue
     * @returns
     */
    shuffle() {
        if (this.#watchDestroyed) return undefined as If<State, Track[]>

        for (let i = this.tracks.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1)); // SEMICOLON IS REQUIRED
            [this.tracks[i], this.tracks[j]] = [this.tracks[j], this.tracks[i]]
        }
    
        return this.tracks as If<State, Track[]>
    }

    /**
     * Skips current track and, if there's at least one more track in the queue, starts playing it
     * @returns
     */
    skip() {
        if (this.#watchDestroyed) return undefined as If<State, boolean>
        if (!this.connection) return undefined as If<State, boolean>
        
        this.connection.end()

        return true as If<State, boolean>
    }

    /**
     * Destroyed current queue without leaving the voice channel. Create just for convenience
     * @returns 
     */
    stop() {
        if (this.#watchDestroyed) return
        this.destroy(false)
    }

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
    toString(includeAuthor?: boolean) {
        if (this.#watchDestroyed) return undefined as If<State, string[]>
        const tracks = this.tracks.map((track, i) => `**${i + 1}.** ` + track.toString(includeAuthor))

        return tracks as If<State, string[]>
    }

    /**
     * Gets current track
     * @returns If there's current track, return it. Otherwise undefined
     */
    get current() {
        if (this.#watchDestroyed) return undefined as If<State, Track | undefined>
        return this._current as If<State, Track | undefined>
    }

    /**
     * Checks if queue is destroyed
     * @returns True if queue is destroyed, otherwise false
     */
    get destroyed() {
        return this.#destroyed
    }

    /**
     * Gets the progress of current track in ms
     * @returns Stream time of current track if there's one, otherwise 0
     */
    get streamTime() {
        if (this.#watchDestroyed) return 0 as If<State, number>
        if (!this.connection) return 0 as If<State, number>
        return this._streamTime + this.connection.streamTime as If<State, number>
    }

    /**
     * Gets the total time off all tracks in the queue
     * @returns Total time (0 if no tracks)
     */
    get totalTime() {
        if (this.#watchDestroyed) return 0 as If<State, number>
        return this.tracks.length > 0 ? this.tracks.map(track => track.durationMs).concat(this._queued.map(track => track.durationMs)).reduce((a, b) => a + b) : 0
    }

    /**
     * Presented in almost every method of Queue class to display correct return types.
     * If queue doesn't exist, an error will be raised and the method will most likely return undefined, because operation was not successful
     * @returns True if queue exists, otherwise false
     */
    get #watchDestroyed() {
        if (this.#destroyed) {
            this.player.emit(`error`, new PlayerError(`Cannot use destroyed queue`, ErrorStatusCode.DestroyedQueue))
            return true
        }

        return false
    }
}