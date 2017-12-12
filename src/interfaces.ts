export namespace fruttifrisco {
    export type IngredientName = 'egg' | 'suggar' | 'milk' | 'vanilla' | 'chocolate' | 'strawberry';

    export interface IProduct {
        code: string;
        ingredients: IproductIngredient[];
    }

    export interface IproductIngredient {
        code: IngredientName;
        quantity: number;
    }
}