type KeyHandlerEvent = 'start' | 'end' | 'repeat';
type EventData = [type: KeyHandlerEvent, key: string, time: number];
export declare const keyHandler: (initialDelay: number, repeatDelay: number) => {
    onKeydown: (key: string, now: number) => void;
    onKeyup: (key: string, now: number) => void;
    poll: (now: number) => EventData[];
};
export {};
