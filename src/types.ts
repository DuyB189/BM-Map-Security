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
  ngay_tao?: string;
  nguoi_tao?: string;
  nguoi_cap_nhat?: string;
  ngay_cap_nhat?: string;
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
  nguoi_tao?: string;
  nguoi_cap_nhat?: string;
  ngay_cap_nhat?: string;
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
  nguoi_tao?: string;
  nguoi_cap_nhat?: string;
  ngay_cap_nhat?: string;
}

export interface PersonActivityLog {
  id: string;
  ngay: string;
  loai_su_kien: string;
  noi_dung: string;
}

export interface Person {
  id?: string | number;
  hoten: string;
  cccd?: string;
  loai?: string;
  nhom_nhan?: string[];
  hinh_anh?: string;
  lich_su_hoat_dong?: PersonActivityLog[];
  diachi?: string;
  mota?: string;
  sdt?: string;
  lng: number;
  lat: number;
  ngay_tao?: string;
  nguoi_tao?: string;
  nguoi_cap_nhat?: string;
  ngay_cap_nhat?: string;
}



export interface Agency {
  ten: string;
  loai: string;
  xaphuong: string;
  lng: number;
  lat: number;
  ngay_tao?: string;
  nguoi_tao?: string;
  nguoi_cap_nhat?: string;
  ngay_cap_nhat?: string;
}

export interface BusinessLicenseInfo {
  so_giay_phep?: string;
  ngay_cap?: string;
  ngay_het_han?: string;
  trang_thai?: string;
}

export interface BusinessInspectionRecord {
  id: string;
  ngay_kiem_tra: string;
  don_vi_kiem_tra?: string;
  ket_qua: string;
  noi_dung?: string;
}

export interface Business {
  id?: string | number;
  ten: string;
  loai: string;
  trangthai: string;
  mst?: string;
  loai_hinh_kd?: string;
  giay_phep?: string;
  giay_phep_antt?: BusinessLicenseInfo;
  giay_phep_pccc?: BusinessLicenseInfo;
  lich_su_kiem_tra?: BusinessInspectionRecord[];

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
  nguoi_tao?: string;
  nguoi_cap_nhat?: string;
  ngay_cap_nhat?: string;
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
  nguoi_tao?: string;
  nguoi_cap_nhat?: string;
  ngay_cap_nhat?: string;
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
  nguoi_tao?: string;
  nguoi_cap_nhat?: string;
  ngay_cap_nhat?: string;
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
