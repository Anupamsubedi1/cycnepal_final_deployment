"use client";

import Image from "next/image";
import { ImageIcon, UploadCloud, X } from "lucide-react";

interface Props {
  imageUrl: string;
  uploading: boolean;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
}

export default function HeroBannerUpload({ imageUrl, uploading, onUpload, onRemove }: Props) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 border-b border-slate-50 pb-2">
        <ImageIcon size={13} className="text-slate-400" />
        <h4 className="text-sm font-bold text-slate-700">Banner Image</h4>
      </div>
      <div className="relative group rounded-lg overflow-hidden bg-slate-100 aspect-video border-2 border-dashed border-slate-200 flex items-center justify-center">
        {imageUrl ? (
          <>
            <Image src={imageUrl} alt="Banner" fill className="object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
              <label className="cursor-pointer bg-white text-slate-900 px-3 py-1.5 rounded-full text-[10px] font-bold flex items-center gap-1.5 shadow-lg">
                <UploadCloud size={12} /> CHANGE
                <input type="file" accept="image/*" className="hidden" onChange={onUpload} />
              </label>
              <button onClick={onRemove} className="bg-red-500 text-white px-3 py-1.5 rounded-full text-[10px] font-bold flex items-center gap-1 shadow-lg cursor-pointer">
                <X size={10} /> REMOVE
              </button>
            </div>
          </>
        ) : (
          <label className="cursor-pointer flex flex-col items-center gap-2 text-slate-400 hover:text-[#0d837f] transition-colors p-4 text-center">
            <ImageIcon size={28} strokeWidth={1.5} />
            <span className="text-[10px] font-bold uppercase">Upload Banner</span>
            <span className="text-[9px] text-slate-300">Replaces default banner</span>
            <input type="file" accept="image/*" className="hidden" onChange={onUpload} />
          </label>
        )}
      </div>
      {uploading && <p className="text-[10px] font-bold text-[#0d837f] animate-pulse text-center">UPLOADING...</p>}
    </div>
  );
}
