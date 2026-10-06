import React, { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { COLORS } from '../constants/theme';
import { apiClient } from '../services/api';

const messageFrom = (error) => error?.response?.data?.message || error?.response?.data?.error || 'Không thể kết nối máy chủ. Vui lòng thử lại.';

export default function AuthModal({ visible, onClose, onAuthenticated }) {
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (quickUsername) => {
    const loginName = quickUsername || username.trim();
    const loginPassword = quickUsername ? '123456' : password;
    setError('');
    if (!loginName || !loginPassword || (mode === 'register' && !email.trim())) {
      setError('Vui lòng điền đủ các trường bắt buộc.');
      return;
    }
    setLoading(true);
    try {
      const response = mode === 'register'
        ? await apiClient.register(username.trim(), email.trim(), password)
        : await apiClient.login(loginName, loginPassword);
      const body = response.data?.data || response.data;
      if (!body?.token) throw new Error('Máy chủ không trả về phiên đăng nhập.');
      await onAuthenticated(body.token, body.user);
      setPassword('');
      onClose();
    } catch (requestError) {
      setError(requestError.message === 'Máy chủ không trả về phiên đăng nhập.' ? requestError.message : messageFrom(requestError));
    } finally { setLoading(false); }
  };

  const switchMode = () => { setError(''); setMode((current) => current === 'login' ? 'register' : 'login'); };
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <View style={styles.overlay}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <View style={styles.card}>
        <Text style={styles.title}>{mode === 'login' ? 'Chào mừng trở lại' : 'Tạo tài khoản mới'}</Text>
        <Text style={styles.sub}>{mode === 'login' ? 'Đăng nhập để đồng bộ Tủ truyện của bạn.' : 'Lưu tiến độ đọc và tương tác với cộng đồng.'}</Text>
        <TextInput value={username} onChangeText={setUsername} autoCapitalize="none" placeholder={mode === 'login' ? 'Tên đăng nhập hoặc email' : 'Tên đăng nhập'} placeholderTextColor={COLORS.textMuted} style={styles.input} />
        {mode === 'register' && <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="Email" placeholderTextColor={COLORS.textMuted} style={styles.input} />}
        <TextInput value={password} onChangeText={setPassword} secureTextEntry placeholder="Mật khẩu" placeholderTextColor={COLORS.textMuted} style={styles.input} />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable disabled={loading} style={[styles.submit, loading && styles.disabled]} onPress={() => submit()}>
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitText}>{mode === 'login' ? 'Đăng nhập' : 'Đăng ký và đăng nhập'}</Text>}
        </Pressable>
        {mode === 'login' && <>
          <Text style={styles.quickLabel}>TÀI KHOẢN DEMO</Text>
          <View style={styles.quickRow}>{['admin', 'dichgia_vip', 'docgia_01'].map((account) => <Pressable key={account} disabled={loading} onPress={() => submit(account)} style={styles.quick}><Text style={styles.quickText}>{account}</Text></Pressable>)}</View>
        </>}
        <Pressable onPress={switchMode} style={styles.switch}><Text style={styles.switchText}>{mode === 'login' ? 'Chưa có tài khoản? Đăng ký' : 'Đã có tài khoản? Đăng nhập'}</Text></Pressable>
      </View>
    </View>
  </Modal>;
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: 'rgba(0,0,0,.67)' },
  card: { backgroundColor: COLORS.surface, borderRadius: 24, padding: 21, borderWidth: 1, borderColor: COLORS.border },
  title: { color: COLORS.textPrimary, fontSize: 22, fontWeight: '900' }, sub: { color: COLORS.textSecondary, fontSize: 12, lineHeight: 18, marginTop: 7, marginBottom: 16 },
  input: { height: 48, marginTop: 9, paddingHorizontal: 13, color: COLORS.textPrimary, backgroundColor: COLORS.surfaceLight, borderRadius: 11, borderWidth: 1, borderColor: COLORS.border },
  error: { color: '#FF9A80', fontSize: 12, marginTop: 10 }, submit: { height: 49, marginTop: 15, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary }, disabled: { opacity: .55 }, submitText: { color: '#FFF', fontWeight: '900' },
  quickLabel: { color: COLORS.textMuted, fontSize: 10, fontWeight: '800', letterSpacing: .7, marginTop: 18, marginBottom: 9 }, quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, quick: { paddingHorizontal: 9, paddingVertical: 7, backgroundColor: COLORS.primarySoft, borderRadius: 8 }, quickText: { color: COLORS.tagText, fontSize: 11, fontWeight: '700' },
  switch: { alignSelf: 'center', marginTop: 19, padding: 5 }, switchText: { color: COLORS.primary, fontSize: 12, fontWeight: '700' },
});
