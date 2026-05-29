import React from 'react';
import VuViecDetails from './VuViec/VuViecDetails';
import XaDetails from './Xa/XaDetails';
import CameraDetails from './Camera/CameraDetails';
import DoiTuongDetails from './DoiTuong/DoiTuongDetails';

import CoQuanDetails from './CoQuan/CoQuanDetails';
import CskdDetails from './Cskd/CskdDetails';
import DiemNongDetails from './DiemNong/DiemNongDetails';
import TuyenDuongDetails from './TuyenDuong/TuyenDuongDetails';

interface DetailsRendererProps {
  details: any;
  onClose: () => void;
}

export default function DetailsRenderer({ details, onClose }: DetailsRendererProps) {
  switch (details.category) {
    case 'vuviec-list': return <VuViecDetails details={details} onClose={onClose} />;
    case 'xa-list': return <XaDetails details={details} onClose={onClose} />;
    case 'camera-list': return <CameraDetails details={details} onClose={onClose} />;
    case 'doituong-list': return <DoiTuongDetails details={details} onClose={onClose} />;

    case 'coquan-list': return <CoQuanDetails details={details} onClose={onClose} />;
    case 'cskd-list': return <CskdDetails details={details} onClose={onClose} />;
    case 'diemnong-list': return <DiemNongDetails details={details} onClose={onClose} />;
    case 'tuyenduong-list': return <TuyenDuongDetails details={details} onClose={onClose} />;
    default: return null;
  }
}
