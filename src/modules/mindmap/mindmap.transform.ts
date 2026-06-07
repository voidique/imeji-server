import type { Concept } from '@/db/schema'

export type ConceptNode = Concept & { children: ConceptNode[] }

export function buildTree(concepts: Concept[]): ConceptNode[] {
  const byId = new Map<string, ConceptNode>()
  for (const c of concepts) byId.set(c.id, { ...c, children: [] })

  const roots: ConceptNode[] = []
  for (const node of byId.values()) {
    const parent = node.parentId ? byId.get(node.parentId) : undefined
    if (parent) parent.children.push(node)
    else roots.push(node)
  }

  const sort = (nodes: ConceptNode[]) => {
    nodes.sort((a, b) => a.position - b.position)
    for (const n of nodes) sort(n.children)
  }
  sort(roots)
  return roots
}

export function toMarkdown(title: string, tree: ConceptNode[]): string {
  const lines = [`# ${title}`, '']
  const walk = (nodes: ConceptNode[], depth: number) => {
    for (const n of nodes) {
      const pad = '  '.repeat(depth)
      lines.push(`${pad}- ${n.label}`)
      if (n.detail) lines.push(`${pad}  - ${n.detail}`)
      walk(n.children, depth + 1)
    }
  }
  walk(tree, 0)
  return lines.join('\n')
}

export function toGraph(concepts: Concept[]) {
  return {
    nodes: concepts.map((c) => ({ id: c.id, name: c.label, group: c.mastery })),
    links: concepts
      .filter((c) => c.parentId)
      .map((c) => ({ source: c.parentId as string, target: c.id })),
  }
}
