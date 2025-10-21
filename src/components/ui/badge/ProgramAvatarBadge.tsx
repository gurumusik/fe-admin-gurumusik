'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { getProgramRing } from '@/utils/getProgramRing';
import { imgUrl } from '@/lib/fileUrl';

type BadgeColors = { bgVar: string; text: string };
function getProgramBadgeColors(pkg: string): BadgeColors {
  switch (pkg) {
    case 'Reguler': return { bgVar: 'var(--accent-purple-color)', text: '#ffffff' };
    case 'Internasional': return { bgVar: 'var(--accent-red-color)', text: '#ffffff' };
    case 'Hobby': return { bgVar: 'var(--primary-color)', text: '#111111' };
    case 'ABK': return { bgVar: 'var(--accent-orange-color)', text: '#ffffff' };
    default: return { bgVar: 'var(--gray-300)', text: '#111111' };
  }
}

export default function ProgramAvatarBadge({
  src, alt, pkg, size = 60,
}: { src?: string | null; alt: string; pkg: string; size?: number }) {
  const ringClass = getProgramRing(pkg);
  const { bgVar, text } = getProgramBadgeColors(pkg);

  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 3.9;

  // setengah lingkaran bawah (kiri -> kanan)
  const bottomArc = useMemo(
    () => `M ${cx - r},${cy} A ${r} ${r} 0 0 0 ${cx + r},${cy}`,
    [cx, cy, r]
  );

  const pathRef = useRef<SVGPathElement | null>(null);
  const textPathRef = useRef<SVGTextPathElement | null>(null);
    
  const [bgSegD, setBgSegD] = useState<string>('');
  const [dashArray, setDashArray] = useState<string>('0 9999');
  const [dashOffset, setDashOffset] = useState<number>(0);
  const [textOffset, setTextOffset] = useState<number>(0);

  // --- tweak umum ---
  const bgStrokeWidth = Math.max(8, Math.round(size * 0.20));
  const textSize = Math.max(7, Math.round(size * 0.14));

  // padding BG
  const padL = Math.max(1, Math.round(size * 0.02));
  const padR = Math.max(1, Math.round(size * 0.02));

  // aturan start untuk non‑ABK (dari kiri)
  const leftShift = Math.round(size * 0.00);
  const trimL = Math.round(size * 0.00);
  const trimR = Math.round(size * 0.02);

  const isABK = pkg === 'ABK';

  useEffect(() => {
    const p = pathRef.current;
    const t = textPathRef.current;
    if (!p || !t) return;

    let raf = 0;
    const measure = () => {
      const pathLen = p.getTotalLength();
      const textLen = t.getComputedTextLength() || 0;
      if (textLen === 0) { raf = requestAnimationFrame(measure); return; }

    if (isABK) {
      const pad = Math.max(1, Math.round(size * 0.012));
      const depth = Math.max(6, Math.round(size * 0.18)); // seberapa “membulat ke bawah”

      const pathLen = p.getTotalLength();
      const textLen = t.getComputedTextLength() || 0;

      // teks dipusatkan di bawah
      const txtStart = (pathLen - textLen) / 2;
      const s1 = Math.max(0, txtStart - pad);                  // awal BG di sepanjang arc bawah
      const s2 = Math.min(pathLen, txtStart + textLen + pad);  // akhir BG

      // konversi jarak s -> sudut (kiri=π, kanan=0, bawah=π/2)
      const toAngle = (s: number) => Math.PI - (s / pathLen) * Math.PI;

      const a1 = toAngle(s1);
      const a2 = toAngle(s2);

      // titik-titik di radius dalam (arc atas badge)
      const x1i = cx + r * Math.cos(a1);
      const y1i = cy + r * Math.sin(a1);
      const x2i = cx + r * Math.cos(a2);
      const y2i = cy + r * Math.sin(a2);

      // titik-titik di radius luar (arc bawah badge) -> membulat ke bawah
      const ro = r + depth;

      // seberapa “bulat” sambungannya
      const cap = Math.max(2, (ro - r) / 2); // boleh di-tune: * 0.9 kalau mau lebih rapet

      // bentuk kapsul halus: arc dalam -> bezier kanan -> arc luar -> bezier kiri -> tutup
      const dFill = [
        `M ${x1i} ${y1i}`,
        `A ${r} ${r} 0 0 0 ${x2i} ${y2i}`,            // arc atas mengikuti lingkaran avatar (kiri→kanan)
        `A ${cap} ${cap} 0 0 2 ${x1i} ${y1i}`,        // CAP kiri (balik ke inner, membulat)
        'Z',
      ].join(' ');

      setBgSegD(dFill);           // path isi
      setTextOffset(txtStart);    // teks tetap center

      // nonaktifkan dash (hanya dipakai untuk non‑ABK)
      setDashArray(`0 ${pathLen}`);
      setDashOffset(0);
    } else {
        // (kode non‑ABK kamu tetap)
        let visible = padL + textLen + padR - trimL - trimR;
        visible = Math.min(Math.max(0, visible), pathLen);
        const bgStart = leftShift + padL - trimL;
        const txtStart = leftShift + padL;
        setDashArray(`${visible} ${pathLen}`);
        setDashOffset(bgStart);
        setTextOffset(txtStart);
      }

      };

      raf = requestAnimationFrame(measure);
      return () => cancelAnimationFrame(raf);
    }, [pkg, size, isABK, padL, padR, trimL, trimR, leftShift]);


  const pathId =` avatarBottomArc-${pkg}-${size}`;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <img
        src={!src ? imgUrl(src) : "/assets/images/profile.png"}
        alt={alt}
        className={`rounded-full object-cover ring-2 ${ringClass}`}
        style={{ width: size, height: size }}
      />
      <svg className="absolute inset-0" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <path id={pathId} d={bottomArc} ref={pathRef} />
        </defs>

        {/* BG melengkung selebar teks */}
        {isABK ? (
          <path
            d={bgSegD}
            stroke={bgVar}
            strokeWidth={bgStrokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        ) : (
          <use
            href={`#${pathId}`}
            stroke={bgVar}
            strokeWidth={bgStrokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            style={{ strokeDasharray: dashArray, strokeDashoffset: dashOffset }}
          />
        )}


        {/* Teks mengikuti arc */}
        <text
          fontWeight={700}
          fontSize={textSize}
          dominantBaseline="middle"
          style={{ fill: text }}
        >
          <textPath
            href={`#${pathId}`}
            startOffset={textOffset}
            dy={-1}
            method="align"
            spacing="exact"         // <-- ganti ke exact
            ref={textPathRef}
          >
            {pkg.toUpperCase()}
          </textPath>
        </text>
      </svg>
    </div>
  );
}