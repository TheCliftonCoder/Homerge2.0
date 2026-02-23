import { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

const PROPERTY_TYPES = [
    { value: '', label: 'Any' },
    { value: 'detached', label: 'Detached' },
    { value: 'semi_detached', label: 'Semi-Detached' },
    { value: 'terraced', label: 'Terraced' },
    { value: 'flat', label: 'Flat' },
    { value: 'bungalow', label: 'Bungalow' },
];

const BEDROOM_OPTIONS = [
    { value: '', label: 'Any' },
    { value: '1', label: '1' },
    { value: '2', label: '2' },
    { value: '3', label: '3' },
    { value: '4', label: '4' },
    { value: '5', label: '5+' },
];

const LAST_ACTIVITY_OPTIONS = [
    { value: '', label: 'Any time' },
    { value: '24h', label: 'Last 24 hours' },
    { value: '48h', label: 'Last 48 hours' },
    { value: '7d', label: 'Last 7 days' },
    { value: '1m', label: 'Last month' },
    { value: '6m', label: 'Last 6 months' },
];

const ACTIVITY_LEVEL_OPTIONS = [
    { value: '', label: 'Any' },
    { value: 'low', label: 'Low (1–3)' },
    { value: 'medium', label: 'Medium (4–7)' },
    { value: 'high', label: 'High (8+)' },
];

function formatPrice(price) {
    if (!price) return 'N/A';
    return new Intl.NumberFormat('en-GB', {
        style: 'currency', currency: 'GBP', minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(price);
}

function formatPropertyType(type) {
    const map = {
        detached: 'Detached', semi_detached: 'Semi-Detached', terraced: 'Terraced',
        flat: 'Flat', bungalow: 'Bungalow', retail: 'Retail', other: 'Other',
    };
    return map[type] || type;
}

// ─── Compact search result card ─────────────────────────────────────────────
function ApplicantResultCard({ applicant }) {
    const { analytics, activity_type } = applicant;
    const isFav = activity_type === 'favourites';

    const accentBg = isFav ? 'bg-indigo-600' : 'bg-emerald-600';
    const badgeBg = isFav ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700';
    const bedroomBadge = isFav ? 'bg-violet-100 text-violet-700' : 'bg-teal-100 text-teal-700';

    return (
        <div className="group overflow-hidden rounded-2xl bg-white shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
            {/* Header */}
            <div className={`${accentBg} px-5 py-4 text-white`}>
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <h3 className="truncate text-lg font-bold">{applicant.name}</h3>
                        <p className="truncate text-sm opacity-80">{applicant.email}</p>
                    </div>
                    <div className="shrink-0 rounded-full bg-white/20 px-3 py-1 text-sm font-semibold backdrop-blur-sm">
                        {analytics.count} {isFav ? '♥' : '✉'}
                    </div>
                </div>
            </div>

            <div className="p-5 space-y-3">
                {/* Price range */}
                {(analytics.price_min || analytics.price_max) && (
                    <div className="rounded-lg bg-gray-50 px-3 py-2">
                        <p className="mb-0.5 text-xs font-medium text-gray-500">Price Range</p>
                        <p className="text-sm font-semibold text-gray-900">
                            {formatPrice(analytics.price_min)} – {formatPrice(analytics.price_max)}
                        </p>
                        {analytics.price_avg && (
                            <p className="text-xs text-gray-400">Avg: {formatPrice(analytics.price_avg)}</p>
                        )}
                    </div>
                )}

                {/* Top locations */}
                {analytics.top_locations?.length > 0 && (
                    <div>
                        <p className="mb-1 text-xs font-medium text-gray-500">Top Locations</p>
                        <div className="flex flex-wrap gap-1">
                            {analytics.top_locations.map((loc, i) => (
                                <span key={i} className={`rounded-full px-2 py-0.5 text-xs font-medium ${badgeBg}`}>
                                    {loc.name} ({loc.count})
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Top property types */}
                {analytics.top_property_types?.length > 0 && (
                    <div>
                        <p className="mb-1 text-xs font-medium text-gray-500">Property Types</p>
                        <div className="flex flex-wrap gap-1">
                            {analytics.top_property_types.map((t, i) => (
                                <span key={i} className={`rounded-full px-2 py-0.5 text-xs font-medium ${badgeBg}`}>
                                    {formatPropertyType(t.name)} ({t.count})
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Bedroom stats */}
                {analytics.bedroom_stats?.modal?.length > 0 && (
                    <div>
                        <p className="mb-1 text-xs font-medium text-gray-500">Bedrooms</p>
                        <div className="rounded-lg bg-gray-50 p-2">
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                                <span>Min: <span className="font-semibold text-gray-800">{analytics.bedroom_stats.min}</span></span>
                                <span>Max: <span className="font-semibold text-gray-800">{analytics.bedroom_stats.max}</span></span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                                {analytics.bedroom_stats.modal.map((item, i) => (
                                    <span key={i} className={`rounded-full px-2 py-0.5 text-xs font-medium ${bedroomBadge}`}>
                                        {item.bedrooms} bed ({item.count})
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Last activity */}
                {analytics.days_since_last !== null && (
                    <p className="text-xs text-gray-400 text-right pt-1">
                        Last {isFav ? 'favourited' : 'enquiry'}:{' '}
                        <span className="font-medium text-gray-600">
                            {analytics.days_since_last === 0
                                ? 'today'
                                : `${analytics.days_since_last} day${analytics.days_since_last === 1 ? '' : 's'} ago`}
                        </span>
                    </p>
                )}
            </div>
        </div>
    );
}

// ─── Label + field wrapper ───────────────────────────────────────────────────
function Field({ label, children }) {
    return (
        <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
            {children}
        </div>
    );
}

const inputCls = 'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100';

// ─── Main page ───────────────────────────────────────────────────────────────
export default function ApplicantSearch({ filters: initialFilters, applicants, searched }) {
    const { auth } = usePage().props;
    const [filters, setFilters] = useState(initialFilters);

    const set = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));

    const handleSearch = (e) => {
        e?.preventDefault();
        router.get(route('agent.applicant-search'), filters, { preserveScroll: true });
    };

    const handleClear = () => {
        const cleared = {
            activity_type: 'favourites',
            transaction_type: '',
            price_min: '',
            price_max: '',
            bedrooms_min: '',
            bedrooms_max: '',
            last_activity: '',
            property_type: '',
            location: '',
            activity_level: '',
        };
        setFilters(cleared);
        router.get(route('agent.applicant-search'), cleared, { preserveScroll: true });
    };

    // Re-search immediately when the primary toggles change
    const handleToggle = (key, value) => {
        const updated = { ...filters, [key]: value };
        setFilters(updated);
        router.get(route('agent.applicant-search'), updated, { preserveScroll: true });
    };

    const hasActiveFilters = [
        filters.transaction_type, filters.price_min, filters.price_max,
        filters.bedrooms_min, filters.bedrooms_max, filters.last_activity,
        filters.property_type, filters.location, filters.activity_level,
    ].some(v => v !== '');

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex items-center gap-3">
                    <svg className="h-6 w-6 text-indigo-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                    </svg>
                    <h2 className="text-xl font-semibold text-gray-800">Applicant Search</h2>
                </div>
            }
        >
            <Head title="Applicant Search" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">

                    {/* ── Primary Toggle Row ─────────────────────────────── */}
                    <div className="rounded-2xl bg-white shadow-lg p-6">
                        <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-400">Search by activity</p>
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">

                            {/* Activity Type */}
                            <div>
                                <p className="mb-2 text-sm font-semibold text-gray-700">Activity Type</p>
                                <div className="flex rounded-xl bg-gray-100 p-1">
                                    {['favourites', 'enquiries'].map(type => (
                                        <button
                                            key={type}
                                            onClick={() => handleToggle('activity_type', type)}
                                            className={`flex-1 rounded-lg px-5 py-2 text-sm font-semibold transition-all duration-200 ${filters.activity_type === type
                                                    ? 'bg-indigo-600 text-white shadow'
                                                    : 'text-gray-500 hover:text-gray-700'
                                                }`}
                                        >
                                            {type === 'favourites' ? '♥ Favourites' : '✉ Enquiries'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Transaction Type */}
                            <div>
                                <p className="mb-2 text-sm font-semibold text-gray-700">Transaction Type</p>
                                <div className="flex rounded-xl bg-gray-100 p-1">
                                    {[['', 'All'], ['sale', 'Sales'], ['rental', 'Lettings']].map(([val, label]) => (
                                        <button
                                            key={val}
                                            onClick={() => handleToggle('transaction_type', val)}
                                            className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 ${filters.transaction_type === val
                                                    ? 'bg-indigo-600 text-white shadow'
                                                    : 'text-gray-500 hover:text-gray-700'
                                                }`}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Filter Grid ────────────────────────────────────── */}
                    <form onSubmit={handleSearch} className="rounded-2xl bg-white shadow-lg p-6">
                        <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-400">Refine results</p>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

                            {/* Price min */}
                            <Field label="Min Price (£)">
                                <input
                                    type="number" min="0" placeholder="e.g. 200000"
                                    value={filters.price_min}
                                    onChange={e => set('price_min', e.target.value)}
                                    className={inputCls}
                                />
                            </Field>

                            {/* Price max */}
                            <Field label="Max Price (£)">
                                <input
                                    type="number" min="0" placeholder="e.g. 500000"
                                    value={filters.price_max}
                                    onChange={e => set('price_max', e.target.value)}
                                    className={inputCls}
                                />
                            </Field>

                            {/* Bedrooms min */}
                            <Field label="Min Bedrooms">
                                <select value={filters.bedrooms_min} onChange={e => set('bedrooms_min', e.target.value)} className={inputCls}>
                                    {BEDROOM_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </select>
                            </Field>

                            {/* Bedrooms max */}
                            <Field label="Max Bedrooms">
                                <select value={filters.bedrooms_max} onChange={e => set('bedrooms_max', e.target.value)} className={inputCls}>
                                    {BEDROOM_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </select>
                            </Field>

                            {/* Property type */}
                            <Field label="Property Type">
                                <select value={filters.property_type} onChange={e => set('property_type', e.target.value)} className={inputCls}>
                                    {PROPERTY_TYPES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </select>
                            </Field>

                            {/* Location */}
                            <Field label="Location">
                                <input
                                    type="text" placeholder="e.g. Reading"
                                    value={filters.location}
                                    onChange={e => set('location', e.target.value)}
                                    className={inputCls}
                                />
                            </Field>

                            {/* Last activity */}
                            <Field label="Last Activity">
                                <select value={filters.last_activity} onChange={e => set('last_activity', e.target.value)} className={inputCls}>
                                    {LAST_ACTIVITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </select>
                            </Field>

                            {/* Activity level */}
                            <Field label="Activity Level">
                                <select value={filters.activity_level} onChange={e => set('activity_level', e.target.value)} className={inputCls}>
                                    {ACTIVITY_LEVEL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </select>
                            </Field>
                        </div>

                        {/* Action buttons */}
                        <div className="mt-5 flex items-center gap-3">
                            <button
                                type="submit"
                                className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 active:scale-95 transition-all duration-150"
                            >
                                Search
                            </button>
                            {(searched || hasActiveFilters) && (
                                <button
                                    type="button"
                                    onClick={handleClear}
                                    className="rounded-xl border border-gray-200 bg-white px-6 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 active:scale-95 transition-all duration-150"
                                >
                                    Clear Filters
                                </button>
                            )}
                        </div>
                    </form>

                    {/* ── Results ────────────────────────────────────────── */}
                    {searched && (
                        <div>
                            {/* Result count bar */}
                            <div className="mb-4 flex items-center justify-between">
                                <p className="text-sm text-gray-600">
                                    {applicants.length === 0
                                        ? 'No applicants found matching your criteria.'
                                        : <><span className="font-semibold text-gray-900">{applicants.length}</span> applicant{applicants.length !== 1 ? 's' : ''} found</>}
                                </p>
                                <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${filters.activity_type === 'favourites'
                                        ? 'bg-indigo-100 text-indigo-700'
                                        : 'bg-emerald-100 text-emerald-700'
                                    }`}>
                                    {filters.activity_type === 'favourites' ? '♥ Favourites only' : '✉ Enquiries only'}
                                </span>
                            </div>

                            {/* Grid */}
                            {applicants.length > 0 ? (
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                    {applicants.map(applicant => (
                                        <ApplicantResultCard key={applicant.id} applicant={applicant} />
                                    ))}
                                </div>
                            ) : (
                                /* Empty state */
                                <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-20 shadow-lg text-center">
                                    <svg className="mb-4 h-14 w-14 text-gray-200" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                                    </svg>
                                    <p className="text-lg font-semibold text-gray-400">No applicants found</p>
                                    <p className="mt-1 text-sm text-gray-400">Try adjusting your filters or clearing them to see more results.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Initial state (no search yet) ──────────────────── */}
                    {!searched && (
                        <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-24 shadow-lg text-center">
                            <svg className="mb-4 h-16 w-16 text-indigo-100" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                            </svg>
                            <p className="text-xl font-bold text-gray-300">Search for applicants</p>
                            <p className="mt-1 text-sm text-gray-400">
                                Choose an activity type, apply your filters, then hit <span className="font-semibold">Search</span>.
                            </p>
                        </div>
                    )}

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
