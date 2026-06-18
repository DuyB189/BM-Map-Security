import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  X, Calendar, MapPin, BarChart3, PieChart, TrendingUp,
  AlertTriangle, User, Flame, Store, Cctv, Building2, Route,
  TrendingDown, Info, ArrowUpRight, ArrowDownRight, Search, ChevronRight
} from 'lucide-react';
import { GISData } from '../types';

interface StatsDashboardModalProps {
  show: boolean;
  onClose: () => void;
  data: GISData;
  onSelectCategory?: (category: string) => void;
  onSelectItem?: (item: any) => void;
}

interface HoveredBar {
  entity: string;
  type: 'current' | 'previous';
  value: number;
  x: number;
  y: number;
}

interface HoveredTrendPoint {
  monthName: string;
  value: number;
  x: number;
  y: number;
}

export default function StatsDashboardModal({ show, onClose, data, onSelectCategory, onSelectItem }: StatsDashboardModalProps) {
  const [periodType, setPeriodType] = useState<'month' | 'quarter' | 'year'>('month');
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number>(6); // Default: June
  const [selectedQuarter, setSelectedQuarter] = useState<number>(2); // Default: Q2
  const [trendEntity, setTrendEntity] = useState<'vuviec' | 'doituong' | 'diemnong' | 'cskd'>('vuviec');

  const [hoveredBar, setHoveredBar] = useState<HoveredBar | null>(null);
  const [hoveredTrendPoint, setHoveredTrendPoint] = useState<HoveredTrendPoint | null>(null);

  // States for sub-modal list of counted items
  const [activeListModal, setActiveListModal] = useState<{
    title: string;
    category: string;
    items: any[];
  } | null>(null);
  const [listSearch, setListSearch] = useState('');

  const handleOpenListModal = (
    title: string, 
    category: string, 
    rawItems: any[], 
    filterByPeriod: boolean = true, 
    customYear?: number, 
    customVal?: number,
    customPeriodType?: 'month' | 'quarter' | 'year'
  ) => {
    let items = rawItems;
    if (filterByPeriod) {
      const pType = customPeriodType || periodType;
      const year = customYear !== undefined ? customYear : selectedYear;
      const val = customVal !== undefined ? customVal : (pType === 'month' ? selectedMonth : pType === 'quarter' ? selectedQuarter : selectedYear);
      items = rawItems.filter(item => {
        const itemDate = parseItemDate(item.thoigian || item.ngay_tao);
        return isItemInPeriod(itemDate, pType, year, val);
      });
    }
    setListSearch('');
    setActiveListModal({ title, category, items });
  };

  const handleOpenDonutList = (label: string) => {
    const periodValue = periodType === 'month' ? selectedMonth : selectedQuarter;
    const items = data.vuviec.filter(item => {
      if (item.loai !== label) return false;
      const itemDate = parseItemDate(item.thoigian || item.ngay_tao);
      return isItemInPeriod(itemDate, periodType, selectedYear, periodValue);
    });
    setListSearch('');
    setActiveListModal({
      title: `Danh sách Vụ việc: ${label} (${getCurrentPeriodLabel()})`,
      category: 'vuviec-list',
      items
    });
  };

  const getItemIcon = (category: string) => {
    switch (category) {
      case 'vuviec-list': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'doituong-list': return <User className="w-4 h-4 text-purple-600" />;
      case 'diemnong-list': return <Flame className="w-4 h-4 text-red-650" />;
      case 'cskd-list': return <Store className="w-4 h-4 text-pink-650" />;
      case 'camera-list': return <Cctv className="w-4 h-4 text-orange-600" />;
      case 'coquan-list': return <Building2 className="w-4 h-4 text-slate-600" />;
      case 'tuyenduong-list': return <Route className="w-4 h-4 text-emerald-600" />;
      default: return <MapPin className="w-4 h-4 text-sky-650" />;
    }
  };

  const getItemIconBg = (category: string) => {
    switch (category) {
      case 'vuviec-list': return 'bg-red-50';
      case 'doituong-list': return 'bg-purple-50';
      case 'diemnong-list': return 'bg-red-50';
      case 'cskd-list': return 'bg-pink-50';
      case 'camera-list': return 'bg-orange-50';
      case 'coquan-list': return 'bg-slate-50';
      case 'tuyenduong-list': return 'bg-emerald-50';
      default: return 'bg-sky-50';
    }
  };

  const getItemName = (item: any, category: string) => {
    if (category === 'vuviec-list') return item.loai || 'Vụ việc không tên';
    if (category === 'doituong-list') return item.hoten || 'Đối tượng không tên';
    if (category === 'xa-list') return item.ten_xa || 'Xã không tên';
    return item.ten || item.label || 'Không tên';
  };

  const renderItemMeta = (item: any, category: string) => {
    const metaItems = [];
    if (category === 'vuviec-list') {
      if (item.trangthai) {
        let bg = 'bg-sky-50 text-sky-700 border-sky-100';
        if (item.trangthai === 'Đang xử lý') bg = 'bg-amber-50 text-amber-700 border-amber-100';
        else if (item.trangthai === 'Đã giải quyết') bg = 'bg-emerald-50 text-emerald-700 border-emerald-100';
        else if (item.trangthai === 'Báo động giả') bg = 'bg-rose-50 text-rose-700 border-rose-100';
        metaItems.push(
          <span key="status" className={`px-1.5 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${bg}`}>
            {item.trangthai}
          </span>
        );
      }
      if (item.thoigian) {
        metaItems.push(
          <span key="time" className="text-[9px] text-slate-500 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded">
            {new Date(item.thoigian).toLocaleString('vi-VN')}
          </span>
        );
      }
      if (item.groupId) {
        metaItems.push(
          <span key="group" className="text-[9px] font-bold text-purple-650 bg-purple-50 border border-purple-100 px-1.5 py-0.5 rounded">
            Nhóm: {item.groupId}
          </span>
        );
      }
    } else if (category === 'doituong-list') {
      if (item.loai) {
        metaItems.push(
          <span key="loai" className="text-[9px] font-bold text-red-650 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded">
            {item.loai}
          </span>
        );
      }
      if (item.cccd) {
        metaItems.push(
          <span key="cccd" className="text-[9px] font-mono text-slate-500 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded">
            CCCD: {item.cccd}
          </span>
        );
      }
      if (item.sdt) {
        metaItems.push(
          <span key="sdt" className="text-[9px] font-mono text-emerald-650 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded">
            SĐT: {item.sdt}
          </span>
        );
      }
    } else if (category === 'diemnong-list') {
      if (item.mucdo) {
        let bg = 'bg-yellow-50 text-yellow-700 border-yellow-100';
        if (item.mucdo === 'Cao') bg = 'bg-orange-50 text-orange-700 border-orange-100';
        else if (item.mucdo === 'Rất cao') bg = 'bg-red-50 text-red-700 border-red-100';
        metaItems.push(
          <span key="mucdo" className={`px-1.5 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${bg}`}>
            Mức độ: {item.mucdo}
          </span>
        );
      }
      if (item.radius !== undefined && item.radius !== null) {
        metaItems.push(
          <span key="radius" className="text-[9px] text-slate-500 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded">
            Bán kính: {item.radius}m
          </span>
        );
      }
      if (item.xaphuong) {
        metaItems.push(
          <span key="ward" className="text-[9px] text-slate-500 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded">
            {item.xaphuong}
          </span>
        );
      }
    } else if (category === 'cskd-list') {
      if (item.loai) {
        metaItems.push(
          <span key="loai" className="text-[9px] font-bold text-pink-650 bg-pink-50 border border-pink-100 px-1.5 py-0.5 rounded">
            {item.loai}
          </span>
        );
      }
      if (item.chu_co_so) {
        metaItems.push(
          <span key="owner" className="text-[9px] text-slate-500 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded">
            Chủ: {item.chu_co_so}
          </span>
        );
      }
      if (item.trangthai) {
        metaItems.push(
          <span key="status" className="text-[9px] text-emerald-650 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded font-bold">
            {item.trangthai}
          </span>
        );
      }
    } else if (category === 'camera-list') {
      if (item.chu_camera) {
        metaItems.push(
          <span key="owner" className="text-[9px] text-slate-500 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded">
            Chủ: {item.chu_camera}
          </span>
        );
      }
      if (item.trangthai) {
        metaItems.push(
          <span key="status" className="text-[9px] font-bold text-emerald-650 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded">
            {item.trangthai}
          </span>
        );
      }
    } else if (category === 'tuyenduong-list') {
      if (item.loai) {
        metaItems.push(
          <span key="loai" className="text-[9px] font-bold text-emerald-650 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded">
            {item.loai}
          </span>
        );
      }
      if (item.mucdo) {
        let bg = 'bg-sky-50 text-sky-700 border-sky-100';
        if (item.mucdo === 'Cao') bg = 'bg-orange-50 text-orange-700 border-orange-100';
        else if (item.mucdo === 'Rất cao') bg = 'bg-red-50 text-red-700 border-red-100';
        metaItems.push(
          <span key="mucdo" className={`px-1.5 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${bg}`}>
            Cảnh báo: {item.mucdo}
          </span>
        );
      }
    } else if (category === 'coquan-list') {
      if (item.loai) {
        metaItems.push(
          <span key="loai" className="text-[9px] font-bold text-slate-600 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded">
            {item.loai}
          </span>
        );
      }
      if (item.xaphuong) {
        metaItems.push(
          <span key="ward" className="text-[9px] text-slate-500 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded">
            {item.xaphuong}
          </span>
        );
      }
    }

    return (
      <div className="flex flex-wrap items-center gap-1.5 mt-1">
        {metaItems}
      </div>
    );
  };

  // Helper: Dynamically generate year list from 2020 to current year + 1
  const yearsList = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const list = [];
    for (let y = 2020; y <= currentYear + 1; y++) {
      list.push(y);
    }
    return list;
  }, []);

  // Helper: Parse Date properly
  const parseItemDate = (dateStr?: string): Date => {
    if (dateStr) {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) return d;
    }
    return new Date();
  };

  // Helper: check if item is in specified period
  const isItemInPeriod = (itemDate: Date, type: 'month' | 'quarter' | 'year', year: number, val: number): boolean => {
    const itemYear = itemDate.getFullYear();
    if (type === 'year') {
      return itemYear === year;
    }
    if (itemYear !== year) return false;
    if (type === 'month') {
      return itemDate.getMonth() + 1 === val;
    } else {
      const q = Math.floor(itemDate.getMonth() / 3) + 1;
      return q === val;
    }
  };

  // Comparison baseline logic
  const prevPeriodInfo = useMemo(() => {
    let prevYear = selectedYear;
    let prevVal = periodType === 'month' ? selectedMonth : selectedQuarter;

    if (periodType === 'month') {
      prevVal = selectedMonth - 1;
      if (prevVal === 0) {
        prevVal = 12;
        prevYear = selectedYear - 1;
      }
    } else if (periodType === 'quarter') {
      prevVal = selectedQuarter - 1;
      if (prevVal === 0) {
        prevVal = 4;
        prevYear = selectedYear - 1;
      }
    } else {
      prevYear = selectedYear - 1;
    }

    // System adoption is 2026, so comparing to 2025 or earlier has no historical data.
    // Also, Yearly comparison comparing 2026 to 2025 is not intuitive/useful.
    const hasComparison = periodType !== 'year' && prevYear >= 2026;
    return { prevYear, prevVal, hasComparison };
  }, [periodType, selectedYear, selectedMonth, selectedQuarter]);

  // Process core metrics based purely on real database
  const stats = useMemo(() => {
    const wardVuViec = data.vuviec;
    const wardDoiTuong = data.doituong;
    const wardDiemNong = data.diemnong;
    const wardCskd = data.cskd;

    const getPeriodStats = (items: any[], year: number, val: number) => {
      let current = 0;
      let prevPeriod = 0;

      items.forEach(item => {
        const itemDate = parseItemDate(item.thoigian || item.ngay_tao);
        if (isItemInPeriod(itemDate, periodType, year, val)) {
          current++;
        } else if (prevPeriodInfo.hasComparison && isItemInPeriod(itemDate, periodType, prevPeriodInfo.prevYear, prevPeriodInfo.prevVal)) {
          prevPeriod++;
        }
      });

      const diffPrev = current - prevPeriod;
      const pctPrev = prevPeriod > 0 ? (diffPrev / prevPeriod) * 100 : (current > 0 ? 100 : 0);

      return { current, prevPeriod, diffPrev, pctPrev };
    };

    const periodValue = periodType === 'month' ? selectedMonth : selectedQuarter;

    return {
      vuviec: getPeriodStats(wardVuViec, selectedYear, periodValue),
      doituong: getPeriodStats(wardDoiTuong, selectedYear, periodValue),
      diemnong: getPeriodStats(wardDiemNong, selectedYear, periodValue),
      cskd: getPeriodStats(wardCskd, selectedYear, periodValue),
      totals: {
        vuviec: data.vuviec.length,
        doituong: data.doituong.length,
        diemnong: data.diemnong.length,
        cskd: data.cskd.length,
        camera: data.camera.length,
        coquan: data.coquan.length,
        tuyenduong: data.tuyenduong.length
      }
    };
  }, [data, periodType, selectedYear, selectedMonth, selectedQuarter, prevPeriodInfo]);

  // Distribution chart of Vụ việc categories filtered by period
  const vuviecDistribution = useMemo(() => {
    const periodValue = periodType === 'month' ? selectedMonth : selectedQuarter;
    const wardVuViec = data.vuviec
      .filter(item => {
        const itemDate = parseItemDate(item.thoigian || item.ngay_tao);
        return isItemInPeriod(itemDate, periodType, selectedYear, periodValue);
      });

    const categoryCounts: Record<string, number> = {};
    wardVuViec.forEach(vv => {
      const cat = vv.loai || 'Khác';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    const colors = ['#3b82f6', '#6366f1', '#f59e0b', '#10b981', '#ec4899', '#8b5cf6', '#ef4444', '#64748b'];
    return Object.entries(categoryCounts)
      .map(([label, value], idx) => ({
        label,
        value,
        color: colors[idx % colors.length]
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // top 5
  }, [data.vuviec, periodType, selectedYear, selectedMonth, selectedQuarter]);

  const totalIncidentsInPeriod = useMemo(() => {
    return vuviecDistribution.reduce((sum, item) => sum + item.value, 0);
  }, [vuviecDistribution]);

  // Distribution donut segments
  const donutSegments = useMemo(() => {
    const total = totalIncidentsInPeriod;
    if (total === 0) return [];

    // Single segment 100% case
    if (vuviecDistribution.length === 1) {
      return [{
        ...vuviecDistribution[0],
        percentage: 1.0,
        isFullCircle: true,
        pathData: ''
      }];
    }

    let accumulatedAngle = 0;
    return vuviecDistribution.map(item => {
      const percentage = item.value / total;
      const angle = percentage * 360;

      const r = 38;
      const cx = 50;
      const cy = 50;

      const startAngle = accumulatedAngle;
      const endAngle = accumulatedAngle + angle;
      accumulatedAngle = endAngle;

      const x1 = cx + r * Math.cos((startAngle - 90) * Math.PI / 180);
      const y1 = cy + r * Math.sin((startAngle - 90) * Math.PI / 180);
      const x2 = cx + r * Math.cos((endAngle - 90) * Math.PI / 180);
      const y2 = cy + r * Math.sin((endAngle - 90) * Math.PI / 180);

      const largeArcFlag = angle > 180 ? 1 : 0;
      const pathData = `M ${x1} ${y1} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2}`;

      return {
        ...item,
        percentage,
        isFullCircle: false,
        pathData
      };
    });
  }, [vuviecDistribution, totalIncidentsInPeriod]);

  // 6-Month Trend Data
  const trendData = useMemo(() => {
    const rawList = data[trendEntity];

    // Generate last 6 months list relative to selectedMonth & selectedYear
    const months: { year: number; month: number; label: string }[] = [];
    let y = selectedYear;
    let m = 12;
    if (periodType === 'month') {
      m = selectedMonth;
    } else if (periodType === 'quarter') {
      m = selectedQuarter * 3;
    } else {
      const currentYear = new Date().getFullYear();
      if (selectedYear === currentYear) {
        m = new Date().getMonth() + 1; // current month
      } else {
        m = 12;
      }
    }

    for (let i = 5; i >= 0; i--) {
      let curM = m - i;
      let curY = y;
      if (curM <= 0) {
        curM += 12;
        curY -= 1;
      }
      months.push({
        year: curY,
        month: curM,
        label: `Th ${curM}/${String(curY).slice(2)}`
      });
    }

    return months.map(mInfo => {
      const count = rawList.filter((item: any) => {
        const itemDate = parseItemDate(item.thoigian || item.ngay_tao);
        return itemDate.getFullYear() === mInfo.year && (itemDate.getMonth() + 1) === mInfo.month;
      }).length;
      return {
        label: mInfo.label,
        value: count,
        year: mInfo.year,
        month: mInfo.month
      };
    });
  }, [data, selectedYear, selectedMonth, selectedQuarter, periodType, trendEntity]);

  // Generate trend line path for SVG (Flat straight segmented line)
  const trendLineProps = useMemo(() => {
    if (trendData.length === 0) return { path: '', points: [], topPadding: 12, bottomPadding: 22 };
    const maxVal = Math.max(...trendData.map(d => d.value), 2);
    const width = 800;
    const height = 110;
    const topPadding = 12;
    const bottomPadding = 22;
    const padding = 40; // horizontal padding

    const xStep = (width - padding * 2) / (trendData.length - 1);

    const points = trendData.map((d, idx) => {
      const x = padding + idx * xStep;
      const y = height - bottomPadding - (d.value / maxVal) * (height - topPadding - bottomPadding);
      return { x, y, value: d.value, label: d.label, year: d.year, month: d.month };
    });

    let linePath = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      linePath += ` L ${points[i].x} ${points[i].y}`;
    }

    return { path: linePath, points, maxVal, topPadding, bottomPadding };
  }, [trendData]);

  if (!show) return null;

  // Comparison Bar Chart values (flat colors)
  const compChartData = [
    { label: 'Vụ việc', cur: stats.vuviec.current, prev: stats.vuviec.prevPeriod, color: '#3b82f6' },
    { label: 'Đối tượng', cur: stats.doituong.current, prev: stats.doituong.prevPeriod, color: '#6366f1' },
    { label: 'Điểm nóng', cur: stats.diemnong.current, prev: stats.diemnong.prevPeriod, color: '#f59e0b' },
    { label: 'Cơ sở KD', cur: stats.cskd.current, prev: stats.cskd.prevPeriod, color: '#10b981' }
  ];

  const maxCompValue = Math.max(...compChartData.flatMap(d => [d.cur, d.prev]), 5);

  const getPrevPeriodLabel = () => {
    if (periodType === 'month') {
      const pMonth = selectedMonth === 1 ? 12 : selectedMonth - 1;
      const pYear = selectedMonth === 1 ? selectedYear - 1 : selectedYear;
      return `Tháng ${pMonth}/${pYear}`;
    } else if (periodType === 'quarter') {
      const pQuarter = selectedQuarter === 1 ? 4 : selectedQuarter - 1;
      const pYear = selectedQuarter === 1 ? selectedYear - 1 : selectedYear;
      return `Quý ${pQuarter}/${pYear}`;
    } else {
      return `Năm ${selectedYear - 1}`;
    }
  };

  const getCurrentPeriodLabel = () => {
    if (periodType === 'month') return `Tháng ${selectedMonth}/${selectedYear}`;
    if (periodType === 'quarter') return `Quý ${selectedQuarter}/${selectedYear}`;
    return `Năm ${selectedYear}`;
  };

  return (
    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 15 }}
        className="bg-white rounded-[24px] w-full max-w-6xl shadow-xl overflow-hidden max-h-[92vh] flex flex-col border border-slate-100"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-white border-b border-slate-100 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-[14px] font-bold text-slate-800 uppercase tracking-wide">
                BÁO CÁO THỐNG KÊ AN NINH TRẬT TỰ
              </h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                Hệ thống thông tin quản lý an ninh trật tự • Dữ liệu nội bộ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-50 text-slate-400 hover:text-slate-700 rounded-lg transition-all cursor-pointer border border-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Container */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6 bg-slate-50/20">

          {/* Section: Filters */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg text-slate-600 font-semibold text-xs">
                <MapPin className="w-3.5 h-3.5 text-sky-600" />
                <span>Phạm vi: Toàn bộ địa bàn</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Period Type Filter */}
              <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200/40">
                <button
                  onClick={() => setPeriodType('month')}
                  className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${periodType === 'month' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Theo Tháng
                </button>
                <button
                  onClick={() => setPeriodType('quarter')}
                  className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${periodType === 'quarter' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Theo Quý
                </button>
                <button
                  onClick={() => setPeriodType('year')}
                  className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${periodType === 'year' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Theo Năm
                </button>
              </div>

              {/* Date Selection dropdowns */}
              <div className="flex items-center gap-1 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg">
                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0 mr-1" />

                {periodType === 'month' && (
                  <>
                    <select
                      className="text-[11px] font-bold text-slate-600 bg-transparent outline-none cursor-pointer border-0 p-0 pr-1"
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                        <option key={m} value={m}>Tháng {m}</option>
                      ))}
                    </select>
                    <span className="text-slate-300 text-[9px] mx-0.5">|</span>
                  </>
                )}

                {periodType === 'quarter' && (
                  <>
                    <select
                      className="text-[11px] font-bold text-slate-600 bg-transparent outline-none cursor-pointer border-0 p-0 pr-1"
                      value={selectedQuarter}
                      onChange={(e) => setSelectedQuarter(parseInt(e.target.value))}
                    >
                      {[1, 2, 3, 4].map(q => (
                        <option key={q} value={q}>Quý {q}</option>
                      ))}
                    </select>
                    <span className="text-slate-300 text-[9px] mx-0.5">|</span>
                  </>
                )}

                <select
                  className="text-[11px] font-bold text-slate-600 bg-transparent outline-none cursor-pointer border-0 p-0"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                >
                  {yearsList.map(y => (
                    <option key={y} value={y}>Năm {y}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          {/* Section: KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">

            {/* KPI: VỤ VIỆC */}
            <div
              onClick={() => handleOpenListModal(`Thống kê Vụ việc - ${getCurrentPeriodLabel()}`, 'vuviec-list', data.vuviec)}
              className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-red-200 hover:bg-red-50/10 cursor-pointer transition-all relative overflow-hidden group"
            >
              <div className="absolute right-4 top-4 bg-[#dc2626]/10 text-[#dc2626] p-2 rounded-xl group-hover:scale-105 transition-transform">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Vụ việc an ninh xảy ra</span>
              <div className="mt-2.5 flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-slate-800 leading-none">{stats.vuviec.current}</span>
                <span className="text-[9px] text-slate-400 font-semibold">bản ghi</span>
              </div>
              <div className="mt-3.5 pt-3 border-t border-slate-50 flex items-center justify-between">
                {prevPeriodInfo.hasComparison ? (
                  <>
                    <span className="text-[9px] text-slate-400 font-semibold uppercase">So với kỳ trước:</span>
                    <div className={`flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold ${stats.vuviec.diffPrev > 0
                      ? 'bg-red-50 text-red-650'
                      : stats.vuviec.diffPrev < 0
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-slate-50 text-slate-500'
                      }`}>
                      {stats.vuviec.diffPrev > 0 ? <TrendingUp className="w-3 h-3 text-red-500" /> : stats.vuviec.diffPrev < 0 ? <TrendingDown className="w-3 h-3 text-emerald-500" /> : null}
                      <span>
                        {stats.vuviec.diffPrev > 0 ? '+' : ''}{stats.vuviec.diffPrev} ({stats.vuviec.pctPrev.toFixed(0)}%)
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="text-[9px] text-slate-400 font-semibold uppercase">Kỳ báo cáo:</span>
                    <span className="px-2 py-0.5 bg-slate-50 text-slate-500 border border-slate-100 rounded text-[9px] font-bold">
                      {getCurrentPeriodLabel()}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* KPI: ĐỐI TƯỢNG */}
            <div
              onClick={() => handleOpenListModal(`Thống kê Đối tượng - ${getCurrentPeriodLabel()}`, 'doituong-list', data.doituong)}
              className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-violet-200 hover:bg-violet-50/10 cursor-pointer transition-all relative overflow-hidden group"
            >
              <div className="absolute right-4 top-4 bg-[#7c3aed]/10 text-[#7c3aed] p-2 rounded-xl group-hover:scale-105 transition-transform">
                <User className="w-4 h-4" />
              </div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Đối tượng quản lý</span>
              <div className="mt-2.5 flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-slate-800 leading-none">{stats.doituong.current}</span>
                <span className="text-[9px] text-slate-400 font-semibold">đối tượng</span>
              </div>
              <div className="mt-3.5 pt-3 border-t border-slate-50 flex items-center justify-between">
                {prevPeriodInfo.hasComparison ? (
                  <>
                    <span className="text-[9px] text-slate-400 font-semibold uppercase">So với kỳ trước:</span>
                    <div className={`flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold ${stats.doituong.diffPrev > 0
                      ? 'bg-red-50 text-red-650'
                      : stats.doituong.diffPrev < 0
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-slate-50 text-slate-500'
                      }`}>
                      {stats.doituong.diffPrev > 0 ? <TrendingUp className="w-3 h-3 text-red-500" /> : stats.doituong.diffPrev < 0 ? <TrendingDown className="w-3 h-3 text-emerald-500" /> : null}
                      <span>
                        {stats.doituong.diffPrev > 0 ? '+' : ''}{stats.doituong.diffPrev} ({stats.doituong.pctPrev.toFixed(0)}%)
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="text-[9px] text-slate-400 font-semibold uppercase">Kỳ báo cáo:</span>
                    <span className="px-2 py-0.5 bg-slate-50 text-slate-500 border border-slate-100 rounded text-[9px] font-bold">
                      {getCurrentPeriodLabel()}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* KPI: ĐIỂM NÓNG */}
            <div
              onClick={() => handleOpenListModal(`Thống kê Điểm nóng - ${getCurrentPeriodLabel()}`, 'diemnong-list', data.diemnong)}
              className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-red-300 hover:bg-red-50/10 cursor-pointer transition-all relative overflow-hidden group"
            >
              <div className="absolute right-4 top-4 bg-[#b91c1c]/10 text-[#b91c1c] p-2 rounded-xl group-hover:scale-105 transition-transform">
                <Flame className="w-4 h-4" />
              </div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Điểm nóng an ninh</span>
              <div className="mt-2.5 flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-slate-800 leading-none">{stats.diemnong.current}</span>
                <span className="text-[9px] text-slate-400 font-semibold">điểm</span>
              </div>
              <div className="mt-3.5 pt-3 border-t border-slate-50 flex items-center justify-between">
                {prevPeriodInfo.hasComparison ? (
                  <>
                    <span className="text-[9px] text-slate-400 font-semibold uppercase">So với kỳ trước:</span>
                    <div className={`flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold ${stats.diemnong.diffPrev > 0
                      ? 'bg-red-50 text-red-650'
                      : stats.diemnong.diffPrev < 0
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-slate-50 text-slate-500'
                      }`}>
                      {stats.diemnong.diffPrev > 0 ? <TrendingUp className="w-3 h-3 text-red-500" /> : stats.diemnong.diffPrev < 0 ? <TrendingDown className="w-3 h-3 text-emerald-500" /> : null}
                      <span>
                        {stats.diemnong.diffPrev > 0 ? '+' : ''}{stats.diemnong.diffPrev} ({stats.diemnong.pctPrev.toFixed(0)}%)
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="text-[9px] text-slate-400 font-semibold uppercase">Kỳ báo cáo:</span>
                    <span className="px-2 py-0.5 bg-slate-50 text-slate-500 border border-slate-100 rounded text-[9px] font-bold">
                      {getCurrentPeriodLabel()}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* KPI: CƠ SỞ KINH DOANH */}
            <div
              onClick={() => handleOpenListModal(`Thống kê Cơ sở Kinh doanh - ${getCurrentPeriodLabel()}`, 'cskd-list', data.cskd)}
              className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-pink-200 hover:bg-pink-50/10 cursor-pointer transition-all relative overflow-hidden group"
            >
              <div className="absolute right-4 top-4 bg-[#be185d]/10 text-[#be185d] p-2 rounded-xl group-hover:scale-105 transition-transform">
                <Store className="w-4 h-4" />
              </div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Cơ sở kinh doanh quản lý</span>
              <div className="mt-2.5 flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-slate-800 leading-none">{stats.cskd.current}</span>
                <span className="text-[9px] text-slate-400 font-semibold">cơ sở</span>
              </div>
              <div className="mt-3.5 pt-3 border-t border-slate-50 flex items-center justify-between">
                {prevPeriodInfo.hasComparison ? (
                  <>
                    <span className="text-[9px] text-slate-400 font-semibold uppercase">So với kỳ trước:</span>
                    <div className={`flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold ${stats.cskd.diffPrev > 0
                      ? 'bg-emerald-50 text-emerald-600'
                      : stats.cskd.diffPrev < 0
                        ? 'bg-red-50 text-red-650'
                        : 'bg-slate-50 text-slate-500'
                      }`}>
                      {stats.cskd.diffPrev > 0 ? <ArrowUpRight className="w-3 h-3 text-emerald-600" /> : stats.cskd.diffPrev < 0 ? <ArrowDownRight className="w-3 h-3 text-red-500" /> : null}
                      <span>
                        {stats.cskd.diffPrev > 0 ? '+' : ''}{stats.cskd.diffPrev} ({stats.cskd.pctPrev.toFixed(0)}%)
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="text-[9px] text-slate-400 font-semibold uppercase">Kỳ báo cáo:</span>
                    <span className="px-2 py-0.5 bg-slate-50 text-slate-500 border border-slate-100 rounded text-[9px] font-bold">
                      {getCurrentPeriodLabel()}
                    </span>
                  </>
                )}
              </div>
            </div>

          </div>

          {/* Section: Extra counters */}
          <div className="space-y-2 text-left">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
              Tổng số đối tượng hiện có trên hệ thống (Theo toàn thời gian)
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              <div
                onClick={() => handleOpenListModal('Danh sách Camera (Toàn thời gian)', 'camera-list', data.camera, false)}
                className="bg-slate-50 rounded-xl px-3.5 py-2 flex items-center gap-2.5 border border-slate-100/60 cursor-pointer hover:bg-orange-50 hover:border-orange-200 hover:shadow-sm transition-all"
              >
                <Cctv className="w-4 h-4 text-[#ea580c] shrink-0" />
                <div>
                  <span className="text-[8px] font-bold text-slate-400 uppercase block">Tổng Camera</span>
                  <span className="text-xs font-bold text-slate-700">{stats.totals.camera}</span>
                </div>
              </div>
              <div
                onClick={() => handleOpenListModal('Danh sách Cơ quan nhà nước (Toàn thời gian)', 'coquan-list', data.coquan, false)}
                className="bg-slate-50 rounded-xl px-3.5 py-2 flex items-center gap-2.5 border border-slate-100/60 cursor-pointer hover:bg-slate-100 hover:border-slate-300 hover:shadow-sm transition-all"
              >
                <Building2 className="w-4 h-4 text-[#475569] shrink-0" />
                <div>
                  <span className="text-[8px] font-bold text-slate-400 uppercase block">Cơ quan nhà nước</span>
                  <span className="text-xs font-bold text-slate-700">{stats.totals.coquan}</span>
                </div>
              </div>
              <div
                onClick={() => handleOpenListModal('Danh sách Tuyến tuần tra (Toàn thời gian)', 'tuyenduong-list', data.tuyenduong, false)}
                className="bg-slate-50 rounded-xl px-3.5 py-2 flex items-center gap-2.5 border border-slate-100/60 cursor-pointer hover:bg-emerald-50 hover:border-emerald-200 hover:shadow-sm transition-all"
              >
                <Route className="w-4 h-4 text-[#22c55e] shrink-0" />
                <div>
                  <span className="text-[8px] font-bold text-slate-400 uppercase block">Tuyến tuần tra</span>
                  <span className="text-xs font-bold text-slate-700">{stats.totals.tuyenduong}</span>
                </div>
              </div>
              <div
                onClick={() => handleOpenListModal('Danh sách Vụ việc (Toàn thời gian)', 'vuviec-list', data.vuviec, false)}
                className="bg-slate-50 rounded-xl px-3.5 py-2 flex items-center gap-2.5 border border-slate-100/60 cursor-pointer hover:bg-red-50 hover:border-red-200 hover:shadow-sm transition-all"
              >
                <AlertTriangle className="w-4 h-4 text-[#dc2626] shrink-0" />
                <div>
                  <span className="text-[8px] font-bold text-slate-400 uppercase block">Vụ việc</span>
                  <span className="text-xs font-bold text-slate-700">{stats.totals.vuviec}</span>
                </div>
              </div>
              <div
                onClick={() => handleOpenListModal('Danh sách Đối tượng (Toàn thời gian)', 'doituong-list', data.doituong, false)}
                className="bg-slate-50 rounded-xl px-3.5 py-2 flex items-center gap-2.5 border border-slate-100/60 cursor-pointer hover:bg-purple-50 hover:border-purple-200 hover:shadow-sm transition-all"
              >
                <User className="w-4 h-4 text-[#7c3aed] shrink-0" />
                <div>
                  <span className="text-[8px] font-bold text-slate-400 uppercase block">Tổng đối tượng</span>
                  <span className="text-xs font-bold text-slate-700">{stats.totals.doituong}</span>
                </div>
              </div>
              <div
                onClick={() => handleOpenListModal('Danh sách Điểm nóng (Toàn thời gian)', 'diemnong-list', data.diemnong, false)}
                className="bg-slate-50 rounded-xl px-3.5 py-2 flex items-center gap-2.5 border border-slate-100/60 cursor-pointer hover:bg-rose-50 hover:border-rose-200 hover:shadow-sm transition-all"
              >
                <Flame className="w-4 h-4 text-[#b91c1c] shrink-0" />
                <div>
                  <span className="text-[8px] font-bold text-slate-400 uppercase block">Điểm nóng an ninh</span>
                  <span className="text-xs font-bold text-slate-700">{stats.totals.diemnong}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Main Charts */}
          <div className="grid grid-cols-1 gap-6">

            {/* CHART 1: COMPARATIVE BAR CHART */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between relative">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-sky-600" />
                  <h3 className="text-[11px] font-bold text-slate-800 uppercase tracking-wide">
                    {prevPeriodInfo.hasComparison ? "So sánh với kỳ trước" : "Số lượng theo danh mục"}
                  </h3>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 mb-3 text-[9px]">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded bg-sky-500"></span>
                  <span className="font-semibold text-slate-500 truncate" title={getCurrentPeriodLabel()}>
                    {getCurrentPeriodLabel()}
                  </span>
                </div>
                {prevPeriodInfo.hasComparison && (
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded bg-slate-300"></span>
                    <span className="font-semibold text-slate-500 truncate" title={getPrevPeriodLabel()}>
                      {getPrevPeriodLabel()}
                    </span>
                  </div>
                )}
              </div>

              {/* Chart SVG */}
              <div className="h-40 w-full relative">
                <svg className="w-full h-full" viewBox="0 0 800 120" preserveAspectRatio="none">
                  {/* Grid Lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((r, idx) => {
                    const y = 10 + r * 80;
                    const val = Math.round(maxCompValue * (1 - r));
                    return (
                      <g key={idx} className="opacity-15">
                        <line x1="30" y1={y} x2="770" y2={y} stroke="#cbd5e1" strokeWidth="0.5" strokeDasharray="3 3" />
                        <text x="5" y={y + 3} className="text-[7px] fill-slate-400 font-bold font-mono text-right">{val}</text>
                      </g>
                    );
                  })}

                  {/* Axis Line */}
                  <line x1="30" y1="90" x2="770" y2="90" stroke="#cbd5e1" strokeWidth="0.75" />

                  {/* Draw Bars */}
                  {compChartData.map((d, idx) => {
                    const hasComp = prevPeriodInfo.hasComparison;
                    const groupWidth = 190;
                    const groupX = 115 + idx * groupWidth;
                    const barWidth = hasComp ? 16 : 28;
                    const spacing = 4;

                    const curHeight = (d.cur / maxCompValue) * 80;
                    const curY = 90 - curHeight;
                    const curX = hasComp ? (groupX - barWidth - spacing) : (groupX - barWidth / 2);

                    const prevHeight = (d.prev / maxCompValue) * 80;
                    const prevY = 90 - prevHeight;
                    const prevX = groupX + spacing;

                    return (
                      <g key={idx}>
                        {/* Current Period Bar */}
                        <rect
                          x={curX}
                          y={curY}
                          width={barWidth}
                          height={Math.max(curHeight, 1.5)}
                          fill={d.color}
                          rx="0.5"
                          className="cursor-pointer hover:opacity-85 transition-opacity"
                          onMouseEnter={() => {
                            setHoveredBar({
                              entity: d.label,
                              type: 'current',
                              value: d.cur,
                              x: curX + barWidth / 2,
                              y: curY - 5
                            });
                          }}
                          onMouseLeave={() => setHoveredBar(null)}
                          onClick={() => {
                            const categoryMap: Record<string, { title: string; list: any[]; category: string }> = {
                              'Vụ việc': { title: `Danh sách Vụ việc - ${getCurrentPeriodLabel()}`, list: data.vuviec, category: 'vuviec-list' },
                              'Đối tượng': { title: `Danh sách Đối tượng - ${getCurrentPeriodLabel()}`, list: data.doituong, category: 'doituong-list' },
                              'Điểm nóng': { title: `Danh sách Điểm nóng - ${getCurrentPeriodLabel()}`, list: data.diemnong, category: 'diemnong-list' },
                              'Cơ sở KD': { title: `Danh sách Cơ sở Kinh doanh - ${getCurrentPeriodLabel()}`, list: data.cskd, category: 'cskd-list' }
                            };
                            const target = categoryMap[d.label];
                            if (target) {
                              handleOpenListModal(target.title, target.category, target.list, true);
                            }
                          }}
                        />

                        {/* Previous Period Bar */}
                        {hasComp && (
                          <rect
                            x={prevX}
                            y={prevY}
                            width={barWidth}
                            height={Math.max(prevHeight, 1.5)}
                            fill="#cbd5e1"
                            rx="0.5"
                            className="cursor-pointer hover:opacity-85 transition-opacity"
                            onMouseEnter={() => {
                              setHoveredBar({
                                  entity: d.label,
                                  type: 'previous',
                                  value: d.prev,
                                  x: prevX + barWidth / 2,
                                  y: prevY - 5
                              });
                            }}
                            onMouseLeave={() => setHoveredBar(null)}
                            onClick={() => {
                              const categoryMap: Record<string, { title: string; list: any[]; category: string }> = {
                                'Vụ việc': { title: `Danh sách Vụ việc - ${getPrevPeriodLabel()}`, list: data.vuviec, category: 'vuviec-list' },
                                'Đối tượng': { title: `Danh sách Đối tượng - ${getPrevPeriodLabel()}`, list: data.doituong, category: 'doituong-list' },
                                'Điểm nóng': { title: `Danh sách Điểm nóng - ${getPrevPeriodLabel()}`, list: data.diemnong, category: 'diemnong-list' },
                                'Cơ sở KD': { title: `Danh sách Cơ sở Kinh doanh - ${getPrevPeriodLabel()}`, list: data.cskd, category: 'cskd-list' }
                              };
                              const target = categoryMap[d.label];
                              if (target && prevPeriodInfo.hasComparison) {
                                handleOpenListModal(target.title, target.category, target.list, true, prevPeriodInfo.prevYear, prevPeriodInfo.prevVal);
                              }
                            }}
                          />
                        )}

                        {/* Label x-axis */}
                        <text
                          x={groupX}
                          y="105"
                          textAnchor="middle"
                          className="text-[7.5px] font-bold fill-slate-400"
                        >
                          {d.label}
                        </text>
                      </g>
                    );
                  })}

                  {/* SVG Tooltip */}
                  {hoveredBar && (() => {
                    const tooltipWidth = 95;
                    const tooltipHeight = 15;
                    const rectX = Math.max(2, Math.min(800 - tooltipWidth - 2, hoveredBar.x - tooltipWidth / 2));
                    const showBelow = hoveredBar.y - tooltipHeight - 4 < 2;
                    const rectY = showBelow ? (hoveredBar.y + 8) : (hoveredBar.y - tooltipHeight - 4);
                    return (
                      <g>
                        <rect
                          x={rectX}
                          y={rectY}
                          width={tooltipWidth}
                          height={tooltipHeight}
                          rx="3"
                          fill="rgba(15, 23, 42, 0.85)"
                        />
                        <text
                          x={rectX + tooltipWidth / 2}
                          y={rectY + 10}
                          textAnchor="middle"
                          className="text-[7px] fill-white font-bold"
                        >
                          {hoveredBar.entity}: {hoveredBar.value} {prevPeriodInfo.hasComparison ? (hoveredBar.type === 'current' ? '(Kỳ này)' : '(Kỳ trước)') : ''}
                        </text>
                      </g>
                    );
                  })()}
                </svg>
              </div>
            </div>

            {/* CHART 2: 6-MONTH TREND AREA CHART */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between relative">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-sky-600" />
                  <h3 className="text-[11px] font-bold text-slate-800 uppercase tracking-wide">Xu thế biến động 6 tháng</h3>
                </div>

                <select
                  className="bg-slate-50 border border-slate-100 text-[9px] font-bold text-slate-500 px-2 py-0.5 rounded outline-none cursor-pointer"
                  value={trendEntity}
                  onChange={(e) => setTrendEntity(e.target.value as any)}
                >
                  <option value="vuviec">Vụ việc</option>
                  <option value="doituong">Đối tượng</option>
                  <option value="diemnong">Điểm nóng</option>
                  <option value="cskd">Cơ sở KD</option>
                </select>
              </div>

              {/* Area Chart SVG */}
              <div className="h-40 w-full relative">
                {trendLineProps.points.length > 0 ? (
                  <svg className="w-full h-full" viewBox="0 0 800 110">
                    {/* Grid Lines aligned to axis */}
                    {[0, 0.33, 0.66, 1].map((r, idx) => {
                      const topPadding = trendLineProps.topPadding ?? 12;
                      const bottomPadding = trendLineProps.bottomPadding ?? 22;
                      const y = topPadding + r * (110 - topPadding - bottomPadding);
                      const val = Math.round(trendLineProps.maxVal * (1 - r));
                      return (
                        <g key={idx} className="opacity-15">
                          <line x1="15" y1={y} x2="770" y2={y} stroke="#64748b" strokeWidth="0.5" />
                          <text x="775" y={y + 2.5} className="text-[6.5px] fill-slate-400 font-bold font-mono">{val}</text>
                        </g>
                      );
                    })}

                    {/* Area Stroke line */}
                    <path d={trendLineProps.path} fill="none" stroke="#3b82f6" strokeWidth="1.5" />

                    {/* Grid circles */}
                    {trendLineProps.points.map((p, idx) => (
                      <g key={idx}>
                        <circle
                          cx={p.x}
                          cy={p.y}
                          r="3"
                          fill="#ffffff"
                          stroke="#3b82f6"
                          strokeWidth="1.5"
                          className="cursor-pointer hover:r-[4.5px] transition-all"
                          onMouseEnter={() => {
                            setHoveredTrendPoint({
                              monthName: p.label,
                              value: p.value,
                              x: p.x,
                              y: p.y - 6
                            });
                          }}
                          onMouseLeave={() => setHoveredTrendPoint(null)}
                          onClick={() => {
                            const entityMap: Record<string, { title: string; list: any[]; category: string }> = {
                              'vuviec': { title: 'Vụ việc', list: data.vuviec, category: 'vuviec-list' },
                              'doituong': { title: 'Đối tượng', list: data.doituong, category: 'doituong-list' },
                              'diemnong': { title: 'Điểm nóng', list: data.diemnong, category: 'diemnong-list' },
                              'cskd': { title: 'Cơ sở Kinh doanh', list: data.cskd, category: 'cskd-list' }
                            };
                            const target = entityMap[trendEntity];
                            if (target) {
                              handleOpenListModal(`Thống kê ${target.title} - ${p.label}`, target.category, target.list, true, p.year, p.month, 'month');
                            }
                          }}
                        />
                        <text x={p.x} y="104" textAnchor="middle" className="text-[7px] font-bold fill-slate-400">
                          {p.label}
                        </text>
                      </g>
                    ))}

                    {/* Tooltip Overlay */}
                    {hoveredTrendPoint && (() => {
                      const tooltipWidth = 60;
                      const tooltipHeight = 14;
                      const rectX = Math.max(2, Math.min(800 - tooltipWidth - 2, hoveredTrendPoint.x - tooltipWidth / 2));
                      const showBelow = hoveredTrendPoint.y - tooltipHeight - 4 < 2;
                      const rectY = showBelow ? (hoveredTrendPoint.y + 8) : (hoveredTrendPoint.y - tooltipHeight - 4);
                      return (
                        <g>
                          <rect
                            x={rectX}
                            y={rectY}
                            width={tooltipWidth}
                            height={tooltipHeight}
                            rx="3"
                            fill="rgba(15, 23, 42, 0.85)"
                          />
                          <text
                            x={rectX + tooltipWidth / 2}
                            y={rectY + 9}
                            textAnchor="middle"
                            className="text-[7px] fill-white font-bold"
                          >
                            Số lượng: {hoveredTrendPoint.value}
                          </text>
                        </g>
                      );
                    })()}
                  </svg>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400">Không có dữ liệu thời gian này</div>
                )}
              </div>
            </div>

            {/* CHART 3: DONUT CHART */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
              <div className="flex items-center gap-1.5 mb-4">
                <PieChart className="w-4 h-4 text-sky-600" />
                <h3 className="text-[11px] font-bold text-slate-800 uppercase tracking-wide">Cơ cấu Vụ việc nổi bật (Phường)</h3>
              </div>

              {donutSegments.length > 0 ? (
                <div className="flex items-center justify-between gap-3 h-40">
                  {/* SVG Donut Wrapper */}
                  <div className="w-32 h-32 shrink-0 relative flex items-center justify-center">
                    <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                      {donutSegments.map((seg, idx) => {
                        if (seg.isFullCircle) {
                          return (
                            <circle
                              key={idx}
                              cx="50"
                              cy="50"
                              r="38"
                              fill="none"
                              stroke={seg.color}
                              strokeWidth="11"
                              className="hover:stroke-[12.5] transition-all cursor-pointer"
                              onClick={() => handleOpenDonutList(seg.label)}
                            />
                          );
                        }
                        return (
                          <path
                            key={idx}
                            d={seg.pathData}
                            fill="none"
                            stroke={seg.color}
                            strokeWidth="11"
                            className="hover:stroke-[12.5] transition-all cursor-pointer"
                            onClick={() => handleOpenDonutList(seg.label)}
                          />
                        );
                      })}
                    </svg>
                    {/* Centered Total Label */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-[18px] font-black text-slate-800 leading-none">{totalIncidentsInPeriod}</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Vụ việc</span>
                    </div>
                  </div>

                  {/* Legends */}
                  <div className="flex-1 space-y-1.5 overflow-hidden pl-1">
                    {donutSegments.map((seg, idx) => (
                      <div 
                        key={idx} 
                        className="flex items-center justify-between text-[9px] overflow-hidden cursor-pointer hover:bg-slate-50 p-1 rounded-md transition-colors"
                        onClick={() => handleOpenDonutList(seg.label)}
                      >
                        <div className="flex items-center gap-1.5 overflow-hidden mr-1">
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: seg.color }}></span>
                          <span className="font-bold text-slate-500 truncate" title={seg.label}>{seg.label}</span>
                        </div>
                        <span className="font-black text-slate-700 shrink-0">
                          {seg.value} ({Math.round(seg.percentage * 100)}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-40 flex items-center justify-center text-xs text-slate-400">
                  Không có vụ việc nào trong thời gian này
                </div>
              )}
            </div>

          </div>


        </div>
      </motion.div>

      {/* Sub-modal: Counted Items List */}
      {activeListModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[2100] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-[24px] w-full max-w-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col border border-slate-100 animate-scale-up">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${getItemIconBg(activeListModal.category)}`}>
                  {getItemIcon(activeListModal.category)}
                </div>
                <div>
                  <h3 className="text-[13px] font-bold text-slate-800 uppercase tracking-wide">
                    {activeListModal.title}
                  </h3>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                    Tổng cộng: {activeListModal.items.length} bản ghi
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveListModal(null)}
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg transition-all cursor-pointer border border-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search filter */}
            <div className="px-6 py-3 border-b border-slate-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm nhanh trong danh sách..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-700 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all font-medium"
                  value={listSearch}
                  onChange={(e) => setListSearch(e.target.value)}
                />
              </div>
            </div>

            {/* List Body */}
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-slate-50/20 space-y-3 text-left">
              {activeListModal.items
                .filter(item => {
                  const q = listSearch.trim().toLowerCase();
                  if (!q) return true;
                  const name = getItemName(item, activeListModal.category).toLowerCase();
                  const desc = (item.mota || item.description || '').toLowerCase();
                  const extra = (item.loai || item.groupId || '').toLowerCase();
                  return name.includes(q) || desc.includes(q) || extra.includes(q);
                })
                .map((item, idx) => {
                  const name = getItemName(item, activeListModal.category);
                  const description = item.mota || item.description || '';
                  return (
                    <div
                      key={idx}
                      className="group flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100 hover:border-sky-300 hover:shadow-md transition-all shadow-sm"
                    >
                      <div className="flex-1 min-w-0 pr-4">
                        <span className="text-sm font-bold text-slate-750 block group-hover:text-sky-650 transition-colors truncate">
                          {name}
                        </span>
                        {renderItemMeta(item, activeListModal.category)}
                        {description && (
                          <p className="text-[10px] text-slate-400 mt-2 truncate line-clamp-1 italic">
                            {description}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          onSelectItem?.({ ...item, category: activeListModal.category });
                          setActiveListModal(null);
                        }}
                        className="shrink-0 flex items-center gap-1 px-3 py-2 bg-sky-50 hover:bg-sky-600 text-sky-600 hover:text-white font-bold text-[10px] rounded-xl transition-all cursor-pointer shadow-sm hover:shadow"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        <span>Xem</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}

              {activeListModal.items.length === 0 && (
                <div className="text-center py-10 text-xs text-slate-400">
                  Không có dữ liệu trong kỳ báo cáo này.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
