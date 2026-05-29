import React from 'react';
import VuViecForm from './VuViec/VuViecForm';
import XaForm from './Xa/XaForm';
import CameraForm from './Camera/CameraForm';
import DoiTuongForm from './DoiTuong/DoiTuongForm';

import CoQuanForm from './CoQuan/CoQuanForm';
import CskdForm from './Cskd/CskdForm';
import DiemNongForm from './DiemNong/DiemNongForm';
import TuyenDuongForm from './TuyenDuong/TuyenDuongForm';

interface FormRendererProps {
  formData: any;
  setFormData: (val: any) => void;
  routeCoordinates?: [number, number][];
  setRouteCoordinates?: (val: any) => void;
}

export default function FormRenderer({ formData, setFormData, routeCoordinates, setRouteCoordinates }: FormRendererProps) {
  switch (formData.category) {
    case 'vuviec-list': return <VuViecForm formData={formData} setFormData={setFormData} />;
    case 'xa-list': return <XaForm formData={formData} setFormData={setFormData} />;
    case 'camera-list': return <CameraForm formData={formData} setFormData={setFormData} />;
    case 'doituong-list': return <DoiTuongForm formData={formData} setFormData={setFormData} />;

    case 'coquan-list': return <CoQuanForm formData={formData} setFormData={setFormData} />;
    case 'cskd-list': return <CskdForm formData={formData} setFormData={setFormData} />;
    case 'diemnong-list': return <DiemNongForm formData={formData} setFormData={setFormData} />;
    case 'tuyenduong-list': return <TuyenDuongForm formData={formData} setFormData={setFormData} routeCoordinates={routeCoordinates} setRouteCoordinates={setRouteCoordinates} />;
    default: return null;
  }
}
