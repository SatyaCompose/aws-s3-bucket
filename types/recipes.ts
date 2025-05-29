export interface RecipeListBody {
    pageSize?: number;
    page?: number;
    filterCreatedDays?: number;
    filter?: {
        tags?: string;
        products?: string;
        category?: string;
    };
    sort?: {
        by?: string;
        field?: string;
    };
    customer_reference?: number;
    skipIntrospection?: boolean;
}

export interface RecipeDetails {
    internalTitle?: string;
    recipeTitle?: string;
    recipeImage?: string;
    recipeImageTags?: string[];
    url?: string;
    author?: string;
    authorUrl?: string;
    shortDescription?: string;
    recordCreatedDate?: number;
    createdDate?: Date;
    ingredients?: Ingredient[];
    ingredientsCount?: number;
    serves?: string;
    prepTimeInMinutes?: number;
    prepTimeDetail?: string;
    cookingTimeInMinutes?: number;
    cookingTimeInDetail?: string;
    method?: RecipeMethod[];
    recipeTip?: string;
    categories?: string[];
    tags?: string[];
    products?: string[];
    recipeProducts?: any;
    ogTitle?: string;
    ogDescription?: string;
    recipeImageFile?: string;
    recipeTipTitle?: string;
}

export interface Ingredient {
    ingredientTitle?: string;
    ingredients?: string;
    ingredientsCount?: number | string;
}

export interface RecipeMethod {
    methodName?: string;
    steps?: RecipeStep[];
}

export interface RecipeStep {
    stepTitle?: string;
    stepDescription?: string;
}

export interface BuilderResult {
    id?: string
    startDate?: number;
    endDate?: number;
    createdDate?: number;
    lastUpdated?: number;
    data?: RecipeDetails;
}