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

    private productList: fruttifrisco.IProduct[];
    private icecreamTimer: Phaser.TimerEvent;

    private timer: Phaser.Timer;

    public create(): void {
        this.timer = this.game.time.events;

        this.productList = new Array();
        const vanilleIngredients: fruttifrisco.IproductIngredient[] = [{ code: fruttifrisco.IngredientName.Egg, quantity: 2 }, { code: fruttifrisco.IngredientName.Milk, quantity: 1 }, { code: fruttifrisco.IngredientName.Suggar, quantity: 1 }, { code: fruttifrisco.IngredientName.Vanilla, quantity: 1 }];
        this.productList.push({ name: 'Vanilla', ingredients: vanilleIngredients });
        const chocolateIngredients: fruttifrisco.IproductIngredient[] = [{ code: fruttifrisco.IngredientName.Egg, quantity: 3 }, { code: fruttifrisco.IngredientName.Milk, quantity: 1 }, { code: fruttifrisco.IngredientName.Suggar, quantity: 1 }, { code: fruttifrisco.IngredientName.Chocolate, quantity: 1 }];
        this.productList.push({ name: 'Chocolate', ingredients: chocolateIngredients });
        const strawberryIngredients: fruttifrisco.IproductIngredient[] = [{ code: fruttifrisco.IngredientName.Egg, quantity: 4 }, { code: fruttifrisco.IngredientName.Milk, quantity: 1 }, { code: fruttifrisco.IngredientName.Suggar, quantity: 1 }, { code: fruttifrisco.IngredientName.Strawberry, quantity: 1 }];
        this.productList.push({ name: 'Strawberry', ingredients: strawberryIngredients });

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
        // this.game.physics.p2.updateBoundsCollisionGroup();

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
        ground.body.collides([this.monsterCollisionGroup]);

        this.createMachines();
        this.startDropMonsters();
        this.startMakeIcecream();
        this.createStorage();
    }

    private createMachines() {
        const sourceMachine: Machine = this.machines.add(new Machine(this.game, 57, 543, MachineSize.large, [fruttifrisco.IngredientName.Egg, fruttifrisco.IngredientName.Milk, fruttifrisco.IngredientName.Suggar]));
        sourceMachine.platform.body.setCollisionGroup(this.platformCollisionGroup);
        sourceMachine.platform.body.collides([this.monsterCollisionGroup, this.icecreamCollisionGroup]);
        sourceMachine.scanner.body.setCollisionGroup(this.platformCollisionGroup);
        sourceMachine.scanner.body.collides(this.icecreamCollisionGroup);
        sourceMachine.onProductFinished.add(() => this.productFinished());

        const tasteMachine: Machine = this.machines.add(new Machine(this.game, 781, 543, MachineSize.small, [fruttifrisco.IngredientName.Chocolate, fruttifrisco.IngredientName.Vanilla, fruttifrisco.IngredientName.Strawberry]));
        tasteMachine.platform.body.setCollisionGroup(this.platformCollisionGroup);
        tasteMachine.platform.body.collides(this.monsterCollisionGroup);
        tasteMachine.scanner.body.setCollisionGroup(this.platformCollisionGroup);
        tasteMachine.scanner.body.collides(this.icecreamCollisionGroup);
    }

    private createStorage() {
        const ingredients = [
            new Egg(this.game, 20, 10),
            new Milk(this.game, 120, 10),
            new Suggar(this.game, 250, 10),
            new Strawberry(this.game, 600, 10),
            new Chocolate(this.game, 710, 10),
            new Vanilla(this.game, 840, 10)
        ];

        ingredients.forEach(ingredient => {
            ingredient.events.onDragStart.add((ingredient: Ingredient, pointer: Phaser.Pointer) => { (<number>ingredient.frame) -= 6; });
            ingredient.events.onDragStop.add((ingredient: Ingredient, pointer: Phaser.Pointer) => this.ingredientDropped(ingredient, pointer));
            this.game.world.add(ingredient);
        });
    }

    private productFinished() {
    }

    private ingredientDropped(ingredient: Ingredient, pointer: Phaser.Pointer) {
        // reset to original position + reset frame
        (<number>ingredient.frame) += 6;
        ingredient.x = ingredient.originalPosition.x;
        ingredient.y = ingredient.originalPosition.y;

        // check if ingredient is dropped on a receiver
        this.machines.children.forEach((m: Machine) => {
            m.receivers.forEach((receiver: Receiver) => {
                if (receiver.getBounds().contains(pointer.position.x, pointer.position.y)) {
                    receiver.receive(ingredient);
                }
            });
        });
    }

    private getIngredientsForProduct(productname: string): fruttifrisco.IproductIngredient[] {
        // return a cloned array with ingredients so it can be modfied by each instance without infecting the original source !!!
        return this.productList.filter(p => p.name === productname).map(p => p.ingredients)[0].map(x => Object.assign({}, x));
    }

    private startMakeIcecream() {
        this.makeIceCream();
        this.icecreamTimer = this.timer.loop(20000, this.makeIceCream, this);
    }

    private makeIceCream() {
        const icecream: IceCream = this.icecreams.add(new IceCream(this.game, 0, 670));
        icecream.ingredients = this.getIngredientsForProduct(icecream.name);
        icecream.body.moveRight(100);
        icecream.body.setCollisionGroup(this.icecreamCollisionGroup);
        icecream.body.onBeginContact.add(this.iceCreamHit);
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

    private iceCreamHit(bodyA: Physics.P2.Body, bodyB: any, shapeA, shapeB, equation) {
        if (bodyA.sprite instanceof Monster)
            (<IceCream>shapeA.body.parent.sprite).frame = 4;
        else if (bodyA.sprite.parent instanceof Machine)
            (<Machine>bodyA.sprite.parent).scanProduct(<IceCream>shapeA.body.parent.sprite);

        return false;
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