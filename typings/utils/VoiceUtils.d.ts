import { VoiceChannel, StageChannel, Collection, Snowflake } from 'discord.js';
import { VoiceConnection } from '@discordjs/voice';
import { StreamDispatcher } from './StreamDispatcher';
export declare class VoiceUtils {
    cache: Collection<Snowflake, StreamDispatcher>;
    /**
     * The voice utils
     * @private
     */
    constructor();
    /**
     * Joins a voice channel, creating basic stream dispatch manager
     * @param {StageChannel|VoiceChannel} channel The voice channel
     * @param {object} [options] Join options
     * @returns {Promise<StreamDispatcher>}
     */
    connect(channel: VoiceChannel | StageChannel, options?: {
        deaf?: boolean;
        maxTime?: number;
    }): Promise<StreamDispatcher>;
    /**
     * Joins a voice channel
     * @param {StageChannel|VoiceChannel} [channel] The voice/stage channel to join
     * @param {object} [options] Join options
     * @returns {VoiceConnection}
     */
    join(channel: VoiceChannel | StageChannel, options?: {
        deaf?: boolean;
        maxTime?: number;
    }): Promise<VoiceConnection>;
    /**
     * Disconnects voice connection
     * @param {VoiceConnection} connection The voice connection
     * @returns {void}
     */
    disconnect(connection: VoiceConnection | StreamDispatcher): void;
    /**
     * Returns Discord Player voice connection
     * @param {Snowflake} guildId The guild id
     * @returns {StreamDispatcher}
     */
    getConnection(guildId: string): StreamDispatcher | undefined;
}
