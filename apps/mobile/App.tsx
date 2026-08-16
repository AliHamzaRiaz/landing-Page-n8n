import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { apiRequest, clearToken, getToken, setToken } from './src/lib/api'
import {
  AppHeader,
  Banner,
  Card,
  Empty,
  Field,
  GhostButton,
  Pill,
  PrimaryButton,
  Screen,
  StatCard,
  TabBar,
} from './src/components'
import { colors, radius, space } from './src/theme'

const PUBLIC = ['Splash', 'Onboarding', 'Login', 'Signup', 'Forgot', 'Verify'] as const
type ScreenName =
  | (typeof PUBLIC)[number]
  | 'Home'
  | 'Campaigns'
  | 'Create'
  | 'Details'
  | 'Social'
  | 'WhatsApp'
  | 'Inbox'
  | 'Profile'
  | 'Settings'

const TABS: { key: ScreenName; label: string; icon: string }[] = [
  { key: 'Home', label: 'Home', icon: '⌂' },
  { key: 'Campaigns', label: 'Campaigns', icon: '▣' },
  { key: 'WhatsApp', label: 'WhatsApp', icon: '◉' },
  { key: 'Social', label: 'Social', icon: '◎' },
  { key: 'Profile', label: 'More', icon: '☰' },
]

const PLATFORMS = ['INSTAGRAM', 'FACEBOOK', 'TIKTOK', 'YOUTUBE', 'LINKEDIN'] as const

const STAT_LABELS: Record<string, string> = {
  campaigns: 'Campaigns',
  activeCampaigns: 'Active',
  scheduledPosts: 'Scheduled',
  publishedPosts: 'Published',
  failedPosts: 'Failed',
  connectedAccounts: 'Accounts',
}

type CampaignRow = {
  id: string
  name: string
  status: string
  postingType?: string
  _count?: { posts?: number; media?: number }
}
type SocialRow = { id: string; platform: string; accountName: string; status: string }
type Totals = Record<string, number>
type Note = { id: string; title: string; message: string; isRead?: boolean }
type Me = { user?: { name?: string; phoneNumber?: string }; business?: { name?: string } }

export default function App() {
  const [screen, setScreen] = useState<ScreenName>('Splash')
  const [boot, setBoot] = useState(true)
  const [busy, setBusy] = useState(false)
  const [flash, setFlash] = useState('')
  const [error, setError] = useState('')
  const [phone, setPhone] = useState('+92')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [otp, setOtp] = useState('')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [platforms, setPlatforms] = useState<string[]>(['INSTAGRAM'])
  const [campaignId, setCampaignId] = useState<string | null>(null)
  const [stats, setStats] = useState<Totals | null>(null)
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([])
  const [accounts, setAccounts] = useState<SocialRow[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [me, setMe] = useState<Me | null>(null)

  const authed = useMemo(() => !PUBLIC.includes(screen as (typeof PUBLIC)[number]), [screen])

  useEffect(() => {
    void (async () => {
      const token = await getToken()
      if (token) {
        setScreen('Home')
        await loadWorkspace()
      } else {
        setScreen('Onboarding')
      }
      setBoot(false)
    })()
  }, [])

  async function loadWorkspace() {
    try {
      const [analytics, list, social, inbox, profile] = await Promise.all([
        apiRequest<{ totals?: Totals }>('/analytics').catch(() => ({ totals: {} })),
        apiRequest<CampaignRow[] | { data: CampaignRow[] }>('/campaigns').catch(() => []),
        apiRequest<SocialRow[] | { data: SocialRow[] }>('/social-accounts').catch(() => []),
        apiRequest<Note[] | { data: Note[] }>('/notifications').catch(() => []),
        apiRequest<Me>('/auth/me').catch(() => null),
      ])
      setStats(analytics?.totals || {})
      setCampaigns(Array.isArray(list) ? list : list.data ?? [])
      setAccounts(Array.isArray(social) ? social : social.data ?? [])
      setNotes(Array.isArray(inbox) ? inbox : inbox.data ?? [])
      setMe(profile)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load your workspace.')
    }
  }

  async function login() {
    setBusy(true)
    setError('')
    try {
      const data = await apiRequest<{ accessToken?: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ phoneNumber: phone, password }),
      })
      if (!data.accessToken) throw new Error('Login failed')
      await setToken(data.accessToken)
      setScreen('Home')
      await loadWorkspace()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setBusy(false)
    }
  }

  async function signup() {
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setBusy(true)
    setError('')
    try {
      await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ phoneNumber: phone, password, confirmPassword: confirm }),
      })
      setFlash('We sent a 6-digit code. In local dev it also prints in the API terminal.')
      setScreen('Verify')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create account')
    } finally {
      setBusy(false)
    }
  }

  async function verify() {
    setBusy(true)
    setError('')
    try {
      const data = await apiRequest<{ accessToken?: string }>('/auth/verify', {
        method: 'POST',
        body: JSON.stringify({ phoneNumber: phone, code: otp }),
      })
      if (data.accessToken) await setToken(data.accessToken)
      setScreen('Home')
      setFlash('')
      await loadWorkspace()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed')
    } finally {
      setBusy(false)
    }
  }

  async function forgot() {
    setBusy(true)
    setError('')
    try {
      await apiRequest('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      })
      setFlash('If that email is registered, reset instructions are on the way.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send reset email')
    } finally {
      setBusy(false)
    }
  }

  async function createCampaign() {
    setBusy(true)
    setError('')
    try {
      const campaign = await apiRequest<{ id: string }>('/campaigns', {
        method: 'POST',
        body: JSON.stringify({ name, platforms }),
      })
      setCampaignId(campaign.id)
      setName('')
      setScreen('Details')
      await loadWorkspace()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save campaign')
    } finally {
      setBusy(false)
    }
  }

  async function logout() {
    await clearToken()
    setStats(null)
    setCampaigns([])
    setAccounts([])
    setMe(null)
    setScreen('Login')
  }

  function goTab(key: string) {
    setError('')
    setScreen(key as ScreenName)
  }

  const title = pageTitle(screen)
  const showTabs = authed && !['Create', 'Details'].includes(screen)

  if (boot || screen === 'Splash') {
    return (
      <View style={styles.splash}>
        <StatusBar style="light" />
        <Text style={styles.splashMark}>Ennitant</Text>
        <Text style={styles.splashTag}>WhatsApp orders + campaigns</Text>
      </View>
    )
  }

  return (
    <View style={styles.root}>
      <StatusBar style={authed || screen === 'Onboarding' ? 'light' : 'light'} />
      {authed ? (
        <AppHeader
          title={title}
          subtitle={me?.business?.name || me?.user?.phoneNumber}
          onBack={screen === 'Create' || screen === 'Details' ? () => setScreen('Campaigns') : undefined}
          actionLabel={screen === 'Campaigns' ? 'New' : undefined}
          onAction={screen === 'Campaigns' ? () => setScreen('Create') : undefined}
        />
      ) : null}

      {screen === 'Onboarding' ? <Onboarding onSignup={() => setScreen('Signup')} onLogin={() => setScreen('Login')} /> : null}

      {screen === 'Login' ? (
        <AuthCard
          title="Welcome back"
          copy="Sign in with the same phone number you use on the web."
          error={error}
        >
          <Field label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+92 300 1234567" />
          <Field label="Password" value={password} onChangeText={setPassword} secure placeholder="Your password" />
          <PrimaryButton label="Sign in" onPress={() => void login()} loading={busy} />
          <GhostButton label="Forgot password" onPress={() => { setError(''); setScreen('Forgot') }} />
          <GhostButton label="Create an account" onPress={() => { setError(''); setScreen('Signup') }} />
        </AuthCard>
      ) : null}

      {screen === 'Signup' ? (
        <AuthCard
          title="Create your workspace"
          copy="One account for web and mobile. We will text a 6-digit code."
          error={error}
        >
          <Field label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+92 300 1234567" />
          <Field label="Password" value={password} onChangeText={setPassword} secure placeholder="At least 8 characters" />
          <Field label="Confirm password" value={confirm} onChangeText={setConfirm} secure placeholder="Repeat password" />
          <PrimaryButton label="Create account" onPress={() => void signup()} loading={busy} />
          <GhostButton label="I already have an account" onPress={() => setScreen('Login')} />
        </AuthCard>
      ) : null}

      {screen === 'Verify' ? (
        <AuthCard title="Verify your phone" copy="Enter the 6-digit code to finish signup." error={error} ok={flash}>
          <Field label="Verification code" value={otp} onChangeText={setOtp} keyboardType="number-pad" placeholder="000000" />
          <PrimaryButton label="Verify and continue" onPress={() => void verify()} loading={busy} disabled={otp.length !== 6} />
          <GhostButton label="Back to login" onPress={() => setScreen('Login')} />
        </AuthCard>
      ) : null}

      {screen === 'Forgot' ? (
        <AuthCard
          title="Reset password"
          copy="Enter the email on your account. We never confirm whether it exists."
          error={error}
          ok={flash}
        >
          <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" placeholder="you@business.com" />
          <PrimaryButton label="Send reset link" onPress={() => void forgot()} loading={busy} />
          <GhostButton label="Back to sign in" onPress={() => setScreen('Login')} />
        </AuthCard>
      ) : null}

      {screen === 'Home' ? (
        <Screen>
          <Banner text={error} tone="error" />
          <Text style={styles.hello}>Good to see you{me?.user?.name ? `, ${me.user.name}` : ''}</Text>
          <Text style={styles.lede}>Campaign and order health from the same workspace as the web app.</Text>
          <View style={styles.grid}>
            {Object.entries(STAT_LABELS).map(([key, label]) => (
              <StatCard key={key} label={label} value={stats?.[key] ?? 0} />
            ))}
          </View>
          <PrimaryButton
            label="Refresh"
            onPress={() => void loadWorkspace()}
          />
          <Card>
            <Text style={styles.section}>Recent campaigns</Text>
            {campaigns.slice(0, 3).map((c) => (
              <Pressable key={c.id} style={styles.row} onPress={() => { setCampaignId(c.id); setScreen('Details') }}>
                <Text style={styles.rowTitle}>{c.name}</Text>
                <Pill label={c.status} tone="brand" />
              </Pressable>
            ))}
            {campaigns.length === 0 ? <Empty title="No campaigns yet" body="Create one from the Campaigns tab." /> : null}
          </Card>
        </Screen>
      ) : null}

      {screen === 'Campaigns' ? (
        <Screen>
          {campaigns.length === 0 ? (
            <Empty title="Nothing live yet" body="Create a campaign, then upload media on the web wizard if you need video." />
          ) : (
            campaigns.map((c) => (
              <Pressable
                key={c.id}
                onPress={() => {
                  setCampaignId(c.id)
                  setScreen('Details')
                }}
              >
                <Card>
                  <View style={styles.row}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowTitle}>{c.name}</Text>
                      <Text style={styles.meta}>
                        {c._count?.media ?? 0} files · {c._count?.posts ?? 0} posts
                      </Text>
                    </View>
                    <Pill label={c.status} tone={c.status === 'FAILED' ? 'danger' : 'brand'} />
                  </View>
                </Card>
              </Pressable>
            ))
          )}
        </Screen>
      ) : null}

      {screen === 'Create' ? (
        <Screen>
          <Banner text={error} tone="error" />
          <Field label="Campaign name" value={name} onChangeText={setName} placeholder="Summer sale" autoCapitalize="sentences" />
          <Text style={styles.label}>Platforms</Text>
          <View style={styles.chips}>
            {PLATFORMS.map((p) => {
              const on = platforms.includes(p)
              return (
                <Pressable
                  key={p}
                  onPress={() =>
                    setPlatforms((cur) => (on ? cur.filter((x) => x !== p) : [...cur, p]))
                  }
                  style={[styles.chip, on && styles.chipOn]}
                >
                  <Text style={[styles.chipTxt, on && styles.chipTxtOn]}>{p}</Text>
                </Pressable>
              )
            })}
          </View>
          <PrimaryButton label="Save draft" onPress={() => void createCampaign()} loading={busy} disabled={!name.trim()} />
        </Screen>
      ) : null}

      {screen === 'Details' ? (
        <Screen>
          <Card>
            <Text style={styles.rowTitle}>Campaign</Text>
            <Text style={styles.meta}>{campaignId}</Text>
            <Text style={styles.lede}>
              Generate captions, schedule, and publish from this app’s web dashboard for the full media upload flow.
              Status here updates from the same API.
            </Text>
          </Card>
        </Screen>
      ) : null}

      {screen === 'Social' ? (
        <Screen>
          <Text style={styles.lede}>Official OAuth only. Tokens stay on the server. Connect from web if a platform asks to log in.</Text>
          {['facebook', 'instagram', 'tiktok', 'youtube', 'linkedin'].map((platform) => {
            const account = accounts.find((row) => row.platform.toLowerCase() === platform)
            return (
              <Card key={platform}>
                <View style={styles.row}>
                  <View>
                    <Text style={styles.rowTitle}>{platform}</Text>
                    <Text style={styles.meta}>{account ? account.accountName : 'Not connected'}</Text>
                  </View>
                  <Pill
                    label={account?.status || 'Off'}
                    tone={account?.status === 'CONNECTED' ? 'success' : 'neutral'}
                  />
                </View>
              </Card>
            )
          })}
        </Screen>
      ) : null}

      {screen === 'WhatsApp' ? (
        <Screen>
          <Card>
            <Text style={styles.rowTitle}>WhatsApp Business</Text>
            <Text style={styles.lede}>
              Connection, phone number, and webhooks stay on the official Meta Cloud API. Open WhatsApp setup on the
              web app to run Embedded Signup. This app uses the same account.
            </Text>
            <Pill label="Official Meta APIs" tone="success" />
          </Card>
        </Screen>
      ) : null}

      {screen === 'Inbox' ? (
        <Screen>
          {notes.length === 0 ? (
            <Empty title="You’re all caught up" body="Order and publishing alerts appear here." />
          ) : (
            notes.map((n) => (
              <Card key={n.id}>
                <Text style={styles.rowTitle}>{n.title}</Text>
                <Text style={styles.meta}>{n.message}</Text>
              </Card>
            ))
          )}
        </Screen>
      ) : null}

      {screen === 'Profile' ? (
        <Screen>
          <Card>
            <Text style={styles.kicker}>Workspace</Text>
            <Text style={styles.rowTitle}>{me?.business?.name || 'Your business'}</Text>
            <Text style={styles.meta}>{me?.user?.phoneNumber}</Text>
          </Card>
          <PrimaryButton label="Notifications" onPress={() => setScreen('Inbox')} />
          <PrimaryButton label="Settings" onPress={() => setScreen('Settings')} />
          <GhostButton label="Sign out" onPress={() => void logout()} />
        </Screen>
      ) : null}

      {screen === 'Settings' ? (
        <Screen>
          <Card>
            <Text style={styles.rowTitle}>App</Text>
            <Text style={styles.meta}>Same API as the website. No platform secrets are stored on the device.</Text>
          </Card>
          <GhostButton label="Back" onPress={() => setScreen('Profile')} />
          <GhostButton label="Sign out" onPress={() => void logout()} />
        </Screen>
      ) : null}

      {showTabs ? (
        <TabBar
          items={TABS}
          active={TABS.some((t) => t.key === screen) ? screen : 'Profile'}
          onChange={goTab}
        />
      ) : null}
    </View>
  )
}

function pageTitle(screen: ScreenName) {
  const map: Record<string, string> = {
    Home: 'Dashboard',
    Campaigns: 'Campaigns',
    Create: 'New campaign',
    Details: 'Campaign',
    Social: 'Social accounts',
    WhatsApp: 'WhatsApp',
    Inbox: 'Notifications',
    Profile: 'Account',
    Settings: 'Settings',
  }
  return map[screen] || 'Ennitant'
}

function Onboarding({ onSignup, onLogin }: { onSignup: () => void; onLogin: () => void }) {
  return (
    <View style={styles.onboard}>
      <Text style={styles.splashMark}>Ennitant</Text>
      <Text style={styles.hero}>Run WhatsApp orders and campaigns from one workspace.</Text>
      {[
        ['Orders', 'Customers message WhatsApp. You manage them in one inbox.'],
        ['Campaigns', 'Draft, schedule, and track social posts against the same account.'],
        ['One login', 'Web and mobile share your business, not a second password silo.'],
      ].map(([t, b]) => (
        <View key={t} style={styles.bullet}>
          <Text style={styles.bulletT}>{t}</Text>
          <Text style={styles.bulletB}>{b}</Text>
        </View>
      ))}
      <PrimaryButton label="Create account" onPress={onSignup} />
      <GhostButton label="I already have an account" onPress={onLogin} />
    </View>
  )
}

function AuthCard({
  title,
  copy,
  children,
  error,
  ok,
}: {
  title: string
  copy: string
  children: ReactNode
  error?: string
  ok?: string
}) {
  return (
    <View style={styles.authWrap}>
      <Text style={styles.authBrand}>Ennitant</Text>
      <View style={styles.authCard}>
        <View style={styles.authBar} />
        <View style={styles.authBody}>
          <Text style={styles.authTitle}>{title}</Text>
          <Text style={styles.authCopy}>{copy}</Text>
          <Banner text={error || ''} tone="error" />
          <Banner text={!error && ok ? ok : ''} tone="ok" />
          <View style={{ gap: 12, marginTop: 8 }}>{children}</View>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  splash: {
    flex: 1,
    backgroundColor: colors.ocean,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  splashMark: { color: colors.brand, fontSize: 36, fontWeight: '800' },
  splashTag: { color: '#99f6e4', fontSize: 15 },
  onboard: {
    flex: 1,
    backgroundColor: colors.ocean,
    padding: space.lg,
    paddingTop: 72,
    gap: 12,
  },
  hero: { color: '#fff', fontSize: 26, fontWeight: '800', lineHeight: 32, marginBottom: 8 },
  bullet: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: radius.md, padding: 14 },
  bulletT: { color: colors.brand, fontWeight: '800' },
  bulletB: { color: '#e2e8f0', marginTop: 4, lineHeight: 20 },
  authWrap: { flex: 1, backgroundColor: colors.ocean, padding: space.md, justifyContent: 'center' },
  authBrand: { textAlign: 'center', color: colors.brand, fontSize: 28, fontWeight: '800', marginBottom: 18 },
  authCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  authBar: { height: 4, backgroundColor: colors.brand },
  authBody: { padding: space.lg, gap: 8 },
  authTitle: { fontSize: 22, fontWeight: '800', color: colors.ocean },
  authCopy: { color: colors.muted, lineHeight: 20 },
  hello: { fontSize: 22, fontWeight: '800', color: colors.ink },
  lede: { color: colors.muted, lineHeight: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  section: { fontWeight: '800', color: colors.ocean, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingVertical: 8 },
  rowTitle: { fontSize: 16, fontWeight: '800', color: colors.ink, textTransform: 'capitalize' },
  meta: { color: colors.muted, marginTop: 4, lineHeight: 18 },
  kicker: { color: colors.brand, fontSize: 12, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  label: { fontWeight: '700', color: colors.ink },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#fff' },
  chipOn: { backgroundColor: colors.ocean, borderColor: colors.ocean },
  chipTxt: { fontSize: 12, fontWeight: '700', color: colors.ink },
  chipTxtOn: { color: '#fff' },
})
