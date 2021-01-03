import { ParserErrors } from './../../../../core/src/lib/parsers';
import { ParserResult } from 'funkidation-core'
import { Applicative1 } from "fp-ts/lib/Applicative";
import { pipe } from 'fp-ts/lib/function';
import { Functor1 } from 'fp-ts/lib/Functor';
import { Either, left, right } from 'fp-ts/lib/Either'

export const URI = "ParserResult";

export type URI = typeof URI;

declare module "fp-ts/lib/HKT" {
    // eslint-disable-next-line functional/prefer-type-literal
    interface URItoKind<A> {
        // eslint-disable-next-line functional/prefer-readonly-type
        ParserResult: ParserResult<A>;
    }
}

export const toEither = <O>(pr: ParserResult<O>): Either<ParserErrors, O> => ParserResult.match(pr)({
    valid: v => right(v.result),
    invalid: i => left(i.errors)
})

// -------------------------------------------------------------------------------------
// non-pipeables
// -------------------------------------------------------------------------------------


const map_: Applicative1<URI>['map'] = (fa, f) => pipe(fa, map(f))
const ap_: Applicative1<URI>['ap'] = (fab, fa) => pipe(fab, ap(fa))
const of_: Applicative1<URI>['of'] = ParserResult.valid

// -------------------------------------------------------------------------------------
// pipeables
// -------------------------------------------------------------------------------------

export const map: <A, B>(f: (a: A) => B) => (fa: ParserResult<A>) => ParserResult<B> = (f) => (fa) =>
    ParserResult.map(fa)(f)


export const ap: <A>(fa: ParserResult<A>) => <B>(fab: ParserResult<(a: A) => B>) => ParserResult<B> = (fa) => (fab) =>
    ParserResult.map(ParserResult.product(fab)(fa))(r => r[0](r[1]))


export const of: Applicative1<URI>['of'] = of_

export const Functor: Functor1<URI> = {
    URI,
    map: map_
}

export const Applicative: Applicative1<URI> = {
    URI,
    map: map_,
    ap: ap_,
    of
}