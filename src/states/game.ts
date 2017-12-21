import * as Assets from '../assets';
import * as platforms from '../components/platforms';
import { Monster, Spraycan, Spraycloud, Machine, Receiver, MachineSize, IceCream, IceCreamType, Vanilla, Chocolate, Strawberry, Egg, Milk, Suggar, Ingredient } from '../components/elements';
import { Physics } from 'phaser-ce';
import { fruttifrisco } from '../interfaces';

export default class Title extends Phaser.State {
    private backgrounds: Phaser.Group;
    private icecreams: Phaser.Group;
    private monsters: Phaser.Group;
    private machines: Phaser.Group;
    private spraycan: Spraycan;

    private platformCollisionGroup: Phaser.Physics.P2.CollisionGroup;
    private monsterCollisionGroup: Phaser.Physics.P2.CollisionGroup;
    private icecreamCollisionGroup: Phaser.Physics.P2.CollisionGroup;
    private cloudCollisionGroup: Phaser.Physics.P2.CollisionGroup;

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

        // create a dummy reference ingredient list for each product
        // TODO: replace the data below with data from XML / JSON file
        this.productList = new Array();
        const vanilleIngredients: fruttifrisco.IproductIngredient[] = [{ code: fruttifrisco.IngredientName.Egg, quantity: 2 }, { code: fruttifrisco.IngredientName.Milk, quantity: 1 }, { code: fruttifrisco.IngredientName.Suggar, quantity: 1 }, { code: fruttifrisco.IngredientName.Vanilla, quantity: 1 }];
        this.productList.push({ name: 'Vanilla', ingredients: vanilleIngredients });
        const chocolateIngredients: fruttifrisco.IproductIngredient[] = [{ code: fruttifrisco.IngredientName.Egg, quantity: 3 }, { code: fruttifrisco.IngredientName.Milk, quantity: 1 }, { code: fruttifrisco.IngredientName.Suggar, quantity: 1 }, { code: fruttifrisco.IngredientName.Chocolate, quantity: 1 }];
        this.productList.push({ name: 'Chocolate', ingredients: chocolateIngredients });
        const strawberryIngredients: fruttifrisco.IproductIngredient[] = [{ code: fruttifrisco.IngredientName.Egg, quantity: 1 }, { code: fruttifrisco.IngredientName.Milk, quantity: 1 }, { code: fruttifrisco.IngredientName.Suggar, quantity: 1 }, { code: fruttifrisco.IngredientName.Strawberry, quantity: 1 }];
        this.productList.push({ name: 'Strawberry', ingredients: strawberryIngredients });

        this.game.physics.startSystem(Phaser.Physics.P2JS);

        this.game.physics.p2.gravity.y = 1000;
        this.game.physics.p2.restitution = 0.3;
        this.game.physics.p2.friction = 0;

        //  Turn on impact events for the world, without this we get no collision callbacks
        this.game.physics.p2.setImpactEvents(true);

        //  allow objects with their own collision groups to still collide with the world bounds
        this.game.physics.p2.updateBoundsCollisionGroup();

        //  Create our collision groups.
        this.platformCollisionGroup = this.game.physics.p2.createCollisionGroup();
        this.monsterCollisionGroup = this.game.physics.p2.createCollisionGroup();
        this.icecreamCollisionGroup = this.game.physics.p2.createCollisionGroup();
        this.cloudCollisionGroup = this.game.physics.p2.createCollisionGroup();

        this.game.stage.backgroundColor = '#808080';

        // create groups to represent the layers of the game
        this.backgrounds = this.game.add.group();
        this.score = this.game.add.group();
        this.icecreams = this.game.add.physicsGroup();
        this.monsters = this.game.add.physicsGroup();
        this.machines = this.game.add.group();

        const headerbg = this.backgrounds.add(new Phaser.TileSprite(this.game, 0, 0, this.game.world.width, 223, Assets.Images.ImagesBgHeader.getName()));
        const beltbg = this.backgrounds.add(new Phaser.TileSprite(this.game, 0, this.game.world.height - 155, this.game.width, 69, Assets.Images.ImagesBgFloor.getName()));

        // add a (invisible) bound at the bottom of the world
        const ground = this.backgrounds.add(new platforms.Ground(this.game, this.game.world.height - 180));
        ground.body.setCollisionGroup(this.platformCollisionGroup);
        ground.body.collides(this.monsterCollisionGroup);

        this.createSpraycan();
        this.createScoreBoard();

        this.createMachines();
        this.createStorage();

        this.startGame();
    }

    private startGame() {
        this.producedProducts = new Array();
        this.startMakeIcecream();
        this.startDropMonsters();
    }

    private createSpraycan() {
        this.spraycan = this.game.add.existing(new Spraycan(this.game, this.game.world.centerX - 90, 20, this.cloudCollisionGroup));
        this.spraycan.onActivate.add((active: boolean) => {
            // enable click on each monster inside the monster group
            this.monsters.children.forEach((m: Monster) => m.input.enabled = active);
        });

        this.spraycan.onSpray.add(cloud => {
            cloud.body.onBeginContact.add((bodyA: Physics.P2.Body, bodyB: any, shapeA, shapeB, equation) => this.cloudHit(bodyA, bodyB, shapeA, shapeB, equation));
            cloud.body.setCollisionGroup(this.cloudCollisionGroup);
            cloud.body.collides(this.monsterCollisionGroup);
        });
    }

    private createScoreBoard() {
        this.liveCount = this.game.add.existing(new Phaser.Text(this.game, 20, 0, this.lives.toString(), { fontSize: 60, fill: '#F00' }));

        this.scoreVanilla = this.score.add(new Phaser.Text(this.game, this.game.world.width - 115, 240, '0 x', { fontSize: 30, fill: '#000' }));
        const vanilla = this.score.add(new Phaser.Sprite(this.game, this.game.world.width - 60, 223, Assets.Spritesheets.SpritesheetsIcecreamsFinished1562583.getName(), 0));
        vanilla.scale.setTo(0.3);

        this.scoreStrawberry = this.score.add(new Phaser.Text(this.game, this.game.world.width - 115, 340, '0 x', { fontSize: 30, fill: '#000' }));
        const strawberry = this.score.add(new Phaser.Sprite(this.game, this.game.world.width - 60, 323, Assets.Spritesheets.SpritesheetsIcecreamsFinished1562583.getName(), 1));
        strawberry.scale.setTo(0.3);

        this.scoreChocolate = this.score.add(new Phaser.Text(this.game, this.game.world.width - 115, 440, '0 x', { fontSize: 30, fill: '#000' }));
        const chocolate = this.score.add(new Phaser.Sprite(this.game, this.game.world.width - 60, 423, Assets.Spritesheets.SpritesheetsIcecreamsFinished1562583.getName(), 2));
        chocolate.scale.setTo(0.3);
    }

    private createMachines() {
        [
            this.machines.add(new Machine(this.game, 150, this.game.world.height - 300, MachineSize.large, [fruttifrisco.IngredientName.Egg, fruttifrisco.IngredientName.Milk, fruttifrisco.IngredientName.Suggar], this.backgrounds)),
            this.machines.add(new Machine(this.game, this.game.world.width - 450, this.game.world.height - 300, MachineSize.small, [fruttifrisco.IngredientName.Chocolate, fruttifrisco.IngredientName.Vanilla, fruttifrisco.IngredientName.Strawberry], this.backgrounds))
        ].map(m => {
            m.platform.body.setCollisionGroup(this.platformCollisionGroup);
            m.platform.body.collides(this.monsterCollisionGroup);
            m.scanner.body.setCollisionGroup(this.platformCollisionGroup);
            m.scanner.body.collides(this.icecreamCollisionGroup);
        });
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
                if (receiver.funnel.getBounds().contains(pointer.position.x, pointer.position.y)) {
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
        const icecream: IceCream = this.icecreams.add(new IceCream(this.game, 0, this.game.world.height - 175));
        icecream.ingredients = this.getIngredientsForProduct(icecream.name);
        icecream.body.moveRight(100);
        icecream.body.setCollisionGroup(this.icecreamCollisionGroup);
        icecream.checkWorldBounds = true;
        icecream.body.onBeginContact.add((bodyA: Physics.P2.Body, bodyB: any, shapeA, shapeB, equation) => this.iceCreamHit(bodyA, bodyB, shapeA, shapeB, equation));
        icecream.events.onOutOfBounds.add((ice) => this.icecreamCreated(ice));
        icecream.onFailed.add((ice) => this.lostLive());
        icecream.body.collides([this.platformCollisionGroup, this.monsterCollisionGroup]);
    }

    private startDropMonsters() {
        this.monsterTimer = this.game.time.events.loop(5000, this.dropMonster, this);
    }

    private dropMonster() {
        const monster = this.monsters.add(new Monster(this.game));
        monster.body.setCollisionGroup(this.monsterCollisionGroup);
        monster.body.collides([this.platformCollisionGroup, this.monsterCollisionGroup, this.icecreamCollisionGroup, this.cloudCollisionGroup], this.monsterDropped, this);
        monster.inputEnabled = true;
        monster.input.enabled = this.spraycan.isActive;
        monster.input.priorityID = 2;
        monster.events.onInputDown.add(m => m.kill());
    }

    private cloudHit(bodyA: Physics.P2.Body, bodyB: any, shapeA, shapeB, equation) {
        if (!bodyA)
        return;

        const monster = (<Monster>bodyA.sprite);
        monster.kill();
    }

    private iceCreamHit(bodyA: Physics.P2.Body, bodyB: any, shapeA, shapeB, equation) {
        if (!bodyA)
            return;
        if (bodyA.sprite instanceof Monster) {
            const ice = (<IceCream>shapeA.body.parent.sprite);
            if (ice.isFailed)
                return;

            ice.failed();
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

    private lostLive() {
        this.lives--;
        this.liveCount.text = this.lives.toString();
        if (this.lives === 0)
            this.gameOver();
    }

    private gameOver() {
        const text = this.game.add.text(this.game.world.centerX, this.game.world.centerY, 'GAME OVER', { fontSize: 60, fill: '#000' });
        text.anchor.setTo(0.5);
        this.monsters.destroy();
        this.icecreams.destroy();
        this.icecreamTimer.timer.destroy();
        this.monsterTimer.timer.destroy();
    }
}