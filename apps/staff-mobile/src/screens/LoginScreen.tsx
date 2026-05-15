import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, StatusBar,
} from 'react-native';
import { Delete } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../App';

const API_BASE = __DEV__ ? 'http://192.168.1.103:3001/api' : 'https://api.sirketiniz.com/api';
const DIGITS = ['1','2','3','4','5','6','7','8','9','','0','del'];

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

  async function press(val: string) {
    if (loading) return;
    if (val === 'del') { setPin(p => p.slice(0, -1)); return; }
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
        navigation.replace('EventSelect', { staffId: staff.id, staffName: staff.name });
      } catch {
        Alert.alert('Hatalı PIN', 'PIN kodunu kontrol edip tekrar deneyin.');
        setTimeout(() => setPin(''), 300);
      } finally {
        setLoading(false);
      }
    }
  }

  return (
    <View style={s.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

      <View style={s.brandRow}>
        <View style={s.brandIcon}>
          <Text style={s.brandIconText}>ET</Text>
        </View>
        <Text style={s.brandName}>Etkinlik Takip</Text>
      </View>

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
            disabled={d === '' || loading}
            activeOpacity={0.6}
          >
            {d === 'del'
              ? <Delete size={20} color="#64748b" />
              : <Text style={s.keyText}>{d}</Text>
            }
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a', padding: 24 },

  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 36 },
  brandIcon: {
    width: 42, height: 42, borderRadius: 11, backgroundColor: '#2563eb',
    alignItems: 'center', justifyContent: 'center',
  },
  brandIconText: { color: '#fff', fontWeight: '700', fontSize: 13, letterSpacing: 0.5 },
  brandName: { fontSize: 17, fontWeight: '700', color: '#f1f5f9' },

  title: { fontSize: 20, fontWeight: '700', color: '#f1f5f9', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#64748b', marginBottom: 32 },

  pinRow: { flexDirection: 'row', gap: 14, marginBottom: 32 },
  dot: { width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: '#334155' },
  dotFilled: { backgroundColor: '#2563eb', borderColor: '#2563eb' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', width: 270, gap: 10 },
  key: {
    width: 80, height: 58, backgroundColor: '#1e293b',
    borderRadius: 10, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#334155',
  },
  keyHidden: { opacity: 0, pointerEvents: 'none' },
  keyText: { fontSize: 20, fontWeight: '500', color: '#f1f5f9' },
});
