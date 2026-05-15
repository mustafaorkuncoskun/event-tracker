import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, StatusBar,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../App';

const API_BASE = __DEV__ ? 'http://192.168.1.103:3001/api' : 'https://api.sirketiniz.com/api';
const DIGITS = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

  async function press(val: string) {
    if (loading) return;
    if (val === '⌫') { setPin(p => p.slice(0, -1)); return; }
    if (val === '') return;

    const next = pin + val;
    setPin(next);

    if (next.length === 4) {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/staff/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pinCode: next }),
        });
        if (!res.ok) throw new Error();
        const staff = await res.json();
        setPin('');
        navigation.replace('Scanner', { staffId: staff.id, staffName: staff.name });
      } catch {
        Alert.alert('Hata', 'Hatalı PIN kodu');
        setTimeout(() => setPin(''), 300);
      } finally {
        setLoading(false);
      }
    }
  }

  return (
    <View style={s.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      <Text style={s.emoji}>🎫</Text>
      <Text style={s.title}>Görevli Girişi</Text>
      <Text style={s.subtitle}>4 haneli PIN kodunuzu girin</Text>

      <View style={s.pinRow}>
        {[0,1,2,3].map(i => (
          <View key={i} style={[s.dot, i < pin.length && s.dotFilled]} />
        ))}
      </View>

      {loading && <ActivityIndicator color="#2563eb" style={{ marginBottom: 16 }} />}

      <View style={s.grid}>
        {DIGITS.map((d, i) => (
          <TouchableOpacity
            key={i}
            style={[s.key, d === '' && s.keyHidden]}
            onPress={() => press(d)}
            disabled={d === ''}
            activeOpacity={0.6}
          >
            <Text style={[s.keyText, d === '⌫' && s.keyDel]}>{d}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a', padding: 24 },
  emoji: { fontSize: 48, marginBottom: 8 },
  title: { fontSize: 24, fontWeight: '700', color: '#f1f5f9', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#94a3b8', marginBottom: 36 },
  pinRow: { flexDirection: 'row', gap: 12, marginBottom: 32 },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: '#475569' },
  dotFilled: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', width: 280, gap: 12 },
  key: { width: 80, height: 64, backgroundColor: '#1e293b', borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#334155' },
  keyHidden: { opacity: 0 },
  keyText: { fontSize: 22, fontWeight: '500', color: '#f1f5f9' },
  keyDel: { fontSize: 18, color: '#94a3b8' },
});
