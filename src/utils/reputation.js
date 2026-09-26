export function formatReputation(score) {
    return (Number(score ?? 6000) / 100).toFixed(2)
}
