import * as Assets from '../assets';
import { PhysicsP2Sprite } from '../base/extended';
import { Physics, Group } from 'phaser-ce';

export class Platform extends PhysicsP2Sprite {
    constructor(game: Phaser.Game, x: number, y: number, key?: string, scale?: number | Phaser.Point, anchor?: number | Phaser.Point) {
        super(game, x, y, key, null, scale, anchor);
        this.body.static = true;
    }
}

export class Ground extends Platform {
    constructor(game: Phaser.Game, y: number, key?: string) {
        super(game, 0, y, key, 1);
        this.body.setRectangle(game.width, 200, game.width / 2);
    }
}

export class MachinePlatform extends Platform {
    constructor(game: Phaser.Game, x: number, y: number, key?: string) {
        super(game, x, y, key, 1, 0);
        this.material = new Physics.P2.Material('machineMaterial');
        this.body.setMaterial(this.material);
    }

    public setContactMaterialWith(otherMaterial: Phaser.Physics.P2.Material): Phaser.Physics.P2.ContactMaterial {
        let contactMaterial: Phaser.Physics.P2.ContactMaterial;
        switch (otherMaterial.name) {
            case 'monsterMaterial': {
                const contactMaterial = this.game.physics.p2.createContactMaterial(this.material, otherMaterial);
                contactMaterial.friction = 0;     // Friction to use in the contact of these two materials.
                // contactMaterial.restitution = 0.8;  // Restitution (  i.e. how bouncy it is!) to use in the contact of these two materials.
                // contactMaterial.stiffness = 1e7;    // Stiffness of the resulting ContactEquation that this ContactMaterial generate.
                // contactMaterial.relaxation = 3;     // Relaxation of the resulting ContactEquation that this ContactMaterial generate.
                // contactMaterial.frictionStuffness = 1e7;    // Stiffness of the resulting FrictionEquation that this ContactMaterial generate.
                // contactMaterial.frictionRelaxation = 3;     // Relaxation of the resulting FrictionEquation that this ContactMaterial generate.
                // contactMaterial.surfaceVelocity = 0;        // Will add surface velocity to this material. If bodyA rests on top if bodyB, and the surface velocity is positive, bodyA will slide to the right.

                break;
            }
            default:
                return null;
        }

        return contactMaterial;
    }
}

export class TasteMachinePlatform extends MachinePlatform {
    constructor(game: Phaser.Game, x: number, y) {
        super(game, x, y, Assets.Images.ImagesTastemachineFront.getName());
        this.body.setRectangle(270, 60, 136, 20);
    }
}

export class SourceMachinePlatform extends MachinePlatform {
    constructor(game: Phaser.Game, x: number, y) {
        super(game, x, y, Assets.Images.ImagesSourcemachineFront.getName());
        this.body.setRectangle(380, 60, 200, 20);
    }
}

export class ConveyerBelt extends Platform {

    constructor(game: Phaser.Game, x: number, y) {
        super(game, x, y, Assets.Images.ImagesConveybelt.getName());

        this.material = new Phaser.Physics.P2.Material('conveyorBeltMaterial');
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