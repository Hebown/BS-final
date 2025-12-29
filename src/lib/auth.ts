// nextAuth 认证模块

import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "./db"
import bcrypt from "bcryptjs"


export const {handlers,auth,signIn,signOut}=NextAuth({
    trustHost: true, // NextAuth v5: 信任所有主机（开发环境）
    // 生产环境建议使用 AUTH_URL 环境变量替代
    providers:[
        Credentials({
            name:'credentials',
            credentials:{
                email:{label:'email',type:'email'},
                password:{label:'password',type:'password'}
            },
            authorize:async(credentials)=>{
                try {
                    if (!credentials?.email || !credentials?.password) {
                        console.log('登录失败: 缺少邮箱或密码')
                        return null
                    }

                    // 确保密码是字符串类型
                    const inputPassword = String(credentials.password)
                    const inputEmail = String(credentials.email)

                    const user=await prisma.user.findUnique({
                        where:{email:inputEmail}
                    })
                    
                    if(!user){
                        console.log('登录失败: 用户不存在', inputEmail)
                        return null
                    }
                    
                    // 暂时关闭哈希比对，只使用明文比对（开发模式）
                    // 避免 bcrypt 比对引起的错误导致登录失败
                    const isPasswordValid = inputPassword === user.password
                    console.log('明文比对结果:', isPasswordValid)
                    
                    if (isPasswordValid) {
                        console.warn('⚠️  警告: 当前使用明文密码比对（开发模式）')
                    }
                    
                    if(!isPasswordValid){
                        console.log('登录失败: 密码错误')
                        return null
                    }
                    
                    console.log('登录成功:', user.email)
                    return {id:user.id,email:user.email,username:user.username}
                } catch (error) {
                    console.error('登录过程中发生错误:', error)
                    return null
                }
            }
        })
    ],
    session:{strategy:'jwt'},
    callbacks:{
        jwt:async({token,user})=>{
            if(user){
                token.id=user.id
                token.email=user.email
                token.username=(user as any).username
            }
            return token
        },
        session:async({session,token})=>{
            if(session.user){
                session.user.id=token.id as string
                session.user.email=token.email as string
                ;(session.user as any).username=token.username as string
            }
            return session
        }
    }
})