export type NonEmptyList<T> = { readonly head: T, readonly tail: readonly T[] }
export type ParserError = { readonly originalValue: unknown, readonly reason: string }
type Functor<A> = { readonly map: <B>(f: (a: A) => B) => Functor<B> }
type Zip<A> = Functor<A> & { readonly product: <B>(f: Zip<B>) => Zip<readonly [A, B]> }
export type ParserErrors = NonEmptyList<ParserError>
export type ParserSuccess<T> = { readonly result: T, readonly __isError: false } & Zip<T>
export type ParserFailure<T> = { readonly errors: ParserErrors, readonly __isError: true } & Zip<T>
export type ParserResult<T> = ParserSuccess<T> | ParserFailure<T>
type IsOptionalParser<T, B extends boolean> = B extends true ? ParserFor<T | undefined> : ParserFor<Exclude<T, null | undefined>>

type ParserFor<O, I = unknown> = {
    readonly parse: (a: I) => ParserResult<O>
    readonly map: <U>(f: (t: O) => U) => ParserFor<U, I>
    readonly subflatMap: <U>(f: (t: O) => ParserResult<U>) => ParserFor<U, I>
    readonly compose: <U>(other: ParserFor<U, O>) => ParserFor<U, I>
    readonly optional: <B extends boolean>(isOptional: B) => IsOptionalParser<O, B>
}

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
        return cond ? ParserResult.valid(ifTrue) : ParserResult.invalid({head: ifFalse, tail:[]})
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
            invalid: e => ParserResult.invalid({ head: errors.head, tail: errors.tail.concat(e.errors.head, ...e.errors.tail) })
        })
    }),
    match: <A, B>(pr: ParserResult<A>) => (matchers: {
        readonly valid: (a: ParserSuccess<A>) => B,
        readonly invalid: (pe: ParserFailure<A>) => B
    }): B => ParserResult.isSuccess(pr) ? matchers.valid(pr) : matchers.invalid(pr)
}

export const Parser = {
    for: <O, I = unknown>(f: (a: I) => ParserResult<O>): ParserFor<O, I> => Object.assign({}, { parse: f }, {
        map: <B>(fab: (a: O) => B): ParserFor<B> => Parser.for<B, I>(u => f(u).map(fab) as ParserResult<B>),
        subflatMap: <B>(fb: (t: O) => ParserResult<B>) => Parser.for<B, I>(u => ParserResult.match<O, ParserResult<B>>(f(u))({
            invalid: e => e as unknown as ParserFailure<B>,
            valid: v => fb(v.result)
        })),
        compose: <B>(other: ParserFor<B, O>) => Parser.for<B, I>(u => ParserResult.match<O, ParserResult<B>>(f(u))({
            invalid: e => e as unknown as ParserFailure<B>,
            valid: v => other.parse(v.result)
        })),
        optional: <B extends boolean>(b: B) => (b ? 
            Parser.for<O | undefined, I>(a => a ? 
                f(a) : 
                ParserResult.valid(undefined)) : 
            Parser.for<O, I>(a => !a ? ParserResult.invalid<Exclude<O, null | undefined>>({ head: { originalValue: undefined, reason: "Mandatory value not present" }, tail: [] }) : f(a))) as IsOptionalParser<O, B>
    })
}

export const Parsers = {
    string: Parser.for<string>(a => ParserResult.when(typeof a === 'string' || a instanceof String)(a as string, { originalValue: a, reason: `Expected string. Got: ${a}`})),
    toString: Parser.for(a => ParserResult.valid(a.toString())),
    number: Parser.for<number>(a => ParserResult.when(typeof a === 'number')(a as number, { originalValue: a, reason: `Expected number. Got: ${a}`})),
    parseInt: Parser.for<number, string>(a => {
        const i = parseInt(a)
        return ParserResult.when(!isNaN(i))(i, { originalValue: a, reason: `Expected valid int. Got: ${a}` })
    }),
    parseFloat: Parser.for<number, string>(a => {
        const i = parseFloat(a)
        return ParserResult.when(!isNaN(i))(i, { originalValue: a, reason: `Expected valid float. Got: ${a}` })
    }),
    bool: Parser.for<boolean>(a => ParserResult.when(typeof a === 'boolean')(a as boolean, { originalValue: a, reason: `Expected boolean. Got: ${a}`})),
    parseBool: Parser.for<boolean, string>(a => {
        const i = a == "true" ? true : a == "false" ? false : undefined
        return ParserResult.when(i !== undefined)(i, { originalValue: a, reason: `Expected valid bool. Got: ${a}` })
    }),
    for: <T>(parser: { readonly [k in keyof T]: ParserFor<T[k]> }): ParserFor<T, unknown> => Parser.for(o => {
        const [head, ...tail] = Object.keys(parser)
        const results = tail.reduce((p, n) => {
            const k = n as keyof T
            return p.product(parser[k].parse(o[k]).map(a => ({key: n, value: a})) as ParserResult<unknown>) as ParserResult<unknown>
        } , parser[head as keyof T].parse(o[head]).map(a => ({key: head, value: a})) as ParserResult<unknown>)

        // eslint-disable-next-line prefer-spread,functional/prefer-readonly-type
        return results.map((r: { key: string, value: unknown}[]) => [].concat.apply([], r).reduce((p, n) => Object.assign({}, p, {[n.key]: n.value}), {})) as ParserResult<T>
    })
}