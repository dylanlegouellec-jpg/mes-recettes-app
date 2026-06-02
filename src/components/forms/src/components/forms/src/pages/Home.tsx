import { useState, useCallback, useEffect, type FC } from 'react';

import { useRecipes }   from '../hooks/useRecipes';
import { useSearch }    from '../hooks/useSearch';

import Layout           from '../components/layout/Layout';
import CategoryTabs,
  { type ActiveCategory } from '../components/dashboard/CategoryTabs';
import SearchBar        from '../components/dashboard/SearchBar';
import RecipeGrid       from '../components/dashboard/RecipeGrid';
import RecipeModal      from '../components/detail/RecipeModal';
import RecipeForm       from '../components/forms/RecipeForm';

import type { Recipe, RecipeCreatePayload } from '../types/recipe';

// ─────────────────────────────────────────────────────────────
// Sous-composant : Bannière héro (page vide, 0 recette en DB)
// ─────────────────────────────────────────────────────────────
const HeroBanner: FC<{ onAdd: () => void }> = ({ onAdd }) => (
  <div className="flex flex-col items-center justify-center text-center py-20 px-6 gap-6">
    <span className="text-7xl select-none" aria-hidden>📖</span>
    <div className="space-y-2 max-w-sm">
      <h2 className="font-serif font-bold text-brown text-2xl">
        Ton livre de recettes t'attend
      </h2>
      <p className="font-sans text-sm text-brown/50 leading-relaxed">
        Commence par ajouter ta première recette sucrée ou salée.
        Elle sera sauvegardée automatiquement sur cet appareil.
      </p>
    </div>
    <button
      onClick={onAdd}
      className="
        flex items-center gap-2 px-6 py-3 rounded-xl
        bg-terracotta text-white font-sans font-semibold text-sm
        shadow-sm transition-all duration-200
        hover:bg-terracotta-dark hover:shadow-md active:scale-95
        focus-visible:outline-none focus-visible:ring-2
        focus-visible:ring-terracotta focus-visible:ring-offset-2
      "
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4"
        viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth={2.5} strokeLinecap="round" aria-hidden>
        <path d="M12 5v14M5 12h14"/>
      </svg>
      Ajouter ma première recette
    </button>
  </div>
);

// ─────────────────────────────────────────────────────────────
// Sous-composant : Toast de confirmation
// ─────────────────────────────────────────────────────────────
interface ToastProps {
  message: string;
  type: 'success' | 'delete';
}

const Toast: FC<ToastProps> = ({ message, type }) => (
  <div
    role="status"
    aria-live="polite"
    className={`
      fixed bottom-6 left-1/2 -translate-x-1/2 z-[60]
      flex items-center gap-2.5
      px-5 py-3 rounded-2xl shadow-lg
      font-sans text-sm font-medium text-white
      animate-fade-in
      ${type === 'success' ? 'bg-sage-dark' : 'bg-brown'}
    `}
  >
    <span aria-hidden>{type === 'success' ? '✓' : '🗑'}</span>
    {message}
  </div>
);

// ─────────────────────────────────────────────────────────────
// Hook interne : gestion du toast sécurisée
// ─────────────────────────────────────────────────────────────
interface ToastState extends ToastProps {
  visible: boolean;
}

function useToast() {
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    message: '',
    type: 'success',
  });

  const show = useCallback((message: string, type: ToastProps['type'] = 'success') => {
    setToast({ visible: true, message, type });
  }, []);

  useEffect(() => {
    if (!toast.visible) return;

    const timer = setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 2800);

    return () => clearTimeout(timer);
  }, [toast.visible, toast.message]);

  return { toast, show };
}

// ─────────────────────────────────────────────────────────────
// Page principale
// ─────────────────────────────────────────────────────────────
const Home: FC = () => {
  const { recipes, addRecipe, updateRecipe, deleteRecipe } = useRecipes();

  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [activeCategory, setActiveCategory] = useState<ActiveCategory>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { toast, show: showToast } = useToast();

  const { filteredRecipes, counts } = useSearch({
    recipes,
    query: searchQuery,
    category: activeCategory,
  });

  const handleOpenCreate = useCallback(() => {
    setEditingRecipe(null);
    setIsFormOpen(true);
  }, []);

  const handleOpenEdit = useCallback((recipe: Recipe) => {
    setEditingRecipe(recipe);
    setSelectedRecipe(null);
    setIsFormOpen(true);
  }, []);

  const handleCloseForm = useCallback(() => {
    setIsFormOpen(false);
    setTimeout(() => setEditingRecipe(null), 300);
  }, []);

  const handleFormSubmit = useCallback(
    (payload: RecipeCreatePayload) => {
      if (editingRecipe) {
        updateRecipe(editingRecipe.id, payload);
        showToast(`"${payload.titre}" a bien été modifiée.`, 'success');
        setSelectedRecipe(prev =>
          prev?.id === editingRecipe.id
            ? { ...editingRecipe, ...payload }
            : prev
        );
      } else {
        const created = addRecipe(payload);
        showToast(`"${created.titre}" a été ajoutée ! 🎉`, 'success');
        setActiveCategory(created.type);
        setSearchQuery('');
      }
      handleCloseForm();
    },
    [editingRecipe, addRecipe, updateRecipe, handleCloseForm, showToast]
  );

  const handleOpenDetail = useCallback((recipe: Recipe) => {
    setSelectedRecipe(recipe);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedRecipe(null);
  }, []);

  const handleDelete = useCallback(
    (id: string) => {
      const target = recipes.find(r => r.id === id);
      if (!target) return;

      const confirmed = window.confirm(
        `Supprimer définitivement "${target.titre}" ?\nCette action est irréversible.`
      );
      if (!confirmed) return;

      deleteRecipe(id);
      setSelectedRecipe(null);
      showToast(`"${target.titre}" a été supprimée.`, 'delete');
    },
    [recipes, deleteRecipe, showToast]
  );

  const handleSearchChange = useCallback((q: string) => {
    setSearchQuery(q);
  }, []);

  const handleCategoryChange = useCallback((cat: ActiveCategory) => {
    setActiveCategory(cat);
  }, []);

  const hasAnyRecipe = recipes.length > 0;

  return (
    <Layout onAddRecipe={handleOpenCreate}>
      {!hasAnyRecipe ? (
        <HeroBanner onAdd={handleOpenCreate} />
      ) : (
        <div className="space-y-5">
          <SearchBar value={searchQuery} onChange={handleSearchChange} />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CategoryTabs active={activeCategory} onChange={handleCategoryChange} counts={counts} />
            {(searchQuery.trim() || activeCategory) && (
              <p className="text-xs text-brown/40 font-sans self-end sm:self-auto flex-shrink-0">
                {filteredRecipes.length} recette{filteredRecipes.length !== 1 ? 's' : ''}
                {activeCategory ? ` · ${activeCategory}` : ''}
              </p>
            )}
          </div>
          <RecipeGrid recipes={filteredRecipes} onRecipeClick={handleOpenDetail} searchQuery={searchQuery} />
        </div>
      )}

      {selectedRecipe && (
        <RecipeModal recipe={selectedRecipe} onClose={handleCloseDetail} onEdit={handleOpenEdit} onDelete={handleDelete} />
      )}

      {isFormOpen && (
        <RecipeForm initialRecipe={editingRecipe} onSubmit={handleFormSubmit} onClose={handleCloseForm} />
      )}

      {toast.visible && <Toast message={toast.message} type={toast.type} />}
    </Layout>
  );
};

export default Home;
