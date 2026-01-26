interface MarketCategoriesProps {
  categories: string[];
  onCategoryClick: (category: string) => void;
}

export default function MarketCategories({
  categories,
  onCategoryClick,
}: MarketCategoriesProps) {
  if (categories.length === 0) {
    return null;
  }

  return (
    <div className="mb-4">
      <h3 className="text-sm font-medium text-gray-400 mb-2">Popular Topics</h3>
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => onCategoryClick(category)}
            className="px-3 py-1.5 text-xs sm:text-sm rounded-lg bg-black/40 text-white/90 hover:bg-primary/20 hover:text-primary transition-colors ring-1 ring-white/10 hover:ring-primary/50"
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  );
}
