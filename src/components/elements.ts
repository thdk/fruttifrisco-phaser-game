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
    private productInProgress: IceCream;
    private requiredIngredients: fruttifrisco.IngredientName[];
    private inputIngredients: fruttifrisco.IngredientName[];

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
        this.productInProgress = icecream;
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
    }

    private resetReceivers() {
        this.receivers.forEach(r => r.ingredient = null);
    }

    private assignReceivers() {
        if (!this.receivers)
            return;

        this.receivers.filter(receiver => !receiver.ingredient).forEach(receiver => {
            receiver.ingredient = this.requiredIngredients.pop();
        });

        console.log('new requried ingredient list:');
        console.log(this.requiredIngredients);

        if (!this.receivers.filter(r => r.ingredient).length) {
            this.productInProgress.reset(this.game.world.centerX, this.game.world.centerY);
            this.onProductFinished.dispatch(this.productInProgress);
            this.productInProgress = null;
        }
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
            receiver.onReceive.add((receiver: Receiver, ingredient: Ingredient) => {
                if (receiver.ingredient && receiver.ingredient === ingredient.name) {
                    console.log('correct ingredient received');
                    receiver.ingredient = null;
                    this.productInProgress.ingredients.filter(i => i.code === ingredient.name)[0].quantity--;
                    this.assignReceivers();
                }
                else {
                    console.log('wrong ingredient received');
                    console.log('expected: ' + receiver.ingredient);
                }
            });
        });
    }
}

export enum IceCreamType {
    Vanille,
    Chocolate,
    Strawberry
}
export class IceCream extends PhysicsP2Sprite implements fruttifrisco.IProduct {
    public code: string;
    public ingredients: fruttifrisco.IproductIngredient[];
    public isScanned = false;
    constructor(game: Phaser.Game, x: number, y: number, frame?: string | number) {
        super(game, x, y, Assets.Spritesheets.SpritesheetsIcecreams1572066.getName(), frame, 0.5, 0.5);
        this.code = IceCreamType[this.getRandomTaste()];
    }

    private getRandomTaste(): IceCreamType {
        return Math.floor(Math.random() * Object.keys(IceCreamType).length / 2);
    }
}

export class Receiver extends SimpleSprite {
    public onReceive: Phaser.Signal;
    public ingredient?: fruttifrisco.IngredientName;
    constructor(game: Phaser.Game, x: number, y: number, frame?: string | number) {
        super(game, x, y, Assets.Spritesheets.SpritesheetsReceivers3004208.getName(), frame, 0.3, new Phaser.Point(0, 1));
        this.onReceive = new Phaser.Signal();
    }

    public receive(ingredient: Ingredient) {
        this.animations.play('receive');
        this.onReceive.dispatch(this, ingredient);
    }
}

export class GreenReceiver extends Receiver {
    constructor(game: Phaser.Game, x: number, y: number) {
        super(game, x, y, 0);
        this.animations.add('receive', [1, 2, 3, 0], 8, false);
    }
}

export class RedReceiver extends Receiver {
    constructor(game: Phaser.Game, x: number, y: number) {
        super(game, x, y, 4);
        this.animations.add('receive', [4, 5, 6, 4], 8, false);
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
    public name: fruttifrisco.IngredientName;
    constructor(game: Phaser.Game, x: number, y: number, frame: string | number, ingredient: fruttifrisco.IngredientName) {
        super(game, x, y, Assets.Spritesheets.SpritesheetsIngredient1652916.getName(), frame, 0.5);
        this.name = ingredient;
    }
}

export class Egg extends Ingredient {
    constructor(game: Phaser.Game, x: number, y: number, key?: string, frame?: string | number) {
        super(game, x, y, 3, 'egg');
    }
}

export class Suggar extends Ingredient {
    constructor(game: Phaser.Game, x: number, y: number, key?: string, frame?: string | number) {
        super(game, x, y, 5, 'suggar');
    }
}

export class Milk extends Ingredient {
    constructor(game: Phaser.Game, x: number, y: number, key?: string, frame?: string | number) {
        super(game, x, y, 4, 'milk');
    }
}

export class Vanilla extends Ingredient {
    constructor(game: Phaser.Game, x: number, y: number, key?: string, frame?: string | number) {
        super(game, x, y, 0, 'vanilla');
    }
}

export class Chocolate extends Ingredient {
    constructor(game: Phaser.Game, x: number, y: number, key?: string, frame?: string | number) {
        super(game, x, y, 1, 'chocolate');
    }
}

export class Strawberry extends Ingredient {
    constructor(game: Phaser.Game, x: number, y: number, key?: string, frame?: string | number) {
        super(game, x, y, 2, 'milk');
    }
}

