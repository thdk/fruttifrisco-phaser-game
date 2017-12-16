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
    private icecream: IceCream;

    public platform: Phaser.Sprite;
    public scanner: PhysicsP2Sprite;
    public receivers: Receiver[];

    public onProductFinished: Phaser.Signal;

    constructor(game: Phaser.Game, x: number, y: number, size: MachineSize, ingredients: fruttifrisco.IngredientName[], name?: string, addToStage?: boolean, enableBody?: boolean, physicsBodyType?: number) {
        super(game, null, name, true, enableBody, physicsBodyType);
        this.inputIngredients = ingredients;
        this.onProductFinished = new Phaser.Signal();

        this.createPlatform(size, x, y);
        if (!this.platform)
            return;

        this.scanner = this.add(new PhysicsP2Sprite(game, this.platform.centerX, y + this.platform.height / 2, null, null, 1, new Phaser.Point(0.5, 1)));
        this.scanner.body.setRectangle(1, 1);
        this.scanner.body.static = true;
        this.scanner.body.data.shapes[0].sensor = true;

        this.platform.inputEnabled = true;
        this.platform.input.priorityID = 3;

        this.add(this.platform);

        this.createReceivers(size);

        this.addMultiple(this.receivers);
    }

    public scanProduct(icecream: IceCream) {
        // avoid multiple asynchronous collide callbacks
        if (icecream.isScanned)
            return;

        icecream.isScanned = true;
        icecream.kill();
        this.requiredIngredients = new Array();
        this.requiredIngredients = this.requiredIngredients.concat(...icecream.ingredients.filter(i => this.inputIngredients.indexOf(i.code) !== -1).map(ingredient => {
            const ingredients: fruttifrisco.IngredientName[] = new Array();
            for (let i: number = 0; i < ingredient.quantity; i++) {
                ingredients.push(ingredient.code);
            }
            return ingredients;
        }));

        thdk.utils.shuffle(this.requiredIngredients);
        this.resetReceivers();
        this.assignReceivers();

        this.icecream = icecream;
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

    private createPlatform(size: MachineSize, x: number, y: number): void {
        switch (size) {
            case (MachineSize.small):
                this.platform = new platforms.TasteMachinePlatform(this.game, x, y);
                break;
            case (MachineSize.large):
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

        this.receivers.forEach(receiver => {
            receiver.onReceive.add((receiver: Receiver, ingredient: Ingredient, correct: boolean) => {
                if (correct) {
                    receiver.setIngredient(null);
                    this.assignReceivers();
                }

                this.receiveIngredient(ingredient, correct);
            });
        });
    }

    private receiveIngredient(ingredient: Ingredient, correct: boolean) {
        this.icecream.addIngredient(ingredient);

        // was this the last ingredient?
        if (!this.receivers.filter(r => r.isAssigned()).length) {
            this.icecream.reset(this.scanner.x + this.icecream.width + 2, 670);
            this.onProductFinished.dispatch(this, this.icecream);
            this.icecream.isScanned = false;
            this.icecream.body.moveRight(100);
        }
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
    constructor(game: Phaser.Game, x: number, y: number, frame = 5) {
        super(game, x, y, Assets.Spritesheets.SpritesheetsIcecreams1572066.getName(), frame, 0.5, 0.5);
        this.name = IceCreamType[this.getRandomTaste()];
        this.body.setZeroRotation();
        this.body.data.gravityScale = 0;
        this.body.data.shapes[0].sensor = true;
    }

    private getRandomTaste(): IceCreamType {
        return Math.floor(Math.random() * Object.keys(IceCreamType).length / 2);
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
    protected funnel: SimpleSprite;
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
        this.onReceive.dispatch(this, ingredient, this.ingredientCode === ingredient.code);
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

        this.inputEnabled = true;
        this.input.priorityID = 2;
        this.events.onInputDown.add(this.kill, this);
    }
}

export class Spraycan extends SimpleSprite {
    constructor(game: Phaser.Game, x: number, y: number, key?: string, frame?: string | number) {
        super(game, x, y, Assets.Spritesheets.SpritesheetsSpraycan12227512.getName(), frame);
        this.anchor.setTo(0);
        this.scale.setTo(0.5);
        this.inputEnabled = true;
        this.animations.add('spray', [2], 1, false);
        this.input.useHandCursor = true;
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

