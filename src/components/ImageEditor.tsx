// components/ImageEditor.tsx
'use client'

import { CldImage, CldUploadButton } from 'next-cloudinary'
import { useState } from 'react'

interface ImageEditorProps {
  publicId: string
}

export default function ImageEditor({ publicId="" }: ImageEditorProps) {
  const [editedImage, setEditedImage] = useState<string | null>(null)

  return (
    <div className="space-y-4">
      {/* 原图预览 */}
      <div>
        <h3 className="text-lg font-semibold mb-2">原图</h3>
        <CldImage
          src={publicId}
          width={300}
          height={200}
          alt="原图"
          className="rounded-lg"
        />
      </div>

      {/* Cloudinary 编辑上传组件 */}
      <div>
        <h3 className="text-lg font-semibold mb-2">编辑图片</h3>
        <CldUploadButton
          uploadPreset="your_upload_preset" // 需要在 Cloudinary 中创建
          options={{
            multiple: false,
            resourceType: 'image',
            showAdvancedOptions: true,
            cropping: true,
            croppingAspectRatio: 16 / 9,
            croppingDefaultSelectionRatio: 0.5,
            showSkipCropButton: false,
            styles: {
              palette: {
                window: "#FFFFFF",
                sourceBg: "#F4F4F5",
                windowBorder: "#90A0B3",
                tabIcon: "#0E2F5A",
                inactiveTabIcon: "#69778A",
                menuIcons: "#5A616A",
                link: "#0078FF",
                action: "#0078FF",
                inProgress: "#0078FF",
                complete: "#20B832",
                error: "#EA5C5C",
                textDark: "#000000",
                textLight: "#FFFFFF"
              }
            }
          }}
          onSuccess={(result: any) => {
            // 编辑完成后的回调
            const editedPublicId = result.info.public_id
            setEditedImage(editedPublicId)
          }}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
        >
          编辑图片
        </CldUploadButton>
      </div>

      {/* 编辑后的预览 */}
      {editedImage && (
        <div>
          <h3 className="text-lg font-semibold mb-2">编辑后的图片</h3>
          <CldImage
            src={editedImage}
            width={300}
            height={200}
            alt="编辑后的图片"
            className="rounded-lg"
          />
        </div>
      )}
    </div>
  )
}