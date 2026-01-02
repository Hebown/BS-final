/**
 * 布局工具函数
 */

import createJustifiedLayout from 'justified-layout'

export type CommonPosition = {
  top: number
  left: number
  width: number
  height: number
}

export type CommonLayoutOptions = {
  rowHeight: number
  rowWidth: number
  spacing: number
  heightTolerance: number
}

export type CommonJustifiedLayout = {
  containerWidth: number
  containerHeight: number
  getTop(boxIdx: number): number
  getLeft(boxIdx: number): number
  getWidth(boxIdx: number): number
  getHeight(boxIdx: number): number
  getPosition(boxIdx: number): CommonPosition
}

type Geometry = ReturnType<typeof createJustifiedLayout>

class Adapter implements CommonJustifiedLayout {
  private result: Geometry
  private width: number

  constructor(result: Geometry) {
    this.result = result
    this.width = 0
    for (const box of this.result.boxes) {
      if (box.top === 0) {
        this.width = box.left + box.width
      } else {
        break
      }
    }
  }

  get containerWidth() {
    return this.width
  }

  get containerHeight() {
    return this.result.containerHeight
  }

  getTop(boxIdx: number) {
    return this.result.boxes[boxIdx]?.top ?? 0
  }

  getLeft(boxIdx: number) {
    return this.result.boxes[boxIdx]?.left ?? 0
  }

  getWidth(boxIdx: number) {
    return this.result.boxes[boxIdx]?.width ?? 0
  }

  getHeight(boxIdx: number) {
    return this.result.boxes[boxIdx]?.height ?? 0
  }

  getPosition(boxIdx: number): CommonPosition {
    const box = this.result.boxes[boxIdx]
    return {
      top: box?.top ?? 0,
      left: box?.left ?? 0,
      width: box?.width ?? 0,
      height: box?.height ?? 0,
    }
  }
}

export function getJustifiedLayoutFromAssets(
  assets: Array<{ width: number; height: number }>,
  options: CommonLayoutOptions
): CommonJustifiedLayout {
  const adapter = {
    targetRowHeight: options.rowHeight,
    containerWidth: options.rowWidth,
    boxSpacing: options.spacing,
    targetRowHeightTolerange: options.heightTolerance,
    containerPadding: 0,
  }

  const aspectRatios = assets.map((asset) => asset.width / asset.height)
  const result = createJustifiedLayout(aspectRatios, adapter)
  return new Adapter(result)
}

export const emptyGeometry = (): CommonJustifiedLayout =>
  new Adapter({
    containerHeight: 0,
    widowCount: 0,
    boxes: [],
  })

