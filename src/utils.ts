import { verify, sign } from 'jsonwebtoken'
import { Context } from './context'
import { compare, hash } from 'bcryptjs'
import constants from './constants'
interface Token {
  userId: string
}

export function getUserId(context: Context) {
  const Authorization = context.request.get('Authorization')
  if (Authorization) {
    const token = Authorization.replace('Bearer ', '')
    const verifiedToken = verify(token, constants.APP_SECRET) as Token
    return verifiedToken && verifiedToken.userId
  }
}
export const hashPassword = (size: number = 10) => (password: string) => async () => await hash(password, size)
export const token = (userId: string) => sign({ userId }, constants.APP_SECRET)
export const passwordValid = (password: string, userPassword: string) => async () => await compare(password, userPassword)