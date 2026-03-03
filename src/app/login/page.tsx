import { login } from './actions'
import { PackageOpen } from 'lucide-react'

export default async function LoginPage(props: { searchParams: Promise<{ message: string }> }) {
    const searchParams = await props.searchParams;
    const message = searchParams.message;

    return (
        <div className="flex h-screen w-full items-center justify-center bg-slate-50">
            <div className="w-full max-w-sm space-y-8 rounded-xl bg-white p-8 shadow-md border border-slate-100">
                <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="flex items-center justify-center rounded-full bg-indigo-100 p-3">
                        <PackageOpen className="h-8 w-8 text-indigo-700" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Sign in to TMSLite</h1>
                    <p className="text-sm text-slate-500">
                        Enter your email and password to access your account.
                    </p>
                </div>

                <form className="flex-1 flex flex-col w-full justify-center gap-4 text-slate-900">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="email">
                            Email
                        </label>
                        <input
                            className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
                            name="email"
                            placeholder="you@example.com"
                            required
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <label
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                htmlFor="password"
                            >
                                Password
                            </label>
                        </div>
                        <input
                            className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
                            type="password"
                            name="password"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        formAction={login}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-indigo-600 text-white hover:bg-indigo-700 h-10 px-4 py-2 mt-4"
                    >
                        Sign In
                    </button>

                    {message && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm text-center border border-red-100 mt-4">
                            {message}
                        </div>
                    )}
                </form>
            </div>
        </div>
    )
}
