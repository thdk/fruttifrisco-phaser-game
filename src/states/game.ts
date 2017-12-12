import * as Assets from '../assets';
import * as platforms from '../components/platforms';
import { Monster, Spraycan, Machine, Receiver, MachineSize, IceCream, IceCreamType, Vanilla, Chocolate, Strawberry, Egg, Milk, Suggar, Ingredient } from '../components/elements';
import { Physics } from 'phaser-ce';
import { fruttifrisco } from '../interfaces';

export default class Title extends Phaser.State {
    private icecreams: Phaser.Group;
    private monsters: Phaser.Group;
    private machines: Phaser.Group;
    private spraycanActive = false;
    private spraycan: Phaser.Sprite;

    private platformCollisionGroup: Phaser.Physics.P2.CollisionGroup;
    private monsterCollisionGroup: Phaser.Physics.P2.CollisionGroup;
    private icecreamCollisionGroup: Phaser.Physics.P2.CollisionGroup;
    private scannerCollisionGroup: Phaser.Physics.P2.CollisionGroup;
    private monsterMaterial: Physics.P2.Material;
    private machineMaterial: Physics.P2.Material;
    private conveyorBeltMaterial: Physics.P2.Material;

    private productList: fruttifrisco.IProduct[];

    public create(): void {
        this.productList = new Array();
        const vanilleIngredients: fruttifrisco.IproductIngredient[] = [{ code: 'egg', quantity: 1 }, { code: 'milk', quantity: 1 }, { code: 'suggar', quantity: 1 }, { code: 'vanilla', quantity: 1 }];
        this.productList.push({ code: 'Vanille', ingredients: vanilleIngredients });
        const chocolateIngredients: fruttifrisco.IproductIngredient[] = [{ code: 'egg', quantity: 1 }, { code: 'milk', quantity: 1 }, { code: 'suggar', quantity: 1 }, { code: 'chocolate', quantity: 1 }];
        this.productList.push({ code: 'Chocolate', ingredients: chocolateIngredients });
        const strawberryIngredients: fruttifrisco.IproductIngredient[] = [{ code: 'egg', quantity: 1 }, { code: 'milk', quantity: 1 }, { code: 'suggar', quantity: 1 }, { code: 'strawberry', quantity: 1 }];
        this.productList.push({ code: 'Strawberry', ingredients: strawberryIngredients });

        this.game.physics.startSystem(Phaser.Physics.P2JS);
        this.game.physics.p2.setImpactEvents(true);
        this.game.physics.p2.gravity.y = 1000;
        //  Turn on impact events for the world, without this we get no collision callbacks
        // this.game.physics.p2.setImpactEvents(true);

        this.game.physics.p2.restitution = 0.5;
        this.game.physics.p2.friction = 0;

        //  Create our collision groups.
        this.platformCollisionGroup = this.game.physics.p2.createCollisionGroup();
        this.monsterCollisionGroup = this.game.physics.p2.createCollisionGroup();
        this.icecreamCollisionGroup = this.game.physics.p2.createCollisionGroup();
        this.scannerCollisionGroup = this.game.physics.p2.createCollisionGroup();

        //  This part is vital if you want the objects with their own collision groups to still collide with the world bounds
        //  (which we do) - what this does is adjust the bounds to use its own collision group.
        this.game.physics.p2.updateBoundsCollisionGroup();

        this.monsterMaterial = new Physics.P2.Material('monsterMaterial');

        // DO NOT ADD ANYTHING TO THE GAME BEFORE THIS LINE
        // ELSE IT WILL BE HIDDEN BEHIND THE BACKGROUND IMAGE
        const background = this.game.add.image(this.game.world.centerX, this.game.world.centerY, Assets.Images.ImagesProductionBgInclPlatforms.getName());
        background.anchor.setTo(0.5);

        this.icecreams = this.game.add.physicsGroup();
        this.icecreams.physicsBodyType = Phaser.Physics.P2JS;
        this.monsters = this.game.add.physicsGroup();
        this.monsters.physicsBodyType = Phaser.Physics.P2JS;
        this.machines = this.game.add.group();

        this.spraycan = this.game.add.existing(new Spraycan(this.game, 480, 20));
        this.spraycan.events.onInputDown.add(this.grabSpraycan, this);

        const ground = new platforms.Ground(this.game, 820);
        ground.body.setCollisionGroup(this.platformCollisionGroup);
        ground.body.collides([this.monsterCollisionGroup, this.icecreamCollisionGroup]);

        this.createMachines();
        this.startDropMonsters();
        this.startMakeIcecream();
        this.createStorage();
    }

    private createMachines() {
        const sourceMachine: Machine = this.machines.add(new Machine(this.game, 57, 543, MachineSize.large, ['egg', 'suggar', 'milk']));
        sourceMachine.platform.body.setCollisionGroup(this.platformCollisionGroup);
        sourceMachine.platform.body.collides([this.monsterCollisionGroup, this.icecreamCollisionGroup]);
        sourceMachine.scanner.body.setCollisionGroup(this.platformCollisionGroup);
        sourceMachine.scanner.body.collides(this.icecreamCollisionGroup, this.iceCreamArrived);
        sourceMachine.onProductFinished.add((product) => console.log(product));

        const tasteMachine: Machine = this.machines.add(new Machine(this.game, 781, 543, MachineSize.small, ['chocolate', 'vanilla', 'strawberry']));
        tasteMachine.platform.body.setCollisionGroup(this.platformCollisionGroup);
        tasteMachine.platform.body.collides(this.monsterCollisionGroup);
    }

    private createStorage() {
        const ingredients = [
            new Vanilla(this.game, 0, 0),
            new Chocolate(this.game, 200, 0),
            new Strawberry(this.game, 400, 0),
            new Egg(this.game, 600, 0),
            new Milk(this.game, 800, 0),
            new Suggar(this.game, 1000, 0)
        ];

        ingredients.forEach(ingredient => {
            ingredient.events.onDragStop.add((ingredient: Ingredient, pointer: Phaser.Pointer) => this.ingredientDropped(ingredient, pointer));
            this.game.world.add(ingredient);
        });
    }

    private ingredientDropped(ingredient: Ingredient, pointer: Phaser.Pointer) {
        this.machines.children.forEach((m: Machine) => {
            m.receivers.forEach((receiver: Receiver) => {
                if (receiver.getBounds().contains(pointer.position.x, pointer.position.y)) {
                    receiver.receive(ingredient);
                }
            });
        });
    }

    private iceCreamArrived(a, b) {
        const icecream: IceCream = b.sprite;
        const machine: Machine = a.sprite.parent;
        machine.scanProduct(icecream);
    }

    private getIngredientsForProduct(productcode: string): fruttifrisco.IproductIngredient[] {
        return this.productList.filter(p => p.code === productcode).map(p => p.ingredients)[0];
    }

    private startMakeIcecream() {
        const icecream: IceCream = this.icecreams.add(new IceCream(this.game, 0, 670, 0));
        icecream.ingredients = this.getIngredientsForProduct(icecream.code);
        icecream.body.moveRight(100);
        icecream.body.setCollisionGroup(this.icecreamCollisionGroup);
        icecream.body.collides([this.platformCollisionGroup, this.monsterCollisionGroup]);
    }

    private startDropMonsters() {
        this.game.time.events.loop(5000, this.dropMonster, this);
    }

    private grabSpraycan() {
        this.monsters.children.forEach((m: Monster) => m.input.enabled = true);
        this.spraycanActive = true;
    }

    private dropMonster() {
        const monster = this.monsters.add(new Monster(this.game));
        monster.body.setCollisionGroup(this.monsterCollisionGroup);
        monster.body.collides([this.platformCollisionGroup, this.monsterCollisionGroup, this.icecreamCollisionGroup], this.monsterDropped, this);
        monster.input.enabled = this.spraycanActive;
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
                this.monsters.setAllChildren('input.enabled', false);
                this.spraycanActive = false;
            }
        }
    }
}