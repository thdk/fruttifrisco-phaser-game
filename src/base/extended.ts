import { Physics } from 'phaser-ce';

export class SimpleSprite extends Phaser.Sprite {
    constructor(game: Phaser.Game, x: number, y: number, key?: string, frame?: string | number, group?: Phaser.Group) {
        super(game, x, y, key, frame);
        if (group)
            group.add(this);
        else
            this.game.add.existing(this);
    }
}

export class PhysicsSprite extends SimpleSprite {
    constructor(game: Phaser.Game, x: number, y: number, key?: string, frame?: string | number, group?: Phaser.Group) {
        super(game, x, y, key, frame, group);
        this.physicsEnabled = true;
        this.game.physics.p2.enable(this);
    }
}

export class PhysicsP2Sprite extends PhysicsSprite {
    public body: Physics.P2.Body;
    protected material: Phaser.Physics.P2.Material;
    constructor(game: Phaser.Game, x: number, y: number, key?: string, frame?: string | number, group?: Phaser.Group) {
        super(game, x, y, key, frame, group);
        this.game.physics.p2.enable(this);
        this.body.debug = false;
    }
}