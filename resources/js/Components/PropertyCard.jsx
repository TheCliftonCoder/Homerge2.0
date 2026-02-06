import { useState } from 'react';

export default function PropertyCard({ property }) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const images = property.images || [];
    const hasImages = images.length > 0;

    const formatPrice = (price) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
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

    return (
        <div className="group relative overflow-hidden rounded-3xl bg-white shadow-xl transition-all duration-500 hover:shadow-2xl hover:-translate-y-1">
            {/* Decorative gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

            {/* Top Legend */}
            <div className="relative border-b-2 border-indigo-100 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 px-8 py-6">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2.5">
                        <svg
                            className="h-7 w-7 text-indigo-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                            />
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                        </svg>
                        <span className="text-2xl font-bold text-gray-900">
                            {property.location}
                        </span>
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

            {/* Bottom Legend */}
            <div className="relative space-y-4 bg-gradient-to-b from-white to-gray-50 p-8">
                <div className="flex items-center justify-center">
                    <div className="flex items-center gap-2.5 rounded-full bg-purple-50 px-6 py-3 text-purple-700 transition-colors hover:bg-purple-100">
                        <svg
                            className="h-7 w-7"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z"
                            />
                        </svg>
                        <span className="text-xl font-bold">{property.size_sqft.toLocaleString()} sqft</span>
                    </div>
                </div>

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
            </div>
        </div>
    );
}
