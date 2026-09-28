// Envoi d'un fichier du back-office SALM vers `POST /api/upload` (catégorie `salm`), avec progression.
// Pattern de `uploadFile` (app/pages/admin/magazines.vue) ; erreurs rejetées avec un `code` traduisible
// par `salmAdminErrorMessage` (app/utils/salm-admin-errors.ts).

export type SalmUploadKind = 'image' | 'pdf'

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_BYTES: Record<SalmUploadKind, number> = { image: 5 * 1024 * 1024, pdf: 10 * 1024 * 1024 }

class SalmUploadError extends Error {
  constructor(public code: string, public status?: number) {
    super(code)
  }
}

/** Pré-contrôle côté client (le serveur reste l'autorité) : code d'erreur, ou `null`. */
export function checkSalmFile(file: File, kind: SalmUploadKind): string | null {
  const typeOk = kind === 'pdf' ? file.type === 'application/pdf' : IMAGE_TYPES.includes(file.type)
  if (!typeOk) return 'UNSUPPORTED_FORMAT'
  if (file.size > MAX_BYTES[kind]) return 'FILE_TOO_LARGE'
  return null
}

export function useSalmUpload() {
  function upload(file: File, kind: SalmUploadKind, onProgress?: (percent: number) => void): Promise<{ path: string }> {
    const precheck = checkSalmFile(file, kind)
    if (precheck) return Promise.reject(new SalmUploadError(precheck))

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      const formData = new FormData()
      formData.append('category', 'salm')
      formData.append('kind', kind)
      formData.append('file', file)

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100))
      })
      xhr.addEventListener('load', () => {
        let body: { path?: string; data?: { code?: string } } | null = null
        try {
          body = JSON.parse(xhr.responseText)
        }
        catch {
          // réponse non JSON (proxy, surcharge) : code générique ci-dessous
        }
        if (xhr.status >= 200 && xhr.status < 300 && body?.path) resolve({ path: body.path })
        else if (xhr.status === 401) reject(new SalmUploadError('UNAUTHORIZED', 401))
        else if (xhr.status === 413) reject(new SalmUploadError('FILE_TOO_LARGE', 413))
        else reject(new SalmUploadError(body?.data?.code ?? `HTTP_${xhr.status}`, xhr.status))
      })
      xhr.addEventListener('error', () => reject(new SalmUploadError('NETWORK')))
      xhr.open('POST', '/api/upload')
      xhr.send(formData)
    })
  }

  return { upload }
}
