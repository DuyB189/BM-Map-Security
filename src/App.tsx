import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapIcon, Settings, Database, RefreshCw, CheckCircle, AlertTriangle, Trash2, RotateCcw, Check, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { GIS_DATA as INITIAL_DATA } from './constants';
import { GISData } from './types';
import { getSvgPath } from './utils/icons';

import TopBar from './components/TopBar';
import Sidebar from './components/Sidebar';
import AddFormModal from './components/AddFormModal';
import MapControls from './components/MapControls';
import DetailsModal from './components/DetailsModal';
import EditIncidentModal from './components/menus/VuViec/EditIncidentModal';
import ImportExcelModal from './components/menus/ImportExcelModal';
import EditCameraModal from './components/menus/Camera/EditCameraModal';
import EditDoiTuongModal from './components/menus/DoiTuong/EditDoiTuongModal';
import EditCoQuanModal from './components/menus/CoQuan/EditCoQuanModal';
import EditCskdModal from './components/menus/Cskd/EditCskdModal';
import EditDiemNongModal from './components/menus/DiemNong/EditDiemNongModal';
import EditTuyenDuongModal from './components/menus/TuyenDuong/EditTuyenDuongModal';

export default function App() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [data, setData] = useState<GISData>(INITIAL_DATA);

  // Load GIS data from offline database on startup
  useEffect(() => {
    // @ts-ignore
    if (window.ipcRenderer) {
      // @ts-ignore
      window.ipcRenderer.invoke('db:get-data')
        .then((savedData: GISData | null) => {
          if (savedData) {
            console.log('Loaded GIS data from offline database successfully:', savedData);
            // Sanitize old data to remove 'tuantra' from menu and lists
            let needsSave = false;
            if (savedData.menu) {
              const hasTuanTra = savedData.menu.some(m => m.id === 'menu-tuantra' || m.target === 'tuantra-list');
              if (hasTuanTra) {
                savedData.menu = INITIAL_DATA.menu;
                needsSave = true;
              }
            }
            if ('tuantra' in savedData) {
              delete (savedData as any).tuantra;
              needsSave = true;
            }
            setData(savedData);
            if (needsSave) {
              console.log('Sanitized old database state (removed patrol objects). Saving back to disk...');
              // @ts-ignore
              window.ipcRenderer.invoke('db:save-data', savedData)
                .catch((err: any) => console.error('Failed to save sanitized offline database:', err));
            }
          } else {
            console.log('No saved offline data found. Initializing with default GIS_DATA...');
            // First run: save current INITIAL_DATA to offline database
            // @ts-ignore
            window.ipcRenderer.invoke('db:save-data', INITIAL_DATA)
              .catch((err: any) => console.error('Failed to initialize offline database:', err));
          }
        })
        .catch((err: any) => {
          console.error('Error loading offline database:', err);
        });
    }
  }, []);

  // Save data helper for offline persistence
  const saveOfflineData = (updatedData: GISData) => {
    setData(updatedData);
    // @ts-ignore
    if (window.ipcRenderer) {
      // @ts-ignore
      window.ipcRenderer.invoke('db:save-data', updatedData)
        .catch((err: any) => console.error('Failed to save offline database:', err));
    }
  };

  const handleResetDatabase = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa sạch toàn bộ cơ sở dữ liệu GIS và thiết lập lại ứng dụng về trạng thái trống? Toàn bộ camera, vụ việc, đối tượng, cơ sở kinh doanh tự ghim sẽ bị xóa sạch.')) {
      saveOfflineData(INITIAL_DATA);
      setSelectedDetails(null);
      alert('Đã xóa sạch cơ sở dữ liệu và khôi phục cài đặt gốc thành công!');
    }
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const isAddingRef = useRef(false);
  const [selectedCoords, setSelectedCoords] = useState<[number, number] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '', category: 'vuviec-list', description: '', loai: '',
    mucdo: 'Trung bình', trangthai: 'Mới', xaphuong: 'Phường Bình Minh',
    thoigian: '', ketqua: '', groupId: '', chu_camera: '', sdt_chu: '',
    cccd: '', sdt: '',
    mst: '', loai_hinh_kd: 'Hộ kinh doanh cá thể', giay_phep: '',
    chu_co_so: '', chu_ngaysinh: '', chu_cccd: '', chu_sdt: '', chu_diachi: '',
    quan_ly: '', quan_ly_ngaysinh: '', quan_ly_cccd: '', quan_ly_sdt: '', quan_ly_diachi: '',
    radius: 300
  });
  const [isMenuOpen, setIsMenuOpen] = useState(true);
  const [hiddenLayers, setHiddenLayers] = useState<string[]>([]);
  const [visibleCounts, setVisibleCounts] = useState<Record<string, number>>({});
  const [isLocationMenuOpen, setIsLocationMenuOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedDetails, setSelectedDetails] = useState<any | null>(null);
  const [tileVersion, setTileVersion] = useState(1);
  const [tileServerUrl, setTileServerUrl] = useState<string | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  const [editIncidentData, setEditIncidentData] = useState<any | null>(null);
  const [editCameraData, setEditCameraData] = useState<any | null>(null);
  const [editDoiTuongData, setEditDoiTuongData] = useState<any | null>(null);
  const [editCoQuanData, setEditCoQuanData] = useState<any | null>(null);
  const [editCskdData, setEditCskdData] = useState<any | null>(null);
  const [editDiemNongData, setEditDiemNongData] = useState<any | null>(null);
  const [editTuyenDuongData, setEditTuyenDuongData] = useState<any | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);
  const [isEditingRouteCoords, setIsEditingRouteCoords] = useState(false);
  const [pendingEditTuyenDuongData, setPendingEditTuyenDuongData] = useState<any | null>(null);

  const isEditingRouteCoordsRef = useRef(false);
  useEffect(() => {
    isEditingRouteCoordsRef.current = isEditingRouteCoords;
  }, [isEditingRouteCoords]);

  // Keep ref to data up to date for map callbacks
  const dataRef = useRef<GISData>(data);
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // Sync ref with state for map click closure
  useEffect(() => {
    isAddingRef.current = isAdding;
  }, [isAdding]);

  // Synchronize refs for route drawing on map click
  const showFormRef = useRef(false);
  const formDataRef = useRef<any>({});
  useEffect(() => {
    showFormRef.current = showForm;
    formDataRef.current = formData;
  }, [showForm, formData]);

  // Automatically initialize and reset route coordinates when drawing routes
  useEffect(() => {
    if (showForm && formData.category === 'tuyenduong-list') {
      if (selectedCoords && routeCoordinates.length === 0) {
        setRouteCoordinates([selectedCoords]);
      }
    } else if (!isEditingRouteCoords) {
      setRouteCoordinates([]);
    }
  }, [showForm, formData.category, selectedCoords, isEditingRouteCoords]);

  // Draw temporary route path and vertex circles on the map in real-time
  useEffect(() => {
    if (!map.current) return;

    const sourceId = 'temp-route';
    const layerId = 'temp-route-line';
    const pointsLayerId = 'temp-route-points';

    const drawTempRoute = () => {
      if (!map.current || !map.current.isStyleLoaded()) return;

      try {
        if ((formData.category === 'tuyenduong-list' || isEditingRouteCoords) && routeCoordinates.length > 0) {
          const geojson: any = {
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                geometry: {
                  type: 'LineString',
                  coordinates: routeCoordinates
                },
                properties: {}
              },
              ...routeCoordinates.map((coord, idx) => ({
                type: 'Feature',
                geometry: {
                  type: 'Point',
                  coordinates: coord
                },
                properties: {
                  index: idx + 1
                }
              }))
            ]
          };

          if (map.current.getSource(sourceId)) {
            (map.current.getSource(sourceId) as maplibregl.GeoJSONSource).setData(geojson);
          } else {
            map.current.addSource(sourceId, {
              type: 'geojson',
              data: geojson
            });

            map.current.addLayer({
              id: layerId,
              type: 'line',
              source: sourceId,
              filter: ['==', '$type', 'LineString'],
              layout: { 'line-join': 'round', 'line-cap': 'round' },
              paint: {
                'line-color': '#0284c7', // Sky 600
                'line-width': 4,
                'line-dasharray': [2, 1],
                'line-opacity': 0.8
              }
            });

            map.current.addLayer({
              id: pointsLayerId,
              type: 'circle',
              source: sourceId,
              filter: ['==', '$type', 'Point'],
              paint: {
                'circle-radius': 6,
                'circle-color': '#0284c7',
                'circle-stroke-width': 2,
                'circle-stroke-color': '#ffffff'
              }
            });
          }
        } else {
          if (map.current.getLayer(layerId)) map.current.removeLayer(layerId);
          if (map.current.getLayer(pointsLayerId)) map.current.removeLayer(pointsLayerId);
          if (map.current.getSource(sourceId)) map.current.removeSource(sourceId);
        }
      } catch (err) {
        console.warn('Temporary route layer draw error:', err);
      }
    };

    if (map.current.isStyleLoaded()) {
      drawTempRoute();
    } else {
      map.current.once('styledata', drawTempRoute);
    }
  }, [routeCoordinates, formData.category, isEditingRouteCoords]);

  // Automatically close DetailsModal when switching active menu category / object type
  useEffect(() => {
    setSelectedDetails(null);
  }, [activeMenu]);

  const markersRef = useRef<{ marker: maplibregl.Marker, id: string | number, category: string }[]>([]);

  // Fetch tile server URL first
  useEffect(() => {
    // @ts-ignore
    if (window.ipcRenderer) {
      // Use standard custom mbtiles:// protocol which serves phuongbinhminh.mbtiles directly
      setTileServerUrl(`mbtiles://tiles/{z}/{x}/{y}?v=${tileVersion}`);
    } else {
      // Fallback for non-electron environment (browser testing)
      setTileServerUrl('https://a.tile.openstreetmap.org/{z}/{x}/{y}.png');
    }
  }, [tileVersion]);

  const handleUpdateMap = async (): Promise<{ success: boolean; reason?: string }> => {
    // @ts-ignore
    if (window.ipcRenderer) {
      try {
        // @ts-ignore
        const result = await window.ipcRenderer.invoke('db:update-map');
        if (result.success) {
          // Update tile version to force-refresh the Maplibre map
          setTileVersion(prev => prev + 1);
          return { success: true };
        } else {
          return { success: false, reason: result.reason || 'cancelled' };
        }
      } catch (err: any) {
        console.error('Error invoking db:update-map:', err);
        return { success: false, reason: err.message || 'unknown_error' };
      }
    }
    return { success: false, reason: 'Không tìm thấy môi trường Electron' };
  };

  const [showSettings, setShowSettings] = useState(false);
  const [mapStatus, setMapStatus] = useState<{
    exists: boolean;
    path: string;
    sizeBytes: number;
    modifiedTime: any;
    isLoaded: boolean;
  } | null>(null);
  const [isUpdatingMap, setIsUpdatingMap] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<{ text: string; isError: boolean } | null>(null);

  useEffect(() => {
    // @ts-ignore
    if (window.ipcRenderer) {
      // @ts-ignore
      window.ipcRenderer.invoke('get-map-status').then((status: any) => {
        setMapStatus(status);
      }).catch((e: any) => console.error('Error fetching map status:', e));
    }
  }, []);

  const triggerUpdateMap = async () => {
    setIsUpdatingMap(true);
    setUpdateMessage(null);
    try {
      const res = await handleUpdateMap();
      if (res.success) {
        setUpdateMessage({ text: 'Cập nhật bản đồ thành công!', isError: false });
        // @ts-ignore
        if (window.ipcRenderer) {
          // @ts-ignore
          const status = await window.ipcRenderer.invoke('get-map-status');
          setMapStatus(status);
        }
      } else if (res.reason !== 'cancelled') {
        setUpdateMessage({ text: `Lỗi: ${res.reason || 'Thất bại'}`, isError: true });
      }
    } catch (e: any) {
      setUpdateMessage({ text: `Lỗi: ${e.message || 'Hệ thống bận'}`, isError: true });
    } finally {
      setIsUpdatingMap(false);
      setTimeout(() => setUpdateMessage(null), 4000);
    }
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainer.current || !tileServerUrl) return;

    setIsMapReady(false); // Reset map ready state on initialization

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: [tileServerUrl],
            tileSize: 256
          }
        },
        layers: [
          { id: 'osm', type: 'raster', source: 'osm' }
        ]
      },
      center: [106.1183077, 11.3387817], // Tọa độ trung tâm Phường Bình Minh
      zoom: 12.8,
      minZoom: 11.8,
      maxZoom: 18,
      maxBounds: [
        [106.04, 11.27], // Góc Tây Nam (Tây Ninh)
        [106.24, 11.45]  // Góc Đông Bắc (Tây Ninh)
      ]
    });

    map.current.on('load', () => {
      setIsMapReady(true);
      updateLayers();

      // Add sovereignty markers for Hoàng Sa and Trường Sa
      const addSovereigntyMarker = (lng: number, lat: number, name: string) => {
        const el = document.createElement('div');
        el.className = 'flex flex-col items-center justify-center gap-1 opacity-90 hover:opacity-100 transition-opacity cursor-pointer z-[1000]';
        el.innerHTML = `
          <div class="w-8 h-5 bg-red-600 shadow-sm flex items-center justify-center border border-white/80 rounded-sm">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="w-3 h-3 text-yellow-400 fill-current"><path d="M256 14.316L311.026 168.5h164.811L342.58 265.485 393.593 419.684 256 322.684 118.407 419.684 169.42 265.485 36.163 168.5h164.81L256 14.316z"/></svg>
          </div>
          <span class="text-[8px] font-black text-red-600 bg-white/90 px-1.5 py-0.5 rounded shadow-sm border border-red-100 whitespace-nowrap uppercase tracking-wider">${name}</span>
        `;
        new maplibregl.Marker({ element: el })
          .setLngLat([lng, lat])
          .addTo(map.current!);
      };

      // Hoàng Sa (Paracel Islands)
      addSovereigntyMarker(111.603, 16.536, 'Quần đảo Hoàng Sa (Việt Nam)');
      // Trường Sa (Spratly Islands)
      addSovereigntyMarker(114.288, 9.878, 'Quần đảo Trường Sa (Việt Nam)');
    });

    map.current.on('styledata', () => {
      // Re-add layers when style changes (e.g. satellite toggle)
      updateLayers();
    });

    map.current.on('click', (e) => {
      // Logic for adding new GIS point
      if (isAddingRef.current) {
        console.log('Map clicked while adding:', e.lngLat);
        setSelectedCoords([e.lngLat.lng, e.lngLat.lat]);
        setShowForm(true);
        setIsAdding(false);
      } else if (isEditingRouteCoordsRef.current) {
        const newPoint: [number, number] = [e.lngLat.lng, e.lngLat.lat];
        setRouteCoordinates(prev => [...prev, newPoint]);
      } else if (showFormRef.current && formDataRef.current.category === 'tuyenduong-list') {
        const newPoint: [number, number] = [e.lngLat.lng, e.lngLat.lat];
        setRouteCoordinates(prev => [...prev, newPoint]);
      } else {
        // Query rendered features to see if the user clicked on a Route Line!
        const features = map.current!.queryRenderedFeatures(e.point);
        const routeFeature = features.find(f => f.layer.id.startsWith('route-'));
        if (routeFeature) {
          const routeId = parseInt(routeFeature.layer.id.replace('route-', ''));
          const route = dataRef.current.tuyenduong.find(t => t.id === routeId);
          if (route) {
            const color = route.mucdo === 'Rất cao' ? '#dc2626' : (route.mucdo === 'Cao' ? '#f97316' : '#22c55e');
            const iconName = 'MapPin';

            let statusBadge = `<span class="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${route.mucdo === 'Rất cao' ? 'bg-red-100 text-red-700' : (route.mucdo === 'Cao' ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700')
              }">${route.mucdo || 'Trung bình'}</span>`;

            const popupHtml = `
              <div class="w-[240px] overflow-hidden flex flex-col font-sans">
                <!-- Header -->
                <div class="px-4 py-3 relative overflow-hidden" style="background: linear-gradient(135deg, ${color}CC, ${color});">
                  <div class="absolute -right-4 -top-4 opacity-20 transform scale-150 pointer-events-none">
                    <svg viewBox="0 0 24 24" width="64" height="64" stroke="white" stroke-width="2" fill="none">${getSvgPath(iconName)}</svg>
                  </div>
                  <div class="relative z-10 flex flex-col gap-1">
                    <div class="flex items-center gap-2">
                      <div class="bg-white/20 p-1 rounded-lg backdrop-blur-md">
                        <svg viewBox="0 0 24 24" width="14" height="14" stroke="white" stroke-width="2" fill="none">${getSvgPath(iconName)}</svg>
                      </div>
                      <span class="text-[9px] text-white/90 font-bold uppercase tracking-widest">Tuyến đường</span>
                    </div>
                    <h3 class="font-bold text-white text-[14px] leading-tight drop-shadow-sm mt-1">${route.ten}</h3>
                    <div class="mt-1">${statusBadge}</div>
                  </div>
                </div>

                <!-- Body -->
                <div class="p-4 bg-white flex flex-col gap-1">
                  <div class="flex justify-between items-center py-1.5 border-b border-slate-50 last:border-0">
                    <span class="text-[10px] text-slate-400 font-medium">Phân loại</span>
                    <span class="text-[11px] text-slate-700 font-bold text-right truncate max-w-[130px]" title="${route.loai || ''}">${route.loai || 'Tuyến tuần tra'}</span>
                  </div>
                  <div class="flex justify-between items-center py-1.5 border-b border-slate-50 last:border-0">
                    <span class="text-[10px] text-slate-400 font-medium">Đặc điểm</span>
                    <span class="text-[11px] text-slate-700 font-bold text-right">${route.coordinates?.length || 0} điểm tọa độ</span>
                  </div>
                  
                </div>

                <!-- Footer Actions -->
                <div class="px-4 py-2.5 bg-slate-50 flex items-center justify-between border-t border-slate-100">
                  <button 
                    class="text-[10px] text-sky-600 hover:text-sky-700 font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    onclick="handleViewDetailsGis('${route.id}', 'tuyenduong-list')"
                  >
                    <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    Chi tiết
                  </button>
                  <button 
                    class="text-[10px] text-red-500 hover:text-red-600 transition-colors flex items-center gap-1 font-bold cursor-pointer" 
                    onclick="handleDeleteGis('${route.id}', 'tuyenduong-list')"
                  >
                    <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                    Xóa
                  </button>
                </div>
              </div>
            `;

            new maplibregl.Popup({
              closeButton: false,
              className: 'custom-popup'
            })
              .setLngLat(e.lngLat)
              .setHTML(popupHtml)
              .addTo(map.current!);
          }
        }
      }
    });

    return () => {
      setIsMapReady(false); // Reset map ready state on cleanup
      if (map.current) map.current.remove();
    };
  }, [tileServerUrl]);

  // Update Layers (Circles & Lines)
  const updateLayers = () => {
    if (!map.current || !map.current.isStyleLoaded()) return;

    // Hotspots Circles
    data.diemnong.forEach(item => {
      const sourceId = `hotspot-${item.id}`;
      try {
        if (map.current!.getLayer(sourceId)) map.current!.removeLayer(sourceId);
        if (map.current!.getLayer(`${sourceId}-border`)) map.current!.removeLayer(`${sourceId}-border`);
        if (map.current!.getSource(sourceId)) map.current!.removeSource(sourceId);

        if (hiddenLayers.includes('diemnong-list')) return;

        const color = item.mucdo === 'Rất cao' ? '#dc2626' : (item.mucdo === 'Cao' ? '#ef4444' : '#f59e0b');

        const points: [number, number][] = [];
        const steps = 64;
        for (let i = 0; i <= steps; i++) {
          const angle = (i * 360 / steps) * Math.PI / 180;
          const dx = item.radius * Math.cos(angle);
          const dy = item.radius * Math.sin(angle);
          const lng = item.lng + dx / (111320 * Math.cos(item.lat * Math.PI / 180));
          const lat = item.lat + dy / 110540;
          points.push([lng, lat]);
        }

        map.current!.addSource(sourceId, {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: { type: 'Polygon', coordinates: [points] }
          }
        });

        map.current!.addLayer({
          id: sourceId,
          type: 'fill',
          source: sourceId,
          paint: { 'fill-color': color, 'fill-opacity': 0.1 }
        });

        map.current!.addLayer({
          id: `${sourceId}-border`,
          type: 'line',
          source: sourceId,
          paint: { 'line-color': color, 'line-width': 1.5, 'line-dasharray': [2, 2], 'line-opacity': 0.5 }
        });
      } catch (e) {
        console.warn('Style logic error:', e);
      }
    });

    // Tuyến đường (Lines)
    data.tuyenduong.forEach(item => {
      if (item.type !== 'line') return;
      const sourceId = `route-${item.id}`;
      try {
        if (map.current!.getLayer(sourceId)) map.current!.removeLayer(sourceId);
        if (map.current!.getSource(sourceId)) map.current!.removeSource(sourceId);

        if (hiddenLayers.includes('tuyenduong-list')) return;

        const color = item.mucdo === 'Rất cao' ? '#dc2626' : (item.mucdo === 'Cao' ? '#f97316' : '#22c55e');

        map.current!.addSource(sourceId, {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: { type: 'LineString', coordinates: item.coordinates }
          }
        });

        map.current!.addLayer({
          id: sourceId,
          type: 'line',
          source: sourceId,
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': color, 'line-width': 4, 'line-opacity': 0.7 }
        });
      } catch (e) {
        console.warn('Route layer error:', e);
      }
    });
  };

  // Update Markers and Layers whenever data changes
  useEffect(() => {
    if (map.current && isMapReady) {
      if (map.current.isStyleLoaded()) {
        refreshMarkers();
        updateLayers();
      } else {
        map.current.once('styledata', () => {
          refreshMarkers();
          updateLayers();
        });
      }
    }
  }, [data, hiddenLayers, isMapReady]);


  const createMarker = (lngLat: [number, number], iconName: string, color: string, title: string, details: Record<string, string>, id: string | number, category: string) => {
    const el = document.createElement('div');
    el.className = 'custom-marker';
    el.innerHTML = `
      <div class="marker-inner">
        <div class="marker-pin" style="background: ${color};">
          <div style="color: white; width: 16px; height: 16px;">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">${getSvgPath(iconName)}</svg>
          </div>
        </div>
        <div class="marker-arrow"></div>
      </div>
    `;

    let statusBadge = '';
    const badgeKeys = ['Mức độ', 'Cảnh báo', 'Trạng thái'];
    badgeKeys.forEach(k => {
      if (details[k]) {
        const val = details[k];
        let bg = 'bg-slate-100 text-slate-600';
        if (val === 'Rất cao') bg = 'bg-red-100 text-red-700';
        else if (val === 'Cao') bg = 'bg-orange-100 text-orange-700';
        else if (val === 'Hoạt động' || val === 'Đang hoạt động' || val === 'Đã giải quyết') bg = 'bg-emerald-100 text-emerald-700';
        else if (val === 'Đang xử lý') bg = 'bg-amber-100 text-amber-700';
        else if (val === 'Tạm ngưng') bg = 'bg-rose-100 text-rose-700';
        statusBadge = `<span class="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${bg}">${val}</span>`;
        delete details[k];
      }
    });

    const detailsHtml = Object.entries(details)
      .filter(([_, val]) => val)
      .map(([key, val]) => `
        <div class="flex justify-between items-center py-1.5 border-b border-slate-50 last:border-0">
          <span class="text-[10px] text-slate-400 font-medium">${key}</span>
          <span class="text-[11px] text-slate-700 font-bold text-right truncate max-w-[130px]" title="${val}">${val}</span>
        </div>
      `).join('');

    const popupHtml = `
      <div class="w-[240px] overflow-hidden flex flex-col font-sans">
        <!-- Header -->
        <div class="px-4 py-3 relative overflow-hidden" style="background: linear-gradient(135deg, ${color}CC, ${color});">
          <div class="absolute -right-4 -top-4 opacity-20 transform scale-150 pointer-events-none">
            <svg viewBox="0 0 24 24" width="64" height="64" stroke="white" stroke-width="2" fill="none">${getSvgPath(iconName)}</svg>
          </div>
          <div class="relative z-10 flex flex-col gap-1">
            <div class="flex items-center gap-2">
              <div class="bg-white/20 p-1 rounded-lg backdrop-blur-md">
                <svg viewBox="0 0 24 24" width="14" height="14" stroke="white" stroke-width="2" fill="none">${getSvgPath(iconName)}</svg>
              </div>
              <span class="text-[9px] text-white/90 font-bold uppercase tracking-widest">${category.split('-')[0]}</span>
            </div>
            <h3 class="font-bold text-white text-[14px] leading-tight drop-shadow-sm mt-1">${title}</h3>
            ${statusBadge ? `<div class="mt-1">${statusBadge}</div>` : ''}
          </div>
        </div>

        <!-- Body -->
        <div class="p-4 bg-white flex flex-col gap-1">
          ${detailsHtml}
          
          <div class="flex justify-between items-center py-1.5 border-b border-slate-50 last:border-0">
            <span class="text-[10px] text-slate-400 font-medium">Tọa độ</span>
            <span class="text-[10px] text-slate-500 font-mono bg-slate-50 px-1.5 py-0.5 rounded-md border border-slate-100">${lngLat[0].toFixed(5)}, ${lngLat[1].toFixed(5)}</span>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="px-4 py-2.5 bg-slate-50 flex items-center justify-between border-t border-slate-100">
          <button 
            class="text-[10px] text-sky-600 hover:text-sky-700 font-bold flex items-center gap-1 transition-colors"
            onclick="handleViewDetailsGis('${id}', '${category}')"
          >
            <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            Chi tiết
          </button>
          <button 
            class="text-[10px] text-red-500 hover:text-red-600 transition-colors flex items-center gap-1 font-bold" 
            onclick="handleDeleteGis('${id}', '${category}')"
          >
            <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
            Xóa
          </button>
        </div>
      </div>
    `;

    const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
      .setLngLat(lngLat)
      .setPopup(new maplibregl.Popup({
        offset: [0, -40],
        closeButton: false,
        className: 'custom-popup'
      }).setHTML(popupHtml))
      .addTo(map.current!);

    // Ensure only 1 popup is open when clicking this marker
    el.addEventListener('click', () => {
      markersRef.current.forEach(m => {
        if (m.marker !== marker && m.marker.getPopup()?.isOpen()) {
          m.marker.getPopup()?.remove();
        }
      });
    });

    markersRef.current.push({ marker, id, category });
  };

  const refreshMarkers = () => {
    markersRef.current.forEach(m => m.marker.remove());
    markersRef.current = [];

    // Map through categories and create markers
    if (!hiddenLayers.includes('xa-list')) data.xaphuong.forEach(item => createMarker([item.lng, item.lat], 'MapPin', '#0284c7', item.ten_xa, { 'Phân loại': item.loai }, item.ten_xa, 'xa-list'));
    if (!hiddenLayers.includes('vuviec-list')) data.vuviec.forEach(item => createMarker([item.lng, item.lat], 'AlertTriangle', '#dc2626', item.loai, {
      'Thời gian': item.thoigian || '',
      'Trạng thái': item.trangthai || '',
      'Kết quả': item.ketqua || '',
      'Mô tả': item.mota || '',
      'Nhóm vụ việc': item.groupId || ''
    }, item.id || item.loai, 'vuviec-list'));
    if (!hiddenLayers.includes('camera-list')) data.camera.forEach(item => createMarker([item.lng, item.lat], 'Cctv', '#ea580c', item.ten, { 'Chủ camera': item.chu_camera || '', 'Số điện thoại': item.sdt_chu || '', 'Mô tả': item.description || '', 'Trạng thái': item.trangthai || 'Hoạt động' }, item.id || item.ten, 'camera-list'));
    if (!hiddenLayers.includes('doituong-list')) data.doituong.forEach(item => createMarker([item.lng, item.lat], 'User', '#7c3aed', item.hoten, { 'Loại đối tượng': item.loai || 'Chưa phân loại', 'Số CCCD': item.cccd || '', 'Số điện thoại': item.sdt || '', 'Mô tả': item.mota || '' }, item.id || item.hoten, 'doituong-list'));
    if (!hiddenLayers.includes('coquan-list')) data.coquan.forEach(item => createMarker([item.lng, item.lat], 'Building2', '#475569', item.ten, { 'Loại': item.loai, 'Địa bàn': item.xaphuong }, item.ten, 'coquan-list'));
    if (!hiddenLayers.includes('cskd-list')) data.cskd.forEach(item => createMarker([item.lng, item.lat], 'Store', '#be185d', item.ten, {
      'Ngành nghề': item.loai || 'Chưa rõ',
      'Mã số thuế': item.mst || '',
      'Chủ cơ sở': item.chu_co_so || '',
      'SĐT liên hệ': item.chu_sdt || '',
      'Trạng thái': item.trangthai || 'Đang hoạt động'
    }, item.ten, 'cskd-list'));
    if (!hiddenLayers.includes('diemnong-list')) data.diemnong.forEach(item => createMarker([item.lng, item.lat], 'Flame', '#b91c1c', item.ten, {
      'Loại': item.loai || '',
      'Mức độ': item.mucdo || 'Trung bình',
      'Địa bàn': item.xaphuong || '',
      'Bán kính': item.radius ? `${item.radius}m` : '300m',
      'Mô tả': item.mota || ''
    }, item.id, 'diemnong-list'));

    // Add point routes
    if (!hiddenLayers.includes('tuyenduong-list')) {
      data.tuyenduong.forEach(item => {
        if (item.type === 'point' || !item.type) {
          const color = item.mucdo === 'Rất cao' ? '#dc2626' : (item.mucdo === 'Cao' ? '#f97316' : '#22c55e');
          createMarker([item.lng, item.lat], 'MapPin', color, item.ten, { 'Loại': item.loai, 'Cảnh báo': item.mucdo }, item.id, 'tuyenduong-list');
        }
      });
    }
  };

  // CRUD Actions
  const handleAdd = () => {
    if (!selectedCoords) return;

    const baseItem = {
      lng: selectedCoords[0],
      lat: selectedCoords[1],
      id: Date.now()
    };

    let newItem: any = { ...baseItem };
    switch (formData.category) {
      case 'xa-list': newItem = { ...baseItem, ten_xa: formData.title, loai: formData.loai }; break;
      case 'vuviec-list': newItem = { ...baseItem, loai: formData.title, mota: formData.description, thoigian: formData.thoigian, trangthai: formData.trangthai, ketqua: formData.ketqua, groupId: formData.groupId }; break;
      case 'camera-list': newItem = { ...baseItem, ten: formData.title, chu_camera: formData.chu_camera || '', sdt_chu: formData.sdt_chu || '', description: formData.description || '', trangthai: formData.trangthai || 'Hoạt động' }; break;
      case 'doituong-list': newItem = { ...baseItem, hoten: formData.title, cccd: formData.cccd || '', loai: formData.loai || '', sdt: formData.sdt || '', mota: formData.description || '' }; break;
      case 'coquan-list': newItem = { ...baseItem, ten: formData.title, loai: formData.loai, xaphuong: formData.xaphuong }; break;
      case 'cskd-list':
        newItem = {
          ...baseItem,
          ten: formData.title,
          loai: formData.loai || '',
          trangthai: formData.trangthai || 'Đang hoạt động',
          mst: formData.mst || '',
          loai_hinh_kd: formData.loai_hinh_kd || 'Hộ kinh doanh cá thể',
          giay_phep: formData.giay_phep || '',
          chu_co_so: formData.chu_co_so || '',
          chu_ngaysinh: formData.chu_ngaysinh || '',
          chu_cccd: formData.chu_cccd || '',
          chu_sdt: formData.chu_sdt || '',
          chu_diachi: formData.chu_diachi || '',
          quan_ly: formData.quan_ly || '',
          quan_ly_ngaysinh: formData.quan_ly_ngaysinh || '',
          quan_ly_cccd: formData.quan_ly_cccd || '',
          quan_ly_sdt: formData.quan_ly_sdt || '',
          quan_ly_diachi: formData.quan_ly_diachi || '',
        };
        break;
      case 'diemnong-list': newItem = { ...baseItem, ten: formData.title, loai: formData.loai, mucdo: formData.mucdo, xaphuong: formData.xaphuong, mota: formData.description, radius: parseInt(formData.radius) || 300 }; break;
      case 'tuyenduong-list':
        if (routeCoordinates && routeCoordinates.length > 1) {
          newItem = {
            ...baseItem,
            ten: formData.title,
            loai: formData.loai,
            mucdo: formData.mucdo,
            type: 'line',
            coordinates: routeCoordinates
          };
        } else {
          newItem = {
            ...baseItem,
            ten: formData.title,
            loai: formData.loai,
            mucdo: formData.mucdo,
            type: 'point'
          };
        }
        break;
    }

    const newData = { ...data };
    if (formData.category === 'vuviec-list') newData.vuviec.push(newItem);
    else if (formData.category === 'xa-list') newData.xaphuong.push(newItem);
    else if (formData.category === 'camera-list') newData.camera.push(newItem);
    else if (formData.category === 'doituong-list') newData.doituong.push(newItem);
    else if (formData.category === 'coquan-list') newData.coquan.push(newItem);
    else if (formData.category === 'cskd-list') newData.cskd.push(newItem);
    else if (formData.category === 'diemnong-list') newData.diemnong.push(newItem);
    else if (formData.category === 'tuyenduong-list') newData.tuyenduong.push(newItem);

    saveOfflineData(newData);
    setShowForm(false);
    setSelectedCoords(null);
    setRouteCoordinates([]);
    setFormData({
      title: '', category: 'vuviec-list', description: '', loai: '',
      mucdo: 'Trung bình', trangthai: 'Mới', xaphuong: 'Phường Bình Minh',
      thoigian: '', ketqua: '', groupId: '', chu_camera: '', sdt_chu: '',
      cccd: '', sdt: '',
      mst: '', loai_hinh_kd: 'Hộ kinh doanh cá thể', giay_phep: '',
      chu_co_so: '', chu_ngaysinh: '', chu_cccd: '', chu_sdt: '', chu_diachi: '',
      quan_ly: '', quan_ly_ngaysinh: '', quan_ly_cccd: '', quan_ly_sdt: '', quan_ly_diachi: '',
      radius: 300
    });
  };

  const handleDelete = (id: string | number, category: string) => {
    const newData = { ...data };
    const targetIdStr = id ? String(id) : '';

    if (category === 'vuviec-list') newData.vuviec = newData.vuviec.filter(v => String(v.id || v.loai) !== targetIdStr);
    else if (category === 'xa-list') newData.xaphuong = newData.xaphuong.filter(x => String(x.ten_xa) !== targetIdStr);
    else if (category === 'camera-list') newData.camera = newData.camera.filter(c => String(c.id || c.ten) !== targetIdStr);
    else if (category === 'doituong-list') newData.doituong = newData.doituong.filter(d => String(d.id || d.hoten) !== targetIdStr);
    else if (category === 'coquan-list') newData.coquan = newData.coquan.filter(c => String(c.ten) !== targetIdStr);
    else if (category === 'cskd-list') newData.cskd = newData.cskd.filter(c => String(c.ten) !== targetIdStr);
    else if (category === 'diemnong-list') newData.diemnong = newData.diemnong.filter(d => String(d.id || d.ten) !== targetIdStr);
    else if (category === 'tuyenduong-list') newData.tuyenduong = newData.tuyenduong.filter(t => String(t.id || t.ten) !== targetIdStr);

    saveOfflineData(newData);
  };

  const handleViewDetails = (id: string | number, category: string) => {
    let foundItem = null;
    const targetIdStr = id ? String(id) : '';

    if (category === 'vuviec-list') foundItem = data.vuviec.find(v => String(v.id || v.loai) === targetIdStr);
    else if (category === 'xa-list') foundItem = data.xaphuong.find(x => String(x.ten_xa) === targetIdStr);
    else if (category === 'camera-list') foundItem = data.camera.find(c => String(c.id || c.ten) === targetIdStr);
    else if (category === 'doituong-list') foundItem = data.doituong.find(d => String(d.id || d.hoten) === targetIdStr);
    else if (category === 'coquan-list') foundItem = data.coquan.find(c => String(c.ten) === targetIdStr);
    else if (category === 'cskd-list') foundItem = data.cskd.find(c => String(c.ten) === targetIdStr);
    else if (category === 'diemnong-list') foundItem = data.diemnong.find(d => String(d.id || d.ten) === targetIdStr);
    else if (category === 'tuyenduong-list') foundItem = data.tuyenduong.find(t => String(t.id || t.ten) === targetIdStr);

    if (foundItem) {
      setSelectedDetails({ ...foundItem, category });
    }
  };

  const handleUpdateIncident = (updated: any) => {
    const newData = { ...data };
    const updatedIdStr = String(updated.id || updated.loai);
    const index = newData.vuviec.findIndex(v => String(v.id || v.loai) === updatedIdStr);
    if (index > -1) {
      newData.vuviec[index] = updated;
      saveOfflineData(newData);
      if (selectedDetails && String(selectedDetails.id || selectedDetails.loai) === updatedIdStr && selectedDetails.category === 'vuviec-list') {
        setSelectedDetails({ ...updated, category: 'vuviec-list' });
      }
    }
    setEditIncidentData(null);
  };

  const handleUpdateCamera = (updated: any) => {
    const newData = { ...data };
    const updatedIdStr = String(updated.id || updated.ten);
    const index = newData.camera.findIndex(c => String(c.id || c.ten) === updatedIdStr);
    if (index > -1) {
      newData.camera[index] = updated;
      saveOfflineData(newData);
      if (selectedDetails && String(selectedDetails.id || selectedDetails.ten) === updatedIdStr && selectedDetails.category === 'camera-list') {
        setSelectedDetails({ ...updated, category: 'camera-list' });
      }
    }
    setEditCameraData(null);
  };

  const handleUpdateDoiTuong = (updated: any) => {
    const newData = { ...data };
    const updatedIdStr = String(updated.id || updated.hoten);
    const index = newData.doituong.findIndex(d => String(d.id || d.hoten) === updatedIdStr);
    if (index > -1) {
      newData.doituong[index] = updated;
      saveOfflineData(newData);
      if (selectedDetails && String(selectedDetails.id || selectedDetails.hoten) === updatedIdStr && selectedDetails.category === 'doituong-list') {
        setSelectedDetails({ ...updated, category: 'doituong-list' });
      }
    }
    setEditDoiTuongData(null);
  };

  const handleUpdateCoQuan = (updated: any) => {
    const newData = { ...data };
    const originalName = updated._originalTen || updated.ten;
    const index = newData.coquan.findIndex(c => String(c.ten) === String(originalName));
    if (index > -1) {
      const cleanUpdated = { ...updated };
      delete cleanUpdated._originalTen;
      newData.coquan[index] = cleanUpdated;
      saveOfflineData(newData);
      if (selectedDetails && String(selectedDetails.ten) === String(originalName) && selectedDetails.category === 'coquan-list') {
        setSelectedDetails({ ...cleanUpdated, category: 'coquan-list' });
      }
    }
    setEditCoQuanData(null);
  };

  const handleUpdateCskd = (updated: any) => {
    const newData = { ...data };
    const originalName = updated._originalTen || updated.ten;
    const index = newData.cskd.findIndex(c => String(c.ten) === String(originalName));
    if (index > -1) {
      const cleanUpdated = { ...updated };
      delete cleanUpdated._originalTen;
      newData.cskd[index] = cleanUpdated;
      saveOfflineData(newData);
      if (selectedDetails && String(selectedDetails.ten) === String(originalName) && selectedDetails.category === 'cskd-list') {
        setSelectedDetails({ ...cleanUpdated, category: 'cskd-list' });
      }
    }
    setEditCskdData(null);
  };

  const handleUpdateDiemNong = (updated: any) => {
    const newData = { ...data };
    const originalName = updated._originalTen || updated.ten;
    const index = newData.diemnong.findIndex(d => String(d.id || d.ten) === String(updated.id || originalName));
    if (index > -1) {
      const cleanUpdated = { ...updated };
      delete cleanUpdated._originalTen;
      newData.diemnong[index] = cleanUpdated;
      saveOfflineData(newData);
      if (selectedDetails && String(selectedDetails.id || selectedDetails.ten) === String(updated.id || originalName) && selectedDetails.category === 'diemnong-list') {
        setSelectedDetails({ ...cleanUpdated, category: 'diemnong-list' });
      }
    }
    setEditDiemNongData(null);
  };

  const handleUpdateTuyenDuong = (updated: any) => {
    const newData = { ...data };
    const originalName = updated._originalTen || updated.ten;
    const index = newData.tuyenduong.findIndex(t => String(t.id || t.ten) === String(updated.id || originalName));
    if (index > -1) {
      const cleanUpdated = { ...updated };
      delete cleanUpdated._originalTen;
      newData.tuyenduong[index] = cleanUpdated;
      saveOfflineData(newData);
      if (selectedDetails && String(selectedDetails.id || selectedDetails.ten) === String(updated.id || originalName) && selectedDetails.category === 'tuyenduong-list') {
        setSelectedDetails({ ...cleanUpdated, category: 'tuyenduong-list' });
      }
    }
    setEditTuyenDuongData(null);
  };

  const handleStartEditCoordinates = (routeData: any) => {
    // Hide any open MapLibre popups
    document.querySelectorAll('.maplibregl-popup').forEach(el => el.remove());

    setPendingEditTuyenDuongData(routeData);
    setEditTuyenDuongData(null); // hide the edit modal
    setIsEditingRouteCoords(true);
    setRouteCoordinates(routeData.coordinates || []);
  };

  const handleImportExcelData = (targetCategory: string, importedItems: any[]) => {
    const newData = { ...data };
    if (targetCategory === 'vuviec-list') {
      newData.vuviec = [...newData.vuviec, ...importedItems];
    } else if (targetCategory === 'camera-list') {
      newData.camera = [...newData.camera, ...importedItems];
    } else if (targetCategory === 'doituong-list') {
      newData.doituong = [...newData.doituong, ...importedItems];
    } else if (targetCategory === 'cskd-list') {
      newData.cskd = [...newData.cskd, ...importedItems];
    } else if (targetCategory === 'diemnong-list') {
      newData.diemnong = [...newData.diemnong, ...importedItems];
    }
    saveOfflineData(newData);
    setShowImportModal(false);
  };

  // Event listener for popup actions
  useEffect(() => {
    const handler = (e: any) => {
      const { id, category } = e.detail;
      handleDelete(id, category);
    };
    // @ts-ignore
    window.handleDeleteGis = (id: string, category: string) => {
      window.dispatchEvent(new CustomEvent('delete-gis', { detail: { id, category } }));
    };
    window.addEventListener('delete-gis', handler);

    const viewHandler = (e: any) => {
      const { id, category } = e.detail;
      handleViewDetails(id, category);
    };
    // @ts-ignore
    window.handleViewDetailsGis = (id: string, category: string) => {
      window.dispatchEvent(new CustomEvent('view-details-gis', { detail: { id, category } }));
    };
    window.addEventListener('view-details-gis', viewHandler);

    const editHandler = (e: any) => setEditIncidentData(e.detail);
    window.addEventListener('edit-incident', editHandler);

    const editCameraHandler = (e: any) => setEditCameraData(e.detail);
    window.addEventListener('edit-camera', editCameraHandler);

    const editDoiTuongHandler = (e: any) => setEditDoiTuongData(e.detail);
    window.addEventListener('edit-doituong', editDoiTuongHandler);

    const editCoQuanHandler = (e: any) => setEditCoQuanData(e.detail);
    window.addEventListener('edit-coquan', editCoQuanHandler);

    const editCskdHandler = (e: any) => setEditCskdData(e.detail);
    window.addEventListener('edit-cskd', editCskdHandler);

    const editDiemNongHandler = (e: any) => setEditDiemNongData(e.detail);
    window.addEventListener('edit-diemnong', editDiemNongHandler);

    const editTuyenDuongHandler = (e: any) => setEditTuyenDuongData(e.detail);
    window.addEventListener('edit-tuyenduong', editTuyenDuongHandler);

    const importHandler = () => setShowImportModal(true);
    window.addEventListener('import-incidents', importHandler);

    return () => {
      window.removeEventListener('delete-gis', handler);
      window.removeEventListener('view-details-gis', viewHandler);
      window.removeEventListener('edit-incident', editHandler);
      window.removeEventListener('edit-camera', editCameraHandler);
      window.removeEventListener('edit-doituong', editDoiTuongHandler);
      window.removeEventListener('edit-coquan', editCoQuanHandler);
      window.removeEventListener('edit-cskd', editCskdHandler);
      window.removeEventListener('edit-diemnong', editDiemNongHandler);
      window.removeEventListener('edit-tuyenduong', editTuyenDuongHandler);
      window.removeEventListener('import-incidents', importHandler);
    };
  }, [data]);

  const flyTo = (lng: number, lat: number, zoom = 15) => {
    map.current?.flyTo({ center: [lng, lat], zoom, speed: 1.5 });
  };



  const getFilteredData = (type: string) => {
    switch (type) {
      case 'xa-list': return data.xaphuong.map(x => ({ label: x.ten_xa, lng: x.lng, lat: x.lat, category: type, id: x.ten_xa }));
      case 'vuviec-list': return data.vuviec.map(v => ({ label: v.loai, lng: v.lng, lat: v.lat, category: type, id: v.id || v.loai, extra: v.mota, trangthai: v.trangthai, thoigian: v.thoigian }));
      case 'camera-list': return data.camera.map(c => ({ label: c.ten, lng: c.lng, lat: c.lat, category: type, id: c.id || c.ten }));
      case 'doituong-list': return data.doituong.map(d => ({ label: d.hoten, lng: d.lng, lat: d.lat, category: type, id: d.id || d.hoten }));
      case 'coquan-list': return data.coquan.map(c => ({ label: c.ten, lng: c.lng, lat: c.lat, category: type, id: c.ten, loai: c.loai }));
      case 'cskd-list': return data.cskd.map(c => ({ label: c.ten, lng: c.lng, lat: c.lat, category: type, id: c.ten, loai: c.loai, trangthai: c.trangthai }));
      case 'diemnong-list': return data.diemnong.map(d => ({ label: d.ten, lng: d.lng, lat: d.lat, category: type, id: d.id, loai: d.loai, mucdo: d.mucdo }));
      case 'tuyenduong-list': return data.tuyenduong.map(t => ({
        label: t.ten,
        lng: t.lng || (t.coordinates?.[0]?.[0] ?? 0),
        lat: t.lat || (t.coordinates?.[0]?.[1] ?? 0),
        category: type,
        id: t.id || t.ten
      }));
      default: return [];
    }
  };

  const handleItemHover = (id: string | number, category: string, isHovering: boolean) => {
    const found = markersRef.current.find(m => m.id === id && m.category === category);
    if (found) {
      const inner = found.marker.getElement().querySelector('.marker-inner') as HTMLElement;
      if (inner) {
        inner.style.transform = isHovering ? 'scale(1.15) translateY(-6px)' : '';
      }
      found.marker.getElement().style.zIndex = isHovering ? '50' : '';
    }

    // Handle Mapbox drawn layers (Lines and Polygons)
    if (map.current) {
      if (category === 'tuyenduong-list') {
        const sourceId = `route-${id}`;
        if (map.current.getLayer(sourceId)) {
          map.current.setPaintProperty(sourceId, 'line-width', isHovering ? 8 : 4);
          map.current.setPaintProperty(sourceId, 'line-opacity', isHovering ? 1 : 0.7);
        }
      }
      if (category === 'diemnong-list') {
        const sourceId = `hotspot-${id}`;
        if (map.current.getLayer(sourceId)) {
          map.current.setPaintProperty(sourceId, 'fill-opacity', isHovering ? 0.4 : 0.1);
        }
      }
    }
  };

  const handleItemClick = (item: any) => {
    flyTo(item.lng, item.lat, 16);
    const itemId = item.id || item.label;

    // Close all other popups first
    markersRef.current.forEach(m => {
      const isTarget = m.id === itemId && m.category === item.category;
      if (!isTarget && m.marker.getPopup()?.isOpen()) {
        m.marker.getPopup()?.remove();
      }
    });

    const found = markersRef.current.find(m => m.id === itemId && m.category === item.category);
    if (found) {
      const popup = found.marker.getPopup();
      if (!popup.isOpen()) {
        found.marker.togglePopup();
      }
    }
  };

  const activeMenuObj = data.menu.find(m => m.id === activeMenu);
  const activeListData = activeMenuObj ? getFilteredData(activeMenuObj.target) : [];
  const filteredActiveList = activeListData.filter(item => item.label.toLowerCase().includes(searchQuery.toLowerCase()));

  const panToHomeCenter = () => {
    // Tọa độ trung tâm Phường Bình Minh
    flyTo(106.1183077, 11.3387817, 15);
  };

  return (
    <div className="relative w-full h-screen font-sans bg-slate-50 overflow-hidden">
      <TopBar
        isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen}
        isLocationMenuOpen={isLocationMenuOpen} setIsLocationMenuOpen={setIsLocationMenuOpen}
        selectedLocation={selectedLocation} setSelectedLocation={setSelectedLocation}
        data={data} flyTo={flyTo}
        isAdding={isAdding} setIsAdding={setIsAdding}
        setSelectedCoords={setSelectedCoords}
      />

      <Sidebar
        isMenuOpen={isMenuOpen}
        searchQuery={searchQuery} setSearchQuery={setSearchQuery}
        data={data}
        activeMenu={activeMenu} setActiveMenu={setActiveMenu}
        hiddenLayers={hiddenLayers} setHiddenLayers={setHiddenLayers}
        visibleCounts={visibleCounts}
        getFilteredData={getFilteredData}
        handleItemHover={handleItemHover}
        handleItemClick={handleItemClick}
        handleDelete={handleDelete}
      />

      {/* Settings / Offline Map Button & Dropdown */}
      {/* @ts-ignore */}
      {window.ipcRenderer && (
        <>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`absolute top-4 right-6 h-16 w-16 glass rounded-2xl z-[1000] flex items-center justify-center shadow-xl border border-white/40 transition-all ${showSettings ? 'bg-sky-50 text-sky-600 border-sky-200' : 'text-slate-600 hover:bg-white'}`}
            title="Thiết lập bản đồ"
          >
            <Settings className={`w-6 h-6 ${isUpdatingMap ? 'animate-spin' : ''}`} />
          </button>

          <AnimatePresence>
            {showSettings && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute top-24 right-6 w-80 glass p-5 rounded-3xl z-[1000] shadow-2xl border border-white/40 space-y-4"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-sky-500 text-white rounded-xl shadow-md shadow-sky-200">
                    <Database className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Bản đồ ngoại tuyến</h4>
                    <p className="text-[10px] text-slate-500 font-medium">Chạy offline 100% tự đóng gói</p>
                  </div>
                </div>

                {mapStatus && (
                  <div className="bg-white/80 rounded-2xl p-3 text-xs text-slate-600 border border-slate-100 space-y-1.5 text-left shadow-inner">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-slate-400">Trạng thái:</span>
                      <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px]">Đã kết nối</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-slate-50 pt-1.5">
                      <span className="font-semibold text-slate-400">Dung lượng:</span>
                      <span className="font-bold text-slate-700">{(mapStatus.sizeBytes / (1024 * 1024)).toFixed(1)} MB</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-slate-50 pt-1.5">
                      <span className="font-semibold text-slate-400">Cập nhật:</span>
                      <span className="font-bold text-slate-700 truncate max-w-[150px]">
                        {mapStatus.modifiedTime ? new Date(mapStatus.modifiedTime).toLocaleDateString('vi-VN') : 'Mặc định'}
                      </span>
                    </div>
                  </div>
                )}

                <button
                  onClick={triggerUpdateMap}
                  disabled={isUpdatingMap}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow-sm ${isUpdatingMap
                    ? 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                    : 'bg-sky-600 border border-sky-600 hover:bg-sky-700 hover:border-sky-700 text-white hover:shadow-md cursor-pointer'
                    }`}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isUpdatingMap ? 'animate-spin' : ''}`} />
                  <span>{isUpdatingMap ? 'Đang cập nhật...' : 'Cập nhật bản đồ nền (.mbtiles)'}</span>
                </button>

                <AnimatePresence>
                  {updateMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className={`flex items-center gap-1.5 p-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider ${updateMessage.isError
                        ? 'bg-rose-50 text-rose-700 border border-rose-100'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        }`}
                    >
                      {updateMessage.isError ? <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" /> : <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                      <span className="text-left leading-snug">{updateMessage.text}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="border-t border-slate-100 pt-3">
                  <button
                    onClick={handleResetDatabase}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow-sm bg-rose-50 border border-rose-200 hover:bg-rose-100/70 text-rose-600 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Khôi phục Cài đặt gốc</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      <AddFormModal
        showForm={showForm} setShowForm={setShowForm}
        formData={formData} setFormData={setFormData}
        menu={data.menu} selectedCoords={selectedCoords}
        handleAdd={handleAdd}
        routeCoordinates={routeCoordinates}
        setRouteCoordinates={setRouteCoordinates}
      />

      <DetailsModal
        details={selectedDetails}
        onClose={() => setSelectedDetails(null)}
      />

      <EditIncidentModal
        editData={editIncidentData}
        setEditData={setEditIncidentData}
        handleSave={handleUpdateIncident}
      />

      <EditCameraModal
        editData={editCameraData}
        setEditData={setEditCameraData}
        handleSave={handleUpdateCamera}
      />

      <EditDoiTuongModal
        editData={editDoiTuongData}
        setEditData={setEditDoiTuongData}
        handleSave={handleUpdateDoiTuong}
      />

      <EditCoQuanModal
        editData={editCoQuanData}
        setEditData={setEditCoQuanData}
        handleSave={handleUpdateCoQuan}
      />

      <EditCskdModal
        editData={editCskdData}
        setEditData={setEditCskdData}
        handleSave={handleUpdateCskd}
      />

      <EditDiemNongModal
        editData={editDiemNongData}
        setEditData={setEditDiemNongData}
        handleSave={handleUpdateDiemNong}
      />

      <EditTuyenDuongModal
        editData={editTuyenDuongData}
        setEditData={setEditTuyenDuongData}
        handleSave={handleUpdateTuyenDuong}
        onEditCoordinates={handleStartEditCoordinates}
      />

      <ImportExcelModal
        showImport={showImportModal}
        setShowImport={setShowImportModal}
        activeMenu={activeMenu}
        handleImport={handleImportExcelData}
      />

      <MapControls
        panToHomeCenter={panToHomeCenter}
        zoomIn={() => map.current?.zoomIn()}
        zoomOut={() => map.current?.zoomOut()}
      />

      <AnimatePresence>
        {isEditingRouteCoords && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="absolute top-6 left-1/2 transform z-[2000] w-[460px] glass p-4 rounded-3xl shadow-2xl border border-white/50 space-y-3 flex flex-col text-slate-800 text-center select-none"
          >
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-sky-500 text-white animate-pulse">
                Chế độ vẽ / Chọn lại tọa độ
              </span>
              <h3 className="text-xs font-black text-slate-850 mt-1.5 uppercase truncate max-w-full">
                Sửa tọa độ: {pendingEditTuyenDuongData?.ten || 'Tuyến đường'}
              </h3>
              <p className="text-[9px] text-slate-450 font-bold uppercase tracking-wider mt-0.5">
                Nhấp lên bản đồ để vẽ • Đã chọn {routeCoordinates.length} điểm
              </p>
            </div>

            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (routeCoordinates.length > 0) {
                    setRouteCoordinates(prev => prev.slice(0, -1));
                  }
                }}
                disabled={routeCoordinates.length === 0}
                className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-[10px] rounded-xl shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Hoàn tác
              </button>

              <button
                type="button"
                onClick={() => setRouteCoordinates([])}
                disabled={routeCoordinates.length === 0}
                className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-rose-50 border border-slate-200 text-slate-700 hover:text-rose-600 font-bold text-[10px] rounded-xl shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Vẽ lại
              </button>

              <button
                type="button"
                onClick={() => {
                  if (routeCoordinates.length < 2) {
                    alert('Tuyến đường phải có ít nhất 2 điểm tọa độ để kết nối!');
                    return;
                  }
                  // Confirm coordinates
                  const updatedData = { ...pendingEditTuyenDuongData, coordinates: routeCoordinates };
                  setEditTuyenDuongData(updatedData);
                  setPendingEditTuyenDuongData(null);
                  setIsEditingRouteCoords(false);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" /> Hoàn thành
              </button>

              <button
                type="button"
                onClick={() => {
                  // Cancel and restore
                  setEditTuyenDuongData(pendingEditTuyenDuongData);
                  setPendingEditTuyenDuongData(null);
                  setIsEditingRouteCoords(false);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white font-bold text-[10px] rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                <X className="w-3.5 h-3.5" /> Hủy
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
}
