import Decimal from "decimal.js";

export function toDecimalsAmount(amount: number | string, decimals: number | string): number {
    const mul = decimalsMultiplier(d(decimals))

    return Number(d(amount).mul(mul))
}

export function fromDecimalsAmount(amount: number | string, decimals: number | string): number {
    const mul = decimalsMultiplier(d(decimals))

    return Number(d(amount).div(mul))
}

function d(value?: Decimal.Value): Decimal.Instance {
    if (Decimal.isDecimal(value)) {
        return value as Decimal
    }

    return new Decimal(value === undefined ? 0 : value)
}

function decimalsMultiplier(decimals?: Decimal.Value): Decimal.Instance {
    return d(10).pow(d(decimals).abs())
}