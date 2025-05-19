import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { EyeIcon, EyeOffIcon, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/layout/LanguageSwitcher';
import logo from '../assets/logo.png';

const LoginPage = () => {
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Add RTL class to body when using RTL language
  useEffect(() => {
    document.body.classList.toggle('rtl', document.documentElement.dir === 'rtl');
    return () => document.body.classList.remove('rtl');
  }, [i18n.language]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isLoading) return;
    
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      navigate('/', { replace: true });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  return (
    <div className="relative flex min-h-screen bg-background">
      {/* Left panel with background pattern */}
      <div className="hidden lg:block lg:w-1/2 bg-gradient-to-br from-primary/5 to-primary/10">
        <div className="relative flex h-full items-center justify-center p-8">
          {/* Abstract pattern background */}
          <div className="absolute inset-0 bg-grid-primary/[0.05]" />
          
          {/* Language switcher for desktop */}
          <div className="absolute top-6 right-6">
            <LanguageSwitcher variant="minimal" />
          </div>
          
          {/* Welcome content */}
          <div className="relative z-10 max-w-2xl space-y-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <img
                src={logo}
                alt="Sovy Logo"
                className="mx-auto h-24 w-auto sm:h-32"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="space-y-6"
            >
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                {t('auth.welcomeBack')}
              </h1>
              <p className="mx-auto max-w-lg text-lg text-muted-foreground">
                {t('auth.welcomeMessage')}
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Right panel with login form */}
      <div className="flex w-full items-center justify-center p-4 sm:p-8 lg:w-1/2 lg:p-12">
        {/* Language switcher for mobile */}
        <div className="absolute top-4 right-4 lg:hidden">
          <LanguageSwitcher variant="minimal" />
        </div>
        
        <div className="w-full max-w-lg space-y-8">
          {/* Mobile logo and welcome message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center lg:hidden"
          >
            <img
              src={logo}
              alt="Sovy Logo"
              className="mx-auto h-20 w-auto sm:h-24"
            />
            <h1 className="mt-6 text-2xl font-bold tracking-tight sm:text-3xl">
              {t('auth.welcomeBack')}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {t('auth.merchantAccount')}
            </p>
          </motion.div>

          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-8 space-y-6"
            onSubmit={handleSubmit}
            noValidate
            autoComplete="off"
          >
            <div className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="block text-base font-medium text-foreground"
                >
                  {t('auth.email')}
                </label>
                <div className="mt-2">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="block w-full rounded-lg border-0 bg-background px-4 py-3 text-foreground shadow-sm ring-1 ring-inset ring-input placeholder:text-muted-foreground focus:ring-2 focus:ring-primary sm:text-base sm:leading-6 disabled:opacity-50"
                    placeholder="your@email.com"
                    dir="ltr" // Force LTR for email input
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-base font-medium text-foreground"
                  >
                    {t('auth.password')}
                  </label>
                  <button
                    type="button"
                    className="text-sm font-medium text-primary hover:text-primary/90 hover:underline focus-visible:text-primary/90"
                    onClick={() => {
                      // TODO: Implement forgot password functionality
                      alert('Forgot password functionality will be implemented soon.');
                    }}
                  >
                    {t('auth.forgotPassword')}
                  </button>
                </div>
                <div className="relative mt-2">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="block w-full rounded-lg border-0 bg-background px-4 py-3 text-foreground shadow-sm ring-1 ring-inset ring-input placeholder:text-muted-foreground focus:ring-2 focus:ring-primary sm:text-base sm:leading-6 disabled:opacity-50"
                    placeholder={t('auth.passwordPlaceholder')}
                    dir="ltr" // Force LTR for password input
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute inset-y-0 right-0 flex items-center px-4 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOffIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg bg-destructive/15 px-4 py-3 text-sm text-destructive"
                role="alert"
              >
                {error}
              </motion.div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="relative flex w-full items-center justify-center rounded-lg bg-primary px-8 py-3 text-base font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50 sm:text-lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    {t('auth.signingIn')}
                  </>
                ) : (
                  t('auth.signIn')
                )}
              </button>
            </div>
          </motion.form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;