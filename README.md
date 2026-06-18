# Bản đồ An ninh Trật tự

Hệ thống quản lý thông tin địa lý (GIS) an ninh trật tự.

## 🚀 Tính năng chính
- **Bản đồ an ninh tương tác**: Sử dụng MapLibre GL và dữ liệu OSM/Google Satellite.
- **Quản lý dữ liệu GIS**: Thêm/Xoá các điểm nóng, camera, đối tượng theo dõi, tuyến đường.
- **Tìm kiếm thông minh**: Tra cứu nhanh các địa điểm và đối tượng trên bản đồ.
- **Giao diện hiện đại**: Thiết kế sáng (Light Mode) với Glassmorphism, hỗ trợ responsive.

## 🛠️ Công nghệ sử dụng
- **Frontend**: React + TypeScript + Vite.
- **Styling**: Tailwind CSS + Framer Motion.
- **Bản đồ**: MapLibre GL.
- **Icons**: Lucide React.

## 💻 Hướng dẫn chạy dự án

### 1. Cài đặt môi trường
Yêu cầu Node.js phiên bản 18+ trở lên.

```bash
# Clone dự án từ GitHub
git clone <url-repo-cua-ban>
cd <thu-muc-du-an>

# Cài đặt dependencies
npm install
```

### 2. Chạy môi trường phát triển (Dev)
Dùng lệnh sau để chạy local:
```bash
npm run dev
```

### 3. Build sản phẩm (Production)
Để tạo ra các file static sẵn sàng đưa lên server (GitHub Pages, Vercel, Netlify):
```bash
npm run build
```
Kết quả sẽ nằm trong thư mục `dist/`.

## 📦 Cấu trúc thư mục
- `/src/App.tsx`: File logic chính của ứng dụng.
- `/src/constants.ts`: Chứa dữ liệu GIS ban đầu.
- `/src/index.css`: Cấu hình theme và các lớp CSS tùy chỉnh.
- `/src/types.ts`: Định nghĩa kiểu dữ liệu TypeScript.

## 📄 Giấy phép
Dự án được phát triển nhằm mục đích quản lý an ninh nội bộ.
