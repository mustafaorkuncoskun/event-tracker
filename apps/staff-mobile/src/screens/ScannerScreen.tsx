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
import { CheckCircle2, AlertTriangle, XCircle, ChevronLeft, LogOut } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../App';

const API_BASE = __DEV__ ? 'http://192.168.1.103:3001/api' : 'https://api.sirketiniz.com/api';

type ResultType = 'success' | 'already' | 'error' | null;
type Props = NativeStackScreenProps<RootStackParamList, 'Scanner'>;

export default function ScannerScreen({ route, navigation }: Props) {
  const { staffId, staffName, eventId, eventTitle } = route.params;
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
        body: JSON.stringify({ value: value.trim(), staffId, eventId }),
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
  }, [staffId, eventId, showResult]);

  const doOCR = useCallback(async () => {
    if (!cameraRef.current || ocrLoading) return;
    setOcrLoading(true);
    try {
      const photo = await cameraRef.current.takePhoto({ flash: 'off' });
      const recognized = await TextRecognition.recognize(`file://${photo.path}`);
      const allText = recognized.blocks.map(b => b.text).join(' ');
      const match = allText.replace(/\s/g, '').match(/\d{9}/);
      if (match) {
        setCode(match[0]);
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
        <View style={s.headerLeft}>
          <TouchableOpacity
            style={s.backBtn}
            onPress={() => navigation.replace('EventSelect', { staffId, staffName })}
          >
            <ChevronLeft size={18} color="#64748b" />
          </TouchableOpacity>
          <View>
            <Text style={s.headerTitle}>{eventTitle}</Text>
            <Text style={s.headerSub}>Görevli: {staffName}</Text>
          </View>
        </View>
        <TouchableOpacity style={s.logoutBtn} onPress={() => navigation.replace('Login')}>
          <LogOut size={13} color="#64748b" />
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
            <TouchableOpacity style={s.ocrBtn} onPress={doOCR} disabled={ocrLoading}>
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
              placeholderTextColor="#334155"
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
          <View style={s.resultIcon}>
            {result === 'success' && <CheckCircle2 size={80} color="#fff" strokeWidth={1.5} />}
            {result === 'already' && <AlertTriangle size={80} color="#fff" strokeWidth={1.5} />}
            {result === 'error' && <XCircle size={80} color="#fff" strokeWidth={1.5} />}
          </View>
          <Text style={s.resultTitle}>
            {result === 'success' ? 'Giriş Yapıldı' : result === 'already' ? 'Zaten Giriş Yaptı' : 'Geçersiz Kod'}
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
  centerTitle: { fontSize: 16, fontWeight: '600', color: '#f1f5f9', marginBottom: 20 },
  permBtn: { backgroundColor: '#2563eb', borderRadius: 9, paddingHorizontal: 24, paddingVertical: 11 },
  permBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  header: {
    backgroundColor: '#1e293b',
    padding: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#1e3a5f',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  backBtn: {
    width: 32, height: 32, borderRadius: 7,
    borderWidth: 1, borderColor: '#334155',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 14, fontWeight: '700', color: '#f1f5f9' },
  headerSub: { fontSize: 12, color: '#64748b', marginTop: 1 },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1, borderColor: '#334155', borderRadius: 7,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  logoutText: { color: '#64748b', fontSize: 12 },

  cameraWrap: { flex: 1, position: 'relative' },
  topMask: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: MASK_COLOR },
  middleRow: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
  },
  sideMask: { flex: 1, height: FRAME_SIZE, backgroundColor: MASK_COLOR },
  scanFrame: {
    width: FRAME_SIZE, height: FRAME_SIZE,
    borderWidth: 2, borderColor: '#2563eb', borderRadius: 14,
    backgroundColor: 'transparent',
  },
  bottomMask: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 52,
    backgroundColor: MASK_COLOR, alignItems: 'center', justifyContent: 'center',
  },
  scanHint: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },

  manual: { backgroundColor: '#1e293b', padding: 16, borderTopWidth: 1, borderTopColor: '#1e3a5f' },
  manualLabel: { color: '#64748b', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  inputRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },

  ocrBtn: {
    width: 48, height: 48, backgroundColor: '#334155', borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
  },
  ocrBtnText: { fontSize: 12, fontWeight: '700', color: '#f1f5f9' },

  input: {
    flex: 1, backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#334155',
    borderRadius: 9, color: '#f1f5f9', fontSize: 20, fontWeight: '600',
    padding: 12, textAlign: 'center', letterSpacing: 2,
  },
  goBtn: {
    backgroundColor: '#2563eb', borderRadius: 9,
    paddingHorizontal: 18, height: 48,
    alignItems: 'center', justifyContent: 'center',
  },
  goBtnOff: { opacity: 0.35 },
  goBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  resultOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  green: { backgroundColor: 'rgba(15,118,52,0.94)' },
  amber: { backgroundColor: 'rgba(161,87,8,0.94)' },
  red:   { backgroundColor: 'rgba(168,30,30,0.94)' },
  resultIcon: { marginBottom: 14 },
  resultTitle: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 6 },
  resultSub: { fontSize: 14, color: 'rgba(255,255,255,0.8)', textAlign: 'center', paddingHorizontal: 24 },
});
