import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { logout } from '@/features/auth/api';
import { ROUTES } from '@/constants/routes';
import { getProfile, updateDisplayName, deleteAccount, type ProfileData } from './api';

function formatDateLong(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export function ProfilePage(): JSX.Element {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const profileQuery = useQuery<ProfileData>({ queryKey: ['profile'], queryFn: getProfile });

  const [name, setName] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  useEffect(() => {
    if (profileQuery.data) setName(profileQuery.data.displayName);
  }, [profileQuery.data]);

  const saveMutation = useMutation({
    mutationFn: (n: string) => updateDisplayName(n),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      toast.success('Profile updated');
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not save'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAccount,
    onSuccess: async () => {
      await logout();
      toast.success('Account deleted');
      navigate(ROUTES.HOME, { replace: true });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not delete account'),
  });

  if (profileQuery.isLoading || !profileQuery.data) {
    return (
      <div className="container" style={{ maxWidth: 760 }}>
        <div className="page-head">
          <h1 className="page-h">Profile</h1>
        </div>
        <div className="profile-section">
          <div className="skeleton" style={{ width: '40%', height: 16, marginBottom: 16 }} />
          <div className="skeleton" style={{ width: '80%', height: 40 }} />
        </div>
      </div>
    );
  }

  const profile = profileQuery.data;
  const nameDirty = name.trim() !== profile.displayName && name.trim().length > 0;

  return (
    <div className="container" style={{ maxWidth: 760 }}>
      <div className="page-head">
        <div>
          <h1 className="page-h">Profile</h1>
          <p className="page-sub">Manage your account and Studio preferences.</p>
        </div>
      </div>

      <div className="profile-section">
        <h3>User information</h3>
        <p className="desc">This is how you'll appear in Studio.</p>
        <div className="profile-row">
          <div className="profile-label">Display name</div>
          <div>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
            <div className="help" style={{ marginTop: 6 }}>
              Shown on shared media.
            </div>
          </div>
        </div>
        <div className="profile-row">
          <div className="profile-label">Email</div>
          <div className="profile-value">{profile.email}</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
          <Button
            variant="primary"
            loading={saveMutation.isPending}
            disabled={!nameDirty}
            onClick={() => saveMutation.mutate(name.trim())}
          >
            Save changes
          </Button>
        </div>
      </div>

      <div className="profile-section">
        <h3>Account information</h3>
        <p className="desc">Read-only details about your plan and usage.</p>
        <div className="profile-row">
          <div className="profile-label">Plan</div>
          <div className="profile-value">
            <Badge variant="plan">{profile.plan === 'pro' ? 'Pro' : 'Free'}</Badge>
          </div>
        </div>
        <div className="profile-row">
          <div className="profile-label">Member since</div>
          <div className="profile-value">{formatDateLong(profile.memberSince)}</div>
        </div>
        <div className="profile-row">
          <div className="profile-label">Total media created</div>
          <div className="profile-value">
            {profile.totalPhotos + profile.totalVideos} ({profile.totalPhotos} photos, {profile.totalVideos} videos)
          </div>
        </div>
      </div>

      <div className="profile-section danger-zone">
        <h3 className="danger-title">Danger zone</h3>
        <p className="desc">Deleting your account is permanent. All your media and prompts will be erased.</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
          <div>
            <div style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 500 }}>Delete account</div>
            <div className="help" style={{ marginTop: 4 }}>
              This action cannot be undone (GDPR-compliant erasure).
            </div>
          </div>
          <Button
            variant="destructive"
            leftIcon={<Trash2 size={14} />}
            onClick={() => {
              setDeleteOpen(true);
              setConfirmText('');
            }}
          >
            Delete account
          </Button>
        </div>
      </div>

      <Modal
        open={deleteOpen}
        onOpenChange={(open) => !open && setDeleteOpen(false)}
        title="Permanently delete your account?"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={confirmText !== 'DELETE'}
              loading={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate()}
            >
              I understand — delete my account
            </Button>
          </>
        }
      >
        <div style={{ marginBottom: 16 }}>
          All your media, prompts, and account data will be permanently removed. This cannot be reversed.
        </div>
        <div className="field">
          <label className="label">
            Type <span className="mono" style={{ color: 'var(--error)' }}>DELETE</span> to confirm
          </label>
          <Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="DELETE" />
        </div>
      </Modal>
    </div>
  );
}
