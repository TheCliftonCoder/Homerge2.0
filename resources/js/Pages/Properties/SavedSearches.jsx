import { useState } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function SavedSearches({ auth, savedSearches }) {
    const [editingSearchId, setEditingSearchId] = useState(null);
    const [editingName, setEditingName] = useState('');

    const startEditing = (id, currentName) => {
        setEditingSearchId(id);
        setEditingName(currentName);
    };

    const cancelEditing = () => {
        setEditingSearchId(null);
        setEditingName('');
    };

    const saveName = (id) => {
        if (!editingName.trim()) {
            cancelEditing();
            return;
        }

        const search = savedSearches.find((s) => s.id === id);
        if (search && search.name === editingName.trim()) {
            cancelEditing();
            return;
        }

        router.patch(`/searches/${id}`, {
            name: editingName.trim()
        }, {
            preserveState: true,
            onSuccess: () => cancelEditing(),
            onError: () => cancelEditing()
        });
    };

    const describeFilters = (filters) => {
        const parts = [];
        if (filters.location) {
            let loc = filters.location;
            if (filters.radius) loc += ` + ${filters.radius}mi`;
            parts.push(loc);
        }
        if (filters.min_price || filters.max_price) {
            parts.push(`£${filters.min_price || 0} - ${filters.max_price ? '£' + filters.max_price : 'Any'}`);
        }
        if (filters.property_category) {
            parts.push(filters.property_category === 'residential' ? 'Residential' : 'Commercial');
        }
        if (filters.transaction_type) {
            parts.push(filters.transaction_type === 'sale' ? 'For Sale' : 'For Rent');
        }
        if (filters.bedrooms) {
            parts.push(`${filters.bedrooms}+ Beds`);
        }
        
        // Count active display/filter pins
        const poiProximity = filters.poi_proximity || [];
        const proximityPins = filters.proximity_pins || [];
        const activePinsCount = poiProximity.length + proximityPins.length;
        if (activePinsCount > 0) {
            parts.push(`${activePinsCount} Pin${activePinsCount === 1 ? '' : 's'}`);
        }
        
        return parts.join(' | ') || 'All Properties';
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="My Saved Searches" />

            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    
                    {usePage().props.flash?.success && (
                        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold rounded-xl flex items-center justify-between shadow-sm animate-in fade-in duration-300">
                            <span>{usePage().props.flash.success}</span>
                        </div>
                    )}

                    <div className="mb-8">
                        <h1 className="text-4xl font-bold text-gray-900">My Saved Searches</h1>
                        <p className="mt-2 text-lg text-gray-600">
                            {savedSearches.length} / 5 searches saved
                        </p>
                    </div>

                    {savedSearches.length > 0 ? (
                        <div className="space-y-4">
                            {savedSearches.map((search) => (
                                <div 
                                    key={search.id} 
                                    className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4"
                                >
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-3 flex-wrap">
                                            {editingSearchId === search.id ? (
                                                <input
                                                    type='text'
                                                    value={editingName}
                                                    onChange={(e) => setEditingName(e.target.value)}
                                                    onBlur={() => saveName(search.id)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            saveName(search.id);
                                                        } else if (e.key === 'Escape') {
                                                            cancelEditing();
                                                        }
                                                    }}
                                                    className='text-lg font-bold text-gray-900 bg-transparent border-b-2 border-indigo-600 focus:outline-none focus:ring-0 py-0 px-1 w-full max-w-md'
                                                    autoFocus
                                                />
                                            ) : (
                                                <h3 
                                                    onClick={() => startEditing(search.id, search.name)}
                                                    className='text-lg font-bold text-gray-900 truncate cursor-pointer hover:text-indigo-600 transition-colors'
                                                    title='Click to rename'
                                                >
                                                    {search.name}
                                                </h3>
                                            )}
                                            {search.new_count > 0 ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase tracking-wider animate-pulse">
                                                    {search.new_count} new properties
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-50 text-gray-500 border border-gray-100 uppercase tracking-wider">
                                                    No new properties
                                                </span>
                                            )}
                                        </div>
                                        <p className="mt-1 text-sm text-gray-500 font-medium">
                                            {describeFilters(search.filters)}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-3 shrink-0">
                                        <Link
                                            href="/search"
                                            data={search.filters}
                                            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-md hover:bg-indigo-700 active:scale-95 transition-all duration-150"
                                        >
                                            Run Search
                                        </Link>
                                        <Link
                                            href={`/searches/${search.id}`}
                                            method="delete"
                                            as="button"
                                            className="inline-flex items-center justify-center rounded-xl border border-red-200 hover:border-red-300 hover:bg-red-50 px-5 py-3 text-sm font-bold text-red-600 active:scale-95 transition-all duration-150"
                                        >
                                            Delete
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-2xl bg-white p-12 text-center shadow-xl">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 text-indigo-500">
                                <svg 
                                    className="h-8 w-8" 
                                    fill="none" 
                                    stroke="currentColor" 
                                    viewBox="0 0 24 24"
                                >
                                    <path 
                                        strokeLinecap="round" 
                                        strokeLinejoin="round" 
                                        strokeWidth={2} 
                                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                                    />
                                </svg>
                            </div>
                            <h3 className="mt-4 text-xl font-semibold text-gray-900">No saved searches yet</h3>
                            <p className="mt-2 text-gray-600">Apply search filters and click Save Search to track property updates</p>
                            <Link
                                href="/search"
                                className="mt-6 inline-block rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700"
                            >
                                Search Properties
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
