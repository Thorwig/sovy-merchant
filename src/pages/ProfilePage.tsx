import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
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

const ProfilePage = () => {
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

  if (!merchant) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-muted-foreground">Loading profile...</div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      // Validate form data
      const validatedData = profileSchema.parse(form);
      await updateMerchantProfile(validatedData);
      setIsEditing(false);
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to update profile');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Business Profile</h1>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Edit Profile
          </button>
        )}
      </div>

      <div className="rounded-lg border bg-card p-6">
        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Business Name</label>
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
                  className="w-full rounded-md border bg-background px-3 py-2"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Phone</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  placeholder="+1234567890"
                  required
                  className="w-full rounded-md border bg-background px-3 py-2"
                />
                <p className="text-xs text-muted-foreground">Format: +1234567890</p>
              </div>

              <div className="sm:col-span-2">
                <label className="text-sm font-medium">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={3}
                  className="mt-2 w-full rounded-md border bg-background px-3 py-2"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Address</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, address: e.target.value }))
                  }
                  required
                  className="w-full rounded-md border bg-background px-3 py-2"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">City</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, city: e.target.value }))
                  }
                  required
                  className="w-full rounded-md border bg-background px-3 py-2"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Postal Code</label>
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
                  className="w-full rounded-md border bg-background px-3 py-2"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Coordinates</label>
                <div className="grid gap-2 sm:grid-cols-2">
                  <input
                    type="number"
                    step="any"
                    placeholder="Latitude"
                    value={form.latitude}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        latitude: parseFloat(e.target.value) || 0,
                      }))
                    }
                    required
                    className="w-full rounded-md border bg-background px-3 py-2"
                  />
                  <input
                    type="number"
                    step="any"
                    placeholder="Longitude"
                    value={form.longitude}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        longitude: parseFloat(e.target.value) || 0,
                      }))
                    }
                    required
                    className="w-full rounded-md border bg-background px-3 py-2"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Latitude: -90 to 90, Longitude: -180 to 180
                </p>
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setForm({
                    businessName: merchant?.businessName || '',
                    description: merchant?.description || '',
                    address: merchant?.address || '',
                    city: merchant?.city || '',
                    postalCode: merchant?.postalCode || '',
                    phone: merchant?.phone || '',
                    latitude: merchant?.latitude || 0,
                    longitude: merchant?.longitude || 0,
                  });
                }}
                className="rounded-md bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground hover:bg-secondary/90"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Business Name
              </h3>
              <p className="mt-1">{merchant?.businessName}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Phone</h3>
              <p className="mt-1">{merchant?.phone}</p>
            </div>
            {merchant?.description && (
              <div className="sm:col-span-2">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Description
                </h3>
                <p className="mt-1">{merchant.description}</p>
              </div>
            )}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Address
              </h3>
              <p className="mt-1">{merchant?.address}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">City</h3>
              <p className="mt-1">{merchant?.city}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Postal Code
              </h3>
              <p className="mt-1">{merchant?.postalCode}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Coordinates
              </h3>
              <p className="mt-1">
                {merchant?.latitude}, {merchant?.longitude}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;