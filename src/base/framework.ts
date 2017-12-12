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

    export namespace utils {
        /**
         * Shuffles array in place. ES6 version
         * @param {Array} a items An array containing the items.
         */
        export function shuffle(a) {
            for (let i = a.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [a[i], a[j]] = [a[j], a[i]];
            }
            return a;
        }
    }
}