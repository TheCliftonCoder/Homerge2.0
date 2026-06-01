import { Head, Link, router } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';

const PROMPTS = [
    '3 bed house Reading',
    '2 bed for rent Bracknell 1200',
    'flat in Wokingham under 400k',
    'home near Reading station'
];

export default function Welcome({ auth }) {
    const [placeholder, setPlaceholder] = useState('');
    const [prompt, setPrompt] = useState('');
    const [promptLoading, setPromptLoading] = useState(false);
    const [promptError, setPromptError] = useState('');
    const [isFocused, setIsFocused] = useState(false);

    // Keep animation progress in refs so it can resume exactly where it left off
    const animationStateRef = useRef({
        currentPromptIndex: 0,
        currentCharIndex: 0,
        isDeleting: false,
    });

    useEffect(() => {
        // Pause animation when focused or if user has entered search text
        if (isFocused || prompt.trim().length > 0) {
            if (isFocused) {
                setPlaceholder('');
            }
            return;
        }

        let typingSpeed = 100;
        let timer = null;

        const tick = () => {
            const state = animationStateRef.current;
            const fullText = PROMPTS[state.currentPromptIndex];
            
            if (state.isDeleting) {
                setPlaceholder(fullText.substring(0, state.currentCharIndex - 1));
                state.currentCharIndex--;
                typingSpeed = 50; // faster when deleting
            } else {
                setPlaceholder(fullText.substring(0, state.currentCharIndex + 1));
                state.currentCharIndex++;
                typingSpeed = 100; // standard typing speed
            }

            if (!state.isDeleting && state.currentCharIndex === fullText.length) {
                typingSpeed = 2000; // pause at the end
                state.isDeleting = true;
            } else if (state.isDeleting && state.currentCharIndex === 0) {
                state.isDeleting = false;
                state.currentPromptIndex = (state.currentPromptIndex + 1) % PROMPTS.length;
                typingSpeed = 500; // pause before typing next
            }

            timer = setTimeout(tick, typingSpeed);
        };

        timer = setTimeout(tick, typingSpeed);
        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [isFocused, prompt]);

    const handleSearch = async (e) => {
        if (e) e.preventDefault();
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
            if (!res.ok) {
                setPromptError(data.error || 'Something went wrong.');
                return;
            }
            const f = data.filters;
            
            const cleanFilters = Object.fromEntries(
                Object.entries({
                    transaction_type: f.transaction_type,
                    property_category: f.property_category,
                    property_type: f.property_type,
                    location: f.location,
                    radius: f.radius ? String(f.radius) : null,
                    min_price: f.min_price ? String(f.min_price) : null,
                    max_price: f.max_price ? String(f.max_price) : null,
                    bedrooms: f.bedrooms ? String(f.bedrooms) : null,
                    bathrooms: f.bathrooms ? String(f.bathrooms) : null,
                    parking: f.parking,
                    garden: f.garden,
                    furnished: f.furnished,
                    pets_allowed: f.pets_allowed,
                    poi_proximity: f.poi_proximity || [],
                    proximity_pins: f.proximity_pins || [],
                }).filter(([_, value]) => {
                    if (Array.isArray(value)) return value.length > 0;
                    if (value && typeof value === 'object') {
                        return Object.values(value).some(v => v !== '' && v !== null && v !== undefined);
                    }
                    return value !== '' && value !== null && value !== undefined;
                })
            );

            router.get('/search', cleanFilters);
        } catch (err) {
            setPromptError('Network error. Please try again.');
        } finally {
            setPromptLoading(false);
        }
    };

    return (
        <>
            <Head title="Homerge" />
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
                    <div className="text-center w-full max-w-2xl">
                        <h1 className="mb-10 text-6xl font-bold tracking-tight text-gray-900 sm:text-7xl">
                            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                Homerge
                            </span>
                        </h1>
                        
                        {/* AI Search Bar */}
                        <div className="mb-6 text-left">
                            <form onSubmit={handleSearch} className="flex items-center gap-3 bg-white rounded-2xl p-2 shadow-xl border border-gray-150 focus-within:ring-2 focus-within:ring-indigo-150 transition-all duration-300">
                                <input
                                    type="text"
                                    placeholder={placeholder}
                                    value={prompt}
                                    onChange={e => setPrompt(e.target.value)}
                                    onFocus={() => setIsFocused(true)}
                                    onBlur={() => setIsFocused(false)}
                                    className="flex-1 bg-transparent border-0 pl-4 pr-2 py-3 text-base text-gray-900 focus:outline-none focus:ring-0 placeholder-gray-400"
                                />
                                <button
                                    type="submit"
                                    disabled={promptLoading || !prompt.trim()}
                                    className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3.5 text-sm font-bold text-white shadow-md hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2 active:scale-95 shrink-0"
                                >
                                    {promptLoading ? (
                                        <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                        </svg>
                                    ) : (
                                        <span>Search</span>
                                    )}
                                </button>
                            </form>
                            {promptError && <p className="mt-3 text-sm text-red-600 text-center">{promptError}</p>}
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}
