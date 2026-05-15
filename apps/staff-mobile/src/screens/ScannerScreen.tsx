import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Vibration, StatusBar, SafeAreaView, Alert, ActivityIndicator,
} from 'react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import {
  Camera, useCameraDevice, useCodeScanner, useCameraPermission,
} from 'react-native-vision-camera';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../App';

const API_BASE = __DEV__ ? 'http://192.168.1.103:3001/api' : 'https://api.sirketiniz.com/api';

type ResultType = 'success' | 'already' | 'error' | null;
type Props = NativeStackScreenProps<RootStackParamList, 'Scanner'>;

export default function ScannerScreen({ route, navigation }: Props) {
  const { staffId, staffName } = route.params;
  const [code, setCode] = useState('');
  const [result, setResult] = useState<ResultType>(null);
  const [resultMsg, setResultMsg] = useState('');
  const [ocrLoading, setOcrLoading] = useState(false);
  const processing = useRef(false);
  const cameraRef = useRef<Camera>(null);

  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');

  useEffect(() => {
    if (!hasPermission) {
      requestPermission().then(granted => {
        if (!granted) Alert.alert('Kamera İzni', 'Kamera iznine ihtiyaç var.');
      });
    }
  }, [hasPermission, requestPermission]);

  const showResult = useCallback((type: ResultType, msg: string) => {
    setResult(type);
    setResultMsg(msg);
    setTimeout(() => {
      setResult(null);
      setResultMsg('');
      processing.current = false;
    }, 2500);
  }, []);

  const doCheckin = useCallback(async (value: string) => {
    if (processing.current) return;
    processing.current = true;
    try {
      const res = await fetch(`${API_BASE}/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: value.trim(), staffId }),
      });
      const data = await res.json();
      if (data.success) {
        Vibration.vibrate(100);
        showResult('success', data.employee?.name ?? '');
        setCode('');
      } else if (data.reason === 'already_checked_in') {
        Vibration.vibrate([0, 100, 100, 100]);
        showResult('already', data.message ?? 'Zaten giriş yapıldı');
      } else {
        Vibration.vibrate([0, 300]);
        showResult('error', data.message ?? 'Geçersiz kod');
      }
    } catch {
      showResult('error', 'Bağlantı hatası');
    }
  }, [staffId, showResult]);

  // Kameradan fotoğraf çek → ML Kit ile metni oku → 9 haneli sayıyı bul
  const doOCR = useCallback(async () => {
    if (!cameraRef.current || ocrLoading) return;
    setOcrLoading(true);
    try {
      const photo = await cameraRef.current.takePhoto({ flash: 'off' });
      const recognized = await TextRecognition.recognize(`file://${photo.path}`);

      // Tüm tanınan metinden 9 haneli sayıları bul
      const allText = recognized.blocks.map(b => b.text).join(' ');
      const match = allText.replace(/\s/g, '').match(/\d{9}/);

      if (match) {
        setCode(match[0]);
        // Direkt giriş yaptır
        doCheckin(match[0]);
      } else {
        Alert.alert('Kod Bulunamadı', 'Kamerayı 9 haneli kodun üzerine tutun ve tekrar deneyin.');
        processing.current = false;
      }
    } catch {
      Alert.alert('Hata', 'OCR işlemi başarısız oldu.');
      processing.current = false;
    } finally {
      setOcrLoading(false);
    }
  }, [ocrLoading, doCheckin]);

  const codeScanner = useCodeScanner({
    codeTypes: ['qr'],
    onCodeScanned: (codes) => {
      const val = codes[0]?.value;
      if (val) doCheckin(val);
    },
  });

  if (!hasPermission) {
    return (
      <View style={s.center}>
        <Text style={s.centerText}>📷</Text>
        <Text style={s.centerTitle}>Kamera İzni Gerekiyor</Text>
        <TouchableOpacity style={s.permBtn} onPress={requestPermission}>
          <Text style={s.permBtnText}>İzin Ver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={s.center}>
        <Text style={s.centerTitle}>Kamera bulunamadı</Text>
      </View>
    );
  }

  const displayCode = code.replace(/(\d{3})(\d{1,3})?(\d{1,3})?/, (_, a, b, c) =>
    [a, b, c].filter(Boolean).join(' ')
  );

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1e293b" />

      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Etkinlik Girişi</Text>
          <Text style={s.headerSub}>Görevli: {staffName}</Text>
        </View>
        <TouchableOpacity style={s.logoutBtn} onPress={() => navigation.replace('Login')}>
          <Text style={s.logoutText}>Çıkış</Text>
        </TouchableOpacity>
      </View>

      <View style={s.cameraWrap}>
        <Camera
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={result === null}
          photo={true}
          codeScanner={codeScanner}
        />
        <View style={s.topMask} />
        <View style={s.middleRow}>
          <View style={s.sideMask} />
          <View style={s.scanFrame} />
          <View style={s.sideMask} />
        </View>
        <View style={s.bottomMask}>
          <Text style={s.scanHint}>QR kodu kareye hizalayın</Text>
        </View>
      </View>

      <KeyboardStickyView offset={{ closed: 0, opened: 0 }}>
        <View style={s.manual}>
          <Text style={s.manualLabel}>veya 9 haneli kodu girin</Text>
          <View style={s.inputRow}>
            {/* OCR butonu */}
            <TouchableOpacity
              style={s.ocrBtn}
              onPress={doOCR}
              disabled={ocrLoading}
            >
              {ocrLoading
                ? <ActivityIndicator color="#f1f5f9" size="small" />
                : <Text style={s.ocrBtnText}>OCR</Text>
              }
            </TouchableOpacity>

            <TextInput
              style={s.input}
              value={displayCode}
              onChangeText={t => setCode(t.replace(/\D/g, '').slice(0, 9))}
              keyboardType="numeric"
              placeholder="123 456 789"
              placeholderTextColor="#475569"
              maxLength={11}
              returnKeyType="done"
              onSubmitEditing={() => code.length === 9 && doCheckin(code)}
            />
            <TouchableOpacity
              style={[s.goBtn, code.length !== 9 && s.goBtnOff]}
              disabled={code.length !== 9}
              onPress={() => doCheckin(code)}
            >
              <Text style={s.goBtnText}>Giriş</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardStickyView>

      {result && (
        <View style={[s.resultOverlay, result === 'success' ? s.green : result === 'already' ? s.amber : s.red]}>
          <Text style={s.resultIcon}>
            {result === 'success' ? '✅' : result === 'already' ? '⚠️' : '❌'}
          </Text>
          <Text style={s.resultTitle}>
            {result === 'success' ? 'Giriş Yapıldı' : result === 'already' ? 'Zaten Giriş Yaptı' : 'Geçersiz'}
          </Text>
          <Text style={s.resultSub}>{resultMsg}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const FRAME_SIZE = 240;
const MASK_COLOR = 'rgba(0,0,0,0.55)';

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a', padding: 24 },
  centerText: { fontSize: 48, marginBottom: 12 },
  centerTitle: { fontSize: 18, fontWeight: '600', color: '#f1f5f9', marginBottom: 20 },
  permBtn: { backgroundColor: '#2563eb', borderRadius: 10, paddingHorizontal: 28, paddingVertical: 12 },
  permBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  header: {
    backgroundColor: '#1e293b', padding: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#f1f5f9' },
  headerSub: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  logoutBtn: { borderWidth: 1, borderColor: '#334155', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  logoutText: { color: '#94a3b8', fontSize: 13 },

  cameraWrap: { flex: 1, position: 'relative' },
  topMask: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: MASK_COLOR },
  middleRow: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
  },
  sideMask: { flex: 1, height: FRAME_SIZE, backgroundColor: MASK_COLOR },
  scanFrame: {
    width: FRAME_SIZE, height: FRAME_SIZE,
    borderWidth: 3, borderColor: '#2563eb', borderRadius: 16,
    backgroundColor: 'transparent',
  },
  bottomMask: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 60,
    backgroundColor: MASK_COLOR, alignItems: 'center', justifyContent: 'center',
  },
  scanHint: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },

  manual: { backgroundColor: '#1e293b', padding: 20, borderTopWidth: 1, borderTopColor: '#334155' },
  manualLabel: { color: '#94a3b8', fontSize: 13, marginBottom: 12 },
  inputRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },

  ocrBtn: {
    width: 48, height: 48, backgroundColor: '#334155', borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  ocrBtnText: { fontSize: 13, fontWeight: '700', color: '#f1f5f9' },

  input: {
    flex: 1, backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#334155',
    borderRadius: 10, color: '#f1f5f9', fontSize: 20, fontWeight: '600',
    padding: 12, textAlign: 'center', letterSpacing: 2,
  },
  goBtn: { backgroundColor: '#2563eb', borderRadius: 10, paddingHorizontal: 20, height: 48, alignItems: 'center', justifyContent: 'center' },
  goBtnOff: { opacity: 0.4 },
  goBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  resultOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  green: { backgroundColor: 'rgba(21,128,61,0.93)' },
  amber: { backgroundColor: 'rgba(180,83,9,0.93)' },
  red: { backgroundColor: 'rgba(185,28,28,0.93)' },
  resultIcon: { fontSize: 72, marginBottom: 12 },
  resultTitle: { fontSize: 24, fontWeight: '700', color: '#fff', marginBottom: 4 },
  resultSub: { fontSize: 15, color: 'rgba(255,255,255,0.85)' },
});
