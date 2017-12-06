import * as Assets from '../assets';
import { PhysicsP2Sprite, SimpleSprite } from '../base/extended';
import * as platforms from './platforms';
import { thdk } from '../base/framework';
import { Group, Physics } from 'phaser-ce';

export enum MachineSize {
    small = 1,
    medium = 2,
    large = 3
}

export class Machine extends Group {
    constructor(game: Phaser.Game, x: number, y: number, size: MachineSize, parent?: Group, collisionGroup?: Physics.P2.CollisionGroup, collidesWith?: Physics.P2.CollisionGroup | Physics.P2.CollisionGroup[], name?: string, addToStage?: boolean, enableBody?: boolean, physicsBodyType?: number) {
        super(game, parent, name, addToStage, enableBody, physicsBodyType);
        this.x = x;
        this.y = y;

        if (parent)
            parent.add(this);
        else
            game.add.existing(this);

        const platform = this.createPlatform(size);
        if (!platform)
            return;

        platform.inputEnabled = true;
        platform.input.priorityID = 3
        if (collisionGroup) {
            platform.body.setCollisionGroup(collisionGroup);
            platform.body.collides(collidesWith);
        }

        this.createReceivers(size);
    }

    private createPlatform(size: MachineSize): platforms.MachinePlatform | null {
        switch (size) {
            case (MachineSize.small):
                return new platforms.TasteMachinePlatform(this.game, this.x, this.y);
            case (MachineSize.large):
                return new platforms.SourceMachinePlatform(this.game, this.x, this.y);
            default:
                return null;
        }
    }

    private createReceivers(size: MachineSize) {
        if (size === 1) {
            const red = new RedReceiver(this.game, 75, 0, this);
        }
        else{
            const green = new GreenReceiver(this.game, 40, 0, this);
            const green1 = new GreenReceiver(this.game, 160, 0, this);
            const green2 = new GreenReceiver(this.game, 280, 0, this);
        }
    }
}

export class Receiver extends SimpleSprite {
    constructor(game: Phaser.Game, x: number, y: number, frame?: string | number, group?: Phaser.Group) {
        super(game, x, y, Assets.Spritesheets.SpritesheetsReceivers3004208.getName(), frame, group);
        this.scale.setTo(0.3);
        this.anchor.set(0, 1);
    }
}

export class GreenReceiver extends Receiver {
    constructor(game: Phaser.Game, x: number, y: number, group?: Phaser.Group) {
        super(game, x, y, 0, group);
    }
}

export class RedReceiver extends Receiver {
    constructor(game: Phaser.Game, x: number, y: number, group?: Phaser.Group) {
        super(game, x, y, 4, group);
    }
}

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