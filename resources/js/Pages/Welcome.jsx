import { Head, Link } from '@inertiajs/react';

export default function Welcome({ auth }) {
    return (
        <>
            <Head title="Welcome to Homerge" />
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
                <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex h-16 items-center justify-between">
                            <div className="flex items-center">
                                <h1 className="text-2xl font-bold text-indigo-600">
                                    Homerge
                                </h1>
                            </div>
                            <div className="flex items-center gap-4">
                                {auth.user ? (
                                    <Link
                                        href={route('dashboard')}
                                        className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                                    >
                                        Dashboard
                                    </Link>
                                ) : (
                                    <>
                                        <Link
                                            href={route('login')}
                                            className="rounded-md px-4 py-2 text-sm font-semibold text-gray-700 hover:text-indigo-600"
                                        >
                                            Log in
                                        </Link>
                                        <Link
                                            href={route('register')}
                                            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                                        >
                                            Register
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </nav>

                <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
                    <div className="text-center">
                        <h1 className="mb-6 text-6xl font-bold tracking-tight text-gray-900 sm:text-7xl">
                            Welcome to{' '}
                            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                Homerge
                            </span>
                        </h1>
                        <p className="mb-10 text-xl text-gray-600">
                            Your trusted platform for finding the perfect
                            property
                        </p>
                        <div className="flex justify-center gap-4">
                            <Link
                                href={route('properties.index')}
                                className="rounded-lg bg-indigo-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition hover:bg-indigo-500 hover:shadow-xl"
                            >
                                View Properties
                            </Link>
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}
