// ItineraryForm.jsx — create (initialValues = null) or edit an itinerary.
// Props documented in docs/prop-contracts.md.
// In edit mode the city is locked because the API can't change city_id.

import { useState } from 'react';

const inputClass =
  'w-full bg-brand-bg border border-brand-border rounded-card px-4 py-2 text-sm text-brand-text ' +
  'placeholder:text-brand-muted focus:outline-none focus:border-brand-accent disabled:opacity-60';

function ItineraryForm({ initialValues, cities, onSubmit, onCancel }) {
  const isEdit = Boolean(initialValues);

  const [values, setValues] = useState({
    cityId: initialValues?.cityId ?? '',
    title: initialValues?.title ?? '',
    startDate: initialValues?.startDate ?? '',
    endDate: initialValues?.endDate ?? '',
    notes: initialValues?.notes ?? '',
  });
  const [errors, setErrors] = useState({});

  function handleChange(field) {
    return (e) => setValues((v) => ({ ...v, [field]: e.target.value }));
  }

  function validate() {
    const found = {};
    if (!values.cityId) found.cityId = 'Choose a city.';
    if (!values.title.trim()) found.title = 'Enter a title.';
    if (!values.startDate) found.startDate = 'Choose a start date.';
    if (!values.endDate) found.endDate = 'Choose an end date.';
    if (values.startDate && values.endDate && values.endDate < values.startDate) {
      found.endDate = 'End date can’t be before the start date.';
    }
    return found;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    onSubmit({
      cityId: values.cityId,
      title: values.title.trim(),
      startDate: values.startDate,
      endDate: values.endDate,
      notes: values.notes.trim(),
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-brand-surface border border-brand-border rounded-card p-6 sm:p-8 space-y-5 max-w-xl"
    >
      <h2 className="font-display text-2xl text-brand-text">
        {isEdit ? 'Edit itinerary' : 'New itinerary'}
      </h2>

      <div>
        <label className="block text-sm text-brand-muted mb-1">City</label>
        <select
          value={values.cityId}
          onChange={handleChange('cityId')}
          disabled={isEdit}
          className={inputClass}
        >
          <option value="">Select a city</option>
          {cities.map((c) => (
            <option key={c.id} value={c.id}>
              {c.fullName || c.name}
            </option>
          ))}
        </select>
        {errors.cityId && <p className="text-brand-danger text-xs mt-1">{errors.cityId}</p>}
      </div>

      <div>
        <label className="block text-sm text-brand-muted mb-1">Title</label>
        <input
          type="text"
          value={values.title}
          onChange={handleChange('title')}
          placeholder="e.g. Lisbon workation"
          className={inputClass}
        />
        {errors.title && <p className="text-brand-danger text-xs mt-1">{errors.title}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-brand-muted mb-1">Start date</label>
          <input
            type="date"
            value={values.startDate}
            onChange={handleChange('startDate')}
            className={inputClass}
          />
          {errors.startDate && (
            <p className="text-brand-danger text-xs mt-1">{errors.startDate}</p>
          )}
        </div>
        <div>
          <label className="block text-sm text-brand-muted mb-1">End date</label>
          <input
            type="date"
            value={values.endDate}
            onChange={handleChange('endDate')}
            className={inputClass}
          />
          {errors.endDate && (
            <p className="text-brand-danger text-xs mt-1">{errors.endDate}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm text-brand-muted mb-1">Notes (optional)</label>
        <textarea
          rows={3}
          value={values.notes}
          onChange={handleChange('notes')}
          className={inputClass}
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2 text-sm text-brand-muted hover:text-brand-text transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-5 py-2 rounded-pill bg-brand-accent text-brand-bg font-medium hover:opacity-90 transition-opacity"
        >
          Save
        </button>
      </div>
    </form>
  );
}

export default ItineraryForm;