import { TimeData } from '../declarations'

export class Util {
    static parseMS(milliseconds: number) {
        const round = milliseconds > 0 ? Math.floor : Math.ceil

        return {
            days: round(milliseconds / 86400000),
            hours: round(milliseconds / 3600000) % 24,
            minutes: round(milliseconds / 60000) % 60,
            seconds: round(milliseconds / 1000) % 60
        } as TimeData
    }

    static buildTimeCode(duration: TimeData) {
        const items = Object.keys(duration)
        const required = ['days', 'hours', 'minutes', 'seconds']

        const parsed = items.filter((x) => required.includes(x)).map((m) => duration[m as keyof TimeData])
        const final = parsed
            .slice(parsed.findIndex((x) => x !== 0))
            .map((x, i) => (i > 0 ? Math.abs(x) : x).toString().padStart(2, "0"))
            .join(":")

        return final.length <= 3 ? `0:${final.padStart(2, "0") || 0}` : final
    }

    static msToTime(ms: number) {
        let duration = Math.abs(ms),
        seconds: any = Math.floor((duration / 1000) % 60),
        minutes: any = Math.floor((duration / (1000 * 60)) % 60),
        hours: any = Math.floor((duration / (1000 * 60 * 60)));
    
        seconds = `${seconds < 10 ? '0' : ''}${seconds}`
        minutes = `${minutes < 10 ? '0' : ''}${minutes}`
        hours = `${hours < 10 ? '0' : ''}${hours}`
    
        if (duration >= 3600000) return `${hours}:${minutes}:${seconds}`
        return `00:${seconds}`
    }
}