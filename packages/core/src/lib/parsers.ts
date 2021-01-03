import { NonEmptyArray, cons, concat } from "./non-empty-array"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ParserError = { readonly originalValue: any, readonly reason: string }
export type ParserErrors = NonEmptyArray<ParserError>
export type ParserSuccess<T> = { readonly result: T, readonly __isError: false }
export type ParserFailure = { readonly errors: ParserErrors, readonly __isError: true }
export type ParserResult<T> = ParserSuccess<T> | ParserFailure
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ParsedType<T> =  T extends ParserFor<infer X> ? X : string
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ParserFor<O, I = any> = {
    readonly parse: (a: I) => ParserResult<O>
    readonly map: <U>(f: (t: O) => U) => ParserFor<U, I>
    readonly subflatMap: <U>(f: (t: O) => ParserResult<U>) => ParserFor<U, I>
    readonly flatMap: <U>(f: (t: O) => ParserFor<U>) => ParserFor<U, I>
    readonly then: <U>(other: ParserFor<U, O>) => ParserFor<U, I>
    readonly optional: () => ParserFor<O | undefined, I>
    readonly required: () => ParserFor<Exclude<O, undefined | null>, I>
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


export const ParserResult = {
    isSuccess: <(<T>(pr: ParserResult<T>) => pr is ParserSuccess<T>)>(pr => !pr.__isError),
    try: <A>(f: () => A): ParserResult<A> => {
        // eslint-disable-next-line functional/no-try-statement
        try {
            const a = f()
            return ParserResult.valid(a)
        } catch (e) {
            const { message }: { readonly message: string } = e
            return ParserResult.invalid(cons({ reason: (message || e.toString()), originalValue: undefined }))
        }
    },
    when: (cond: boolean) => <A>(ifTrue: A, ifFalse: ParserError): ParserResult<A> => {
        return cond ? ParserResult.valid(ifTrue) : ParserResult.invalid(cons(ifFalse))
    },
    valid: <A>(a: A): ParserResult<A> => ({
        __isError: false,
        result: a
    }),
    invalid: <A>(errors: ParserErrors): ParserResult<A> => ({
        __isError: true,
        errors: errors
    }),
    map: <A>(pr: ParserResult<A>) => <B>(f: (a: A) => B): ParserResult<B> => ParserResult.match(pr)({
        valid: v => ParserResult.valid(f(v.result)),
        invalid: v => v
    }),
    product: <A>(pra: ParserResult<A>) => <B>(prb: ParserResult<B>): ParserResult<readonly [A, B]> => ParserResult.match(pra)({
        valid: a => ParserResult.match(prb)({
            valid: (b) => ParserResult.valid([a.result, b.result]),
            invalid: (e) => e
        }),
        invalid: e => ParserResult.match(prb)({
            valid: () => e,
            invalid: ee => ParserResult.invalid<readonly [A, B]>(concat(e.errors, ee.errors))
        })
    }),
    match: <A>(pr: ParserResult<A>) => <B>(matchers: {
        readonly valid: (a: ParserSuccess<A>) => B,
        readonly invalid: (pe: ParserFailure) => B
    }): B => ParserResult.isSuccess(pr) ? matchers.valid(pr) : matchers.invalid(pr)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const parserFor = <O, I = any>(f: (a: I) => ParserResult<O>): ParserFor<O, I> => Object.assign({}, { parse: f }, {
    map: <B>(fab: (a: O) => B): ParserFor<B, I> => parserFor<B, I>(u => ParserResult.map(f(u))(fab)),
    subflatMap: <B>(fb: (t: O) => ParserResult<B>) => parserFor<B, I>(u => ParserResult.match(f(u))({
        invalid: e => e,
        valid: v => fb(v.result)
    })),
    flatMap: <B>(fb: (t: O) => ParserFor<B>) => parserFor<B, I>(u => ParserResult.match(f(u))({
        invalid: e => e,
        valid: v => fb(v.result).parse(u)
    })),
    then: <B>(other: ParserFor<B, O>) => parserFor<B, I>(u => ParserResult.match(f(u))({
        invalid: e => e,
        valid: v => other.parse(v.result)
    })),
    or: <B>(other: ParserFor<B, I>) => parserFor<O | B, I>(u => ParserResult.match(f(u))({
        invalid: e => ParserResult.match(other.parse(u))({
            invalid: eo => ParserResult.invalid(concat(e.errors, eo.errors)),
            valid: vo => vo
        }),
        valid: v => v
    })),
    optional: (): ParserFor<O | undefined, I> => parserFor<O | undefined, I>(a => a ? f(a) : ParserResult.valid(undefined)),
    required: (): ParserFor<Exclude<O, undefined | null>, I> => parserFor<Exclude<O, undefined | null>, I>(a => a ? f(a) as ParserResult<Exclude<O, undefined | null>> : ParserResult.invalid<Exclude<O, undefined | null>>(cons({ reason: "Required value is empty", originalValue: undefined })))
})

export const Parsers = {
    from: parserFor,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    lit: <A, I = any>(a: A): ParserFor<A, I> => parserFor(() => ParserResult.valid(a)),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    failure: <A, I = any>(e: ParserError): ParserFor<A, I> => parserFor(() => ParserResult.invalid<A>(cons(e))),
    any: parserFor(a => a),
    string: parserFor<string>(a => ParserResult.when(typeof a === 'string' || a instanceof String)(a as string, { originalValue: a, reason: `Expected string. Got: ${a}` })),
    matches: (pattern: string | RegExp): ParserFor<string, string> => parserFor<string, string>(s => (new RegExp(pattern).test(s)) ? ParserResult.valid(s) : ParserResult.invalid(cons({ reason: `Expected value ${s} to match ${pattern}`, originalValue: s }))),
    toString: parserFor(a => ParserResult.valid(a.toString())),
    number: parserFor<number>(a => ParserResult.when(typeof a === 'number')(a as number, { originalValue: a, reason: `Expected number. Got: ${a}` })),
    parseInt: parserFor<number, string>(a => {
        const i = parseInt(a)
        return ParserResult.when(!isNaN(i))(i, { originalValue: a, reason: `Expected valid int. Got: ${a}` })
    }),
    parseFloat: parserFor<number, string>(a => {
        const i = parseFloat(a)
        return ParserResult.when(!isNaN(i))(i, { originalValue: a, reason: `Expected valid float. Got: ${a}` })
    }),
    bool: parserFor<boolean>(a => ParserResult.when(typeof a === 'boolean')(a as boolean, { originalValue: a, reason: `Expected boolean. Got: ${a}` })),
    array: <A>(pa: Factory<ParserFor<A>>): ParserFor<readonly A[]> => parserFor(u =>
        !Array.isArray(u) ?
            ParserResult.invalid(cons({ reason: `Expected an array, Got: ${u}`, originalValue: u })) :
            u.reduce((p, n) => ParserResult.map(ParserResult.product(p)(fromFactory(pa).parse(n)))(flatten), ParserResult.valid([] as readonly A[]))
    ),
    parseBool: parserFor<boolean, string>(a => {
        const i = a == "true" ? true : a == "false" ? false : undefined
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return ParserResult.when(i !== undefined)(i!, { originalValue: a, reason: `Expected valid bool. Got: ${a}` })
    }),
    parseDate: parserFor<Date, string>(a => {
        const i = Date.parse(a)
        return ParserResult.when(!isNaN(i))(new Date(i), { originalValue: a, reason: `Expected valid float. Got: ${a}` })
    }),
    for: <T>(parser: { readonly [k in keyof T]: (ParserFor<T[k]> | (() => ParserFor<T[k]>)) }): ParserFor<T> => parserFor(o => {
        type KeyValuePair = { readonly key: string, readonly value: T[keyof T] }
        const [head, ...tail] = Object.keys(parser)
        const results = tail.reduce<ParserResult<readonly KeyValuePair[]>>((p, n) => {
            const k = n as keyof T
            const next = ParserResult.map(fromFactory(parser[k]).parse(o[k]))(a => ({ key: n, value: a }))
            return ParserResult.map(ParserResult.product(p)(next))(t => flatten(t))
        }, ParserResult.map(fromFactory(parser[head as keyof T]).parse(o[head]))(a => ([{ key: head, value: a }])))

        return ParserResult.map(results)((r) => r.reduce((p, n) => Object.assign({}, p, { [n.key]: n.value }), {} as T))
    })
}