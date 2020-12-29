import { type } from "os"

export type NonEmptyList<T> = { readonly head: T, readonly tail: readonly T[] }
export type ParserError = { readonly originalValue: unknown, readonly reason: string }
type Functor<A> = { readonly map: <B>(f: (a: A) => B) => ParserResult<B> }
type Zip<A> = Functor<A> & { readonly product: <B>(f: ParserResult<B>) => ParserResult<readonly [A, B]> }
export type ParserErrors = NonEmptyList<ParserError>
export type ParserSuccess<T> = { readonly result: T, readonly __isError: false } & Zip<T>
export type ParserFailure<T> = { readonly errors: ParserErrors, readonly __isError: true } & Zip<T>
export type ParserResult<T> = ParserSuccess<T> | ParserFailure<T>
type IsOptionalParser<T, B extends boolean> = B extends true ? ParserFor<T | undefined> : ParserFor<Exclude<T, null | undefined>>

type ParserFor<O, I = unknown> = {
    readonly parse: (a: I) => ParserResult<O>
    readonly map: <U>(f: (t: O) => U) => ParserFor<U, I>
    readonly subflatMap: <U>(f: (t: O) => ParserResult<U>) => ParserFor<U, I>
    readonly then: <U>(other: ParserFor<U, O>) => ParserFor<U, I>
    readonly optional: <B extends boolean>(isOptional: B) => IsOptionalParser<O, B>
    readonly or: <U>(other: ParserFor<U, I>) => ParserFor<O | U, I>
}

const flatten = <T>(arr: readonly (readonly T[] | T)[]): readonly T[] => {
    const cast = arr as readonly T[]
    return cast.length ? (() => {
        const [head, ...tail] = cast

        return (Array.isArray(head) ? flatten(head) : [head]).concat(flatten(tail))
    })() : cast
}

type Factory<T> = T | (() => T)
const isFactory = <T>(t: Factory<T>): t is () => T => typeof t === 'function'
const fromFactory = <T>(t: Factory<T>): T => isFactory(t) ? t() : t

const nelAppend = <T>(f1: NonEmptyList<T>, f2: NonEmptyList<T>): NonEmptyList<T> => ({ head: f1.head, tail: f1.tail.concat(f2.head, ...f2.tail)})

export const ParserResult = {
    isSuccess: <(<T>(pr: ParserResult<T>) => pr is ParserSuccess<T>)>(pr => !pr.__isError),
    try: <A>(f: () => A): ParserResult<A> => {
        // eslint-disable-next-line functional/no-try-statement
        try {
            const a = f()
            return ParserResult.valid(a)
        } catch (e) {
            return ParserResult.invalid({ head: (e.message || e.toString()), tail: [] })
        }
    },
    when: (cond: boolean) => <A>(ifTrue: A, ifFalse: ParserError): ParserResult<A> => {
        return cond ? ParserResult.valid(ifTrue) : ParserResult.invalid({ head: ifFalse, tail: [] })
    },
    valid: <A>(a: A): ParserResult<A> => ({
        __isError: false,
        result: a,
        map: (f) => ParserResult.valid(f(a)),
        product: <B>(prb: ParserResult<B>) => ParserResult.match<B, ParserResult<readonly [A, B]>>(prb)({
            valid: (b) => ParserResult.valid([a, b.result]),
            invalid: (e) => ParserResult.invalid<readonly [A, B]>(e.errors)
        })
    }),
    invalid: <A>(errors: ParserErrors): ParserResult<A> => ({
        __isError: true,
        errors: errors,
        map: () => ParserResult.invalid(errors),
        product: <B>(prb) => ParserResult.match<B, ParserResult<readonly [A, B]>>(prb)({
            valid: () => ParserResult.invalid(errors),
            invalid: e => ParserResult.invalid(nelAppend(errors, e.errors))
        })
    }),
    match: <A, B>(pr: ParserResult<A>) => (matchers: {
        readonly valid: (a: ParserSuccess<A>) => B,
        readonly invalid: (pe: ParserFailure<A>) => B
    }): B => ParserResult.isSuccess(pr) ? matchers.valid(pr) : matchers.invalid(pr)
}

export const Parser = {
    for: <O, I = unknown>(f: (a: I) => ParserResult<O>): ParserFor<O, I> => Object.assign({}, { parse: f }, {
        map: <B>(fab: (a: O) => B): ParserFor<B> => Parser.for<B, I>(u => f(u).map(fab)),
        subflatMap: <B>(fb: (t: O) => ParserResult<B>) => Parser.for<B, I>(u => ParserResult.match<O, ParserResult<B>>(f(u))({
            invalid: e => e as unknown as ParserFailure<B>,
            valid: v => fb(v.result)
        })),
        then: <B>(other: ParserFor<B, O>) => Parser.for<B, I>(u => ParserResult.match<O, ParserResult<B>>(f(u))({
            invalid: e => e as unknown as ParserFailure<B>,
            valid: v => other.parse(v.result)
        })),
        or: <B>(other: ParserFor<B, I>) => Parser.for<O | B, I>(u => ParserResult.match<O, ParserResult<O | B>>(f(u))({
            invalid: e => ParserResult.match<B, ParserResult<O | B>>(other.parse(u))({
                invalid: eo => ParserResult.invalid(nelAppend(e.errors, eo.errors)),
                valid: vo => vo
            }),
            valid: v => v
        })),
        optional: <B extends boolean>(b: B) => (b ?
            Parser.for<O | undefined, I>(a => a ?
                f(a) :
                ParserResult.valid(undefined)) :
            Parser.for<O, I>(a => !a ? ParserResult.invalid<Exclude<O, null | undefined>>({ head: { originalValue: undefined, reason: "Mandatory value not present" }, tail: [] }) : f(a))) as IsOptionalParser<O, B>
    })
}

export const Parsers = {
    string: Parser.for<string>(a => ParserResult.when(typeof a === 'string' || a instanceof String)(a as string, { originalValue: a, reason: `Expected string. Got: ${a}` })),
    matches: (pattern: string | RegExp): ParserFor<string> => Parser.for<string, string>(s => (new RegExp(pattern).test(s)) ?  ParserResult.valid(s) : ParserResult.invalid({head: {reason: `Expected value ${s} to match ${pattern}`, originalValue: s}, tail: []})),
    toString: Parser.for(a => ParserResult.valid(a.toString())),
    number: Parser.for<number>(a => ParserResult.when(typeof a === 'number')(a as number, { originalValue: a, reason: `Expected number. Got: ${a}` })),
    parseInt: Parser.for<number, string>(a => {
        const i = parseInt(a)
        return ParserResult.when(!isNaN(i))(i, { originalValue: a, reason: `Expected valid int. Got: ${a}` })
    }),
    parseFloat: Parser.for<number, string>(a => {
        const i = parseFloat(a)
        return ParserResult.when(!isNaN(i))(i, { originalValue: a, reason: `Expected valid float. Got: ${a}` })
    }),
    bool: Parser.for<boolean>(a => ParserResult.when(typeof a === 'boolean')(a as boolean, { originalValue: a, reason: `Expected boolean. Got: ${a}` })),
    array: <A>(pa: Factory<ParserFor<A>>): ParserFor<readonly A[]> => Parser.for(u =>
        !Array.isArray(u) ?
            ParserResult.invalid({ head: { reason: `Expected an array, Got: ${u}`, originalValue: u }, tail: [] }) :
            u.reduce((p, n) => p.product(fromFactory(pa).parse(n)).map(flatten), ParserResult.valid([]))
    ),
    parseBool: Parser.for<boolean, string>(a => {
        const i = a == "true" ? true : a == "false" ? false : undefined
        return ParserResult.when(i !== undefined)(i, { originalValue: a, reason: `Expected valid bool. Got: ${a}` })
    }),
    parseDate: Parser.for<Date, string>(a => {
        const i = Date.parse(a)
        return ParserResult.when(!isNaN(i))(new Date(i), { originalValue: a, reason: `Expected valid float. Got: ${a}` })
    }),
    for: <T>(parser: { readonly [k in keyof T]: (ParserFor<T[k]> | (() => ParserFor<T[k]>)) }): ParserFor<T, unknown> => Parser.for(o => {
        type KeyValuePair = { readonly key: string, readonly value: T[keyof T] }
        const [head, ...tail] = Object.keys(parser)
        const results = tail.reduce<ParserResult<readonly KeyValuePair[]>>((p, n) => {
            const k = n as keyof T
            const next = fromFactory(parser[k]).parse(o[k]).map<KeyValuePair>(a => ({ key: n, value: a }))
            return p.product(next).map(t => flatten(t))
        }, fromFactory(parser[head as keyof T]).parse(o[head]).map<readonly KeyValuePair[]>(a => ([{ key: head, value: a }])))

        return results.map((r) => r.reduce((p, n) => Object.assign({}, p, { [n.key]: n.value }), {} as T))
    })
}