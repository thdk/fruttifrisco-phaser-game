import * as Assets from '../assets';
import * as Platforms from '../components/platforms';
import { Physics } from 'phaser-ce';

export default class Title extends Phaser.State {
    private monsters: Phaser.Group;
    private platforms: Phaser.Group;

    private platformCollisionGroup: Phaser.Physics.P2.CollisionGroup;
    private monsterCollisionGroup: Phaser.Physics.P2.CollisionGroup;
    private monsterMaterial: Physics.P2.Material;
    private machineMaterial: Physics.P2.Material;
    private conveyorBeltMaterial: Physics.P2.Material;

    public create(): void {
        this.game.physics.startSystem(Phaser.Physics.P2JS);
        this.game.physics.p2.gravity.y = 1000;
        //  Turn on impact events for the world, without this we get no collision callbacks
        // this.game.physics.p2.setImpactEvents(true);

        this.game.physics.p2.restitution = 0.4;

        //  Create our collision groups.
        this.platformCollisionGroup = this.game.physics.p2.createCollisionGroup();
        this.monsterCollisionGroup = this.game.physics.p2.createCollisionGroup();


        //  This part is vital if you want the objects with their own collision groups to still collide with the world bounds
        //  (which we do) - what this does is adjust the bounds to use its own collision group.
        this.game.physics.p2.updateBoundsCollisionGroup();

        this.monsterMaterial = new Physics.P2.Material('monsterMaterial');
        this.machineMaterial = new Physics.P2.Material('machineMaterial');
        this.conveyorBeltMaterial = new Physics.P2.Material('conveyorBeltMaterial');

        var contactMaterial = this.game.physics.p2.createContactMaterial(this.monsterMaterial, this.machineMaterial);

        // leave commented setWorldMaterial for inspiration 
        //  4 trues = the 4 faces of the world in left, right, top, bottom order
        // this.game.physics.p2.setWorldMaterial(worldMaterial, true, true, true, true);

        contactMaterial.friction = 0;     // Friction to use in the contact of these two materials.
        contactMaterial.restitution = 0.3 ;  // Restitution (i.e. how bouncy it is!) to use in the contact of these two materials.
        contactMaterial.stiffness = 1e7;    // Stiffness of the resulting ContactEquation that this ContactMaterial generate.
        contactMaterial.relaxation = 3;     // Relaxation of the resulting ContactEquation that this ContactMaterial generate.
        contactMaterial.frictionStuffness = 1e7;    // Stiffness of the resulting FrictionEquation that this ContactMaterial generate.
        contactMaterial.frictionRelaxation = 3;     // Relaxation of the resulting FrictionEquation that this ContactMaterial generate.
        contactMaterial.surfaceVelocity = 0;        // Will add surface velocity to this material. If bodyA rests on top if bodyB, and the surface velocity is positive, bodyA will slide to the right.

        // leave commented setWorldMaterial for inspiration 
        //  4 trues = the 4 faces of the world in left, right, top, bottom order
        // this.game.physics.p2.setWorldMaterial(worldMaterial, true, true, true, true);

        var contactMaterial2 = this.game.physics.p2.createContactMaterial(this.conveyorBeltMaterial, this.monsterMaterial);
        contactMaterial2.friction = 0;     // Friction to use in the contact of these two materials.
        contactMaterial2.restitution = 0.2 ;  // Restitution (i.e. how bouncy it is!) to use in the contact of these two materials.
        contactMaterial2.stiffness = 1e7;    // Stiffness of the resulting ContactEquation that this ContactMaterial generate.
        contactMaterial2.relaxation = 3;     // Relaxation of the resulting ContactEquation that this ContactMaterial generate.
        contactMaterial2.frictionStuffness = 1e7;    // Stiffness of the resulting FrictionEquation that this ContactMaterial generate.
        contactMaterial2.frictionRelaxation = 3;     // Relaxation of the resulting FrictionEquation that this ContactMaterial generate.
        contactMaterial2.surfaceVelocity = 5;        // Will add surface velocity to this material. If bodyA rests on top if bodyB, and the surface velocity is positive, bodyA will slide to the right.

        const background = this.game.add.image(this.game.world.centerX, this.game.world.centerY, Assets.Images.ImagesBgGame.getName());
        background.anchor.setTo(0.5);

        this.platforms = this.add.physicsGroup();
        this.platforms.physicsBodyType = Phaser.Physics.P2JS;

        const conveyorBelt = Assets.Images.ImagesConveybelt.getName();

        const converyerBelt1 = this.platforms.create(0, 750, conveyorBelt);
        const converyerBelt2 = this.platforms.create(600, 750, conveyorBelt);
        const converyerBelt3 = this.platforms.create(1200, 750, conveyorBelt);
        const sourceMachine = this.platforms.create(300, 678, Assets.Images.ImagesSourcemachine.getName());
        const tasteMachine = this.platforms.create(900, 678, Assets.Images.ImagesTastemachine.getName());

        this.game.physics.p2.enable(this.platforms, true);

        converyerBelt1.body.setMaterial(this.conveyorBeltMaterial);
        converyerBelt2.body.setMaterial(this.conveyorBeltMaterial);
        converyerBelt3.body.setMaterial(this.conveyorBeltMaterial);

        // this.platforms.setAll('body.static', true);
        // this.platforms.setAll('body.offset', new Phaser.Point(30, 30));

        sourceMachine.body.clearShapes();
        sourceMachine.body.loadPolygon(Assets.JSON.JsonSourcemachine.getName(), Assets.Images.ImagesSourcemachine.getName());
        (<Phaser.Physics.P2.Body>sourceMachine.body).setMaterial(this.machineMaterial);

        const tasteMachineBody: Phaser.Physics.P2.Body = tasteMachine.body;
        const rect = tasteMachineBody.setRectangle(270, 60, 0, -110);
        rect.material = this.machineMaterial;

        this.platforms.forEach((sprite: Phaser.Sprite) => {
            const body: Phaser.Physics.P2.Body = sprite.body;

            body.setCollisionGroup(this.platformCollisionGroup);
            body.collides(this.monsterCollisionGroup);
            body.static = true;
            body.debug = false;
            body.onBeginContact.add(this.monsterDropped);

        }, this);
        const body: Phaser.Physics.P2.Body = sourceMachine.body;
        // body.static = true;

        // this.physics.arcade.collide(this.monsters, this.platforms, this.collide, null, this);

        this.startDropMonsters();
    }

    private startDropMonsters() {
        this.monsters = this.game.add.physicsGroup();
        this.monsters.physicsBodyType = Phaser.Physics.P2JS;

        this.game.time.events.loop(1500, this.dropMonster, this);
    }

    private dropMonster() {
        const monster = this.monsters.create(this.world.randomX, 0, Assets.Spritesheets.SpritesheetsMonster22530012.getName(), 10);
        const monsterAnimation = monster.animations.add('live', null, 4, true);
        monster.scale.setTo(0.3);
        monsterAnimation.play();

        this.game.physics.p2.enable(monster);
        const body: Phaser.Physics.P2.Body = monster.body;
        body.fixedRotation = true;
        const circle = body.setCircle(25);
        circle.material = this.monsterMaterial;
        body.debug = false;
        body.motionState = Phaser.Physics.P2.Body.DYNAMIC;
        body.collides([this.platformCollisionGroup, this.monsterCollisionGroup], this.monsterDropped, {});
        body.setCollisionGroup(this.monsterCollisionGroup);
    }

    private monsterDropped(aObject1: any, aObject2: any, context: any) {
        // explode dron and remove missile - kill it, not destroy
        const random_boolean = Math.random() >= 0.5;
        let direction = -1;
        if (random_boolean)
            direction = 1;
        (<Phaser.Sprite>aObject1.sprite).body.velocity.x = 40 * direction;
        const b: Phaser.Physics.P2.Body = (<Phaser.Sprite>aObject1.sprite).body;
        // (<Phaser.Sprite> aObject2.sprite);
    }

    public update() {
        // this.game.physics.arcade.collide(this.monsters, this.platforms);
    }
}