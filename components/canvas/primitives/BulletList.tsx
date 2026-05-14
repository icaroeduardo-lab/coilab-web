interface BulletListProps {
  items: string[]
}

export function BulletList({ items }: BulletListProps) {
  return (
    <div className="flex flex-col gap-2">
      {items.map((item, i) => (
        <div key={i} className="flex gap-2.5 items-start">
          <span
            className="shrink-0 rounded-full mt-[7px]"
            style={{ width: 6, height: 6, backgroundColor: "var(--canvas-primary)" }}
          />
          <span className="text-[13.5px] leading-relaxed text-slate-900">{item}</span>
        </div>
      ))}
    </div>
  )
}
