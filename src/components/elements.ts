import * as Assets from '../assets';
import { PhysicsP2Sprite, SimpleSprite } from '../base/extended';
import { thdk } from '../base/framework';

export class Rain extends PhysicsP2Sprite {
    constructor(game: Phaser.Game, spritesheet: thdk.assets.ISpritesheet, frame?: any, group?: Phaser.Group, scale: number = 0) {
        super(game, game.world.randomX, 0, Assets.Spritesheets.SpritesheetsMonster22530012.getName(), null, group);
        this.scale.setTo(scale);
    }
}

export class Monster extends Rain {
    constructor(game: Phaser.Game, group?: Phaser.Group) {
        super(game, Assets.Spritesheets.SpritesheetsMonster22530012, 10, group, 0.3);
        this.animations.add('live', null, 4, true).play();

        this.body.fixedRotation = true;
        const circle = this.body.setCircle(28).material = new Phaser.Physics.P2.Material('machineMaterial');
    }
}

export class Spraycan extends SimpleSprite {
    constructor(game: Phaser.Game, x: number, y: number, key?: string, frame?: string | number, group?: Phaser.Group) {
        super(game, x, y, Assets.Spritesheets.SpritesheetsSpraycan12227512.getName(), frame);
        this.anchor.setTo(0);
        this.scale.setTo(0.5);
        this.inputEnabled = true;
        this.animations.add('spray', [2], 1, false);
        this.input.useHandCursor = true;
    }
}