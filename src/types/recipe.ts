export interface Ingredient {
  nom: string;
  quantite: string;
  unite: string;
}

export interface Recipe {
  id: string;
  titre: string;
  description?: string;
  tempsPreparation?: number; // en minutes
  tempsCuisson?: number;     // en minutes
  portions?: number;
  categorie?: string;
  type: 'Sucré' | 'Salé';
  ingredients: Ingredient[];
  etapes: string[];
  createdAt: number;
}

export type RecipeCreatePayload = Omit<Recipe, 'id' | 'createdAt'>;
