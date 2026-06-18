export interface GISMenu {
  id: string;
  title: string;
  icon: string;
  target: string;
}

export interface Commune {
  ten_xa: string;
  lng: number;
  lat: number;
  loai?: string;
}

export interface Incident {
  id?: string | number;
  loai: string;
  mota: string;
  diachi?: string;
  thoigian?: string;
  trangthai?: string;
  ketqua?: string;
  groupId?: string;
  lng: number;
  lat: number;
  ngay_tao?: string;
  suspectIds?: (string | number)[];
}

export interface Camera {
  id?: string | number;
  ten: string;
  chu_camera?: string;
  sdt_chu?: string;
  diachi?: string;
  description?: string;
  trangthai?: string;
  lng: number;
  lat: number;
  ngay_tao?: string;
}

export interface Person {
  id?: string | number;
  hoten: string;
  cccd?: string;
  loai?: string;
  diachi?: string;
  mota?: string;
  sdt?: string;
  lng: number;
  lat: number;
  ngay_tao?: string;
}



export interface Agency {
  ten: string;
  loai: string;
  xaphuong: string;
  lng: number;
  lat: number;
  ngay_tao?: string;
}

export interface Business {
  id?: string | number;
  ten: string;
  loai: string;
  trangthai: string;
  mst?: string;
  loai_hinh_kd?: string;
  giay_phep?: string;

  // Người đại diện theo pháp luật / Chủ cơ sở
  chu_co_so?: string;
  chu_ngaysinh?: string;
  chu_cccd?: string;
  chu_sdt?: string;
  chu_diachi?: string;

  // Người quản lý thực tế (nếu có)
  quan_ly?: string;
  quan_ly_ngaysinh?: string;
  quan_ly_cccd?: string;
  quan_ly_sdt?: string;
  quan_ly_diachi?: string;

  lng: number;
  lat: number;
  ngay_tao?: string;
}

export interface Hotspot {
  id: number;
  ten: string;
  mucdo: string;
  loai: string;
  mota: string;
  xaphuong: string;
  radius: number;
  lng: number;
  lat: number;
  ngay_tao?: string;
}

export interface Route {
  id: number;
  ten: string;
  loai: string;
  mucdo: string;
  type: "point" | "line";
  lng?: number;
  lat?: number;
  coordinates?: [number, number][];
  ngay_tao?: string;
}

export interface GISData {
  menu: GISMenu[];
  xaphuong: Commune[];
  vuviec: Incident[];
  camera: Camera[];
  doituong: Person[];
  coquan: Agency[];
  cskd: Business[];
  diemnong: Hotspot[];
  tuyenduong: Route[];
}
