import { GISData } from "./types";

export const GIS_DATA: GISData = {
  menu: [
    { id: "menu-vuviec", title: "Vụ việc", icon: "AlertTriangle", target: "vuviec-list" },
    { id: "menu-camera", title: "Camera", icon: "Cctv", target: "camera-list" },
    { id: "menu-doituong", title: "Đối tượng", icon: "User", target: "doituong-list" },
    { id: "menu-coquan", title: "Cơ quan nhà nước", icon: "Building2", target: "coquan-list" },
    { id: "menu-cskd", title: "Cơ sở kinh doanh", icon: "Store", target: "cskd-list" },
    { id: "menu-diemnong", title: "Điểm nóng", icon: "Flame", target: "diemnong-list" },
    { id: "menu-tuyenduong", title: "Tuyến đường", icon: "Route", target: "tuyenduong-list" }
  ],
  xaphuong: [
    { ten_xa: "Phường Tân Ninh", lng: 106.1018779, lat: 11.3160126, loai: "Phường" },
    { ten_xa: "Phường Bình Minh", lng: 106.1183077, lat: 11.3387817, loai: "Phường" },
    { ten_xa: "Phường Long Hoa", lng: 106.128008, lat: 11.286541, loai: "Phường" },
    { ten_xa: "Phường Hòa Thành", lng: 106.1209437, lat: 11.2632696, loai: "Phường" },
    { ten_xa: "Phường Trảng Bàng", lng: 106.3579414, lat: 11.0295597, loai: "Phường" },
    { ten_xa: "Phường Gò Dầu", lng: 106.2606725, lat: 11.0891316, loai: "Phường" },
    { ten_xa: "Xã Hòa Hội", lng: 105.9271142, lat: 11.3195868, loai: "Xã" },
    { ten_xa: "Phường Thanh Điền", lng: 106.1119294, lat: 11.2910248, loai: "Phường" },
    { ten_xa: "Xã Châu Thành", lng: 106.0290279, lat: 11.3117864, loai: "Xã" },
    { ten_xa: "Xã Hảo Đước", lng: 105.9900445, lat: 11.3577172, loai: "Xã" },
    { ten_xa: "Xã Phước Vinh", lng: 105.9458811, lat: 11.3958488, loai: "Xã" },
    { ten_xa: "Xã Tân Biên", lng: 106.0091616, lat: 11.5444298, loai: "Xã" }
  ],
  vuviec: [],
  camera: [],
  doituong: [],
  coquan: [],
  cskd: [],
  diemnong: [],
  tuyenduong: []
};
