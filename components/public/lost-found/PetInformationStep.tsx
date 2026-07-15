import {
  Field,
  inputClassName,
  SegmentedControl,
  textareaClassName,
} from '@/components/public/lost-found/form-controls'
import type {
  LostFoundReportForm,
  PetSex,
  PetSize,
} from '@/components/public/lost-found/types'
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
              {[form.breed || 'Breed', form.color || 'color', form.size || 'size'].join(' - ')}
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

        <Field id="pet-name" label="Pet name optional" error={errors.pet_name}>
          <input
            id="pet-name"
            value={form.pet_name}
            onChange={(event) => updateField('pet_name', event.target.value)}
            className={inputClassName}
            placeholder={form.report_type === 'found' ? 'Unknown is okay' : ''}
          />
        </Field>

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

        <div className="grid gap-3 sm:grid-cols-2">
          <Field id="pet-breed" label="Breed optional" error={errors.breed}>
            <input
              id="pet-breed"
              value={form.breed}
              onChange={(event) => updateField('breed', event.target.value)}
              className={inputClassName}
            />
          </Field>
          <Field id="pet-color" label="Color" error={errors.color}>
            <input
              id="pet-color"
              value={form.color}
              onChange={(event) => updateField('color', event.target.value)}
              className={inputClassName}
            />
          </Field>
        </div>

        <SegmentedControl<PetSize>
          label="Size"
          value={form.size}
          options={[
            { label: 'Small', value: 'small' },
            { label: 'Medium', value: 'medium' },
            { label: 'Large', value: 'large' },
          ]}
          onChange={(value) => updateField('size', value)}
          error={errors.size}
        />

        <SegmentedControl<PetSex>
          label="Sex optional"
          value={form.sex}
          options={[
            { label: 'Female', value: 'female' },
            { label: 'Male', value: 'male' },
            { label: 'Unknown', value: 'unknown' },
          ]}
          onChange={(value) => updateField('sex', value)}
          error={errors.sex}
        />

        <Field id="date-lost-seen" label="Date lost or seen" error={errors.date_lost_or_seen}>
          <input
            id="date-lost-seen"
            type="date"
            value={form.date_lost_or_seen}
            onChange={(event) => updateField('date_lost_or_seen', event.target.value)}
            className={inputClassName}
          />
        </Field>

        <Field id="pet-description" label="Description" error={errors.description}>
          <textarea
            id="pet-description"
            value={form.description}
            onChange={(event) => updateField('description', event.target.value)}
            className={textareaClassName}
            placeholder="Collar, temperament, markings, health details, or how to approach safely."
          />
        </Field>
      </div>
    </div>
  )
}
