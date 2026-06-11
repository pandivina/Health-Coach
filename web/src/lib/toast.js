// src/lib/toast.js
let _showToast = null

export function _registerToast(fn) {
  _showToast = fn
}

export const toast = {
  error:   (msg) => _showToast?.({ type:'error',   message: msg }),
  success: (msg) => _showToast?.({ type:'success', message: msg }),
  info:    (msg) => _showToast?.({ type:'info',    message: msg }),
}
