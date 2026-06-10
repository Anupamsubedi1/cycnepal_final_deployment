"use client";

import QRCode from "react-qr-code";
import React from "react";

type Props = {
  value: string;
  size?: number;
};

export default function ClientQRCode({ value, size = 128 }: Props) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white p-2 shadow-md">
      <div className="bg-white p-1 rounded-lg">
        <QRCode value={value} size={size} bgColor="#ffffff" fgColor="#005d59" />
      </div>
    </div>
  );
}
