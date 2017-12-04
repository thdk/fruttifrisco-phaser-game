import * as Assets from '../assets';
import { Physics } from 'phaser-ce';

export interface ICollision {
    setCollisionGroup(group: Physics.P2.CollisionGroup);
    collides(group: Physics.P2.CollisionGroup | Physics.P2.CollisionGroup[], callback?: Function, callbackContext?: any);
}

export default class PhysicsP2Platform extends Phaser.Sprite {
    constructor(game: Phaser.Game, x: number, y: number, key?: string, frame?: string | number) {
        super(game, x, y, key, frame);
    }
}

export class PhysicsSprite extends Phaser.Sprite {
    constructor(game: Phaser.Game, x: number, y: number, key?: string, frame?: string | number) {
        super(game, x, y, key, frame);
        this.physicsEnabled = true;
        this.game.physics.p2.enable(this);
        this.game.add.existing(this);
    }
}

export class PhysicsP2Sprite extends PhysicsSprite implements ICollision {
    public body: Physics.P2.Body;
    constructor(game: Phaser.Game, x: number, y: number, key?: string, frame?: string | number) {
        super(game, x, y, key, frame);
        this.game.physics.p2.enable(this);
    }

    public setCollisionGroup(group: Physics.P2.CollisionGroup) {
        this.body.setCollisionGroup(group);
    }

    public collides(group: Physics.P2.CollisionGroup | Physics.P2.CollisionGroup[], callback?: Function, callbackContext?: any) {
        this.body.collides(group, callback, callbackContext);
    }
}

export class Machine extends PhysicsP2Sprite {
    constructor(game: Phaser.Game, x: number, y: number, key?: string) {
        super(game, x, y, key);
        this.body.setMaterial(new Physics.P2.Material('machineMaterial'));
    }
}

export class TasteMachine extends Machine {
    constructor(game: Phaser.Game, x: number, y) {
        super(game, x, y, Assets.Images.ImagesTastemachine.getName());
    }
}

export class SourceMachine extends Machine {
    constructor(game: Phaser.Game, x: number, y) {
        super(game, x, y, Assets.Images.ImagesSourcemachine.getName());
    }
}

export class ConveyerBelt extends PhysicsP2Sprite {
    private material: Phaser.Physics.P2.Material;

    constructor(game: Phaser.Game, x: number, y) {
        super(game, x, y, Assets.Images.ImagesConveybelt.getName());

        this.material = new Phaser.Physics.P2.Material('conveyorBeltMaterial');
        this.body.static = true;
        this.body.setMaterial(this.material);
    }

    public setContactMaterialWith(otherMaterial: Phaser.Physics.P2.Material): Phaser.Physics.P2.ContactMaterial {
        let contactMaterial: Phaser.Physics.P2.ContactMaterial;
        switch (otherMaterial.name) {
            case 'monsterMaterial': {
                const contactMaterial = this.game.physics.p2.createContactMaterial(this.material, otherMaterial);
                contactMaterial.friction = 0;     // Friction to use in the contact of these two materials.
                contactMaterial.restitution = 0.2;  // Restitution (  i.e. how bouncy it is!) to use in the contact of these two materials.
                contactMaterial.stiffness = 1e7;    // Stiffness of the resulting ContactEquation that this ContactMaterial generate.
                contactMaterial.relaxation = 3;     // Relaxation of the resulting ContactEquation that this ContactMaterial generate.
                contactMaterial.frictionStuffness = 1e7;    // Stiffness of the resulting FrictionEquation that this ContactMaterial generate.
                contactMaterial.frictionRelaxation = 3;     // Relaxation of the resulting FrictionEquation that this ContactMaterial generate.
                contactMaterial.surfaceVelocity = 0;        // Will add surface velocity to this material. If bodyA rests on top if bodyB, and the surface velocity is positive, bodyA will slide to the right.

                break;
            }
            default:
                return null;
        }

        return contactMaterial;
    }
}