import * as Assets from '../assets';
import * as platforms from '../components/platforms';
import { Monster, Spraycan, Machine, Receiver, MachineSize, IceCream, IceCreamType, Vanilla, Chocolate, Strawberry, Egg, Milk, Suggar, Ingredient } from '../components/elements';
import { Physics } from 'phaser-ce';
import { fruttifrisco } from '../interfaces';

export default class Title extends Phaser.State {
    private backgrounds: Phaser.Group;
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
    private monsterTimer: Phaser.TimerEvent;

    private timer: Phaser.Timer;

    private score: Phaser.Group;
    private scoreVanilla: Phaser.Text;
    private scoreChocolate: Phaser.Text;
    private scoreStrawberry: Phaser.Text;

    private producedProducts: IceCream[];
    private lives = 5;
    private liveCount: Phaser.Text;

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
        this.game.physics.p2.updateBoundsCollisionGroup();

        // DO NOT ADD ANYTHING TO THE GAME BEFORE THIS LINE
        // ELSE IT WILL BE HIDDEN BEHIND THE BACKGROUND IMAGE
        // const background = this.game.add.image(this.game.world.centerX, this.game.world.centerY, Assets.Images.ImagesProductionBgInclPlatforms.getName());
        // background.anchor.setTo(0.5);
        this.game.stage.backgroundColor = '#808080';

        this.backgrounds = this.game.add.group();

        const headerbg = this.backgrounds.add(new Phaser.TileSprite(this.game, 0, 0, this.game.world.width, 223, Assets.Images.ImagesBgHeader.getName()));

        this.liveCount = this.game.add.existing(new Phaser.Text(this.game, 20, 0, this.lives.toString(), { fontSize: 60, fill: '#F00' }));

        this.score = this.game.add.group();
        this.scoreVanilla = this.score.add(new Phaser.Text(this.game, this.game.world.width - 115, 240, '0 x', { fontSize: 30, fill: '#000' }));
        const vanilla = this.score.add(new Phaser.Sprite(this.game, this.game.world.width - 60, 223, Assets.Spritesheets.SpritesheetsIcecreamsFinished1562583.getName(), 0));
        vanilla.scale.setTo(0.3);

        this.scoreStrawberry = this.score.add(new Phaser.Text(this.game, this.game.world.width - 115, 340, '0 x', { fontSize: 30, fill: '#000' }));
        const strawberry = this.score.add(new Phaser.Sprite(this.game, this.game.world.width - 60, 323, Assets.Spritesheets.SpritesheetsIcecreamsFinished1562583.getName(), 1));
        strawberry.scale.setTo(0.3);

        this.scoreChocolate = this.score.add(new Phaser.Text(this.game, this.game.world.width - 115, 440, '0 x', { fontSize: 30, fill: '#000' }));
        const chocolate = this.score.add(new Phaser.Sprite(this.game, this.game.world.width - 60, 423, Assets.Spritesheets.SpritesheetsIcecreamsFinished1562583.getName(), 2));
        chocolate.scale.setTo(0.3);

        const ground = new platforms.Ground(this.game, this.game.world.height - 172);
        ground.body.setCollisionGroup(this.platformCollisionGroup);
        ground.body.collides([this.monsterCollisionGroup]);

        this.icecreams = this.game.add.physicsGroup();
        this.icecreams.physicsBodyType = Phaser.Physics.P2JS;
        this.monsters = this.game.add.physicsGroup();
        this.monsters.physicsBodyType = Phaser.Physics.P2JS;
        this.machines = this.game.add.group();

        this.spraycan = this.game.add.existing(new Spraycan(this.game, this.game.world.centerX - 90, 20));
        this.spraycan.events.onInputDown.add(this.grabSpraycan, this);

        this.createMachines();
        this.createStorage();

        this.startMakeIcecream();
        this.startDropMonsters();

        this.producedProducts = new Array();
    }

    private createMachines() {
        const sourceMachine: Machine = this.machines.add(new Machine(this.game, 150, this.game.world.height - 300, MachineSize.large, [fruttifrisco.IngredientName.Egg, fruttifrisco.IngredientName.Milk, fruttifrisco.IngredientName.Suggar], this.backgrounds));
        sourceMachine.platform.body.setCollisionGroup(this.platformCollisionGroup);
        sourceMachine.platform.body.collides([this.monsterCollisionGroup, this.icecreamCollisionGroup]);
        sourceMachine.scanner.body.setCollisionGroup(this.platformCollisionGroup);
        sourceMachine.scanner.body.collides(this.icecreamCollisionGroup);

        const tasteMachine: Machine = this.machines.add(new Machine(this.game, this.game.world.width - 450, this.game.world.height - 300, MachineSize.small, [fruttifrisco.IngredientName.Chocolate, fruttifrisco.IngredientName.Vanilla, fruttifrisco.IngredientName.Strawberry], this.backgrounds));
        tasteMachine.platform.body.setCollisionGroup(this.platformCollisionGroup);
        tasteMachine.platform.body.collides(this.monsterCollisionGroup);
        tasteMachine.scanner.body.setCollisionGroup(this.platformCollisionGroup);
        tasteMachine.scanner.body.collides(this.icecreamCollisionGroup);
    }

    private createStorage() {
        // add two storage boxes on background
        const storage1 = this.backgrounds.add(new Phaser.Sprite(this.game, this.game.world.centerX - 600, 0, Assets.Images.ImagesStorage.getName()));
        const storage2 = this.backgrounds.add(new Phaser.Sprite(this.game, this.game.world.width - 270, 0, Assets.Images.ImagesStorage.getName()));
        storage2.scale.x *= -1;

        const ingredients = [
            new Egg(this.game, storage1.centerX - 200, 10),
            new Milk(this.game, storage1.centerX - 95, 10),
            new Suggar(this.game, storage1.centerX + 28, 10),
            new Strawberry(this.game, storage2.centerX - 200, 10),
            new Chocolate(this.game, storage2.centerX - 95, 10),
            new Vanilla(this.game, storage2.centerX + 28, 10)
        ];

        ingredients.forEach(ingredient => {
            ingredient.events.onDragStart.add((ingredient: Ingredient, pointer: Phaser.Pointer) => { (<number>ingredient.frame) -= 6; });
            ingredient.events.onDragStop.add((ingredient: Ingredient, pointer: Phaser.Pointer) => this.ingredientDropped(ingredient, pointer));
            this.game.world.add(ingredient);
        });
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

    private updateScores() {
        this.scoreVanilla.text = this.producedProducts.filter(p => p.name === IceCreamType[IceCreamType.Vanilla]).length.toString() + 'x';
        this.scoreChocolate.text = this.producedProducts.filter(p => p.name === IceCreamType[IceCreamType.Chocolate]).length.toString() + 'x';
        this.scoreStrawberry.text = this.producedProducts.filter(p => p.name === IceCreamType[IceCreamType.Strawberry]).length.toString() + 'x';
    }

    private startMakeIcecream() {
        this.makeIceCream();
        this.icecreamTimer = this.timer.loop(20000, this.makeIceCream, this);
    }

    private icecreamCreated(icecream: IceCream) {
        if (icecream.isFailed)
            return;
        else {
            this.producedProducts.push(icecream);
            this.updateScores();
        }
    }

    private makeIceCream() {
        const icecream: IceCream = this.icecreams.add(new IceCream(this.game, 0, this.game.world.height - 190));
        icecream.ingredients = this.getIngredientsForProduct(icecream.name);
        icecream.body.moveRight(100);
        icecream.body.setCollisionGroup(this.icecreamCollisionGroup);
        icecream.body.onBeginContact.add((bodyA: Physics.P2.Body, bodyB: any, shapeA, shapeB, equation) => this.iceCreamHit(bodyA, bodyB, shapeA, shapeB, equation));
        icecream.checkWorldBounds = true;
        icecream.events.onOutOfBounds.add((ice) => this.icecreamCreated(ice));
        icecream.body.collides([this.platformCollisionGroup, this.monsterCollisionGroup]);
    }

    private startDropMonsters() {
        this.monsterTimer = this.game.time.events.loop(5000, this.dropMonster, this);
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
        if (!bodyA)
            return;
        if (bodyA.sprite instanceof Monster) {
            const ice = (<IceCream>shapeA.body.parent.sprite);
            if (ice.isFailed)
                return;

            ice.failed();
            this.lives--;
            this.liveCount.text = this.lives.toString();
            if (this.lives === 0)
                this.gameOver();
        }
        else if (bodyA.sprite.parent instanceof Machine)
            (<Machine>bodyA.sprite.parent).scanProduct(<IceCream>shapeA.body.parent.sprite);

        equation.enabled = false;
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

    private gameOver() {
        const text = this.game.add.text(this.game.world.centerX, this.game.world.centerY, 'GAME OVER', { fontSize: 60, fill: '#000' });
        text.anchor.setTo(0.5);
        this.monsters.destroy();
        this.icecreams.destroy();
        this.icecreamTimer.timer.destroy();
        this.monsterTimer.timer.destroy();
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
                this.spraycan.reset(this.game.world.centerX - 80, 20);
                this.monsters.setAllChildren('input.enabled', false);
                this.spraycanActive = false;
            }
        }
    }
}