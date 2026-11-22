import dayjs from 'dayjs'
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { money } from '../helpers'
import { Tile, Card, NumbersTable, StatusBar } from './SalesOverview'

const GREEN = '#15803d'
const AXIS = { fontSize: 12, fill: '#6b7280' }

function compact(n) {
  if (n >= 10000) return Math.round(n / 1000) + 'K'
  if (n >= 1000) return Math.round(n / 100) / 10 + 'K'
  return String(n)
}

function SalesTip({ active, payload }) {
  if (!active || !payload || !payload.length) return null
  const w = payload[0].payload
  return (
    <div className="bg-white border border-gray-200 shadow-lg rounded-lg px-3 py-2 text-xs">
      <p className="text-gray-500 mb-1">
        {w.label === 'This week' ? 'This week so far' : 'Week of ' + dayjs(w.start).format('MMM D')}
      </p>
      <p className="text-sm font-semibold text-gray-900">{money(w.sales)}</p>
      <p className="text-gray-500">
        {w.orders} orders &middot; {w.signups} new accounts
      </p>
    </div>
  )
}

function SignupTip({ active, payload }) {
  if (!active || !payload || !payload.length) return null
  const w = payload[0].payload
  return (
    <div className="bg-white border border-gray-200 shadow-lg rounded-lg px-3 py-2 text-xs">
      <p className="text-sm font-semibold text-gray-900">
        {w.signups} new account{w.signups === 1 ? '' : 's'}
      </p>
      <p className="text-gray-500">
        {w.label === 'This week' ? 'This week so far' : 'Week of ' + dayjs(w.start).format('MMM D')}
      </p>
    </div>
  )
}

function AdminOverview({ stats, onPending }) {
  const k = stats.kpis
  const data = stats.weekly.map((w, i) => ({
    ...w,
    label: i === stats.weekly.length - 1 ? 'This week' : dayjs(w.start).format('MMM D'),
  }))
  const maxFarm = stats.topFarms.length ? stats.topFarms[0].sales : 1

  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
        <Tile label="Sales, 12 weeks" value={money(k.sales)} trend={stats.weekly.map((w) => w.sales)}>
          <p className="text-xs text-gray-500 mt-1">{k.orders} orders, cancelled left out</p>
        </Tile>
        <Tile label="Accounts" value={k.users} trend={stats.weekly.map((w) => w.signups)}>
          <p className="text-xs text-gray-500 mt-1">
            {k.roles.customer} customers &middot; {k.roles.farmer} farmers &middot; {k.roles.rider} riders
          </p>
        </Tile>
        <Tile label="Farms waiting" value={k.pendingFarms}>
          {k.pendingFarms > 0 ? (
            <button type="button" className="text-xs link mt-1 text-left" onClick={onPending}>
              Review them
            </button>
          ) : (
            <p className="text-xs text-gray-500 mt-1">All farms checked</p>
          )}
        </Tile>
        <Tile label="Live products" value={k.liveProducts}>
          <p className="text-xs text-gray-500 mt-1">{k.hiddenProducts} hidden by an admin</p>
        </Tile>
        <Tile label="Blocked accounts" value={k.blocked}>
          <p className="text-xs text-gray-500 mt-1">Cannot log in or sell</p>
        </Tile>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card title="Sales across all farms" sub="Rupees per week, last 12 weeks" className="lg:col-span-2">
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="adminWash" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={GREEN} stopOpacity={0.16} />
                    <stop offset="100%" stopColor={GREEN} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#eef0ee" />
                <XAxis
                  dataKey="label"
                  tick={AXIS}
                  tickLine={false}
                  axisLine={{ stroke: '#d1d5db' }}
                  interval="preserveStartEnd"
                  minTickGap={16}
                />
                <YAxis tick={AXIS} tickLine={false} axisLine={false} tickFormatter={compact} width={44} />
                <Tooltip content={<SalesTip />} cursor={{ stroke: '#9ca3af', strokeWidth: 1 }} />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke={GREEN}
                  strokeWidth={2}
                  fill="url(#adminWash)"
                  activeDot={{ r: 5, fill: GREEN, stroke: '#fff', strokeWidth: 2 }}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <NumbersTable
            head={['Week of', 'Orders', 'Sales', 'New accounts']}
            rows={stats.weekly.map((w) => [
              dayjs(w.start).format('MMM D, YYYY'),
              w.orders,
              money(w.sales),
              w.signups,
            ])}
          />
        </Card>

        <Card title="Top farms" sub="By sales in the last 12 weeks">
          {stats.topFarms.length === 0 && <p className="muted py-6 text-center">No sales yet.</p>}
          <ol className="flex flex-col gap-3">
            {stats.topFarms.map((f, i) => (
              <li key={f.farmer}>
                <div className="flex justify-between text-sm gap-2">
                  <span className="font-medium text-gray-800 truncate">
                    <span className="text-gray-400 mr-1">{i + 1}.</span>
                    {f.farmName}
                  </span>
                  <span className="font-semibold text-gray-900 tabular-nums">{money(f.sales)}</span>
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="flex-1 h-2 rounded-full bg-gray-100">
                    <div
                      className="h-2 rounded-full"
                      style={{ width: Math.max(3, (f.sales / maxFarm) * 100) + '%', background: GREEN }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500 w-16 text-right">{f.orders} orders</span>
                </div>
              </li>
            ))}
          </ol>
        </Card>

        <Card title="New accounts" sub="Sign ups per week">
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                <XAxis
                  dataKey="label"
                  tick={AXIS}
                  tickLine={false}
                  axisLine={{ stroke: '#d1d5db' }}
                  interval="preserveStartEnd"
                  minTickGap={24}
                />
                <YAxis hide allowDecimals={false} />
                <Tooltip content={<SignupTip />} cursor={{ fill: '#f3f4f6' }} />
                <Bar
                  dataKey="signups"
                  fill={GREEN}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={20}
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Where orders are" sub="All orders from the last 12 weeks" className="lg:col-span-2">
          <StatusBar counts={stats.statusCounts} />
        </Card>
      </div>
    </div>
  )
}

export default AdminOverview
