import * as Assets from '../assets';
import { PhysicsP2Sprite, SimpleSprite, DraggableSprite } from '../base/extended';
import * as platforms from './platforms';
import { thdk } from '../base/framework';
import { fruttifrisco } from '../interfaces';
import { Group, Physics } from 'phaser-ce';

export enum MachineSize {
    small = 1,
    medium = 2,
    large = 3
}

export class Machine extends Group {
    private requiredIngredients: fruttifrisco.IngredientName[];
    private inputIngredients: fruttifrisco.IngredientName[];
    private product: IceCream;

    public platform: Phaser.Sprite;
    public scanner: PhysicsP2Sprite;
    public receivers: Receiver[];

    public onProductFinished: Phaser.Signal;

    constructor(game: Phaser.Game, x: number, y: number, size: MachineSize, ingredients: fruttifrisco.IngredientName[], backgroundGroup: Phaser.Group, name?: string, addToStage?: boolean, enableBody?: boolean, physicsBodyType?: number) {
        super(game, null, name, true, enableBody, physicsBodyType);
        this.inputIngredients = ingredients;
        this.onProductFinished = new Phaser.Signal();

        this.createPlatform(size, x, y, backgroundGroup);
        if (!this.platform)
            return;

        this.scanner = this.add(new PhysicsP2Sprite(game, this.platform.centerX, y + this.platform.height / 2, null, null, 1, new Phaser.Point(0.5, 1)));
        this.scanner.body.static = true;
        this.scanner.body.data.shapes[0].sensor = true;

        this.platform.inputEnabled = true;
        this.platform.input.priorityID = 3;

        this.add(this.platform);

        this.createReceivers(size);

        this.addMultiple(this.receivers);
    }

    public scanProduct(product: IceCream) {
        if (this.product) {
            this.product.failed();
            this.ejectProduct();
        }

        // avoid multiple asynchronous collide callbacks
        if (product.isScanned)
            return;

        // don't pickup failed products
        if (product.isFailed)
            return;

        product.isScanned = true;
        product.kill();
        this.requiredIngredients = new Array();
        this.requiredIngredients = this.requiredIngredients.concat(...product.ingredients.filter(i => this.inputIngredients.indexOf(i.code) !== -1).map(ingredient => {
            const ingredients: fruttifrisco.IngredientName[] = new Array();
            for (let i: number = 0; i < ingredient.quantity; i++) {
                ingredients.push(ingredient.code);
            }
            return ingredients;
        }));

        thdk.utils.shuffle(this.requiredIngredients);
        this.resetReceivers();
        this.assignReceivers();

        this.product = product;
    }

    private resetReceivers() {
        this.receivers.forEach(r => r.setIngredient(null));
    }

    private assignReceivers() {
        if (!this.receivers)
            return;

        this.receivers.filter(receiver => !receiver.isAssigned()).forEach(receiver => {
            receiver.setIngredient(this.requiredIngredients.pop());
        });
    }

    private createPlatform(size: MachineSize, x: number, y: number, backgroundGroup: Phaser.Group): void {
        switch (size) {
            case (MachineSize.small):
                // set background image
                backgroundGroup.add(new Phaser.Sprite(this.game, x - 23, y - 23, Assets.Images.ImagesTastemachine.getName()));
                this.platform = new platforms.TasteMachinePlatform(this.game, x, y);
                break;
            case (MachineSize.large):
                // set background image
                backgroundGroup.add(new Phaser.Sprite(this.game, x, y - 23, Assets.Images.ImagesSourcemachine.getName()));
                this.platform = new platforms.SourceMachinePlatform(this.game, x, y);
                break;
            default:
                this.platform = null;
                break;
        }
    }

    private createReceivers(size: MachineSize) {
        if (size === 1) {
            this.receivers = [new RedReceiver(this.game, this.platform.x + 75, this.platform.y + 0)];
        }
        else {
            this.receivers = [
                new GreenReceiver(this.game, this.platform.x + 40, this.platform.y + 0),
                new GreenReceiver(this.game, this.platform.x + 160, this.platform.y + 0),
                new GreenReceiver(this.game, this.platform.x + 280, this.platform.y + 0)
            ];
        }

        this.receivers.forEach(receiver =>
            receiver.onReceive.add((_, ingredient: Ingredient, correct: boolean) => this.receiveIngredient(ingredient, correct))
        );
    }

    private receiveIngredient(ingredient: Ingredient, correct: boolean) {
        if (!correct) {
            this.product.failed();
            this.ejectProduct();
            this.resetReceivers();
            return;
        }
        else {
            this.product.addIngredient(ingredient);
        }

        // was this the last ingredient?
        if (!this.receivers.filter(r => r.isAssigned()).length) {
            this.ejectProduct();
        }
        this.assignReceivers();

    }

    private ejectProduct() {
        this.product.reset(this.scanner.centerX + this.product.width, this.game.world.height - 175);
        this.product.isScanned = false;
        this.product.body.moveRight(100);
        this.onProductFinished.dispatch(this, this.product);
        this.product = null;
    }
}

export enum IceCreamType {
    Vanilla = 0,
    Chocolate = 1,
    Strawberry = 2
}
export class IceCream extends PhysicsP2Sprite implements fruttifrisco.IProduct {
    public ingredients: fruttifrisco.IproductIngredient[];
    public isScanned = false;
    public isFailed = false;
    public onFailed: Phaser.Signal;
    constructor(game: Phaser.Game, x: number, y: number, frame = 5) {
        super(game, x, y, Assets.Spritesheets.SpritesheetsIcecreams1572066.getName(), frame, 0.5, 0.5);
        this.name = IceCreamType[this.getRandomTaste()];
        this.body.setZeroRotation();
        this.body.setZeroDamping();
        this.body.data.gravityScale = 0;
        this.body.data.shapes[0].sensor = true;
        this.onFailed = new Phaser.Signal();
    }

    private getRandomTaste(): IceCreamType {
        return Math.floor(Math.random() * Object.keys(IceCreamType).length / 2);
    }

    public failed() {
        this.isFailed = true;
        this.frame = 4;
        this.onFailed.dispatch(this);
    }

    public addIngredient(ingredient: Ingredient) {
        // reduce the counter for this ingredient
        this.ingredients.filter(i => i.code === ingredient.code)[0].quantity--;

        // check if we can update the sprite
        switch (ingredient.code) {
            case fruttifrisco.IngredientName.Chocolate:
                this.frame = 2;
                break;
            case fruttifrisco.IngredientName.Strawberry:
                this.frame = 1;
                break;
            case fruttifrisco.IngredientName.Vanilla:
                this.frame = 0;
                break;
            default:
                this.frame = 3;
                break;
        }
    }
}

export class Receiver extends Phaser.Group {
    public onReceive: Phaser.Signal;
    private ingredientCode?: fruttifrisco.IngredientName;
    public funnel: SimpleSprite;
    public display: SimpleSprite;
    constructor(game: Phaser.Game, x: number, y: number, frame?: string | number) {
        super(game);
        this.funnel = this.add(new SimpleSprite(game, x, y, Assets.Spritesheets.SpritesheetsReceivers3004208.getName(), frame, 0.3, new Phaser.Point(0, 1)));
        this.onReceive = new Phaser.Signal();
        this.display = new SimpleSprite(game, x - 25, y + 30, Assets.Spritesheets.SpritesheetsIngredients14813912.getName(), 5);
        this.display.visible = false;
        this.add(this.display);
    }

    public receive(ingredient: Ingredient) {
        this.funnel.animations.play('receive');

        const correct = this.ingredientCode === ingredient.code;
        if (correct)
            this.setIngredient(null);

        this.onReceive.dispatch(this, ingredient, correct);
    }

    public setIngredient(name?: fruttifrisco.IngredientName) {
        this.ingredientCode = name;
        this.display.frame = name;
        this.display.visible = name != null;
    }

    public isAssigned(): boolean {
        return !!this.ingredientCode;
    }
}

export class GreenReceiver extends Receiver {
    constructor(game: Phaser.Game, x: number, y: number) {
        super(game, x, y, 0);
        this.funnel.animations.add('receive', [1, 2, 3, 0], 8, false);
    }
}

export class RedReceiver extends Receiver {
    constructor(game: Phaser.Game, x: number, y: number) {
        super(game, x, y, 4);
        this.funnel.animations.add('receive', [4, 5, 6, 4], 8, false);
    }
}

export class Rain extends PhysicsP2Sprite {
    constructor(game: Phaser.Game, spritesheet: thdk.assets.ISpritesheet, frame?: any, scale: number = 1) {
        super(game, game.world.randomX, 0, Assets.Spritesheets.SpritesheetsMonster22530012.getName(), frame, scale);
    }
}

export class Monster extends Rain {
    public hit: Phaser.Signal;
    constructor(game: Phaser.Game) {
        super(game, Assets.Spritesheets.SpritesheetsMonster22530012, 10, 0.3);
        this.animations.add('live', null, 4, true).play();
        this.body.setZeroForce();
        this.body.fixedRotation = true;
        const circle = this.body.setCircle(30).material = new Phaser.Physics.P2.Material('monsterMaterial');
    }
}

export class Spraycan extends SimpleSprite {
    public isActive: boolean;
    public onActivate: Phaser.Signal;
    public onSpray: Phaser.Signal;
    private cloudCollisionGroup: Phaser.Physics.P2.CollisionGroup;
    constructor(game: Phaser.Game, x: number, y: number, cloudCollisionGroup: Phaser.Physics.P2.CollisionGroup, key?: string, frame?: string | number) {
        super(game, x, y, Assets.Spritesheets.SpritesheetsSpraycan12227512.getName(), frame);
        this.anchor.setTo(0);
        this.scale.setTo(0.5);
        this.inputEnabled = true;
        this.animations.add('spray', [2], 1, false);
        this.input.useHandCursor = true;

        this.onActivate = new Phaser.Signal();
        this.onSpray = new Phaser.Signal();

        this.events.onInputDown.add(() => this.activate(true));

        this.cloudCollisionGroup = cloudCollisionGroup;
    }

    public update() {
        if (this.isActive) {
            this.game.canvas.style.cursor = 'none';
            this.x = this.game.input.mousePointer.x - Assets.Spritesheets.SpritesheetsSpraycan12227512.getFrameWidth() / 4;
            this.y = this.game.input.mousePointer.y - 20;

            if (this.game.input.activePointer.leftButton.isDown) {
                this.frame = 1;
                const sprayCloud = this.game.add.existing(new Spraycloud(this.game, this.x + 30, this.y, this.cloudCollisionGroup));
                this.onSpray.dispatch(sprayCloud);
            }
            else
                this.frame = 0;

            if (this.game.input.activePointer.rightButton.isDown) {
                this.reset(this.game.world.centerX - 80, 20);
                this.activate(false);
            }
        }
    }

    private activate(active: boolean) {
        this.isActive = active;
        this.onActivate.dispatch(this.isActive);
    }
}

export class Spraycloud extends PhysicsP2Sprite {
    private animation: Phaser.Animation;
    private collisionGroup: Phaser.Physics.P2.CollisionGroup;
    constructor(game: Phaser.Game, x: number, y: number, collisionGroup: Phaser.Physics.P2.CollisionGroup, key?: string, frame?: string | number) {
        super(game, x, y, Assets.Spritesheets.SpritesheetsSpraycloud1831356.getName(), frame, 1, new Phaser.Point(0, 1));
        this.body.clearShapes();
        this.body.static = true;
        this.animation = this.animations.add('clouds', null, 9, false);
        this.animation.play();

        this.collisionGroup = collisionGroup;

        this.animation.onComplete.add((sprite, animation) => {
            this.destroy();
        });
    }

    public update() {
        // create a circle
        this.body.clearShapes();
        // clear all previous shapes
        // player.body.addShape(circleShape)
        // you can also add the circle at [10,15] from the center of the body
        switch (this.frame) {
            case 0:
                this.body.addCircle(20, 22, -17);
                break;
            case 1:
                this.body.addCircle(40, 80, -48);
                break;
            case 2:
                this.body.addCircle(60, 120, -80);
                break;
            case 3:
                this.body.addCircle(20, 80, -87);
                this.body.addCircle(20, 160, -100);
                this.body.addCircle(20, 124, -40);
                break;
            case 4:
                this.body.addCircle(20, 123, -75);
                break;
            case 5:
                this.body.addCircle(20, 123, -75);
                break;
            default:
                break;
        }

        if (this.body.data.shapes)
            this.body.data.shapes.map(s => s.sensor = true);

        this.body.setCollisionGroup(this.collisionGroup);
    }
}

export class Ingredient extends DraggableSprite {
    public code: fruttifrisco.IngredientName;
    constructor(game: Phaser.Game, x: number, y: number, frame: string | number, ingredient: fruttifrisco.IngredientName) {
        super(game, x, y, Assets.Spritesheets.SpritesheetsIngredients14813912.getName(), frame);
        this.code = ingredient;
    }
}

export class Egg extends Ingredient {
    constructor(game: Phaser.Game, x: number, y: number, key?: string, frame?: string | number) {
        super(game, x, y, 9, fruttifrisco.IngredientName.Egg);
    }
}

export class Suggar extends Ingredient {
    constructor(game: Phaser.Game, x: number, y: number, key?: string, frame?: string | number) {
        super(game, x, y, 11, fruttifrisco.IngredientName.Suggar);
    }
}

export class Milk extends Ingredient {
    constructor(game: Phaser.Game, x: number, y: number, key?: string, frame?: string | number) {
        super(game, x, y, 10, fruttifrisco.IngredientName.Milk);
    }
}

export class Vanilla extends Ingredient {
    constructor(game: Phaser.Game, x: number, y: number, key?: string, frame?: string | number) {
        super(game, x, y, 6, fruttifrisco.IngredientName.Vanilla);
    }
}

export class Chocolate extends Ingredient {
    constructor(game: Phaser.Game, x: number, y: number, key?: string, frame?: string | number) {
        super(game, x, y, 7, fruttifrisco.IngredientName.Chocolate);
    }
}

export class Strawberry extends Ingredient {
    constructor(game: Phaser.Game, x: number, y: number, key?: string, frame?: string | number) {
        super(game, x, y, 8, fruttifrisco.IngredientName.Strawberry);
    }
}

