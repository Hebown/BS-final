'use server'

import { redirect } from "next/navigation";
import { signIn } from "../auth";
import {z} from "zod"
import { revalidatePath } from "next/cache";

const loginScheme=z.object({
    email:z.email('请输入有效的邮箱地址'),
    password:z.string().min(1,'密码不能为空')
})

export type LoginState={
    success?:boolean
    message?:string
    errors?:{
        email?:string[]
        password?:string[]
    }
}

export async function login(
    prevState:LoginState|null,
    formData:FormData
):Promise<LoginState>{
    const validatedFields=loginScheme.safeParse({
        email:formData.get('email'),
        password:formData.get('password')
    })

    if(!validatedFields.success){
        const treeifiedProperties=z.treeifyError(validatedFields.error).properties;
        return {
            errors:{
                email:treeifiedProperties?.email?.errors,
                password:treeifiedProperties?.password?.errors
            },
            message:'表单验证失败，请检查输入是否符合规则'
        }
    }

    const {email,password}=validatedFields.data
    try{
        const result=await signIn('credentials',{
            email:email,
            password:password,
            redirect:false
        })
        
        // NextAuth v5: signIn 返回的对象包含 error 属性
        if(result?.error){
            return {
                success:false,
                message:result.error === 'CredentialsSignin' 
                    ? '邮箱或密码错误，请检查后重试' 
                    : `登录失败: ${result.error}`
            }
        }
    }catch(error){
        console.error('登录异常:', error)
        return {
            success:false,
            message:`登录失败: ${error instanceof Error ? error.message : '未知错误'}`
        }
    }
    revalidatePath('/')
    redirect('/')
}

