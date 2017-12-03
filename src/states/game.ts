import * as Assets from '../assets';
import * as Platforms from '../components/platforms';

export default class Title extends Phaser.State {
    private monsters: Phaser.Group;
    private platforms: Phaser.Group;

    private platformCollisionGroup: Phaser.Physics.P2.CollisionGroup;
    private monsterCollisionGroup: Phaser.Physics.P2.CollisionGroup;

    public create(): void {
        this.game.physics.startSystem(Phaser.Physics.P2JS);
        this.game.physics.p2.gravity.y = 1000;
        //  Turn on impact events for the world, without this we get no collision callbacks
        // this.game.physics.p2.setImpactEvents(true);

        this.game.physics.p2.restitution = 0;


        //  Create our collision groups.
        this.platformCollisionGroup = this.game.physics.p2.createCollisionGroup();
        this.monsterCollisionGroup = this.game.physics.p2.createCollisionGroup();


        //  This part is vital if you want the objects with their own collision groups to still collide with the world bounds
        //  (which we do) - what this does is adjust the bounds to use its own collision group.
        this.game.physics.p2.updateBoundsCollisionGroup();

        const background = this.game.add.image(this.game.world.centerX, this.game.world.centerY, Assets.Images.ImagesBgGame.getName());
        background.anchor.setTo(0.5);

        this.platforms = this.add.physicsGroup();
        this.platforms.physicsBodyType = Phaser.Physics.P2JS;

        const conveyorBelt = Assets.Images.ImagesConveybelt.getName();
        this.platforms.create(0, 750, conveyorBelt);
        this.platforms.create(600, 750, conveyorBelt);
        this.platforms.create(1200, 750, conveyorBelt);
        const sourceMachine = this.platforms.create(300, 678, Assets.Images.ImagesSourcemachine.getName());
        const tasteMachine = this.platforms.create(900, 678, Assets.Images.ImagesTastemachine.getName());

        this.game.physics.p2.enable(this.platforms, true);
        // this.game.physics.enable(this.platforms, Phaser.Physics.P2JS);

        // this.platforms.setAll('body.static', true);
        // this.platforms.setAll('body.offset', new Phaser.Point(30, 30));

        sourceMachine.body.clearShapes();
        sourceMachine.body.loadPolygon(Assets.JSON.JsonSourcemachine.getName(), Assets.Images.ImagesSourcemachine.getName());

        const tasteMachineBody: Phaser.Physics.P2.Body = tasteMachine.body;
        tasteMachineBody.setRectangle(270, 60, 0, -110);

        this.platforms.forEach((sprite: Phaser.Sprite) => {
            const body: Phaser.Physics.P2.Body = sprite.body;

            body.setCollisionGroup(this.platformCollisionGroup);
            body.collides(this.monsterCollisionGroup);
            body.static = true;
            body.debug = true;
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

        this.game.physics.p2.enable(monster, true);
        const body: Phaser.Physics.P2.Body = monster.body;
        body.fixedRotation = true;
        body.setCircle(35);
        body.debug = false;
        body.motionState = Phaser.Physics.P2.Body.DYNAMIC;
        body.collides(this.platformCollisionGroup, this.monsterDropped, {});
        body.setCollisionGroup(this.monsterCollisionGroup);
    }

    private monsterDropped(aObject1: any, aObject2: any, context: any) {
        console.log(context);
        // explode dron and remove missile - kill it, not destroy
        (<Phaser.Sprite>aObject1.sprite).body.velocity.x = 20;
        const b: Phaser.Physics.P2.Body = (<Phaser.Sprite>aObject1.sprite).body;
        // (<Phaser.Sprite> aObject2.sprite);
    }

    public update() {
        // this.game.physics.arcade.collide(this.monsters, this.platforms);
    }
}