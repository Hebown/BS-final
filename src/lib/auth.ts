// nextAuth 认证模块

import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "./db"


export const {handlers,auth,signIn,signOut}=NextAuth({
    providers:[
        Credentials({
            name:'credentials',
            credentials:{
                email:{label:'email',type:'email'},
                password:{label:'password',type:'password'}
            },
            authorize:async(credentials)=>{
                const user=await prisma.user.findUnique({
                    where:{email:credentials?.email as string}
                })
                if(user&& credentials?.password===user.password){
                    return {id:user.id,email:user.email}
                }
                return null
            }
        })
    ],
    session:{strategy:'jwt'}
})