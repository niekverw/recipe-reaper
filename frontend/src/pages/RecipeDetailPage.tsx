import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeftIcon,
  ClockIcon,
  UsersIcon,
  PencilIcon,
  TrashIcon,
  ShareIcon,
  PrinterIcon,
  EllipsisVerticalIcon,
  CheckIcon,
  StarIcon,
  ScaleIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline'
import { sampleRecipes } from '../data/sampleRecipes'

interface IngredientItemProps {
  ingredient: string
  isChecked: boolean
  onToggle: () => void
  scale: number
}

interface CustomCheckboxProps {
  size?: 'sm' | 'md' | 'lg'
  isSelected: boolean
  onValueChange: () => void
}

function CustomCheckbox({ size = 'sm', isSelected, onValueChange }: CustomCheckboxProps) {
  const sizeClass = size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-5 h-5' : 'w-6 h-6'

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={isSelected}
      onClick={onValueChange}
      className={`flex items-center justify-center ${sizeClass} rounded transition-colors flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-500`}
    >
      <div
        className={`w-full h-full rounded border flex items-center justify-center transition-colors ${
          isSelected
            ? 'bg-green-500 border-green-500 text-white'
            : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400'
        }`}
      >
        {isSelected ? (
          <CheckIcon className="w-3 h-3" />
        ) : null}
      </div>
    </button>
  )
}

function IngredientItem({ ingredient, isChecked, onToggle, scale }: IngredientItemProps) {
  const scaleIngredient = (ingredient: string, scale: number) => {
    if (scale === 1) return ingredient

    const scaled = ingredient.replace(/(\d+(?:\.\d+)?)/g, (match) => {
      const num = parseFloat(match)
      const result = num * scale
      return result % 1 === 0 ? result.toString() : result.toFixed(1)
    })

    return scaled
  }

  return (
    <div className="flex items-center gap-2 py-1 px-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
      <CustomCheckbox
        size="sm"
        isSelected={isChecked}
        onValueChange={onToggle}
      />
      <span className={`text-sm leading-relaxed flex-1 ${isChecked ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-900 dark:text-white'}`}>
        {scaleIngredient(ingredient, scale)}
      </span>
    </div>
  )
}

interface InstructionStepProps {
  instruction: string
  stepNumber: number
  isCompleted: boolean
  onToggle: () => void
}

function InstructionStep({ instruction, stepNumber, isCompleted, onToggle }: InstructionStepProps) {
  return (
    <button
      onClick={onToggle}
      className="flex items-start gap-3 py-2 w-full text-left rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
    >
      <div
        className={`w-7 h-7 flex items-center justify-center text-sm font-semibold rounded-full border-2 transition-all flex-shrink-0 ${
          isCompleted
            ? 'bg-green-500 text-white border-green-500'
            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600 hover:border-blue-500'
        }`}
      >
        {isCompleted ? <CheckIcon className="w-4 h-4" /> : stepNumber}
      </div>
      <p className={`text-sm leading-relaxed ${isCompleted ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white'}`}>
        {instruction}
      </p>
    </button>
  )
}

function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const recipe = sampleRecipes.find(r => r.id === id)
  const [scale, setScale] = useState(1)
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set())
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())
  const [showActionsMenu, setShowActionsMenu] = useState(false)
  const [showScaleMenu, setShowScaleMenu] = useState(false)

  if (!recipe) {
    return (
      <div className="px-4 py-8 max-w-4xl mx-auto">
        <div className="text-center py-20">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <ClockIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h1 className="text-2xl font-semibold mb-2 text-gray-900 dark:text-white">Recipe Not Found</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">The recipe you're looking for doesn't exist or has been removed.</p>
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Back to Recipes
            </button>
          </div>
        </div>
      </div>
    )
  }

  const toggleIngredient = (index: number) => {
    const newChecked = new Set(checkedIngredients)
    if (newChecked.has(index)) {
      newChecked.delete(index)
    } else {
      newChecked.add(index)
    }
    setCheckedIngredients(newChecked)
  }

  const toggleStep = (index: number) => {
    const newCompleted = new Set(completedSteps)
    if (newCompleted.has(index)) {
      newCompleted.delete(index)
    } else {
      newCompleted.add(index)
    }
    setCompletedSteps(newCompleted)
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: recipe.name,
        text: recipe.description,
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const scaleOptions = [
    { key: '0.5', label: '½x', value: 0.5 },
    { key: '1', label: '1x', value: 1 },
    { key: '1.5', label: '1½x', value: 1.5 },
    { key: '2', label: '2x', value: 2 },
    { key: '3', label: '3x', value: 3 },
    { key: '4', label: '4x', value: 4 }
  ]

  return (
    <div className="px-4 py-6 max-w-6xl mx-auto">
      {/* Navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          <span className="text-sm">Back to Recipes</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Share recipe"
          >
            <ShareIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
          <button
            onClick={handlePrint}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Print recipe"
          >
            <PrinterIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
          <div className="relative">
            <button
              onClick={() => setShowActionsMenu(!showActionsMenu)}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="More actions"
            >
              <EllipsisVerticalIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
            {showActionsMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-10">
                <button className="w-full px-4 py-2 text-left text-sm text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3">
                  <PencilIcon className="w-4 h-4" />
                  Edit Recipe
                </button>
                <button className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3">
                  <TrashIcon className="w-4 h-4" />
                  Delete Recipe
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="mb-8">
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl p-6 mb-6">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3 text-gray-900 dark:text-white">{recipe.name}</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed max-w-3xl">
            {recipe.description}
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <ClockIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">{recipe.prepTimeMinutes} min</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <UsersIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">{Math.round(recipe.servings * scale)} servings</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <StarIcon className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">4.8 (24)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Instructions */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Instructions</h2>
            <button
              onClick={() => setCompletedSteps(new Set())}
              className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Reset Steps
            </button>
          </div>

          <div className="space-y-1">
            {recipe.instructions.map((instruction, index) => (
              <InstructionStep
                key={index}
                instruction={instruction}
                stepNumber={index + 1}
                isCompleted={completedSteps.has(index)}
                onToggle={() => toggleStep(index)}
              />
            ))}
          </div>
        </div>

        {/* Ingredients Sidebar */}
        <div className="lg:sticky lg:top-6 lg:h-fit">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Ingredients</h3>
                <button
                  onClick={() => {
                    const allIndices = new Set(recipe.ingredients.map((_, index) => index));
                    setCheckedIngredients(
                      checkedIngredients.size === recipe.ingredients.length ? new Set() : allIndices
                    );
                  }}
                  className="px-3 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  {checkedIngredients.size === recipe.ingredients.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <ScaleIcon className="w-4 h-4 text-gray-400" />
                <div className="relative">
                  <button
                    onClick={() => setShowScaleMenu(!showScaleMenu)}
                    className="flex items-center gap-1 px-3 py-1 text-sm font-medium text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    {scaleOptions.find(o => o.value === scale)?.label ?? `${scale}x`}
                    <ChevronDownIcon className="w-3 h-3" />
                  </button>
                  {showScaleMenu && (
                    <div className="absolute right-0 mt-2 w-24 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-10">
                      {scaleOptions.map(option => (
                        <button
                          key={option.key}
                          onClick={() => {
                            setScale(option.value)
                            setShowScaleMenu(false)
                          }}
                          className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between ${
                            scale === option.value ? 'font-semibold text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'
                          }`}
                        >
                          <span>{option.label}</span>
                          {scale === option.value && <CheckIcon className="w-3 h-3" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-1">
              {recipe.ingredients.map((ingredient, index) => (
                <IngredientItem
                  key={index}
                  ingredient={ingredient}
                  isChecked={checkedIngredients.has(index)}
                  onToggle={() => toggleIngredient(index)}
                  scale={scale}
                />
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                <span>Created {new Date(recipe.createdAt).toLocaleDateString()}</span>
                <button
                  onClick={() => setCheckedIngredients(new Set())}
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Click outside to close menus */}
      {(showActionsMenu || showScaleMenu) && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => {
            setShowActionsMenu(false)
            setShowScaleMenu(false)
          }}
        />
      )}
    </div>
  )
}

export default RecipeDetailPage