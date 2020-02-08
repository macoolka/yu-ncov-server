import { objectType } from 'nexus'
export const Country = objectType({
    name: 'Country',
    definition(t) {
        t.model.id()
        t.model.title()
        t.model.provinces()
    },
})
export const Province = objectType({
    name: 'Province',
    definition(t) {
        t.model.id()
        t.model.title()
        t.model.country()
        t.model.cities()
    },
})

export const City = objectType({
    name: 'City',
    definition(t) {
        t.model.id()
        t.model.title()
        t.model.province()
        t.model.areas()
    },
})

export const Area = objectType({
    name: 'Area',
    definition(t) {
        t.model.id()
        t.model.title()
        t.model.city()
    },
})