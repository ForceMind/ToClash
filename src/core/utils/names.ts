/** Stable, non-mutating allocation; never collide with an already allocated name. */
export function uniqueNodeNames<T extends { name: string }>(nodes: T[], reserved: readonly string[] = []): T[] {
  const used = new Set(reserved)
  return nodes.map((node) => {
    const original = node.name
    let name = original
    let suffix = 2
    while (used.has(name)) name = `${original} ${suffix++}`
    used.add(name)
    return { ...node, name }
  })
}
