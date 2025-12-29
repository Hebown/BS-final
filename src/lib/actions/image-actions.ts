'use server'

import { v2 as cloudinary } from 'cloudinary'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import exifr from 'exifr'
import { revalidatePath } from 'next/cache'

// 配置 Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})


export interface CloudinaryImage {
  public_id: string
  secure_url: string
  width: number
  height: number
  format: string
  created_at: string
  bytes: number
}

export type UploadState = {
  success?: boolean
  message?: string
  data?: {
    public_id: string
    url: string
    secure_url: string
  }
  errors?: {
    image?: string[]
    title?: string[]
  }
}

// 从 EXIF 数据生成自动标签
async function generateAutoTags(exifData: any, takenAt: Date | null): Promise<string[]> {
  const tags: string[] = []
  
  // 基于拍摄时间生成标签
  if (takenAt) {
    const month = takenAt.getMonth() + 1
    if (month >= 3 && month <= 5) tags.push('春天')
    else if (month >= 6 && month <= 8) tags.push('夏天')
    else if (month >= 9 && month <= 11) tags.push('秋天')
    else tags.push('冬天')
    
    const hour = takenAt.getHours()
    if (hour >= 5 && hour < 8) tags.push('清晨')
    else if (hour >= 8 && hour < 12) tags.push('上午')
    else if (hour >= 12 && hour < 14) tags.push('中午')
    else if (hour >= 14 && hour < 18) tags.push('下午')
    else if (hour >= 18 && hour < 22) tags.push('傍晚')
    else tags.push('夜晚')
  }
  
  // 基于相机信息生成标签
  if (exifData?.Make) {
    tags.push(`相机:${exifData.Make}`)
  }
  if (exifData?.Model) {
    tags.push(`型号:${exifData.Model}`)
  }
  
  // 基于拍摄参数生成标签
  if (exifData?.ISO) {
    tags.push(`ISO${exifData.ISO}`)
  }
  
  return tags
}

export async function uploadImage(
  prevState: UploadState | null,
  formData: FormData
): Promise<UploadState> {
  try {
    // 检查用户认证
    const session = await auth()
    if (!session?.user?.id) {
      return {
        success: false,
        message: '请先登录',
        errors: {}
      }
    }

    const file = formData.get('image') as File
    const title = formData.get('title') as string

    // 验证文件
    if (!file) {
      return {
        success: false,
        errors: { image: ['请选择图片文件'] },
        message: '文件不能为空'
      }
    }

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      return {
        success: false,
        errors: { image: ['请上传图片文件'] },
        message: '文件类型不支持'
      }
    }

    // 提取 EXIF 信息
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    let exifData: any = null
    let takenAt: Date | null = null
    let location: string | null = null
    let camera: string | null = null
    let lens: string | null = null

    try {
      exifData = await exifr.parse(buffer, {
        pick: ['DateTimeOriginal', 'GPSLatitude', 'GPSLongitude', 'Make', 'Model', 'LensModel', 'ISO', 'FNumber', 'ExposureTime', 'FocalLength']
      })

      // 处理拍摄时间
      if (exifData?.DateTimeOriginal) {
        takenAt = new Date(exifData.DateTimeOriginal)
      }

      // 处理地理位置（简化处理，实际可以调用逆地理编码 API）
      if (exifData?.GPSLatitude && exifData?.GPSLongitude) {
        location = `${exifData.GPSLatitude}, ${exifData.GPSLongitude}`
      }

      // 处理相机信息
      if (exifData?.Make && exifData?.Model) {
        camera = `${exifData.Make} ${exifData.Model}`
      }

      // 处理镜头信息
      if (exifData?.LensModel) {
        lens = exifData.LensModel
      }
    } catch (exifError) {
      console.log('EXIF 提取失败（可能图片没有 EXIF 信息）:', exifError)
    }

    // 将 File 转换为 base64
    const base64Image = `data:${file.type};base64,${buffer.toString('base64')}`

    // 上传到 Cloudinary
    const uploadResult = await cloudinary.uploader.upload(base64Image, {
      folder: `image-gallery/${session.user.id}`,
      public_id: title?.replace(/\s+/g, '_') || `image_${Date.now()}`,
      resource_type: 'auto'
    })

    console.log('上传成功:', uploadResult)

    // 生成自动标签
    const autoTags = await generateAutoTags(exifData, takenAt)

    // 先处理标签：查找或创建
    const tagConnections = await Promise.all(
      autoTags.map(async (tagName) => {
        let tag = await prisma.tag.findUnique({
          where: { name: tagName }
        })
        
        if (!tag) {
          tag = await prisma.tag.create({
            data: { name: tagName }
          })
        }
        
        return { tagId: tag.id }
      })
    )

    // 保存图片信息到数据库
    const image = await prisma.image.create({
      data: {
        title: title || null,
        publicId: uploadResult.public_id,
        secureUrl: uploadResult.secure_url,
        width: uploadResult.width,
        height: uploadResult.height,
        format: uploadResult.format,
        bytes: uploadResult.bytes,
        exifData: exifData ? JSON.parse(JSON.stringify(exifData)) : null,
        takenAt: takenAt,
        location: location,
        camera: camera,
        lens: lens,
        userId: session.user.id,
        tags: {
          create: tagConnections.map(({ tagId }) => ({
            tagId: tagId
          }))
        }
      },
      include: {
        tags: {
          include: {
            tag: true
          }
        }
      }
    })

    revalidatePath('/dashboard')
    revalidatePath('/')

    return {
      success: true,
      message: '图片上传成功！',
      data: {
        public_id: uploadResult.public_id,
        url: uploadResult.url,
        secure_url: uploadResult.secure_url
      }
    }

  } catch (error) {
    console.error('上传失败:', error)
    return {
      success: false,
      message: `上传失败: ${error instanceof Error ? error.message : '未知错误'}`
    }
  }
}


// 从数据库获取图片
export async function getImages(userId?: string): Promise<{
  success: boolean
  data?: any[]
  error?: string
}> {
  try {
    const session = await auth()
    const currentUserId = userId || session?.user?.id

    if (!currentUserId) {
      return {
        success: false,
        error: '请先登录'
      }
    }

    const images = await prisma.image.findMany({
      where: {
        userId: currentUserId
      },
      include: {
        tags: {
          include: {
            tag: true
          }
        },
        user: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return { success: true, data: images }
  } catch (error) {
    console.error('获取图片失败:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '获取图片失败' 
    }
  }
}

// 保留原有的 Cloudinary 直接获取函数（用于兼容）
export async function getCloudinaryImages(folder?: string): Promise<{
  success: boolean
  data?: CloudinaryImage[]
  error?: string
}> {
  try {
    const result = await cloudinary.api.resources({
      type: 'upload',
      max_results: 100,
      ...(folder && { prefix: folder })
    })

    const images: CloudinaryImage[] = result.resources.map((resource: CloudinaryImage) => ({
      public_id: resource.public_id,
      secure_url: resource.secure_url,
      width: resource.width,
      height: resource.height,
      format: resource.format,
      created_at: resource.created_at,
      bytes: resource.bytes,
    }))

    return { success: true, data: images }
  } catch (error) {
    console.error('获取 Cloudinary 图片失败:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '获取图片失败' 
    }
  }
}

// 删除图片
export async function deleteImage(imageId: string): Promise<{
  success: boolean
  message?: string
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return {
        success: false,
        error: '请先登录'
      }
    }

    // 查找图片并验证所有权
    const image = await prisma.image.findUnique({
      where: { id: imageId },
      select: { userId: true, publicId: true }
    })

    if (!image) {
      return {
        success: false,
        error: '图片不存在'
      }
    }

    if (image.userId !== session.user.id) {
      return {
        success: false,
        error: '无权删除此图片'
      }
    }

    // 从 Cloudinary 删除
    try {
      await cloudinary.uploader.destroy(image.publicId)
    } catch (cloudinaryError) {
      console.error('从 Cloudinary 删除失败:', cloudinaryError)
      // 继续删除数据库记录
    }

    // 从数据库删除（级联删除会处理关联的标签关系）
    await prisma.image.delete({
      where: { id: imageId }
    })

    revalidatePath('/dashboard')
    revalidatePath('/')

    return {
      success: true,
      message: '图片删除成功'
    }
  } catch (error) {
    console.error('删除图片失败:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '删除图片失败'
    }
  }
}