import React, { useState } from 'react'
import {InputField, TextAreaField} from './FormField';

const inputClass =
  'w-full bg-brand-bg border border-brand-border rounded-lg px-4 py-2 text-sm text-brand-text ' +
  'placeholder:text-brand-muted focus:outline-none focus:border-brand-accent disabled:opacity-60';

export default function CreateCityForm ({onSubmit, submitting = false}) {
    const [values, setValues] = useState({
        name: "",
        country: "",
        latitude: 0,
        longitude: 0,
        wikiTitle: "",
        scores: {
            HOUSING: 0,
            COST_OF_LIVING: 0,
            STARTUPS: 0,
            VENTURE_CAPITAL: 0,
            TRAVEL_CONNECTIVITY: 0,
            COMMUTE: 0,
            BUSINESS_FREEDOM: 0,
            SAFETY: 0,
            HEALTHCARE: 0,
            EDUCATION: 0,
            ENVIRONMENTAL_QUALITY: 0,
            ECONOMY: 0,
            TAXATION: 0,
            INTERNET_ACCESS: 0,
            LEISURE_CULTURE: 0,
            TOLERANCE: 0,
            OUTDOORS: 0, 
        }
    })
    const [errors, setErrors] = useState({});

    function handleChange(e) {
        const {name, value} = e.target
        if (name === "name" || name === "country" || name === "latitude" ||
            name === "longitude" || name==="wikiTitle") {

            setValues((v) => ({ ...v, [name]: value }))

        } else {
            setValues((v) => ({ ...v, scores:{...v.scores, [name]: value} }))
        }
    }

    function validateFields(){
        const foundErrors = { scores:{}}

        if(!values.name.trim() || values.name.trim().length > 120) {
            foundErrors.name = 'Name must be between 1 and 120 characters.'
        }

        if(!values.country.trim() || values.country.trim().length > 120) {
            foundErrors.country = 'Country must be between 1 and 120 characters.'
        }

        if(values.latitude < -90 || values.latitude > 90) { 
            foundErrors.latitude = 'Latitude must be between -90 and 90.'
        }

        if(values.longitude < -180 || values.longitude > 180) {
            foundErrors.longitude = 'Longitude must be between -180 and 180.'
        }

        if(values.wikiTitle.trim().length > 200) {
            foundErrors.wikiTitle = 'Wikipedia title mus be less than 200 characters.'
        }

        for (const [key, value] of Object.entries(values.scores)){
            if(value < 0 || value > 10) found.scores[key] = `${key} must be between 0 and 10.`
        }

        if (Object.keys(foundErrors.scores).length === 0) {
            delete foundErrors.scores;
        }

        return foundErrors
    }


    async function handleSubmit(e) {
        e.preventDefault();

        const foundErrors = validateFields();
        setErrors(foundErrors);

        if (Object.keys(foundErrors).length > 0) return;

        const payload = {
            name: values.name.trim(),
            country: values.country.trim(),
            latitude: values.latitude,
            longitude: values.longitude,
            wikiTitle: values.wikiTitle.trim(),
            scores: Object.entries(values.scores).map(([id, score]) => ({
                "id": id, "scoreOutOf10": score
            })),
        }

        await onSubmit(payload);
  }

  return (
    <form onSubmit={handleSubmit} className='flex flex-col gap-4' >
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-6'>
            <InputField
                name="name"
                type="text"
                value={values.name}
                handleChange={handleChange}
                error={errors.name}
                placeholder="e.g. Nairobi"
                maxLength={120}
            />
            <InputField
                name="country"
                type="text"
                value={values.country}
                handleChange={handleChange}
                error={errors.country}
                placeholder="e.g. Kenya"
                maxLength={120}
            />
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-2 gap-6'>
            <InputField
                name="latitude"
                type="number"
                value={values.latitude}
                handleChange={handleChange}
                error={errors.latitude}
                placeholder="e.g. latitude"
                min={-90}
                max={90}
                step="any"
            />
            <InputField
                name="longitude"
                type="number"
                value={values.longitude}
                handleChange={handleChange}
                error={errors.longitude}
                placeholder="e.g. longitude"
                min={-180}
                max={180}
                step="any"
            />
        </div>

        <TextAreaField
            name="wikiTitle"
            label="Wikipedia Title"
            value={values.wikiTitle}
            handleChange={handleChange}
            error={errors.wikiTitle}
            placeholder="e.g. Nairobi is capital city in Kenya"
            maxLength={200}
            rows={3}
        />

        <div className='flex flex-col gap-4 pt-6'>
            <h3 className='text-md font-medium text-brand-muted'>Fill in city livebility scores</h3>

            <div className='grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-6'>
                {
                    Object.entries(values.scores).map(([key, value]) => (
                        <InputField
                            name={key}
                            type="number"
                            value={value}
                            handleChange={handleChange}
                            error={errors.scores?.[key]}
                            min={0}
                            max={10}
                            step="any"
                            key={key}
                        />
                    ))
                }

            </div>

        </div>

        <div className='pt-4'>
            <button 
                type="submit"
                disabled={submitting} 
                className="w-full px-5 py-2 rounded-pill bg-brand-accent text-brand-bg font-medium hover:opacity-90 transition-opacity">
                {submitting ? "Adding city...": "Add City"}
            </button>
        </div>
    </form>
  )
}