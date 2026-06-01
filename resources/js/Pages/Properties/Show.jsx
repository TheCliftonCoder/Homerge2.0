import { useState } from 'react';
import { Head, router, useForm, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PublicLayout from '@/Layouts/PublicLayout';

export default function Show({ auth, property, hasEnquired = false, filters = {}, resolvedPins = [] }) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [showEnquiryForm, setShowEnquiryForm] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        message: '',
        preferred_date: '',
        contact_phone: '',
    });

    const handleEnquirySubmit = (e) => {
        e.preventDefault();
        post(`/properties/${property.id}/enquire`, {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setShowEnquiryForm(false);
            },
        });
    };

    const images = property.images || [];
    const hasImages = images.length > 0;
    const category = property.property_category;
    const transaction = category?.transaction;

    // Detect types from polymorphic relationship type fields
    const isResidential = property.property_category_type?.includes('ResidentialProperty');
    const isSale = category?.transaction_type?.includes('SalesProperty');

    const formatPrice = (price) => {
        return new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: 'GBP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(price);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-GB', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
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

    const currentImage = hasImages
        ? `/storage/${images[currentImageIndex].image_path}`
        : null;

    const Layout = auth?.user ? AuthenticatedLayout : PublicLayout;

    return (
        <Layout>
            <Head title={property.name} />

            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {/* Back Button */}
                    <button
                        type="button"
                        onClick={() => window.history.back()}
                        className="mb-6 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:shadow-md"
                    >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back
                    </button>

                    {/* Property Header */}
                    <div className="mb-8 overflow-hidden rounded-2xl bg-white shadow-xl">
                        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6 text-white">
                            <h1 className="text-4xl font-bold">{property.name}</h1>
                            <div className="mt-2 flex items-center gap-2 text-lg">
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {property.location}
                            </div>
                        </div>

                        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-8 py-4">
                            <div className="text-5xl font-extrabold text-indigo-600">
                                {formatPrice(property.price)}
                            </div>
                            <div className="flex gap-3">
                                <span className="rounded-full bg-indigo-100 px-4 py-2 text-sm font-semibold text-indigo-700">
                                    {isResidential ? 'Residential' : 'Commercial'}
                                </span>
                                <span className="rounded-full bg-purple-100 px-4 py-2 text-sm font-semibold text-purple-700">
                                    {isSale ? 'For Sale' : 'For Rent'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                        {/* Left Column - Images */}
                        <div className="lg:col-span-2">
                            {/* Image Gallery */}
                            <div className="mb-8 overflow-hidden rounded-2xl bg-white shadow-xl">
                                <div className="relative aspect-video bg-gradient-to-br from-gray-100 to-gray-200">
                                    {hasImages ? (
                                        <>
                                            <img
                                                src={currentImage}
                                                alt={property.name}
                                                className="h-full w-full object-cover"
                                            />

                                            {images.length > 1 && (
                                                <>
                                                    <button
                                                        onClick={prevImage}
                                                        className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-3 text-indigo-600 shadow-lg backdrop-blur-sm transition-all hover:bg-white hover:scale-110"
                                                    >
                                                        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={nextImage}
                                                        className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-3 text-indigo-600 shadow-lg backdrop-blur-sm transition-all hover:bg-white hover:scale-110"
                                                    >
                                                        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                                                        </svg>
                                                    </button>

                                                    <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2 rounded-full bg-black/30 px-3 py-2 backdrop-blur-md">
                                                        {images.map((_, index) => (
                                                            <button
                                                                key={index}
                                                                onClick={() => setCurrentImageIndex(index)}
                                                                className={`h-2.5 w-2.5 rounded-full transition-all ${index === currentImageIndex
                                                                    ? 'w-8 bg-white'
                                                                    : 'bg-white/60 hover:bg-white/80'
                                                                    }`}
                                                            />
                                                        ))}
                                                    </div>
                                                </>
                                            )}
                                        </>
                                    ) : (
                                        <div className="flex h-full items-center justify-center">
                                            <div className="text-center">
                                                <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                <p className="mt-2 text-gray-500">No images available</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Description */}
                            {property.description && (
                                <div className="mb-8 rounded-2xl bg-white p-8 shadow-xl">
                                    <h2 className="mb-4 text-2xl font-bold text-gray-900">Description</h2>
                                    <p className="whitespace-pre-line text-gray-700 leading-relaxed">{property.description}</p>
                                </div>
                            )}

                            {/* Category-Specific Details */}
                            {isResidential ? (
                                <ResidentialDetails category={category} />
                            ) : (
                                <CommercialDetails category={category} />
                            )}

                            {/* Transaction-Specific Details */}
                            {isSale ? (
                                <SalesDetails transaction={transaction} />
                            ) : (
                                <RentalDetails transaction={transaction} />
                            )}

                            {/* Active Pins Proximity */}
                            {(() => {
                                const parseBool = (val) => {
                                    if (val === undefined || val === null) return false;
                                    if (typeof val === 'boolean') return val;
                                    const str = String(val).toLowerCase().trim();
                                    return str === 'true' || str === '1';
                                };

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

                                const poiProximity = filters?.poi_proximity || [];
                                const proximityPins = filters?.proximity_pins || [];

                                const activePins = [
                                    ...poiProximity
                                        .filter(poi => poi && poi.poi_type)
                                        .map(poi => ({
                                            type: 'suggested',
                                            poi_type: poi.poi_type,
                                            label: poi.label || getPoiLabel(poi.poi_type),
                                            icon: getPoiIcon(poi.poi_type),
                                            pinMode: poi.pin_mode || 'filter'
                                        })),
                                    ...proximityPins
                                        .filter(pin => pin && pin.query)
                                        .map((pin, idx) => {
                                            const resolved = resolvedPins?.find(rp => rp.query === pin.query && rp.label === pin.label);
                                            return {
                                                type: 'custom',
                                                index: idx,
                                                customPin: pin,
                                                label: pin.label || pin.query,
                                                icon: pin.type === 'commute' ? (pin.mode === 'driving' ? '🚗' : pin.mode === 'cycling' ? '🚲' : '🚶') : '📍',
                                                pinMode: pin.pin_mode || 'filter',
                                                resolved: resolved
                                            };
                                        })
                                ];

                                return activePins.length > 0 ? (
                                    <ActivePinsProximity activePins={activePins} property={property} />
                                ) : null;
                            })()}

                            {/* Nearby Amenities */}
                            <LocalAmenities amenities={property.poi_cache} />
                        </div>

                        {/* Right Column - Quick Info & Agent */}
                        <div className="space-y-6">
                            {/* Quick Info */}
                            <div className="rounded-2xl bg-white p-6 shadow-xl">
                                <h3 className="mb-4 text-xl font-bold text-gray-900">Quick Info</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                                        <span className="text-gray-600">Size</span>
                                        <span className="font-semibold text-gray-900">{property.size_sqft.toLocaleString()} sqft</span>
                                    </div>
                                    <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                                        <span className="text-gray-600">Listed</span>
                                        <span className="font-semibold text-gray-900">{formatDate(property.created_at)}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-600">Property ID</span>
                                        <span className="font-mono text-sm font-semibold text-gray-900">#{property.id}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Agent Info */}
                            <div className="rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 p-6 shadow-xl">
                                <h3 className="mb-4 text-xl font-bold text-gray-900">Listed By</h3>
                                <div className="flex items-center gap-4">
                                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-lg">
                                        <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-lg font-bold text-gray-900">{property.agent.name}</p>
                                        <p className="text-sm text-gray-600">{property.agent.email}</p>
                                    </div>
                                </div>
                                <div>
                                    {auth?.user ? (
                                        auth.user.role === 'applicant' ? (
                                            <Link
                                                href={`${route('messages.index')}?user_id=${property.agent_id}&property_id=${property.id}`}
                                                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 font-semibold text-white shadow-md transition-all hover:from-indigo-700 hover:to-purple-700 hover:shadow-lg"
                                            >
                                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                                </svg>
                                                Message Agent
                                            </Link>
                                        ) : (
                                            <div className="mt-4 rounded-lg bg-gray-100 p-3 text-center text-sm font-medium text-gray-500 italic">
                                                Viewing as Agent/Admin
                                            </div>
                                        )
                                    ) : (
                                        <Link
                                            href={route('login')}
                                            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 font-semibold text-white shadow-md transition-all hover:from-indigo-700 hover:to-purple-700 hover:shadow-lg"
                                        >
                                            Login to Message Agent
                                        </Link>
                                    )}
                                </div>
                            </div>

                            {/* Enquire to View - Only for authenticated applicants */}
                            {auth?.user && auth.user.role === 'applicant' && (
                                <div className="rounded-2xl bg-white p-6 shadow-xl">
                                    <h3 className="mb-4 text-xl font-bold text-gray-900">Enquire to View</h3>

                                    {hasEnquired ? (
                                        <div className="rounded-lg bg-green-50 p-4 text-center">
                                            <svg className="mx-auto h-12 w-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <p className="mt-2 font-semibold text-green-700">You've already enquired about this property</p>
                                        </div>
                                    ) : !showEnquiryForm ? (
                                        <button
                                            onClick={() => setShowEnquiryForm(true)}
                                            className="w-full rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-3 font-semibold text-white shadow-md transition-all hover:from-green-700 hover:to-emerald-700 hover:shadow-lg"
                                        >
                                            Request Viewing
                                        </button>
                                    ) : (
                                        <form onSubmit={handleEnquirySubmit} className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Message (Optional)</label>
                                                <textarea
                                                    value={data.message}
                                                    onChange={(e) => setData('message', e.target.value)}
                                                    rows={3}
                                                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                    placeholder="Any specific requirements or questions..."
                                                />
                                                {errors.message && <p className="mt-1 text-sm text-red-600">{errors.message}</p>}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Preferred Viewing Date (Optional)</label>
                                                <input
                                                    type="datetime-local"
                                                    value={data.preferred_date}
                                                    onChange={(e) => setData('preferred_date', e.target.value)}
                                                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                />
                                                {errors.preferred_date && <p className="mt-1 text-sm text-red-600">{errors.preferred_date}</p>}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Contact Phone (Optional)</label>
                                                <input
                                                    type="tel"
                                                    value={data.contact_phone}
                                                    onChange={(e) => setData('contact_phone', e.target.value)}
                                                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                    placeholder="Your phone number"
                                                />
                                                {errors.contact_phone && <p className="mt-1 text-sm text-red-600">{errors.contact_phone}</p>}
                                            </div>

                                            <div className="flex gap-2">
                                                <button
                                                    type="submit"
                                                    disabled={processing}
                                                    className="flex-1 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-3 font-semibold text-white shadow-md transition-all hover:from-green-700 hover:to-emerald-700 hover:shadow-lg disabled:opacity-50"
                                                >
                                                    {processing ? 'Sending...' : 'Send Enquiry'}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setShowEnquiryForm(false);
                                                        reset();
                                                    }}
                                                    className="rounded-lg border-2 border-gray-300 px-4 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </form>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}

// Residential Property Details Component
function ResidentialDetails({ category }) {
    return (
        <div className="rounded-2xl bg-white p-8 shadow-xl">
            <h2 className="mb-6 text-2xl font-bold text-gray-900">Residential Details</h2>
            <div className="grid grid-cols-2 gap-6">
                <DetailItem icon="🛏️" label="Bedrooms" value={category.bedrooms} />
                <DetailItem icon="🚿" label="Bathrooms" value={category.bathrooms} />
                <DetailItem icon="🏠" label="Property Type" value={formatPropertyType(category.property_type)} />
                <DetailItem icon="🚗" label="Parking" value={formatParking(category.parking)} />
                {category.council_tax_band && (
                    <DetailItem icon="💷" label="Council Tax Band" value={`Band ${category.council_tax_band}`} />
                )}
                <DetailItem icon="🌳" label="Garden" value={category.garden ? 'Yes' : 'No'} />
                {category.access && (
                    <div className="col-span-2">
                        <DetailItem icon="♿" label="Accessibility" value={category.access} />
                    </div>
                )}
            </div>
        </div>
    );
}

// Commercial Property Details Component
function CommercialDetails({ category }) {
    return (
        <div className="rounded-2xl bg-white p-8 shadow-xl">
            <h2 className="mb-6 text-2xl font-bold text-gray-900">Commercial Details</h2>
            <div className="grid grid-cols-2 gap-6">
                <DetailItem icon="🏢" label="Property Type" value={formatCommercialType(category.property_type)} />
            </div>
        </div>
    );
}

// Sales Property Details Component
function SalesDetails({ transaction }) {
    return (
        <div className="mt-8 rounded-2xl bg-white p-8 shadow-xl">
            <h2 className="mb-6 text-2xl font-bold text-gray-900">Sales Information</h2>
            <div className="grid grid-cols-2 gap-6">
                <DetailItem icon="📜" label="Tenure" value={formatTenure(transaction.tenure)} />
                {transaction.tenure === 'leasehold' && (
                    <>
                        {transaction.lease_years_remaining && (
                            <DetailItem icon="⏳" label="Lease Remaining" value={`${transaction.lease_years_remaining} years`} />
                        )}
                        {transaction.ground_rent && (
                            <DetailItem icon="💰" label="Ground Rent" value={`£${parseFloat(transaction.ground_rent).toFixed(2)}/year`} />
                        )}
                        {transaction.service_charge && (
                            <DetailItem icon="🔧" label="Service Charge" value={`£${parseFloat(transaction.service_charge).toFixed(2)}/year`} />
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

// Rental Property Details Component
function RentalDetails({ transaction }) {
    return (
        <div className="mt-8 rounded-2xl bg-white p-8 shadow-xl">
            <h2 className="mb-6 text-2xl font-bold text-gray-900">Rental Information</h2>
            <div className="grid grid-cols-2 gap-6">
                <DetailItem icon="📅" label="Available From" value={new Date(transaction.available_date).toLocaleDateString('en-GB')} />
                <DetailItem icon="💵" label="Deposit" value={`£${parseFloat(transaction.deposit).toFixed(2)}`} />
                <DetailItem icon="📆" label="Min Tenancy" value={`${transaction.min_tenancy_months} months`} />
                <DetailItem icon="🏷️" label="Let Type" value={formatLetType(transaction.let_type)} />
                <DetailItem icon="🛋️" label="Furnishing" value={formatFurnished(transaction.furnished)} />
                <DetailItem icon="💡" label="Bills Included" value={transaction.bills_included ? 'Yes' : 'No'} />
                <DetailItem icon="🐕" label="Pets Allowed" value={transaction.pets_allowed ? 'Yes' : 'No'} />
            </div>
        </div>
    );
}

// Reusable Detail Item Component
function DetailItem({ icon, label, value }) {
    return (
        <div className="flex items-start gap-3 rounded-lg bg-gray-50 p-4">
            <span className="text-2xl">{icon}</span>
            <div>
                <p className="text-sm font-medium text-gray-600">{label}</p>
                <p className="mt-1 text-lg font-semibold text-gray-900">{value}</p>
            </div>
        </div>
    );
}

// Local Amenities Component
function LocalAmenities({ amenities }) {
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

    const getTravelTimeStr = (miles) => {
        const mins = Math.round(miles * 20); // 3mph walking
        return `~${mins} min walk`;
    };

    if (!amenities || amenities.length === 0) {
        return null;
    }

    return (
        <div className="mt-8 rounded-2xl bg-white p-8 shadow-xl">
            <h2 className="mb-6 text-2xl font-bold text-gray-900 flex items-center gap-2">
                <span>📍</span> Nearby Amenities
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {amenities.map((poi, idx) => (
                    <div key={idx} className="flex items-start gap-4 rounded-xl bg-gray-50 p-4 hover:shadow-md transition-all duration-200">
                        <span className="text-3xl p-2 bg-white rounded-xl shadow-sm">{getPoiIcon(poi.poi_type)}</span>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                                {poi.poi_type.replace('_', ' ')}
                            </p>
                            <p className="mt-1 font-semibold text-gray-900 truncate" title={poi.name}>
                                {poi.name}
                            </p>
                            <div className="mt-2 flex items-center gap-2 text-xs text-gray-500 font-medium">
                                <span>{Number(poi.distance_miles).toFixed(1)} miles</span>
                                <span>•</span>
                                <span>{getTravelTimeStr(poi.distance_miles)}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Formatting Helper Functions
function formatPropertyType(type) {
    const types = {
        detached: 'Detached',
        semi_detached: 'Semi-Detached',
        terraced: 'Terraced',
        flat: 'Flat',
        bungalow: 'Bungalow',
    };
    return types[type] || type;
}

function formatCommercialType(type) {
    const types = {
        retail: 'Retail',
        leisure: 'Leisure',
        industrial: 'Industrial',
        land_development: 'Land/Development',
        other: 'Other',
    };
    return types[type] || type;
}

function formatParking(parking) {
    const types = {
        none: 'None',
        street: 'Street Parking',
        driveway: 'Driveway',
        garage: 'Garage',
    };
    return types[parking] || parking;
}

function formatTenure(tenure) {
    const types = {
        freehold: 'Freehold',
        leasehold: 'Leasehold',
        share_of_freehold: 'Share of Freehold',
    };
    return types[tenure] || tenure;
}

function formatLetType(type) {
    const types = {
        long_term: 'Long Term',
        short_term: 'Short Term',
        corporate: 'Corporate',
    };
    return types[type] || type;
}

function formatFurnished(furnished) {
    const types = {
        unfurnished: 'Unfurnished',
        part_furnished: 'Part Furnished',
        furnished: 'Furnished',
    };
    return types[furnished] || furnished;
}

function ActivePinsProximity({ activePins, property }) {
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

    const getTravelTimeStr = (miles, mode = 'walking') => {
        if (mode === 'walking') {
            const mins = Math.round(miles * 20);
            return `~${mins} min walk`;
        }
        if (mode === 'driving') {
            const mins = Math.round(miles * 3);
            return `~${mins} min drive`;
        }
        if (mode === 'cycling') {
            const mins = Math.round(miles * 6);
            return `~${mins} min cycle`;
        }
        return '';
    };

    return (
        <div className="mt-8 rounded-2xl bg-white p-8 shadow-xl border border-indigo-100 animate-in fade-in duration-300">
            <h2 className="mb-6 text-2xl font-bold text-gray-900">
                My Pins
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activePins.map((pin, idx) => {
                    let valueText = '';
                    let detailsText = '';
                    if (pin.type === 'suggested') {
                        const poi = property.poi_cache?.find(p => p.poi_type === pin.poi_type);
                        if (poi) {
                            const dist = Number(poi.distance_miles).toFixed(1);
                            valueText = `${dist} miles`;
                            detailsText = getTravelTimeStr(poi.distance_miles, 'walking');
                        } else {
                            valueText = 'Not nearby';
                            detailsText = 'Outside typical range';
                        }
                    } else if (pin.type === 'custom') {
                        if (pin.resolved) {
                            const dist = calculateDistance(property.latitude, property.longitude, pin.resolved.lat, pin.resolved.lng);
                            if (pin.customPin.type === 'commute') {
                                valueText = `${Number(dist).toFixed(1)} miles`;
                                detailsText = getTravelTimeStr(dist, pin.customPin.mode || 'driving');
                            } else {
                                valueText = `${Number(dist).toFixed(1)} miles`;
                                detailsText = 'Direct distance';
                            }
                        } else {
                            valueText = 'Resolving...';
                        }
                    }
                    return (
                        <div key={idx} className="flex items-start gap-4 rounded-xl bg-gray-50 p-4 hover:shadow-md transition-all duration-200">
                            <span className="text-3xl p-2 bg-white rounded-xl shadow-sm">{pin.icon}</span>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                                        {pin.label}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border ${
                                        pin.pinMode === 'filter'
                                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                                            : 'bg-slate-100 border-slate-200 text-slate-600'
                                    }`}>
                                        {pin.pinMode === 'filter' ? 'Filter' : 'Display Only'}
                                    </span>
                                </div>
                                <p className="mt-1.5 font-bold text-lg text-gray-900 leading-tight">
                                    {valueText}
                                </p>
                                <p className="mt-0.5 text-xs text-gray-500 font-medium">
                                    {detailsText}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
