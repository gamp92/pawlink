import { useState } from 'react'
import {
  Field,
  inputClassName,
  SegmentedControl,
  textareaClassName,
} from '@/components/public/lost-found/form-controls'
import type { LostFoundReportForm } from '@/components/public/lost-found/types'
import type { ReportType, Species } from '@/lib/mock-data'

type Props = {
  form: LostFoundReportForm
  errors: Partial<Record<keyof LostFoundReportForm, string>>
  updateField: <FieldName extends keyof LostFoundReportForm>(
    field: FieldName,
    value: LostFoundReportForm[FieldName],
  ) => void
}

export function PetInformationStep({ form, errors, updateField }: Props) {
  const [showMoreDetails, setShowMoreDetails] = useState(Boolean(form.pet_name || form.breed))

  return (
    <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
      <aside className="lg:sticky lg:top-2 lg:self-start">
        <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-lg shadow-slate-100">
          <div className="relative grid h-44 place-items-center bg-gradient-to-br from-violet-100 via-white to-teal-100">
            <div className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[11px] font-black text-slate-700 shadow-sm">
              {form.species || 'species'}
            </div>
            <div className="absolute right-3 top-3 rounded-full bg-violet-600 px-3 py-1 text-[11px] font-black text-white shadow-sm">
              {form.report_type}
            </div>
            <div className="grid h-20 w-20 place-items-center rounded-[1.75rem] bg-white/80 text-5xl font-black text-violet-700 shadow-sm">
              {(form.pet_name || 'P').slice(0, 1)}
            </div>
          </div>
          <div className="p-4">
            <h3 className="truncate text-xl font-black tracking-tight text-slate-950">
              {form.pet_name || (form.report_type === 'found' ? 'Unknown pet' : 'Pet name')}
            </h3>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              {[form.species || 'Species', form.breed || 'breed optional', form.color || 'color'].join(' - ')}
            </p>
            <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
              {form.description || 'Add a short description so neighbors know what to look for.'}
            </p>
          </div>
        </div>
      </aside>

      <div className="public-form-stack">
        <SegmentedControl<ReportType>
          label="Report type"
          value={form.report_type}
          columns="grid-cols-2"
          options={[
            { label: 'Lost', value: 'lost' },
            { label: 'Found', value: 'found' },
          ]}
          onChange={(value) => updateField('report_type', value)}
        />

        <SegmentedControl<Species>
          label="Species"
          value={form.species}
          options={[
            { label: 'Dog', value: 'dog' },
            { label: 'Cat', value: 'cat' },
            { label: 'Other', value: 'other' },
          ]}
          onChange={(value) => updateField('species', value)}
          error={errors.species}
        />

        <Field id="pet-color" label="Color" error={errors.color}>
          <input
            id="pet-color"
            value={form.color}
            onChange={(event) => updateField('color', event.target.value)}
            className={inputClassName}
            placeholder="Brown, white paws, orange tabby..."
          />
        </Field>

        <Field id="pet-description" label="Short description" error={errors.description}>
          <textarea
            id="pet-description"
            value={form.description}
            onChange={(event) => updateField('description', event.target.value)}
            className={textareaClassName}
            placeholder="Collar, markings, temperament, health details, or how to approach safely."
          />
        </Field>

        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-3 shadow-sm">
          <button
            type="button"
            onClick={() => setShowMoreDetails((current) => !current)}
            className="flex min-h-12 w-full items-center justify-between gap-3 rounded-2xl px-2 text-left focus:outline-none focus:ring-4 focus:ring-violet-100"
            aria-expanded={showMoreDetails}
          >
            <span>
              <span className="block text-sm font-black text-slate-950">Add more identifying details</span>
              <span className="mt-1 block text-xs font-semibold text-slate-500">Name and breed can help neighbors recognize the pet faster.</span>
            </span>
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-100 text-sm font-black text-slate-600">
              {showMoreDetails ? '-' : '+'}
            </span>
          </button>

          {showMoreDetails ? (
            <div className="mt-3 grid gap-3 border-t border-slate-100 pt-3 sm:grid-cols-2">
              <Field id="pet-name" label="Pet name optional" error={errors.pet_name}>
                <input
                  id="pet-name"
                  value={form.pet_name}
                  onChange={(event) => updateField('pet_name', event.target.value)}
                  className={inputClassName}
                  placeholder={form.report_type === 'found' ? 'Unknown is okay' : ''}
                />
              </Field>
              <Field id="pet-breed" label="Breed optional" error={errors.breed}>
                <input
                  id="pet-breed"
                  value={form.breed}
                  onChange={(event) => updateField('breed', event.target.value)}
                  className={inputClassName}
                  placeholder="Persian, golden retriever, mixed..."
                />
              </Field>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
