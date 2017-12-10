import { Physics } from 'phaser-ce';

export class SimpleSprite extends Phaser.Sprite {
    constructor(game: Phaser.Game, x: number, y: number, key?: string, frame?: string | number, scale?: number | Phaser.Point, anchor?: number | Phaser.Point) {
        super(game, x, y, key, frame);

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
        this.body.debug = false;
    }
}