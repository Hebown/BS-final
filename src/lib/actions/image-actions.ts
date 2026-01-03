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


// 从 Cloudinary 获取图片（图片存储在 Cloudinary，数据库只存储元数据）
// 如果数据库中有元数据，则合并；否则直接从 Cloudinary 获取
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

    // 从 Cloudinary 获取图片（图片本身存储在 Cloudinary）
    const folderPath = `image-gallery/${currentUserId}`
    const cloudinaryResult = await getCloudinaryImages(folderPath)
    
    if (!cloudinaryResult.success || !cloudinaryResult.data) {
      return {
        success: true,
        data: [] // 如果没有图片，返回空数组
      }
    }

    // 注意：图片完全从 Cloudinary 获取，数据库只用于存储可选的元数据（标签、标题等）
    // 如果数据库表不存在，我们只使用 Cloudinary 数据，这是正常的行为
    let dbMetadata: Record<string, any> = {}
    try {
      // 检查表是否存在（通过尝试查询）
      const dbImages = await prisma.image.findMany({
        where: {
          userId: currentUserId
        },
        include: {
          tags: {
            include: {
              tag: true
            }
          }
        }
      })
      
      // 创建以 publicId 为键的映射
      dbImages.forEach(img => {
        dbMetadata[img.publicId] = img
      })
    } catch (dbError: any) {
      // 如果数据库表不存在或查询失败，只使用 Cloudinary 数据
      // 这是预期的行为，因为图片存储在 Cloudinary，数据库只存储可选的元数据
      // 静默处理，不输出错误日志
    }

    // 合并 Cloudinary 图片和数据库元数据
    const images = cloudinaryResult.data.map((img) => {
      const metadata = dbMetadata[img.public_id]
      
      return {
        id: metadata?.id || img.public_id,
        publicId: img.public_id,
        secureUrl: img.secure_url,
        width: img.width,
        height: img.height,
        format: img.format,
        bytes: img.bytes,
        createdAt: metadata?.createdAt || new Date(img.created_at),
        title: metadata?.title || null,
        takenAt: metadata?.takenAt || null,
        location: metadata?.location || null,
        camera: metadata?.camera || null,
        lens: metadata?.lens || null,
        tags: metadata?.tags || [],
        user: session?.user ? {
          id: session.user.id,
          username: (session.user as any).username || '',
          email: session.user.email || ''
        } : null
      }
    })

    // 按创建时间排序
    images.sort((a, b) => {
      const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime()
      const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime()
      return dateB - dateA
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

// 搜索图片
export interface SearchParams {
  keyword?: string // 关键词（标题）
  tags?: string[] // 标签ID数组
  startDate?: string // 开始日期（ISO格式）
  endDate?: string // 结束日期（ISO格式）
  camera?: string // 相机型号
  location?: string // 地点
  minWidth?: number // 最小宽度
  minHeight?: number // 最小高度
  format?: string // 图片格式
}

export async function searchImages(params: SearchParams): Promise<{
  success: boolean
  data?: any[]
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

    // 从 Cloudinary 获取所有图片
    const folderPath = `image-gallery/${session.user.id}`
    const cloudinaryResult = await getCloudinaryImages(folderPath)
    
    if (!cloudinaryResult.success || !cloudinaryResult.data) {
      return {
        success: true,
        data: []
      }
    }

    // 尝试从数据库获取元数据（如果表存在）
    let dbMetadata: Record<string, any> = {}
    try {
      const dbImages = await prisma.image.findMany({
        where: {
          userId: session.user.id
        },
        include: {
          tags: {
            include: {
              tag: true
            }
          }
        }
      })
      
      dbImages.forEach(img => {
        dbMetadata[img.publicId] = img
      })
    } catch (dbError) {
      // 数据库表不存在是正常的，只使用 Cloudinary 数据
    }

    // 合并 Cloudinary 图片和数据库元数据
    let images = cloudinaryResult.data.map((img) => {
      const metadata = dbMetadata[img.public_id]
      
      return {
        id: metadata?.id || img.public_id,
        publicId: img.public_id,
        secureUrl: img.secure_url,
        width: img.width,
        height: img.height,
        format: img.format,
        bytes: img.bytes,
        createdAt: metadata?.createdAt || new Date(img.created_at),
        title: metadata?.title || null,
        takenAt: metadata?.takenAt || null,
        location: metadata?.location || null,
        camera: metadata?.camera || null,
        lens: metadata?.lens || null,
        tags: metadata?.tags || [],
        user: session.user ? {
          id: session.user.id,
          username: (session.user as any).username || '',
          email: session.user.email || ''
        } : null
      }
    })

    // 客户端过滤（因为 Cloudinary API 不支持复杂的搜索）
    // 关键词模糊搜索（标题、文件名、标签、地点、相机等）
    if (params.keyword && params.keyword.trim()) {
      const keyword = params.keyword.trim().toLowerCase()
      images = images.filter(img => {
        // 搜索标题
        if (img.title?.toLowerCase().includes(keyword)) return true
        // 搜索文件名（publicId）
        if (img.publicId.toLowerCase().includes(keyword)) return true
        // 搜索标签
        if (img.tags && Array.isArray(img.tags)) {
          const tagNames = img.tags.map((t: any) => t.tag?.name || '').filter(Boolean)
          if (tagNames.some((name: string) => name.toLowerCase().includes(keyword))) return true
        }
        // 搜索地点
        if (img.location?.toLowerCase().includes(keyword)) return true
        // 搜索相机型号
        if (img.camera?.toLowerCase().includes(keyword)) return true
        // 搜索镜头型号
        if (img.lens?.toLowerCase().includes(keyword)) return true
        return false
      })
    }

    // 标签搜索
    if (params.tags && params.tags.length > 0) {
      images = images.filter(img => {
        const imageTagIds = img.tags.map((t: any) => t.tag?.id || t.tagId)
        return params.tags!.some(tagId => imageTagIds.includes(tagId))
      })
    }

    // 时间范围搜索
    if (params.startDate || params.endDate) {
      images = images.filter(img => {
        const date = img.takenAt || img.createdAt
        if (!date) return false
        const imgDate = date instanceof Date ? date : new Date(date)
        if (params.startDate && imgDate < new Date(params.startDate)) return false
        if (params.endDate && imgDate > new Date(params.endDate)) return false
        return true
      })
    }

    // 相机型号搜索
    if (params.camera && params.camera.trim()) {
      const camera = params.camera.trim().toLowerCase()
      images = images.filter(img => 
        img.camera?.toLowerCase().includes(camera)
      )
    }

    // 地点搜索
    if (params.location && params.location.trim()) {
      const location = params.location.trim().toLowerCase()
      images = images.filter(img => 
        img.location?.toLowerCase().includes(location)
      )
    }

    // 尺寸搜索
    if (params.minWidth) {
      images = images.filter(img => img.width >= params.minWidth!)
    }
    if (params.minHeight) {
      images = images.filter(img => img.height >= params.minHeight!)
    }

    // 格式搜索
    if (params.format && params.format.trim()) {
      images = images.filter(img => 
        img.format.toLowerCase() === params.format!.trim().toLowerCase()
      )
    }

    // 按创建时间排序
    images.sort((a, b) => {
      const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime()
      const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime()
      return dateB - dateA
    })

    return { success: true, data: images }
  } catch (error) {
    console.error('搜索图片失败:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '搜索图片失败'
    }
  }
}

// 获取所有标签（用于搜索）
// 注意：标签存储在数据库中，但如果表不存在，返回空数组
export async function getAllTags(): Promise<{
  success: boolean
  data?: Array<{ id: string; name: string; color: string | null }>
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

    // 尝试从数据库获取标签（如果表存在）
    try {
      const tags = await prisma.tag.findMany({
        where: {
          images: {
            some: {
              image: {
                userId: session.user.id
              }
            }
          }
        },
        select: {
          id: true,
          name: true,
          color: true
        },
        orderBy: {
          name: 'asc'
        }
      })

      return { success: true, data: tags }
    } catch (dbError) {
      // 如果数据库表不存在，返回空数组（这是正常的，因为标签是可选的元数据）
      return { success: true, data: [] }
    }
  } catch (error) {
    console.error('获取标签失败:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '获取标签失败'
    }
  }
}

// 保存图片编辑参数
export interface EditParams {
  crop?: {
    x: number
    y: number
    width: number
    height: number
  }
  rotate?: number // 旋转角度（0-360）
  width?: number
  height?: number
  quality?: number | string
  effects?: {
    brightness?: number // -100 到 100
    contrast?: number // -100 到 100
    saturation?: number // -100 到 100
    hue?: number
    blur?: number
    sharpen?: number
  }
  overlay?: {
    text?: string
    color?: string
  }
}

// 保存编辑后的图片为新图片
export async function saveEditedImageAsNew(
  imageId: string,
  editParams: EditParams,
  imageData: string, // base64 图片数据
  overwrite: boolean = false // 是否覆盖原图
): Promise<{
  success: boolean
  message?: string
  error?: string
  data?: {
    id: string
    publicId: string
    secureUrl: string
  }
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return {
        success: false,
        error: '请先登录'
      }
    }

    // 获取原始图片信息
    const originalImage = await prisma.image.findUnique({
      where: { id: imageId },
      select: {
        userId: true,
        publicId: true,
        secureUrl: true,
        title: true,
        width: true,
        height: true,
        format: true
      }
    })

    if (!originalImage) {
      return {
        success: false,
        error: '图片不存在'
      }
    }

    if (originalImage.userId !== session.user.id) {
      return {
        success: false,
        error: '无权编辑此图片'
      }
    }

    // 从 base64 数据中提取图片数据
    // imageData 格式: "data:image/png;base64,..." 或 "data:image/jpeg;base64,..."
    const base64Image = imageData

    if (overwrite) {
      // 覆盖原图
      const uploadResult = await cloudinary.uploader.upload(base64Image, {
        public_id: originalImage.publicId,
        resource_type: 'image',
        overwrite: true,
        invalidate: true // 清除 CDN 缓存
      })

      // 获取上传后的图片信息
      const uploadedImage = await cloudinary.api.resource(uploadResult.public_id, {
        resource_type: 'image'
      })

      // 更新数据库记录
      const updatedImage = await prisma.image.update({
        where: { id: imageId },
        data: {
          secureUrl: uploadResult.secure_url,
          width: uploadedImage.width,
          height: uploadedImage.height,
          format: uploadedImage.format,
          bytes: uploadResult.bytes,
        }
      })

      revalidatePath('/dashboard')

      return {
        success: true,
        message: '图片已覆盖保存',
        data: {
          id: updatedImage.id,
          publicId: updatedImage.publicId,
          secureUrl: updatedImage.secureUrl
        }
      }
    } else {
      // 保存为新图片
      const uploadResult = await cloudinary.uploader.upload(base64Image, {
        folder: `image-gallery/${session.user.id}`,
        public_id: `${originalImage.publicId}_edited_${Date.now()}`,
        resource_type: 'image',
        overwrite: false
      })

      // 获取上传后的图片信息
      const uploadedImage = await cloudinary.api.resource(uploadResult.public_id, {
        resource_type: 'image'
      })

      // 保存到数据库
      const newImage = await prisma.image.create({
        data: {
          publicId: uploadResult.public_id,
          secureUrl: uploadResult.secure_url,
          width: uploadedImage.width,
          height: uploadedImage.height,
          format: uploadedImage.format,
          bytes: uploadResult.bytes,
          title: originalImage.title ? `${originalImage.title} (已编辑)` : null,
          userId: session.user.id,
          takenAt: null, // 编辑后的图片不继承拍摄时间
        }
      })

      revalidatePath('/dashboard')

      return {
        success: true,
        message: '编辑后的图片已保存',
        data: {
          id: newImage.id,
          publicId: newImage.publicId,
          secureUrl: newImage.secureUrl
        }
      }
    }

  } catch (error) {
    console.error('保存编辑后的图片失败:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '保存编辑后的图片失败'
    }
  }
}

// 重置图片编辑（删除编辑参数）
export async function resetImageEdit(imageId: string): Promise<{
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

    // 验证图片所有权
    const image = await prisma.image.findUnique({
      where: { id: imageId },
      select: { userId: true }
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
        error: '无权操作此图片'
      }
    }

    // 重置编辑参数
    await prisma.image.update({
      where: { id: imageId },
      data: {
        editParams: undefined
      }
    })

    revalidatePath('/dashboard')

    return {
      success: true,
      message: '编辑已重置'
    }
  } catch (error) {
    console.error('重置编辑失败:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '重置编辑失败'
    }
  }
}

// 获取单张图片详情
export async function getImageById(imageId: string): Promise<{
  success: boolean
  data?: any
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

    const image = await prisma.image.findUnique({
      where: { id: imageId },
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
      }
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
        error: '无权查看此图片'
      }
    }

    return { success: true, data: image }
  } catch (error) {
    console.error('获取图片详情失败:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '获取图片详情失败'
    }
  }
}

// 更新图片信息（包括日期等）
export async function updateImage(
  imageId: string,
  updates: {
    title?: string | null
    takenAt?: Date | null
    location?: string | null
    camera?: string | null
    lens?: string | null
  }
): Promise<{
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

    // 验证图片所有权 - 如果表不存在，尝试从 Cloudinary 获取并创建记录
    let image: { userId: string } | null = null
    
    try {
      image = await prisma.image.findUnique({
        where: { id: imageId },
        select: { userId: true }
      })
    } catch (dbError: any) {
      // 如果表不存在，尝试通过 publicId 查找（imageId 可能是 publicId）
      if (dbError?.code === 'P2021' || dbError?.message?.includes('does not exist')) {
        console.log('Image 表不存在，尝试从 Cloudinary 获取图片信息')
        
        // 如果 imageId 是 publicId，尝试从 Cloudinary 获取
        // 由于无法直接更新 Cloudinary 的元数据，我们只能返回错误
        return {
          success: false,
          error: '数据库表不存在，请先运行数据库迁移。图片信息存储在 Cloudinary，无法直接更新元数据。'
        }
      }
      throw dbError
    }

    if (!image) {
      return {
        success: false,
        error: '图片不存在'
      }
    }

    if (image.userId !== session.user.id) {
      return {
        success: false,
        error: '无权编辑此图片'
      }
    }

    // 更新图片信息
    try {
      await prisma.image.update({
        where: { id: imageId },
        data: {
          ...(updates.title !== undefined && { title: updates.title }),
          ...(updates.takenAt !== undefined && { takenAt: updates.takenAt }),
          ...(updates.location !== undefined && { location: updates.location }),
          ...(updates.camera !== undefined && { camera: updates.camera }),
          ...(updates.lens !== undefined && { lens: updates.lens }),
        }
      })
    } catch (updateError: any) {
      if (updateError?.code === 'P2021' || updateError?.message?.includes('does not exist')) {
        return {
          success: false,
          error: '数据库表不存在，请先运行数据库迁移：pnpm prisma migrate dev'
        }
      }
      throw updateError
    }

    revalidatePath('/dashboard')
    revalidatePath('/')

    return {
      success: true,
      message: '图片信息更新成功'
    }
  } catch (error) {
    console.error('更新图片信息失败:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '更新图片信息失败'
    }
  }
}