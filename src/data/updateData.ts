import { PrismaClient } from '@prisma/client'
import * as Task from 'fp-ts/lib/Task'
import * as A from 'fp-ts/lib/Array'
import { pipe } from 'fp-ts/lib/pipeable'
import { pick } from 'macoolka-object'
import * as dateFns from 'date-fns';
import { isString } from 'macoolka-predicate'

const getTodayBegin = (a: Date | string) => {
    const cloneValue = new Date(isString(a) ? a : a.toISOString())
    const b = new Date(cloneValue.setHours(0, 0, 0, 0))
    return b;
}
const getTodayEnd = (a: Date | string) => {
    const cloneValue = new Date(isString(a) ? a : a.toISOString())
    const b = new Date(cloneValue.setHours(0, 0, 0, 0))
    return dateFns.addDays(b, 1)

}
export interface BasicRecord {
    suspectedCount: number,
    confirmedCount: number,
    curedCount: number,
    deadCount: number,
    recordAt: Date | string
}
export interface CountryRecord extends BasicRecord {
    seriousCount?: number,
    suspectedAddCount?: number,
    confirmedAddCount?: number,
    seriousAddCount?: number,
    curedAddCount?: number,
    deadAddCount?: number,
    country: string,
    continents: string,
}

export interface ProvinceRecord extends BasicRecord {

    country: string,
    province: string
}

export interface CityRecord extends BasicRecord {
    country: string,
    province: string,
    city: string,
}
export interface NCOVRecord {
    countries: CountryRecord[],
    provinces: ProvinceRecord[],
    cities: CityRecord[]
}

const recordToDB = (data: NCOVRecord, sourceUrl = 'https://ncov.dxy.cn/ncovh5/view/pneumonia') => {

    const photon = new PrismaClient();
    const upsertCountryTask = (current: { country: string, continents?: string }) => pipe(
        () => photon.countries.upsert({
            where: { id: current.country },
            create: {
                id: current.country,
                title: current.country,
                continents: current.continents
            },
            update: {
                continents: current.continents
            }
        })
    )
    const upsertProvinceTask = (current: ProvinceRecord) => () => photon.provinces.upsert({
        where: { id: current.province },
        create: {
            id: current.province,
            title: current.province,
            country: {
                connect: { id: current.country }
            }
        },
        update: {
    
        }
    })
    const upsertCityTask = (current: CityRecord) => () => photon.cities.upsert({
        where: { id: current.city },
        create: {
            id: current.city,
            title: current.city,
            province: {
                connect: { id: current.province }
            }
        },
        update: {
    
        }
    })
    const toCountryDB = (current: CountryRecord) => {

        const country: Task.Task<any> = upsertCountryTask(current);

        const recordTask: Task.Task<any> = pipe(
            () => {

                return photon.countryRecords.findMany({
                    where: {
                        recordAt: { gte: getTodayBegin(current.recordAt), lte: getTodayEnd(current.recordAt) },
                        country: { id: { equals: current.country } },
                    }
                })
            },
            Task.chain(value => {

                const id = value.length > 0 ? value[0].id : undefined;
                if (id) {

                    const update: Task.Task<any> = () => (value[0].recordAt < current.recordAt) ? photon.countryRecords.update({
                        where: { id: id },
                        data: {
                            ...pick(current, ['suspectedCount', 'confirmedCount',
                             'curedCount', 'deadCount', 'seriousCount', 'continents',
                                'suspectedAddCount', 'confirmedAddCount', 'curedAddCount', 
                                'deadAddCount', 'seriousAddCount']),
                            recordAt: current.recordAt,
                            country: { connect: { id: current.country } },
                            sourceUrl,
                            virus: { connect: { id: 'cnov' } }
                        }
                    }) : void 0
                    return update;
                } else {
                    const create = () => photon.countryRecords.create({
                        data: {
                            ...pick(current, ['suspectedCount', 'confirmedCount',
                                'curedCount', 'deadCount', 'seriousCount', 'continents',
                                'suspectedAddCount', 'confirmedAddCount', 'curedAddCount',
                                'deadAddCount', 'seriousAddCount']),
                            recordAt: current.recordAt,
                            country: { connect: { id: current.country } },
                            sourceUrl,
                            virus: { connect: { id: 'cnov' } }
                        }
                    })
                    return pipe(
                        [country, create],
                        A.array.sequence(Task.taskSeq),
                    )
                }
            }))
        return recordTask

    }

    const toDB = (a: NCOVRecord):Task.Task<void> => {

        return pipe(
            [
                ...a.countries.map(toCountryDB),
                ...a.provinces.map(toProvinceDB),
                ...a.cities.map(toCityDB)
            ],
            A.array.sequence(Task.taskSeq),
            Task.chain(() =>async()=>await photon.disconnect())
        )
    }

    const toCityDB = (current: CityRecord) => {

        const country: Task.Task<any> = upsertCountryTask(current)
        const province: Task.Task<any> = upsertProvinceTask(current)
        const city: Task.Task<any> = upsertCityTask(current)
        const virusRecord: Task.Task<any> = pipe(
            () => {
                return photon.cityRecords.findMany({
                    where: {
                        recordAt: { gte: getTodayBegin(current.recordAt), lte: getTodayEnd(current.recordAt) },
                        city: { id: { equals: current.city } },
                        province: { id: { equals: current.province } },
                        country: { id: { equals: current.country } },
                    }
                })
            },
            Task.chain(value => {

                const id = value.length > 0 ? value[0].id : undefined;
                if (id) {

                    const update: Task.Task<any> = () => value[0].recordAt <= current.recordAt ? photon.cityRecords.update({
                        where: { id: id },
                        data: {
                            ...pick(current, ['suspectedCount', 'confirmedCount', 'curedCount', 'deadCount']),
                            recordAt: current.recordAt,
                            country: { connect: { id: current.country } },
                            province: {
                                connect: { id: current.province }

                            },
                            city: {
                                connect: { id: current.city },
                            },
                            sourceUrl,
                            virus: { connect: { id: 'cnov' } }
                        }
                    }) : void 0
                    return update

                } else {
                    const create = () => photon.cityRecords.create({
                        data: {
                            ...pick(current, ['suspectedCount', 'confirmedCount', 'curedCount', 'deadCount']),
                            recordAt: current.recordAt,
                            country: { connect: { id: current.country } },
                            province: {
                                connect: { id: current.province }

                            },
                            city: {
                                connect: { id: current.city },
                            },
                            sourceUrl,
                            virus: { connect: { id: 'cnov' } }
                        }
                    })
                    return pipe(
                        [country, province, city, create],
                        A.array.sequence(Task.taskSeq),
                    )
                }
            }))

        return virusRecord
    }
    const toProvinceDB = (current: ProvinceRecord) => {

        const country: Task.Task<any> = upsertCountryTask(current)
        const province: Task.Task<any> = upsertProvinceTask(current)
        const virusRecord: Task.Task<any> = pipe(
            () => {
                return photon.provinceRecords.findMany({
                    where: {
                        recordAt: { gte: getTodayBegin(current.recordAt), lte: getTodayEnd(current.recordAt) },
                        province: { id: { equals: current.province } },
                        country: { id: { equals: current.country } },
                    }
                })
            },
            Task.chain(value => {

                const id = value.length > 0 ? value[0].id : undefined;
                if (id) {

                    const update: Task.Task<any> = () => value[0].recordAt <= current.recordAt ? photon.provinceRecords.update({
                        where: { id: id },
                        data: {
                            ...pick(current, ['suspectedCount', 'confirmedCount', 'curedCount', 'deadCount']),
                            recordAt: current.recordAt,
                            country: { connect: { id: current.country } },
                            province: {
                                connect: { id: current.province }

                            },
                            sourceUrl,
                            virus: { connect: { id: 'cnov' } }
                        }
                    }) : void 0
                    return update

                } else {
                    return pipe(
                        [country, province, () => photon.provinceRecords.create({
                            data: {
                                ...pick(current, ['suspectedCount', 'confirmedCount', 'curedCount', 'deadCount']),
                                recordAt: current.recordAt,
                                country: { connect: { id: current.country } },
                                province: {
                                    connect: { id: current.province }

                                },

                                sourceUrl,
                                virus: { connect: { id: 'cnov' } }
                            }
                        })],
                        A.array.sequence(Task.taskSeq),

                    )
                }
            }))

        return virusRecord
    }
    return toDB(data)
}
export default recordToDB