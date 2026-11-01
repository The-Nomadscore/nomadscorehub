import React from 'react'
import { useEffect, useState } from 'react';

import StatsCard from '../components/admin/StatsCard'
import CreateCityForm from '../components/admin/CreateCityForm'
import AdminHeader from '../components/admin/AdminHeader'
import ErrorBanner from '../components/ErrorBanner';

import { fetchAdminStats, createAdminCity } from '../services/api';


export default function AdminPage (){
    const [stats, setStats] = useState(null);
    const [statsLoading, setStatsLoading] = useState(true);
    const [statsError, setStatsError] = useState('');

    const [submitting, setSubmitting] = useState(false);
    const [createError, setCreateError] = useState(null);
    const [createSuccess, setCreateSuccess] = useState('');

    async function loadStats() {
      try {
        setStatsError('');
        const data = await fetchAdminStats();
        setStats(data);
      } catch (error) {
        setStatsError(error.message || 'Failed to load dashboard statistics.');
      } finally {
        setStatsLoading(false);
      }
    }
    useEffect(() => {

    loadStats();
  }, []);

  async function handleCreateCity(values) {
    setSubmitting(true);
    setCreateError(null);
    setCreateSuccess('');

    try {
      await createAdminCity(values);

      setCreateSuccess(`${values.name} has been added successfully.`);

      // Refresh the dashboard statistics after creating the city.
      await loadStats();
    } catch (error) {
      setCreateError(error);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
        <AdminHeader></AdminHeader>
        <main className="mx-auto flex flex-col max-w-[1200px] scroll-mt-20 flex-wrap items-center gap-12 px-4 pb-20 pt-16">

            <section className='w-full flex flex-col gap-4 border-b border-brand-border pb-12'>
                <h2 className="font-display text-xl">
                    Stats
                </h2>
                {statsError && (
                    <ErrorBanner
                    error={statsError}
                    onRetry={loadStats}
                    />
                )}
                <div className='grid grid-cols-2 sm:grid-cols-4 gap-4 justify-between border border-brand-border rounded-xl p-6'>

                    <StatsCard
                        label = "Cities"
                        value = {stats?.cities}
                        loading = {statsLoading} 
                    />
                    <StatsCard
                        label = "Users"
                        value = {stats?.users}
                        loading = {statsLoading} 
                    />
                    <StatsCard
                        label = "Shortlists"
                        value = {stats?.shortlists}
                        loading = {statsLoading} 
                    />
                    <StatsCard
                        label = "Itineraries"
                        value = {stats?.itineraries}
                        loading = {statsLoading} 
                    />
                    
                </div>
            </section>

            <section className='w-full flex flex-col gap-4'>
                <h2 className="font-display text-xl">
                    Add new city
                </h2>
                 {createError && (
                    <ErrorBanner error={createError} />
                )}

                {createSuccess && (
                    <div className="rounded-card border border-brand-accent/40 bg-brand-accent/10 p-4 text-sm text-brand-text">
                    {createSuccess}
                    </div>
                )}
                <CreateCityForm
                    onSubmit={handleCreateCity}
                    submitting={submitting} />
            </section>
        </main>
    </>
  )
}