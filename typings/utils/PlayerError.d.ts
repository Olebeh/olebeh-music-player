export declare enum ErrorStatusCode {
    STREAM_ERROR = "StreamError",
    AUDIO_PLAYER_ERROR = "AudioPlayerError",
    PLAYER_ERROR = "PlayerError",
    NO_AUDIO_RESOURCE = "NoAudioResource",
    UNKNOWN_GUILD = "UnknownGuild",
    INVALID_ARG_TYPE = "InvalidArgType",
    UNKNOWN_EXTRACTOR = "UnknownExtractor",
    INVALID_EXTRACTOR = "InvalidExtractor",
    INVALID_CHANNEL_TYPE = "InvalidChannelType",
    INVALID_TRACK = "InvalidTrack",
    UNKNOWN_REPEAT_MODE = "UnknownRepeatMode",
    TRACK_NOT_FOUND = "TrackNotFound",
    NO_CONNECTION = "NoConnection",
    DESTROYED_QUEUE = "DestroyedQueue"
}
export declare class PlayerError extends Error {
    message: string;
    statusCode: ErrorStatusCode;
    createdAt: Date;
    constructor(message: string, code?: ErrorStatusCode);
    get createdTimestamp(): number;
    valueOf(): ErrorStatusCode;
    toJSON(): {
        stack: string | undefined;
        code: ErrorStatusCode;
        message: string;
        created: number;
    };
    toString(): string | undefined;
}
