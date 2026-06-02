import { useState, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PublicLayout from '@/Layouts/PublicLayout';
import PropertyCard from '@/Components/PropertyCard';

const parseBool = (val) => {
    if (val === undefined || val === null) return false;
    if (typeof val === 'boolean') return val;
    const str = String(val).toLowerCase().trim();
    return str === 'true' || str === '1';
};

const assignDisplayFlags = (poiProximity = [], proximityPins = []) => {
    let displayCount = 0;
    
    const shouldDisplay = (p) => {
        if (p.display !== undefined && p.display !== null) {
            return parseBool(p.display);
        }
        return p.pin_mode === 'display';
    };

    // First pass: assign display status to pins that explicitly want display
    const parsedPoi = (poiProximity || []).map(p => {
        const wantsDisplay = shouldDisplay(p);
        let displayVal = null;
        if (wantsDisplay) {
            if (displayCount < 3) {
                displayVal = true;
                displayCount++;
            } else {
                displayVal = false;
            }
        }
        return { ...p, display: displayVal, pin_mode: p.pin_mode || 'filter' };
    });
    
    const parsedPins = (proximityPins || []).map(p => {
        const wantsDisplay = shouldDisplay(p);
        let displayVal = null;
        if (wantsDisplay) {
            if (displayCount < 3) {
                displayVal = true;
                displayCount++;
            } else {
                displayVal = false;
            }
        }
        return { ...p, display: displayVal, pin_mode: p.pin_mode || 'filter' };
    });
    
    // Second pass: fill remaining up to 3 slots with other pins (which had displayVal = null)
    const finalPoi = parsedPoi.map(p => {
        if (p.display === null) {
            if (displayCount < 3) {
                displayCount++;
                return { ...p, display: true };
            } else {
                return { ...p, display: false };
            }
        }
        return p;
    });
    
    const finalPins = parsedPins.map(p => {
        if (p.display === null) {
            if (displayCount < 3) {
                displayCount++;
                return { ...p, display: true };
            } else {
                return { ...p, display: false };
            }
        }
        return p;
    });
    
    return {
        poi_proximity: finalPoi,
        proximity_pins: finalPins
    };
};

const normalizeFiltersForComparison = (filters) => {
    if (!filters) return {};
    const normalized = {};

    const scalarKeys = [
        'location', 'radius', 'min_price', 'max_price', 
        'property_category', 'transaction_type', 'bedrooms', 
        'bathrooms', 'property_type', 'parking', 'garden', 
        'min_size', 'max_size', 'tenure', 'furnished', 
        'pets_allowed', 'available_from'
    ];

    scalarKeys.forEach(key => {
        const val = filters[key];
        if (val !== undefined && val !== null && val !== '') {
            normalized[key] = String(val).trim().toLowerCase();
        }
    });

    const pins = filters.proximity_pins || [];
    const normalizedPins = pins
        .filter(p => p && p.query)
        .map(p => {
            return {
                type: (p.type || 'commute').toLowerCase(),
                query: String(p.query).trim().toLowerCase(),
                value: p.value ? parseFloat(p.value) : null,
                mode: p.mode ? String(p.mode).trim().toLowerCase() : null,
                pin_mode: (p.pin_mode || 'filter').toLowerCase()
            };
        })
        .sort((a, b) => a.query.localeCompare(b.query) || (a.type || '').localeCompare(b.type || ''));

    if (normalizedPins.length > 0) {
        normalized.proximity_pins = normalizedPins;
    }

    const pois = filters.poi_proximity || [];
    const normalizedPois = pois
        .filter(p => p && p.poi_type)
        .map(p => {
            return {
                poi_type: String(p.poi_type).trim().toLowerCase(),
                max_miles: p.max_miles ? parseFloat(p.max_miles) : 1.0,
                pin_mode: (p.pin_mode || 'filter').toLowerCase()
            };
        })
        .sort((a, b) => a.poi_type.localeCompare(b.poi_type));

    if (normalizedPois.length > 0) {
        normalized.poi_proximity = normalizedPois;
    }

    return normalized;
};

const isSearchDuplicate = (currentForm, savedList) => {
    if (!savedList || savedList.length === 0) return false;
    const canonicalCurrent = JSON.stringify(normalizeFiltersForComparison(currentForm));
    return savedList.some(saved => {
        const canonicalSaved = JSON.stringify(normalizeFiltersForComparison(saved.filters));
        return canonicalCurrent === canonicalSaved;
    });
};

export default function Search({ auth, properties, filters = {}, geocodingError, geocodingErrors = [], resolvedPins = [], isochroneResolved = null, appDebug = false, debugInfo = null, savedSearches = [] }) {
    const [isFiltersCollapsed, setIsFiltersCollapsed] = useState(properties.total > 0);
    const [pinFormMode, setPinFormMode] = useState('commute'); // 'commute' or 'radius'
    const [pinQuery, setPinQuery] = useState('');
    const [pinLabel, setPinLabel] = useState('');
    const [pinValue, setPinValue] = useState('20');
    const [pinMode, setPinMode] = useState('driving');
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [prompt, setPrompt] = useState('');
    const [promptLoading, setPromptLoading] = useState(false);
    const [promptError, setPromptError] = useState('');
    const [showDebugger, setShowDebugger] = useState(false);
    const [lastParsedFilters, setLastParsedFilters] = useState(null);
    const [debugTab, setDebugTab] = useState('parser');
    const [isDragInvalid, setIsDragInvalid] = useState(false);

    const [isSavingSearch, setIsSavingSearch] = useState(false);
    const [savedSearchName, setSavedSearchName] = useState('');

    const submitSaveSearch = () => {
        if (!savedSearchName.trim()) return;
        router.post('/searches', {
            name: savedSearchName.trim(),
            filters: formData
        }, {
            preserveState: true,
            onSuccess: () => {
                setIsSavingSearch(false);
                setSavedSearchName('');
            }
        });
    };

    const [formData, setFormData] = useState({
        location: filters.location || '',
        radius: filters.radius || '',
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
        ...(() => {
            const normalized = assignDisplayFlags(filters.poi_proximity || [], filters.proximity_pins || []);
            return {
                poi_proximity: normalized.poi_proximity,
                proximity_pins: normalized.proximity_pins
            };
        })()
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSearch = (e) => {
        e.preventDefault();
        // Remove empty values
        const cleanFilters = Object.fromEntries(
            Object.entries(formData).filter(([_, value]) => {
                if (Array.isArray(value)) return value.length > 0;
                if (value && typeof value === 'object') {
                    return Object.values(value).some(v => v !== '' && v !== null && v !== undefined);
                }
                return value !== '' && value !== null;
            })
        );
        router.get('/search', cleanFilters, { 
            preserveState: true, 
            onSuccess: () => setIsFiltersCollapsed(true) 
        });
    };

    const handleClear = () => {
        setFormData({
            location: '',
            radius: '',
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
            poi_proximity: [],
            proximity_pins: [],
        });
        router.get('/search');
    };

    const Layout = auth?.user ? AuthenticatedLayout : PublicLayout;

    const getPoiIcon = (type) => {
        if (!type) return '📍';
        const icons = {
            train_station: '🚂',
            school: '🎓',
            hospital: '🏥',
            supermarket: '🛒',
            gym: '💪',
            park: '🌳'
        };
        return icons[type] || '📍';
    };

    const getPoiLabel = (type) => {
        if (!type) return '';
        const labels = {
            train_station: 'Train Station',
            school: 'School',
            hospital: 'Hospital',
            supermarket: 'Supermarket',
            gym: 'Gym',
            park: 'Park'
        };
        return labels[type] || String(type).replace('_', ' ');
    };



    // Derived active pins list (from formData.poi_proximity and formData.proximity_pins)
    const allActivePins = [
        ...(formData.poi_proximity || [])
            .filter(poi => poi && poi.poi_type)
            .map(poi => ({
                id: `suggested-${poi.poi_type}`,
                type: 'suggested',
                poi_type: poi.poi_type,
                label: poi.label || getPoiLabel(poi.poi_type),
                icon: getPoiIcon(poi.poi_type),
                display: parseBool(poi.display),
                pin_mode: poi.pin_mode || 'filter',
                max_miles: poi.max_miles
            })),
        ...(formData.proximity_pins || [])
            .filter(pin => pin && pin.query)
            .map((pin, idx) => {
                const resolved = resolvedPins?.find(rp => rp.query === pin.query && rp.label === pin.label);
                return {
                    id: `custom-${idx}`,
                    type: 'custom',
                    index: idx,
                    customPin: pin,
                    label: pin.label || pin.query,
                    icon: pin.type === 'commute' ? (pin.mode === 'driving' ? '🚗' : pin.mode === 'cycling' ? '🚲' : '🚶') : '📍',
                    display: parseBool(pin.display),
                    pin_mode: pin.pin_mode || 'filter',
                    resolved: resolved
                };
            })
    ];

    const displayPins = allActivePins.filter(p => p.display);
    const otherPins = allActivePins.filter(p => !p.display);

    // Drag and Drop handlers
    const handleDragStart = (e, pinId) => {
        e.dataTransfer.setData('text/plain', pinId);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const updatePinDisplay = (pin, displayValue) => {
        setFormData(prev => {
            if (pin.type === 'suggested') {
                return {
                    ...prev,
                    poi_proximity: prev.poi_proximity.map(p => 
                        p.poi_type === pin.poi_type ? { ...p, display: displayValue } : p
                    )
                };
            } else {
                return {
                    ...prev,
                    proximity_pins: prev.proximity_pins.map((p, i) => 
                        i === pin.index ? { ...p, display: displayValue } : p
                    )
                };
            }
        });
    };

    const togglePinMode = (pin) => {
        setFormData(prev => {
            const nextMode = pin.pin_mode === 'filter' ? 'display' : 'filter';
            if (pin.type === 'suggested') {
                return {
                    ...prev,
                    poi_proximity: prev.poi_proximity.map(p => 
                        p.poi_type === pin.poi_type ? { ...p, pin_mode: nextMode } : p
                    )
                };
            } else {
                return {
                    ...prev,
                    proximity_pins: prev.proximity_pins.map((p, i) => 
                        i === pin.index ? { ...p, pin_mode: nextMode } : p
                    )
                };
            }
        });
    };

    const handleDragEnterDisplay = (e) => {
        e.preventDefault();
        if (displayPins.length >= 3) {
            setIsDragInvalid(true);
        }
    };

    const handleDragLeaveDisplay = (e) => {
        e.preventDefault();
        setIsDragInvalid(false);
    };

    const handleDropToDisplay = (e) => {
        e.preventDefault();
        setIsDragInvalid(false);
        const pinId = e.dataTransfer.getData('text/plain');
        if (!pinId) return;

        const pin = allActivePins.find(p => p.id === pinId);
        if (!pin || pin.display) return;

        if (displayPins.length >= 3) {
            setIsDragInvalid(true);
            setTimeout(() => setIsDragInvalid(false), 1600);
            return;
        }

        updatePinDisplay(pin, true);
    };

    const handleDropToAll = (e) => {
        e.preventDefault();
        const pinId = e.dataTransfer.getData('text/plain');
        if (!pinId) return;

        const pin = allActivePins.find(p => p.id === pinId);
        if (!pin || !pin.display) return;

        updatePinDisplay(pin, false);
    };

    // renderDraggablePin has been refactored into the standalone DraggablePinItem component at the bottom of this file.

    const activeFilterCount = Object.entries(formData).filter(([key, v]) => {
        if (Array.isArray(v)) return v.length > 0;
        return v !== '' && v !== null && v !== undefined;
    }).length;

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
            setLastParsedFilters(f);
            if (appDebug) {
                setShowDebugger(true);
            }
            const merged = {
                ...formData,
                ...(f.transaction_type !== null && f.transaction_type !== undefined ? { transaction_type: f.transaction_type } : {}),
                ...(f.property_category !== null && f.property_category !== undefined ? { property_category: f.property_category } : {}),
                ...(f.property_type !== null && f.property_type !== undefined ? { property_type: f.property_type } : {}),
                ...(f.location !== null && f.location !== undefined ? { location: f.location } : {}),
                ...(f.radius !== null && f.radius !== undefined ? { radius: String(f.radius) } : {}),
                ...(f.min_price !== null && f.min_price !== undefined ? { min_price: String(f.min_price) } : {}),
                ...(f.max_price !== null && f.max_price !== undefined ? { max_price: String(f.max_price) } : {}),
                ...(f.bedrooms !== null && f.bedrooms !== undefined ? { bedrooms: String(f.bedrooms) } : {}),
                ...(f.bathrooms !== null && f.bathrooms !== undefined ? { bathrooms: String(f.bathrooms) } : {}),
                ...(f.parking !== null && f.parking !== undefined ? { parking: f.parking } : {}),
                ...(f.garden !== null && f.garden !== undefined ? { garden: f.garden } : {}),
                ...(f.furnished !== null && f.furnished !== undefined ? { furnished: f.furnished } : {}),
                ...(f.pets_allowed !== null && f.pets_allowed !== undefined ? { pets_allowed: f.pets_allowed } : {}),
                ...(() => {
                    let nextPoi = [...(formData.poi_proximity || [])];
                    if (f.poi_proximity && f.poi_proximity.length > 0) {
                        f.poi_proximity.forEach(newPoi => {
                            const idx = nextPoi.findIndex(p => p.poi_type === newPoi.poi_type);
                            if (idx !== -1) {
                                nextPoi[idx] = { ...nextPoi[idx], ...newPoi };
                            } else {
                                nextPoi.push(newPoi);
                            }
                        });
                    }

                    let nextPins = [...(formData.proximity_pins || [])];
                    if (f.proximity_pins && f.proximity_pins.length > 0) {
                        f.proximity_pins.forEach(newPin => {
                            const newQueryClean = String(newPin.query || '').trim().toLowerCase();
                            const idx = nextPins.findIndex(p => String(p.query || '').trim().toLowerCase() === newQueryClean);
                            if (idx !== -1) {
                                nextPins[idx] = { ...nextPins[idx], ...newPin };
                            } else {
                                nextPins.push(newPin);
                            }
                        });
                    }

                    const normalized = assignDisplayFlags(nextPoi, nextPins);
                    return {
                        poi_proximity: normalized.poi_proximity,
                        proximity_pins: normalized.proximity_pins
                    };
                })()
            };
            setFormData(merged);
            const cleanFilters = Object.fromEntries(
                Object.entries(merged).filter(([_, value]) => {
                    if (Array.isArray(value)) return value.length > 0;
                    if (value && typeof value === 'object') {
                        return Object.values(value).some(v => v !== '' && v !== null && v !== undefined);
                    }
                    return value !== '' && value !== null;
                })
            );
            router.get('/search', cleanFilters, { preserveState: true, onSuccess: () => setIsFiltersCollapsed(true) });
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
                    {usePage().props.flash?.success && (
                        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-250 text-emerald-800 text-sm font-bold rounded-xl flex items-center justify-between shadow-sm animate-in fade-in duration-300">
                            <span>{usePage().props.flash.success}</span>
                        </div>
                    )}
                    {usePage().props.errors?.error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 text-sm font-semibold rounded-xl flex items-center justify-between shadow-sm animate-in fade-in duration-300">
                            <span>{usePage().props.errors.error}</span>
                        </div>
                    )}

                    {/* AI Prompt Panel */}
                    <div className="mb-6 rounded-2xl bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100 shadow-lg p-6">
                        <div className="mb-3">
                            <p className="text-sm font-semibold text-indigo-700 uppercase tracking-widest">
                                UPDATE SEARCH
                            </p>
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
                                ) : (activeFilterCount > 0 ? 'Update Search' : 'Ask AI')}
                            </button>
                        </div>
                        {promptError && <p className="mt-2 text-sm text-red-600">{promptError}</p>}
                        <p className="mt-3 text-xs text-indigo-400">↓ or fill in filters manually below</p>
                    </div>

                    {/* Sticky Filter Panel (only sticky when collapsed to avoid scroll overflow issues) */}
                    <div className={`${isFiltersCollapsed ? 'sticky top-0 z-20' : 'relative'} mb-8`}>
                        {isFiltersCollapsed ? (
                            <div className="rounded-2xl bg-white/95 p-4 shadow-lg backdrop-blur-md border border-gray-100 flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-300">
                                <div className="flex items-center gap-4 overflow-hidden">
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg">
                                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <p className="text-lg font-bold text-gray-900 truncate flex items-center gap-2">
                                            {formData.location || (isochroneResolved ? `Near ${isochroneResolved.resolved_name}` : 'All Locations')}
                                            {formData.radius && <span className="text-indigo-600 text-sm">+{formData.radius}mi</span>}
                                        </p>
                                        <div className="flex gap-1.5 flex-wrap">
                                            {[
                                                formData.property_category && (
                                                    <span key="category" className="bg-sky-50 text-sky-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-sky-100">{formData.property_category}</span>
                                                ),
                                                formData.transaction_type && (
                                                    <span key="transaction" className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-indigo-100">
                                                        {formData.transaction_type === 'sale' ? 'For Sale' : 'For Rent'}
                                                    </span>
                                                ),
                                                formData.bedrooms && (
                                                    <span key="beds" className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase">{formData.bedrooms}+ Beds</span>
                                                ),
                                                (formData.min_price || formData.max_price) && (
                                                    <span key="price" className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase">£{formData.min_price || 0} - {formData.max_price ? '£' + formData.max_price : 'Any'}</span>
                                                ),
                                                formData.poi_proximity?.filter(poi => poi && poi.poi_type).map((poi, idx) => (
                                                    <span key={`poi-${idx}`} className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                                                        Near {getPoiLabel(poi.poi_type)} {poi.pin_mode === 'display' ? '(Display Only)' : `(${poi.max_miles}mi)`}
                                                    </span>
                                                )),
                                                resolvedPins?.filter(pin => pin && (pin.label || pin.query)).map((pin, idx) => (
                                                    <span key={`pin-${idx}`} className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                                                        📍 {pin.label || pin.query} {pin.pin_mode === 'display' ? '(Display Only)' : `(${pin.type === 'commute' ? `${pin.minutes}m ${pin.mode}` : `${pin.max_miles}mi`})`}
                                                    </span>
                                                ))
                                            ].flat().filter(Boolean)}
                                        </div>
                                    </div>
                                </div>
                                <div className='flex items-center gap-3'>
                                    {auth?.user && auth.user.role === 'applicant' && activeFilterCount > 0 && !isSearchDuplicate(formData, savedSearches) && (
                                        isSavingSearch ? (
                                            <div className='flex items-center gap-2 animate-in slide-in-from-top-2 duration-200'>
                                                <input 
                                                    type='text'
                                                    placeholder='Name your search'
                                                    value={savedSearchName}
                                                    onChange={e => setSavedSearchName(e.target.value)}
                                                    className='rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 text-sm px-4 w-48'
                                                    autoFocus
                                                />
                                                <button
                                                    type='button'
                                                    onClick={submitSaveSearch}
                                                    disabled={!savedSearchName.trim()}
                                                    className='rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed'
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    type='button'
                                                    onClick={() => {
                                                        setIsSavingSearch(false);
                                                        setSavedSearchName('');
                                                    }}
                                                    className='rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50'
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                type='button'
                                                onClick={() => setIsSavingSearch(true)}
                                                className='rounded-xl border-2 border-indigo-600 bg-white px-5 py-2.5 text-sm font-bold text-indigo-600 transition-all hover:bg-indigo-50 active:scale-95 shadow-sm'
                                            >
                                                Save Search
                                            </button>
                                        )
                                    )}
                                    <button
                                        type='button'
                                        onClick={() => setIsFiltersCollapsed(false)}
                                        className='rounded-xl border-2 border-indigo-200 bg-white px-5 py-2.5 text-sm font-bold text-indigo-700 transition-all hover:bg-indigo-50 hover:border-indigo-300 active:scale-95 shadow-sm'
                                    >
                                        Pins
                                    </button>
                                    <button
                                        type='button'
                                        onClick={handleClear}
                                        className='p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all'
                                        title='Clear All'
                                    >
                                        <svg className='h-5 w-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSearch} className="rounded-2xl bg-white p-6 shadow-xl relative animate-in zoom-in-95 duration-300">
                                <button
                                    type="button"
                                    onClick={() => setIsFiltersCollapsed(true)}
                                    className="absolute right-6 top-6 rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all z-10"
                                >
                                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                    </svg>
                                </button>
                                <div className="mb-6 flex items-center justify-between pr-10">
                                    <h1 className="text-3xl font-bold text-gray-900">
                                        {activeFilterCount > 0 ? 'Update Pins' : 'Proximity Pins'}
                                    </h1>
                                    {/* {activeFilterCount > 0 && (
                                        <span className="rounded-full bg-indigo-100 px-4 py-2 text-sm font-semibold text-indigo-700">
                                            {activeFilterCount} {activeFilterCount === 1 ? 'filter' : 'filters'} active
                                        </span>
                                    )} */}
                                </div>

                            {/* Search Form */}
                            {geocodingErrors && geocodingErrors.length > 0 && (
                                <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 flex flex-col gap-2">
                                    <div className="flex items-center gap-2 text-red-700 font-bold">
                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                        Landmark Search Issues:
                                    </div>
                                    <ul className="list-disc list-inside text-sm text-red-600 ml-1">
                                        {geocodingErrors.map((err, idx) => (
                                            <li key={idx}>{err}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {geocodingError && (
                                <div className="mb-6 rounded-xl border-l-4 border-amber-500 bg-amber-50 p-4 shadow-sm">
                                    <div className="flex">
                                        <div className="flex-shrink-0">
                                            <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-sm font-medium text-amber-800">{geocodingError}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Temporarily disabled manually modify search property filters
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
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

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Search Radius</label>
                                    <select
                                        name="radius"
                                        value={formData.radius}
                                        onChange={handleChange}
                                        disabled={!formData.location}
                                        className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100 disabled:text-gray-400"
                                    >
                                        <option value="">Keyword only</option>
                                        <option value="1">Within 1 mile</option>
                                        <option value="3">Within 3 miles</option>
                                        <option value="5">Within 5 miles</option>
                                        <option value="10">Within 10 miles</option>
                                        <option value="15">Within 15 miles</option>
                                        <option value="20">Within 20 miles</option>
                                        <option value="30">Within 30 miles</option>
                                        <option value="40">Within 40 miles</option>
                                    </select>
                                </div>

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

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Transaction Type</label>
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
                            */}

                            {/* Temporarily disabled advanced filters
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

                            {showAdvanced && (
                                <div className="mt-6 grid grid-cols-1 gap-4 border-t border-gray-200 pt-6 md:grid-cols-2 lg:grid-cols-4">
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
                            */}

                            {/* Proximity & Travel Time Section */}
                            <div className="mt-4">

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Left Column: User Added Pins */}
                                    <div className="space-y-4 bg-gray-50/50 p-6 rounded-2xl border border-gray-200/50 flex flex-col justify-between">
                                        <div>
                                            <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                                                <span>📌</span> Add Custom Pin
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="md:col-span-2">
                                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Landmark or Address</label>
                                                    <input
                                                        type="text"
                                                        value={pinQuery}
                                                        onChange={e => setPinQuery(e.target.value)}
                                                        placeholder="e.g. Waterloo Station, RG2 0FL"
                                                        className="w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 text-sm px-4"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Display Name (Optional)</label>
                                                    <input
                                                        type="text"
                                                        value={pinLabel}
                                                        onChange={e => setPinLabel(e.target.value)}
                                                        placeholder="e.g. Work, Home"
                                                        className="w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 text-sm px-4"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Constraint Type</label>
                                                    <div className="flex p-1 bg-white border border-gray-200 rounded-xl h-[42px]">
                                                        <button 
                                                            type="button"
                                                            onClick={() => {
                                                                setPinFormMode('commute');
                                                                setPinValue('20');
                                                            }}
                                                            className={`flex-1 rounded-lg text-xs font-bold transition-all ${pinFormMode === 'commute' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                                                        >Commute</button>
                                                        <button 
                                                            type="button"
                                                            onClick={() => {
                                                                setPinFormMode('radius');
                                                                setPinValue('1');
                                                            }}
                                                            className={`flex-1 rounded-lg text-xs font-bold transition-all ${pinFormMode === 'radius' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                                                        >Distance</button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="border-t border-gray-200 pt-4 mt-2">
                                            <div className="flex items-end gap-4">
                                                <div className="flex-1">
                                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                                                        {pinFormMode === 'commute' ? 'Commute Time (max 60 mins)' : 'Search Radius (miles)'}
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min={pinFormMode === 'commute' ? 1 : 0.1}
                                                        max={pinFormMode === 'commute' ? 60 : 50}
                                                        step={pinFormMode === 'commute' ? 1 : 0.1}
                                                        value={pinValue}
                                                        onChange={e => setPinValue(e.target.value)}
                                                        className="w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 text-sm px-4"
                                                    />
                                                </div>
                                                {pinFormMode === 'commute' && (
                                                    <div className="flex-1">
                                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Transport Mode</label>
                                                        <select 
                                                            value={pinMode} 
                                                            onChange={e => setPinMode(e.target.value)}
                                                            className="w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 text-sm px-4"
                                                        >
                                                            <option value="driving">Driving 🚗</option>
                                                            <option value="walking">Walking 🚶</option>
                                                            <option value="cycling">Cycling 🚲</option>
                                                        </select>
                                                    </div>
                                                )}
                                                <button 
                                                    type="button"
                                                    onClick={() => {
                                                        if (pinQuery.trim()) {
                                                            let val = parseFloat(pinValue);
                                                            if (isNaN(val)) {
                                                                val = pinFormMode === 'commute' ? 20 : 1.0;
                                                            }
                                                            if (pinFormMode === 'commute' && val > 60) {
                                                                val = 60;
                                                            }
                                                            setFormData(prev => {
                                                                const currentDisplayCount = (prev.proximity_pins || []).filter(p => p.display).length + 
                                                                                            (prev.poi_proximity || []).filter(p => p.display).length;
                                                                const shouldDisplay = currentDisplayCount < 3;
                                                                return {
                                                                    ...prev,
                                                                    proximity_pins: [...prev.proximity_pins, { 
                                                                        type: pinFormMode, 
                                                                        query: pinQuery.trim(), 
                                                                        label: pinLabel.trim() || null,
                                                                        value: val,
                                                                        mode: pinFormMode === 'commute' ? pinMode : null,
                                                                        display: shouldDisplay,
                                                                        pin_mode: 'filter'
                                                                    }]
                                                                };
                                                            });
                                                            setPinQuery('');
                                                            setPinLabel('');
                                                            setPinValue(pinFormMode === 'commute' ? '20' : '1');
                                                        }
                                                    }}
                                                    className="rounded-xl bg-gray-900 px-6 h-[42px] text-white text-sm font-bold shadow-lg hover:shadow-indigo-200/50 hover:bg-black transition-all active:scale-95 shrink-0"
                                                >
                                                    Add Pin
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Column: Suggested Pins */}
                                    <div className="space-y-4 bg-gray-50/50 p-6 rounded-2xl border border-gray-200/50">
                                        <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                                            <span>💡</span> Suggested Pins
                                        </h4>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                            {[
                                                { id: 'train_station', label: 'Train Station', icon: '🚂' },
                                                { id: 'school', label: 'School', icon: '🎓' },
                                                { id: 'hospital', label: 'Hospital', icon: '🏥' },
                                                { id: 'supermarket', label: 'Supermarket', icon: '🛒' },
                                                { id: 'gym', label: 'Gym', icon: '💪' },
                                                { id: 'park', label: 'Park', icon: '🌳' },
                                            ].map(poi => {
                                                const isActive = formData.poi_proximity.some(p => p.poi_type === poi.id);
                                                return (
                                                    <button
                                                        key={poi.id}
                                                        type="button"
                                                        onClick={() => {
                                                            const exists = formData.poi_proximity.find(p => p.poi_type === poi.id);
                                                            if (exists) {
                                                                setFormData(prev => ({
                                                                    ...prev,
                                                                    poi_proximity: prev.poi_proximity.filter(p => p.poi_type !== poi.id)
                                                                }));
                                                            } else {
                                                                setFormData(prev => {
                                                                    const currentDisplayCount = (prev.proximity_pins || []).filter(p => p.display).length + 
                                                                                                (prev.poi_proximity || []).filter(p => p.display).length;
                                                                    const shouldDisplay = currentDisplayCount < 3;
                                                                    return {
                                                                        ...prev,
                                                                        poi_proximity: [...prev.poi_proximity, { poi_type: poi.id, max_miles: 1.0, display: shouldDisplay, pin_mode: 'filter' }]
                                                                    };
                                                                });
                                                            }
                                                        }}
                                                        className={`relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 gap-2 ${
                                                            isActive 
                                                                ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm font-bold' 
                                                                : 'border-gray-200 bg-white text-gray-600 hover:border-indigo-300 hover:bg-indigo-50/10'
                                                        }`}
                                                    >
                                                        <span className="text-2xl">{poi.icon}</span>
                                                        <span className="text-xs text-center">{poi.label}</span>
                                                        {isActive && (
                                                            <span className="absolute top-2 right-2 text-indigo-600">
                                                                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                                </svg>
                                                            </span>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {/* Bottom: Drag and Drop Display & All Pins */}
                                {((formData.poi_proximity && formData.poi_proximity.length > 0) || (formData.proximity_pins && formData.proximity_pins.length > 0)) && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-gray-200">
                                        {/* Display Pins zone */}
                                        <div 
                                            onDragOver={handleDragOver}
                                            onDragEnter={handleDragEnterDisplay}
                                            onDragLeave={handleDragLeaveDisplay}
                                            onDrop={handleDropToDisplay}
                                            className={`border-2 border-dashed rounded-2xl p-6 min-h-[220px] transition-all duration-200 animate-in fade-in duration-305 ${
                                                isDragInvalid 
                                                    ? 'border-red-500 bg-red-50/60 animate-pulse ring-4 ring-red-100' 
                                                    : 'bg-indigo-50/20 border-indigo-200 hover:bg-indigo-50/40 hover:border-indigo-300'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between mb-4">
                                                <h4 className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                                                    <span>📺</span> Display Pins (Max 3)
                                                </h4>
                                                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                                                    {displayPins.length} / 3
                                                </span>
                                            </div>
                                            
                                            {displayPins.length === 0 ? (
                                                <div className="flex flex-col items-center justify-center h-[130px] text-center text-gray-400 select-none">
                                                    <span className="text-2xl mb-1">🤝</span>
                                                    <p className="text-xs font-medium">Drag active pins here to display them on property cards</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    {displayPins.map(pin => (
                                                        <DraggablePinItem 
                                                            key={pin.id} 
                                                            pin={pin} 
                                                            handleDragStart={handleDragStart} 
                                                            togglePinMode={togglePinMode} 
                                                            setFormData={setFormData} 
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* All Pins (Remaining Pins) zone */}
                                        <div 
                                            onDragOver={handleDragOver}
                                            onDrop={handleDropToAll}
                                            className="bg-gray-50/50 border-2 border-dashed border-gray-200 rounded-2xl p-6 min-h-[220px] transition-colors duration-200 hover:bg-gray-50 hover:border-gray-300 animate-in fade-in duration-305"
                                        >
                                            <div className="flex items-center justify-between mb-4">
                                                <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                                    <span>📍</span> All Pins
                                                </h4>
                                            </div>
                                            
                                            {otherPins.length === 0 ? (
                                                <div className="flex flex-col items-center justify-center h-[130px] text-center text-gray-400 select-none">
                                                    <span className="text-2xl mb-1">💤</span>
                                                    <p className="text-xs font-medium">No other active pins. Drag pins here from display, or add new ones.</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    {otherPins.map(pin => (
                                                        <DraggablePinItem 
                                                            key={pin.id} 
                                                            pin={pin} 
                                                            handleDragStart={handleDragStart} 
                                                            togglePinMode={togglePinMode} 
                                                            setFormData={setFormData} 
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className='mt-6 flex flex-col gap-4'>
                                <div className='flex gap-4'>
                                    <button
                                        type='submit'
                                        className='flex-1 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:from-indigo-700 hover:to-purple-700 hover:shadow-xl'
                                    >
                                        {activeFilterCount > 0 ? 'Update Search' : 'Search Properties'}
                                    </button>
                                    <button
                                        type='button'
                                        onClick={handleClear}
                                        className='rounded-lg border-2 border-gray-300 px-6 py-3 font-semibold text-gray-700 transition-all hover:border-gray-400 hover:bg-gray-50'
                                    >
                                        Clear Filters
                                    </button>
                                </div>
                            </div>
                        </form>
                    )}
                </div>

                    {/* Results */}
                    <div>
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900">
                                {properties.total} {properties.total === 1 ? 'Property' : 'Properties'} Found
                            </h2>
                            {appDebug && (
                                <button
                                    onClick={() => setShowDebugger(prev => !prev)}
                                    className={`rounded-xl px-4 py-2 text-xs font-bold transition-all border shadow-sm flex items-center gap-1.5 active:scale-95 ${
                                        showDebugger 
                                            ? 'bg-gray-905 bg-slate-900 border-slate-900 text-white hover:bg-black' 
                                            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    {showDebugger ? 'Hide Debugger' : 'Show AI Debugger'}
                                </button>
                            )}
                        </div>

                        {appDebug && showDebugger && (
                            <div className="mb-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden text-slate-100 font-mono text-xs animate-in slide-in-from-top-4 duration-300">
                                {/* Debugger Header / Tab Bar */}
                                <div className="flex border-b border-slate-800 bg-slate-950/80 px-4 py-3 items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <span className="text-indigo-400 font-bold text-sm">AI PROXIMITY INSPECTOR</span>
                                        <div className="flex gap-2">
                                            {['parser', 'mapbox', 'sql'].map(tab => (
                                                <button
                                                    key={tab}
                                                    type="button"
                                                    onClick={() => setDebugTab(tab)}
                                                    className={`rounded-lg px-3 py-1.5 font-bold transition-all ${
                                                        debugTab === tab
                                                            ? 'bg-indigo-600 text-white shadow-md'
                                                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                                                    }`}
                                                >
                                                    {tab === 'parser' && 'AI Parser'}
                                                    {tab === 'mapbox' && 'Mapbox API Logs'}
                                                    {tab === 'sql' && `SQL Queries (${debugInfo?.sql_queries?.length ?? 0})`}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShowDebugger(false)}
                                        className="text-slate-400 hover:text-slate-200 transition-all p-1"
                                    >
                                        ✕
                                    </button>
                                </div>

                                {/* Debugger Content */}
                                <div className="p-6 max-h-[400px] overflow-y-auto space-y-4">
                                    {debugTab === 'parser' && (
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px] mb-1">Active Natural Language Query</p>
                                                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-slate-200">
                                                    {prompt.trim() ? `"${prompt}"` : 'None (Manual filter search active)'}
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px] mb-1">Parsed JSON Filters (Groq Output)</p>
                                                <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 overflow-x-auto text-emerald-400">
                                                    {lastParsedFilters 
                                                        ? JSON.stringify(lastParsedFilters, null, 2) 
                                                        : '// Submit an AI prompt above to inspect the JSON schema translation.'}
                                                </pre>
                                            </div>
                                        </div>
                                    )}

                                    {debugTab === 'mapbox' && (
                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px] mb-2">Location Forward Geocoding</p>
                                                {debugInfo?.location_geocoding ? (
                                                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                                                        <p><span className="text-indigo-400">Input:</span> "{debugInfo.location_geocoding.input}"</p>
                                                        <p><span className="text-emerald-400">Coords:</span> lat: {debugInfo.location_geocoding.output?.lat}, lng: {debugInfo.location_geocoding.output?.lng}</p>
                                                        <p><span className="text-purple-400">Resolved Address:</span> {debugInfo.location_geocoding.output?.error ? <span className="text-red-400">Failed</span> : 'Successfully Geocoded'}</p>
                                                    </div>
                                                ) : (
                                                    <p className="text-slate-500 italic">No primary location geocoding ran for this search query.</p>
                                                )}
                                            </div>

                                            <div>
                                                <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px] mb-2">Proximity Pins & Isochrones Logs</p>
                                                {debugInfo?.pins_geocoding && debugInfo.pins_geocoding.length > 0 ? (
                                                    <div className="space-y-3">
                                                        {debugInfo.pins_geocoding.map((pin, idx) => (
                                                            <div key={idx} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                                                                <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                                                                    <span className="font-bold text-slate-200">📍 Pin #{idx + 1}: "{pin.query}"</span>
                                                                    <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${pin.type === 'commute' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                                                        {pin.type.toUpperCase()}
                                                                    </span>
                                                                </div>
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-slate-300">
                                                                    <p><span className="text-indigo-400">Query Text:</span> "{pin.query_text}"</p>
                                                                    <p><span className="text-emerald-400">Coordinates:</span> lat: {pin.resolved_coords?.lat}, lng: {pin.resolved_coords?.lng}</p>
                                                                    {pin.type === 'commute' && (
                                                                        <>
                                                                            <p><span className="text-amber-400">Mode:</span> {pin.commute_params?.mode}</p>
                                                                            <p><span className="text-amber-400">Minutes:</span> {pin.commute_params?.minutes} mins {pin.commute_params?.minutes === 60 && <span className="text-red-400">(Capped)</span>}</p>
                                                                            <p className="md:col-span-2"><span className="text-purple-400">Mapbox Isochrone Polygons:</span> {pin.commute_params?.polygons_found ? <span className="text-emerald-400">Found & Loaded</span> : <span className="text-red-400">Failed / Empty</span>}</p>
                                                                        </>
                                                                    )}
                                                                    {pin.type === 'radius' && (
                                                                        <p><span className="text-blue-400">Radius Limit:</span> {pin.radius_params?.radius_miles} miles</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-slate-500 italic">No custom landmark or proximity pins processed in this search query.</p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {debugTab === 'sql' && (
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Database Query Log</p>
                                                <span className="text-slate-400 text-[10px]">
                                                    Total Query Time: {debugInfo?.sql_queries?.reduce((a, b) => a + b.time_ms, 0).toFixed(2) ?? 0} ms
                                                </span>
                                            </div>
                                            {debugInfo?.sql_queries && debugInfo.sql_queries.length > 0 ? (
                                                <div className="space-y-3">
                                                    {debugInfo.sql_queries.map((q, idx) => (
                                                        <div key={idx} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                                                            <div className="flex items-center justify-between text-slate-400 border-b border-slate-850 pb-2">
                                                                <span className="font-bold text-slate-300">Query #{idx + 1}</span>
                                                                <span className={`font-bold px-1.5 py-0.5 rounded ${q.time_ms > 10 ? 'bg-red-500/20 text-red-400' : q.time_ms > 5 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                                                    {q.time_ms.toFixed(2)} ms
                                                                </span>
                                                            </div>
                                                            <div className="text-slate-200 select-all overflow-x-auto whitespace-pre-wrap break-all py-1">
                                                                {q.sql}
                                                            </div>
                                                            {q.bindings && q.bindings.length > 0 && (
                                                                <div className="text-[10px] text-slate-400 bg-slate-900/50 p-2 rounded border border-slate-850">
                                                                    <span className="text-indigo-400 font-bold">Bindings:</span> {JSON.stringify(q.bindings)}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-slate-500 italic">No SQL queries logged for this page load.</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {properties.data.length > 0 ? (
                            <>
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                                    {properties.data.map((property) => (
                                        <PropertyCard 
                                            key={property.id} 
                                            property={property} 
                                            searchContext={{ 
                                                resolvedPins,
                                                displayPins
                                            }}
                                        />
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

function DraggablePinItem({ pin, handleDragStart, togglePinMode, setFormData }) {
    const initialVal = pin.type === 'suggested' ? pin.max_miles : pin.customPin.value;
    const [inputValue, setInputValue] = useState(initialVal);
    const [isEditing, setIsEditing] = useState(false);
    const [labelValue, setLabelValue] = useState(pin.label);

    useEffect(() => {
        setInputValue(pin.type === 'suggested' ? pin.max_miles : pin.customPin.value);
    }, [pin.max_miles, pin.customPin?.value]);

    useEffect(() => {
        setLabelValue(pin.label);
    }, [pin.label]);

    const handleSave = () => {
        let parsed = parseFloat(inputValue);
        if (isNaN(parsed) || parsed <= 0) {
            setInputValue(pin.type === 'suggested' ? pin.max_miles : pin.customPin.value);
            return;
        }
        
        const rounded = Math.round(parsed * 10) / 10;
        
        let finalVal = rounded;
        if (pin.type === 'custom' && pin.customPin.type === 'commute' && finalVal > 60) {
            finalVal = 60;
        }
        if (pin.type === 'suggested' && finalVal > 50) {
            finalVal = 50;
        }
        if (pin.type === 'custom' && pin.customPin.type === 'radius' && finalVal > 50) {
            finalVal = 50;
        }

        setInputValue(finalVal);

        setFormData(prev => {
            if (pin.type === 'suggested') {
                return {
                    ...prev,
                    poi_proximity: prev.poi_proximity.map(p => 
                        p.poi_type === pin.poi_type ? { ...p, max_miles: finalVal } : p
                    )
                };
            } else {
                return {
                    ...prev,
                    proximity_pins: prev.proximity_pins.map((p, i) => 
                        i === pin.index ? { ...p, value: finalVal } : p
                    )
                };
            }
        });
    };

    const handleSaveLabel = () => {
        setIsEditing(false);
        const trimmed = labelValue.trim();
        if (!trimmed) {
            setLabelValue(pin.label);
            return;
        }

        setFormData(prev => {
            if (pin.type === 'suggested') {
                return {
                    ...prev,
                    poi_proximity: prev.poi_proximity.map(p => 
                        p.poi_type === pin.poi_type ? { ...p, label: trimmed } : p
                    )
                };
            } else {
                return {
                    ...prev,
                    proximity_pins: prev.proximity_pins.map((p, i) => 
                        i === pin.index ? { ...p, label: trimmed } : p
                    )
                };
            }
        });
    };

    return (
        <div 
            draggable="true"
            onDragStart={(e) => handleDragStart(e, pin.id)}
            className="flex items-center gap-3 bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm cursor-grab active:cursor-grabbing hover:border-indigo-300 transition-all select-none group animate-in fade-in duration-200"
        >
            <div className="h-9 w-9 shrink-0 bg-indigo-50 rounded-lg flex items-center justify-center text-lg shadow-inner">
                {pin.icon}
            </div>
            <div className="flex-1 min-w-0">
                {isEditing ? (
                    <input 
                        type="text"
                        value={labelValue}
                        onChange={(e) => setLabelValue(e.target.value)}
                        onBlur={handleSaveLabel}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handleSaveLabel();
                            } else if (e.key === 'Escape') {
                                setLabelValue(pin.label);
                                setIsEditing(false);
                            }
                        }}
                        className="w-full bg-white border border-indigo-300 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 p-0 px-1 py-0.5 text-xs font-bold text-gray-900 rounded"
                        autoFocus
                        draggable="false"
                        onDragStart={e => e.stopPropagation()}
                        onMouseDown={e => e.stopPropagation()}
                    />
                ) : (
                    <p 
                        onClick={() => setIsEditing(true)}
                        className="text-xs font-bold text-gray-900 truncate hover:bg-gray-50 hover:ring-1 hover:ring-indigo-100 rounded px-1 -ml-1 cursor-text"
                        title="Click to edit name"
                    >
                        {pin.label}
                    </p>
                )}
                {pin.type === 'suggested' ? (
                    <div className="flex items-center gap-1 mt-1" draggable="false" onDragStart={e => e.stopPropagation()}>
                        <span className="text-[9px] text-indigo-500 font-bold uppercase">Within</span>
                        <input 
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleSave();
                                    e.target.blur();
                                }
                            }}
                            onBlur={handleSave}
                            disabled={pin.pin_mode === 'display'}
                            className={`w-12 h-6 px-1 text-[10px] text-center rounded-lg border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 font-bold transition-colors ${
                                pin.pin_mode === 'display'
                                    ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                                    : 'bg-white text-gray-900'
                            }`}
                        />
                        <span className="text-[9px] text-indigo-500 font-bold uppercase">mi</span>
                    </div>
                ) : pin.customPin.type === 'commute' ? (
                    <div className="flex items-center gap-1 mt-1" draggable="false" onDragStart={e => e.stopPropagation()}>
                        <input 
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleSave();
                                    e.target.blur();
                                }
                            }}
                            onBlur={handleSave}
                            disabled={pin.pin_mode === 'display'}
                            className={`w-12 h-6 px-1 text-[10px] text-center rounded-lg border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 font-bold transition-colors ${
                                pin.pin_mode === 'display'
                                    ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                                    : 'bg-white text-gray-900'
                            }`}
                        />
                        <span className="text-[9px] text-gray-400 font-bold uppercase">min {pin.customPin.mode} commute</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-1 mt-1" draggable="false" onDragStart={e => e.stopPropagation()}>
                        <span className="text-[9px] text-indigo-500 font-bold uppercase">Within</span>
                        <input 
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleSave();
                                    e.target.blur();
                                }
                            }}
                            onBlur={handleSave}
                            disabled={pin.pin_mode === 'display'}
                            className={`w-12 h-6 px-1 text-[10px] text-center rounded-lg border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 font-bold transition-colors ${
                                pin.pin_mode === 'display'
                                    ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                                    : 'bg-white text-gray-900'
                            }`}
                        />
                        <span className="text-[9px] text-indigo-500 font-bold uppercase">mi radius</span>
                    </div>
                )}
            </div>
            <div 
                className="flex p-0.5 bg-gray-100 rounded-lg border border-gray-200 shrink-0" 
                draggable="false" 
                onDragStart={e => e.stopPropagation()}
                onClick={e => e.stopPropagation()}
            >
                <button
                    type="button"
                    onClick={() => {
                        if (pin.pin_mode !== 'filter') {
                            togglePinMode(pin);
                        }
                    }}
                    className={`px-2 py-1 text-[9px] font-bold rounded transition-all uppercase tracking-wider ${
                        pin.pin_mode === 'filter'
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    Filter
                </button>
                <button
                    type="button"
                    onClick={() => {
                        if (pin.pin_mode !== 'display') {
                            togglePinMode(pin);
                        }
                    }}
                    className={`px-2 py-1 text-[9px] font-bold rounded transition-all uppercase tracking-wider ${
                        pin.pin_mode === 'display'
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    Display Only
                </button>
            </div>
            <button 
                type="button"
                onClick={() => {
                    if (pin.type === 'suggested') {
                        setFormData(prev => ({
                            ...prev,
                            poi_proximity: prev.poi_proximity.filter(p => p.poi_type !== pin.poi_type)
                        }));
                    } else {
                        setFormData(prev => ({
                            ...prev,
                            proximity_pins: prev.proximity_pins.filter((_, i) => i !== pin.index)
                        }));
                    }
                }}
                className="h-8 w-8 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                title="Remove Pin"
            >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
}
