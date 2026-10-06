import React from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../constants/theme';
import { toAbsoluteUrl } from '../services/api';

const actions = [
  ['🔔', 'Thông báo', 'Cập nhật mới nhất'],
  ['⚙️', 'Cài đặt đọc', 'Cỡ chữ & cuộn trang'],
  ['🛡️', 'Bảo mật', 'Đổi mật khẩu'],
  ['👤', 'Chỉnh sửa hồ sơ', 'Tên, giới tính & ảnh'],
  ['📖', 'Hướng dẫn', 'Cách sử dụng ứng dụng'],
];

export default function AccountBottomSheet({ visible, user, onClose, onAction, onAuth }) {
  const displayName = user?.full_name || user?.username || 'Khách';
  const initials = displayName.trim().slice(0, 2).toUpperCase();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.profileRow}>
            <View style={styles.avatar}>{user?.avatar_url ? <Image source={{ uri: toAbsoluteUrl(user.avatar_url) }} style={styles.avatarImage} /> : <Text style={styles.avatarText}>{initials}</Text>}</View>
            <View style={styles.profileText}>
              <Text style={styles.name}>{displayName}</Text>
              <View style={styles.badge}><Text style={styles.badgeText}>{user?.role_name || 'GUEST'}</Text></View>
            </View>
            <Pressable style={styles.logout} onPress={() => user ? onAction('logout') : onAuth()}><Text style={styles.logoutText}>{user ? 'Đăng xuất' : 'Đăng nhập'}</Text></Pressable>
          </View>
          <View style={styles.divider} />
          <Text style={styles.sectionTitle}>Tài khoản & thiết lập</Text>
          <View style={styles.actionGrid}>
            {actions.map(([icon, title, subtitle]) => (
              <Pressable key={title} style={styles.action} onPress={() => onAction(title)}>
                <Text style={styles.actionIcon}>{icon}</Text>
                <View><Text style={styles.actionTitle}>{title}</Text><Text style={styles.actionSub}>{subtitle}</Text></View>
              </Pressable>
            ))}
          </View>
          <Text style={styles.version}>MangaDex Mobile · v1.0.0</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.62)' },
  sheet: { backgroundColor: COLORS.surface, paddingHorizontal: 20, paddingTop: 11, paddingBottom: 30, borderTopLeftRadius: 30, borderTopRightRadius: 30 },
  handle: { height: 5, width: 42, borderRadius: 99, alignSelf: 'center', backgroundColor: '#5A5A63', marginBottom: 22 },
  profileRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { height: 62, width: 62, borderRadius: 31, overflow: 'hidden', borderWidth: 2, borderColor: COLORS.primary, backgroundColor: '#3D2520', alignItems: 'center', justifyContent: 'center' }, avatarImage: { width: '100%', height: '100%' },
  avatarText: { color: COLORS.primary, fontSize: 18, fontWeight: '800' },
  profileText: { flex: 1, marginLeft: 13 }, name: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '800' },
  badge: { alignSelf: 'flex-start', backgroundColor: COLORS.primarySoft, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5, marginTop: 5 }, badgeText: { color: COLORS.tagText, fontWeight: '800', fontSize: 10 },
  logout: { borderWidth: 1, borderColor: '#57352E', backgroundColor: '#2B2020', paddingHorizontal: 11, paddingVertical: 9, borderRadius: 10 }, logoutText: { color: '#FF9A80', fontWeight: '700', fontSize: 12 },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 21 }, sectionTitle: { color: COLORS.textSecondary, fontSize: 12, textTransform: 'uppercase', fontWeight: '700', letterSpacing: .7, marginBottom: 12 },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 11 },
  action: { width: '48.5%', minHeight: 83, padding: 12, backgroundColor: COLORS.surfaceLight, borderRadius: 15, borderWidth: 1, borderColor: COLORS.border }, actionIcon: { fontSize: 19, marginBottom: 6 }, actionTitle: { color: COLORS.textPrimary, fontSize: 13, fontWeight: '700' }, actionSub: { color: COLORS.textMuted, fontSize: 10, marginTop: 2 },
  version: { color: COLORS.textMuted, textAlign: 'center', fontSize: 11, marginTop: 23 },
});
