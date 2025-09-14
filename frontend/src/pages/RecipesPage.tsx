import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Card,
  CardBody,
  Input,
  Button,
  Chip,
  Select,
  SelectItem,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem
} from '@heroui/react'
import {
  MagnifyingGlassIcon,
  ClockIcon,
  UsersIcon,
  PencilIcon,
  TrashIcon,
  FunnelIcon,
  Bars3BottomLeftIcon,
  Squares2X2Icon,
  ViewColumnsIcon,
  PlusIcon
} from '@heroicons/react/24/outline'
import { sampleRecipes } from '../data/sampleRecipes'

interface RecipeActionsProps {
  recipeId: string
  onEdit: (id: string, e: React.MouseEvent) => void
  onDelete: (id: string, e: React.MouseEvent) => void
}

function RecipeActions({ recipeId, onEdit, onDelete }: RecipeActionsProps) {
  return (
    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
      <Button
        isIconOnly
        size="sm"
        variant="light"
        onPress={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onEdit(recipeId, e as unknown as React.MouseEvent)
        }}
        aria-label="Edit recipe"
        className="hover:bg-default-100"
      >
        <PencilIcon className="w-4 h-4" />
      </Button>
      <Button
        isIconOnly
        size="sm"
        color="danger"
        variant="light"
        onPress={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onDelete(recipeId, e as unknown as React.MouseEvent)
        }}
        aria-label="Delete recipe"
        className="hover:bg-danger-50"
      >
        <TrashIcon className="w-4 h-4" />
      </Button>
    </div>
  )
}

interface RecipeGridCardProps {
  recipe: typeof sampleRecipes[0]
  onEdit: (id: string, e: React.MouseEvent) => void
  onDelete: (id: string, e: React.MouseEvent) => void
}

function RecipeGridCard({ recipe, onEdit, onDelete }: RecipeGridCardProps) {
  return (
    <Link to={`/recipe/${recipe.id}`} className="block group">
      <Card className="group-hover:shadow-lg transition-all duration-300 w-64 h-80 border border-default-200/50 hover:border-default-300 flex-shrink-0">
        <CardBody className="p-0 h-full flex flex-col">
          <div className="h-40 bg-gradient-to-br from-default-100 to-default-200 relative overflow-hidden flex-shrink-0">
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            <div className="absolute top-3 right-3 z-10">
              <RecipeActions
                recipeId={recipe.id}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            </div>
            <div className="absolute bottom-3 left-3 right-3">
              <div className="flex items-center gap-2">
                <Chip
                  size="sm"
                  variant="solid"
                  color="default"
                  className="bg-black/30 text-white backdrop-blur-sm text-xs"
                  startContent={<ClockIcon className="w-3 h-3" />}
                >
                  {recipe.prepTimeMinutes}m
                </Chip>
                <Chip
                  size="sm"
                  variant="solid"
                  color="default"
                  className="bg-black/30 text-white backdrop-blur-sm text-xs"
                  startContent={<UsersIcon className="w-3 h-3" />}
                >
                  {recipe.servings}
                </Chip>
              </div>
            </div>
          </div>
          <div className="p-4 flex-1 flex flex-col">
            <h3 className="font-semibold text-base mb-2 line-clamp-1">
              {recipe.name}
            </h3>
            <p className="text-sm text-default-500 line-clamp-3 leading-relaxed flex-1">
              {recipe.description}
            </p>
          </div>
        </CardBody>
      </Card>
    </Link>
  )
}

interface RecipeListCardProps {
  recipe: typeof sampleRecipes[0]
  onEdit: (id: string, e: React.MouseEvent) => void
  onDelete: (id: string, e: React.MouseEvent) => void
}

function RecipeListCard({ recipe, onEdit, onDelete }: RecipeListCardProps) {
  return (
    <Link to={`/recipe/${recipe.id}`} className="block group">
      <Card className="group-hover:shadow-md transition-all duration-200 border border-default-200/50 hover:border-default-300">
        <CardBody className="p-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-default-100 to-default-200 rounded-lg flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base mb-1 truncate">
                {recipe.name}
              </h3>
              <p className="text-sm text-default-500 line-clamp-1 mb-2">
                {recipe.description}
              </p>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-xs text-default-400">
                  <ClockIcon className="w-3 h-3" />
                  <span>{recipe.prepTimeMinutes}m</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-default-400">
                  <UsersIcon className="w-3 h-3" />
                  <span>{recipe.servings} servings</span>
                </div>
              </div>
            </div>
            <RecipeActions
              recipeId={recipe.id}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </div>
        </CardBody>
      </Card>
    </Link>
  )
}

function RecipesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const filteredAndSortedRecipes = useMemo(() => {
    let filtered = sampleRecipes.filter(recipe =>
      recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.description.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'time':
          return a.prepTimeMinutes - b.prepTimeMinutes
        case 'servings':
          return a.servings - b.servings
        case 'recent':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        default:
          return 0
      }
    })
  }, [searchQuery, sortBy])

  const handleEdit = (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('Edit recipe:', id)
  }

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('Delete recipe:', id)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">
              {CONTENT.pageTitle}
            </h1>
            <Chip
              size="sm"
              variant="flat"
              color="primary"
              className="text-xs font-medium"
            >
              {filteredAndSortedRecipes.length} {CONTENT.recipesLabel}
            </Chip>
          </div>
          <Link to="/add-recipe">
            <Button
              color="primary"
              startContent={<PlusIcon className="w-4 h-4" />}
              size="sm"
              className="font-medium"
            >
              Add Recipe
            </Button>
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <Input
            type="search"
            placeholder={CONTENT.searchPlaceholder}
            value={searchQuery}
            onValueChange={setSearchQuery}
            startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
            className="flex-1 max-w-md"
            size="sm"
            variant="bordered"
          />

          <div className="flex items-center gap-2">
            <Select
              size="sm"
              variant="bordered"
              selectedKeys={[sortBy]}
              onSelectionChange={(keys) => setSortBy(Array.from(keys)[0] as string)}
              className="w-32"
              startContent={<FunnelIcon className="w-4 h-4" />}
              aria-label="Sort recipes"
            >
              <SelectItem key="name">Name</SelectItem>
              <SelectItem key="time">Time</SelectItem>
              <SelectItem key="servings">Servings</SelectItem>
              <SelectItem key="recent">Recent</SelectItem>
            </Select>

            <div className="flex border border-default-200 rounded-lg">
              <Button
                size="sm"
                variant={viewMode === 'grid' ? 'solid' : 'light'}
                color={viewMode === 'grid' ? 'primary' : 'default'}
                onPress={() => setViewMode('grid')}
                isIconOnly
                className="rounded-r-none"
                aria-label="Grid view"
              >
                <Squares2X2Icon className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'list' ? 'solid' : 'light'}
                color={viewMode === 'list' ? 'primary' : 'default'}
                onPress={() => setViewMode('list')}
                isIconOnly
                className="rounded-l-none"
                aria-label="List view"
              >
                <Bars3BottomLeftIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {filteredAndSortedRecipes.length === 0 ? (
        <div className="text-center py-12">
          <div className="max-w-sm mx-auto">
            <div className="w-16 h-16 bg-default-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MagnifyingGlassIcon className="w-8 h-8 text-default-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{CONTENT.noResultsTitle}</h3>
            <p className="text-default-500 text-sm">{CONTENT.noResultsMessage}</p>
          </div>
        </div>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <div className="flex flex-wrap gap-4">
              {filteredAndSortedRecipes.map((recipe) => (
                <RecipeGridCard
                  key={recipe.id}
                  recipe={recipe}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAndSortedRecipes.map((recipe) => (
                <RecipeListCard
                  key={recipe.id}
                  recipe={recipe}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default RecipesPage

// Static content
const CONTENT = {
  pageTitle: 'Recipe Collection',
  searchPlaceholder: 'Search recipes...',
  recipesLabel: 'recipes',
  noResultsTitle: 'No recipes found',
  noResultsMessage: 'Try adjusting your search or add a new recipe to get started.'
}

// Interfaces
export interface RecipeListProps {
  recipes: typeof sampleRecipes
}