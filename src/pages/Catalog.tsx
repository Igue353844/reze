import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { VideoCard } from '@/components/VideoCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useVideos, useCategories } from '@/hooks/useVideos';
import { Skeleton } from '@/components/ui/skeleton';
import type { ContentType } from '@/types/video';

const Catalog = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>(searchParams.get('type') || 'all');

  const { data: videos, isLoading } = useVideos();
  const { data: categories } = useCategories();

  const filteredVideos = useMemo(() => {
    if (!videos) return [];

    return videos.filter(video => {
      // Search filter
      const matchesSearch = searchQuery
        ? video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          video.description?.toLowerCase().includes(searchQuery.toLowerCase())
        : true;

      // Category filter
      const matchesCategory = selectedCategory === 'all' 
        ? true 
        : video.category_id === selectedCategory;

      // Type filter
      const matchesType = selectedType === 'all'
        ? true
        : video.type === selectedType;

      return matchesSearch && matchesCategory && matchesType;
    });
  }, [videos, searchQuery, selectedCategory, selectedType]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery) {
      setSearchParams({ search: searchQuery });
    } else {
      setSearchParams({});
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedType('all');
    setSearchParams({});
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-4xl lg:text-5xl text-foreground mb-2">
            CATÁLOGO
          </h1>
          <p className="text-muted-foreground">
            Explore nossa biblioteca de filmes, séries e trailers
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar por título..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-secondary border-border"
              />
            </div>
            <Button type="submit" variant="secondary">
              Buscar
            </Button>
          </form>

          {/* Category Filter */}
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full lg:w-48 bg-secondary border-border">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Categorias</SelectItem>
              {categories?.map(category => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Type Filter */}
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-full lg:w-40 bg-secondary border-border">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="movie">Filmes</SelectItem>
              <SelectItem value="series">Séries</SelectItem>
              <SelectItem value="trailer">Trailers</SelectItem>
            </SelectContent>
          </Select>

          {/* Clear Filters */}
          <Button variant="outline" onClick={clearFilters} className="gap-2">
            <Filter className="w-4 h-4" />
            Limpar
          </Button>
        </div>

        {/* Results Count */}
        <p className="text-sm text-muted-foreground mb-6">
          {filteredVideos.length} {filteredVideos.length === 1 ? 'resultado' : 'resultados'} encontrados
        </p>

        {/* Video Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[2/3] rounded-lg" />
            ))}
          </div>
        ) : filteredVideos.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredVideos.map(video => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg mb-4">
              Nenhum vídeo encontrado
            </p>
            <Button variant="secondary" onClick={clearFilters}>
              Limpar Filtros
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Catalog;
