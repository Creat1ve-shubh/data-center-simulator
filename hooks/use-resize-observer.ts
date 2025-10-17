"use client"

import type React from "react"

import { useEffect, useState } from "react"

export function useResizeObserver<T extends HTMLElement>(ref: React.RefObject<T>) {
  const [size, setSize] = useState<{ width: number; height: number } | null>(null)
  useEffect(() => {
    if (!ref.current) return
    const el = ref.current
    const obs = new ResizeObserver((entries) => {
      const cr = entries[0].contentRect
      setSize({ width: cr.width, height: cr.height })
    })
    obs.observe(el)
    return () => obs.disconnect()
  }, [ref])
  return size
}
