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
                    
                    // 使用 bcrypt 进行密码比对（密文比较）
                    const isPasswordValid = await bcrypt.compare(inputPassword, user.password)
                    
                    if(!isPasswordValid){
                        console.log('登录失败: 邮箱或密码错误')
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
    session:{
        strategy:'jwt',
        // 设置会话最大有效期
        // 开发环境：1小时（便于测试和调试）
        // 生产环境：30天
        maxAge: process.env.NODE_ENV === 'development' ? 60 * 60 : 30 * 24 * 60 * 60,
        // 每次更新会话时刷新过期时间
        updateAge: process.env.NODE_ENV === 'development' ? 5 * 60 : 24 * 60 * 60, // 开发环境5分钟，生产环境1天
    },
    cookies: {
        sessionToken: {
            name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.session-token`,
            options: {
                httpOnly: true,
                sameSite: 'lax',
                path: '/',
                // 开发环境：1小时过期，生产环境：30天
                maxAge: process.env.NODE_ENV === 'development' ? 60 * 60 : 30 * 24 * 60 * 60,
                secure: process.env.NODE_ENV === 'production',
            },
        },
    },
    callbacks:{
        jwt:async({token,user})=>{
            // 如果是新用户登录，设置token信息
            if(user){
                token.id=user.id
                token.email=user.email
                token.username=(user as any).username
                // 设置token过期时间（与session.maxAge一致）
                const maxAge = process.env.NODE_ENV === 'development' ? 60 * 60 : 30 * 24 * 60 * 60
                token.exp = Math.floor(Date.now() / 1000) + maxAge
            }
            // 如果token已过期，清除token信息
            if(token.exp && token.exp < Math.floor(Date.now() / 1000)){
                // 返回一个过期的token，NextAuth会自动处理
                token.exp = 0
            }
            return token
        },
        session:async({session,token})=>{
            // 如果token已过期，返回一个无效的session
            if(token.exp && token.exp < Math.floor(Date.now() / 1000)){
                // 返回一个空的session，前端会检测到并重定向到登录页
                return {
                    ...session,
                    user: {
                        ...session.user,
                        id: undefined,
                        email: undefined,
                    },
                    expires: new Date(Date.now() - 1000).toISOString(), // 设置为过去的时间
                }
            }
            if(session.user && token){
                session.user.id=token.id as string
                session.user.email=token.email as string
                ;(session.user as any).username=token.username as string
            }
            return session
        }
    }
})