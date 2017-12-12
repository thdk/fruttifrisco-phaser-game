import { Physics } from 'phaser-ce';

export class SimpleSprite extends Phaser.Sprite {
    constructor(game: Phaser.Game, x: number, y: number, key?: string, frame?: string | number, scale?: number | Phaser.Point, anchor?: number | Phaser.Point) {
        super(game, x, y, key, frame);

        if (typeof (scale) === 'number')
            this.scale.setTo(scale);
        else if (scale)
            this.scale = <Phaser.Point>scale;

        if (typeof (anchor) === 'number')
            this.anchor.setTo(anchor);
        else if (anchor)
            this.anchor = <Phaser.Point>anchor;
    }
}

export class DraggableSprite extends SimpleSprite {
    public readonly originalPosition: Phaser.Point;
    constructor(game: Phaser.Game, x: number, y: number, key?: string, frame?: string | number, scale?: number | Phaser.Point, anchor?: number | Phaser.Point) {
        super(game, x, y, key, frame, scale, anchor);
        this.originalPosition = new Phaser.Point(x, y);
        this.inputEnabled = true;
        this.input.useHandCursor = true;
        this.input.enableDrag(true, true, true);
        this.events.onDragStop.add(() => this.onDragStop());
    }

    private onDragStop() {
        this.x = this.originalPosition.x;
        this.y = this.originalPosition.y;
    }
}

export class PhysicsSprite extends SimpleSprite {
    constructor(game: Phaser.Game, x: number, y: number, key?: string, frame?: string | number, scale?: number | Phaser.Point, anchor?: number | Phaser.Point) {
        super(game, x, y, key, frame, scale, anchor);
        this.physicsEnabled = true;
    }
}

export class PhysicsP2Sprite extends PhysicsSprite {
    public body: Physics.P2.Body;
    protected material: Phaser.Physics.P2.Material;
    constructor(game: Phaser.Game, x: number, y: number, key?: string, frame?: string | number, scale?: number | Phaser.Point, anchor?: number | Phaser.Point) {
        super(game, x, y, key, frame, scale, anchor);

        if (typeof (scale) === 'number')
            this.scale.setTo(scale);
        else if (scale)
            this.scale = <Phaser.Point>scale;

        this.game.physics.p2.enable(this);

        if (typeof (anchor) === 'number')
            this.anchor.setTo(anchor);
        else if (anchor)
            this.anchor = <Phaser.Point>anchor;
        this.body.debug = true;
    }
}