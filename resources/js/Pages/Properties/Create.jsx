import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, useForm } from '@inertiajs/react';

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        price: '',
        location: '',
        size_sqft: '',
        images: [],
    });

    const [imagePreviews, setImagePreviews] = useState([]);

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);

        if (files.length > 10) {
            alert('You can only upload a maximum of 10 images');
            return;
        }

        setData('images', files);

        // Create preview URLs
        const previews = files.map((file) => URL.createObjectURL(file));
        setImagePreviews(previews);
    };

    const removeImage = (index) => {
        const newImages = data.images.filter((_, i) => i !== index);
        const newPreviews = imagePreviews.filter((_, i) => i !== index);

        setData('images', newImages);
        setImagePreviews(newPreviews);
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('properties.store'));
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    List New Property
                </h2>
            }
        >
            <Head title="List New Property" />

            <div className="py-12">
                <div className="mx-auto max-w-2xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <form onSubmit={submit} className="p-6">
                            <div className="space-y-6">
                                <div>
                                    <InputLabel
                                        htmlFor="name"
                                        value="Property Name"
                                    />
                                    <TextInput
                                        id="name"
                                        type="text"
                                        className="mt-1 block w-full"
                                        value={data.name}
                                        onChange={(e) =>
                                            setData('name', e.target.value)
                                        }
                                        required
                                        autoFocus
                                    />
                                    <InputError
                                        message={errors.name}
                                        className="mt-2"
                                    />
                                </div>

                                <div>
                                    <InputLabel htmlFor="price" value="Price" />
                                    <TextInput
                                        id="price"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        className="mt-1 block w-full"
                                        value={data.price}
                                        onChange={(e) =>
                                            setData('price', e.target.value)
                                        }
                                        required
                                    />
                                    <InputError
                                        message={errors.price}
                                        className="mt-2"
                                    />
                                </div>

                                <div>
                                    <InputLabel
                                        htmlFor="location"
                                        value="Location"
                                    />
                                    <TextInput
                                        id="location"
                                        type="text"
                                        className="mt-1 block w-full"
                                        value={data.location}
                                        onChange={(e) =>
                                            setData('location', e.target.value)
                                        }
                                        required
                                    />
                                    <InputError
                                        message={errors.location}
                                        className="mt-2"
                                    />
                                </div>

                                <div>
                                    <InputLabel
                                        htmlFor="size_sqft"
                                        value="Size (sqft)"
                                    />
                                    <TextInput
                                        id="size_sqft"
                                        type="number"
                                        min="1"
                                        className="mt-1 block w-full"
                                        value={data.size_sqft}
                                        onChange={(e) =>
                                            setData('size_sqft', e.target.value)
                                        }
                                        required
                                    />
                                    <InputError
                                        message={errors.size_sqft}
                                        className="mt-2"
                                    />
                                </div>

                                <div>
                                    <InputLabel
                                        htmlFor="images"
                                        value="Property Images (Max 10)"
                                    />
                                    <input
                                        id="images"
                                        type="file"
                                        multiple
                                        accept="image/jpeg,image/png,image/jpg"
                                        onChange={handleImageChange}
                                        className="mt-1 block w-full rounded-md border-gray-300 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100"
                                    />
                                    <p className="mt-1 text-sm text-gray-500">
                                        {data.images.length}/10 images selected
                                    </p>
                                    <InputError
                                        message={errors.images}
                                        className="mt-2"
                                    />

                                    {/* Image Previews */}
                                    {imagePreviews.length > 0 && (
                                        <div className="mt-4 grid grid-cols-3 gap-4">
                                            {imagePreviews.map((preview, index) => (
                                                <div
                                                    key={index}
                                                    className="group relative aspect-video overflow-hidden rounded-lg border border-gray-200"
                                                >
                                                    <img
                                                        src={preview}
                                                        alt={`Preview ${index + 1}`}
                                                        className="h-full w-full object-cover"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            removeImage(index)
                                                        }
                                                        className="absolute right-2 top-2 rounded-full bg-red-500 p-1 text-white opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100"
                                                    >
                                                        <svg
                                                            className="h-4 w-4"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M6 18L18 6M6 6l12 12"
                                                            />
                                                        </svg>
                                                    </button>
                                                    <div className="absolute bottom-2 left-2 rounded bg-black/50 px-2 py-1 text-xs text-white">
                                                        {index + 1}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center justify-end gap-4">
                                    <PrimaryButton disabled={processing}>
                                        List Property
                                    </PrimaryButton>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
