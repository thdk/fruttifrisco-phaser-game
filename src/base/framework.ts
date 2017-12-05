export namespace thdk {
    export namespace assets {
        export interface ISpritesheet {
            getName(): string;
            getPNG(): string;
            getFrameWidth(): number;
            getFrameHeight(): number;
            getFrameMax(): number;
            getMargin(): number;
            getSpacing(): number;
        }
    }
}