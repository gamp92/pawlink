'use client'

import type { Animal, AnimalStatus, Species } from '@/lib/mock-data'
import { ActionBar } from '@/components/shared/ActionBar'
import { Button } from '@/components/shared/Button'

export type AnimalFormMode = 'create' | 'edit'

export type AnimalFormState = {
  name: string
  species: Species | ''
  age_years: string
  size: Animal['size']
  status: AnimalStatus
  description: string
}

export const statuses: AnimalStatus[] = ['available', 'in_process', 'adopted']
export const speciesOptions: Species[] = ['dog', 'cat', 'other']
export const sizeOptions: Animal['size'][] = ['small', 'medium', 'large']

export const emptyAnimalForm: AnimalFormState = {
  name: '',
  species: '',
  age_years: '1',
  size: 'medium',
  status: 'available',
  description: '',
}

const fieldClassName =
  'mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100 disabled:bg-slate-50 disabled:text-slate-400'

export function getFormFromAnimal(animal: Animal): AnimalFormState {
  return {
    name: animal.name,
    species: animal.species,
    age_years: String(animal.age_years),
    size: animal.size,
    status: animal.status,
    description: animal.description,
  }
}

export function AnimalFormPanel({
  formState,
  formErrors,
  formMode,
  isSaving,
  onFieldChange,
  onSubmit,
  onCancel,
}: {
  formState: AnimalFormState
  formErrors: Partial<Record<'name' | 'species', string>>
  formMode: AnimalFormMode
  isSaving: boolean
  onFieldChange: <FieldName extends keyof AnimalFormState>(field: FieldName, value: AnimalFormState[FieldName]) => void
  onSubmit: () => void
  onCancel: () => void
}) {
  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit()
      }}
    >
      <div>
        <label className="text-xs font-black uppercase tracking-wide text-slate-500" htmlFor="animal-name">
          Name
        </label>
        <input
          id="animal-name"
          value={formState.name}
          onChange={(event) => onFieldChange('name', event.target.value)}
          className={fieldClassName}
          placeholder="Luna"
          disabled={isSaving}
        />
        {formErrors.name ? <p className="mt-1 text-xs font-bold text-rose-600">{formErrors.name}</p> : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs font-black uppercase tracking-wide text-slate-500" htmlFor="animal-species">
            Species
          </label>
          <select
            id="animal-species"
            value={formState.species}
            onChange={(event) => onFieldChange('species', event.target.value as Species | '')}
            className={fieldClassName}
            disabled={isSaving}
          >
            <option value="">Choose species</option>
            {speciesOptions.map((species) => (
              <option key={species} value={species}>
                {species}
              </option>
            ))}
          </select>
          {formErrors.species ? (
            <p className="mt-1 text-xs font-bold text-rose-600">{formErrors.species}</p>
          ) : null}
        </div>

        <div>
          <label className="text-xs font-black uppercase tracking-wide text-slate-500" htmlFor="animal-age">
            Age
          </label>
          <input
            id="animal-age"
            type="number"
            min="0"
            value={formState.age_years}
            onChange={(event) => onFieldChange('age_years', event.target.value)}
            className={fieldClassName}
            disabled={isSaving}
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs font-black uppercase tracking-wide text-slate-500" htmlFor="animal-size">
            Size
          </label>
          <select
            id="animal-size"
            value={formState.size}
            onChange={(event) => onFieldChange('size', event.target.value as Animal['size'])}
            className={fieldClassName}
            disabled={isSaving}
          >
            {sizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-black uppercase tracking-wide text-slate-500" htmlFor="animal-status">
            Status
          </label>
          <select
            id="animal-status"
            value={formState.status}
            onChange={(event) => onFieldChange('status', event.target.value as AnimalStatus)}
            className={fieldClassName}
            disabled={isSaving}
          >
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs font-black uppercase tracking-wide text-slate-500" htmlFor="animal-description">
          Description
        </label>
        <textarea
          id="animal-description"
          value={formState.description}
          onChange={(event) => onFieldChange('description', event.target.value)}
          className={`${fieldClassName} min-h-28 resize-none leading-6`}
          placeholder="Temperament, medical notes, or adoption readiness..."
          disabled={isSaving}
        />
      </div>

      <ActionBar className="rounded-2xl">
        <Button type="submit" fullWidth disabled={isSaving}>
          {isSaving ? 'Saving...' : formMode === 'create' ? 'Create animal' : 'Save changes'}
        </Button>
        <Button type="button" onClick={onCancel} variant="secondary" fullWidth disabled={isSaving}>
          Cancel
        </Button>
      </ActionBar>
    </form>
  )
}
