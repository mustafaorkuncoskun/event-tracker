import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  ActivityIndicator, StatusBar, SafeAreaView,
} from 'react-native';
import { ChevronRight, Calendar, MapPin, LogOut, Inbox } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../App';

const API_BASE = __DEV__ ? 'http://192.168.1.103:3001/api' : 'https://api.sirketiniz.com/api';

interface Event {
  id: string;
  title: string;
  date: string;
  location?: string | null;
}

type Props = NativeStackScreenProps<RootStackParamList, 'EventSelect'>;

export default function EventSelectScreen({ route, navigation }: Props) {
  const { staffId, staffName } = route.params;
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${API_BASE}/events`)
      .then(r => r.json())
      .then(data => { setEvents(data); setLoading(false); })
      .catch(() => { setError('Etkinlikler yüklenemedi'); setLoading(false); });
  }, []);

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1e293b" />

      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Etkinlik Seç</Text>
          <Text style={s.headerSub}>Görevli: {staffName}</Text>
        </View>
        <TouchableOpacity style={s.logoutBtn} onPress={() => navigation.replace('Login')}>
          <LogOut size={13} color="#64748b" />
          <Text style={s.logoutText}>Çıkış</Text>
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={s.center}>
          <ActivityIndicator color="#2563eb" size="large" />
        </View>
      )}

      {!!error && (
        <View style={s.center}>
          <Text style={s.infoText}>{error}</Text>
        </View>
      )}

      {!loading && !error && events.length === 0 && (
        <View style={s.center}>
          <Inbox size={44} color="#334155" />
          <Text style={[s.infoText, { marginTop: 12 }]}>Aktif etkinlik bulunamadı</Text>
        </View>
      )}

      <FlatList
        data={events}
        keyExtractor={item => item.id}
        contentContainerStyle={s.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={s.card}
            activeOpacity={0.7}
            onPress={() => navigation.replace('Scanner', {
              staffId,
              staffName,
              eventId: item.id,
              eventTitle: item.title,
            })}
          >
            <View style={s.cardBody}>
              <Text style={s.cardTitle}>{item.title}</Text>
              <View style={s.cardMeta}>
                <View style={s.metaRow}>
                  <Calendar size={12} color="#64748b" />
                  <Text style={s.metaText}>
                    {new Date(item.date).toLocaleDateString('tr-TR', { dateStyle: 'long' })}
                  </Text>
                </View>
                {item.location ? (
                  <View style={s.metaRow}>
                    <MapPin size={12} color="#64748b" />
                    <Text style={s.metaText}>{item.location}</Text>
                  </View>
                ) : null}
              </View>
            </View>
            <ChevronRight size={18} color="#334155" />
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: {
    backgroundColor: '#1e293b',
    padding: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#1e3a5f',
  },
  headerTitle: { fontSize: 15, fontWeight: '700', color: '#f1f5f9' },
  headerSub: { fontSize: 12, color: '#64748b', marginTop: 2 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 7,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  logoutText: { color: '#64748b', fontSize: 13 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  infoText: { color: '#64748b', fontSize: 14 },
  list: { padding: 16, gap: 10 },
  card: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#1e3a5f',
    borderRadius: 10,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardBody: { flex: 1, gap: 6 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#f1f5f9' },
  cardMeta: { gap: 3 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontSize: 12, color: '#64748b' },
});
