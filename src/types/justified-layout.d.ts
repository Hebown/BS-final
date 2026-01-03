declare module 'justified-layout' {
  interface JustifiedLayoutOptions {
    targetRowHeight?: number
    containerWidth: number
    boxSpacing?: number
    targetRowHeightTolerange?: number
    containerPadding?: number
  }

  interface Box {
    aspectRatio: number
    top: number
    left: number
    width: number
    height: number
  }

  interface JustifiedLayoutResult {
    containerHeight: number
    widowCount: number
    boxes: Box[]
  }

  function createJustifiedLayout(
    aspectRatios: number[],
    options: JustifiedLayoutOptions
  ): JustifiedLayoutResult

  export default createJustifiedLayout
}


