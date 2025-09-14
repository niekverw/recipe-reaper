import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Button,
  Card,
  CardBody,
  Chip,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem
} from '@heroui/react'
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
  ScaleIcon
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
      className={`flex items-center justify-center ${sizeClass} rounded transition-colors flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-primary`}
    >
      <div
        className={`w-full h-full rounded border flex items-center justify-center transition-colors ${
          isSelected
            ? 'bg-green-500 border-green-500 text-white'
            : 'bg-default-0 border-default-300 text-default-600'
        }`}
      >
        {isSelected ? (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 00-1.414-1.414L7 12.172 4.707 9.879a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l9-9z" clipRule="evenodd" />
          </svg>
        ) : (
          <span className="sr-only">not selected</span>
        )}
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
    <div className="flex items-center gap-2 py-1 px-2 rounded hover:bg-default-50 transition-colors">
      <CustomCheckbox
        size="sm"
        isSelected={isChecked}
        onValueChange={onToggle}
      />
      <span className={`text-sm leading-snug flex-1 ${isChecked ? 'text-default-400' : ''}`}>
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
      className="flex gap-2 py-2 w-full text-left rounded hover:bg-default-50 transition-colors"
    >
      <div
        className={`w-6 h-6 flex items-center justify-center text-xs font-semibold rounded-full border transition-all flex-shrink-0 ${
          isCompleted
            ? 'bg-green-500 text-white border-green-500'
            : 'bg-default-100 text-default-600 border-default-300 group-hover:border-primary'
        }`}
      >
        {isCompleted ? '✓' : stepNumber}
      </div>
      <p className={`text-sm leading-snug pt-0.5 ${isCompleted ? 'line-through text-default-400' : ''}`}>
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
  

  if (!recipe) {
    return (
      <div className="text-center py-20">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-default-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ClockIcon className="w-8 h-8 text-default-400" />
          </div>
          <h1 className="text-2xl font-semibold mb-2">Recipe Not Found</h1>
          <p className="text-default-500 mb-6">The recipe you're looking for doesn't exist or has been removed.</p>
            <Button
              startContent={<ArrowLeftIcon className="w-4 h-4" />}
              variant="flat"
              onPress={() => navigate('/')}
            >
              Back to Recipes
            </Button>
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
    <div className="max-w-5xl mx-auto">
      {/* Navigation */}
      <div className="flex items-center justify-between mb-3">
          <Button
            startContent={<ArrowLeftIcon className="w-3 h-3" />}
            variant="light"
            size="sm"
            className="text-default-600 px-2 h-8 text-sm"
            onPress={() => navigate('/')}
          >
            Back to Recipes
          </Button>

        <div className="flex items-center gap-1">
          <Button
            isIconOnly
            variant="light"
            size="sm"
            onPress={handleShare}
            aria-label="Share recipe"
            className="h-8 w-8"
          >
            <ShareIcon className="w-3 h-3" />
          </Button>
          <Button
            isIconOnly
            variant="light"
            size="sm"
            onPress={handlePrint}
            aria-label="Print recipe"
            className="h-8 w-8"
          >
            <PrinterIcon className="w-3 h-3" />
          </Button>
          <Dropdown>
            <DropdownTrigger>
              <Button
                isIconOnly
                variant="light"
                size="sm"
                aria-label="More actions"
                className="h-8 w-8"
              >
                <EllipsisVerticalIcon className="w-3 h-3" />
              </Button>
            </DropdownTrigger>
            <DropdownMenu>
              <DropdownItem
                key="edit"
                startContent={<PencilIcon className="w-3 h-3" />}
                className="text-xs"
              >
                Edit Recipe
              </DropdownItem>
              <DropdownItem
                key="delete"
                className="text-danger text-xs"
                color="danger"
                startContent={<TrashIcon className="w-3 h-3" />}
              >
                Delete Recipe
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>

      {/* Hero Section */}
      <div className="mb-4">
        <div className="bg-gradient-to-br from-default-100 to-default-200 rounded-lg p-4 mb-3">
          <h1 className="text-2xl font-bold tracking-tight mb-1">{recipe.name}</h1>
          <p className="text-sm text-default-600 mb-3 leading-snug">
            {recipe.description}
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <Chip
              size="sm"
              variant="flat"
              startContent={<ClockIcon className="w-3 h-3" />}
              className="text-xs h-6"
            >
              {recipe.prepTimeMinutes} min
            </Chip>
            <Chip
              size="sm"
              variant="flat"
              startContent={<UsersIcon className="w-3 h-3" />}
              className="text-xs h-6"
            >
              {Math.round(recipe.servings * scale)} servings
            </Chip>
            <div className="flex items-center gap-1">
              <StarIcon className="w-3 h-3 text-default-400" />
              <span className="text-xs text-default-500">4.8 (24)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Instructions */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Instructions</h2>
            <Button
              size="sm"
              variant="flat"
              onPress={() => setCompletedSteps(new Set())}
              className="text-sm px-2 h-6"
            >
              Reset Steps
            </Button>
          </div>

          <div className="space-y-0.5">
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
        <div className="lg:sticky lg:top-3 lg:h-fit">
          <Card className="border border-default-200">
            <CardBody className="p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold">Ingredients</h3>
                  <Button 
                    size="sm" 
                    variant="light" 
                    className="text-xs h-6 px-2"
                    onPress={() => {
                      const allIndices = new Set(recipe.ingredients.map((_, index) => index));
                      setCheckedIngredients(
                        checkedIngredients.size === recipe.ingredients.length ? new Set() : allIndices
                      );
                    }}
                  >
                    {checkedIngredients.size === recipe.ingredients.length ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>
                <div className="flex items-center gap-1">
                  <ScaleIcon className="w-3 h-3 text-default-400" />
                  <Dropdown>
                    <DropdownTrigger>
                      <Button size="sm" variant="light" className="text-xs h-6 px-2">
                        {scaleOptions.find(o => o.value === scale)?.label ?? `${scale}x`}
                      </Button>
                    </DropdownTrigger>
                    <DropdownMenu>
                      {scaleOptions.map(option => (
                        <DropdownItem
                          key={option.key}
                          className={`text-xs flex items-center justify-between ${scale === option.value ? 'font-semibold' : ''}`}
                          onClick={() => setScale(option.value)}
                        >
                          <span>{option.label}</span>
                          {scale === option.value && <CheckIcon className="w-3 h-3 text-primary" />}
                        </DropdownItem>
                      ))}
                    </DropdownMenu>
                  </Dropdown>
                </div>
              </div>

              <div className="space-y-0.5">
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

              <div className="mt-3 pt-2 border-t border-default-200">
                <div className="flex items-center justify-between text-xs text-default-500">
                  <span>Created {new Date(recipe.createdAt).toLocaleDateString()}</span>
                  <Button
                    size="sm"
                    variant="flat"
                    onPress={() => setCheckedIngredients(new Set())}
                    className="text-xs px-1.5 h-5"
                  >
                    Reset
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default RecipeDetailPage