import React, { useState, useEffect } from 'react';
import { X, UploadCloud, Download, Check, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';

interface ImportExcelModalProps {
  showImport: boolean;
  setShowImport: (val: boolean) => void;
  activeMenu: string | null;
  handleImport: (category: string, data: any[]) => void;
}

export default function ImportExcelModal({
  showImport,
  setShowImport,
  activeMenu,
  handleImport
}: ImportExcelModalProps) {
  const [category, setCategory] = useState('vuviec-list');
  const [dragActive, setDragActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [pendingData, setPendingData] = useState<any[] | null>(null);

  // Synchronize category with currently active sidebar menu on open
  useEffect(() => {
    if (showImport) {
      setErrorMessage(null);
      setFileName(null);
      setPendingData(null);
      if (activeMenu === 'menu-camera') {
        setCategory('camera-list');
      } else if (activeMenu === 'menu-doituong') {
        setCategory('doituong-list');
      } else if (activeMenu === 'menu-cskd') {
        setCategory('cskd-list');
      } else if (activeMenu === 'menu-diemnong') {
        setCategory('diemnong-list');
      } else {
        setCategory('vuviec-list');
      }
    }
  }, [activeMenu, showImport]);

  if (!showImport) return null;

  const getHeaderTitle = () => {
    if (category === 'camera-list') return 'Nhập dữ liệu Camera';
    if (category === 'doituong-list') return 'Nhập dữ liệu Đối tượng';
    if (category === 'cskd-list') return 'Nhập dữ liệu Cơ sở kinh doanh';
    if (category === 'diemnong-list') return 'Nhập dữ liệu Điểm nóng';
    return 'Nhập dữ liệu Vụ việc';
  };

  const getHeaderDesc = () => {
    if (category === 'camera-list') return 'Tải lên danh sách camera giám sát';
    if (category === 'doituong-list') return 'Tải lên hồ sơ đối tượng theo dõi';
    if (category === 'cskd-list') return 'Tải lên danh sách cơ sở kinh doanh';
    if (category === 'diemnong-list') return 'Tải lên danh sách điểm nóng an ninh';
    return 'Tải lên danh sách vụ việc an ninh';
  };

  // Generate and download pre-defined offline Excel templates
  const downloadTemplate = () => {
    let templateData: any[] = [];
    let fileName = '';
    let sheetName = '';

    if (category === 'vuviec-list') {
      fileName = 'template_vuviec.xlsx';
      sheetName = 'VuViec';
      templateData = [
        {
          "Tên vụ việc": "Trộm cắp xe máy",
          "Kinh độ": 106.105000,
          "Vĩ độ": 11.310000,
          "Thời gian": "2026-05-29T10:30",
          "Trạng thái": "Đang xử lý",
          "Kết quả": "Đang điều tra",
          "Group ID": "GRP-001",
          "Mô tả": "Mất xe máy Honda SH màu xám tại khu dân cư"
        },
        {
          "Tên vụ việc": "Cướp giật tài sản",
          "Kinh độ": 106.130000,
          "Vĩ độ": 11.275000,
          "Thời gian": "2026-05-28T19:15",
          "Trạng thái": "Mới",
          "Kết quả": "",
          "Group ID": "",
          "Mô tả": "Giật điện thoại của người đi đường"
        }
      ];
    } else if (category === 'camera-list') {
      fileName = 'template_camera.xlsx';
      sheetName = 'Camera';
      templateData = [
        {
          "Tên camera": "Camera ngã tư Bình Minh",
          "Kinh độ": 106.118307,
          "Vĩ độ": 11.338781,
          "Chủ sở hữu": "Công an Phường Bình Minh",
          "Số điện thoại": "02763822115",
          "Mô tả": "Lắp ở cột đèn tín hiệu giao thông, hướng Tây Bắc",
          "Trạng thái": "Hoạt động"
        },
        {
          "Tên camera": "Camera ngõ 12 Đường 30/4",
          "Kinh độ": 106.110000,
          "Vĩ độ": 11.320000,
          "Chủ sở hữu": "Nguyễn Văn A (Dân cư)",
          "Số điện thoại": "0987654321",
          "Mô tả": "Camera gia đình quan sát toàn bộ hẻm",
          "Trạng thái": "Tạm ngưng"
        }
      ];
    } else if (category === 'doituong-list') {
      fileName = 'template_doituong.xlsx';
      sheetName = 'DoiTuong';
      templateData = [
        {
          "Họ và tên": "Nguyễn Văn A",
          "Kinh độ": 106.110000,
          "Vĩ độ": 11.290000,
          "Số CCCD": "072096001234",
          "Loại đối tượng": "Tội phạm ma túy",
          "Số điện thoại": "0912345678",
          "Mô tả": "Đối tượng có tiền án tàng trữ ma túy, đang diện theo dõi"
        },
        {
          "Họ và tên": "Trần Văn B",
          "Kinh độ": 106.090000,
          "Vĩ độ": 11.270000,
          "Số CCCD": "072095009876",
          "Loại đối tượng": "Trộm cắp tài sản",
          "Số điện thoại": "0988888888",
          "Mô tả": "Nghi phạm trộm xe chuyên nghiệp khu vực chợ"
        }
      ];
    } else if (category === 'cskd-list') {
      fileName = 'template_cosokinhdoanh.xlsx';
      sheetName = 'CoSoKinhDoanh';
      templateData = [
        {
          "Tên cơ sở": "Karaoke GOLD",
          "Kinh độ": 106.106096,
          "Vĩ độ": 11.319872,
          "Mã số thuế": "3901234567",
          "Loại hình kinh doanh": "Công ty TNHH",
          "Ngành nghề chính": "Karaoke",
          "Trạng thái hoạt động": "Đang hoạt động",
          "Giấy phép liên quan": "GPKD số 123/2024, ANTT số 456/2024",
          "Họ tên chủ": "Nguyễn Văn A",
          "Ngày sinh chủ": "01/01/1980",
          "CCCD chủ": "072090012345",
          "SĐT chủ": "0912345678",
          "Địa chỉ chủ": "123 Đường 30/4, Phường 1, Tây Ninh",
          "Họ tên quản lý": "Trần Văn B",
          "Ngày sinh quản lý": "02/02/1985",
          "CCCD quản lý": "072085009876",
          "SĐT quản lý": "0987654321",
          "Địa chỉ quản lý": "456 Cách Mạng Tháng 8, Tây Ninh"
        }
      ];
    } else if (category === 'diemnong-list') {
      fileName = 'template_diemnong.xlsx';
      sheetName = 'DiemNong';
      templateData = [
        {
          "Tên điểm nóng": "Khu vực chợ trung tâm",
          "Kinh độ": 106.101234,
          "Vĩ độ": 11.314567,
          "Phân loại": "Tệ nạn xã hội",
          "Mức độ cảnh báo": "Cao",
          "Địa bàn": "Phường Bình Minh",
          "Bán kính ảnh hưởng (mét)": 200,
          "Mô tả tình hình": "Điểm tập trung mua bán, sử dụng trái phép chất ma túy phức tạp"
        },
        {
          "Tên điểm nóng": "Ngã tư đường Hùng Vương",
          "Kinh độ": 106.115432,
          "Vĩ độ": 11.325432,
          "Phân loại": "Tụ tập cờ bạc",
          "Mức độ cảnh báo": "Trung bình",
          "Địa bàn": "Phường Bình Minh",
          "Bán kính ảnh hưởng (mét)": 150,
          "Mô tả tình hình": "Thường xuyên có nhóm đối tượng tụ tập đánh bài ăn tiền vào buổi tối"
        }
      ];
    }

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    // Auto-fit columns for better template readability
    const maxCols = Object.keys(templateData[0]).map(key => ({ wch: Math.max(key.length + 5, 20) }));
    ws['!cols'] = maxCols;

    XLSX.writeFile(wb, fileName);
  };

  // Process file upload and parse Excel columns
  const processFile = (file: File) => {
    setErrorMessage(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const fileData = event.target?.result;
        const workbook = XLSX.read(fileData, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        const json = XLSX.utils.sheet_to_json(worksheet) as any[];
        const dataToImport = [];

        if (!json || json.length === 0) {
          setErrorMessage("File Excel không chứa bất kỳ dữ liệu nào.");
          return;
        }

        for (let i = 0; i < json.length; i++) {
          const row = json[i];
          const itemLng = parseFloat(row['Kinh độ']);
          const itemLat = parseFloat(row['Vĩ độ']);

          if (isNaN(itemLng) || isNaN(itemLat)) {
            continue; // Skip invalid coordinates
          }

          if (category === 'vuviec-list') {
            if (row['Tên vụ việc']) {
              dataToImport.push({
                id: "INC-" + Date.now() + "-" + i,
                loai: String(row['Tên vụ việc'] || '').trim(),
                lng: itemLng,
                lat: itemLat,
                thoigian: String(row['Thời gian'] || '').trim(),
                trangthai: String(row['Trạng thái'] || '').trim() || 'Mới',
                ketqua: String(row['Kết quả'] || '').trim(),
                groupId: String(row['Group ID'] || '').trim(),
                mota: String(row['Mô tả'] || '').trim()
              });
            }
          } else if (category === 'camera-list') {
            if (row['Tên camera']) {
              dataToImport.push({
                id: "CAM-" + Date.now() + "-" + i,
                ten: String(row['Tên camera'] || '').trim(),
                lng: itemLng,
                lat: itemLat,
                chu_camera: String(row['Chủ sở hữu'] || '').trim(),
                sdt_chu: String(row['Số điện thoại'] || '').trim(),
                description: String(row['Mô tả'] || '').trim(),
                trangthai: String(row['Trạng thái'] || '').trim() || 'Hoạt động'
              });
            }
          } else if (category === 'doituong-list') {
            if (row['Họ và tên']) {
              dataToImport.push({
                id: "DT-" + Date.now() + "-" + i,
                hoten: String(row['Họ và tên'] || '').trim(),
                lng: itemLng,
                lat: itemLat,
                cccd: String(row['Số CCCD'] || '').trim(),
                loai: String(row['Loại đối tượng'] || '').trim(),
                sdt: String(row['Số điện thoại'] || '').trim(),
                mota: String(row['Mô tả'] || '').trim()
              });
            }
          } else if (category === 'cskd-list') {
            if (row['Tên cơ sở']) {
              dataToImport.push({
                id: "CSKD-" + Date.now() + "-" + i,
                ten: String(row['Tên cơ sở'] || '').trim(),
                lng: itemLng,
                lat: itemLat,
                mst: String(row['Mã số thuế'] || '').trim(),
                loai_hinh_kd: String(row['Loại hình kinh doanh'] || 'Hộ kinh doanh cá thể').trim(),
                loai: String(row['Ngành nghề chính'] || '').trim(),
                trangthai: String(row['Trạng thái hoạt động'] || 'Đang hoạt động').trim(),
                giay_phep: String(row['Giấy phép liên quan'] || '').trim(),
                chu_co_so: String(row['Họ tên chủ'] || '').trim(),
                chu_ngaysinh: String(row['Ngày sinh chủ'] || '').trim(),
                chu_cccd: String(row['CCCD chủ'] || '').trim(),
                chu_sdt: String(row['SĐT chủ'] || '').trim(),
                chu_diachi: String(row['Địa chỉ chủ'] || '').trim(),
                quan_ly: String(row['Họ tên quản lý'] || '').trim(),
                quan_ly_ngaysinh: String(row['Ngày sinh quản lý'] || '').trim(),
                quan_ly_cccd: String(row['CCCD quản lý'] || '').trim(),
                quan_ly_sdt: String(row['SĐT quản lý'] || '').trim(),
                quan_ly_diachi: String(row['Địa chỉ quản lý'] || '').trim()
              });
            }
          } else if (category === 'diemnong-list') {
            if (row['Tên điểm nóng']) {
              dataToImport.push({
                id: Date.now() + i,
                ten: String(row['Tên điểm nóng'] || '').trim(),
                lng: itemLng,
                lat: itemLat,
                loai: String(row['Phân loại'] || '').trim(),
                mucdo: String(row['Mức độ cảnh báo'] || 'Trung bình').trim(),
                xaphuong: String(row['Địa bàn'] || '').trim(),
                radius: parseInt(row['Bán kính ảnh hưởng (mét)']) || 300,
                mota: String(row['Mô tả tình hình'] || '').trim()
              });
            }
          }
        }

        if (dataToImport.length > 0) {
          setPendingData(dataToImport);
          setFileName(file.name);
        } else {
          if (category === 'vuviec-list') {
            setErrorMessage("Vui lòng kiểm tra lại file. Mẫu Vụ việc yêu cầu các cột: 'Tên vụ việc', 'Kinh độ', 'Vĩ độ'.");
          } else if (category === 'camera-list') {
            setErrorMessage("Vui lòng kiểm tra lại file. Mẫu Camera yêu cầu các cột: 'Tên camera', 'Kinh độ', 'Vĩ độ'.");
          } else if (category === 'doituong-list') {
            setErrorMessage("Vui lòng kiểm tra lại file. Mẫu Đối tượng yêu cầu các cột: 'Họ và tên', 'Kinh độ', 'Vĩ độ'.");
          } else if (category === 'cskd-list') {
            setErrorMessage("Vui lòng kiểm tra lại file. Mẫu Cơ sở kinh doanh yêu cầu các cột: 'Tên cơ sở', 'Kinh độ', 'Vĩ độ'.");
          } else if (category === 'diemnong-list') {
            setErrorMessage("Vui lòng kiểm tra lại file. Mẫu Điểm nóng yêu cầu các cột: 'Tên điểm nóng', 'Kinh độ', 'Vĩ độ'.");
          }
        }
      } catch (error) {
        console.error(error);
        setErrorMessage("Đã xảy ra lỗi khi đọc tệp Excel. Định dạng file có thể bị hỏng.");
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[2000] flex items-center justify-center p-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <div>
              <h2 className="text-base font-bold text-slate-850 uppercase tracking-wide">{getHeaderTitle()}</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{getHeaderDesc()}</p>
            </div>
            <button
              onClick={() => setShowImport(false)}
              className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-5">
            {/* Error Message alert */}
            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-2 text-rose-700 text-xs font-semibold leading-relaxed">
                <AlertCircle className="w-4.5 h-4.5 text-rose-500 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {pendingData ? (
              <div className="space-y-4">
                <div className="p-6 bg-emerald-50/50 border border-emerald-100 rounded-3xl flex flex-col items-center text-center gap-3 shadow-inner">
                  <div className="w-14 h-14 bg-white border border-emerald-200 rounded-2xl flex items-center justify-center text-emerald-650 shadow-md shadow-emerald-50 animate-bounce">
                    <Check className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-800">Tệp tin đã sẵn sàng</h4>
                    <p className="text-xs text-slate-500 font-medium font-mono truncate max-w-[300px] bg-white border border-slate-200 px-3 py-1 rounded-lg mt-1 inline-block">
                      {fileName}
                    </p>
                  </div>
                  <p className="text-xs text-slate-650 leading-relaxed font-semibold">
                    Đã kiểm tra hợp lệ: <span className="text-emerald-600 font-black text-sm">{pendingData.length}</span> bản ghi.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => {
                      setPendingData(null);
                      setFileName(null);
                      setErrorMessage(null);
                    }}
                    className="py-3 px-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-850 transition-all text-center cursor-pointer shadow-sm"
                  >
                    Chọn tệp khác
                  </button>
                  <button
                    onClick={() => handleImport(category, pendingData)}
                    className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all text-center cursor-pointer shadow-md shadow-emerald-100 hover:shadow-lg flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-4 h-4" /> Xác nhận nhập
                  </button>
                </div>
              </div>
            ) : (
              /* Drag & Drop File Container */
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center text-center transition-all ${dragActive ? 'border-sky-500 bg-sky-50/50 scale-[0.99]' : 'border-slate-200 bg-slate-50/30 hover:bg-slate-50/80 hover:border-slate-300'}`}
              >
                <div className="w-14 h-14 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-sky-500 shadow-sm shadow-slate-100 mb-3">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <h4 className="text-sm font-bold text-slate-700">Chọn hoặc Kéo thả file Excel</h4>
                <p className="text-[10px] text-slate-400 font-medium mt-1">Hỗ trợ các định dạng tệp: .xlsx hoặc .xls</p>

                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
              </div>
            )}

            {/* Download template panel */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/60 flex items-center justify-between gap-4">
              <div className="text-left">
                <h5 className="text-[10px] font-bold text-slate-700 uppercase tracking-wide">File Mẫu Quy Ước</h5>
                <p className="text-[9px] text-slate-400 font-semibold uppercase mt-0.5">Tải mẫu Excel tương ứng</p>
              </div>
              <button
                onClick={downloadTemplate}
                className="py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 rounded-xl transition-all text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-sky-600" /> Tải Excel Mẫu
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
