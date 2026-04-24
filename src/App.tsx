import * as React from 'react';
import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AstrologyForm } from './components/AstrologyForm';
import { AstrologyChart } from './components/AstrologyChart';
import { ScrollToTop } from './components/ScrollToTop';
import { calculateChart, BirthInfo, Palace } from './lib/astrology';
import { Button } from '../components/ui/button';
import { 
  ChevronLeft, ChevronDown, Sparkles, Moon, Sun, User, Users, Heart, Baby, Coins, ShieldAlert, Plane, Briefcase, Home, GraduationCap, Users2, Info, Star, Shield, X, Bot, Loader2,
  Lock, ArrowRight, Check, Zap, MessageSquare, Share2, Download, Calendar, ImageIcon, FileText,
  Handshake, Target, Compass, Brain, Activity, Trees, Quote, Key
} from 'lucide-react';
import { TooltipProvider } from '../components/ui/tooltip';
import { cn } from '../lib/utils';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '../components/ui/dialog';
import { STAR_MEANINGS, MINOR_STAR_MEANINGS, TU_HOA_MEANINGS } from './lib/starMeanings';
import { getAICompletion, getAvailableApiKeysInfo } from './lib/aiService';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { auth, googleProvider, db } from './lib/firebase';
import { signInWithPopup, signInWithRedirect, getRedirectResult, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

// --- Types & Constants ---
type View = 'landing' | 'result' | 'profile' | 'admin';
const ADMIN_EMAIL = 'truongduchungsonjr03@gmail.com';

const PALACE_ICONS: Record<string, any> = {
  'Mệnh': User,
  'Phụ Mẫu': Users,
  'Phúc Đức': Sparkles,
  'Điền Trạch': Home,
  'Quan Lộc': Briefcase,
  'Nô Bộc': Users2,
  'Thiên Di': Plane,
  'Tật Ách': ShieldAlert,
  'Tài Bạch': Coins,
  'Tử Tức': Baby,
  'Phu Thê': Heart,
  'Huynh Đệ': Users2,
};

const PALACE_DESCRIPTIONS: Record<string, string> = {
  'Mệnh': 'Luận Mệnh – Thân để thực sự “thấy rõ” chính mình một cách sâu sắc nhất! Cung Mệnh chính là gốc rễ, là “hạt giống” bẩm sinh chứa đựng bản chất, khí chất và toàn bộ tiềm năng bạn mang theo từ lúc sinh ra. Còn cung Thân lại là phiên bản hoàn thiện của bạn sau bao năm tháng trưởng thành – nơi những trải nghiệm, lựa chọn và vận trình cuộc đời biến “hạt giống” ấy thành một con người thực thụ.',
  'Huynh Đệ': 'Nơi hé lộ toàn bộ vận anh chị em, bạn bè thân thiết như anh em, sự hỗ trợ lẫn nhau và mối quan hệ ruột thịt suốt đời. Nó cho bạn biết rõ: bạn có anh em ruột thịt đông đúc, hòa thuận hay ít ỏi, hay gặp xung đột; anh em có giúp đỡ bạn lớn lao hay gây trở ngại, và cách nào để giữ gìn tình thân, nhận được sự hỗ trợ chân thành từ người thân. Mở cung Huynh Đệ ngay để nắm bắt vận may từ anh em, xây dựng mối quan hệ gắn bó keo sơn và đón nhận sự giúp sức quý báu giúp bạn vững bước trên đường đời!',
  'Phu Thê': 'Luận giải về chuyện tình cảm, hôn nhân, đặc điểm của người phối ngẫu (vợ/chồng) và đời sống gia đạo hạnh phúc hay trắc trở. Nơi hé lộ toàn bộ vận tình duyên, hôn nhân, phẩm chất vợ/chồng và hạnh phúc lứa đôi suốt đời. Nó cho bạn biết rõ: bạn sẽ gặp người bạn đời như thế nào, hôn nhân có suôn sẻ hạnh phúc hay sóng gió, và cách nào để duy trì tình cảm bền chặt, tránh hiểu lầm, chọn đúng nửa kia lý tưởng. Mở cung Phu Thê ngay để nắm bắt vận may tình duyên, tìm được người yêu thương thật sự và xây dựng tổ ấm ngọt ngào, vững vàng trọn đời!',
  'Tử Tức': 'Nơi hé lộ toàn bộ vận con cái, số lượng hậu duệ, phẩm chất và mối quan hệ cha mẹ - con cái suốt đời. Nó cho bạn biết rõ: bạn sẽ có bao nhiêu con, con cái có hiếu thảo, tài giỏi hay gặp khó khăn, và cách nào để nuôi dạy thuận lợi, con cháu đầy đàn, mạnh khỏe. Mở cung Tử Tức ngay để nắm bắt vận may con cái, xây dựng mối quan hệ gia đình êm ấm và đón nhận niềm vui con cháu trọn đời!',
  'Tài Bạch': 'Phản ánh năng lực tài chính, nguồn thu nhập, cách kiếm tiền và giữ tiền, cũng như mức độ giàu nghèo trong cuộc đời. Cung Tài Bạch chính là “kho tiền” trong lá số của bạn – nơi hé lộ toàn bộ vận tài lộc, cách kiếm tiền, khả năng tích lũy và quản lý tài chính suốt đời. Nó cho bạn biết rõ: bạn sẽ giàu nhờ con đường nào, tiền bạc có dễ đến hay hay hao hụt, và làm thế nào để vận may tài chính luôn mỉm cười. Mở cung Tài Bạch ngay để nắm bắt bí quyết làm giàu, tránh lãng phí và sống sung túc, thịnh vượng hơn!',
  'Tật Ách': 'Dự báo về sức khỏe, các bệnh tật tiềm ẩn, tai ách có thể gặp phải và khả năng vượt qua hoạn nạn. Nơi hé lộ toàn bộ vận hạn bệnh tật, tai ương, tai nạn và tuổi thọ suốt đời. Nó cho bạn biết rõ: bạn dễ gặp vấn đề sức khỏe gì, khi nào cần đề phòng tai ách, và cách nào để giữ gìn thân thể khỏe mạnh, tránh rủi ro, sống trường thọ bình an. Mở cung Tật Ách ngay để nắm bí quyết bảo vệ bản thân, phòng ngừa bệnh tật và đón một cuộc đời khỏe mạnh, vững vàng!',
  'Thiên Di': 'Cung Thiên Di chính là “chân trời xa xôi” trong lá số của bạn – nơi hé lộ toàn bộ vận di chuyển, xuất ngoại, cuộc sống xa nhà và những thay đổi lớn về môi trường suốt đời. Nó cho bạn biết rõ: bạn có hợp sống xa quê, định cư nước ngoài hay thường xuyên di chuyển, sẽ gặp quý nhân từ xa hay gặp trở ngại khi đi xa, và cách nào để mỗi chuyến đi đều mang lại may mắn, cơ hội lớn. Mở cung Thiên Di ngay để nắm bắt vận may khi xa nhà, chọn đúng nơi chốn phát triển và đón những chân trời rực rỡ đang chờ bạn!',
  'Nô Bộc': 'Nơi hé lộ toàn bộ vận bạn bè, đồng nghiệp, cấp dưới, đối tác và những người hỗ trợ (hoặc cản trở) bạn suốt đời. Nó cho bạn biết rõ: bạn có gặp quý nhân giúp đỡ hay tiểu nhân quấy phá, mối quan hệ xã giao có mang lại lợi ích, và cách nào để chọn đúng người đồng hành, xây dựng đội ngũ vững mạnh, tránh bị lợi dụng. Mở cung Nô Bộc ngay để nắm bắt vận may từ người xung quanh, kết nối đúng người đúng việc và đón nhận sự hỗ trợ lớn lao giúp bạn thành công rực rỡ!',
  'Quan Lộc': 'Luận giải về con đường công danh, sự nghiệp, chức vụ, nghề nghiệp phù hợp và khả năng thăng tiến. Cung Quan Lộc chính là “sân khấu sự nghiệp” trong lá số của bạn – nơi hé lộ toàn bộ vận công danh, địa vị, thành tựu và con đường thăng tiến suốt đời. Nó cho bạn biết rõ: bạn phù hợp với nghề nào, có gặp quý nhân hay trở ngại, cách nào để thăng tiến nhanh và đạt được danh vọng, quyền lực. Mở cung Quan Lộc ngay để nắm bắt cơ hội vàng, chọn đúng hướng đi và đưa sự nghiệp của bạn bay cao, rực rỡ!',
  'Điền Trạch': 'Nơi hé lộ toàn bộ vận nhà cửa, đất đai, bất động sản và môi trường sống suốt đời. Nó cho bạn biết rõ: bạn sẽ sở hữu nhà đất như thế nào, hợp mua bán – đầu tư bất động sản vào thời điểm nào, gia sản thừa kế ra sao, và cách nào để an cư lạc nghiệp, nhà cửa luôn vững chãi, ấm êm. Mở cung Điền Trạch ngay để nắm bắt vận may nhà cửa, chọn đúng tổ ấm mơ ước và xây dựng cuộc sống an lành, thịnh vượng trọn đời!',
  'Phụ Mẫu': 'Nơi hé lộ toàn bộ vận quan hệ cha mẹ, sự nuôi dưỡng, hỗ trợ từ phụ mẫu và di sản gia đình suốt đời. Nó cho bạn biết rõ: cha mẹ bạn thuộc mẫu người nào, mối quan hệ có êm ấm hay khắc nghiệt, mức độ phù trợ từ phụ mẫu mạnh đến đâu, và cách nào để hiếu thảo, gắn kết bền chặt. Mở cung Phụ Mẫu ngay để thấu hiểu nguồn cội, cải thiện tình cảm cha con và đón nhận phúc ấm lớn lao từ đấng sinh thành trọn đời!',
  'Phúc Đức': 'Nơi hé lộ về phúc phần, tổ tiên, tâm hồn và sự an lạc nội tâm suốt đời. Nó cho bạn biết rõ: phúc đức của bạn dày hay mỏng, tổ tiên có phù hộ hay không, và cách nào để tích đức, sống bình tĩnh và đạt được sự an lạc giữa đời trường. Mở cung Phúc Đức ngay để nắm bắt vận may từ tâm linh, kết nối với nguồn cội và đón nhận sự bảo hộ thầm lặng giúp cuộc đời bạn hanh thông, hạnh phúc trọn vẹn!'
};

export default function App() {
  const [view, setView] = useState<View>('landing');
  const [chartData, setChartData] = useState<any>(null);
  const [birthInfo, setBirthInfo] = useState<BirthInfo | null>(null);
  const [yearlyYear, setYearlyYear] = useState<number>(new Date().getFullYear());
  const [selectedPalaceIndex, setSelectedPalaceIndex] = useState<number | null>(null);
  const [isPalaceDialogOpen, setIsPalaceDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('Mệnh');
  const [isSubscribed, setIsSubscribed] = useState(true);

  // Authentication state
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const isAdmin = user?.email === ADMIN_EMAIL;
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isEmbeddedBrowser = () => {
    const ua = navigator.userAgent.toLowerCase() || navigator.vendor?.toLowerCase() || (window as any).opera?.toLowerCase();
    return (
      ua.includes("fban") || 
      ua.includes("fbav") || 
      ua.includes("instagram") || 
      ua.includes("threads") ||
      ua.includes("messenger") ||
      ua.includes("zalo") ||
      ua.includes("bytedance")
    );
  };

  const handleLogin = async () => {
    if (isLoggingIn) return;
    
    if (isEmbeddedBrowser()) {
      window.dispatchEvent(new CustomEvent('app-notification', { 
        detail: { message: "Google chặn đăng nhập trong Zalo/Messenger/FB. Vui lòng bấm dấu 3 chấm ⋯ -> Chọn 'Mở bằng trình duyệt' (Safari/Chrome).", type: 'error' } 
      }));
      return;
    }

    setIsLoggingIn(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error("Popup login error:", error);
      
      if (error.code === 'auth/popup-blocked') {
        window.dispatchEvent(new CustomEvent('app-notification', { 
          detail: { message: "Trình duyệt đang chặn cửa sổ đăng nhập. Vui lòng Tắt chặn Pop-up hoặc làm mới trang.", type: 'error' } 
        }));
      } else if (error.code === 'auth/unauthorized-domain') {
        window.dispatchEvent(new CustomEvent('app-notification', { 
          detail: { message: "Lỗi cấu hình: Domain web chưa được ủy quyền trên Firebase.", type: 'error' } 
        }));
      } else if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
        window.dispatchEvent(new CustomEvent('app-notification', { 
          detail: { message: "Có lỗi xảy ra khi đăng nhập: " + error.message, type: 'error' } 
        }));
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    let userUnsubscribe: (() => void) | null = null;
    
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setIsAuthChecking(false);

      if (currentUser) {
        // Stop previous user listener if exists
        if (userUnsubscribe) userUnsubscribe();
        
        // Import onSnapshot here or at top
        const { onSnapshot } = await import('firebase/firestore');
        const userRef = doc(db, 'users', currentUser.uid);
        
        // Listen to user data for quota
        userUnsubscribe = onSnapshot(userRef, (snapshot) => {
          if (snapshot.exists()) {
            setUserData(snapshot.data());
          }
        }, (error) => {
          console.warn("Lỗi đồng bộ dữ liệu người dùng (có thể do phiên đăng nhập hết hạn):", error.message);
        });

        // Set/update initial info
        try {
          await setDoc(userRef, {
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName,
            photoURL: currentUser.photoURL,
            lastLoginAt: serverTimestamp(),
          }, { merge: true });

          // Gán lá số hiện tại vào tài khoản nếu vừa đăng nhập
          if (birthInfo) {
            const docId = getChartId(birthInfo);
            const historyRef = doc(db, 'users', currentUser.uid, 'history', docId);
            await setDoc(historyRef, {
              name: birthInfo.name,
              gender: birthInfo.gender,
              solarDateTimestamp: birthInfo.solarDate.getTime(),
              hour: birthInfo.hour,
              minute: birthInfo.minute,
              isLunar: birthInfo.isLunar,
              isLeap: birthInfo.isLeap,
              lastViewedAt: serverTimestamp(),
            }, { merge: true });
          }
        } catch (error) {
          console.error("Lỗi khi lưu thông tin người dùng: ", error);
        }
      } else {
        if (userUnsubscribe) userUnsubscribe();
        setUserData(null);
      }
    });
    
    return () => {
      unsubscribeAuth();
      if (userUnsubscribe) userUnsubscribe();
    };
  }, [birthInfo]); // Run when birthInfo is available after login

  useEffect(() => {
    const fetchStoredInterpretations = async () => {
      if (user && birthInfo && view === 'result') {
        try {
          const { collection, getDocs } = await import('firebase/firestore');
          const chartId = getChartId(birthInfo);
          const interpRef = collection(db, 'users', user.uid, 'history', chartId, 'interpretations');
          const snapshot = await getDocs(interpRef);
          
          const stored: Record<string, string> = {};
          snapshot.forEach(doc => {
            stored[doc.id] = doc.data().text;
          });
          
          if (Object.keys(stored).length > 0) {
            setPalaceInterpretations(prev => ({ ...prev, ...stored }));
          }
        } catch (e) {
          console.error("Lỗi tải luận giải có sẵn:", e);
        }
      }
    };
    fetchStoredInterpretations();
  }, [user, birthInfo, view]);

  // AI related states
  const [palaceInterpretations, setPalaceInterpretations] = useState<Record<string, string>>({});
  const [isAffiliateOpened, setIsAffiliateOpened] = useState(false);
  const [isGeneratingTabAI, setIsGeneratingTabAI] = useState(false);
  const [interpretingPalace, setInterpretingPalace] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<{id: number, message: string, type: 'error' | 'info'}[]>([]);

  useEffect(() => {
    const handleNotification = (event: any) => {
      const { message, type } = event.detail;
      const id = Date.now();
      setNotifications(prev => [...prev, { id, message, type }]);
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, 5000);
    };

    window.addEventListener('app-notification', handleNotification as EventListener);
    return () => window.removeEventListener('app-notification', handleNotification as EventListener);
  }, []);

  // Presence Tracker
  useEffect(() => {
    let updateInterval: NodeJS.Timeout;
    
    const updatePresence = async (isOnline: boolean) => {
      if (!user) return;
      try {
        const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
        await updateDoc(doc(db, 'users', user.uid), {
          isOnline,
          lastActiveAt: serverTimestamp()
        });
      } catch (e) {
        // Ignore silently to avoid console spam if offline
      }
    };

    if (user) {
      updatePresence(true);
      updateInterval = setInterval(() => {
        if (document.visibilityState === 'visible') {
          updatePresence(true);
        }
      }, 60000); // 1 minute heartbeat
    }
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updatePresence(true);
      } else {
        updatePresence(false);
      }
    };
    
    const handleBeforeUnload = () => {
      if (user) {
        updatePresence(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      if (user) {
        updatePresence(false);
      }
      if (updateInterval) clearInterval(updateInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user]);

  // History state
  const [historyList, setHistoryList] = useState<any[]>([]);

  const fetchHistory = async (uid: string) => {
    try {
      // Need import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore'; 
      // but we will just add them to the import
      const { collection, query, orderBy, limit, getDocs } = await import('firebase/firestore');
      const q = query(collection(db, 'users', uid, 'history'), orderBy('lastViewedAt', 'desc'), limit(15));
      const querySnapshot = await getDocs(q);
      const historyData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHistoryList(historyData);
    } catch(e) { 
      console.error('Error fetching history', e); 
    }
  }

  useEffect(() => {
    if (user && view === 'landing') {
      fetchHistory(user.uid);
    }
  }, [user, view]);

  const PRIORITY_ORDER = ['Mệnh', 'Tài Bạch', 'Quan Lộc', 'Phu Thê', 'Thiên Di', 'Phúc Đức', 'Phụ Mẫu', 'Điền Trạch', 'Nô Bộc', 'Tật Ách', 'Tử Tức', 'Huynh Đệ'];

  const getChartId = (data: BirthInfo) => {
    return btoa(encodeURIComponent(`${data.name}-${data.gender}-${data.solarDate.getFullYear()}-${data.solarDate.getMonth()}-${data.solarDate.getDate()}-${data.hour}-${data.minute}-${data.isLunar}`)).replace(/[\/\+=]/g, '_');
  };

  const handleFormSubmit = async (data: BirthInfo, isFromHistory = false) => {
    try {
      const chart = calculateChart(data, yearlyYear);
      setChartData(chart);
      setBirthInfo(data);
      setSelectedPalaceIndex(chart.menhIdx);
      setActiveTab('Mệnh');
      setIsAffiliateOpened(false);
      
      // Chỉ xoá luận giải nếu không phải mở từ lịch sử
      if (!isFromHistory) {
        setPalaceInterpretations({});
      }
      
      setView('result');

      // Thêm chức năng lưu lịch sử nếu user đăng nhập
      if (user) {
        try {
          const docId = getChartId(data);
          const historyRef = doc(db, 'users', user.uid, 'history', docId);
          await setDoc(historyRef, {
            name: data.name,
            gender: data.gender,
            solarDateTimestamp: data.solarDate.getTime(),
            hour: data.hour,
            minute: data.minute,
            isLunar: data.isLunar,
            isLeap: data.isLeap,
            lastViewedAt: serverTimestamp(),
          }, { merge: true });
        } catch (dbError) {
          console.error("Lỗi lưu lịch sử:", dbError);
        }
      }
    } catch (error: any) {
      console.error("Error calculating chart:", error);
      window.dispatchEvent(new CustomEvent('app-notification', { 
        detail: { message: `Lỗi tính toán lá số: ${error.message || 'Dữ liệu ngày giờ không hợp lệ.'}`, type: 'error' } 
      }));
    }
  };

  const handleReset = () => {
    setChartData(null);
    setBirthInfo(null);
    setView('landing');
    setPalaceInterpretations({});
    setIsAffiliateOpened(false);
  };

  const generateTabInterpretation = async (palaceName: string) => {
    if (!user) {
      window.dispatchEvent(new CustomEvent('app-notification', { 
        detail: { message: 'Đăng nhập để xem luận giải miễn phí.', type: 'info' } 
      }));
      return;
    }
    
    if (!chartData || isGeneratingTabAI) return;

    // Kiểm tra hạn mức luận giải (Quota)
    const chartId = getChartId(birthInfo!);
    const interpretedChartIds = userData?.interpretedChartIds || [];
    const isAlreadyInterpreted = interpretedChartIds.includes(chartId);
    const quotaLimit = userData?.customQuotaLimit || 2;

    if (!isAdmin && !isAlreadyInterpreted && interpretedChartIds.length >= quotaLimit) {
      window.dispatchEvent(new CustomEvent('app-notification', { 
        detail: { message: `Bạn đã hết lượt luận giải miễn phí (tối đa cho ${quotaLimit} lá số). Vui lòng nâng cấp tài khoản để tiếp tục.`, type: 'error' } 
      }));
      return;
    }

    setIsGeneratingTabAI(true);
    setInterpretingPalace(palaceName);
    try {
      const idx = chartData.palaces.findIndex((p: any) => p.name === palaceName);
      if (idx === -1) return;
      
      const palace = chartData.palaces[idx];
      
      // Relations
      const xungChieuIdx = (idx + 6) % 12;
      const tamHop1Idx = (idx + 4) % 12;
      const tamHop2Idx = (idx + 8) % 12;
      
      const nhiHopMap: Record<number, number> = {
        0: 1, 1: 0, 11: 2, 2: 11, 10: 3, 3: 10, 9: 4, 4: 9, 8: 5, 5: 8, 7: 6, 6: 7
      };
      const nhiHopIdx = nhiHopMap[idx];

      const getPalaceStars = (pIdx: number) => {
        const p = chartData.palaces[pIdx];
        const formatStar = (s: any) => `${s.name}${s.element ? ` [${s.element}]` : ''}${s.brightness ? ` (${s.brightness})` : ''}`;
        const major = p.majorStars.map(formatStar).join(', ');
        const minor = p.minorStars.map(formatStar).join(', ');
        const adjective = p.adjectiveStars.map(formatStar).join(', ');
        const tuanTriet = [];
        if (p.isTuan) tuanTriet.push('Tuần Không');
        if (p.isTriet) tuanTriet.push('Triệt Lộ');
        return {
          name: p.name,
          major: major || 'Vô chính diệu',
          all: [major, minor, adjective].filter(Boolean).join(', '),
          tuanTriet: tuanTriet.join(' & '),
          trangSinh: p.changsheng12
        };
      };

      const target = getPalaceStars(idx);
      const xungChieu = getPalaceStars(xungChieuIdx);
      const tamHop1 = getPalaceStars(tamHop1Idx);
      const tamHop2 = getPalaceStars(tamHop2Idx);
      const nhiHop = getPalaceStars(nhiHopIdx);

      const allPalacesStr = chartData.palaces.map((p: any) => `${p.name} (Can ${p.stem}): ` + (p.majorStars.map((s: any) => s.name).join(', ') || 'VCD')).join(' | ');

      const year = new Date().getFullYear();
      const isMenh = palace.name === 'Mệnh';

      // Tính chính xác Phi Hóa và Lưu Tứ Hóa
      const STEMS = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'];
      const mutMap: Record<string, [string, string, string, string]> = {
        'Giáp': ['Liêm Trinh', 'Phá Quân', 'Vũ Khúc', 'Thái Dương'],
        'Ất': ['Thiên Cơ', 'Thiên Lương', 'Tử Vi', 'Thái Âm'],
        'Bính': ['Thiên Đồng', 'Thiên Cơ', 'Văn Xương', 'Liêm Trinh'],
        'Đinh': ['Thái Âm', 'Thiên Đồng', 'Thiên Cơ', 'Cự Môn'],
        'Mậu': ['Tham Lang', 'Thái Âm', 'Hữu Bật', 'Thiên Cơ'],
        'Kỷ': ['Vũ Khúc', 'Tham Lang', 'Thiên Lương', 'Văn Khúc'],
        'Canh': ['Thái Dương', 'Vũ Khúc', 'Thái Âm', 'Thiên Đồng'],
        'Tân': ['Cự Môn', 'Thái Dương', 'Văn Khúc', 'Văn Xương'],
        'Nhâm': ['Thiên Lương', 'Tử Vi', 'Tả Phù', 'Vũ Khúc'],
        'Quý': ['Phá Quân', 'Cự Môn', 'Thái Âm', 'Tham Lang']
      };

      const findPalaceWithStar = (starName: string) => {
        const found = chartData.palaces.find((p: any) => 
          p.majorStars.some((s: any) => s.name === starName) || 
          p.minorStars.some((s: any) => s.name === starName) ||
          p.adjectiveStars.some((s: any) => s.name === starName) ||
          p.name === starName
        );
        return found ? found.name : 'Chưa rõ';
      };

      const pStem = palace.stem;
      const [pLoc, pQuyen, pKhoa, pKy] = mutMap[pStem] || ['','','',''];
      const phiHoaStr = mutMap[pStem] ? 
        `  - Hóa Lộc: nhập cung ${findPalaceWithStar(pLoc)} (sao ${pLoc})\n` +
        `  - Hóa Quyền: nhập cung ${findPalaceWithStar(pQuyen)} (sao ${pQuyen})\n` +
        `  - Hóa Khoa: nhập cung ${findPalaceWithStar(pKhoa)} (sao ${pKhoa})\n` +
        `  - Hóa Kỵ: nhập cung ${findPalaceWithStar(pKy)} (sao ${pKy})` : 'Không xác định';

      const baseYear = 1984; // Giáp Tý
      const diff = year - baseYear;
      const yearStemIdx = (diff % 10 + 10) % 10;
      const yearStem = STEMS[yearStemIdx];
      const [yLoc, yQuyen, yKhoa, yKy] = mutMap[yearStem] || ['','','',''];
      const luuTuHoaStr = mutMap[yearStem] ?
        `  - Lưu Hóa Lộc: sao ${yLoc} (cung ${findPalaceWithStar(yLoc)})\n` +
        `  - Lưu Hóa Quyền: sao ${yQuyen} (cung ${findPalaceWithStar(yQuyen)})\n` +
        `  - Lưu Hóa Khoa: sao ${yKhoa} (cung ${findPalaceWithStar(yKhoa)})\n` +
        `  - Lưu Hóa Kỵ: sao ${yKy} (cung ${findPalaceWithStar(yKy)})` : 'Không xác định';

      const prompt = `Bạn là chuyên gia Tử Vi Đẩu Số cao cấp. Nhiệm vụ của bạn là luận giải CHUYÊN SÂU DUY NHẤT một cung, dựa hoàn toàn vào dữ liệu được cung cấp.

---

## NGUYÊN TẮC CỐT LÕI

* Chỉ tập trung vào cung đang luận, không lan sang toàn bộ lá số.
* Bạn bắt buộc phải bám sát thứ tự: Chính tinh → Bộ sao/Cách cục → Phụ tinh → Tam hợp/Xung chiếu → Phi Hóa. Đánh giá sự pha trộn giữa Chính tinh và Phụ tinh thật chi tiết, đặc biệt hội tụ từ Tam hợp và Xung chiếu.
* **Định dạng sao**: Bắt buộc in đậm các sao kèm theo ngũ hành trong ngoặc vuông: \`**Tên Sao [Ngũ Hành]**\`. CHÚ Ý: CẤM TUYỆT ĐỐI KHÔNG lặp lại tên sao ngay sau khi đã định dạng. (Ví dụ ĐÚNG: \`**Thất Sát [Kim]** là một sao mạnh mẽ...\`. Ví dụ SAI: \`**Thất Sát [Kim]** Thất Sát là sao...\`).
* Viết câu súc tích, tránh lặp lại các từ như "sự", "như", "là" nhiều lần trong cùng một đoạn. 
* Cấm tuyệt đối: Không phân tích tương quan Mệnh - Cục nếu đây KHÔNG phải cung Mệnh.
* Không tự bịa dữ liệu. Luôn gắn với hành vi thực tế. Văn phong hiện đại, trực diện.

---

## DỮ LIỆU CUNG

* Giới tính: ${birthInfo?.gender === 'male' ? 'Nam' : 'Nữ'}
* Âm Dương Thuận/Nghịch: ${chartData.yinYang} - ${chartData.yinYangHarmony}${isMenh ? `\n* Bản Mệnh: ${chartData.menhFull} | Cục: ${chartData.fiveElementsClass}` : ''}
* Cung: ${palace.name} (tại ${palace.branch}, can ${palace.stem})
* Tràng sinh: ${target.trangSinh}
* Sao: ${target.all}
* Tuần/Triệt: ${target.tuanTriet || 'Không có'}

---

## LIÊN KẾT NGOẠI VI (Tam hợp & Xung chiếu)

* Đừng bỏ qua Phụ tinh từ các cung này, vì chúng kích phát hoặc phá ngoạn Chính tinh:
* Xung chiếu: ${xungChieu.all}
* Tam hợp: ${tamHop1.all}, ${tamHop2.all}
* Nhị hợp: ${nhiHop.all}

---

## TỨ HÓA & PHI HÓA

* Bố cục các sao toàn lá số: ${allPalacesStr}
* Phi Hóa Cung (Can ${pStem}): 
${phiHoaStr}
* GHI CHÚ: Luận giải Phi Hóa bằng ngôn ngữ ĐỜI THƯỜNG, vô cùng DỄ HIỂU (ví dụ: Hóa Kỵ sang cung Phu Thê nghĩa là mình luôn mắc nợ tình cảm hay áp đặt vợ/chồng; Hóa Lộc sang cung Tài Bạch nghĩa là khả năng tự thân kiếm tiền dồi dào). Tránh dùng quá nhiều từ Hán Việt khô khan hay lặp lại công thức rập khuôn.

---

## LƯU NIÊN ${year} (Can ${yearStem})

* Dựa vào thiên can năm ${year} là ${yearStem}, hệ thống đã tính Lưu Tứ Hóa như sau:
${luuTuHoaStr}
* Hãy sử dụng thông tin Lưu Tứ Hóa trên để luận đoán biến động, thời cơ và rủi ro của cung đang luận trong năm ${year}.

---

## NGỮ CẢNH ĐỜI SỐNG

* Tình trạng tình cảm: Chưa cung cấp (Hãy luận giải đa chiều)
* Tình trạng công việc: Chưa cung cấp (Hãy luận giải đa chiều)
* Tình trạng tài chính: Chưa cung cấp (Hãy luận giải đa chiều)

→ Khi luận phải điều chỉnh theo trạng thái này, đưa ra các khả năng thực tế.

---

## LOGIC THEO TỪNG CUNG (BẮT BUỘC ÁP DỤNG)

* Mệnh: tính cách, khí chất, người khác nhìn bạn
* Phu Thê:
  * Nếu độc thân → xu hướng yêu
  * Nếu đang yêu → cách vận hành mối quan hệ
  * Nếu kết hôn → chất lượng hôn nhân
* Quan Lộc: nghề nghiệp, môi trường, thăng tiến
* Tài Bạch: cách kiếm tiền, giữ tiền
* Thiên Di: hình ảnh xã hội, cơ hội bên ngoài
* Nô Bộc: bạn bè, network
* Tật Ách: sức khỏe, tâm lý
* Điền Trạch: tài sản, nhà cửa
* Phúc Đức: nội tâm, phúc khí
* Phụ Mẫu: quan hệ cha mẹ
* Huynh Đệ: anh em
* Tử Tức: con cái

---

## QUY TẮC ĐẶC BIỆT

* Nếu vô chính diệu:
  → Phải ghi rõ: "Cung này Vô Chính Diệu, mượn cung xung chiếu là [...] để luận"
* Nếu mâu thuẫn:
  → Ưu tiên chính tinh + phi hóa

---

## YÊU CẦU PHÂN TÍCH SÂU (SỬ DỤNG FORMAT ## CHO TITLE)

## 1. BẢN CHẤT CUNG

* Vai trò cung${isMenh ? '\n* Tương quan Mệnh - Cục (Cục sinh mệnh, Mệnh khắc cục...) và định hình cuộc đời' : ''}
* Tác động của Âm Dương Thuận/Nghịch lý lên cách hành xử ở cung này
* Mạnh/yếu

## 2. BỘ SAO & CÁCH CỤC

* Luận giải ĐẦY ĐỦ TẤT CẢ CÁC SAO (cả chính tinh và phụ tinh)
* Nhận diện bộ cách (Sát Phá Tham, Cơ Nguyệt Đồng Lương…)
* Đánh giá thực tế (tốt/xấu rõ ràng)

## 3. PHI HÓA & DÒNG CHẢY

* Lộc/Quyền/Khoa/Kỵ tác động gì
* Dẫn hướng cuộc đời ra sao

## 4. MÂU THUẪN NỘI TẠI

* Có xung đột không
* Biểu hiện ngoài đời
* Hậu quả nếu không điều chỉnh

## 5. TƯƠNG TÁC NGOẠI VI

* Tam hợp / xung chiếu hỗ trợ hay phá

## 6. BIỂU HIỆN NGOÀI ĐỜI

* Hành vi thật
* Điểm mạnh / điểm yếu

## 7. GÓC NHÌN NGƯỜI KHÁC (Thông qua lăng kính cung này)

* Người khác nhìn nhận đương số ra sao ở khía cạnh này
* Có bị hiểu sai không

## 8. LƯU NIÊN ${year}

* Năm này cung này biến động gì
* Cơ hội / rủi ro

## 9. GIẢI PHÁP & HÀNH ĐỘNG CỤ THỂ

* Giải pháp triệt để cho các vấn đề xấu / sao xấu
* Nên làm gì (rõ ràng, thực tế)
* Tránh gì

---

## OUTPUT

* Xưng "bạn"
* Văn phong như thầy Tử Vi thật
* Không sáo rỗng
* Dùng format: **Tử Vi [Thổ]**, **Thiên Cơ [Mộc]**
* Kết luận 1–2 câu sắc bén
* Ưu tiên nói điều người nghe cần, không phải muốn nghe`;

      const text = await getAICompletion(prompt);
      setPalaceInterpretations(prev => ({ ...prev, [palaceName]: text }));

      // Ghi nhận hạn mức sử dụng (Quota) sau khi luận giải thành công
      if (!isAlreadyInterpreted) {
        try {
          const { arrayUnion, updateDoc, setDoc: firestoreSetDoc } = await import('firebase/firestore');
          const userRef = doc(db, 'users', user.uid);
          await updateDoc(userRef, {
            interpretedChartIds: arrayUnion(chartId)
          });
          
          // Lưu nội dung luận giải vào Firestore để xem lại
          const interpRef = doc(db, 'users', user.uid, 'history', chartId, 'interpretations', palaceName);
          await firestoreSetDoc(interpRef, {
            text,
            generatedAt: serverTimestamp()
          });
        } catch (dbErr) {
          console.error("Lỗi cập nhật hạn mức/luận giải:", dbErr);
        }
      } else {
        // Nếu đã luận giải rồi (đã có trong Quota) nhưng chưa có trong subcollection (trường hợp cũ), vẫn nên lưu lại
        try {
          const { setDoc: firestoreSetDoc } = await import('firebase/firestore');
          const interpRef = doc(db, 'users', user.uid, 'history', chartId, 'interpretations', palaceName);
          await firestoreSetDoc(interpRef, {
            text,
            generatedAt: serverTimestamp()
          });
        } catch (dbErr) {
          console.error("Lỗi lưu lại luận giải:", dbErr);
        }
      }
    } catch (err: any) {
      console.error(err);
      const msg = err.message || 'Lỗi không xác định';
      window.dispatchEvent(new CustomEvent('app-notification', { 
        detail: { message: `Lỗi AI (${palaceName}): ${msg}`, type: 'error' } 
      }));
    } finally {
      setIsGeneratingTabAI(false);
      setInterpretingPalace(null);
    }
  };

  const generateAllInterpretations = async () => {
    if (!user) {
      window.dispatchEvent(new CustomEvent('app-notification', { 
        detail: { message: 'Đăng nhập để xem luận giải miễn phí.', type: 'info' } 
      }));
      return;
    }
    
    if (!chartData || isGeneratingTabAI) return;
    const palaces = PRIORITY_ORDER.filter(p => chartData.palaces.some((cp: any) => cp.name === p));
    for (const pName of palaces) {
      if (!palaceInterpretations[pName]) {
        await generateTabInterpretation(pName);
      }
    }
  };

  return (
    <TooltipProvider delay={300}>
      <div className="min-h-screen w-full max-w-[100vw] bg-background text-foreground selection:bg-primary/20 overflow-x-hidden font-sans">
        
        {/* Global Notifications */}
        <div className="fixed top-4 md:top-20 left-4 right-4 md:left-auto md:right-6 z-[100] flex flex-col gap-3 md:max-w-sm w-auto md:w-full">
           <AnimatePresence>
              {notifications.map(notification => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, x: 50, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 20, scale: 0.9 }}
                  className={cn(
                    "p-4 rounded-2xl shadow-2xl border flex items-start gap-4 backdrop-blur-xl",
                    notification.type === 'error' ? "bg-red-500/90 text-white border-red-400/20" : "bg-primary/90 text-white border-primary/20"
                  )}
                >
                   {notification.type === 'error' ? <ShieldAlert className="w-5 h-5 shrink-0" /> : <Info className="w-5 h-5 shrink-0" />}
                   <p className="text-sm font-bold leading-snug">{notification.message}</p>
                   <button onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))} className="ml-auto">
                      <X className="w-4 h-4 opacity-70" />
                   </button>
                </motion.div>
              ))}
           </AnimatePresence>
        </div>

        {/* Navigation Bar */}
        <nav className="fixed top-0 left-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border h-16 flex items-center px-6 justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={handleReset}>
            <span className="font-heading font-black text-2xl tracking-tighter text-primary">TỬ VI</span>
          </div>
          <div className="flex items-center gap-3">
             {!isAuthChecking && (
               user ? (
                 <div className="relative" ref={dropdownRef} onMouseEnter={() => setIsUserDropdownOpen(true)} onMouseLeave={() => setIsUserDropdownOpen(false)}>
                   <div 
                     className="flex items-center gap-2 cursor-pointer hover:bg-secondary/50 p-1.5 pr-3 rounded-full transition-colors border border-transparent hover:border-border"
                     onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                   >
                     {user.photoURL && <img src={user.photoURL} alt="Avatar" className="w-8 h-8 rounded-full border border-primary/20" />}
                     <span className="text-sm font-bold hidden md:block">{user.displayName}</span>
                   </div>
                   
                   <AnimatePresence>
                     {isUserDropdownOpen && (
                       <motion.div
                         initial={{ opacity: 0, y: 10, scale: 0.95 }}
                         animate={{ opacity: 1, y: 0, scale: 1 }}
                         exit={{ opacity: 0, y: 10, scale: 0.95 }}
                         transition={{ duration: 0.15 }}
                         className="absolute right-0 top-full mt-2 w-56 bg-popover rounded-xl border border-border shadow-lg z-[110] overflow-hidden"
                       >
                         <div className="flex flex-col space-y-1 p-3 border-b border-border/50 bg-secondary/20">
                           <p className="text-sm font-medium leading-none text-foreground">{user.displayName}</p>
                           <p className="text-xs leading-none text-muted-foreground pt-1 truncate">{user.email}</p>
                         </div>
                         <div className="p-1">
                           <button 
                             className="w-full text-left px-3 py-2 text-sm font-medium rounded-md hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer outline-none"
                             onClick={() => {
                               setView('profile');
                               setIsUserDropdownOpen(false);
                             }}
                           >
                             Xem thông tin
                           </button>
                           <button 
                             className="w-full text-left px-3 py-2 text-sm font-medium rounded-md text-red-600 hover:bg-red-50 transition-colors cursor-pointer outline-none"
                             onClick={() => {
                               auth.signOut();
                               setIsUserDropdownOpen(false);
                             }}
                           >
                             Đăng xuất
                           </button>
                         </div>
                       </motion.div>
                     )}
                   </AnimatePresence>
                 </div>
               ) : (
                 <Button onClick={handleLogin} disabled={isLoggingIn} size="sm" className="h-8 font-bold gap-2 text-[11px] bg-primary rounded-lg text-white">
                   Đăng nhập Google
                 </Button>
               )
             )}
          </div>
        </nav>

        <main className="pt-16 md:pt-16 pb-6 md:pb-12">
          <AnimatePresence mode="wait">
            {view === 'landing' && <LandingView key="landing" onStart={handleFormSubmit} historyList={historyList} user={user} />}
            {view === 'profile' && user && (
              <ProfileView 
                key="profile" 
                user={user} 
                userData={userData} 
                isAdmin={isAdmin}
                onAdminClick={() => setView('admin')}
                onBack={() => setView('landing')} 
              />
            )}
            {view === 'admin' && user && isAdmin && (
              <AdminDashboard 
                key="admin" 
                onBack={() => setView('landing')} 
              />
            )}
            {view === 'result' && chartData && (
              <>
                <ResultView 
                  key="result"
                  chartData={chartData}
                  birthInfo={birthInfo!}
                  onBack={() => setView('landing')}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  palaceInterpretations={palaceInterpretations}
                  isGenerating={isGeneratingTabAI}
                  interpretingPalace={interpretingPalace}
                  onGenerate={(pName: string) => generateTabInterpretation(pName)}
                  onGenerateAll={() => generateAllInterpretations()}
                  isSubscribed={isSubscribed}
                  onSubscribe={() => setIsSubscribed(true)}
                  onPalaceClick={(idx: number) => {
                    setSelectedPalaceIndex(idx);
                    setIsPalaceDialogOpen(true);
                  }}
                />
                
                <PalaceDetailDialog 
                  isOpen={isPalaceDialogOpen}
                  onClose={() => setIsPalaceDialogOpen(false)}
                  palace={selectedPalaceIndex !== null ? chartData.palaces[selectedPalaceIndex] : null}
                  isMenh={selectedPalaceIndex === chartData.menhIdx}
                  isThan={selectedPalaceIndex === chartData.thanIdx}
                />
              </>
            )}
          </AnimatePresence>
        </main>

        <footer className="border-t border-border mt-8 md:mt-24 py-8 md:py-12 px-6 bg-card">
          <div className="container mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="space-y-4">
               <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-background" />
                </div>
                <span className="font-heading font-bold text-lg text-foreground">SOMENH.AI</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">Nền tảng ứng dụng AI vào huyền học hàng đầu Việt Nam, giúp giải mã bản mệnh một cách khoa học và hệ thống.</p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Dịch vụ</h4>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>Lập lá số tử vi</li>
                <li>Luận giải chuyên sâu</li>
                <li>Xem hạn hàng năm</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Hỗ trợ</h4>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>Hướng dẫn sử dụng</li>
                <li>Chính sách bảo mật</li>
                <li>Liên hệ</li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-bold mb-4">Theo dõi</h4>
              <div className="flex gap-4">
                 <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-primary transition-colors cursor-pointer">
                    <Users className="w-5 h-5" />
                 </div>
                 <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-primary transition-colors cursor-pointer">
                    <MessageSquare className="w-5 h-5" />
                 </div>
              </div>
            </div>
          </div>
          <div className="container mx-auto text-center mt-12 pt-8 border-t border-border text-xs text-muted-foreground opacity-50">
            © 2026 SOMENH.AI.VN. All rights reserved.
          </div>
        </footer>
        <ScrollToTop />
      </div>
    </TooltipProvider>
  );
}

function Marquee({ children, reverse = false, pauseOnHover = true, speed = 40 }: { children: React.ReactNode, reverse?: boolean, pauseOnHover?: boolean, speed?: number }) {
  const [isPaused, setIsPaused] = useState(false);

  return (
    <div 
      className="flex w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)] cursor-pointer active:cursor-grabbing py-4"
      onMouseEnter={() => pauseOnHover && setIsPaused(true)}
      onMouseLeave={() => pauseOnHover && setIsPaused(false)}
      onTouchStart={() => pauseOnHover && setIsPaused(true)}
      onTouchEnd={() => pauseOnHover && setIsPaused(false)}
      onPointerDown={() => pauseOnHover && setIsPaused(true)}
      onPointerUp={() => pauseOnHover && setIsPaused(false)}
      style={{ '--speed': `${speed}s` } as React.CSSProperties}
    >
      <div className={cn("flex shrink-0 gap-8 min-w-full w-max", reverse ? "animate-marquee-reverse" : "animate-marquee", isPaused && "pause")}>
        {children}
        {children}
        {children}
        {children}
      </div>
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        @keyframes marquee-reverse {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0%); }
        }
        .animate-marquee {
          animation: marquee var(--speed, 40s) linear infinite;
        }
        .animate-marquee-reverse {
          animation: marquee-reverse var(--speed, 40s) linear infinite;
        }
        .pause {
          animation-play-state: paused !important;
        }
      `}</style>
    </div>
  );
}

function FAQItem({ question, answer, isOpen, onToggle }: { question: string, answer: string, isOpen: boolean, onToggle: () => void }) {
  return (
    <div className={cn(
      "border transition-all duration-500 rounded-2xl overflow-hidden bg-white shadow-sm",
      isOpen ? "border-primary/20 shadow-lg shadow-primary/5" : "border-slate-100 hover:border-slate-200"
    )}>
      <button 
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-3 md:p-4 text-left group"
      >
        <span className="flex-1 font-bold text-slate-800 text-[13px] md:text-[14px] pr-2 tracking-tight leading-snug">
          {question}
        </span>
        <div className={cn(
          "shrink-0 w-7 h-7 rounded-full bg-slate-50 flex items-center justify-center transition-all duration-500 text-slate-400",
          isOpen ? "bg-primary/10 text-primary rotate-180" : ""
        )}>
          <ChevronDown className="w-3.5 h-3.5" />
        </div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-3 md:px-4 pb-4 pt-0 text-slate-500 text-[12px] md:text-[13px] font-medium leading-relaxed">
              <div className="pt-3 border-t border-slate-50">
                {answer}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function LandingView({ onStart, historyList = [], user }: { onStart: (data: any, isFromHistory?: boolean) => void, historyList?: any[], user: FirebaseUser | null }) {
  const [openFAQIndex, setOpenFAQIndex] = useState<number | null>(null);
  const handleTemplateClick = (type: 'doanh_nhan' | 'hong_nhan') => {
    if (type === 'doanh_nhan') {
      const solarDate = new Date(2003, 0, 10); // Tháng là 0-indexed (0 = tháng 1)
      onStart({
        name: "Trương Đức Hùng Sơn",
        gender: "male",
        solarDate,
        hour: 20,
        minute: 30,
        isLunar: false,
        isLeap: false
      });
    } else {
      // Nữ hồng nhan
      const solarDate = new Date(1998, 7, 15); // Tháng 8 = index 7
      onStart({
        name: "Nguyễn Lê Quỳnh Nga",
        gender: "female",
        solarDate,
        hour: 6,
        minute: 15,
        isLunar: false,
        isLeap: false
      });
    }
  };

  const applicationAreas = [
    { icon: Briefcase, title: "Công danh & Sự nghiệp", color: "text-amber-700", bg: "bg-amber-50" },
    { icon: Coins, title: "Tài lộc & Tiền bạc", color: "text-orange-600", bg: "bg-orange-50" },
    { icon: Heart, title: "Tình duyên & Hôn nhân", color: "text-pink-500", bg: "bg-pink-50" },
    { icon: Activity, title: "Sức khỏe & Thọ yểu", color: "text-purple-600", bg: "bg-purple-50" },
    { icon: Home, title: "Phúc đức & Gia đạo", color: "text-red-500", bg: "bg-red-50" },
    { icon: Baby, title: "Con cái & Hậu vận", color: "text-yellow-600", bg: "bg-yellow-50" },
    { icon: Handshake, title: "Quý nhân & Tiểu nhân", color: "text-amber-500", bg: "bg-amber-50" },
    { icon: Calendar, title: "Đại vận 10 năm", color: "text-indigo-600", bg: "bg-indigo-50" },
    { icon: Star, title: "Lưu niên & Thái tuế", color: "text-yellow-500", bg: "bg-yellow-50" },
    { icon: Shield, title: "Hóa giải hung tinh", color: "text-emerald-500", bg: "bg-emerald-50" },
    { icon: Target, title: "Ngành nghề phù hợp", color: "text-rose-500", bg: "bg-rose-50" },
    { icon: Compass, title: "Phong thủy & Hướng tốt", color: "text-amber-800", bg: "bg-amber-50" },
    { icon: Brain, title: "Tính cách & Tâm lý", color: "text-pink-400", bg: "bg-pink-50" },
    { icon: Users2, title: "Huynh đệ & Bạn bè", color: "text-slate-700", bg: "bg-slate-50" },
    { icon: Plane, title: "Di chuyển & Xuất ngoại", color: "text-emerald-500", bg: "bg-emerald-50" },
    { icon: Trees, title: "Điền trạch & Bất động sản", color: "text-green-600", bg: "bg-green-50" },
  ];

  const testimonials = [
    {
      name: "Nguyễn Sơn Lâm",
      role: "Kỹ sư",
      age: 31,
      content: "Ban đầu mình hơi nghi ngờ về AI xem Tử Vi, nhưng kết quả làm mình bất ngờ. Đặc biệt là phần luận giải về tính cách và tiềm năng nghề nghiệp.",
      avatar: "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Lam"
    },
    {
      name: "BS. Vũ Ngọc Anh",
      role: "Bác sĩ chuyên khoa 2",
      age: 36,
      content: "Là người làm y khoa nhiều năm, tôi vốn rất thận trọng với các ứng dụng xem Tử Vi. Nhưng SOMENH.AI.VN đã khiến tôi thay đổi suy nghĩ. Phần luận giải về sức khỏe và vận hạn y khoa trong lá số cực kỳ tinh tế.",
      avatar: "https://api.dicebear.com/7.x/fun-emoji/svg?seed=DocAnh"
    },
    {
      name: "Triệu Vân Như Nguyệt",
      role: "Nhân viên văn phòng",
      age: 28,
      content: "Mình đã thử nhiều trang tử vi nhưng SOMENH.AI.VN thực sự khác biệt. Phần luận giải về cung Phu Thê cực kỳ chi tiết và đúng với hoàn cảnh hiện tại của mình. Rất đáng thử!",
      avatar: "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Nguyet"
    },
    {
      name: "Đào Phương Bắc",
      role: "Kinh doanh tự do",
      age: 35,
      content: "Công nghệ AI phân tích nhanh nhưng vẫn giữ được cái 'chất' của tử vi truyền thống. Phần dự đoán vận hạn năm nay giúp tôi có kế hoạch đầu tư cẩn trọng hơn.",
      avatar: "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Bac"
    },
    {
      name: "Đồng Hải Đăng",
      role: "Chuyên gia AI",
      age: 39,
      content: "Tôi đánh giá rất cao thuật toán xử lý lá số tử vi của SOMENH.AI.VN. Độ chính xác trong việc cá nhân hóa luận giải là một bước tiến đáng kể.",
      avatar: "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Dang"
    },
    {
      name: "Luật sư Kim Dung",
      role: "Luật sư",
      age: 45,
      content: "Trong công việc đòi hỏi sự tỉnh táo, tôi dùng SOMENH.AI.VN để tham khảo thêm về các mối quan hệ đối tác. Rất đáng giá cho lãnh đạo.",
      avatar: "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Dung"
    },
    {
      name: "Trần Thế Vinh",
      role: "Sinh viên năm cuối",
      age: 22,
      content: "AI tư vấn chọn nghề nghiệp rất sát với đam mê của mình. Nhờ lá số mà mình có thêm tự tin để theo đuổi con đường lập trình chuyên nghiệp.",
      avatar: "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Vinh"
    },
    {
      name: "Phạm Mỹ Linh",
      role: "Chủ shop thời trang",
      age: 29,
      content: "Hạn tháng và hạn năm của SOMENH.AI rất chính xác. Những lúc khó khăn, lời khuyên từ AI giúp mình bình tâm và đưa ra những quyết định đúng đắn.",
      avatar: "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Linh"
    },
    {
      name: "Lê Hữu Đạt",
      role: "Môi giới BĐS",
      age: 33,
      content: "Cung Điền Trạch giải đáp rất hay về lộc đất đai. AI cũng chỉ cho mình những năm nào nên cẩn trọng, năm nào nên tấn công mạnh mẽ.",
      avatar: "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Dat"
    },
    {
      name: "Hoàng Thanh Thảo",
      role: "Nội trợ",
      age: 42,
      content: "Tôi xem cho cả gia đình. AI luận giải về con cái và gia đạo rất ấm áp, giúp tôi hiểu và chia sẻ với các thành viên trong gia đình tốt hơn.",
      avatar: "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Thao"
    },
    {
      name: "Bùi Quốc Anh",
      role: "Content Creator",
      age: 26,
      content: "Giao diện đẹp, luận giải lại bằng ngôn ngữ rất trẻ trung và dễ tiếp cận. Mình đã giới thiệu cho rất nhiều bạn bè cùng trải nghiệm.",
      avatar: "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Anh"
    },
    {
      name: "Ngô Thị Thu",
      role: "Giáo viên",
      age: 38,
      content: "Sự kết hợp giữa AI và Tử Vi thật sự kỳ diệu. Không cần phải chờ đợi thầy luận giải, chỉ cần vài giây là có ngay kết quả chi tiết.",
      avatar: "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Thu"
    },
    {
      name: "Đặng Văn Hùng",
      role: "Kiến trúc sư",
      age: 44,
      content: "Lá số chi tiết đến không ngờ. Đặc biệt là phần tư vấn về Điền Trạch và phương hướng xây dựng sự nghiệp.",
      avatar: "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Hung"
    },
    {
      name: "Sơn Tùng",
      role: "Nghệ sĩ trẻ",
      age: 27,
      content: "Mình rất thích cách AI phân tích cung Phúc Đức. Nó truyền cho mình nhiều cảm hứng sáng tạo hơn.",
      avatar: "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Tung"
    },
    {
      name: "Tô Mỹ Hạnh",
      role: "HR Manager",
      age: 34,
      content: "Sử dụng SOMENH.AI giúp mình hiểu thêm về tiềm năng của nhân sự qua góc nhìn tử vi ứng dụng. Rất thú vị!",
      avatar: "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Hanh"
    },
    {
      name: "Lý Gia Kiệt",
      role: "Nhà đầu tư F0",
      age: 25,
      content: "Dự đoán vận hạn năm giúp mình tỉnh táo hơn trong các quyết định tài chính mạo hiểm.",
      avatar: "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Kiet"
    },
    {
      name: "Phượng Chanel",
      role: "Kinh doanh mỹ phẩm",
      age: 32,
      content: "AI luận giải cung Nô Bộc rất sát, giúp mình biết chọn lọc cộng sự trung thành để phát triển kinh doanh.",
      avatar: "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Phuong"
    },
    {
      name: "Võ Hoàng Yến",
      role: "Model",
      age: 30,
      content: "Cung Thiên Di cho mình những lời khuyên tuyệt vời về việc xuất ngoại và phát triển sự nghiệp ở xa.",
      avatar: "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Yen"
    },
    {
      name: "Trọng Hiếu",
      role: "Chuyên gia thể hình",
      age: 28,
      content: "Phần luận về Tật Ách nhắc nhở mình về sức khỏe rất đúng lúc. Cảm ơn AI rất nhiều!",
      avatar: "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Hieu"
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="container mx-auto px-4 md:px-6 py-8 md:py-12"
    >
      <div className="relative">
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-primary/20 rounded-full blur-[120px] -z-10 animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[128px] -z-10" />

        <div className="grid lg:grid-cols-2 gap-8 items-start w-full">
          {/* Left side: Hero */}
          <section className="space-y-6 min-w-0 w-full">
            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-[10px] font-bold tracking-[0.15em] uppercase"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Khám phá vận mệnh của bạn
            </motion.div>
            
            <div className="space-y-4">
              <h1 className="text-3xl md:text-5xl font-heading font-extrabold text-foreground tracking-tight uppercase leading-[1.1]">
                Từ Tinh Tú <br />
                <span className="text-primary italic">Ngàn Xưa</span> <br />
                <span className="text-foreground">Đến AI Hôm Nay!</span>
              </h1>
              <p className="text-xs md:text-base text-slate-600 max-w-md leading-relaxed font-medium">
                Kết hợp tinh hoa <span className="text-primary font-bold underline decoration-primary/30 underline-offset-4">Tử Vi Đẩu Số</span> và sức mạnh <span className="text-primary font-bold underline decoration-primary/30 underline-offset-4">Trí Tuệ Nhân Tạo</span> để mang đến lời giải đoán chi tiết, khách quan và sâu sắc.
              </p>
            </div>

            <div className="bg-white/40 backdrop-blur-sm p-4 md:py-6 md:pr-6 md:pl-6 rounded-[36px] border border-slate-200/50 shadow-xl shadow-slate-100/50 space-y-6">
               <div className="flex items-center justify-between">
                  <h3 className="font-medium text-slate-400 uppercase tracking-widest text-[10px]">Thư viện mẫu tham khảo</h3>
                  <div className="flex gap-1 pr-0 md:pr-6">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/20" />
                  </div>
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
                  <Button onClick={() => handleTemplateClick('doanh_nhan')} variant="secondary" className="rounded-2xl gap-2 md:gap-2.5 bg-white border border-slate-100 hover:border-primary/30 hover:bg-primary/5 text-slate-700 transition-all shadow-sm justify-start px-4">
                    <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary"><User className="w-3.5 h-3.5" /></div> 
                    <span className="text-sm font-medium">Lá số Doanh nhân</span>
                  </Button>
                  <Button onClick={() => handleTemplateClick('hong_nhan')} variant="secondary" className="rounded-2xl gap-2 md:gap-2.5 bg-white border border-slate-100 hover:border-pink-300 hover:bg-pink-50 text-slate-700 transition-all shadow-sm justify-start px-4">
                    <div className="w-6 h-6 rounded-lg bg-pink-100 flex items-center justify-center text-pink-600"><Heart className="w-3.5 h-3.5" /></div> 
                    <span className="text-sm font-medium">Lá số Nữ Hồng nhan</span>
                  </Button>
               </div>
               <div className="pt-4 md:pt-6 border-t border-slate-200/50 flex flex-wrap gap-4 items-center justify-between md:pr-6">
                  <div className="flex flex-wrap gap-3 md:gap-6 text-[10px] md:text-[11px] font-bold text-slate-400">
                    <span onClick={() => window.open('https://www.facebook.com/son.hung.1848816', '_blank')} className="hover:text-primary transition-all cursor-pointer flex items-center gap-2">FACEBOOK</span>
                    <span onClick={() => window.open('https://s.shopee.vn/3qJOnuHnAJ', '_blank')} className="hover:text-primary transition-all cursor-pointer flex items-center gap-2">TIKTOK</span>
                    <span onClick={() => window.open('https://zalo.me/0363716797', '_blank')} className="hover:text-primary transition-all cursor-pointer flex items-center gap-2">ZALO</span>
                  </div>
                  <div className="flex -space-x-2">
                    {[1,2,3].map(i => (
                      <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-200 overflow-hidden">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`} alt="user" className="w-full h-full object-cover" />
                      </div>
                    ))}
                    <div className="w-6 h-6 rounded-full border-2 border-white bg-primary text-[8px] font-black flex items-center justify-center text-white">10K+</div>
                  </div>
               </div>
            </div>
          </section>

          {/* Right side: Form & History */}
            <div className="flex flex-col gap-6 w-full min-w-0">
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="relative"
              >
                <AstrologyForm onSubmit={onStart} />
              </motion.div>

              {user && historyList.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white rounded-[6px] p-4 md:p-5 border border-border shadow-2xl max-w-2xl mx-auto w-full flex flex-col gap-3 overflow-hidden min-w-0"
                >
                  <div className="flex items-center gap-2 text-primary font-bold text-[13px] uppercase tracking-wider mb-1 px-1">
                    <Calendar className="w-4 h-4" /> Lịch sử lá số
                  </div>
                  <div className="flex gap-2.5 md:gap-3 overflow-x-auto invisible-scrollbar pb-2 snap-x px-1">
                    {historyList.map(h => (
                      <div 
                        key={h.id} 
                        onClick={() => onStart({
                          name: h.name,
                          gender: h.gender,
                          solarDate: new Date(h.solarDateTimestamp),
                          hour: h.hour,
                          minute: h.minute,
                          isLunar: h.isLunar,
                          isLeap: h.isLeap
                        }, true)}
                        className="shrink-0 w-[165px] md:w-[180px] snap-center bg-secondary/50 rounded-[6px] p-3 border border-border/50 hover:bg-primary/5 hover:border-primary/30 transition-colors cursor-pointer text-left group"
                      >
                        <h4 className="font-bold text-sm text-foreground truncate group-hover:text-primary transition-colors">{h.name}</h4>
                        <p className="text-[10px] md:text-[11px] text-muted-foreground mt-1">
                          {new Date(h.solarDateTimestamp).toLocaleDateString('vi-VN')} • {h.hour}h{h.minute}
                        </p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
        </div>
      </div>

      {/* SECTION: Tử Vi Ứng Dụng (Grid) */}
      <section className="mt-12 md:mt-24 mb-10 md:mb-20 space-y-6 md:space-y-10">
        <div className="text-center space-y-3 px-4 max-w-3xl mx-auto">
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[8px] font-black uppercase tracking-widest"
          >
            Lĩnh vực ứng dụng
          </motion.div>
          <h2 className="text-2xl md:text-3xl font-heading font-black text-foreground tracking-tight uppercase leading-tight">
            Giải mã cuộc đời <br />
            <span className="text-primary italic">toàn diện & sâu sắc</span>
          </h2>
          <p className="text-slate-500 text-[11px] md:text-xs max-w-2xl mx-auto leading-relaxed">
            Hệ thống phân tích đồng thời 12 cung mệnh và hàng trăm bộ sao, mang đến cái nhìn đa chiều về mọi khía cạnh trong hành trình của bạn.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-2.5 md:gap-3 max-w-5xl mx-auto px-4">
          {applicationAreas.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05 }}
              className="flex items-center gap-2.5 md:gap-3 p-2.5 md:p-3 rounded-[20px] md:rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-primary/20 transition-all cursor-default group"
            >
              <div className={cn("w-8 h-8 rounded-[12px] flex items-center justify-center shrink-0 transition-transform group-hover:scale-110", item.bg)}>
                <item.icon className={cn("w-4 h-4", item.color)} />
              </div>
              <span className="text-[11px] md:text-[11px] font-semibold text-slate-700 leading-snug">{item.title}</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* SECTION: Testimonials (2 Marquee Rows) */}
      <section className="mt-12 md:mt-24 mb-10 md:mb-20 space-y-6 md:space-y-10 overflow-hidden bg-secondary py-12 md:py-16 -mx-6">
        <div className="text-center space-y-3 px-6 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[8px] font-black uppercase tracking-widest">
            Phản hồi thực tế
          </div>
          <h2 className="text-2xl md:text-3xl font-heading font-black text-slate-900 tracking-tight uppercase leading-tight">
            Người dùng nói gì <br />
            <span className="text-primary italic">về Tử Vi AI</span>?
          </h2>
          <p className="text-slate-500 text-[11px] md:text-xs font-medium">
            Hàng ngàn người đã tìm thấy định hướng và câu trả lời cho những băn khoăn trong cuộc sống.
          </p>
        </div>

        <div className="space-y-4" style={{'--speed': '80s'} as any}>
          <Marquee speed={80} pauseOnHover>
            {testimonials.slice(0, 10).map((t, idx) => (
              <div
                key={idx}
                className="bg-white p-5 rounded-3xl border border-border shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col gap-4 w-[280px] md:w-[320px] shrink-0 hover:border-primary/20 transition-colors group relative"
              >
                <Quote className="w-6 h-6 text-muted absolute top-5 right-5 group-hover:text-primary/5 transition-colors" />
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-muted overflow-hidden shrink-0 border border-border">
                     <img src={t.avatar} alt={t.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                  </div>
                  <div>
                     <h4 className="text-[13px] font-bold text-foreground leading-tight">{t.name}</h4>
                     <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mt-0.5">{t.role}</p>
                  </div>
                </div>
                <p className="text-[12px] text-slate-600 leading-relaxed font-medium italic">
                  "{t.content}"
                </p>
                <div className="flex items-center justify-between mt-auto pt-3 border-t border-border">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <span className="text-[10px] font-semibold text-muted-foreground">{t.age} tuổi</span>
                </div>
              </div>
            ))}
          </Marquee>

          <Marquee speed={90} reverse pauseOnHover>
            {testimonials.slice(10).map((t, idx) => (
              <div
                key={idx}
                className="bg-white p-5 rounded-3xl border border-border shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col gap-4 w-[280px] md:w-[320px] shrink-0 hover:border-primary/20 transition-colors group relative"
              >
                <Quote className="w-6 h-6 text-muted absolute top-5 right-5 group-hover:text-primary/5 transition-colors" />
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-muted overflow-hidden shrink-0 border border-border">
                     <img src={t.avatar} alt={t.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                  </div>
                  <div>
                     <h4 className="text-[13px] font-bold text-foreground leading-tight">{t.name}</h4>
                     <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mt-0.5">{t.role}</p>
                  </div>
                </div>
                <p className="text-[12px] text-slate-600 leading-relaxed font-medium italic">
                  "{t.content}"
                </p>
                <div className="flex items-center justify-between mt-auto pt-3 border-t border-border">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <span className="text-[10px] font-semibold text-muted-foreground">{t.age} tuổi</span>
                </div>
              </div>
            ))}
          </Marquee>
        </div>
      </section>

      {/* POLISHED SECTION: Quy Trình Hoạt Động (MOVED TO BOTTOM) */}
      <section className="mt-20 mb-20 relative bg-secondary py-16 -mx-6">
        {/* Background Decoration */}
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] opacity-20" />
        </div>

        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold tracking-[0.1em] uppercase mb-2"
            >
               <Zap className="w-3 h-3" /> Chỉ 30 giây để bắt đầu
            </motion.div>
            <h2 className="text-3xl md:text-4xl font-heading font-black text-slate-900 tracking-tight uppercase leading-tight">
              Lộ trình giải mã <br />
              <span className="text-primary italic">vận mệnh của bạn</span>
            </h2>
            <p className="text-slate-500 text-sm md:text-base max-w-2xl mx-auto font-medium leading-relaxed">
              Trải nghiệm hành trình khám phá bản thân qua 4 bước đơn giản, khoa học và hoàn toàn tự động với sức mạnh từ AI.
            </p>
          </div>

          <div className="relative max-w-5xl mx-auto">
            {/* Desktop Path Line - Fixed alignment */}
            <div className="absolute top-[42px] left-0 w-full h-[1px] hidden md:block z-0">
               <div className="w-full h-full border-t border-dashed border-slate-200" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-6 relative z-10">
              {[
                { 
                  step: "01", 
                  icon: User, 
                  title: "Nhập Thông Tin", 
                  desc: "Nhập ngày giờ sinh và giới tính của bạn một cách chính xác nhất.",
                  color: "text-blue-600",
                  bg: "bg-blue-50",
                },
                { 
                  step: "02", 
                  icon: Brain, 
                  title: "AI Phân Tích", 
                  desc: "Thuật toán xử lý hàng ngàn dữ liệu để lập lá số và giải mã chi tiết.",
                  color: "text-purple-600",
                  bg: "bg-purple-50",
                },
                { 
                  step: "03", 
                  icon: FileText, 
                  title: "Nhận Kết Quả", 
                  desc: "Khám phá 12 cung mệnh, vận hạn năm và lời khuyên phong thủy.",
                  color: "text-pink-600",
                  bg: "bg-pink-50",
                },
                { 
                  step: "04", 
                  icon: MessageSquare, 
                  title: "Tư Vấn Chuyên Sâu", 
                  desc: "Chat trực tiếp với AI để giải đáp mọi thắc mắc về lá số cá nhân.",
                  color: "text-primary",
                  bg: "bg-blue-50",
                }
              ].map((item, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1, duration: 0.5 }}
                  className="flex flex-col items-center text-center group"
                >
                  <div className="relative mb-6">
                    <div className={cn(
                      "relative z-10 w-[84px] h-[84px] rounded-[24px] flex items-center justify-center transition-all duration-500 group-hover:scale-105 shadow-md bg-white border border-slate-50", 
                      item.color
                    )}>
                      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", item.bg)}>
                        <item.icon className="w-6 h-6" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2 px-2">
                    <h4 className={cn("text-[15px] font-black uppercase tracking-tight", item.color)}>{item.title}</h4>
                    <p className="text-[12px] text-slate-500 leading-relaxed font-medium">{item.desc}</p>
                  </div>
                  
                  {idx < 3 && (
                    <div className="md:hidden w-[1px] h-8 border-l border-dashed border-slate-200 my-4 mx-auto" />
                  )}
                </motion.div>
              ))}
            </div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="mt-16 text-center"
            >
               <Button 
                 onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                 className="bg-primary hover:bg-primary-hover text-white rounded-[20px] px-10 py-6 text-lg font-black uppercase tracking-[0.05em] shadow-[0_15px_35px_rgba(16,185,129,0.25)] hover:translate-y-[-4px] active:translate-y-[0px] transition-all"
               >
                 BẮT ĐẦU NGAY <ArrowRight className="w-5 h-5 ml-2" />
               </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* NEW SECTION: FAQ (Accordion) */}
      <section className="mt-16 md:mt-20 mb-0 relative">
        <div className="container mx-auto px-6 max-w-3xl">
           <div className="text-center space-y-3 mb-12">
              <h2 className="text-2xl md:text-3xl font-heading font-black text-[#7C3AED] tracking-tight uppercase">
                Câu hỏi thường được quan tâm
              </h2>
              <p className="text-slate-500 text-xs md:text-sm font-medium">
                Giải đáp những thắc mắc phổ biến giúp bạn hiểu rõ hơn về cách SOMENH.AI.VN hoạt động.
              </p>
           </div>

           <div className="flex flex-col gap-4 max-w-2xl mx-auto">
              {[
                { q: "Trò chuyện AI có tốn xu không?", a: "Hệ thống sử dụng xu để duy trì và phát triển AI chi phí cao. Tuy nhiên bạn có thể nhận xu miễn phí mỗi ngày qua các hoạt động trên hệ thống." },
                { q: "Thông tin cá nhân của tôi có được bảo mật không?", a: "Tuyệt đối bảo mật. Dữ liệu của bạn được mã hóa và chỉ sử dụng cho mục đích lập lá số, không bao giờ chia sẻ cho bên thứ ba." },
                { q: "Tôi có cần mua toàn bộ phần luận giải không?", a: "Không, bạn có toàn quyền lựa chọn mở khóa từng cung hoặc từng chủ đề mà bạn quan tâm nhất để tối ưu chi phí." },
                { q: "Nên bắt đầu sử dụng thế nào nếu chưa biết nhiều về Tử Vi?", a: "Bạn chỉ cần nhập đúng ngày giờ sinh, AI sẽ tự động lập lá số và đưa ra các lời giải bằng ngôn ngữ hiện đại, dễ hiểu nhất cho bất kỳ ai." },
              ].map((item, idx) => (
                <FAQItem 
                  key={idx} 
                  question={item.q} 
                  answer={item.a} 
                  isOpen={openFAQIndex === idx}
                  onToggle={() => setOpenFAQIndex(openFAQIndex === idx ? null : idx)}
                />
              ))}
           </div>
        </div>
      </section>
    </motion.div>
  );
}

function AdminDashboard({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<'users' | 'alerts'>('users');
  const [users, setUsers] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [keyStats, setKeyStats] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isAlertsLoading, setIsAlertsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [editRank, setEditRank] = useState('');
  const [editQuota, setEditQuota] = useState(2);
  const [isUpdating, setIsUpdating] = useState(false);

  const notify = (message: string, type: 'error' | 'success' | 'info' = 'error') => {
    window.dispatchEvent(new CustomEvent('app-notification', { 
      detail: { message, type } 
    }));
  };

  const fetchKeyStats = async () => {
    try {
      const { collection, getDocs } = await import('firebase/firestore');
      const snap = await getDocs(collection(db, 'api_key_usage'));
      const stats: Record<string, any> = {};
      snap.forEach(d => { stats[d.id] = d.data(); });
      setKeyStats(stats);
    } catch (err) {
      console.error("Lỗi fetch key stats:", err);
    }
  };

  const fetchAlerts = async () => {
    setIsAlertsLoading(true);
    try {
      const { collection, getDocs, query, orderBy } = await import('firebase/firestore');
      const q = query(collection(db, 'admin_alerts'), orderBy('timestamp', 'desc'));
      const snapshot = await getDocs(q);
      setAlerts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      fetchKeyStats();
    } catch (error) {
      console.error("Error fetching admin alerts:", error);
    } finally {
      setIsAlertsLoading(false);
    }
  };

  useEffect(() => {
    let unsubscribeUsers: (() => void) | undefined;
    if (activeTab === 'users') {
      setIsLoading(true);
      const setupRealtimeUsers = async () => {
        try {
          const { collection, query, orderBy, onSnapshot } = await import('firebase/firestore');
          const q = query(collection(db, 'users'), orderBy('lastLoginAt', 'desc'));
          unsubscribeUsers = onSnapshot(q, (snapshot) => {
            const usersData = snapshot.docs
              .map(doc => ({ id: doc.id, ...doc.data() } as any))
              .filter(u => u.email !== ADMIN_EMAIL);
            setUsers(usersData);
            setIsLoading(false);
          }, (err) => {
            console.error("Lỗi onSnapshot users:", err);
            setIsLoading(false);
          });
        } catch (err) {
          console.error(err);
        }
      };
      setupRealtimeUsers();
    } else if (activeTab === 'alerts') {
      fetchAlerts();
    }
    return () => {
      if (unsubscribeUsers) unsubscribeUsers();
    }
  }, [activeTab]);

  const handleUpdateUserDetails = async () => {
    if (!selectedUser) return;
    setIsUpdating(true);
    try {
      const { doc, updateDoc } = await import('firebase/firestore');
      await updateDoc(doc(db, 'users', selectedUser.uid), {
        rank: editRank,
        customQuotaLimit: Number(editQuota)
      });
      notify('Cập nhật thông tin thành công', 'success');
      setIsDetailOpen(false);
    } catch (error) {
      console.error("Error updating user details:", error);
      notify('Lỗi khi cập nhật thông tin');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa người dùng này? Thao tác này không thể hoàn tác.')) return;
    try {
      const { doc, deleteDoc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'users', userId));
      notify('Đã xóa người dùng thành công', 'info');
      setIsDetailOpen(false);
    } catch (error) {
      console.error("Error deleting user:", error);
      notify('Lỗi khi xóa người dùng');
    }
  };

  const handleResetQuota = async (userId: string) => {
    if (!window.confirm('Đặt lại hạn mức (Quota) cho người dùng này?')) return;
    try {
      const { doc, updateDoc } = await import('firebase/firestore');
      await updateDoc(doc(db, 'users', userId), {
        interpretedChartIds: []
      });
      notify('Đã đặt lại hạn mức thành công', 'success');
      if (selectedUser?.uid === userId) {
        setSelectedUser({ ...selectedUser, interpretedChartIds: [] });
      }
    } catch (error) {
      console.error("Error resetting quota:", error);
      notify('Lỗi khi đặt lại hạn mức');
    }
  };

  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;
  
  const filteredUsers = users.filter(u => 
    (u.email?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (u.displayName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (u.uid?.includes(searchTerm))
  );

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage
  );
  
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const keysInfo = useMemo(() => getAvailableApiKeysInfo(), []);

  const handleResolveAlert = async (alertId: string, currentState: boolean) => {
    try {
      const { doc, updateDoc } = await import('firebase/firestore');
      await updateDoc(doc(db, 'admin_alerts', alertId), {
        resolved: !currentState
      });
      notify('Đã cập nhật trạng thái', 'success');
      fetchAlerts();
    } catch (error) {
      console.error("Error updating alert:", error);
      notify('Lỗi cập nhật trạng thái', 'error');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto px-4 max-w-6xl py-8"
    >
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack} className="h-8 text-slate-500 hover:text-primary">
            <ChevronLeft className="w-4 h-4 mr-1" /> Quay lại
          </Button>
          <h1 className="text-2xl font-black flex items-center gap-2 tracking-tight">
            <Shield className="w-6 h-6 text-primary" /> QUẢN TRỊ HỆ THỐNG
          </h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Tổng Users</p>
            <p className="text-xl font-black text-primary leading-none">{users.length}</p>
          </div>
          <Button onClick={() => activeTab === 'alerts' ? fetchAlerts() : null} size="icon" variant="outline" className="rounded-xl h-10 w-10 border-border hover:bg-slate-50">
            <Activity className={cn("w-5 h-5", isAlertsLoading ? "animate-spin text-primary" : "text-slate-400")} />
          </Button>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <Button 
          variant={activeTab === 'users' ? 'default' : 'outline'}
          onClick={() => setActiveTab('users')}
          className={cn("rounded-xl font-bold", activeTab === 'users' ? "bg-primary text-white" : "border-border")}
        >
          <Users className="w-4 h-4 mr-2" />
          Người dùng
        </Button>
        <Button 
          variant={activeTab === 'alerts' ? 'default' : 'outline'}
          onClick={() => setActiveTab('alerts')}
          className={cn("rounded-xl font-bold relative", activeTab === 'alerts' ? "bg-red-500 hover:bg-red-600 text-white border-red-500" : "border-border")}
        >
          <ShieldAlert className="w-4 h-4 mr-2" />
          Giám sát tài nguyên AI
          {alerts.filter(a => !a.resolved).length > 0 && (
            <span className="absolute -top-2 -right-2 w-5 h-5 bg-white text-red-600 border-2 border-red-500 rounded-full text-[10px] flex items-center justify-center font-black animate-bounce shadow-sm">
              {alerts.filter(a => !a.resolved).length}
            </span>
          )}
        </Button>
      </div>

      {activeTab === 'alerts' && (
        <div className="mb-6 bg-white p-6 rounded-3xl border border-border shadow-sm">
          <h3 className="text-sm font-bold flex items-center gap-2 mb-4 text-foreground/80"><Key className="w-4 h-4 text-primary" /> API KEYS ĐANG HOẠT ĐỘNG ({keysInfo.length})</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {keysInfo.map(k => {
              const stats = keyStats[k.id] || { totalUses: 0, dailyUses: {} };
              const todayStr = new Date().toISOString().split('T')[0];
              const todayUses = stats.dailyUses?.[todayStr] || 0;
              return (
                <div key={k.id} className="flex flex-col p-3 rounded-2xl bg-secondary/20 border border-border shadow-sm">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-black tracking-widest uppercase text-slate-500">{k.provider}</span>
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  </div>
                  <span className="text-xs font-bold text-foreground mb-1 truncate" title={k.id}>{k.id.replace('VITE_', '')}</span>
                  <code className="text-[10px] text-slate-400 bg-white px-2 py-1 rounded-lg border border-border flex items-center mt-1">
                    {k.masked}
                  </code>
                  <div className="mt-3 pt-3 border-t border-border flex justify-between items-center text-[10px] uppercase tracking-widest font-bold">
                    <div className="flex flex-col text-slate-500">
                      <span>Hôm nay</span>
                      <span className={cn("text-sm", todayUses > 1000 ? "text-red-500" : "text-emerald-600")}>{todayUses}</span>
                    </div>
                    <div className="flex flex-col text-right text-slate-500">
                      <span>Tổng cộng</span>
                      <span className="text-sm text-foreground">{stats.totalUses}</span>
                    </div>
                  </div>
                </div>
              );
            })}
            {keysInfo.length === 0 && (
              <div className="col-span-full p-4 rounded-2xl bg-red-50 border border-red-100 flex items-center gap-3">
                <ShieldAlert className="w-5 h-5 text-red-500" />
                <p className="text-sm font-bold text-red-600">Chưa có API Key (Gemini/OpenRouter) nào được cấu hình trong Hệ thống!</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-border shadow-xl overflow-hidden">
        {activeTab === 'users' ? (
          <>
          <div className="p-6 border-b border-border bg-secondary/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Tìm kiếm Email, Tên hoặc UID..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground bg-white px-3 py-1.5 rounded-full border border-border/50">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="tracking-tight uppercase">Dữ liệu trực tiếp từ Firestore</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-secondary/5 border-b border-border">
                <th className="px-6 py-4 text-[10px] font-black uppercase text-muted-foreground tracking-widest">Người dùng</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-muted-foreground tracking-widest">Email / Quyền</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-muted-foreground tracking-widest text-center">Hạn mức (Quota)</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-muted-foreground tracking-widest">Đăng nhập cuối</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-muted-foreground tracking-widest text-right">Quản lý</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {isLoading && users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
                    <p className="font-bold text-sm tracking-tight uppercase">Đang đồng bộ dữ liệu...</p>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground font-medium">Không tìm thấy bản ghi nào khớp với nội dung tìm kiếm.</td>
                </tr>
              ) : (
                paginatedUsers.map((u) => {
                  const isOnlineNow = u.isOnline && u.lastActiveAt && (Date.now() - u.lastActiveAt.toMillis() < 5 * 60 * 1000);
                  return (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          {u.photoURL ? (
                            <img src={u.photoURL} className="w-10 h-10 rounded-2xl border border-border object-cover" alt="" />
                          ) : (
                            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-sm border border-primary/20 capitalize">
                              {u.displayName?.[0] || 'U'}
                            </div>
                          )}
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-sm border border-border" title={isOnlineNow ? "Đang Online (Trực tuyến)" : "Offline"}>
                             <div className={cn("w-2 h-2 rounded-full", isOnlineNow ? "bg-green-500 animate-pulse" : "bg-slate-300")} />
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-black text-foreground leading-tight group-hover:text-primary transition-colors">{u.displayName || 'Khách danh tính'}</p>
                          <p className="text-[10px] font-mono text-muted-foreground mt-1 opacity-60 tracking-tighter">ID: {u.uid}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-foreground tracking-tight">{u.email}</p>
                      <span className={cn(
                        "inline-flex items-center px-2 py-0.5 mt-1 rounded-md text-[9px] font-black uppercase tracking-widest",
                        u.rank ? "bg-emerald-100 text-emerald-600" : "bg-primary/10 text-primary"
                      )}>
                        {u.rank || 'Thành viên'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-xl border border-border">
                        <span className="text-sm font-black text-foreground">{u.interpretedChartIds?.length || 0}</span>
                        <span className="text-[10px] font-bold text-muted-foreground opacity-60">/ {u.customQuotaLimit || 2} lá</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 opacity-60" />
                        {u.lastLoginAt?.toDate?.() ? u.lastLoginAt.toDate().toLocaleString('vi-VN') : 'Mới khởi tạo'}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => { 
                            setSelectedUser(u); 
                            setEditRank(u.rank || '');
                            setEditQuota(u.customQuotaLimit || 2);
                            setIsDetailOpen(true); 
                          }}
                          className="h-8 w-8 p-0 rounded-lg hover:bg-primary/10 hover:text-primary"
                        >
                          <Info className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleResetQuota(u.uid)}
                          className="h-8 w-8 p-0 rounded-lg hover:bg-orange-100 hover:text-orange-600"
                          title="Đặt lại hạn mức"
                        >
                          <Zap className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDeleteUser(u.uid)}
                          className="h-8 w-8 p-0 rounded-lg hover:bg-red-100 hover:text-red-600"
                          title="Xóa người dùng"
                          disabled={u.email === ADMIN_EMAIL}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {totalPages > 1 && (
          <div className="p-4 flex items-center justify-center gap-2 border-t border-border">
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>Trước</Button>
            <span className="text-xs font-bold text-muted-foreground">Trang {currentPage} / {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>Sau</Button>
          </div>
        )}
        </>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-secondary/5 border-b border-border">
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-muted-foreground tracking-widest">Thời gian</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-muted-foreground tracking-widest">Tài nguyên (Key) / Loại lỗi</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-muted-foreground tracking-widest">Chi tiết thông báo hệ thống</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-muted-foreground tracking-widest text-right">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {isAlertsLoading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-red-500" />
                      <p className="font-bold text-sm tracking-tight uppercase">Đang tải lịch sử cảnh báo...</p>
                    </td>
                  </tr>
                ) : alerts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-emerald-600 font-medium bg-emerald-50/50">
                      <Shield className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      Hệ thống hoạt động ổn định. Không có cảnh báo tràn RAM/Quota.
                    </td>
                  </tr>
                ) : (
                  alerts.map((a) => (
                    <tr key={a.id} className={cn("hover:bg-slate-50/50 transition-colors", !a.resolved ? "bg-red-50/30" : "")}>
                      <td className="px-6 py-4">
                        <p className="text-xs font-bold text-slate-500 flex items-center gap-1.5 opacity-80">
                          <Calendar className="w-3.5 h-3.5" />
                          {a.timestamp?.toDate?.() ? a.timestamp.toDate().toLocaleString('vi-VN') : 'Vừa xong'}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1.5 items-start">
                          {a.keyUsed && a.keyUsed !== 'Unknown' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded border text-[9px] font-black uppercase tracking-widest bg-slate-800 text-white border-slate-700">
                              KEY: {a.keyUsed}
                            </span>
                          )}
                          <span className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest",
                            a.type === 'MISSING_KEYS' ? "bg-orange-100 text-orange-700 font-bold" : "bg-red-100 text-red-700"
                          )}>
                            {a.type || 'LỖI HỆ THỐNG'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-foreground opacity-90 break-words line-clamp-2" title={a.error}>{a.error}</p>
                      </td>
                      <td className="px-6 py-4 text-right align-middle">
                        <Button
                          variant={a.resolved ? "outline" : "default"}
                          size="sm"
                          onClick={() => handleResolveAlert(a.id, a.resolved)}
                          className={cn("h-8 rounded-lg text-xs font-bold border-border whitespace-nowrap", a.resolved ? "opacity-50 hover:opacity-100 border-transparent" : "bg-red-500 hover:bg-red-600 text-white border-0")}
                        >
                          {a.resolved ? <Check className="w-3 h-3 mr-1" /> : <ShieldAlert className="w-3 h-3 mr-1" />}
                          {a.resolved ? 'Đã xử lý' : 'Đánh dấu xử lý'}
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* User Info Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-xl rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
          {selectedUser && (
            <div className="flex flex-col">
              <div className="bg-primary p-8 text-white relative">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsDetailOpen(false)}
                  className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full"
                >
                  <X className="w-5 h-5" />
                </Button>
                <div className="flex flex-col items-center text-center">
                  <div className="w-24 h-24 rounded-3xl bg-white/20 backdrop-blur-xl mb-4 flex items-center justify-center p-1 border border-white/20 overflow-hidden shadow-xl">
                    {selectedUser.photoURL ? (
                      <img src={selectedUser.photoURL} className="w-full h-full rounded-2xl object-cover shadow-inner" alt="" />
                    ) : (
                      <User className="w-12 h-12 text-white" />
                    )}
                  </div>
                  <h2 className="text-2xl font-black uppercase tracking-tight leading-none mb-1">{selectedUser.displayName || 'User'}</h2>
                  <p className="text-white/60 font-bold text-xs tracking-wider uppercase">{selectedUser.email}</p>
                </div>
              </div>

              <div className="p-8 space-y-6 bg-white">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">Cấp bậc</label>
                    <input 
                      type="text" 
                      value={editRank} 
                      onChange={(e) => setEditRank(e.target.value)}
                      placeholder="Cấp bậc (VD: Premium)"
                      className="w-full px-4 py-2.5 bg-secondary/30 border border-border/50 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">Hạn mức AI</label>
                    <input 
                      type="number" 
                      value={editQuota} 
                      onChange={(e) => setEditQuota(Number(e.target.value))}
                      className="w-full px-4 py-2.5 bg-secondary/30 border border-border/50 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase text-foreground/40 tracking-widest flex items-center gap-2">
                    <Handshake className="w-4 h-4" /> Thao tác quản trị viên
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      onClick={handleUpdateUserDetails}
                      disabled={isUpdating}
                      className="bg-primary hover:bg-primary/90 text-white rounded-xl font-bold py-6"
                    >
                      {isUpdating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                      LƯU THAY ĐỔI
                    </Button>
                    <Button 
                      onClick={() => handleResetQuota(selectedUser.uid)}
                      className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold py-6"
                    >
                      <Zap className="w-4 h-4 mr-2" /> RE-QUOTA
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      variant="outline"
                      className="rounded-xl font-bold py-6 text-slate-500 border-border hover:bg-slate-50"
                      onClick={() => {
                        alert(`Chi tiết ID: ${selectedUser.uid}\nCharts đã luận: ${JSON.stringify(selectedUser.interpretedChartIds || [], null, 2)}`);
                      }}
                    >
                      <FileText className="w-4 h-4 mr-2" /> LOG JSON
                    </Button>
                    <Button 
                      onClick={() => handleDeleteUser(selectedUser.uid)}
                      variant="destructive"
                      className="rounded-xl font-bold py-6"
                    >
                      <X className="w-4 h-4 mr-2" /> XÓA USER
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

function ProfileView({ user, userData, isAdmin, onAdminClick, onBack }: { user: FirebaseUser, userData: any, isAdmin: boolean, onAdminClick: () => void, onBack: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="container mx-auto px-4 max-w-lg py-8 md:py-16"
    >
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" onClick={onBack} className="text-muted-foreground hover:text-primary transition-colors h-8">
          <ChevronLeft className="w-4 h-4 mr-1" /> Quay lại
        </Button>
      </div>

      <div className="bg-white rounded-[32px] border border-border/50 shadow-2xl p-6 md:p-10 flex flex-col items-start">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 w-full mb-8">
          <div className="relative shrink-0">
            <div className="p-1 rounded-full bg-gradient-to-tr from-primary/20 via-blue-400/20 to-emerald-400/20">
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || 'User'} className="w-24 h-24 md:w-32 md:h-32 rounded-full shadow-lg object-cover" />
              ) : (
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-slate-50 flex items-center justify-center text-primary shadow-lg border border-border">
                  <User className="w-12 h-12" />
                </div>
              )}
            </div>
            <div className="absolute bottom-2 right-2 w-5 h-5 bg-green-500 rounded-full border-4 border-white shadow-sm" title="Online Status"></div>
          </div>
          
          <div className="text-center md:text-left flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-heading font-black text-foreground tracking-tight uppercase truncate">{user.displayName || 'Người dùng'}</h1>
            <p className="text-[11px] text-muted-foreground font-semibold flex items-center justify-center md:justify-start gap-1.5 uppercase tracking-widest opacity-80 mt-1">
              <Shield className="w-3.5 h-3.5 text-green-500" /> Tài khoản đã xác thực
            </p>
            {isAdmin && (
              <Button 
                onClick={onAdminClick}
                className="mt-4 bg-primary text-white hover:bg-primary/90 font-bold text-[10px] h-8 px-4 rounded-full shadow-md uppercase tracking-widest whitespace-nowrap"
              >
                <Shield className="w-3 h-3 mr-2" /> Quản trị hệ thống
              </Button>
            )}
          </div>
        </div>
        
        <div className="w-full space-y-6">
           <div className="flex flex-col items-start gap-1.5 relative w-full">
              <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.14em]">Cấp bậc</span>
              <div className="text-sm md:text-base font-bold text-primary flex items-center gap-2">
                <Star className="w-4 h-4 fill-primary" /> {isAdmin ? "Quản trị viên" : (userData?.rank || "Thành viên Miễn phí")}
              </div>
              <div className="w-full h-px bg-slate-100 mt-2" />
           </div>

           <div className="flex flex-col items-start gap-1.5 relative w-full">
              <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.14em]">Hạn mức AI</span>
              <span className="text-sm md:text-base font-bold text-slate-700">
                {isAdmin ? "Vô hạn (Admin)" : `${(userData?.interpretedChartIds?.length || 0)} / ${userData?.customQuotaLimit || 2} lá số đã xem`}
              </span>
              <div className="w-full h-px bg-slate-100 mt-2" />
           </div>

           <div className="flex flex-col items-start gap-1.5 relative w-full">
              <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.14em]">Địa chỉ Email</span>
              <span className="text-sm font-semibold text-slate-700 break-all w-full">{user.email}</span>
              <div className="w-full h-px bg-slate-100 mt-2" />
           </div>

           <div className="flex flex-col items-start gap-1.5 relative w-full">
              <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.14em]">Mã định danh (UID)</span>
              <span className="text-[10px] font-mono text-muted-foreground/50 break-all select-all font-medium">{user.uid}</span>
              <div className="w-full h-px bg-slate-100 mt-2" />
           </div>

           <div className="flex flex-col items-start gap-1 relative w-full pt-1">
              <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-[0.14em]">Lượt luận giải</span>
              <span className="text-sm md:text-base font-black text-[#FF4D00] uppercase tracking-normal">Không giới hạn</span>
           </div>
        </div>
      </div>
    </motion.div>
  );
}

function ResultView({ 
  chartData, 
  birthInfo, 
  onBack, 
  activeTab, 
  setActiveTab, 
  palaceInterpretations, 
  isGenerating, 
  interpretingPalace,
  onGenerate,
  onGenerateAll,
  isSubscribed,
  onSubscribe,
  onPalaceClick
}: any) {
  const PRIORITY_ORDER = ['Mệnh', 'Tài Bạch', 'Quan Lộc', 'Phu Thê', 'Thiên Di', 'Phúc Đức', 'Phụ Mẫu', 'Điền Trạch', 'Nô Bộc', 'Tật Ách', 'Tử Tức', 'Huynh Đệ'];
  
  const palaceTabs = [...chartData.palaces].sort((a: any, b: any) => {
    const idxA = PRIORITY_ORDER.indexOf(a.name);
    const idxB = PRIORITY_ORDER.indexOf(b.name);
    return (idxA > -1 ? idxA : 99) - (idxB > -1 ? idxB : 99);
  }).map((p: any) => p.name);

  if (!activeTab && palaceTabs.length > 0) {
    setActiveTab(palaceTabs[0]);
  }

  const [expandedPalaces, setExpandedPalaces] = useState<Record<string, boolean>>({});
  const exportRef = useRef<{ exportImage: () => void, exportPDF: () => void } | null>(null);

  const togglePalace = (pName: string) => {
    setExpandedPalaces(prev => ({ ...prev, [pName]: !prev[pName] }));
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="container mx-auto px-2 md:px-6 max-w-[1400px] pt-2 md:pt-4"
    >
      <div className="flex flex-col gap-4 md:gap-6" id="result-view-container">
        
        <div className="space-y-3 md:space-y-4 px-3 md:px-0">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-3">
              <h2 className="text-lg md:text-xl font-heading font-black text-foreground">Lá số {birthInfo.name}</h2>
              <div className="flex items-center gap-2">
                 <Button variant="ghost" size="sm" onClick={onBack} className="text-muted-foreground hover:text-primary transition-colors h-8">
                    <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Quay lại
                 </Button>
              </div>
           </div>
        </div>

        <div className="flex flex-col xl:flex-row gap-6 xl:gap-8 items-start">
          <div className="w-full xl:w-[45%] shrink-0 flex flex-col gap-4 sticky top-20">
            <div className="w-full border-b border-border overflow-x-auto invisible-scrollbar flex items-center justify-between gap-4">
              <div className="flex">
                <div className="px-4 py-1.5 text-[12px] font-black text-primary border-b-2 border-primary whitespace-nowrap uppercase">
                  Lá số chi tiết
                </div>
              </div>

              <div className="flex items-center gap-1.5 md:gap-2 shrink-0 pb-1 pr-1">
                <Button 
                   onClick={() => exportRef.current?.exportImage()}
                   variant="ghost" 
                   size="sm"
                   className="bg-[#F0FDF4] border border-primary/20 text-primary hover:bg-primary/10 text-[11px] md:text-[12px] font-bold shadow-sm rounded-xl h-7 md:h-8 px-2.5 md:px-3 flex items-center gap-1.5"
                >
                   <Download className="w-3.5 h-3.5" />
                   PNG
                </Button>
                <Button 
                   onClick={() => exportRef.current?.exportPDF()}
                   variant="ghost" 
                   size="sm"
                   className="bg-[#F0FDF4] border border-primary/20 text-primary hover:bg-primary/10 text-[11px] md:text-[12px] font-bold shadow-sm rounded-xl h-7 md:h-8 px-2.5 md:px-3 flex items-center gap-1.5"
                >
                   <FileText className="w-3.5 h-3.5" />
                   PDF
                </Button>
              </div>
            </div>

            <div className="bg-white rounded-[24px] border-none md:border md:border-border shadow-none md:shadow-lg p-2 md:p-3 overflow-hidden flex flex-col items-center">
               <AstrologyChart 
                 palaces={chartData.palaces}
                 menhIdx={chartData.menhIdx}
                 thanIdx={chartData.thanIdx}
                 birthInfo={birthInfo}
                 lunar={chartData.lunar}
                 solar={chartData.solar}
                 stemBranchYear={chartData.stemBranchYear}
                 yinYang={chartData.yinYang}
                 yinYangHarmony={chartData.yinYangHarmony}
                 fiveElementsClass={chartData.fiveElementsClass}
                 menhFull={chartData.menhFull}
                 thanPalace={chartData.thanPalace}
                 patterns={chartData.patterns}
                 elementHarmony={chartData.elementHarmony}
                 canLuong={chartData.canLuong}
                 chuMenh={chartData.chuMenh}
                 chuThan={chartData.chuThan}
                 laiNhanCung={chartData.laiNhanCung}
                 currentAge={chartData.currentAge}
                 currentDecadal={chartData.currentDecadal}
                 showYearlyStars={true}
                 showYearlyMutagens={true}
                 showDecadalStars={false}
                 exportRef={exportRef}
                 onPalaceClick={(idx: number) => {
                   const palaceName = chartData.palaces[idx].name;
                   if (!expandedPalaces[palaceName]) togglePalace(palaceName);
                   const el = document.getElementById(`palace-card-${palaceName}`);
                   if (el) {
                     const yOffset = -100;
                     const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
                     window.scrollTo({top: y, behavior: 'smooth'});
                   }
                 }}
               />
            </div>
          </div>

          <div className="w-full xl:w-[55%] px-0 md:px-0">
            <div id="ai-section" className="space-y-4 md:space-y-6 mt-0 pb-10 md:pb-20">
                <div className="flex flex-col items-center xl:items-start text-center xl:text-left space-y-2 mb-6">
                   <div className="px-2 py-0.5 bg-primary/10 text-primary text-[9px] font-black rounded-full border border-primary/20 uppercase tracking-[0.2em]">
                      CHIÊM CÁT VẬN MỆNH
                   </div>
                   <h2 className="text-[18px] md:text-xl font-heading font-black text-foreground uppercase tracking-tight flex items-center gap-2">
                       <Sparkles className="w-5 h-5 text-primary" /> Luận giải chi tiết 12 cung
                   </h2>
                   <p className="text-muted-foreground text-[12px] md:text-sm max-w-md leading-tight">
                      Luận giải chi tiết 12 cung số từ trí tuệ nhân tạo.
                   </p>
                   <Button 
                     onClick={onGenerateAll}
                     variant="outline"
                     size="sm"
                     disabled={isGenerating}
                     title="Giải mã trọn bộ 12 cung"
                     className="mt-4 h-10 w-10 border-primary/30 text-primary hover:bg-primary/5 rounded-full p-0 shadow-sm flex items-center justify-center group transition-all duration-300 hover:scale-110"
                   >
                     {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-5 h-5 text-yellow-500 group-hover:rotate-12 transition-transform" />}
                   </Button>
                </div>

             <div className="space-y-3">
                {palaceTabs.map((pName: string, idx: number) => {
                  const isThanPalace = chartData.palaces[chartData.thanIdx].name === pName;
                  const interpretation = palaceInterpretations[pName];
                  const isExpanded = expandedPalaces[pName];
                  const isGeneratingCurrent = (isGenerating && interpretingPalace === pName);

                  return (
                    <motion.div 
                      id={`palace-card-${pName}`}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      key={pName} 
                      className="bg-white rounded-xl border border-border shadow-sm transition-all overflow-hidden"
                    >
                      <div className="p-3 md:p-4">
                        <div className="flex flex-row items-center gap-3 mb-3">
                           <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white shrink-0 font-black text-[10px]">
                              {idx + 1}
                           </div>

                           <div className="flex-1 flex flex-row items-center justify-between gap-4">
                              <h3 className="text-[15px] font-heading font-black text-foreground">
                                 Cung {pName} {isThanPalace && '+ Thân'}
                              </h3>
                              
                              {!interpretation ? (
                                 <Button 
                                   onClick={() => {
                                     setActiveTab(pName);
                                     onGenerate(pName);
                                     if (!isExpanded) togglePalace(pName);
                                   }}
                                   disabled={isGenerating}
                                   size="sm"
                                   className="h-8 px-4 bg-primary text-white rounded-lg text-[11px] font-black flex items-center gap-1 shadow-lg hover:scale-105 transition-transform shrink-0"
                                 >
                                    {isGeneratingCurrent && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                    LUẬN GIẢI
                                 </Button>
                              ) : (
                                 <Button 
                                   onClick={() => togglePalace(pName)}
                                   size="sm"
                                   className="h-8 px-4 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg text-[11px] font-black flex items-center gap-1 transition-all shrink-0 border border-primary/20"
                                 >
                                    {isExpanded ? 'THU GỌN' : (isGeneratingCurrent ? 'ĐANG TẢI...' : 'XEM KẾT QUẢ')}
                                 </Button>
                              )}
                           </div>
                        </div>

                        <div className="space-y-1 mb-2">
                           <p className="text-muted-foreground text-[12px] leading-relaxed italic text-justify">
                              {PALACE_DESCRIPTIONS[pName] || `Phân tích ${pName.toLowerCase()} trên cơ sở tam phương tứ chính và các bộ sao đặc biệt.`}
                           </p>
                        </div>

                        {(interpretation || isGeneratingCurrent) && (
                           <AnimatePresence>
                              {isExpanded && (
                                 <motion.div
                                   initial={{ height: 0, opacity: 0 }}
                                   animate={{ height: 'auto', opacity: 1 }}
                                   exit={{ height: 0, opacity: 0 }}
                                   className="pt-6 border-t border-dashed border-border mt-5 overflow-hidden"
                                 >
                                           {isGeneratingCurrent ? (
                                             <div className="flex items-center gap-2 py-8 justify-center animate-pulse text-primary font-black text-[12px]">
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                <span>AI đang thấu suốt bí mật tại cung {pName}...</span>
                                             </div>
                                           ) : (
                                             <div className="prose prose-purple max-w-none 
                                             prose-headings:text-slate-900 prose-headings:tracking-tighter prose-headings:mt-12 md:prose-headings:mt-14 prose-headings:mb-5 md:prose-headings:mb-6 prose-headings:pb-2 md:prose-headings:pb-3 prose-headings:border-b
                                             prose-h2:text-[16px] md:prose-h2:text-[18px] lg:prose-h2:text-[20px] prose-h2:font-bold prose-h2:uppercase prose-h2:tracking-wider prose-h2:text-slate-900 
                                             prose-p:text-[13px] md:prose-p:text-[15px] lg:prose-p:text-[16px] prose-p:leading-[1.7] md:prose-p:leading-[1.8] prose-p:tracking-normal prose-p:text-slate-600 prose-p:mb-4 md:prose-p:mb-5 prose-p:text-justify font-sans
                                             prose-strong:font-bold 
                                             prose-ul:my-4 md:prose-ul:my-5 prose-ul:list-disc prose-ul:pl-6 md:prose-ul:pl-8
                                             prose-li:my-1.5 md:prose-li:my-2 prose-li:text-[13px] md:prose-li:text-[15px] lg:prose-li:text-[16px] prose-li:text-slate-600
                                             prose-blockquote:border-l-4 prose-blockquote:border-primary/40 prose-blockquote:pl-5 md:prose-blockquote:pl-6 prose-blockquote:not-italic prose-blockquote:text-muted-foreground
                                             selection:bg-primary/20 text-[13px] md:text-[15px]">
                                                <Markdown 
                                                  remarkPlugins={[remarkGfm]}
                                                  components={{
                                                    strong: ({node, children, ...props}) => {
                                                      const text = String(children);
                                                      // High-end element colors
                                                      const elementColors: Record<string, string> = {
                                                        'Kim': 'text-[#64748b]', // Slate Gray
                                                        'Mộc': 'text-[#059669]', // Emerald
                                                        'Thủy': 'text-[#1d4ed8]', // Royal Blue
                                                        'Hỏa': 'text-[#be123c]', // Crimson
                                                        'Thổ': 'text-[#a16207]'  // Golden Brown
                                                      };
                                                      // Pattern to match "Star Name [Element]"
                                                      const match = text.match(/(.*) \[(Kim|Mộc|Thủy|Hỏa|Thổ)\]/);
                                                      if (match) {
                                                        const starName = match[1];
                                                        const element = match[2];
                                                        return (
                                                          <strong 
                                                            className={cn(elementColors[element] || 'text-primary', "font-bold tracking-tight")} 
                                                            {...props}
                                                          >
                                                            {starName}
                                                          </strong>
                                                        );
                                                      }
                                                      return <strong className="text-foreground font-bold" {...props}>{children}</strong>;
                                                    }
                                                  }}
                                                >
                                                  {interpretation}
                                                </Markdown>
                                             </div>
                                           )}
                                        </motion.div>
                                     )}
                                  </AnimatePresence>
                               )}

                               {interpretation && (
                                  <div className="pt-2 flex justify-center">
                                     <button 
                                       onClick={() => togglePalace(pName)}
                                       className="text-primary font-black flex items-center gap-1 hover:underline transition-all text-[11px] uppercase tracking-wider"
                                     >
                                        {isExpanded ? 'Thu gọn luận giải' : 'Xem chi tiết luận giải'}
                                        <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", isExpanded && "rotate-180")} />
                                     </button>
                                  </div>
                               )}
                      </div>
                    </motion.div>
                  );
                })}

             </div>
          </div>

          <div className="pb-20">
             {/* Expert Consultation and Basis removed as requested */}
          </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}


function Timeline({ age, decadal }: { age: number, decadal: string }) {
  const years = Array.from({ length: 12 }, (_, i) => 2024 + i);
  const ZODIACS = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];
  
  return (
    <div className="glass-panel p-6 rounded-[24px]">
      <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
         <Calendar className="w-5 h-5 text-primary" />
         Vận Thế Hàng Năm
      </h4>
      <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
         {years.map(y => (
           <div key={y} className={cn(
             "min-w-[120px] p-4 rounded-xl border transition-all cursor-pointer group",
             y === 2026 ? "bg-primary border-primary text-background" : "bg-card border-border text-muted-foreground hover:border-primary/50"
           )}>
              <div className="text-[10px] font-bold uppercase mb-1 opacity-70 group-hover:opacity-100 transition-opacity">Năm {y}</div>
              <div className="text-lg font-heading font-bold">{ZODIACS[y % 12]}</div>
              <div className="text-[10px] mt-2 opacity-70">Lưu niên: {ZODIACS[(y + 8) % 12]}</div>
           </div>
         ))}
      </div>
    </div>
  );
}

function PalaceDetailDialog({ isOpen, onClose, palace, isMenh, isThan }: any) {
  if (!palace) return null;

  const Icon = PALACE_ICONS[palace.name] || User;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl glass-panel border-border rounded-[32px] p-0 overflow-hidden bg-background border-primary/20 shadow-2xl">
        <DialogHeader className="p-8 pb-4 relative border-b border-border/50">
           <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center relative overflow-hidden group shrink-0">
                 <div className="absolute inset-0 bg-primary opacity-0 group-hover:opacity-10 transition-opacity" />
                 <Icon className="w-10 h-10 text-primary relative z-10" />
              </div>
              <div className="flex-1">
                 <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-4xl font-heading font-bold text-foreground uppercase tracking-tight">Cung {palace.name}</h2>
                    <div className="px-3 py-1 bg-secondary text-primary text-[10px] font-bold rounded-full border border-primary/20 uppercase tracking-widest">
                       {palace.branch}
                    </div>
                 </div>
                 <div className="flex gap-4">
                    {isMenh && <span className="flex items-center text-xs font-bold text-primary"><Star className="w-3 h-3 mr-1" /> Mệnh</span>}
                    {isThan && <span className="flex items-center text-xs font-bold text-blue-600"><Shield className="w-3 h-3 mr-1" /> Thân</span>}
                 </div>
              </div>
              <button onClick={onClose} className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center hover:bg-secondary transition-colors border border-border">
                <X className="w-5 h-5" />
              </button>
           </div>
        </DialogHeader>

        <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                 <h4 className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground border-l-2 border-primary pl-3">Chính tinh</h4>
                 <div className="space-y-3">
                    {palace.majorStars.map((s: any, i: number) => (
                      <div key={i} className="p-4 rounded-2xl bg-secondary/30 border border-border group hover:border-primary/30 transition-all">
                         <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-primary text-lg">{s.name}</span>
                            <span className="text-xs font-bold text-muted-foreground uppercase">{s.brightness}</span>
                         </div>
                         <p className="text-sm text-muted-foreground/80 leading-relaxed italic">
                            {STAR_MEANINGS[s.name] || 'Đang cập nhật ý nghĩa sao...'}
                         </p>
                      </div>
                    ))}
                    {palace.majorStars.length === 0 && (
                      <div className="p-6 rounded-2xl bg-secondary/10 border border-dashed border-border text-center">
                        <p className="text-sm text-muted-foreground italic">Cung vô chính diệu (Không có chính tinh)</p>
                      </div>
                    )}
                 </div>
              </div>

              <div className="space-y-6">
                 <div>
                    <h4 className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground border-l-2 border-primary pl-3 mb-4">Tụ hội hữu ích</h4>
                    <div className="flex flex-wrap gap-2">
                       {palace.minorStars.map((s: any, i: number) => (
                         <div key={i} className="px-3 py-1.5 rounded-xl bg-primary/5 border border-primary/10 text-primary text-[11px] font-bold hover:bg-primary/20 transition-all cursor-default">
                            {s.name}
                         </div>
                       ))}
                       {palace.minorStars.length === 0 && <p className="text-xs text-muted-foreground italic">Không có cát tinh nổi bật</p>}
                    </div>
                 </div>
                 
                 <div>
                    <h4 className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground border-l-2 border-destructive pl-3 mb-4">Sát tinh & Bại tinh</h4>
                    <div className="flex flex-wrap gap-2">
                       {palace.adjectiveStars.map((s: any, i: number) => (
                         <div key={i} className="px-3 py-1.5 rounded-xl bg-destructive/5 border border-destructive/10 text-destructive text-[11px] font-bold hover:bg-destructive/20 transition-all cursor-default">
                            {s.name}
                         </div>
                       ))}
                       {palace.adjectiveStars.length === 0 && <p className="text-xs text-muted-foreground italic">Không có sát tinh</p>}
                    </div>
                 </div>
              </div>
           </div>

           <div className="bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 p-6 rounded-[24px] space-y-4">
              <div className="flex items-center gap-3">
                 <Bot className="w-5 h-5 text-primary" />
                 <h4 className="font-bold text-lg">Phân tích nhanh bởi AI</h4>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                 Cung {palace.name} tại {palace.branch} của bạn đang được hội tụ bởi các bộ sao {palace.majorStars.length > 0 ? palace.majorStars.map((s: any) => s.name).join(', ') : 'vô chính diệu'}. 
                 Điều này cho thấy vận thế {palace.name.toLowerCase()} có nhiều biến động {palace.adjectiveStars.length > 3 ? 'phức tạp' : 'thuận lợi'}. 
                 Hãy sử dụng AI Luận Giải Chi Tiết ở trang chính để nhận lời khuyên chuẩn xác hơn.
              </p>
           </div>
        </div>
        
        <div className="p-6 bg-secondary/40 border-t border-border flex justify-between items-center">
           <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest italic opacity-50">SOMENH.AI • TRÍ TUỆ NHÂN TẠO TRONG HUYỀN HỌC</p>
           <Button onClick={onClose} className="rounded-xl px-10 font-bold bg-primary text-background hover:scale-105 transition-transform">Đã thấu rõ</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
