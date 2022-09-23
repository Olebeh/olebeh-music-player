export enum ErrorStatusCode {
    StreamError = `StreamError`,
    AudioPlayerError = `AudioPlayerError`,
    PlayerError = `PlayerError`,
    NoAudioResource = `NoAudioResource`,
    UnknownGuild = `UnknownGuild`,
    MissingArgs = `MissingArgs`,
    InvalidArgType = `InvalidArgType`,
    InvalidChannelType = `InvalidChannelType`,
    InvalidTrack = `InvalidTrack`,
    UnknownRepeatMode = `UnknownRepeatMode`,
    TrackNotFound = `TrackNotFound`,
    NoConnection = `NoConnection`,
    DestroyedQueue = `DestroyedQueue`,
    NotImplemented = `NotImplemented`
}

export class PlayerError extends Error {
    message: string;
    statusCode: ErrorStatusCode;
    createdAt = new Date();

    constructor(message: string, code: ErrorStatusCode = ErrorStatusCode.PlayerError) {
        super();

        this.message = `[${code}] ${message}`;
        this.statusCode = code;
        this.name = code;

        Error.captureStackTrace(this);
    }

    get createdTimestamp() {
        return this.createdAt.getTime();
    }

    valueOf() {
        return this.statusCode;
    }

    toJSON() {
        return {
            stack: this.stack,
            code: this.statusCode,
            message: this.message,
            created: this.createdTimestamp
        };
    }

    toString() {
        return this.stack;
    }
}