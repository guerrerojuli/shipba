export function Edit(
    { suggestion }: { suggestion: { index: number, line: string }[] }
) {
    console.log(suggestion)
    return (
        <div>
            {suggestion.map((item) => (
                <div key={item.index} style={{ marginBottom: '1rem' }}>
                    <strong>Line {item.index}:</strong> {item.line}
                </div>
            ))}
        </div>
    )
}