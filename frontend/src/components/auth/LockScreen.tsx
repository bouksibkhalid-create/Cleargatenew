import { useState, type FormEvent } from 'react';
import { Shield, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';

interface LockScreenProps {
    onUnlock: () => void;
}

const CORRECT_PASSWORD = 'KB-CS-Presidence-26';
const ERROR_DISPLAY_DURATION = 600;

const LockScreen: React.FC<LockScreenProps> = ({ onUnlock }) => {
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isShaking, setIsShaking] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        if (!password.trim()) {
            return;
        }

        if (password === CORRECT_PASSWORD) {
            onUnlock();
        } else {
            setError('Incorrect password');
            setIsShaking(true);

            setTimeout(() => {
                setError('');
                setIsShaking(false);
            }, ERROR_DISPLAY_DURATION);
        }
    };

    return (
        <div className="lock-screen-v2">
            <div className="lock-screen-v2-content">
                {/* Logo */}
                <div className="flex flex-col items-center gap-3 mb-2">
                    <div className="w-14 h-14 rounded-2xl bg-[#00D4AA] flex items-center justify-center">
                        <Shield className="w-7 h-7 text-[#0F1419]" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-white uppercase">
                        ClearGate
                    </h1>
                    <p className="text-sm text-gray-400 text-center">
                        Enter the demo password to access the platform
                    </p>
                </div>

                {/* Password Form */}
                <form
                    onSubmit={handleSubmit}
                    className={`w-full max-w-sm flex flex-col gap-4 ${isShaking ? 'shake' : ''}`}
                >
                    <div className="flex flex-col gap-2">
                        <div className="relative">
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                            <input
                                id="password-input"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter password"
                                className="w-full pl-11 pr-11 py-3 text-base border border-white/20 rounded-xl bg-white/10 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/50 focus:border-transparent transition-all"
                                autoFocus
                                autoComplete="off"
                                aria-label="Password"
                                aria-describedby="error-message"
                                aria-invalid={error ? 'true' : 'false'}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-0.5"
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        {error && (
                            <p id="error-message" className="text-sm text-red-500 text-center" role="alert">
                                {error}
                            </p>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="w-full inline-flex items-center justify-center gap-2 py-3 bg-[#00D4AA] text-[#0F1419] font-semibold rounded-full hover:bg-[#00E4BA] transition-colors"
                    >
                        Access Platform
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </form>

                {/* Footer */}
                <p className="text-xs text-gray-400 mt-4">
                    Restricted Access &middot; ClearGate Intelligence Platform
                </p>
            </div>
        </div>
    );
};

export default LockScreen;
