export declare enum ErrorStatusCode {
    StreamError = "StreamError",
    AudioPlayerError = "AudioPlayerError",
    PlayerError = "PlayerError",
    NoAudioResource = "NoAudioResource",
    UnknownGuild = "UnknownGuild",
    MissingArgs = "MissingArgs",
    InvalidArgType = "InvalidArgType",
    InvalidChannelType = "InvalidChannelType",
    InvalidTrack = "InvalidTrack",
    UnknownRepeatMode = "UnknownRepeatMode",
    TrackNotFound = "TrackNotFound",
    NoConnection = "NoConnection",
    DestroyedQueue = "DestroyedQueue",
    NotImplemented = "NotImplemented"
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
