import { TimeData } from '../declarations/QueueDeclarations';
export declare class Util {
    static parseMS(milliseconds: number): TimeData;
    static buildTimeCode(duration: TimeData): string;
    static msToTime(ms: number): string;
}
