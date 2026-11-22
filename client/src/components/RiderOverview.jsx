import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import { ResponsiveContainer, ComposedChart, Area, Line, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { get } from '../api'
import { money } from '../helpers'
import { Loader, ErrorMsg } from './Bits'
import { Tile, Card, NumbersTable } from './SalesOverview'

const RANGES = [4, 8, 12]
const GREEN = '#15803d'
const GREY = '#a3a3a3'
const AXIS = { fontSize: 12, fill: '#6b7280' }

function compact(n) {
  if (n >= 10000) return Math.round(n / 1000) + 'K'
  if (n >= 1000) return Math.round(n / 100) / 10 + 'K'
  return String(n)
}

function Delta({ now, prev, weeks }) {
  if (!prev) return <p className="text-xs text-gray-500 mt-1">Nothing in the {weeks} weeks before</p>
  const change = Math.round(((now - prev) / prev) * 100)
  const up = change >= 0
  return (
    <p className={'text-xs mt-1 font-medium ' + (up ? 'text-green-700' : 'text-red-600')}>
      <span>{up ? '▲' : '▼'}</span> {Math.abs(change)}%{' '}
      <span className="text-gray-500 font-normal">vs previous {weeks} weeks</span>
    </p>
  )
}

function EarnTip({ active, payload, weeks }) {
  if (!active || !payload || !payload.length) return null
  const w = payload[0].payload
  return (
    <div className="bg-white border border-gray-200 shadow-lg rounded-lg px-3 py-2 text-xs min-w-44">
      <p className="text-gray-500 mb-1.5">
        {w.label === 'This week' ? 'This week so far' : 'Week of ' + dayjs(w.start).format('MMM D')}
      </p>
      <p className="flex items-center gap-2">
        <span className="w-3 h-0.5 rounded" style={{ background: GREEN }}></span>
        <b className="text-sm text-gray-900">{money(w.earned)}</b>
        <span className="text-gray-500">
          {w.deliveries} deliveries &middot; {w.km.toLocaleString()} km
        </span>
      </p>
      <p className="flex items-center gap-2 mt-1">
        <span className="w-3 h-0.5 rounded" style={{ background: GREY }}></span>
        <b className="text-sm text-gray-700">{money(w.prevEarned)}</b>
        <span className="text-gray-500">{weeks} weeks earlier</span>
      </p>
    </div>
  )
}

function DayTip({ active, payload }) {
  if (!active || !payload || !payload.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-white border border-gray-200 shadow-lg rounded-lg px-3 py-2 text-xs">
      <p className="text-sm font-semibold text-gray-900">{d.deliveries} deliveries</p>
      <p className="text-gray-500">
        {d.day} &middot; {money(d.earned)}
      </p>
    </div>
  )
}

function RiderOverview({ onGoAvailable }) {
  const [weeks, setWeeks] = useState(8)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(()=>{
    let live = true
    get('/orders/rider-stats?weeks=' + weeks)
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

  function pick(r) {
    if (r === weeks) return
    setLoading(true)
    setWeeks(r)
  }

  if (!data && loading) return <Loader />
  if (!data && error) return <ErrorMsg message={error} />
  const k = data.kpis
  let roadtime = '-'
  if (k.avgMinutes !== null) {
    roadtime = k.avgMinutes + ' min'
    if (k.avgMinutes >= 90) roadtime = Math.round(k.avgMinutes / 6) / 10 + ' h'
  }
  const chart = data.weekly.map((w, i) => ({
    ...w,
    label: i === data.weekly.length - 1 ? 'This week' : dayjs(w.start).format('MMM D'),
  }))
  const most = Math.max(...data.weekdays.map((d) => d.deliveries))
  const busiest = data.weekdays.filter((d) => d.deliveries === most && most > 0).map((d) => d.day)
  const maxFarm = data.topFarms.length ? data.topFarms[0].earned : 1

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-sm text-gray-500 mr-1">Showing</span>
        {RANGES.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => pick(r)}
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
        {(k.available > 0 || k.onTheWay > 0) && (
          <div className="card p-4 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-green-50 border-green-200">
            <p className="text-sm text-green-900">
              {k.onTheWay > 0 && (
                <>
                  <b>{money(k.pending)}</b> waiting on {k.onTheWay} order{k.onTheWay === 1 ? '' : 's'} you are
                  carrying.{' '}
                </>
              )}
              {k.available > 0 && (
                <>
                  <b>{money(k.availableEarnings)}</b> up for grabs in {k.available} packed order
                  {k.available === 1 ? '' : 's'}.
                </>
              )}
            </p>
            {k.available > 0 && (
              <button type="button" className="btn btn-sm" onClick={onGoAvailable}>
                See available orders
              </button>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
          <Tile label="Earned" value={money(k.earned)} trend={data.weekly.map((w) => w.earned)}>
            <Delta now={k.earned} prev={k.earnedPrev} weeks={data.weeks} />
          </Tile>
          <Tile label="Deliveries" value={k.deliveries} trend={data.weekly.map((w) => w.deliveries)}>
            <Delta now={k.deliveries} prev={k.deliveriesPrev} weeks={data.weeks} />
          </Tile>
          <Tile label="Per delivery" value={money(k.avgFee)}>
            <p className="text-xs text-gray-500 mt-1">Average pay</p>
          </Tile>
          <Tile label="Distance" value={k.km.toLocaleString() + ' km'} trend={data.weekly.map((w) => w.km)}>
            <p className="text-xs text-gray-500 mt-1">Estimated by road</p>
          </Tile>
          <Tile label="Time on the road" value={roadtime}>
            <p className="text-xs text-gray-500 mt-1">Pick up to drop off, average</p>
          </Tile>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card title="Earnings" sub="Rupees per week from delivered orders" className="lg:col-span-2">
            <ul className="flex flex-wrap gap-4 text-sm text-gray-600 mb-2">
              <li className="flex items-center gap-2">
                <span className="w-4 h-0.5 rounded" style={{ background: GREEN }}></span>This period
              </li>
              <li className="flex items-center gap-2">
                <span className="w-4 h-0.5 rounded" style={{ background: GREY }}></span>Previous {data.weeks}{' '}
                weeks
              </li>
            </ul>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chart} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="riderWash" x1="0" y1="0" x2="0" y2="1">
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
                  <Tooltip
                    content={<EarnTip weeks={data.weeks} />}
                    cursor={{ stroke: '#9ca3af', strokeWidth: 1 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="prevEarned"
                    stroke={GREY}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: GREY, stroke: '#fff', strokeWidth: 2 }}
                    isAnimationActive={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="earned"
                    stroke={GREEN}
                    strokeWidth={2}
                    fill="url(#riderWash)"
                    activeDot={{ r: 5, fill: GREEN, stroke: '#fff', strokeWidth: 2 }}
                    isAnimationActive={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <NumbersTable
              head={['Week of', 'Deliveries', 'Km', 'Earned', data.weeks + ' weeks earlier']}
              rows={data.weekly.map((w) => [
                dayjs(w.start).format('MMM D, YYYY'),
                w.deliveries,
                w.km.toLocaleString(),
                money(w.earned),
                money(w.prevEarned),
              ])}
            />
          </Card>

          <Card title="How pay works" sub="FarmDirect pays you for every delivery">
            <p className="text-3xl font-semibold text-gray-900">
              {money(data.rule.base)}{' '}
              <span className="text-base font-normal text-gray-500">+ {money(data.rule.perKm)} per km</span>
            </p>
            <ul className="text-sm text-gray-600 mt-3 flex flex-col gap-2">
              <li>Inside one city a trip counts as 5 km, so most deliveries pay about {money(180)}.</li>
              <li>Between cities the distance is estimated by road.</li>
              <li>One delivery pays at most {money(data.rule.max)}.</li>
              <li>The customer pays nothing extra, delivery stays free for them.</li>
            </ul>
          </Card>

          <Card title="Busiest days" sub="Deliveries by day of the week">
            {most === 0 ? (
              <p className="muted py-6 text-center">No deliveries in this range yet.</p>
            ) : (
              <>
                <p className="text-sm text-gray-600 mb-2">
                  <b className="text-gray-900">{busiest.join(' and ')}</b> {busiest.length > 1 ? 'are' : 'is'}{' '}
                  your busiest ({most})
                </p>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.weekdays} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                      <XAxis dataKey="day" tick={AXIS} tickLine={false} axisLine={{ stroke: '#d1d5db' }} />
                      <YAxis hide allowDecimals={false} />
                      <Tooltip content={<DayTip />} cursor={{ fill: '#f3f4f6' }} />
                      <Bar
                        dataKey="deliveries"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={24}
                        isAnimationActive={false}
                      >
                        {data.weekdays.map((d) => (
                          <Cell key={d.day} fill={d.deliveries === most ? GREEN : '#d4d4d4'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
            <NumbersTable
              head={['Day', 'Deliveries', 'Earned']}
              rows={data.weekdays.map((d) => [d.day, d.deliveries, money(d.earned)])}
            />
          </Card>

          <Card
            title="Where you pick up"
            sub={'Farms you delivered for in the last ' + data.weeks + ' weeks'}
            className="lg:col-span-2"
          >
            {data.topFarms.length === 0 && (
              <p className="muted py-6 text-center">No deliveries in this range yet.</p>
            )}
            <ol className="flex flex-col gap-3">
              {data.topFarms.map((f, i) => (
                <li key={f.farmer}>
                  <div className="flex justify-between text-sm gap-2">
                    <span className="font-medium text-gray-800 truncate">
                      <span className="text-gray-400 mr-1">{i + 1}.</span>
                      {f.farmName} <span className="text-gray-500 font-normal">&middot; {f.location}</span>
                    </span>
                    <span className="font-semibold text-gray-900 tabular-nums">{money(f.earned)}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex-1 h-2 rounded-full bg-gray-100">
                      <div
                        className="h-2 rounded-full"
                        style={{ width: Math.max(3, (f.earned / maxFarm) * 100) + '%', background: GREEN }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500 w-20 text-right">{f.deliveries} deliveries</span>
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default RiderOverview
