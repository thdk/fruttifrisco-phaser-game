import * as Assets from '../assets';
import * as Platforms from '../components/platforms';
import { Physics } from 'phaser-ce';

export default class Title extends Phaser.State {
    private monsters: Phaser.Group;

    private platformCollisionGroup: Phaser.Physics.P2.CollisionGroup;
    private monsterCollisionGroup: Phaser.Physics.P2.CollisionGroup;
    private monsterMaterial: Physics.P2.Material;
    private machineMaterial: Physics.P2.Material;
    private conveyorBeltMaterial: Physics.P2.Material;

    public create(): void {
        this.game.physics.startSystem(Phaser.Physics.P2JS);
        this.game.physics.p2.setImpactEvents(true);
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

        const background = this.game.add.image(this.game.world.centerX, this.game.world.centerY, Assets.Images.ImagesBgGame.getName());
        background.anchor.setTo(0.5);

        const beltsCoos: number[][] = [[0, 750], [600, 750], [1200, 750]];
        beltsCoos.forEach((coor: number[]) => {
            const belt = new Platforms.ConveyerBelt(this.game, coor[0], coor[1]);
            belt.setContactMaterialWith(this.monsterMaterial);
            belt.setCollisionGroup(this.platformCollisionGroup);
            belt.collides(this.monsterCollisionGroup);
        });

        const sourceMachine = new Platforms.SourceMachine(this.game, 300, 678);
        const tasteMachine = new Platforms.TasteMachine(this.game, 900, 678);

        // this.game.physics.p2.enable(this.platforms, true);

        [tasteMachine, sourceMachine].forEach((machine: Platforms.Machine) => {
            machine.setContactMaterialWith(this.monsterMaterial);
            machine.setCollisionGroup(this.platformCollisionGroup);
            machine.collides(this.monsterCollisionGroup);
        }, this);

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
        body.debug = true;
        body.motionState = Phaser.Physics.P2.Body.DYNAMIC;
        body.setCollisionGroup(this.monsterCollisionGroup);
        body.collides([this.platformCollisionGroup, this.monsterCollisionGroup], this.monsterDropped, this);
    }

    private monsterDropped(aObject1: any, aObject2: any, context: any) {
        // explode dron and remove missile - kill it, not destroy
        const random_boolean = Math.random() >= 0.5;
        const body: Phaser.Physics.P2.Body = (<Phaser.Sprite>aObject1.sprite).body;       

        if (random_boolean) {
            body.moveLeft(100);
        }
        else {
            body.moveRight(100);
        }

        const b: Phaser.Physics.P2.Body = (<Phaser.Sprite>aObject1.sprite).body;
        // (<Phaser.Sprite> aObject2.sprite);
    }
}