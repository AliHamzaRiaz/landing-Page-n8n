import type { ReactNode } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { colors, radius, shadow, space } from './theme'

export function Screen({
  children,
  scroll = true,
  padded = true,
}: {
  children: ReactNode
  scroll?: boolean
  padded?: boolean
}) {
  const body = padded ? <View style={ui.pad}>{children}</View> : children
  if (!scroll) return <View style={ui.flex}>{body}</View>
  return (
    <KeyboardAvoidingView style={ui.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={ui.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {body}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

export function AppHeader({
  title,
  subtitle,
  onBack,
  actionLabel,
  onAction,
}: {
  title: string
  subtitle?: string
  onBack?: () => void
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <View style={ui.header}>
      <View style={ui.headerRow}>
        {onBack ? (
          <Pressable onPress={onBack} style={ui.backBtn} accessibilityRole="button">
            <Text style={ui.backTxt}>‹</Text>
          </Pressable>
        ) : (
          <View style={ui.mark}>
            <Text style={ui.markTxt}>E</Text>
          </View>
        )}
        <View style={ui.headerCopy}>
          <Text style={ui.kicker}>Ennitant</Text>
          <Text style={ui.headerTitle}>{title}</Text>
          {subtitle ? <Text style={ui.headerSub}>{subtitle}</Text> : null}
        </View>
        {actionLabel && onAction ? (
          <Pressable onPress={onAction} style={ui.headerCta}>
            <Text style={ui.headerCtaTxt}>{actionLabel}</Text>
          </Pressable>
        ) : (
          <View style={{ width: 44 }} />
        )}
      </View>
    </View>
  )
}

export function TabBar({
  items,
  active,
  onChange,
}: {
  items: { key: string; label: string; icon: string }[]
  active: string
  onChange: (key: string) => void
}) {
  return (
    <View style={ui.tabBar} accessibilityRole="tablist">
      {items.map((item) => {
        const on = active === item.key
        return (
          <Pressable
            key={item.key}
            onPress={() => onChange(item.key)}
            style={ui.tabItem}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={item.label}
          >
            <Text style={[ui.tabIcon, on && ui.tabIconOn]}>{item.icon}</Text>
            <Text style={[ui.tabLabel, on && ui.tabLabelOn]}>{item.label}</Text>
          </Pressable>
        )
      })}
    </View>
  )
}

export function PrimaryButton({
  label,
  onPress,
  loading,
  disabled,
}: {
  label: string
  onPress: () => void
  loading?: boolean
  disabled?: boolean
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={[ui.primary, (disabled || loading) && ui.disabled]}
    >
      {loading ? <ActivityIndicator color="#fff" /> : <Text style={ui.primaryTxt}>{label}</Text>}
    </Pressable>
  )
}

export function GhostButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={ui.ghost}>
      <Text style={ui.ghostTxt}>{label}</Text>
    </Pressable>
  )
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  secure,
  keyboardType,
  autoCapitalize = 'none',
}: {
  label: string
  value: string
  onChangeText: (v: string) => void
  placeholder?: string
  secure?: boolean
  keyboardType?: 'default' | 'phone-pad' | 'email-address' | 'number-pad'
  autoCapitalize?: 'none' | 'sentences'
}) {
  return (
    <View style={ui.field}>
      <Text style={ui.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        secureTextEntry={secure}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        style={ui.input}
      />
    </View>
  )
}

export function Card({ children }: { children: ReactNode }) {
  return <View style={ui.card}>{children}</View>
}

export function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={ui.stat}>
      <Text style={ui.statLabel}>{label}</Text>
      <Text style={ui.statValue}>{value}</Text>
    </View>
  )
}

export function Pill({
  label,
  tone = 'neutral',
}: {
  label: string
  tone?: 'neutral' | 'success' | 'warn' | 'danger' | 'brand'
}) {
  const map = {
    neutral: ui.pillNeutral,
    success: ui.pillSuccess,
    warn: ui.pillWarn,
    danger: ui.pillDanger,
    brand: ui.pillBrand,
  }
  return (
    <View style={[ui.pill, map[tone]]}>
      <Text style={ui.pillTxt}>{label}</Text>
    </View>
  )
}

export function Banner({ text, tone = 'info' }: { text?: string; tone?: 'info' | 'error' | 'ok' }) {
  if (!text) return null
  return (
    <View
      style={[
        ui.banner,
        tone === 'error' && ui.bannerError,
        tone === 'ok' && ui.bannerOk,
      ]}
    >
      <Text style={[ui.bannerTxt, tone === 'error' && { color: colors.danger }]}>{text}</Text>
    </View>
  )
}

export function Empty({ title, body }: { title: string; body: string }) {
  return (
    <View style={ui.empty}>
      <Text style={ui.emptyTitle}>{title}</Text>
      <Text style={ui.emptyBody}>{body}</Text>
    </View>
  )
}

const ui = StyleSheet.create({
  flex: { flex: 1 },
  pad: { padding: space.md, gap: space.md },
  scroll: { paddingBottom: 28 },
  header: {
    backgroundColor: colors.ocean,
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingHorizontal: space.md,
    paddingBottom: 16,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  mark: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markTxt: { color: '#fff', fontWeight: '800', fontSize: 18 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backTxt: { color: '#fff', fontSize: 28, marginTop: -4 },
  headerCopy: { flex: 1 },
  kicker: {
    color: '#99f6e4',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '800', marginTop: 2 },
  headerSub: { color: '#cbd5e1', fontSize: 13, marginTop: 2 },
  headerCta: {
    backgroundColor: colors.brand,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  headerCtaTxt: { color: '#fff', fontWeight: '700', fontSize: 13 },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    paddingBottom: Platform.OS === 'ios' ? 18 : 10,
    paddingTop: 8,
  },
  tabItem: { flex: 1, alignItems: 'center', gap: 2 },
  tabIcon: { fontSize: 18, color: colors.muted },
  tabIconOn: { color: colors.brand },
  tabLabel: { fontSize: 11, color: colors.muted, fontWeight: '600' },
  tabLabelOn: { color: colors.ocean },
  primary: {
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryTxt: { color: '#fff', fontWeight: '800', fontSize: 16 },
  disabled: { opacity: 0.55 },
  ghost: { paddingVertical: 12, alignItems: 'center' },
  ghostTxt: { color: colors.brand, fontWeight: '700' },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '700', color: colors.ink },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    fontSize: 16,
    color: colors.ink,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  stat: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statLabel: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  statValue: { color: colors.ink, fontSize: 24, fontWeight: '800', marginTop: 4 },
  pill: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  pillNeutral: { backgroundColor: '#e2e8f0' },
  pillSuccess: { backgroundColor: '#d1fae5' },
  pillWarn: { backgroundColor: '#fef3c7' },
  pillDanger: { backgroundColor: '#fee2e2' },
  pillBrand: { backgroundColor: colors.track },
  pillTxt: { fontSize: 11, fontWeight: '800', color: colors.ocean, textTransform: 'uppercase' },
  banner: {
    backgroundColor: '#ecfeff',
    borderRadius: radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: '#a5f3fc',
  },
  bannerError: { backgroundColor: '#fef2f2', borderColor: '#fecaca' },
  bannerOk: { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' },
  bannerTxt: { color: colors.ink, fontSize: 13, lineHeight: 18 },
  empty: { paddingVertical: 28, alignItems: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: colors.ink },
  emptyBody: { color: colors.muted, textAlign: 'center', marginTop: 6, lineHeight: 20 },
})
