import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { type Editor } from "@tiptap/react"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Konstanta untuk style node yang dipilih
export const NODE_HANDLES_SELECTED_STYLE_CLASSNAME = "node-selected-style"

// Fungsi untuk memvalidasi URL
export function isValidUrl(url: string) {
  try {
    new URL(url)
    return true
  } catch (error) {
    return false
  }
}

// Fungsi untuk menduplikasi konten
export function duplicateContent(editor: Editor) {
  try {
    const { state } = editor
    const { tr } = state
    const { selection } = tr
    const { from, to } = selection
    
    const slice = state.doc.slice(from, to)
    tr.insert(to, slice.content)
    
    editor.view.dispatch(tr)
    return true
  } catch (error) {
    console.error("Error duplicating content:", error)
    return false
  }
}
