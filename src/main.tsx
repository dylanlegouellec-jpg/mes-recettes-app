import React, { useState, useEffect, useCallback, useMemo, type FC, type ChangeEvent, useRef } from 'react'
import ReactDOM from 'react-dom/client'

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────
interface Ingredient {
  nom: string;
  quantite: string;
  unite: string;
}

interface Recipe {
  id: string;
  titre: string;
  description?: string;
  tempsPreparation?: number;
  tempsCuisson?: number;
  portions?: number;
  type: 'Sucré' | 'Salé';
  ingredients: Ingredient[];
  etapes: string[];
  createdAt: number;
}

type RecipeCreatePayload = Omit<Recipe, 'id' | 'createdAt'>;

// ─────────────────────────────────────────────────────────────
// COMPOSANTS DE FORMULAIRE INTERNES
// ─────────────────────────────────────────────────────────────
const UNITES = ['', 'g', 'kg', 'ml', 'cl', 'l', 'cuillère(s)', 'pincée(s)', 'gousse(s)', 'sachet(s)'];

const IngredientsInput: FC<{ value: Ingredient[]; onChange: (v: Ingredient[]) => void; accent: string }> = ({ value, onChange, accent }) => {
  const handleChange = (index: number, field: keyof Ingredient, val: string) => {
    const next = [...value];
    next[index] = { ...next[index], [field]: val };
    onChange(next);
  };
  const ringClass = accent === 'sage' ? 'focus:ring-sage/20 focus:border-sage/50' : 'focus:ring-terracotta/20 focus:border-terracotta/50';
  return (
    <div className="space-y-3">
      {value.map((ing, index) => (
        <div key={index} className="flex items-center gap-2">
          <input type="text" value={ing.nom} placeholder="Ex: Farine" onChange={(e) => handleChange(index, 'nom', e.target.value)} className={`flex-[2] min-w-0 px-3.5 py-2 rounded-xl bg-white/70 border border-brown/15 font-sans text-sm text-brown transition-all ${ringClass}`} />
          <input type="text" inputMode="decimal" value={ing.quantite} placeholder="Qte" onChange={(e) => handleChange(index, 'quantite', e.target.value)} className={`w-16 text-center px-2 py-2 rounded-xl bg-white/70 border border-brown/15 font-sans text-sm text-brown transition-all ${ringClass}`} />
          <select value={ing.unite} onChange={(e) => handleChange(index, 'unite', e.target.value)} className={`flex-1 min-w-0 px-2 py-2 rounded-xl bg-white/70 border border-brown/15 font-sans text-sm text-brown transition-all ${ringClass}`}>
            {UNITES.map((u) => <option key={u} value={u}>{u || 'unité'}</option>)}
          </select>
          <button type="button" onClick={() => onChange(value.filter((_, i) => i !== index))} className="p-2 text-brown/40 hover:text-red-500">✕</button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...value, { nom: '', quantite: '', unite: '' }])} className="text-sm font-medium text-terracotta">+ Ajouter un ingrédient</button>
    </div>
  );
};

const StepsInput: FC<{ value: string[]; onChange: (v: string[]) => void; accent: string }> = ({ value, onChange, accent }) => {
  const badgeClass = accent === 'sage' ? 'bg-sage' : 'bg-terracotta';
  return (
    <div className="space-y-4">
      {value.map((step, index) => (
        <div key={index} className="flex items-start gap-3">
          <span className={`mt-1 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center font-semibold text-xs text-white ${badgeClass}`}>{index + 1}</span>
          <textarea rows={2} value={step} placeholder="Étape..." onChange={(e) => { const next = [...value]; next[index] = e.target.value; onChange(next); }} className="flex-1 px-3.5 py-2 rounded-xl bg-white/70 border border-brown/15 font-sans text-sm text-brown resize-none" />
          <button type="button" onClick={() => onChange(value.filter((_, i) => i !== index))} className="p-2 text-brown/40 hover:text-red-500">✕</button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...value, ''])} className="text-sm font-medium text-terracotta">+ Ajouter une étape</button>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL DE L'APPLICATION
// ─────────────────────────────────────────────────────────────
const App: FC = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'Sucré' | 'Salé' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Formulaire State
  const [formTitre, setFormTitre] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formPrep, setFormPrep] = useState<number>(15);
  const [formCuisson, setFormCuisson] = useState<number>(0);
  const [formPortions, setFormPortions] = useState<number>(2);
  const [formType, setFormType] = useState<'Sucré' | 'Salé'>('Sucré');
  const [formIngredients, setFormIngredients] = useState<Ingredient[]>([{ nom: '', quantite: '', unite: '' }]);
  const [formEtapes, setFormEtapes] = useState<string[]>(['']);

  useEffect(() => {
    const saved = localStorage.getItem('mes-recettes-data');
    if (saved) { try { setRecipes(JSON.parse(saved)); } catch(e){} }
  }, []);

  const saveAndSet = (next: Recipe[]) => {
    setRecipes(next);
    localStorage.setItem('mes-recettes-data', JSON.stringify(next));
  };

  const handleCreateRecipe = () => {
    const newRecipe: Recipe = {
      id: Math.random().toString(36).substring(2, 9),
      titre: formTitre || 'Recette sans titre',
      description: formDesc,
      tempsPreparation: formPrep,
      tempsCuisson: formCuisson,
      portions: formPortions,
      type: formType,
      ingredients: formIngredients.filter(i => i.nom.trim()),
      etapes: formEtapes.filter(e => e.trim()),
      createdAt: Date.now()
    };
    saveAndSet([newRecipe, ...recipes]);
    setIsFormOpen(false);
    // Reset
    setFormTitre(''); setFormDesc(''); setFormIngredients([{ nom: '', quantite: '', unite: '' }]); setFormEtapes(['']);
  };

  const filteredRecipes = useMemo(() => {
    return recipes.filter(r => {
      if (activeCategory && r.type !== activeCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return r.titre.toLowerCase().includes(q) || r.ingredients.some(i => i.nom.toLowerCase().includes(q));
      }
      return true;
    });
  }, [recipes, activeCategory, searchQuery]);

  return (
    <div className="min-h-screen pb-12 font-sans text-brown">
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-[#FBF9F6]/80 backdrop-blur-md border-b border-brown/5 px-4 py-4 flex items-center justify-between">
        <h1 className="font-serif font-bold text-xl text-brown tracking-tight">📖 Mes Recettes</h1>
        <button onClick={() => setIsFormOpen(true)} className="bg-terracotta text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-sm hover:bg-terracotta-dark transition-all">
          + Ajouter
        </button>
      </header>

      {/* RECHERCHE & NAVIGATION */}
      <div className="p-4 space-y-4 max-w-2xl mx-auto">
        <input type="text" placeholder="🔍 Rechercher une recette ou un ingrédient..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white border border-brown/10 shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/20" />
        
        <div className="flex gap-2">
          <button onClick={() => setActiveCategory(null)} className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${!activeCategory ? 'bg-brown text-white' : 'bg-white text-brown/60 border border-brown/10'}`}>Tout</button>
          <button onClick={() => setActiveCategory('Sucré')} className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${activeCategory === 'Sucré' ? 'bg-terracotta text-white' : 'bg-white text-brown/60 border border-brown/10'}`}>🍩 Sucré</button>
          <button onClick={() => setActiveCategory('Salé')} className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${activeCategory === 'Salé' ? 'bg-sage text-white' : 'bg-white text-brown/60 border border-brown/10'}`}>🍔 Salé</button>
        </div>

        {/* LISTE DES RECETTES */}
        {filteredRecipes.length === 0 ? (
          <div className="text-center py-12 text-brown/40 text-sm">Aucune recette trouvée. Écris-en une ! ✨</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {filteredRecipes.map(recipe => (
              <div key={recipe.id} onClick={() => setSelectedRecipe(recipe)} className="bg-white p-4 rounded-2xl border border-brown/5 shadow-sm active:scale-[0.98] transition-all cursor-pointer">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-serif font-bold text-base text-brown">{recipe.titre}</h3>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${recipe.type === 'Sucré' ? 'bg-terracotta/10 text-terracotta' : 'bg-sage/10 text-sage-dark'}`}>{recipe.type}</span>
                </div>
                <p className="text-xs text-brown/50 line-clamp-2 mb-3">{recipe.description || 'Pas de description.'}</p>
                <div className="text-[11px] text-brown/40 flex gap-3">
                  <span>⏱️ {Number(recipe.tempsPreparation || 0) + Number(recipe.tempsCuisson || 0)} min</span>
                  <span>🍳 {recipe.ingredients.length} ingr.</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODALE DETAIL */}
      {selectedRecipe && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm p-4 overflow-y-auto flex items-center justify-center">
          <div className="bg-[#FBF9F6] w-full max-w-lg rounded-3xl p-6 space-y-5 max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-bold text-terracotta uppercase">{selectedRecipe.type}</span>
                <h2 className="font-serif font-bold text-2xl text-brown">{selectedRecipe.titre}</h2>
              </div>
              <button onClick={() => setSelectedRecipe(null)} className="bg-white border border-brown/10 w-8 h-8 rounded-full flex items-center justify-center text-sm">✕</button>
            </div>
            {selectedRecipe.description && <p className="text-sm text-brown/70 leading-relaxed italic">"{selectedRecipe.description}"</p>}
            
            <div className="grid grid-cols-3 gap-2 text-center bg-white p-3 rounded-xl border border-brown/5 text-xs text-brown/60">
              <div><p className="font-bold text-brown">{selectedRecipe.tempsPreparation} min</p><p className="text-[10px]">Prép.</p></div>
              <div><p className="font-bold text-brown">{selectedRecipe.tempsCuisson} min</p><p className="text-[10px]">Cuisson</p></div>
              <div><p className="font-bold text-brown">{selectedRecipe.portions}</p><p className="text-[10px]">Portions</p></div>
            </div>

            <div className="space-y-2">
              <h4 className="font-serif font-bold text-sm text-brown">Ingrédients</h4>
              <ul className="bg-white rounded-xl p-3 border border-brown/5 space-y-1.5 text-sm">
                {selectedRecipe.ingredients.map((ing, i) => (
                  <li key={i} className="flex justify-between text-brown/80 border-b border-brown/5 pb-1 last:border-0 last:pb-0">
                    <span>• {ing.nom}</span>
                    <span className="font-medium text-brown/50">{ing.quantite} {ing.unite}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-serif font-bold text-sm text-brown">Instructions</h4>
              <ol className="space-y-3 text-sm text-brown/80">
                {selectedRecipe.etapes.map((step, i) => (
                  <li key={i} className="flex gap-3"><span className="font-bold text-terracotta">{i+1}.</span><p className="leading-relaxed">{step}</p></li>
                ))}
              </ol>
            </div>

            <button onClick={() => { if(confirm('Supprimer cette recette ?')) { saveAndSet(recipes.filter(r => r.id !== selectedRecipe.id)); setSelectedRecipe(null); } }} className="w-full text-center text-xs text-red-500 font-medium pt-2">Supprimer la recette</button>
          </div>
        </div>
      )}

      {/* MODALE FORMULAIRE DE CREATION */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm p-4 overflow-y-auto flex items-center justify-center">
          <div className="bg-[#FBF9F6] w-full max-w-lg rounded-3xl p-5 space-y-4 max-h-[92vh] overflow-y-auto shadow-xl">
            <div className="flex justify-between items-center"><h2 className="font-serif font-bold text-lg">Nouvelle recette</h2><button onClick={() => setIsFormOpen(false)} className="text-sm">Fermer</button></div>
            <div className="space-y-3">
              <input type="text" placeholder="Nom de la recette" value={formTitre} onChange={e => setFormTitre(e.target.value)} className="w-full px-3.5 py-2 rounded-xl border border-brown/10 text-sm" />
              <input type="text" placeholder="Courte description (optionnelle)" value={formDesc} onChange={e => setFormDesc(e.target.value)} className="w-full px-3.5 py-2 rounded-xl border border-brown/10 text-sm" />
              
              <div className="flex gap-2">
                <button type="button" onClick={() => setFormType('Sucré')} className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${formType === 'Sucré' ? 'bg-terracotta text-white' : 'bg-white border border-brown/10 text-brown/60'}`}>🍩 Sucré</button>
                <button type="button" onClick={() => setFormType('Salé')} className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${formType === 'Salé' ? 'bg-sage text-white' : 'bg-white border border-brown/10 text-brown/60'}`}>🍔 Salé</button>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div><label className="block mb-1 text-brown/60">Prép (min)</label><input type="number" value={formPrep} onChange={e => setFormPrep(Number(e.target.value))} className="w-full p-2 rounded-xl border border-brown/10 text-center" /></div>
                <div><label className="block mb-1 text-brown/60">Cuisson (min)</label><input type="number" value={formCuisson} onChange={e => setFormCuisson(Number(e.target.value))} className="w-full p-2 rounded-xl border border-brown/10 text-center" /></div>
                <div><label className="block mb-1 text-brown/60">Portions</label><input type="number" value={formPortions} onChange={e => setFormPortions(Number(e.target.value))} className="w-full p-2 rounded-xl border border-brown/10 text-center" /></div>
              </div>

              <div className="space-y-1"><label className="text-xs font-bold text-brown/60">Ingrédients</label><IngredientsInput value={formIngredients} onChange={setFormIngredients} accent={formType === 'Sucré' ? 'terracotta' : 'sage'} /></div>
              <div className="space-y-1"><label className="text-xs font-bold text-brown/60">Étapes de préparation</label><StepsInput value={formEtapes} onChange={setFormEtapes} accent={formType === 'Sucré' ? 'terracotta' : 'sage'} /></div>
            </div>
            <button onClick={handleCreateRecipe} className="w-full bg-brown text-white py-3 rounded-xl font-semibold text-sm shadow-sm mt-2">Enregistrer ma recette ✨</button>
          </div>
        </div>
      )}
    </div>
  );
};

// Injection globale dans l'index HTML
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
