import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import GuestLayout from '@/Layouts/GuestLayout';
import PropertyCard from '@/Components/PropertyCard';

export default function Search({ auth, properties, filters }) {
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [prompt, setPrompt] = useState('');
    const [promptLoading, setPromptLoading] = useState(false);
    const [promptError, setPromptError] = useState('');

    const [formData, setFormData] = useState({
        location: filters.location || '',
        min_price: filters.min_price || '',
        max_price: filters.max_price || '',
        property_category: filters.property_category || '',
        transaction_type: filters.transaction_type || '',
        bedrooms: filters.bedrooms || '',
        bathrooms: filters.bathrooms || '',
        property_type: filters.property_type || '',
        parking: filters.parking || '',
        garden: filters.garden || '',
        min_size: filters.min_size || '',
        max_size: filters.max_size || '',
        tenure: filters.tenure || '',
        furnished: filters.furnished || '',
        pets_allowed: filters.pets_allowed || '',
        available_from: filters.available_from || '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSearch = (e) => {
        e.preventDefault();
        // Remove empty values
        const cleanFilters = Object.fromEntries(
            Object.entries(formData).filter(([_, value]) => value !== '')
        );
        router.get('/search', cleanFilters, { preserveState: true });
    };

    const handleClear = () => {
        setFormData({
            location: '',
            min_price: '',
            max_price: '',
            property_category: '',
            transaction_type: '',
            bedrooms: '',
            bathrooms: '',
            property_type: '',
            parking: '',
            garden: '',
            min_size: '',
            max_size: '',
            tenure: '',
            furnished: '',
            pets_allowed: '',
            available_from: '',
        });
        router.get('/search');
    };

    const Layout = auth?.user ? AuthenticatedLayout : GuestLayout;

    const activeFilterCount = Object.values(formData).filter(v => v !== '').length;

    // AI prompt handler
    const handlePrompt = async () => {
        if (!prompt.trim()) return;
        setPromptLoading(true);
        setPromptError('');
        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content ?? '';
            const res = await fetch('/search/parse-prompt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken },
                body: JSON.stringify({ prompt }),
            });
            const data = await res.json();
            if (!res.ok) { setPromptError(data.error || 'Something went wrong.'); return; }
            const f = data.filters;
            const merged = {
                ...formData,
                ...(f.transaction_type !== null && f.transaction_type !== undefined ? { transaction_type: f.transaction_type } : {}),
                ...(f.property_category !== null && f.property_category !== undefined ? { property_category: f.property_category } : {}),
                ...(f.property_type !== null && f.property_type !== undefined ? { property_type: f.property_type } : {}),
                ...(f.location !== null && f.location !== undefined ? { location: f.location } : {}),
                ...(f.min_price !== null && f.min_price !== undefined ? { min_price: String(f.min_price) } : {}),
                ...(f.max_price !== null && f.max_price !== undefined ? { max_price: String(f.max_price) } : {}),
                ...(f.bedrooms !== null && f.bedrooms !== undefined ? { bedrooms: String(f.bedrooms) } : {}),
                ...(f.bathrooms !== null && f.bathrooms !== undefined ? { bathrooms: String(f.bathrooms) } : {}),
                ...(f.parking !== null && f.parking !== undefined ? { parking: f.parking } : {}),
                ...(f.garden !== null && f.garden !== undefined ? { garden: f.garden } : {}),
                ...(f.furnished !== null && f.furnished !== undefined ? { furnished: f.furnished } : {}),
                ...(f.pets_allowed !== null && f.pets_allowed !== undefined ? { pets_allowed: f.pets_allowed } : {}),
            };
            setFormData(merged);
            const cleanFilters = Object.fromEntries(Object.entries(merged).filter(([_, v]) => v !== ''));
            router.get('/search', cleanFilters, { preserveState: true });
        } catch {
            setPromptError('Network error. Please try again.');
        } finally {
            setPromptLoading(false);
        }
    };

    return (
        <Layout>
            <Head title="Search Properties" />

            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

                    {/* AI Prompt Panel */}
                    <div className="mb-6 rounded-2xl bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100 shadow-lg p-6">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-lg">✨</span>
                            <p className="text-sm font-semibold text-indigo-700 uppercase tracking-widest">Search by AI prompt</p>
                        </div>
                        <div className="flex gap-3">
                            <textarea
                                rows={2}
                                placeholder='e.g. "3-bed house to buy in Reading under £500k with a garden"'
                                value={prompt}
                                onChange={e => setPrompt(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handlePrompt(); } }}
                                className="flex-1 resize-none rounded-xl border border-indigo-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                            />
                            <button
                                onClick={handlePrompt}
                                disabled={promptLoading || !prompt.trim()}
                                className="shrink-0 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all duration-150"
                            >
                                {promptLoading ? (
                                    <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                    </svg>
                                ) : 'Ask AI'}
                            </button>
                        </div>
                        {promptError && <p className="mt-2 text-sm text-red-600">{promptError}</p>}
                        <p className="mt-3 text-xs text-indigo-400">↓ or fill in filters manually below</p>
                    </div>

                    {/* Sticky Filter Panel */}
                    <div className="sticky top-0 z-10 mb-8">
                        <form onSubmit={handleSearch} className="rounded-2xl bg-white p-6 shadow-xl">
                            <div className="mb-6 flex items-center justify-between">
                                <h1 className="text-3xl font-bold text-gray-900">Search Properties</h1>
                                {activeFilterCount > 0 && (
                                    <span className="rounded-full bg-indigo-100 px-4 py-2 text-sm font-semibold text-indigo-700">
                                        {activeFilterCount} {activeFilterCount === 1 ? 'filter' : 'filters'} active
                                    </span>
                                )}
                            </div>

                            {/* Basic Filters */}
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                                {/* Location */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Location</label>
                                    <input
                                        type="text"
                                        name="location"
                                        value={formData.location}
                                        onChange={handleChange}
                                        placeholder="e.g., London, Manchester"
                                        className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    />
                                </div>

                                {/* Min Price */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Min Price (£)</label>
                                    <input
                                        type="number"
                                        name="min_price"
                                        value={formData.min_price}
                                        onChange={handleChange}
                                        placeholder="0"
                                        className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    />
                                </div>

                                {/* Max Price */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Max Price (£)</label>
                                    <input
                                        type="number"
                                        name="max_price"
                                        value={formData.max_price}
                                        onChange={handleChange}
                                        placeholder="No limit"
                                        className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    />
                                </div>

                                {/* Property Category */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Category</label>
                                    <select
                                        name="property_category"
                                        value={formData.property_category}
                                        onChange={handleChange}
                                        className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    >
                                        <option value="">All</option>
                                        <option value="Residential">Residential</option>
                                        <option value="Commercial">Commercial</option>
                                    </select>
                                </div>

                                {/* Transaction Type */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Type</label>
                                    <select
                                        name="transaction_type"
                                        value={formData.transaction_type}
                                        onChange={handleChange}
                                        className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    >
                                        <option value="">All</option>
                                        <option value="Sales">For Sale</option>
                                        <option value="Rental">For Rent</option>
                                    </select>
                                </div>

                                {/* Bedrooms */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Min Bedrooms</label>
                                    <select
                                        name="bedrooms"
                                        value={formData.bedrooms}
                                        onChange={handleChange}
                                        className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    >
                                        <option value="">Any</option>
                                        <option value="1">1+</option>
                                        <option value="2">2+</option>
                                        <option value="3">3+</option>
                                        <option value="4">4+</option>
                                        <option value="5">5+</option>
                                    </select>
                                </div>

                                {/* Property Type */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Property Type</label>
                                    <select
                                        name="property_type"
                                        value={formData.property_type}
                                        onChange={handleChange}
                                        className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    >
                                        <option value="">All Types</option>
                                        <optgroup label="Residential">
                                            <option value="detached">Detached</option>
                                            <option value="semi_detached">Semi-Detached</option>
                                            <option value="terraced">Terraced</option>
                                            <option value="flat">Flat</option>
                                            <option value="bungalow">Bungalow</option>
                                        </optgroup>
                                        <optgroup label="Commercial">
                                            <option value="retail">Retail</option>
                                            <option value="leisure">Leisure</option>
                                            <option value="industrial">Industrial</option>
                                            <option value="land_development">Land/Development</option>
                                            <option value="other">Other</option>
                                        </optgroup>
                                    </select>
                                </div>
                            </div>

                            {/* Advanced Filters Toggle */}
                            <div className="mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowAdvanced(!showAdvanced)}
                                    className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
                                >
                                    <svg
                                        className={`h-5 w-5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                    {showAdvanced ? 'Hide' : 'Show'} Advanced Filters
                                </button>
                            </div>

                            {/* Advanced Filters */}
                            {showAdvanced && (
                                <div className="mt-6 grid grid-cols-1 gap-4 border-t border-gray-200 pt-6 md:grid-cols-2 lg:grid-cols-4">
                                    {/* Min Size */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Min Size (sqft)</label>
                                        <input
                                            type="number"
                                            name="min_size"
                                            value={formData.min_size}
                                            onChange={handleChange}
                                            placeholder="0"
                                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        />
                                    </div>

                                    {/* Max Size */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Max Size (sqft)</label>
                                        <input
                                            type="number"
                                            name="max_size"
                                            value={formData.max_size}
                                            onChange={handleChange}
                                            placeholder="No limit"
                                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        />
                                    </div>

                                    {/* Bathrooms */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Min Bathrooms</label>
                                        <select
                                            name="bathrooms"
                                            value={formData.bathrooms}
                                            onChange={handleChange}
                                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        >
                                            <option value="">Any</option>
                                            <option value="1">1+</option>
                                            <option value="2">2+</option>
                                            <option value="3">3+</option>
                                        </select>
                                    </div>

                                    {/* Parking */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Parking</label>
                                        <select
                                            name="parking"
                                            value={formData.parking}
                                            onChange={handleChange}
                                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        >
                                            <option value="">Any</option>
                                            <option value="street">Street</option>
                                            <option value="driveway">Driveway</option>
                                            <option value="garage">Garage</option>
                                        </select>
                                    </div>

                                    {/* Garden */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Garden</label>
                                        <select
                                            name="garden"
                                            value={formData.garden}
                                            onChange={handleChange}
                                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        >
                                            <option value="">Any</option>
                                            <option value="true">Yes</option>
                                            <option value="false">No</option>
                                        </select>
                                    </div>

                                    {/* Tenure (Sales) */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Tenure</label>
                                        <select
                                            name="tenure"
                                            value={formData.tenure}
                                            onChange={handleChange}
                                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        >
                                            <option value="">Any</option>
                                            <option value="freehold">Freehold</option>
                                            <option value="leasehold">Leasehold</option>
                                            <option value="share_of_freehold">Share of Freehold</option>
                                        </select>
                                    </div>

                                    {/* Furnished (Rentals) */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Furnished</label>
                                        <select
                                            name="furnished"
                                            value={formData.furnished}
                                            onChange={handleChange}
                                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        >
                                            <option value="">Any</option>
                                            <option value="furnished">Furnished</option>
                                            <option value="part_furnished">Part Furnished</option>
                                            <option value="unfurnished">Unfurnished</option>
                                        </select>
                                    </div>

                                    {/* Pets Allowed (Rentals) */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Pets Allowed</label>
                                        <select
                                            name="pets_allowed"
                                            value={formData.pets_allowed}
                                            onChange={handleChange}
                                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        >
                                            <option value="">Any</option>
                                            <option value="true">Yes</option>
                                            <option value="false">No</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="mt-6 flex gap-4">
                                <button
                                    type="submit"
                                    className="flex-1 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:from-indigo-700 hover:to-purple-700 hover:shadow-xl"
                                >
                                    Search Properties
                                </button>
                                <button
                                    type="button"
                                    onClick={handleClear}
                                    className="rounded-lg border-2 border-gray-300 px-6 py-3 font-semibold text-gray-700 transition-all hover:border-gray-400 hover:bg-gray-50"
                                >
                                    Clear Filters
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Results */}
                    <div>
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900">
                                {properties.total} {properties.total === 1 ? 'Property' : 'Properties'} Found
                            </h2>
                        </div>

                        {properties.data.length > 0 ? (
                            <>
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                                    {properties.data.map((property) => (
                                        <PropertyCard key={property.id} property={property} />
                                    ))}
                                </div>

                                {/* Pagination */}
                                {properties.last_page > 1 && (
                                    <div className="mt-8 flex justify-center gap-2">
                                        {properties.links.map((link, index) => (
                                            <button
                                                key={index}
                                                onClick={() => link.url && router.get(link.url)}
                                                disabled={!link.url}
                                                className={`rounded-lg px-4 py-2 font-medium ${link.active
                                                    ? 'bg-indigo-600 text-white'
                                                    : link.url
                                                        ? 'bg-white text-gray-700 hover:bg-gray-50'
                                                        : 'cursor-not-allowed bg-gray-100 text-gray-400'
                                                    }`}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        ))}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="rounded-2xl bg-white p-12 text-center shadow-xl">
                                <svg
                                    className="mx-auto h-16 w-16 text-gray-400"
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
                                <h3 className="mt-4 text-xl font-semibold text-gray-900">No properties found</h3>
                                <p className="mt-2 text-gray-600">Try adjusting your search filters</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
}
