'use client'

import React, { useState, useEffect } from 'react'

export interface SafeImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src?: string | null
  fallbackSrc?: string
}

export function SafeImage({
  src,
  fallbackSrc = '/placeholder-logo.png',
  alt = '',
  className,
  ...props
}: SafeImageProps) {
  const [imgSrc, setImgSrc] = useState<string>(src || fallbackSrc)

  useEffect(() => {
    setImgSrc(src || fallbackSrc)
  }, [src, fallbackSrc])

  return (
    <img
      {...props}
      src={imgSrc}
      alt={alt}
      className={className}
      onError={() => {
        if (imgSrc !== fallbackSrc) {
          setImgSrc(fallbackSrc)
        }
      }}
    />
  )
}
