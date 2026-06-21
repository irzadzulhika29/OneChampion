import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { profileSchema } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { subscribeToPush, unsubscribeFromPush, isPushSubscribed } from '@/lib/pushNotifications'
import { useAuthStore } from '@/store/auth'
import { useUpdateOwnProfile } from '@/hooks/useProfiles'
import { supabase } from '@/lib/supabase'
import { Bell, BellOff, Loader2, Mail, Smartphone, Save, UserCircle2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default function Settings() {
  const { user, signOut } = useAuthStore()
  const { toast } = useToast()
  const updateProfile = useUpdateOwnProfile()
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [profileLoading, setProfileLoading] = useState(true)
  const [profileId, setProfileId] = useState(null)

  const form = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: '',
      nim: '',
      prodi: '',
      angkatan: '',
      no_hp: '',
    },
  })

  // Load own profile
  useEffect(() => {
    isPushSubscribed().then((v) => {
      setSubscribed(v)
      setLoading(false)
    })
    if (!user) return
    setProfileLoading(true)
    supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
      .then(({ data, error }) => {
        if (!error && data) {
          setProfileId(data.id)
          form.reset({
            full_name: data.full_name || user.user_metadata?.full_name || '',
            nim: data.nim || '',
            prodi: data.prodi || '',
            angkatan: data.angkatan || '',
            no_hp: data.no_hp || '',
          })
        }
        setProfileLoading(false)
      })
  }, [user])

  const handleTogglePush = async () => {
    setBusy(true)
    try {
      if (subscribed) {
        await unsubscribeFromPush()
        setSubscribed(false)
        toast({ title: 'Notifikasi dimatikan' })
      } else {
        await subscribeToPush()
        setSubscribed(true)
        toast({ title: 'Notifikasi diaktifkan', description: 'Anda akan menerima push untuk reminder.' })
      }
    } catch (err) {
      toast({ variant: 'destructive', title: 'Gagal', description: err.message })
    } finally {
      setBusy(false)
    }
  }

  const onSaveProfile = form.handleSubmit(async (values) => {
    if (!profileId) {
      toast({ variant: 'destructive', title: 'Profile belum termuat' })
      return
    }
    try {
      await updateProfile.mutateAsync({ id: profileId, ...values })
      toast({ title: 'Profile disimpan' })
    } catch (err) {
      toast({ variant: 'destructive', title: 'Gagal', description: err.message })
    }
  })

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Pengaturan</h1>
        <p className="text-muted-foreground text-sm mt-1">Kelola akun dan notifikasi Anda.</p>
      </div>

      {/* Profile Editor */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCircle2 className="h-4 w-4" /> Data Diri
          </CardTitle>
          <CardDescription>
            Data ini tampil saat Anda ditambahkan ke tim. Lengkapi sekarang supaya anggota tim lain mudah mengenali Anda.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {profileLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <form onSubmit={onSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="full_name">Nama Lengkap</Label>
                  <Input id="full_name" placeholder="Nama Anda" {...form.register('full_name')} />
                  {form.formState.errors.full_name && (
                    <p className="text-xs text-destructive">{form.formState.errors.full_name.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nim">NIM / NIP</Label>
                  <Input id="nim" placeholder="123456789" {...form.register('nim')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prodi">Program Studi</Label>
                  <Input id="prodi" placeholder="Teknik Informatika" {...form.register('prodi')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="angkatan">Angkatan</Label>
                  <Input id="angkatan" placeholder="2022" {...form.register('angkatan')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="no_hp">No HP / WhatsApp</Label>
                  <Input id="no_hp" placeholder="08xxxxxxxxxx" {...form.register('no_hp')} />
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="submit" size="sm" disabled={updateProfile.isPending}>
                  {updateProfile.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Simpan Profile
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Akun (read-only) */}
      <Card>
        <CardHeader>
          <CardTitle>Akun</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Email</span>
            <span className="font-medium">{user?.email}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">User ID</span>
            <span className="font-mono text-xs">{user?.id?.slice(0, 8)}...</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Terdaftar sejak</span>
            <span className="font-medium">{formatDate(user?.created_at, { day: '2-digit', month: 'long', year: 'numeric' })}</span>
          </div>
          <div className="pt-4 border-t">
            <Button variant="destructive" size="sm" onClick={signOut}>
              Keluar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifikasi</CardTitle>
          <CardDescription>Reminder lomba dikirim via email & push notification.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-md border bg-muted/30">
            <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-sm">Email Reminder</p>
              <p className="text-xs text-muted-foreground">
                Otomatis dikirim ke {user?.email} 7 hari & 1 hari sebelum deadline dan tanggal mulai lomba.
              </p>
            </div>
            <span className="text-xs text-emerald-600 font-medium">Aktif</span>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-md border bg-muted/30">
            <Smartphone className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-sm">Push Notification</p>
              <p className="text-xs text-muted-foreground">
                Notifikasi langsung ke perangkat ini. Aktifkan untuk menerima reminder.
              </p>
            </div>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <Button
                size="sm"
                variant={subscribed ? 'outline' : 'default'}
                onClick={handleTogglePush}
                disabled={busy}
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : subscribed ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                {subscribed ? 'Matikan' : 'Aktifkan'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
