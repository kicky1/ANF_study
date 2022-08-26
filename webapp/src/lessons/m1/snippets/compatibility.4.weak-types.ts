export {}

type PatchParams = {
  name?: string
  languages?: string[]
  // value: string
}

const params = { value: '125' }

declare function patch(params: PatchParams): void

patch(params) // ❌ has no properties in common with type 'PatchParams'
