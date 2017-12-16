export namespace fruttifrisco {

    export enum IngredientName {
        Vanilla = 0,
        Chocolate = 1,
        Strawberry = 2,
        Egg = 3,
        Milk = 4,
        Suggar = 5
    }

    export interface IProduct {
        name: string;
        ingredients: IproductIngredient[];
    }

    export interface IproductIngredient {
        code: IngredientName;
        quantity: number;
    }
}