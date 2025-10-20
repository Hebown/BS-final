'use server'

import { User } from '@/generated/prisma'
import { prisma } from '../db'
import { revalidatePath } from 'next/cache'
import {z} from 'zod'

const createUserSchema= z.object({
    username:z.string()
        .min(3,'用户名至少需要3字符')
        .max(20,'用户名长度必须小于20字符')
        .regex(/^[a-zA-Z0-9_]+$/,'用户名只能包含字母、数字和下划线'),
    email: z.email('请输入有效的邮箱地址')
})

export type CreateUserState={
    success?:boolean
    message?:string
    errors?:{
        username?:string[]
        email?:string[] 
    }
    data?:{
        id:string
        username:string
        email:string
        createdAt:Date
    }
}

export async function createUser(
    prevState:CreateUserState|null,
    formData:FormData
):Promise<CreateUserState>{
    const validatedFields=createUserSchema.safeParse({
        username:formData.get('username'),
        email:formData.get('email')
    });

    if(!validatedFields.success){
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message:'表单验证失败，请检查输入是否符合规则'
        }
    }
    const {username,email}=validatedFields.data

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
                errors.username=['邮箱已使用']
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
                createdAt: new Date()
            }
        })

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

export async function getUsers():Promise<{
    success:boolean
    data?:User[]
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