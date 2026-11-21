import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import { ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Cell } from 'recharts'
import { get } from '../api'
import { money } from '../helpers'
import { Loader, ErrorMsg, Img } from './Bits'

const RANGES = [4, 8, 12]
const GREEN = '#15803d'
const GREY = '#a3a3a3'
const GRID = '#eef0ee'
const AMBER = '#eda100'
const AMBER_TRACK = '#fbeccb'
const STATUS = [
  { key: 'placed', label: 'Placed', color: '#eda100', ink: '#1f1f1f' },
  { key: 'packed', label: 'Packed', color: '#2a78d6', ink: '#ffffff' },
  { key: 'out_for_delivery', label: 'Out for delivery', color: '#e87ba4', ink: '#1f1f1f' },
  { key: 'delivered', label: 'Delivered', color: '#008300', ink: '#ffffff' },
  { key: 'cancelled', label: 'Cancelled', color: '#e34948', ink: '#ffffff' },
]
const AXIS = { fontSize: 12, fill: '#6b7280' }

function compact(n) {
  if (n >= 1000000) return Math.round(n / 100000) / 10 + 'M'
  if (n >= 10000) return Math.round(n / 1000) + 'K'
  if (n >= 1000) return Math.round(n / 100) / 10 + 'K'
  return String(n)
}

function weeklabel(w, i, list) {
  return i === list.length - 1 ? 'This week' : dayjs(w.start).format('MMM D')
}

function Sparkline({ values }) {
  if (values.length < 2) return null
  const w = 72,
    h = 26,
    max = Math.max(...values, 1)
  const pts = values.map((v, i) => [(i / (values.length - 1)) * w, h - 3 - (v / max) * (h - 6)])
  const last = pts[pts.length - 1]
  return (
    <svg width={w} height={h} className="overflow-visible" aria-hidden="true">
      <polyline
        points={pts.map((p) => p.join(',')).join(' ')}
        fill="none"
        stroke={GREY}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx={last[0]} cy={last[1]} r="3.5" fill={GREEN} stroke="#fff" strokeWidth="2" />
    </svg>
  )
}

function Delta({ now, prev, weeks }) {
  if (!prev) return <p className="text-xs text-gray-500 mt-1">Nothing in the {weeks} weeks before</p>
  const change = Math.round(((now - prev) / prev) * 100)
  const up = change >= 0
  return (
    <p className={'text-xs mt-1 font-medium ' + (up ? 'text-green-700' : 'text-red-600')}>
      <span aria-hidden="true">{up ? '▲' : '▼'}</span> {Math.abs(change)}%{' '}
      <span className="text-gray-500 font-normal">vs previous {weeks} weeks</span>
    </p>
  )
}

export function Tile({ label, value, trend, children }) {
  return (
    <div className="card p-4 flex flex-col">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-gray-500 whitespace-nowrap">{label}</p>
        {trend && <Sparkline values={trend} />}
      </div>
      <p className="text-2xl font-semibold mt-1 text-gray-900">{value}</p>
      {children}
    </div>
  )
}

export function Card({ title, sub, children, className = '' }) {
  return (
    <section className={'card p-5 ' + className}>
      <h3 className="font-semibold text-gray-900">{title}</h3>
      {sub && <p className="muted mb-4">{sub}</p>}
      {children}
    </section>
  )
}

export function NumbersTable({ head, rows }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="mt-4 border-t border-gray-100 pt-3">
      <button type="button" className="text-sm link" onClick={() => setOpen(!open)} aria-expanded={open}>
        {open ? 'Hide numbers' : 'Show numbers'}
      </button>
      {open && (
        <table className="w-full text-sm mt-2 tabular-nums">
          <thead className="text-gray-500 text-left">
            <tr>
              {head.map((h, i) => (
                <th key={i} className={'py-1 font-medium ' + (i > 0 ? 'text-right' : '')}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-gray-100">
                {r.map((c, j) => (
                  <td key={j} className={'py-1 ' + (j > 0 ? 'text-right' : '')}>
                    {c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

function TrendTooltip({ active, payload, weeks }) {
  if (!active || !payload || !payload.length) return null
  const row = payload[0].payload
  return (
    <div className="bg-white border border-gray-200 shadow-lg rounded-lg px-3 py-2 text-xs min-w-44">
      <p className="text-gray-500 mb-1.5">
        {row.label === 'This week' ? 'This week so far' : 'Week of ' + dayjs(row.start).format('MMM D')}
      </p>
      <p className="flex items-center gap-2">
        <span className="w-3 h-0.5 rounded" style={{ background: GREEN }}></span>
        <b className="text-sm text-gray-900">{money(row.sales)}</b>
        <span className="text-gray-500">{row.orders} orders</span>
      </p>
      <p className="flex items-center gap-2 mt-1">
        <span className="w-3 h-0.5 rounded" style={{ background: GREY }}></span>
        <b className="text-sm text-gray-700">{money(row.prevSales)}</b>
        <span className="text-gray-500">{weeks} weeks earlier</span>
      </p>
    </div>
  )
}

function SalesTrend({ weekly, weeks }) {
  const data = weekly.map((w, i) => ({ ...w, label: weeklabel(w, i, weekly) }))
  return (
    <div>
      <ul className="flex flex-wrap gap-4 text-sm text-gray-600 mb-2">
        <li className="flex items-center gap-2">
          <span className="w-4 h-0.5 rounded" style={{ background: GREEN }}></span>This period
        </li>
        <li className="flex items-center gap-2">
          <span className="w-4 h-0.5 rounded" style={{ background: GREY }}></span>Previous {weeks} weeks
        </li>
      </ul>
      <div
        className="h-64"
        role="img"
        aria-label={
          'Weekly sales for the last ' + weeks + ' weeks compared with the ' + weeks + ' weeks before'
        }
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="salesWash" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={GREEN} stopOpacity={0.16} />
                <stop offset="100%" stopColor={GREEN} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke={GRID} />
            <XAxis
              dataKey="label"
              tick={AXIS}
              tickLine={false}
              axisLine={{ stroke: '#d1d5db' }}
              interval="preserveStartEnd"
              minTickGap={16}
            />
            <YAxis tick={AXIS} tickLine={false} axisLine={false} tickFormatter={compact} width={44} />
            <Tooltip
              content={<TrendTooltip weeks={weeks} />}
              cursor={{ stroke: '#9ca3af', strokeWidth: 1 }}
            />
            <Line
              type="monotone"
              dataKey="prevSales"
              stroke={GREY}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: GREY, stroke: '#fff', strokeWidth: 2 }}
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="sales"
              stroke={GREEN}
              strokeWidth={2}
              fill="url(#salesWash)"
              dot={false}
              activeDot={{ r: 5, fill: GREEN, stroke: '#fff', strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function TopProducts({ list }) {
  if (list.length === 0) return <p className="muted py-6 text-center">No sales in this range yet.</p>
  const max = list[0].sales
  return (
    <ol className="flex flex-col gap-3.5">
      {list.map((p, i) => (
        <li key={p.product} className="flex items-center gap-3">
          <Img src={p.image} alt="" className="w-11 h-11 rounded-lg shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex justify-between gap-2 text-sm">
              <span className="font-medium text-gray-800 truncate">
                <span className="text-gray-400 mr-1">{i + 1}.</span>
                {p.name}
              </span>
              <span className="font-semibold text-gray-900 tabular-nums">{money(p.sales)}</span>
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="flex-1 h-2 rounded-full bg-gray-100">
                <div
                  className="h-2 rounded-full"
                  style={{ width: Math.max(3, (p.sales / max) * 100) + '%', background: GREEN }}
                ></div>
              </div>
              <span className="text-xs text-gray-500 w-16 text-right">
                {p.qty} {p.unit}
              </span>
            </div>
          </div>
        </li>
      ))}
    </ol>
  )
}

function DayTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-white border border-gray-200 shadow-lg rounded-lg px-3 py-2 text-xs">
      <p className="text-sm font-semibold text-gray-900">
        {d.orders} order{d.orders === 1 ? '' : 's'}
      </p>
      <p className="text-gray-500">
        {d.day} &middot; {money(d.sales)}
      </p>
    </div>
  )
}

function BusiestDays({ days }) {
  const most = Math.max(...days.map((d) => d.orders))
  if (!most) return <p className="muted py-6 text-center">No orders in this range yet.</p>
  const busiest = days.filter((d) => d.orders === most).map((d) => d.day)
  const names =
    busiest.length > 1 ? busiest.slice(0, -1).join(', ') + ' and ' + busiest[busiest.length - 1] : busiest[0]
  return (
    <div>
      <p className="text-sm text-gray-600 mb-2">
        <b className="text-gray-900">{names}</b> {busiest.length > 1 ? 'tie for' : 'gets'} the most orders (
        {most})
      </p>
      <div className="h-40" role="img" aria-label={days.map((d) => d.day + ' ' + d.orders).join(', ')}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={days} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
            <XAxis dataKey="day" tick={AXIS} tickLine={false} axisLine={{ stroke: '#d1d5db' }} />
            <YAxis hide allowDecimals={false} />
            <Tooltip content={<DayTooltip />} cursor={{ fill: '#f3f4f6' }} />
            <Bar dataKey="orders" radius={[4, 4, 0, 0]} maxBarSize={24} isAnimationActive={false}>
              {days.map((d) => (
                <Cell key={d.day} fill={d.orders === most ? GREEN : '#d4d4d4'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function RatingBreakdown({ ratings, average, count }) {
  if (!count) return <p className="muted py-6 text-center">No reviews yet.</p>
  const max = Math.max(...[5, 4, 3, 2, 1].map((n) => ratings[n]))
  return (
    <div>
      <p className="mb-3">
        <span className="text-3xl font-semibold text-gray-900">{average.toFixed(1)}</span>{' '}
        <span className="text-gray-500 text-sm">
          out of 5 &middot; {count} review{count === 1 ? '' : 's'}
        </span>
      </p>
      <ul className="flex flex-col gap-2">
        {[5, 4, 3, 2, 1].map((n) => (
          <li key={n} className="flex items-center gap-2 text-sm" aria-label={n + ' stars: ' + ratings[n]}>
            <span className="w-8 text-gray-600 tabular-nums">{n} ★</span>
            <div className="flex-1 h-2 rounded-full" style={{ background: AMBER_TRACK }}>
              <div
                className="h-2 rounded-full"
                style={{ width: (max ? (ratings[n] / max) * 100 : 0) + '%', background: AMBER }}
              ></div>
            </div>
            <span className="w-6 text-right text-gray-600 tabular-nums">{ratings[n]}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function StatusBar({ counts }) {
  const [hover, setHover] = useState(null)
  let total = 0
  for (let i = 0; i < STATUS.length; i++) {
    total += counts[STATUS[i].key]
  }
  if (total === 0) return <p className="muted py-6 text-center">No orders in this range yet.</p>
  const parts = STATUS.filter((s) => counts[s.key] > 0)
  return (
    <div>
      <p className="mb-3">
        <span className="text-3xl font-semibold text-gray-900">{total}</span>{' '}
        <span className="text-gray-500 text-sm">orders placed</span>
      </p>
      <div
        className="flex gap-0.5 h-7"
        role="img"
        aria-label={parts.map((s) => s.label + ' ' + counts[s.key]).join(', ')}
      >
        {parts.map((s) => {
          const share = Math.round((counts[s.key] / total) * 100)
          return (
            <div
              key={s.key}
              className="relative h-full rounded flex items-center px-1.5 text-xs font-semibold"
              tabIndex={0}
              style={{
                flexGrow: counts[s.key],
                flexBasis: 0,
                background: s.color,
                color: s.ink,
                opacity: hover === null || hover === s.key ? 1 : 0.5,
              }}
              onPointerEnter={() => setHover(s.key)}
              onPointerLeave={() => setHover(null)}
              onFocus={() => setHover(s.key)}
              onBlur={() => setHover(null)}
              aria-label={s.label + ': ' + counts[s.key] + ' orders, ' + share + '%'}
            >
              {share >= 12 && <span>{share}%</span>}
              {hover === s.key && (
                <div className="absolute z-10 bottom-full mb-1 left-0 whitespace-nowrap bg-white border border-gray-200 shadow-lg rounded-lg px-3 py-2 text-xs text-gray-500 font-normal pointer-events-none">
                  <p className="text-sm font-semibold text-gray-900">
                    {counts[s.key]} orders &middot; {share}%
                  </p>
                  <p>{s.label}</p>
                </div>
              )}
            </div>
          )
        })}
      </div>
      <ul className="flex flex-col gap-1.5 mt-4 text-sm text-gray-600">
        {parts.map((s) => (
          <li key={s.key} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: s.color }}></span>
            <span className="flex-1">{s.label}</span>
            <span className="text-gray-900 tabular-nums">{counts[s.key]}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function SalesOverview() {
  const [weeks, setWeeks] = useState(8)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(()=>{
    let live = true
    get('/orders/stats?weeks=' + weeks)
      .then((d) => {
        if (live) {
          setData(d)
          setError('')
        }
      })
      .catch((e) => {
        if (live) setError(e.message)
      })
      .finally(() => {
        if (live) setLoading(false)
      })
    return () => {
      live = false
    }
  }, [weeks])

  function pickrange(r) {
    if (r === weeks) return
    setLoading(true)
    setWeeks(r)
  }

  if (!data && loading) return <Loader />
  if (!data && error) return <ErrorMsg message={error} />
  const k = data.kpis
  const weeklySales = data.weekly.map((w) => w.sales)
  const weeklyOrders = data.weekly.map((w) => w.orders)
  const weeklyAvg = data.weekly.map((w) => (w.orders ? w.sales / w.orders : 0))

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-4" role="group" aria-label="Date range">
        <span className="text-sm text-gray-500 mr-1">Showing</span>
        {RANGES.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => pickrange(r)}
            aria-pressed={weeks === r}
            className={
              'text-sm px-3 py-1.5 rounded-full border cursor-pointer ' +
              (weeks === r
                ? 'bg-green-700 border-green-700 text-white'
                : 'bg-white border-gray-300 text-gray-700 hover:border-green-600')
            }
          >
            Last {r} weeks
          </button>
        ))}
        {error && <span className="err mb-0 ml-2">{error}</span>}
      </div>

      <div className={'transition-opacity ' + (loading ? 'opacity-50' : '')}>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
          <Tile label="Sales" value={money(k.sales)} trend={weeklySales}>
            <Delta now={k.sales} prev={k.salesPrev} weeks={data.weeks} />
          </Tile>
          <Tile label="Orders" value={k.orders.toLocaleString()} trend={weeklyOrders}>
            <Delta now={k.orders} prev={k.ordersPrev} weeks={data.weeks} />
          </Tile>
          <Tile label="Average order" value={money(k.avgOrder)} trend={weeklyAvg}>
            <Delta now={k.avgOrder} prev={k.avgOrderPrev} weeks={data.weeks} />
          </Tile>
          <Tile label="Items sold" value={k.items.toLocaleString()}>
            <p className="text-xs text-gray-500 mt-1">kg, bunches, dozens and pieces</p>
          </Tile>
          <Tile label="Followers" value={k.followers.toLocaleString()}>
            <p className="text-xs text-gray-500 mt-1">
              {k.toPack > 0
                ? k.toPack + ' order' + (k.toPack === 1 ? '' : 's') + ' waiting to be packed'
                : 'Nothing waiting to be packed'}
            </p>
          </Tile>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card
            title="Sales trend"
            sub="Rupees per week from orders placed, cancelled orders left out"
            className="lg:col-span-2"
          >
            <SalesTrend weekly={data.weekly} weeks={data.weeks} />
            <NumbersTable
              head={['Week of', 'Orders', 'Sales', data.weeks + ' weeks earlier']}
              rows={data.weekly.map((w) => [
                dayjs(w.start).format('MMM D, YYYY'),
                w.orders,
                money(w.sales),
                money(w.prevSales),
              ])}
            />
          </Card>

          <Card title="Top products" sub={'By sales in the last ' + data.weeks + ' weeks'}>
            <TopProducts list={data.topProducts} />
            {data.topProducts.length > 0 && (
              <NumbersTable
                head={['Product', 'Sold', 'Sales']}
                rows={data.topProducts.map((p) => [p.name, p.qty + ' ' + p.unit, money(p.sales)])}
              />
            )}
          </Card>

          <Card title="Busiest days" sub="Orders by day of the week">
            <BusiestDays days={data.weekdays} />
            <NumbersTable
              head={['Day', 'Orders', 'Sales']}
              rows={data.weekdays.map((d) => [d.day, d.orders, money(d.sales)])}
            />
          </Card>

          <Card title="Ratings" sub="All reviews of your products">
            <RatingBreakdown ratings={data.ratings} average={k.rating} count={k.reviewCount} />
          </Card>

          <Card
            title="Where your orders are"
            sub={'Orders from the last ' + data.weeks + ' weeks by current status'}
          >
            <StatusBar counts={data.statusCounts} />
          </Card>
        </div>
      </div>
    </div>
  )
}

export default SalesOverview
