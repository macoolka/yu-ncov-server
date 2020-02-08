import { mutationType, stringArg, arg, idArg } from 'nexus'
import { passwordValid, token, hashPassword } from '../utils'
export const Mutation = mutationType({
  definition(t) {
  

    t.field('signup', {
      type: 'AuthPayload',
      args: {
        name: stringArg(),
        nickname: stringArg(),
        email: stringArg({ nullable: false }),
        password: stringArg({ nullable: false }),
      },
      resolve: async (_parent, { name, email, password, nickname }, ctx) => {
        const hashedPassword = await hashPassword()(password)()
        const user = await ctx.prisma.users.create({
          data: {
            name,
            nickname: nickname,
            email,
            password: hashedPassword,
          },
        })
        return {
          token: token(user.id),
          user,
        }
      },
    })

    t.field('login', {
      type: 'AuthPayload',
      args: {
        email: stringArg({ nullable: false }),
        password: stringArg({ nullable: false }),
      },
      resolve: async (_parent, { email, password }, ctx) => {
        const user = await ctx.prisma.users.findOne({
          where: {
            email,
          },
        })
        if (!user) {
          throw new Error(`No user found for email: ${email}`)
        }
        const passwordPass = await passwordValid(password, user.password)()
        if (!passwordPass) {
          throw new Error('Invalid password')
        }
        return {
          token: token(user.id),
          user,
        }
      },
    })
  },
})
