
# I18n in TypeScript

`macoolka-i18n` is a library for internationalization in TypeScript.
It easily integrates some localization features to your Application.


**Inspired by**

- [intl-messageformat](https://github.com/yahoo/intl-messageformat)


# Installation

To install the stable version:

```
npm install macoolka-18n
```


## Consuming macoolka-i18n

Format a message to string

```ts
import buildi18n, { I18NOptions, MessageInfo } from 'macoolka-i18n'
    /**
     * The Appliction's i18n option.
     */
    const options = {
        languages: ['en', 'zh'],
        defaultLanguage: 'en',
        locale: 'en',
        /**
         * The i18n message
         */
        data: {
            en: {
                'macoolka.test.noparam': 'noparam',
                'macoolka.test.oneparam': 'one params {value}',
                'macoolka.test.plural': ` You have {value, plural,
                    =0 {no photos.}
                    =1 {one photo.}
                    other {# photos.}
                }`
            },
            zh: {
                'macoolka.test.noparam': '没有参数',
                'macoolka.test.oneparam': '一个参数 {value}'
            }
        }
    }
    type Message = MessageInfo<keyof typeof options.data.en, { value: number }>;
    const formatI18N = buildi18n<Message>(options)


    const formatNoParam = formatI18N({ id: 'macoolka.test.noparam', value: { value: 0 } })
    it('no param', () => {

        expect(formatNoParam({})).toEqual('noparam')
        expect(formatNoParam({ i18n: { locale: 'zh' } })).toEqual('没有参数')
    })
    const formatOneParam = formatI18N({ id: 'macoolka.test.oneparam', value: { value: 111 } })
    it('one param', () => {

        expect(formatOneParam({})).toEqual('one params 111')
        expect(formatOneParam({ i18n: { locale: 'zh' } })).toEqual('一个参数 111')
    })
    it('format array', () => {

        const format = formatI18N(
            [
                { id: 'macoolka.test.oneparam', value: { value: 111 } },
                { id: 'macoolka.test.noparam', value: { value: 0 } }
            ]
        )

        expect(format({})).toEqual('one params 111' + '\n' + 'noparam')
        expect(format({ i18n: { locale: 'zh' } })).toEqual('一个参数 111' + '\n' + '没有参数')
    })
    it('plural', () => {

        expect(
            formatI18N(
                {
                    id: 'macoolka.test.plural',
                    value: { value: 0 }
                })({})
        ).toEqual(" You have no photos.")
        expect(
            formatI18N(
                {
                    id: 'macoolka.test.plural',
                    value: { value: 1 }
                })({})
        ).toEqual(" You have one photo.")
        expect(
            formatI18N(
                {
                    id: 'macoolka.test.plural',
                    value: { value: 2 }
                })({})
        ).toEqual(" You have 2 photos.")
    })
```

Valiadition


```ts

import buildi18n, { MessageInfo, i18ValidationMonoid } from 'macoolka-i18n'
import * as E from 'fp-ts/lib/Either'
import { pipe } from 'fp-ts/lib/pipeable'
import { fold } from 'fp-ts/lib/Monoid'
     /**
     * The Appliction's i18n option.
     */
    const options = {
        languages: ['en', 'zh'],
        defaultLanguage: 'en',
        locale: 'en',
        /**
         * The i18n message
         */
        data: {
            en: {
                'macoolka.test.name': 'Name length must is less than 5,actual is {value}',
                'macoolka.test.age': 'Age must is middle of (1,120) type,actual is {value}',

            },
            zh: {
                'macoolka.test.name': '名称长度必须小于5，实际是{value}',
                'macoolka.test.age': '年龄必须在1和120之间，实际是{value}',
            }
        }
    }
    /**
     * Message Type
     */
    type Message = MessageInfo<keyof typeof options.data.en, { value: string | number }>;
    /**
     * Format a message
     */
    const formatI18N = buildi18n<Message>(options)
    /**
     * The Type be valided
     */
    interface Person {
        name: string,
        age: number
    }
    /**
     * Valid a Person with name
     * 
     */
    const validPersonName = (a: Person) => {
        return a.name.length > 5
            ? E.left(formatI18N({ id: 'macoolka.test.name', value: { value: a.name } }))
            : E.right(a)
    }
    /**
    * Valid a Person with age
    * 
    */
    const validPersonAge = (a: Person) => {
        return a.age < 1 || a.age > 120
            ? E.left(formatI18N({ id: 'macoolka.test.age', value: { value: a.age } }))
            : E.right(a)
    }
    /**
     * 
     */
    const i18nMonoid = i18ValidationMonoid({ name: '', age: 0 } as Person)
    /**
     * Valid a Person
     * 
     */
    const validPerson = (a: Person) => {
        return pipe(
            [validPersonName(a), validPersonAge(a)],
            fold(i18nMonoid),
        )

    }

    it('validPerson correct', () => {

        pipe(
            validPerson({ name: 'abc', age: 12 }),
            a => {
                expect(E.isRight(a)).toEqual(true)

                return a
            },
            E.map(a => {

                expect(a).toEqual({ name: 'abc', age: 12 })

            })
        )

    })
    it('validPerson one error', () => {

        pipe(
            validPerson({ name: 'abcdefg', age: 12 }),
            a => {
                expect(E.isLeft(a)).toEqual(true)
                return a
            },
            E.mapLeft(a => {
                const result = a({});
                const resultZh = a({ i18n: { locale: 'zh' } });
                expect(result).toEqual('Name length must is less than 5,actual is abcdefg')
                expect(resultZh).toEqual('名称长度必须小于5，实际是abcdefg')
            })
        )

    })
    it('validPerson mutli error', () => {

        pipe(
            validPerson({ name: 'abcdefg', age: -1 }),
            a => {
                expect(E.isLeft(a)).toEqual(true)
                return a
            },
            E.mapLeft(a => {
                const result = a({});
                const resultZh = a({ i18n: { locale: 'zh' } });
                expect(result).toEqual("Name length must is less than 5,actual is abcdefg\nAge must is middle of (1,120) type,actual is -1")
                expect(resultZh).toEqual("名称长度必须小于5，实际是abcdefg\n年龄必须在1和120之间，实际是-1")
            })
        )

    })
```


# License

The MIT License (MIT)
