interface Props {
  tick: number
}

export default function StatusStrip({ tick }: Props) {
  const time = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })

  return (
    <div className="glass-panel rounded-xl px-4 py-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* System status */}
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] text-gray-500 font-mono">SYS ONLINE</span>
          </div>

          {/* Memory usage */}
          <div className="flex items-center gap-1.5">
            <div className="w-8 h-1 bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-ember-500 rounded-full" style={{ width: '34%' }} />
            </div>
            <span className="text-[10px] text-gray-600 font-mono">MEM</span>
          </div>

          {/* Active sessions */}
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
            <span className="text-[10px] text-gray-600 font-mono">2 SESSIONS</span>
          </div>
        </div>

        {/* Clock */}
        <div className="text-[10px] text-gray-500 font-mono">
          {time}
        </div>
      </div>
    </div>
  )
}
