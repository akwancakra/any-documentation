"use client";

import { useState, useEffect } from "react";

const MOBILE_MAX = 767;

/**
 * Editor sheet layout: mobile = bottom sheet, tablet/desktop = right drawer.
 */
export function useEditorSheetLayout() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_MAX}px)`);
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const sheetSide = isMobile ? ("bottom" as const) : ("right" as const);

  return { isMobile, sheetSide };
}
