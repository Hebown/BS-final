'use server'

import { User } from '@/generated/prisma'
import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import {z} from 'zod'
import bcrypt from 'bcryptjs'
import { v2 as cloudinary } from 'cloudinary'

// 配置 Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const createUserSchema= z.object({
    username:z.string()
        .min(3,'用户名至少需要3字符')
        .max(20,'用户名长度必须小于20字符')
        .regex(/^[a-zA-Z0-9_]+$/,'用户名只能包含字母、数字和下划线'),
    email: z.email('请输入有效的邮箱地址'),
    password: z.string().min(6,'密码至少需要6字符')
})

export type CreateUserState={
    success?:boolean
    message?:string
    errors?:{
        username?:string[]
        email?:string[] 
        password?:string[]
    }
    data?:{
        id:string
        username:string
        email:string
        password?:string
        createdAt:Date
    }
}

export async function createUser(
    prevState:CreateUserState|null,
    formData:FormData
):Promise<CreateUserState>{
    const validatedFields=createUserSchema.safeParse({
        username:formData.get('username'),
        email:formData.get('email'),
        password:formData.get('password'),
    });
    
    if(!validatedFields.success){
        const treeifiedProperties = z.treeifyError(validatedFields.error).properties;
        return {
            errors: {
                username: treeifiedProperties?.username?.errors,
                email: treeifiedProperties?.email?.errors,
                password: treeifiedProperties?.password?.errors,
            },
            message: '表单验证失败，请检查输入是否符合规则'
        };
    }

    const {username,email,password}=validatedFields.data
    
    // 确保密码是字符串类型
    const passwordString = String(password)
    
    // 调试信息
    console.log('注册调试信息:')
    console.log('- 密码类型:', typeof passwordString)
    console.log('- 密码长度:', passwordString.length)
    
    // 加密密码
    const hashedPassword = await bcrypt.hash(passwordString, 10)
    
    console.log('- 哈希后长度:', hashedPassword.length)
    console.log('- 哈希前10字符:', hashedPassword.substring(0, 10))

    try{
        const existingUser=await prisma.user.findFirst({
            where:{
                OR:[
                    {username},
                    {email}
                ]
            }
        })

        if(existingUser){
            const errors:CreateUserState['errors']={}
            if(existingUser.email===email){
                errors.email=['邮箱已使用']
            }
            if(existingUser.username===username){
                errors.username=['用户名已使用']
            }
            return {
                errors,
                message:'用户已存在',
            }
        }
        
        const user=await prisma.user.create({
            data:{
                username,
                email,
                password: hashedPassword,
                createdAt: new Date()
            }
        })

        // 在 Cloudinary 中创建用户文件夹
        // Cloudinary 的文件夹是在上传时自动创建的，所以我们上传一个占位符文件来创建文件夹
        try {
            const folderPath = `image-gallery/${user.id}`
            
            // 创建一个 1x1 像素的透明 PNG 作为占位符
            const placeholderImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
            
            // 上传占位符文件以创建文件夹
            const uploadResult = await cloudinary.uploader.upload(placeholderImage, {
                folder: folderPath,
                public_id: '.folder_placeholder',
                resource_type: 'image',
                overwrite: false, // 如果已存在则不覆盖
            })
            
            // 立即删除占位符文件（文件夹会保留）
            try {
                await cloudinary.uploader.destroy(uploadResult.public_id)
            } catch (deleteError) {
                // 如果删除失败，不影响用户创建，只是会留下一个占位符文件
                console.log('删除占位符文件失败（不影响用户创建）:', deleteError)
            }
            
            console.log(`✓ 已在 Cloudinary 中创建用户文件夹: ${folderPath}`)
        } catch (cloudinaryError) {
            // Cloudinary 文件夹创建失败不应该阻止用户注册
            // 文件夹会在用户第一次上传图片时自动创建
            console.error('创建 Cloudinary 文件夹失败（不影响用户创建）:', cloudinaryError)
        }

        revalidatePath('/')

        return {
            success:true,
            message:`用户 ${username} 创建成功！`,
            data:{
                id:user.id,
                username:user.username,
                email:user.email,
                createdAt:user.createdAt,
            }
        }
    }catch(error){
        console.error('未成功创建用户: ',error)
        return {
            message:'创建用户失败，请稍后重试'
        }
    }
}

type SafeUser=Omit<User,"password">

export async function getUsers():Promise<{
    success:boolean
    data?:SafeUser[]
    error?:string
}> 
{
    try{
        const users=await prisma.user.findMany({
            select:{
                id:true,
                username:true,
                email:true,
                createdAt:true,
                updatedAt:true,
            },
            orderBy:{
                createdAt:'desc'
            }
        })
        return {success:true,data:users}
    }catch(error){
        console.error('获取用户失败: ',error)
        return { success:false, error:'获取用户失败'}
    }
}

export async function deleteUser(id:string):Promise<{
    success:boolean
    error?:string
}>
{
  try{
    await prisma.user.delete({
        where:{id}
    })

    revalidatePath('/')
    return {success:true}
  } catch(error){
    console.error(`未能删除 id 为 ${id} 的用户，原因： `,error)
    return {success:false}
  }
}