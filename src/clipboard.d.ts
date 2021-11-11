/**
 * Extending clipboard functionality to include non-finalized read/write
 * feature, which can be used for images. See:
 * https://github.com/Microsoft/TypeScript/issues/26728#issuecomment-788076992
 */
interface Clipboard {
  read?(): Promise<Array<ClipboardItem>>
  write?(items: Array<ClipboardItem>): Promise<void>
}

interface ClipboardItem {
  readonly types: string[]
  getType: (type: string) => Promise<Blob>
}

declare var ClipboardItem: {
  prototype: ClipboardItem
  new(objects: Record<string, Blob>): ClipboardItem
}
