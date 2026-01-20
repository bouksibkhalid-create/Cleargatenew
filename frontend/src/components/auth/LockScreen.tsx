import { useState, type FormEvent } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';
import MeshGradient from './MeshGradient';

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
            setError('Mot de passe incorrect');
            setIsShaking(true);

            setTimeout(() => {
                setError('');
                setIsShaking(false);
            }, ERROR_DISPLAY_DURATION);
        }
    };

    return (
        <div className="lock-screen">
            <MeshGradient />

            <div className="lock-screen-content">
                {/* Logo */}
                <div className="lock-screen-header">
                    <h1 className="cleargate-logo">Cleargate</h1>
                    <p className="lock-screen-subtitle">
                        Demo CS de son excellence le président Tshisekedi
                    </p>
                </div>

                {/* Password Form */}
                <form
                    onSubmit={handleSubmit}
                    className={`lock-screen-form ${isShaking ? 'shake' : ''}`}
                >
                    <div className="password-input-container">
                        <div className="password-input-wrapper">
                            <Lock className="password-icon" size={20} />
                            <input
                                id="password-input"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Entrez le mot de passe"
                                className="password-input"
                                autoFocus
                                autoComplete="off"
                                aria-label="Mot de passe"
                                aria-describedby="error-message"
                                aria-invalid={error ? 'true' : 'false'}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="password-toggle"
                                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                        {error && (
                            <div id="error-message" className="error-message" role="alert">
                                {error}
                            </div>
                        )}
                    </div>

                    <button type="submit" className="submit-button">
                        Accéder
                    </button>
                </form>

                {/* Footer */}
                <p className="lock-screen-footer">
                    Accès restreint · Cleargate Intelligence Platform
                </p>
            </div>
        </div>
    );
};

export default LockScreen;
