import { queryType } from 'nexus'
import { getUserId } from '../utils'

export const Query = queryType({

  definition(t) {
    t.crud.countryRecords({filtering:true,ordering:true})
    t.crud.provinceRecords({filtering:true,ordering:true})
    t.crud.cityRecords({filtering:true,ordering:true})
    t.crud.countries()
    t.crud.provinces({filtering:true,ordering:true})
    t.crud.cities({filtering:true,ordering:true})
    t.crud.areas({filtering:true,ordering:true})
    t.crud.virusInfo()
    t.crud.country()
    t.crud.provinces({filtering:true,ordering:true})
    t.crud.city()
    t.field('me', {
      type: 'User',
      nullable: true,
      resolve: (parent, args, ctx) => {
        const userId = getUserId(ctx)
        return ctx.prisma.users.findOne({
          where: {
            id: userId,
          },
        })
      },
    })
  }
 
})
