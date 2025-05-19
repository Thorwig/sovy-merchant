import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, MapPin, Phone, Save, ShieldCheck, X } from 'lucide-react';
import { z } from 'zod';

const profileSchema = z.object({
  businessName: z.string().min(2, 'Business name must be at least 2 characters'),
  description: z.string().optional(),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  city: z.string().min(2, 'City must be at least 2 characters'),
  postalCode: z.string().min(3, 'Postal code must be at least 3 characters'),
  phone: z.string().regex(/^\+?[1-9]\d{7,14}$/, 'Invalid phone number format'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface InfoCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
}

const InfoCard = ({ title, value, icon }: InfoCardProps) => (
  <div className="flex items-start gap-3 rounded-lg border bg-card p-3">
    <div className="rounded-full bg-primary/10 p-1.5 text-primary">{icon}</div>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-muted-foreground">{title}</p>
      <p className="font-medium truncate">{value}</p>
    </div>
  </div>
);

const LoadingSkeleton = () => (
  <div className="space-y-6">
    <div className="h-8 w-48 animate-pulse rounded-lg bg-gray-200" />
    <div className="grid gap-6 sm:grid-cols-2">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex items-start gap-4 rounded-lg border bg-card p-4">
          <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
            <div className="h-5 w-36 animate-pulse rounded bg-gray-200" />
          </div>
        </div>
      ))}
    </div>
    <div className="rounded-lg border">
      <div className="border-b p-6">
        <div className="mb-4 h-8 w-32 animate-pulse rounded bg-gray-200" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 w-full animate-pulse rounded-lg bg-gray-200" />
          ))}
        </div>
      </div>
    </div>
  </div>
);

const ProfilePage = () => {
  const { t } = useTranslation();
  const { merchant, updateMerchantProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<ProfileFormData>({
    businessName: merchant?.businessName || '',
    description: merchant?.description || '',
    address: merchant?.address || '',
    city: merchant?.city || '',
    postalCode: merchant?.postalCode || '',
    phone: merchant?.phone || '',
    latitude: merchant?.latitude || 0,
    longitude: merchant?.longitude || 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!merchant) {
    return <LoadingSkeleton />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setIsSubmitting(true);

    try {
      // Validate form data
      const validatedData = profileSchema.parse(form);
      await updateMerchantProfile(validatedData);
      setSuccess(true);
      setTimeout(() => {
        setIsEditing(false);
        setSuccess(false);
      }, 2000);
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
      } else {
        setError(err instanceof Error ? err.message : t('profile.updateError'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold sm:text-3xl">{t('profile.title')}</h1>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 sm:w-auto"
          >
            <ShieldCheck className="h-4 w-4" />
            {t('profile.edit')}
          </button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InfoCard
          icon={<Building2 className="h-4 w-4" />}
          title={t('profile.businessName')}
          value={merchant.businessName}
        />
        <InfoCard
          icon={<Phone className="h-4 w-4" />}
          title={t('profile.contact')}
          value={merchant.phone}
        />
        <InfoCard
          icon={<MapPin className="h-4 w-4" />}
          title={t('profile.location')}
          value={merchant.address}
        />
        <InfoCard
          icon={<MapPin className="h-4 w-4" />}
          title={t('profile.area')}
          value={`${merchant.city}, ${merchant.postalCode}`}
        />
      </div>

      <div className="relative overflow-hidden rounded-lg border bg-card">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-primary/10" />
        <div className="relative p-4">
          <h3 className="mb-2 text-sm font-medium">{t('profile.about')}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {merchant.description || t('profile.noDescription')}
          </p>
        </div>
      </div>

      {/* Edit Form */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-50 overflow-y-auto bg-background/80 backdrop-blur-sm"
          >
            <div className="min-h-full flex items-center justify-center p-4">
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                className="w-full max-w-2xl rounded-lg border bg-card shadow-lg"
              >
                <div className="flex items-center justify-between border-b p-4">
                  <h2 className="text-lg font-semibold">{t('profile.editTitle')}</h2>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="rounded-full p-2 hover:bg-secondary"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="divide-y">
                  <div className="p-4 space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      {/* Business Info Section */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{t('profile.businessName')}</label>
                        <input
                          type="text"
                          value={form.businessName}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              businessName: e.target.value,
                            }))
                          }
                          required
                          className="w-full rounded-md border bg-background px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">{t('profile.phone')}</label>
                        <input
                          type="tel"
                          value={form.phone}
                          onChange={(e) =>
                            setForm((prev) => ({ ...prev, phone: e.target.value }))
                          }
                          placeholder="+1234567890"
                          required
                          className="w-full rounded-md border bg-background px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                        <p className="text-xs text-muted-foreground">{t('profile.phoneFormat')}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">{t('profile.description')}</label>
                      <textarea
                        value={form.description}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                        rows={3}
                        placeholder={t('profile.descriptionPlaceholder')}
                        className="w-full rounded-md border bg-background px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{t('profile.address')}</label>
                        <input
                          type="text"
                          value={form.address}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              address: e.target.value,
                            }))
                          }
                          required
                          className="w-full rounded-md border bg-background px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">{t('profile.city')}</label>
                          <input
                            type="text"
                            value={form.city}
                            onChange={(e) =>
                              setForm((prev) => ({ ...prev, city: e.target.value }))
                            }
                            required
                            className="w-full rounded-md border bg-background px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">{t('profile.postalCode')}</label>
                          <input
                            type="text"
                            value={form.postalCode}
                            onChange={(e) =>
                              setForm((prev) => ({
                                ...prev,
                                postalCode: e.target.value,
                              }))
                            }
                            required
                            className="w-full rounded-md border bg-background px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Coordinates Section */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{t('profile.latitude')}</label>
                        <input
                          type="number"
                          step="any"
                          value={form.latitude}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              latitude: parseFloat(e.target.value) || 0,
                            }))
                          }
                          required
                          className="w-full rounded-md border bg-background px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                        <p className="text-xs text-muted-foreground">{t('profile.latitudeRange')}</p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{t('profile.longitude')}</label>
                        <input
                          type="number"
                          step="any"
                          value={form.longitude}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              longitude: parseFloat(e.target.value) || 0,
                            }))
                          }
                          required
                          className="w-full rounded-md border bg-background px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                        <p className="text-xs text-muted-foreground">{t('profile.longitudeRange')}</p>
                      </div>
                    </div>
                  </div>

                  {/* Form Footer */}
                  <div className="bg-muted/50 p-4">
                    {error && (
                      <div className="mb-4 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                        {error}
                      </div>
                    )}

                    {success && (
                      <div className="mb-4 rounded-md bg-green-100 p-3 text-sm text-green-800">
                        {t('profile.updateSuccess')}
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="rounded-md px-4 py-2 text-sm font-medium hover:bg-secondary"
                        disabled={isSubmitting}
                      >
                        {t('common.cancel')}
                      </button>
                      <button
                        type="submit"
                        className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            {t('profile.saving')}
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4" />
                            {t('profile.saveChanges')}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfilePage;