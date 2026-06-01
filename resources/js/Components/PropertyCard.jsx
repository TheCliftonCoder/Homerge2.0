import { useState } from 'react';
import { router, usePage, Link } from '@inertiajs/react';

export default function PropertyCard({ property, isFavourited = false, searchContext = {} }) {
    const { auth } = usePage().props;
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [favourited, setFavourited] = useState(isFavourited);
    const [activeLocation, setActiveLocation] = useState(null);

    const images = property.images || [];
    const hasImages = images.length > 0;

    const formatPrice = (price) => {
        return new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: 'GBP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(price);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const getPoiIcon = (type) => {
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

    const getTravelTimeStr = (miles, mode = 'walking') => {
        if (mode === 'walking') {
            const mins = Math.round(miles * 20); // 3mph
            return `~${mins} min walk`;
        }
        if (mode === 'driving') {
            const mins = Math.round(miles * 3); // 20mph urban avg
            return `~${mins} min drive`;
        }
        if (mode === 'cycling') {
            const mins = Math.round(miles * 6); // 10mph avg
            return `~${mins} min cycle`;
        }
        return '';
    };

    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 3959; // Miles
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    const nextImage = () => {
        setCurrentImageIndex((prev) =>
            prev === images.length - 1 ? 0 : prev + 1,
        );
    };

    const prevImage = () => {
        setCurrentImageIndex((prev) =>
            prev === 0 ? images.length - 1 : prev - 1,
        );
    };

    const handleFavouriteToggle = (e) => {
        e.preventDefault();
        e.stopPropagation();

        router.post(`/properties/${property.id}/favourite`, {}, {
            preserveScroll: true,
            onSuccess: () => {
                setFavourited(!favourited);
            },
        });
    };

    const currentImage = hasImages
        ? `/storage/${images[currentImageIndex].image_path}`
        : null;

    return (
        <div className="group relative overflow-hidden rounded-3xl bg-white shadow-xl transition-all duration-500 hover:shadow-2xl hover:-translate-y-1">
            {/* Decorative gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

            {/* Top Legend */}
            <div className="relative border-b-2 border-indigo-100 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 px-8 py-6">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2.5">
                        <div className="flex flex-col">
                            <span className="text-2xl font-bold text-gray-900">
                                {property.street_address || property.location}
                            </span>
                            {property.distance_miles !== undefined && property.distance_miles !== null && (
                                <span className="text-sm font-medium text-indigo-600 mt-0.5">
                                    {Number(property.distance_miles).toFixed(1)} miles from search center
                                </span>
                            )}

                            {/* Commented out top-level custom pins badges
                            {searchContext?.resolvedPins && searchContext.resolvedPins.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-3">
                                    {searchContext.resolvedPins.map((pin, idx) => {
                                        const isSelected = activeLocation?.key === `pin-${idx}`;
                                        if (pin.type === 'radius') {
                                            const dist = calculateDistance(property.latitude, property.longitude, pin.lat || 0, pin.lng || 0);
                                            return (
                                                <button
                                                    key={`pin-${idx}`}
                                                    type="button"
                                                    onClick={() => setActiveLocation(prev => 
                                                        prev?.key === `pin-${idx}` 
                                                            ? null 
                                                            : { 
                                                                key: `pin-${idx}`, 
                                                                label: pin.label || pin.query, 
                                                                icon: '📍', 
                                                                name: pin.resolved_name || pin.query, 
                                                                lat: pin.lat, 
                                                                lng: pin.lng 
                                                            }
                                                    )}
                                                    className={`flex items-center gap-1.5 border px-2.5 py-1 rounded-full text-[10px] font-bold shadow-sm hover:scale-105 active:scale-95 transition-all ${
                                                        isSelected 
                                                            ? 'bg-amber-600 border-amber-700 text-white' 
                                                            : 'bg-amber-50 border-amber-100 text-amber-700 hover:bg-amber-100'
                                                    }`}
                                                >
                                                    <span>📍</span>
                                                    <span>{pin.label || pin.query}: {Number(dist).toFixed(1)}mi</span>
                                                </button>
                                            );
                                        }
                                        
                                        if (pin.type === 'commute') {
                                            return (
                                                <button
                                                    key={`pin-${idx}`}
                                                    type="button"
                                                    onClick={() => setActiveLocation(prev => 
                                                        prev?.key === `pin-${idx}` 
                                                            ? null 
                                                            : { 
                                                                key: `pin-${idx}`, 
                                                                label: pin.label || pin.query, 
                                                                icon: pin.mode === 'driving' ? '🚗' : pin.mode === 'cycling' ? '🚲' : '🚶', 
                                                                name: pin.resolved_name || pin.query, 
                                                                lat: pin.lat, 
                                                                lng: pin.lng 
                                                            }
                                                    )}
                                                    className={`flex items-center gap-1.5 border px-2.5 py-1 rounded-full text-[10px] font-bold shadow-sm hover:scale-105 active:scale-95 transition-all ${
                                                        isSelected 
                                                            ? 'bg-emerald-600 border-emerald-700 text-white' 
                                                            : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                                                    }`}
                                                >
                                                    <span>{pin.mode === 'driving' ? '🚗' : pin.mode === 'cycling' ? '🚲' : '🚶'}</span>
                                                    <span>{pin.label || pin.query}: Under {pin.minutes}m</span>
                                                </button>
                                            );
                                        }
                                        return null;
                                    })}
                                </div>
                            )}

                            {activeLocation && (
                                <div className="mt-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-150 rounded-2xl text-xs text-indigo-900 shadow-md animate-in slide-in-from-top-2 duration-300 relative">
                                    <button 
                                        type="button" 
                                        onClick={() => setActiveLocation(null)}
                                        className="absolute right-4 top-3 text-gray-400 hover:text-gray-700 transition-colors"
                                        title="Close"
                                    >
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                    <div className="flex items-center gap-2 mb-1.5 pr-6">
                                        <span className="text-base">{activeLocation.icon}</span>
                                        <span className="font-extrabold uppercase tracking-wider text-[10px] text-indigo-600">
                                            Nearest {activeLocation.label}
                                        </span>
                                    </div>
                                    <p className="font-bold text-sm text-gray-900 leading-tight">
                                        {activeLocation.name || 'Unnamed location'}
                                    </p>
                                    <p className="text-[10px] text-gray-500 mt-2 font-mono bg-white/60 inline-block px-2 py-0.5 rounded border border-gray-100">
                                        Lat: {Number(activeLocation.lat).toFixed(6)}, Lng: {Number(activeLocation.lng).toFixed(6)}
                                    </p>
                                </div>
                            )}
                            */}
                        </div>
                    </div>
                    <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-4xl font-extrabold text-transparent">
                        {formatPrice(property.price)}
                    </span>
                </div>
            </div>

            {/* Image Carousel */}
            <div className="relative aspect-video bg-gradient-to-br from-gray-100 to-gray-200">
                {hasImages ? (
                    <>
                        <img
                            src={currentImage}
                            alt={property.name}
                            className="h-full w-full object-cover transition-all duration-500 group-hover:scale-105"
                        />

                        {/* Vignette effect */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />

                        {/* Favourite Button - Only for authenticated applicants */}
                        {auth?.user && auth.user.role === 'applicant' && (
                            <button
                                onClick={handleFavouriteToggle}
                                className="absolute right-4 top-4 rounded-full bg-white/90 p-3 shadow-lg backdrop-blur-sm transition-all duration-300 hover:bg-white hover:scale-110"
                                aria-label={favourited ? "Remove from favourites" : "Add to favourites"}
                            >
                                <svg
                                    className={`h-6 w-6 transition-colors ${favourited ? 'fill-red-500 text-red-500' : 'fill-none text-gray-600'}`}
                                    stroke="currentColor"
                                    strokeWidth={2}
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                    />
                                </svg>
                            </button>
                        )}

                        {/* Navigation Arrows - Only show if more than 1 image */}
                        {images.length > 1 && (
                            <>
                                <button
                                    onClick={prevImage}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-4 text-indigo-600 opacity-0 shadow-lg backdrop-blur-sm transition-all duration-300 hover:bg-white hover:scale-110 group-hover:opacity-100"
                                    aria-label="Previous image"
                                >
                                    <svg
                                        className="h-10 w-10"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={3}
                                            d="M15 19l-7-7 7-7"
                                        />
                                    </svg>
                                </button>
                                <button
                                    onClick={nextImage}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-4 text-indigo-600 opacity-0 shadow-lg backdrop-blur-sm transition-all duration-300 hover:bg-white hover:scale-110 group-hover:opacity-100"
                                    aria-label="Next image"
                                >
                                    <svg
                                        className="h-10 w-10"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={3}
                                            d="M9 5l7 7-7 7"
                                        />
                                    </svg>
                                </button>

                                {/* Dot Indicators */}
                                <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2.5 rounded-full bg-black/30 px-4 py-2 backdrop-blur-md">
                                    {images.map((_, index) => (
                                        <button
                                            key={index}
                                            onClick={() =>
                                                setCurrentImageIndex(index)
                                            }
                                            className={`h-3.5 w-3.5 rounded-full transition-all duration-300 ${index === currentImageIndex
                                                ? 'w-10 bg-white shadow-lg'
                                                : 'bg-white/60 hover:bg-white/80 hover:scale-110'
                                                }`}
                                            aria-label={`Go to image ${index + 1}`}
                                        />
                                    ))}
                                </div>
                            </>
                        )}
                    </>
                ) : (
                    // Placeholder when no images
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
                        <div className="text-center">
                            <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-purple-100">
                                <svg
                                    className="h-12 w-12 text-indigo-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                </svg>
                            </div>
                            <p className="text-lg font-medium text-gray-500">
                                No images available
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Display Pins side by side under the picture */}
            {searchContext?.displayPins && searchContext.displayPins.length > 0 && (
                <div className="border-b border-gray-100 bg-gradient-to-r from-indigo-50/20 via-purple-50/20 to-pink-50/20 px-6 py-3.5 flex gap-3">
                    {searchContext.displayPins.map((pin, idx) => {
                        let valueText = '';
                        if (pin.type === 'suggested') {
                            const poi = property.poi_cache?.find(p => p.poi_type === pin.poi_type);
                            if (poi) {
                                const dist = Number(poi.distance_miles).toFixed(1);
                                valueText = `${dist}mi (${getTravelTimeStr(poi.distance_miles, 'walking')})`;
                            } else {
                                valueText = 'Not nearby';
                            }
                        } else if (pin.type === 'custom') {
                            if (pin.resolved) {
                                const dist = calculateDistance(property.latitude, property.longitude, pin.resolved.lat, pin.resolved.lng);
                                if (pin.customPin.type === 'commute') {
                                    valueText = getTravelTimeStr(dist, pin.customPin.mode || 'driving');
                                } else {
                                    valueText = `${Number(dist).toFixed(1)}mi`;
                                }
                            } else {
                                valueText = 'Resolving...';
                            }
                        }
                        return (
                            <div key={idx} className="flex-1 flex flex-col items-center justify-center p-2 rounded-xl bg-white border border-indigo-50 shadow-sm text-center min-w-0">
                                <span className="text-lg mb-0.5">{pin.icon}</span>
                                <span className="text-[10px] font-extrabold text-gray-900 truncate w-full" title={pin.label}>
                                    {pin.label}
                                </span>
                                <span className="text-[9px] font-bold text-indigo-600 truncate w-full mt-0.5">
                                    {valueText}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Bottom Legend */}
            <div className="relative space-y-4 bg-gradient-to-b from-white to-gray-50 p-8">
                <div className="flex items-center justify-between rounded-xl border-2 border-gray-100 bg-white px-6 py-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-md">
                            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-500">Listed by</p>
                            <p className="text-base font-bold text-gray-900">{property.agent.name}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-xs font-medium text-gray-500">Listed on</p>
                        <p className="text-base font-semibold text-gray-700">{formatDate(property.created_at)}</p>
                    </div>
                </div>

                {/* View Details Button */}
                <Link
                    href={`/properties/${property.id}${window.location.search}`}
                    className="mt-4 block w-full rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 text-center text-xl font-bold text-white shadow-lg transition-all duration-300 hover:from-indigo-700 hover:to-purple-700 hover:shadow-xl hover:scale-105"
                >
                    View Details
                </Link>
            </div>
        </div>
    );
}
