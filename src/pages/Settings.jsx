import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { subscribeToPush, unsubscribeFromPush, isPushSubscribed } from '@/lib/pushNotifications'
import { useAuthStore } from '@/store/auth'
import { Bell, BellOff, Loader2, Mail, Smartphone } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default function Settings() {
  const { user, signOut } = useAuthStore()
  const { toast } = useToast()
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    isPushSubscribed().then((v) => {
      setSubscribed(v)
      setLoading(false)
    })
  }, [])

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

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Pengaturan</h1>
        <p className="text-muted-foreground text-sm mt-1">Kelola akun dan notifikasi Anda.</p>
      </div>

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
