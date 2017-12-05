import * as Assets from '../assets';
import * as Platforms from '../components/platforms';
import { Monster, Spraycan } from '../components/elements';
import { Physics } from 'phaser-ce';

export default class Title extends Phaser.State {

    private monsters: Phaser.Group;
    private frontPlatforms: Phaser.Group;
    private spraycanActive = false;
    private spraycan: Phaser.Sprite;

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

        this.game.physics.p2.restitution = 0.1;
        this.game.physics.p2.friction = 0;

        //  Create our collision groups.
        this.platformCollisionGroup = this.game.physics.p2.createCollisionGroup();
        this.monsterCollisionGroup = this.game.physics.p2.createCollisionGroup();

        //  This part is vital if you want the objects with their own collision groups to still collide with the world bounds
        //  (which we do) - what this does is adjust the bounds to use its own collision group.
        this.game.physics.p2.updateBoundsCollisionGroup();

        this.monsterMaterial = new Physics.P2.Material('monsterMaterial');

        // DO NOT ADD ANYTHING TO THE GAME BEFORE THIS LINE
        // ELSE IT WILL BE HIDDEN BEHIND THE BACKGROUND IMAGE
        const background = this.game.add.image(this.game.world.centerX, this.game.world.centerY, Assets.Images.ImagesProductionBgInclPlatforms.getName());
        background.anchor.setTo(0.5);

        // the monsters group must be added to the game before the FRONT panels
        // so the monster will appear behind the front panels!
        this.monsters = this.game.add.physicsGroup();
        this.monsters.physicsBodyType = Phaser.Physics.P2JS;

        this.frontPlatforms = this.game.add.group();

        this.spraycan = new Spraycan(this.game, 480, 20);
        this.spraycan.events.onInputDown.add(this.grabSpraycan, this);

        const ground = new Platforms.Ground(this.game, 800);
        ground.body.setCollisionGroup(this.platformCollisionGroup);
        ground.body.collides(this.monsterCollisionGroup);

        const sourceMachine = new Platforms.SourceMachine(this.game, 57, 543, this.frontPlatforms);
        const tasteMachine = new Platforms.TasteMachine(this.game, 781, 543, this.frontPlatforms);

        [tasteMachine, sourceMachine].forEach((machine: Platforms.Machine) => {
            machine.setContactMaterialWith(this.monsterMaterial);
            machine.body.setCollisionGroup(this.platformCollisionGroup);
            machine.body.collides(this.monsterCollisionGroup);
            machine.inputEnabled = true;
            // set priorityId higher than the monster so you can't click monsters when they are 'inside' a machine
            machine.input.priorityID = 3;
        }, this);

        this.startDropMonsters();
    }

    private startDropMonsters() {
        this.game.time.events.loop(1500, this.dropMonster, this);
    }

    private grabSpraycan() {
        this.spraycanActive = true;
    }

    private bgClicked() {
        if (this.spraycanActive) {
            this.spraycan.animations.play('spray');
        }
    }

    private dropMonster() {
        const monster = new Monster(this.game, this.monsters);
        monster.inputEnabled = true;
        monster.input.priorityID = 2;
        monster.events.onInputDown.add(this.monsterClicked, this);
        monster.body.setCollisionGroup(this.monsterCollisionGroup);
        monster.body.collides([this.platformCollisionGroup, this.monsterCollisionGroup], this.monsterDropped, this);
    }

    private monsterClicked(sprite, pointer) {
        if (this.spraycanActive)
            sprite.kill();
    }

    private monsterDropped(monster: Physics.P2.Body, aObject2: Physics.P2.Body, context: any) {
        // only set speed if it has no speed yet (caused by earlier collision)
        let moveLeft = false;
        if (monster.velocity.x < 0)
            moveLeft = true;
        else if (monster.velocity.x > 0)
            moveLeft = false;
        else
            moveLeft = Math.random() >= 0.5;

        if (moveLeft) {
            monster.moveLeft(100);
        }
        else {
            monster.moveRight(200);
        }
    }

    private killSprayCloud(cloud: Phaser.Sprite) {
        cloud.kill();
    }

    public update() {
        if (this.spraycanActive) {
            this.game.canvas.style.cursor = 'none';
            this.spraycan.x = this.game.input.mousePointer.x - Assets.Spritesheets.SpritesheetsSpraycan12227512.getFrameWidth() / 4;
            this.spraycan.y = this.game.input.mousePointer.y - 20;

            if (this.game.input.activePointer.leftButton.isDown) {
                // use offset of half frame width to set cursor at middle of frame
                // WARNING: spraycan is scaled at 0.5 so framewidth must be scaled first too (0.5*0.5 = 0.25)

                this.spraycan.frame = 1;
                const sprayCloud = this.game.add.sprite(this.spraycan.x + 10, this.spraycan.y - 120, Assets.Spritesheets.SpritesheetsSpraycloud4583386.getName());
                sprayCloud.scale.setTo(0.4);
                const sprayAnimation = sprayCloud.animations.add('clouds', null, 9, false);
                sprayAnimation.play();

                const signal = new Phaser.Signal();
                signal.addOnce(() => this.killSprayCloud(sprayCloud));

                sprayAnimation.onComplete = signal;
            }
            else
                this.spraycan.frame = 0;

            if (this.game.input.activePointer.rightButton.isDown) {
                this.spraycan.reset(480, 20);
                this.spraycanActive = false;
            }
        }
    }
}