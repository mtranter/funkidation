import { ParserFor, Parsers, ParserResult } from 'funkidation-core'
import { Applicative1 } from "fp-ts/lib/Applicative";
import { pipe } from 'fp-ts/lib/function';
import { Functor1 } from 'fp-ts/lib/Functor';
import { Monad1 } from 'fp-ts/lib/Monad';

export const URI = "ParserFor";

export type URI = typeof URI;

declare module "fp-ts/lib/HKT" {
    // eslint-disable-next-line functional/prefer-type-literal
    interface URItoKind<A> {
        // eslint-disable-next-line functional/prefer-readonly-type
        ParserFor: ParserFor<A>;
    }
}

// -------------------------------------------------------------------------------------
// non-pipeables
// -------------------------------------------------------------------------------------


const map_: Monad1<URI>['map'] = (fa, f) => pipe(fa, map(f))
const ap_: Monad1<URI>['ap'] = (fab, fa) => pipe(fab, ap(fa))
const of_: Monad1<URI>['of'] = Parsers.lit
const chain_: Monad1<URI>['chain'] = (fa, f) => pipe(fa, chain(f))

// -------------------------------------------------------------------------------------
// pipeables
// -------------------------------------------------------------------------------------

export const map: <A, B>(f: (a: A) => B) => (fa: ParserFor<A>) => ParserFor<B> = (f) => (fa) =>
    fa.map(f)


export const ap: <A>(fa: ParserFor<A>) => <B>(fab: ParserFor<(a: A) => B>) => ParserFor<B> = (fa) => (fab) => Parsers.from(u => {
    const ra = fa.parse(u)
    const rb = fab.parse(u)
    return ParserResult.map(ParserResult.product(ra)(rb))(t => t[1](t[0]))
})

export const chain: <A, B>(f: (a: A) => ParserFor<B>) => (ma: ParserFor<A>) => ParserFor<B> = (f) => (ma) => ma.flatMap(f)

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

export const Monad: Monad1<URI> = {
    URI,
    map: map_,
    ap: ap_,
    of,
    chain: chain_
}